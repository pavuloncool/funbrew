import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

export const AUTH_STORAGE_KEYS = {
  session: 'auth.session',
  sessionKey: 'auth.session.encryptionKey',
  sessionPayload: 'auth.session.encryptedPayload',
  sessionChunkCount: 'auth.session.chunkCount',
  sessionChunkPrefix: 'auth.session.chunk.',
  refreshToken: 'auth.refreshToken',
  biometricEnabled: 'auth.biometricEnabled',
} as const;

export interface SecureStorageService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clearAuthData(): Promise<void>;
}

type EncryptedSessionEnvelope = {
  version: 1;
  iv: string;
  ciphertext: string;
};

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'funcup.auth',
};

const LEGACY_SUPABASE_TOKEN_KEYS = ['access_token', 'refresh_token', 'user'];
const SECURE_STORE_CHUNK_CHAR_SIZE = 900;
const MAX_SESSION_CHUNKS = 40;

export class ExpoSecureStorageService implements SecureStorageService {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
  }

  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
  }

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
  }

  async clearAuthData(): Promise<void> {
    const chunkCount = await readChunkCount(this);
    const chunkRemovals = Array.from(
      { length: chunkCount > 0 ? chunkCount : MAX_SESSION_CHUNKS },
      (_, index) => this.remove(chunkKey(index))
    );

    await Promise.all([
      this.remove(AUTH_STORAGE_KEYS.session),
      this.remove(AUTH_STORAGE_KEYS.sessionKey),
      this.remove(AUTH_STORAGE_KEYS.sessionChunkCount),
      this.remove(AUTH_STORAGE_KEYS.refreshToken),
      this.remove(AUTH_STORAGE_KEYS.biometricEnabled),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload),
      ...chunkRemovals,
    ]);
  }
}

class EncryptedSessionStorage {
  private cryptoKeyPromise: Promise<CryptoKey> | null = null;
  private readonly canUseWebCrypto = isWebCryptoAvailable();

  constructor(private readonly secureStorage: SecureStorageService) {}

  async get(): Promise<string | null> {
    if (!this.canUseWebCrypto) {
      return this.getChunkedSecureSession();
    }

    const rawPayload = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.sessionPayload);
    if (!rawPayload) {
      return null;
    }

