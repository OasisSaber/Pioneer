import type {
  RuntimeSession,
  RuntimeSessionErrorCode,
} from '../../shared/contracts/runtime-session';
import type {
  IntentErrorCode,
  TaskIntent,
  TaskIntentStep,
} from '../../shared/contracts/task-intent';
import { bootstrapRuntimeSession } from '../../shared/runtime-session';
import { transitionIntent } from '../../shared/task-intent';

export type IntentWorkspacePhase =
  | 'compose'
  | 'review'
  | 'ready'
  | 'session'
  | 'cancelled';

export type IntentWorkspaceError =
  | 'EMPTY_INSTRUCTION'
  | IntentErrorCode
  | RuntimeSessionErrorCode;

export interface IntentWorkspaceState {
  phase: IntentWorkspacePhase;
  draftInstruction: string;
  intent: TaskIntent | null;
  session: RuntimeSession | null;
  error: IntentWorkspaceError | null;
}

export type IntentWorkspaceAction =
  | { type: 'SET_INSTRUCTION'; instruction: string }
  | { type: 'SUBMIT'; projectId: string }
  | { type: 'EDIT' }
  | { type: 'CONFIRM' }
  | { type: 'BOOTSTRAP_SESSION' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

export const initialIntentWorkspaceState = (): IntentWorkspaceState => ({
  phase: 'compose',
  draftInstruction: '',
  intent: null,
  session: null,
  error: null,
});

export const buildPreviewSteps = (): TaskIntentStep[] => [
  { id: 'scope', summary: '确认目标、项目上下文与本轮边界' },
  { id: 'plan', summary: '形成最小安全修改计划与执行顺序' },
  { id: 'verify', summary: '确认验证方式、停止条件与交付结果' },
];

const newDraftIntent = (
  projectId: string,
  instruction: string,
): TaskIntent => ({
  id: `intent:${projectId}`,
  projectId,
  revision: 1,
  instruction,
  steps: buildPreviewSteps(),
  status: 'draft',
});

function failure(
  state: IntentWorkspaceState,
  error: IntentWorkspaceError,
): IntentWorkspaceState {
  return { ...state, error };
}

export function intentWorkspaceReducer(
  state: IntentWorkspaceState,
  action: IntentWorkspaceAction,
): IntentWorkspaceState {
  switch (action.type) {
    case 'SET_INSTRUCTION':
      return {
        ...state,
        draftInstruction: action.instruction,
        error: null,
      };

    case 'SUBMIT': {
      const instruction = state.draftInstruction.trim();
      if (instruction.length === 0) return failure(state, 'EMPTY_INSTRUCTION');

      let draft: TaskIntent;
      if (state.intent?.projectId !== action.projectId) {
        draft = newDraftIntent(action.projectId, instruction);
      } else if (
        state.intent.status === 'cancelled' ||
        state.intent.status === 'ready'
      ) {
        draft = newDraftIntent(action.projectId, instruction);
      } else if (state.intent.status === 'reviewing') {
        const revised = transitionIntent(state.intent, {
          type: 'revise',
          expectedRevision: state.intent.revision,
          instruction,
          steps: buildPreviewSteps(),
        });
        if (!revised.ok) return failure(state, revised.error);
        draft = revised.value;
      } else {
        draft = {
          ...state.intent,
          instruction,
          steps: buildPreviewSteps(),
        };
      }

      const submitted = transitionIntent(draft, {
        type: 'submit',
        expectedRevision: draft.revision,
      });
      if (!submitted.ok) return failure(state, submitted.error);

      return {
        phase: 'review',
        draftInstruction: instruction,
        intent: submitted.value,
        session: null,
        error: null,
      };
    }

    case 'EDIT':
      if (state.intent?.status !== 'reviewing') {
        return failure(state, 'INVALID_TRANSITION');
      }
      return { ...state, phase: 'compose', session: null, error: null };

    case 'CONFIRM': {
      if (state.intent === null) return failure(state, 'INVALID_INTENT');
      const confirmed = transitionIntent(state.intent, {
        type: 'confirm',
        expectedRevision: state.intent.revision,
      });
      if (!confirmed.ok) return failure(state, confirmed.error);
      return {
        ...state,
        phase: 'ready',
        intent: confirmed.value,
        session: null,
        error: null,
      };
    }

    case 'BOOTSTRAP_SESSION': {
      if (state.intent === null) return failure(state, 'INVALID_INTENT');
      const bootstrapped = bootstrapRuntimeSession(state.intent);
      if (!bootstrapped.ok) return failure(state, bootstrapped.error);
      return {
        ...state,
        phase: 'session',
        session: bootstrapped.value,
        error: null,
      };
    }

    case 'CANCEL': {
      if (state.intent === null) return failure(state, 'INVALID_INTENT');
      const cancelled = transitionIntent(state.intent, {
        type: 'cancel',
        expectedRevision: state.intent.revision,
      });
      if (!cancelled.ok) return failure(state, cancelled.error);
      return {
        ...state,
        phase: 'cancelled',
        intent: cancelled.value,
        session: null,
        error: null,
      };
    }

    case 'RESET':
      return initialIntentWorkspaceState();
  }
}
