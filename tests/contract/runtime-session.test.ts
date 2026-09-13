import { describe, expect, it } from 'vitest';

import {
  RuntimeSessionSchema,
  type RuntimeSession,
} from '../../apps/desktop/src/shared/contracts/runtime-session';
import type { TaskIntent } from '../../apps/desktop/src/shared/contracts/task-intent';
import { bootstrapRuntimeSession } from '../../apps/desktop/src/shared/runtime-session';

const readyIntent = (): TaskIntent => ({
  id: 'intent:project-alpha',
  projectId: 'project-alpha',
  revision: 2,
  instruction: '执行已批准计划，但当前只初始化会话。',
  steps: [
    { id: 'scope', summary: '锁定批准范围' },
    { id: 'verify', summary: '保留验证边界' },
  ],
  status: 'ready',
});

describe('runtime session bootstrap', () => {
  it('rejects invalid intents', () => {
    expect(bootstrapRuntimeSession({ status: 'ready' })).toEqual({
      ok: false,
      error: 'INVALID_INTENT',
    });
  });

  it('rejects intents that are not ready', () => {
    expect(
      bootstrapRuntimeSession({
        ...readyIntent(),
        status: 'reviewing',
      }),
    ).toEqual({
      ok: false,
      error: 'INTENT_NOT_READY',
    });
  });

  it('creates an initialized session from the approved ready intent', () => {
    const result = bootstrapRuntimeSession(readyIntent());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      id: 'session:intent:project-alpha:r2',
      projectId: 'project-alpha',
      approvedIntent: readyIntent(),
      status: 'initialized',
      capabilities: {
        modelAccess: false,
        toolExecution: false,
        fileMutation: false,
      },
    });
    expect(RuntimeSessionSchema.safeParse(result.value).success).toBe(true);
  });

  it('clones the approved intent into the session snapshot', () => {
    const source = readyIntent();
    const result = bootstrapRuntimeSession(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    source.instruction = 'mutated after bootstrap';
    const firstSourceStep = source.steps[0];
    if (firstSourceStep === undefined) {
      throw new Error('Expected the ready intent fixture to contain a step.');
    }
    firstSourceStep.summary = 'mutated step';

    expect(result.value.approvedIntent.instruction).toBe(
      '执行已批准计划，但当前只初始化会话。',
    );
    expect(result.value.approvedIntent.steps[0]?.summary).toBe('锁定批准范围');
  });

  it('rejects a session whose project does not match the approved intent', () => {
    const invalidSession: RuntimeSession = {
      id: 'session:intent:project-alpha:r2',
      projectId: 'project-beta',
      approvedIntent: {
        ...readyIntent(),
        status: 'ready',
      },
      status: 'initialized',
      capabilities: {
        modelAccess: false,
        toolExecution: false,
        fileMutation: false,
      },
    };

    expect(RuntimeSessionSchema.safeParse(invalidSession).success).toBe(false);
  });
});
