export type FlowDomain = 'scan' | 'tasting_log' | 'analytics' | 'batch_publication' | 'qr';

export type FlowErrorKind =
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'validation'
  | 'not_found'
  | 'rate_limited'
  | 'server'
  | 'unknown';

export type FlowError = Error & {
  name: string;
  domain: FlowDomain;
  kind: FlowErrorKind;
  status: number | null;
  code: string | null;
  retryable: boolean;
  raw: unknown;
};

export type FlowUiCopy = {
  title: string;
  message: string;
  retryLabel: string | null;
};

function appendLocalDiagnostic(baseMessage: string, error: FlowError): string {
  const location = asRecord((globalThis as { location?: unknown }).location);
  const hostname = location ? readString(location.hostname) : null;
  if (!hostname || !/^(localhost|127\.0\.0\.1)$/.test(hostname)) return baseMessage;

  const detail = error.message.trim();
  if (!detail || detail === baseMessage) return baseMessage;
  return `${baseMessage} (${detail})`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractStatus(error: Record<string, unknown>): number | null {
  const direct = readNumber(error.status) ?? readNumber(error.statusCode);
  if (direct != null) return direct;

  const context = asRecord(error.context);
  if (!context) return null;
  return readNumber(context.status) ?? readNumber(context.statusCode);
}

function extractCode(error: Record<string, unknown>): string | null {
  const direct = readString(error.code) ?? readString(error.error);
  if (direct) return direct;

  const context = asRecord(error.context);
  if (!context) return null;
  return readString(context.code) ?? readString(context.error);
}

function extractMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) return error;

  const candidate = asRecord(error);
  if (!candidate) return fallback;

  const fromMessage = readString(candidate.message);
  if (fromMessage) return fromMessage;

  const context = asRecord(candidate.context);
  if (context) {
    const fromContext = readString(context.message);
    if (fromContext) return fromContext;
  }

  return fallback;
}

function isFlowError(error: unknown): error is FlowError {
  const candidate = asRecord(error);
  if (!candidate) return false;

  return (
    typeof candidate.domain === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.retryable === 'boolean' &&
    Object.prototype.hasOwnProperty.call(candidate, 'status')
  );
}

function classifyFlowError(params: {
  message: string;
  status: number | null;
  code: string | null;
}): FlowErrorKind {
  const status = params.status;
  const message = params.message.toLowerCase();
  const code = (params.code ?? '').toLowerCase();

  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 400 || status === 422) return 'validation';
  if (status === 404 || code === 'not_found') return 'not_found';
  if (status === 429 || code === 'rate_limited' || code === 'too_many_requests') {
    return 'rate_limited';
  }
  if (status != null && status >= 500) return 'server';

  if (message.includes('timeout') || message.includes('timed out') || code.includes('timeout')) {
    return 'timeout';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('offline') ||
    message.includes('internet')
  ) {
    return 'offline';
  }

  return 'unknown';
}

function isRetryable(kind: FlowErrorKind): boolean {
  return kind === 'offline' || kind === 'timeout' || kind === 'server' || kind === 'rate_limited';
}

function defaultFallbackMessage(domain: FlowDomain): string {
  if (domain === 'scan') return 'Unable to resolve this QR code right now.';
  if (domain === 'analytics') return 'Unable to load analytics right now.';
  if (domain === 'batch_publication') return 'Unable to load or save this batch publication right now.';
  if (domain === 'qr') return 'Unable to generate or refresh this QR right now.';
  return 'Unable to save tasting right now.';
}

export function normalizeFlowError(params: {
  error: unknown;
  domain: FlowDomain;
  fallbackMessage?: string;
}): FlowError {
  if (isFlowError(params.error) && params.error.domain === params.domain) {
    return params.error;
  }

  const fallback = params.fallbackMessage ?? defaultFallbackMessage(params.domain);
  const candidate = asRecord(params.error);
  const status = candidate ? extractStatus(candidate) : null;
  const code = candidate ? extractCode(candidate) : null;
  const message = extractMessage(params.error, fallback);
  const kind = classifyFlowError({ message, status, code });

  const next = new Error(message) as FlowError;
  next.name = 'FlowError';
  next.domain = params.domain;
  next.kind = kind;
  next.status = status;
  next.code = code;
  next.retryable = isRetryable(kind);
  next.raw = params.error;
  return next;
}

