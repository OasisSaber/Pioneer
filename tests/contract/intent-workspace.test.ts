import { describe, expect, it } from 'vitest';

import {
  initialIntentWorkspaceState,
  intentWorkspaceReducer,
} from '../../apps/desktop/src/renderer/state/intent-workspace';

const projectId = 'project-alpha';

describe('M3 intent workspace reducer', () => {
  it('rejects blank instructions locally', () => {
    const next = intentWorkspaceReducer(initialIntentWorkspaceState(), {
      type: 'SUBMIT',
      projectId,
    });

    expect(next.phase).toBe('compose');
    expect(next.error).toBe('EMPTY_INSTRUCTION');
    expect(next.intent).toBeNull();
  });

  it('submits a local preview intent into reviewing', () => {
    const withInstruction = intentWorkspaceReducer(
      initialIntentWorkspaceState(),
      {
        type: 'SET_INSTRUCTION',
        instruction: '先给出最小安全计划，批准前不要执行。',
      },
    );
    const next = intentWorkspaceReducer(withInstruction, {
      type: 'SUBMIT',
      projectId,
    });

    expect(next.phase).toBe('review');
    expect(next.intent?.status).toBe('reviewing');
    expect(next.intent?.revision).toBe(1);
    expect(next.intent?.steps).toHaveLength(3);
  });

  it('increments revision when a reviewed intent is edited and resubmitted', () => {
    let state = intentWorkspaceReducer(initialIntentWorkspaceState(), {
      type: 'SET_INSTRUCTION',
      instruction: '第一版任务',
    });
    state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });
    state = intentWorkspaceReducer(state, { type: 'EDIT' });
    state = intentWorkspaceReducer(state, {
      type: 'SET_INSTRUCTION',
      instruction: '第二版任务',
    });
    state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });

    expect(state.phase).toBe('review');
    expect(state.intent?.status).toBe('reviewing');
    expect(state.intent?.revision).toBe(2);
    expect(state.intent?.instruction).toBe('第二版任务');
  });

  it('ends the first vertical slice at ready without runtime state', () => {
    let state = intentWorkspaceReducer(initialIntentWorkspaceState(), {
      type: 'SET_INSTRUCTION',
      instruction: '只审阅计划，不执行。',
    });
    state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });
    state = intentWorkspaceReducer(state, { type: 'CONFIRM' });

    expect(state.phase).toBe('ready');
    expect(state.intent?.status).toBe('ready');
  });

  it('supports cancellation from review', () => {
    let state = intentWorkspaceReducer(initialIntentWorkspaceState(), {
      type: 'SET_INSTRUCTION',
      instruction: '准备取消的任务',
    });
    state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });
    state = intentWorkspaceReducer(state, { type: 'CANCEL' });

    expect(state.phase).toBe('cancelled');
    expect(state.intent?.status).toBe('cancelled');
  });
});
