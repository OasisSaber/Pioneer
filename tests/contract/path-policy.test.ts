import { describe, expect, it } from 'vitest';
import {
  isPathInsideRoot,
  normalizeRootPath,
  projectIdFromPath,
} from '../../apps/desktop/src/main/catalog/path-policy';

describe('catalog path policy', () => {
  it('normalizes drive-letter casing and trailing separators', () => {
    expect(normalizeRootPath('c:\\Workspaces\\alpha\\..\\')).toBe(
      'C:\\Workspaces',
    );
  });

  it('does not confuse same-name folders at distinct absolute paths', () => {
    expect(projectIdFromPath('C:\\one\\alpha')).not.toBe(
      projectIdFromPath('C:\\two\\alpha'),
    );
  });

  it('accepts the root and direct descendants but rejects .. escapes', () => {
    expect(isPathInsideRoot('C:\\workspaces', 'C:\\workspaces')).toBe(true);
    expect(isPathInsideRoot('C:\\workspaces', 'C:\\workspaces\\alpha')).toBe(
      true,
    );
    expect(
      isPathInsideRoot(
        'C:\\workspaces',
        'C:\\workspaces\\alpha\\..\\..\\outside',
      ),
    ).toBe(false);
  });

  it('rejects a resolved symlink or junction candidate outside its root', () => {
    expect(
      isPathInsideRoot('C:\\workspaces', 'D:\\outside\\linked-project'),
    ).toBe(false);
  });
});
