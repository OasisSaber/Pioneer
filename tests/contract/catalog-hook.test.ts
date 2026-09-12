import { describe, expect, it } from 'vitest';
import { createSingleFlightRunner } from '../../apps/desktop/src/renderer/hooks/use-catalog';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('catalog renderer operation state', () => {
  it('coalesces repeated refresh requests and focuses one deferred operation', async () => {
    const runner = createSingleFlightRunner<string>();
    const pending = deferred<string>();
    let calls = 0;
    const first = runner(() => {
      calls += 1;
      return pending.promise;
    });
    const second = runner(() => {
      calls += 1;
      return Promise.resolve('unexpected');
    });

    expect(second).toBe(first);
    expect(calls).toBe(1);
    pending.resolve('ready');
    await expect(first).resolves.toBe('ready');
  });

  it('releases busy state after failure so a later refresh can recover', async () => {
    const runner = createSingleFlightRunner<string>();
    const pending = deferred<string>();
    const first = runner(() => pending.promise);
    pending.reject(new Error('scan failed'));
    await expect(first).rejects.toThrow('scan failed');
    await expect(runner(() => Promise.resolve('recovered'))).resolves.toBe(
      'recovered',
    );
  });
});
