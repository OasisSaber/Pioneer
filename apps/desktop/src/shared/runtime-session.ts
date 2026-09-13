import {
  ReadyTaskIntentSchema,
  RuntimeSessionSchema,
  runtimeSessionIdForIntent,
  type RuntimeSessionResult,
} from './contracts/runtime-session';
import { TaskIntentSchema } from './contracts/task-intent';

export function bootstrapRuntimeSession(intent: unknown): RuntimeSessionResult {
  const parsedIntent = TaskIntentSchema.safeParse(intent);
  if (!parsedIntent.success) {
    return { ok: false, error: 'INVALID_INTENT' };
  }

  if (parsedIntent.data.status !== 'ready') {
    return { ok: false, error: 'INTENT_NOT_READY' };
  }

  const approvedIntent = ReadyTaskIntentSchema.parse(parsedIntent.data);
  const session = RuntimeSessionSchema.parse({
    id: runtimeSessionIdForIntent(approvedIntent),
    projectId: approvedIntent.projectId,
    approvedIntent,
    status: 'initialized',
    capabilities: {
      modelAccess: false,
      toolExecution: false,
      fileMutation: false,
    },
  });

  return { ok: true, value: session };
}
