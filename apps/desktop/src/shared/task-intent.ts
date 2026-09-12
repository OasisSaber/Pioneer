import {
  IntentActionSchema,
  TaskIntentSchema,
  type IntentAction,
  type IntentResult,
  type TaskIntent,
} from './contracts/task-intent';

const invalidIntent = (): IntentResult => ({
  ok: false,
  error: 'INVALID_INTENT',
});
const invalidAction = (): IntentResult => ({
  ok: false,
  error: 'INVALID_ACTION',
});
const invalidTransition = (): IntentResult => ({
  ok: false,
  error: 'INVALID_TRANSITION',
});

const cloneIntent = (intent: TaskIntent): TaskIntent =>
  TaskIntentSchema.parse(intent);
const cloneAction = (action: IntentAction): IntentAction =>
  IntentActionSchema.parse(action);

export function transitionIntent(
  intent: unknown,
  action: unknown,
): IntentResult {
  const parsedIntent = TaskIntentSchema.safeParse(intent);
  if (!parsedIntent.success) return invalidIntent();

  const parsedAction = IntentActionSchema.safeParse(action);
  if (!parsedAction.success) return invalidAction();

  const current = cloneIntent(parsedIntent.data);
  const nextAction = cloneAction(parsedAction.data);
  if (nextAction.expectedRevision !== current.revision) {
    return { ok: false, error: 'STALE_REVISION' };
  }

  switch (nextAction.type) {
    case 'submit':
      if (current.status !== 'draft') return invalidTransition();
      return { ok: true, value: { ...current, status: 'reviewing' } };
    case 'revise':
      if (current.status === 'cancelled') return invalidTransition();
      if (current.revision === Number.MAX_SAFE_INTEGER) {
        return { ok: false, error: 'REVISION_OVERFLOW' };
      }
      return {
        ok: true,
        value: {
          ...current,
          revision: current.revision + 1,
          instruction: nextAction.instruction,
          steps: nextAction.steps.map((step) => ({ ...step })),
          status: 'draft',
        },
      };
    case 'confirm':
      if (current.status !== 'reviewing') return invalidTransition();
      return { ok: true, value: { ...current, status: 'ready' } };
    case 'cancel':
      if (current.status === 'cancelled') return invalidTransition();
      return { ok: true, value: { ...current, status: 'cancelled' } };
  }
}
