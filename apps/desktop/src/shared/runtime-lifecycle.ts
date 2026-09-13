import {
  RuntimeLifecycleSchema,
  runtimeEventId,
  type RuntimeLifecycleResult,
} from './contracts/runtime-lifecycle';
import { RuntimeSessionSchema } from './contracts/runtime-session';

export function createRuntimeLifecycle(
  session: unknown,
): RuntimeLifecycleResult {
  const parsedSession = RuntimeSessionSchema.safeParse(session);
  if (!parsedSession.success) {
    return { ok: false, error: 'INVALID_SESSION' };
  }

  const lifecycle = RuntimeLifecycleSchema.parse({
    session: parsedSession.data,
    status: 'initialized',
    events: [
      {
        id: runtimeEventId(parsedSession.data.id, 1),
        sessionId: parsedSession.data.id,
        sequence: 1,
        type: 'session.initialized',
        approvedIntentRevision: parsedSession.data.approvedIntent.revision,
      },
    ],
  });

  return { ok: true, value: lifecycle };
}

export function requestRuntimeStart(
  lifecycle: unknown,
): RuntimeLifecycleResult {
  const parsedLifecycle = RuntimeLifecycleSchema.safeParse(lifecycle);
  if (!parsedLifecycle.success) {
    return { ok: false, error: 'INVALID_LIFECYCLE' };
  }

  if (parsedLifecycle.data.status !== 'initialized') {
    return { ok: false, error: 'INVALID_LIFECYCLE_TRANSITION' };
  }

  const sequence = parsedLifecycle.data.events.length + 1;
  const next = RuntimeLifecycleSchema.parse({
    ...parsedLifecycle.data,
    status: 'start_requested',
    events: [
      ...parsedLifecycle.data.events,
      {
        id: runtimeEventId(parsedLifecycle.data.session.id, sequence),
        sessionId: parsedLifecycle.data.session.id,
        sequence,
        type: 'runtime.start_requested',
      },
    ],
  });

  return { ok: true, value: next };
}
