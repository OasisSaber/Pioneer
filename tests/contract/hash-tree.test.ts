import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hashFixtureTree } from '../helpers/hash-tree';

describe('fixture tree hash', () => {
  it('changes when an empty directory is added or removed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pioneer-hash-'));
    const before = await hashFixtureTree(root);
    const empty = join(root, 'empty');
    await mkdir(empty);
    const withEmpty = await hashFixtureTree(root);
    expect(withEmpty).not.toBe(before);
    await rm(empty, { recursive: true, force: true });
    await expect(hashFixtureTree(root)).resolves.toBe(before);
  });

  it('changes when file bytes change and when one link is retargeted without following it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pioneer-hash-'));
    const targetA = join(root, 'target-a.txt');
    const targetB = join(root, 'target-b.txt');
    await writeFile(targetA, 'a');
    await writeFile(targetB, 'b');
    const before = await hashFixtureTree(root);
    await writeFile(targetA, 'changed');
    const changed = await hashFixtureTree(root);
    expect(changed).not.toBe(before);
    await writeFile(targetA, 'a');
    const link = join(root, 'alias.txt');
    await symlink(targetA, link);
    const linked = await hashFixtureTree(root);
    expect(linked).not.toBe(before);
    await rm(link, { force: true });
    await symlink(targetB, link);
    await expect(hashFixtureTree(root)).resolves.not.toBe(linked);
  });
});
