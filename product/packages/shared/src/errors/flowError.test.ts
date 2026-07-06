import { describe, expect, it } from 'vitest';

import { flowErrorUiCopy, normalizeFlowError } from './flowError';

describe('flowError', () => {
  it('classifies scan not-found errors', () => {
    const error = normalizeFlowError({
      error: { message: 'hash not found', status: 404, code: 'NOT_FOUND' },
      domain: 'scan',
    });

    expect(error.kind).toBe('not_found');
    expect(error.retryable).toBe(false);

    const copy = flowErrorUiCopy(error);
    expect(copy.title).toBe('QR not found');
  });

  it('classifies analytics unauthorized and maps copy', () => {
    const error = normalizeFlowError({
      error: { message: 'forbidden', status: 403 },
      domain: 'analytics',
    });

    expect(error.kind).toBe('unauthorized');
    expect(flowErrorUiCopy(error).message).toContain('Sign in again');
  });

  it('classifies retryable tasting errors from network message', () => {
    const error = normalizeFlowError({
      error: new Error('Network request failed'),
      domain: 'tasting_log',
    });

    expect(error.kind).toBe('offline');
    expect(error.retryable).toBe(true);
    expect(flowErrorUiCopy(error).title).toBe('Queued for retry');
  });

  it('classifies rate-limited errors as retryable', () => {
    const error = normalizeFlowError({
      error: { message: 'too many requests', status: 429, code: 'TOO_MANY_REQUESTS' },
      domain: 'tasting_log',
    });

    expect(error.kind).toBe('rate_limited');
    expect(error.retryable).toBe(true);
  });

  it('treats backend server_error payloads as server failures', () => {
    const error = normalizeFlowError({
      error: { message: 'column not found', code: 'server_error' },
      domain: 'batch_publication',
    });

    expect(error.kind).toBe('server');
    expect(error.retryable).toBe(true);
    expect(flowErrorUiCopy(error).title).toBe('Batch service unavailable');
  });

  it('treats Supabase fetch failures as offline errors', () => {
    const error = normalizeFlowError({
      error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the Edge Function' },
      domain: 'batch_publication',
    });

    expect(error.kind).toBe('offline');
    expect(error.retryable).toBe(true);
  });

  it('preserves unknown batch publication details in the UI message', () => {
    const error = normalizeFlowError({
      error: { message: 'Upload failed: bucket policy rejected the file' },
      domain: 'batch_publication',
    });

    const copy = flowErrorUiCopy(error);
    expect(copy.title).toBe('Batch action failed');
    expect(copy.message).toContain('bucket policy rejected the file');
  });
});