export function flowErrorUiCopy(error: FlowError): FlowUiCopy {
  const kind = error.kind;

  if (error.domain === 'scan') {
    if (kind === 'not_found') {
      return {
        title: 'QR not found',
        message: 'This QR code is unknown or no longer active. Ask the roaster for a fresh code.',
        retryLabel: 'Try again',
      };
    }
    if (kind === 'offline' || kind === 'timeout') {
      return {
        title: 'No connection',
        message: 'Reconnect to the internet and retry the scan.',
        retryLabel: 'Retry scan',
      };
    }
    if (kind === 'unauthorized') {
      return {
        title: 'Session required',
        message: 'Sign in again and retry opening this coffee page.',
        retryLabel: 'Retry',
      };
    }
    if (kind === 'rate_limited') {
      return {
        title: 'Too many requests',
        message: 'Please wait a moment before scanning again.',
        retryLabel: 'Retry scan',
      };
    }
    if (kind === 'server') {
      return {
        title: 'Scan temporarily unavailable',
        message: 'Our scan service is temporarily unavailable. Please try again.',
        retryLabel: 'Retry scan',
      };
    }
    return {
      title: 'Scan failed',
      message: 'We could not open this coffee page from QR right now.',
      retryLabel: 'Retry scan',
    };
  }

  if (error.domain === 'analytics') {
    if (kind === 'unauthorized') {
      return {
        title: 'Session expired',
        message: 'Sign in again to load roaster analytics.',
        retryLabel: 'Retry analytics',
      };
    }
    if (kind === 'not_found') {
      return {
        title: 'Batch not found',
        message: 'This batch no longer exists or is unavailable in the current environment.',
        retryLabel: 'Retry analytics',
      };
    }
    if (kind === 'offline' || kind === 'timeout') {
      return {
        title: 'Network unavailable',
        message: 'Connect to the internet to refresh analytics.',
        retryLabel: 'Retry analytics',
      };
    }
    if (kind === 'rate_limited') {
      return {
        title: 'Analytics temporarily throttled',
        message: 'Please wait a moment before refreshing analytics again.',
        retryLabel: 'Retry analytics',
      };
    }
    if (kind === 'server') {
      return {
        title: 'Analytics unavailable',
        message: 'Analytics service returned an internal error. Please retry shortly.',
        retryLabel: 'Retry analytics',
      };
    }
    return {
      title: 'Analytics load failed',
      message: 'Unable to load analytics right now.',
      retryLabel: 'Retry analytics',
    };
  }

  if (error.domain === 'batch_publication') {
    if (kind === 'unauthorized') {
      return {
        title: 'Session expired',
        message: 'Sign in again to manage this batch publication.',
        retryLabel: 'Retry',
      };
    }
    if (kind === 'not_found') {
      return {
        title: 'Batch not found',
        message: 'This batch publication does not exist or is unavailable to this roaster.',
        retryLabel: 'Retry',
      };
    }
    if (kind === 'offline' || kind === 'timeout') {
      return {
        title: 'Network unavailable',
        message: 'Reconnect to the internet and retry this batch action.',
        retryLabel: 'Retry',
      };
    }
    if (kind === 'server') {
      return {
        title: 'Batch service unavailable',
        message: appendLocalDiagnostic(
          'The batch publication service returned an internal error. Please retry shortly.',
          error
        ),
        retryLabel: 'Retry',
      };
    }
    return {
      title: 'Batch action failed',
      message: 'Unable to load or save this batch publication right now.',
      retryLabel: 'Retry',
    };
  }

  if (error.domain === 'qr') {
    if (kind === 'unauthorized') {
      return {
        title: 'Session expired',
        message: 'Sign in again to generate or refresh this QR code.',
        retryLabel: 'Retry QR',
      };
    }
    if (kind === 'not_found') {
      return {
        title: 'Batch not found',
        message: 'This batch no longer exists, so QR preview cannot be generated.',
        retryLabel: 'Retry QR',
      };
    }
    if (kind === 'offline' || kind === 'timeout') {
      return {
        title: 'Network unavailable',
        message: 'Reconnect to the internet to generate or refresh QR.',
        retryLabel: 'Retry QR',
      };
    }
    if (kind === 'server') {
      return {
        title: 'QR unavailable',
        message: 'QR generation is temporarily unavailable. Please retry shortly.',
        retryLabel: 'Retry QR',
      };
    }
    return {
      title: 'QR action failed',
      message: 'Unable to generate or refresh this QR right now.',
      retryLabel: 'Retry QR',
    };
  }

  if (kind === 'unauthorized') {
    return {
      title: 'Session expired',
      message: 'Sign in again and retry saving this tasting.',
      retryLabel: null,
    };
  }

  if (kind === 'validation') {
    return {
      title: 'Check tasting fields',
      message: error.message,
      retryLabel: null,
    };
  }

  if (kind === 'not_found') {
    return {
      title: 'Tasting endpoint unavailable',
      message: 'Tasting save endpoint is missing in this environment. Deploy log_tasting first.',
      retryLabel: null,
    };
  }

  if (kind === 'offline' || kind === 'timeout') {
    return {
      title: 'Queued for retry',
      message: 'Temporary connectivity issue. Tasting will sync automatically after reconnect.',
      retryLabel: null,
    };
  }

  if (kind === 'rate_limited') {
    return {
      title: 'Too many attempts',
      message: 'Please wait a moment and retry saving your tasting.',
      retryLabel: null,
    };
  }

  if (kind === 'server') {
    return {
      title: 'Save temporarily unavailable',
      message: 'Tasting save is temporarily unavailable. Please retry shortly.',
      retryLabel: null,
    };
  }

  return {
    title: 'Save failed',
    message: 'Unable to save tasting right now.',
    retryLabel: null,
  };
}

export function logFlowError(
  error: FlowError,
  origin: string,
  context?: Record<string, unknown>
): void {
  // Standardized cross-app telemetry shape for scan/log/analytics failures.
  console.error('[flow-error]', {
    origin,
    domain: error.domain,
    kind: error.kind,
    status: error.status,
    code: error.code,
    retryable: error.retryable,
    message: error.message,
    ...(context ? { context } : {}),
  });
}
