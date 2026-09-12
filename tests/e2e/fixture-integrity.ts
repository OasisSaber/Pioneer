import { hashFixtureTree } from '../helpers/hash-tree';

/** Captures the fixture contents before launch so a Real E2E can prove read-only behavior. */
export const captureFixtureHash = (fixtureRoot: string): Promise<string> =>
  hashFixtureTree(fixtureRoot);

/** Re-hashes after Electron closes; callers compare the independent before/after digests. */
export const captureFixtureHashAfterClose = (
  fixtureRoot: string,
): Promise<string> => hashFixtureTree(fixtureRoot);
