import { createAvatar } from '@dicebear/core';
import * as toonHead from '@dicebear/toon-head';

export type AvatarSeedOption = {
  id: string;
  label: string;
  seed: string;
  config?: Record<string, unknown>;
};

export type AvatarOption = AvatarSeedOption & {
  svg: string;
};

const AVATAR_STORAGE_PREFIX = 'avatar:dicebear:toon-head:';

export const AVATAR_SEED_OPTIONS: AvatarSeedOption[] = [
  {
    id: 'atlas',
    label: 'Atlas',
    seed: 'atlas-coffee-profile',
    config: { skinColor: ['f6d2b4'], hair: ['undercut'], hairColor: ['3b2a23'], eyes: ['wide'], mouth: ['smile'] },
  },
  {
    id: 'nova',
    label: 'Nova',
    seed: 'nova-coffee-profile',
    config: { skinColor: ['f8d7c4'], hair: ['bun'], rearHair: ['longStraight'], eyes: ['happy'], mouth: ['laugh'] },
  },
  {
    id: 'rio',
    label: 'Rio',
    seed: 'rio-coffee-profile',
    config: { skinColor: ['b98e6a'], hair: ['spiky'], eyes: ['wink'], mouth: ['smile'] },
  },
  {
    id: 'sage',
    label: 'Sage',
    seed: 'sage-coffee-profile',
    config: { skinColor: ['a36b4f'], hair: ['sideComed'], eyes: ['humble'], mouth: ['agape'] },
  },
  {
    id: 'echo',
    label: 'Echo',
    seed: 'echo-coffee-profile',
    config: { skinColor: ['c68e7a'], rearHair: ['shoulderHigh'], eyes: ['bow'], mouth: ['smile'] },
  },
  {
    id: 'lumen',
    label: 'Lumen',
    seed: 'lumen-coffee-profile',
    config: { skinColor: ['5c3829'], hair: ['bun'], rearHair: ['longWavy'], eyes: ['neutral'], mouth: ['laugh'] },
  },
  {
    id: 'kai',
    label: 'Kai',
    seed: 'kai-coffee-profile',
    config: { skinColor: ['5c3829'], hair: ['spiky'], beard: ['chinMoustache'], eyes: ['wide'], mouth: ['smile'] },
  },
  {
    id: 'mika',
    label: 'Mika',
    seed: 'mika-coffee-profile',
    config: { skinColor: ['b98e6a'], hair: ['sideComed'], eyes: ['happy'], mouth: ['smile'] },
  },
];

export const DEFAULT_AVATAR_SEED = AVATAR_SEED_OPTIONS[0];

export function serializeAvatarOption(option: AvatarSeedOption): string {
  return `${AVATAR_STORAGE_PREFIX}${option.id}`;
}

export function resolveAvatarSeedOption(value: string | null | undefined): AvatarSeedOption {
  if (!value || !value.startsWith(AVATAR_STORAGE_PREFIX)) {
    return DEFAULT_AVATAR_SEED;
  }

  const id = value.slice(AVATAR_STORAGE_PREFIX.length);
  return AVATAR_SEED_OPTIONS.find((option) => option.id === id) ?? DEFAULT_AVATAR_SEED;
}

export function buildAvatarOptions(): AvatarOption[] {
  return AVATAR_SEED_OPTIONS.map((option) => ({
    ...option,
    svg: createAvatar(toonHead, {
      seed: option.seed,
      size: 96,
      radius: 50,
      backgroundType: ['solid'],
      ...option.config,
    }).toString(),
  }));
}