    const envelope = parseEnvelope(rawPayload);
    if (!envelope) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload);
      return null;
    }

    try {
      const key = await this.getOrCreateCryptoKey();
      const decrypted = await decryptString(envelope, key);
      return decrypted;
    } catch {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload);
      return null;
    }
  }

  async set(value: string): Promise<void> {
    if (!this.canUseWebCrypto) {
      await this.setChunkedSecureSession(value);
      return;
    }

    const key = await this.getOrCreateCryptoKey();
    const encrypted = await encryptString(value, key);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.sessionPayload, JSON.stringify(encrypted));
  }

  async remove(): Promise<void> {
    if (!this.canUseWebCrypto) {
      await this.removeChunkedSecureSession();
      return;
    }

    await Promise.all([
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload),
      this.secureStorage.remove(AUTH_STORAGE_KEYS.sessionChunkCount),
    ]);
  }

  async migrateLegacyIfPresent(): Promise<void> {
    const legacyValue = await this.secureStorage.get(AUTH_STORAGE_KEYS.session);
    if (!legacyValue) {
      return;
    }

    try {
      const parsed = JSON.parse(legacyValue);
      const hasSupabaseShape = isRecord(parsed) && LEGACY_SUPABASE_TOKEN_KEYS.every((key) => key in parsed);
      if (hasSupabaseShape) {
        await this.set(legacyValue);
      }
    } catch {
      // Non-JSON or malformed legacy payload cannot be restored safely.
    } finally {
      await this.secureStorage.remove(AUTH_STORAGE_KEYS.session);
    }
  }

  private async getOrCreateCryptoKey(): Promise<CryptoKey> {
    if (!this.cryptoKeyPromise) {
      this.cryptoKeyPromise = this.loadOrCreateCryptoKey();
    }

    return this.cryptoKeyPromise;
  }

  private async loadOrCreateCryptoKey(): Promise<CryptoKey> {
    const existingKeyB64 = await this.secureStorage.get(AUTH_STORAGE_KEYS.sessionKey);
    if (existingKeyB64) {
      const raw = decodeBase64ToBytes(existingKeyB64);
      return importAesKey(raw);
    }

    const crypto = getWebCrypto();
    const raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    await this.secureStorage.set(AUTH_STORAGE_KEYS.sessionKey, encodeBytesToBase64(raw));
    return importAesKey(raw);
  }

  private async getChunkedSecureSession(): Promise<string | null> {
    const chunkCount = await readChunkCount(this.secureStorage);
    if (chunkCount < 1) {
      return null;
    }

    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, index) => this.secureStorage.get(chunkKey(index)))
    );

    if (chunks.some((chunk) => chunk == null)) {
      await this.removeChunkedSecureSession();
      return null;
    }

    return chunks.join('');
  }

  private async setChunkedSecureSession(value: string): Promise<void> {
    const nextChunks = splitIntoChunks(value, SECURE_STORE_CHUNK_CHAR_SIZE);
    if (nextChunks.length > MAX_SESSION_CHUNKS) {
      throw new Error('Auth session payload is too large.');
    }

    const previousChunkCount = await readChunkCount(this.secureStorage);
    const previousIndexesToRemove =
      previousChunkCount > 0
        ? Array.from({ length: previousChunkCount }, (_, index) => index)
        : Array.from({ length: MAX_SESSION_CHUNKS }, (_, index) => index);

    await Promise.all(previousIndexesToRemove.map((index) => this.secureStorage.remove(chunkKey(index))));
    await Promise.all(nextChunks.map((chunk, index) => this.secureStorage.set(chunkKey(index), chunk)));
    await this.secureStorage.set(AUTH_STORAGE_KEYS.sessionChunkCount, String(nextChunks.length));
    await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload);
    await this.secureStorage.remove(AUTH_STORAGE_KEYS.sessionKey);
  }

  private async removeChunkedSecureSession(): Promise<void> {
    const chunkCount = await readChunkCount(this.secureStorage);
    const indexesToRemove =
      chunkCount > 0
        ? Array.from({ length: chunkCount }, (_, index) => index)
        : Array.from({ length: MAX_SESSION_CHUNKS }, (_, index) => index);

    await Promise.all([
      ...indexesToRemove.map((index) => this.secureStorage.remove(chunkKey(index))),
      this.secureStorage.remove(AUTH_STORAGE_KEYS.sessionChunkCount),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.sessionPayload),
      this.secureStorage.remove(AUTH_STORAGE_KEYS.sessionKey),
    ]);
  }
}

/**
 * Supabase stores a serialized session under an SDK-controlled key.
 * The payload is encrypted before being persisted to AsyncStorage to avoid
 * SecureStore size limits and keep token material protected at rest.
 */
export function createSupabaseSecureStorageAdapter(storage: SecureStorageService): SupportedStorage {
  const encryptedSessionStorage = new EncryptedSessionStorage(storage);
  let migrationPromise: Promise<void> | null = null;

  const ensureMigration = async () => {
    if (!migrationPromise) {
      migrationPromise = encryptedSessionStorage.migrateLegacyIfPresent();
    }

    await migrationPromise;
  };

  return {
    getItem: async (key: string) => {
      await ensureMigration();
      const mapped = mapSupabaseStorageKey(key);
      if (mapped === AUTH_STORAGE_KEYS.session) {
        return encryptedSessionStorage.get();
      }

      return storage.get(mapped);
    },
    setItem: async (key: string, value: string) => {
      await ensureMigration();
      const mapped = mapSupabaseStorageKey(key);
      if (mapped === AUTH_STORAGE_KEYS.session) {
        await encryptedSessionStorage.set(value);
        return;
      }

      await storage.set(mapped, value);
    },
    removeItem: async (key: string) => {
      await ensureMigration();
      const mapped = mapSupabaseStorageKey(key);
      if (mapped === AUTH_STORAGE_KEYS.session) {
        await encryptedSessionStorage.remove();
        return;
      }

      await storage.remove(mapped);
    },
  };
}

