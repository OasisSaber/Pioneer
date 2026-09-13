import { describe, expect, it } from 'vitest';

import {
  initialIntentWorkspaceState,
  intentWorkspaceReducer,
} from '../../apps/desktop/src/renderer/state/intent-workspace';

const projectId = 'project-alpha';

const readyState = () => {
  let state = intentWorkspaceReducer(initialIntentWorkspaceState(), {
    type: 'SET_INSTRUCTION',
    instruction: '只审阅计划，不执行。',
  });
  state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });
  return intentWorkspaceReducer(state, { type: 'CONFIRM' });
};

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

  it('reaches ready without creating a runtime session', () => {
    const state = readyState();

    expect(state.phase).toBe('ready');
    expect(state.intent?.status).toBe('ready');
    expect(state.session).toBeNull();
  });

  it('bootstraps a disabled runtime session only after approval', () => {
    const state = intentWorkspaceReducer(readyState(), {
      type: 'BOOTSTRAP_SESSION',
    });

    expect(state.phase).toBe('session');
    expect(state.session?.status).toBe('initialized');
    expect(state.session?.approvedIntent.status).toBe('ready');
    expect(state.session?.capabilities).toEqual({
      modelAccess: false,
      toolExecution: false,
      fileMutation: false,
    });
  });

  it('rejects runtime bootstrap before the intent is ready', () => {
    let state = intentWorkspaceReducer(initialIntentWorkspaceState(), {
      type: 'SET_INSTRUCTION',
      instruction: '尚未批准的任务',
    });
    state = intentWorkspaceReducer(state, { type: 'SUBMIT', projectId });
    state = intentWorkspaceReducer(state, { type: 'BOOTSTRAP_SESSION' });

    expect(state.phase).toBe('review');
    expect(state.session).toBeNull();
    expect(state.error).toBe('INTENT_NOT_READY');
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
    expect(state.session).toBeNull();
  });
});