function mapSupabaseStorageKey(key: string): string {
  if (key.includes('-auth-token')) {
    return AUTH_STORAGE_KEYS.session;
  }

  return `auth.supabase.${key}`;
}

function parseEnvelope(value: string): EncryptedSessionEnvelope | null {
  try {
    const parsed = JSON.parse(value);
    if (
      isRecord(parsed) &&
      parsed.version === 1 &&
      typeof parsed.iv === 'string' &&
      typeof parsed.ciphertext === 'string'
    ) {
      return parsed as EncryptedSessionEnvelope;
    }
  } catch {
    return null;
  }

  return null;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === 'object' && !Array.isArray(input);
}

function isWebCryptoAvailable(): boolean {
  return Boolean(globalThis.crypto?.subtle);
}

function getWebCrypto(): Crypto {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error('WebCrypto is unavailable.');
  }

  return webCrypto;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  const crypto = getWebCrypto();
  return crypto.subtle.importKey('raw', toArrayBuffer(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptString(plainText: string, key: CryptoKey): Promise<EncryptedSessionEnvelope> {
  const crypto = getWebCrypto();
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(encoded)
  );

  return {
    version: 1,
    iv: encodeBytesToBase64(iv),
    ciphertext: encodeBytesToBase64(new Uint8Array(encrypted)),
  };
}

async function decryptString(payload: EncryptedSessionEnvelope, key: CryptoKey): Promise<string> {
  const crypto = getWebCrypto();
  const iv = decodeBase64ToBytes(payload.iv);
  const ciphertext = decodeBase64ToBytes(payload.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
    },
    key,
    toArrayBuffer(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const c = index + 2 < bytes.length ? bytes[index + 2] : 0;

    const triple = (a << 16) | (b << 8) | c;
    output += table[(triple >> 18) & 0x3f];
    output += table[(triple >> 12) & 0x3f];
    output += index + 1 < bytes.length ? table[(triple >> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? table[triple & 0x3f] : '=';
  }

  return output;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const sanitized = base64.replace(/\\s/g, '');
  if (sanitized.length % 4 !== 0) {
    throw new Error('Invalid base64 payload.');
  }

  let padding = 0;
  if (sanitized.endsWith('==')) padding = 2;
  else if (sanitized.endsWith('=')) padding = 1;

  const outputLength = (sanitized.length / 4) * 3 - padding;
  const output = new Uint8Array(outputLength);

  let offset = 0;
  for (let index = 0; index < sanitized.length; index += 4) {
    const c1 = table.indexOf(sanitized[index]);
    const c2 = table.indexOf(sanitized[index + 1]);
    const c3 = sanitized[index + 2] === '=' ? 0 : table.indexOf(sanitized[index + 2]);
    const c4 = sanitized[index + 3] === '=' ? 0 : table.indexOf(sanitized[index + 3]);

    if (c1 < 0 || c2 < 0 || (sanitized[index + 2] !== '=' && c3 < 0) || (sanitized[index + 3] !== '=' && c4 < 0)) {
      throw new Error('Invalid base64 payload.');
    }

    const triple = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4;

    if (offset < outputLength) output[offset++] = (triple >> 16) & 0xff;
    if (offset < outputLength) output[offset++] = (triple >> 8) & 0xff;
    if (offset < outputLength) output[offset++] = triple & 0xff;
  }

  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function splitIntoChunks(value: string, chunkSize: number): string[] {
  const output: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    output.push(value.slice(index, index + chunkSize));
  }
  return output;
}

function chunkKey(index: number): string {
  return `${AUTH_STORAGE_KEYS.sessionChunkPrefix}${index}`;
}

async function readChunkCount(storage: SecureStorageService): Promise<number> {
  const rawValue = await storage.get(AUTH_STORAGE_KEYS.sessionChunkCount);
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0;
  }
  return Math.min(parsed, MAX_SESSION_CHUNKS);
}
