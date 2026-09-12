import { describe, expect, it } from 'vitest';
import {
  IntentActionSchema,
  TaskIntentSchema,
  type TaskIntentStatus,
} from '../../apps/desktop/src/shared/contracts/task-intent';
import { transitionIntent } from '../../apps/desktop/src/shared/task-intent';

const validStep = { id: 'step-1', summary: 'Inspect the project' };
const validIntent = {
  id: 'intent-1',
  projectId: 'project-opaque-id',
  revision: 1,
  instruction: 'Review the task intent',
  steps: [validStep],
  status: 'draft',
} as const;

describe('task intent contracts', () => {
  it('accepts a valid intent and every supported status', () => {
    expect(TaskIntentSchema.safeParse(validIntent).success).toBe(true);
    for (const status of [
      'draft',
      'reviewing',
      'ready',
      'cancelled',
    ] as const) {
      expect(
        TaskIntentSchema.safeParse({ ...validIntent, status }).success,
      ).toBe(true);
    }
  });

  it('rejects unknown keys without rewriting whitespace', () => {
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, extra: true }).success,
    ).toBe(false);
    const padded = { ...validIntent, instruction: '  keep these spaces  ' };
    const parsed = TaskIntentSchema.safeParse(padded);
    expect(parsed.success).toBe(true);
    if (parsed.success)
      expect(parsed.data.instruction).toBe(padded.instruction);
  });

  it('rejects blank and oversized identifiers, instructions, and summaries', () => {
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, id: '   ' }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, projectId: 'x'.repeat(257) })
        .success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({
        ...validIntent,
        instruction: 'x'.repeat(16_385),
      }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({
        ...validIntent,
        steps: [{ ...validStep, summary: 'x'.repeat(2_049) }],
      }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, instruction: '\n\t' })
        .success,
    ).toBe(false);
  });

  it('requires one to one hundred steps with unique nonblank ids', () => {
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, steps: [] }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({
        ...validIntent,
        steps: Array.from({ length: 101 }, (_, index) => ({
          id: `step-${String(index)}`,
          summary: 'Do work',
        })),
      }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({
        ...validIntent,
        steps: [validStep, { id: validStep.id, summary: 'Do more work' }],
      }).success,
    ).toBe(false);
    expect(
      TaskIntentSchema.safeParse({
        ...validIntent,
        steps: [{ id: ' ', summary: validStep.summary }],
      }).success,
    ).toBe(false);
  });

  it('requires positive safe integer revisions and rejects malformed status', () => {
    for (const revision of [
      0,
      -1,
      1.5,
      Number.NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(
        TaskIntentSchema.safeParse({ ...validIntent, revision }).success,
      ).toBe(false);
    }
    expect(
      TaskIntentSchema.safeParse({ ...validIntent, status: 'submitted' })
        .success,
    ).toBe(false);
  });

  it('requires expectedRevision for every strict action and validates revise payloads', () => {
    expect(IntentActionSchema.safeParse({ type: 'submit' }).success).toBe(
      false,
    );
    expect(
      IntentActionSchema.safeParse({ type: 'submit', expectedRevision: 1 })
        .success,
    ).toBe(true);
    expect(
      IntentActionSchema.safeParse({
        type: 'revise',
        expectedRevision: 1,
        instruction: 'Revised instruction',
        steps: [validStep],
      }).success,
    ).toBe(true);
    expect(
      IntentActionSchema.safeParse({
        type: 'revise',
        expectedRevision: 1,
        instruction: 'Revised instruction',
        steps: [validStep],
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      IntentActionSchema.safeParse({ type: 'cancel', expectedRevision: 0 })
        .success,
    ).toBe(false);
  });
});

describe('task intent review transitions', () => {
  const action = (
    type: 'submit' | 'revise' | 'confirm' | 'cancel',
    expectedRevision = 1,
  ) =>
    type === 'revise'
      ? {
          type,
          expectedRevision,
          instruction: 'Revised task',
          steps: [{ id: 'step-revised', summary: 'Do revised work' }],
        }
      : { type, expectedRevision };

  const intentForStatus = (
    status: TaskIntentStatus = 'draft',
    revision = 1,
  ) => ({
    ...validIntent,
    status,
    revision,
    steps: [{ ...validStep }],
  });

  it('accepts only the allowed status/action pairs at the current revision', () => {
    const allowed: Record<TaskIntentStatus, string[]> = {
      draft: ['submit', 'revise', 'cancel'],
      reviewing: ['revise', 'confirm', 'cancel'],
      ready: ['revise', 'cancel'],
      cancelled: [],
    };
    for (const status of Object.keys(allowed) as TaskIntentStatus[]) {
      for (const type of ['submit', 'revise', 'confirm', 'cancel'] as const) {
        const result = transitionIntent(intentForStatus(status), action(type));
        expect(result.ok, `${status} + ${type}`).toBe(
          allowed[status].includes(type),
        );
        if (!allowed[status].includes(type)) {
          expect(result).toEqual({ ok: false, error: 'INVALID_TRANSITION' });
        }
      }
    }
  });

  it('rejects every stale action, including submit, revise, and cancel', () => {
    for (const type of ['submit', 'revise', 'confirm', 'cancel'] as const) {
      expect(
        transitionIntent(intentForStatus('draft', 2), action(type, 1)),
      ).toEqual({
        ok: false,
        error: 'STALE_REVISION',
      });
    }
  });

  it('revises into a fresh draft and invalidates ready confirmation', () => {
    const ready = intentForStatus('ready');
    const result = transitionIntent(ready, action('revise'));
    expect(result).toEqual({
      ok: true,
      value: {
        ...ready,
        revision: 2,
        instruction: 'Revised task',
        steps: [{ id: 'step-revised', summary: 'Do revised work' }],
        status: 'draft',
      },
    });
    expect(
      transitionIntent(result.ok ? result.value : result, action('confirm', 2)),
    ).toEqual({
      ok: false,
      error: 'INVALID_TRANSITION',
    });
  });

  it('rejects duplicate confirmation and cancelled terminal transitions', () => {
    const reviewing = intentForStatus('reviewing');
    const confirmed = transitionIntent(reviewing, action('confirm'));
    expect(confirmed).toEqual({
      ok: true,
      value: { ...reviewing, status: 'ready' },
    });
    expect(
      transitionIntent(
        confirmed.ok ? confirmed.value : confirmed,
        action('confirm'),
      ),
    ).toEqual({
      ok: false,
      error: 'INVALID_TRANSITION',
    });
    const cancelled = transitionIntent(reviewing, action('cancel'));
    expect(cancelled).toEqual({
      ok: true,
      value: { ...reviewing, status: 'cancelled' },
    });
    for (const type of ['submit', 'revise', 'confirm', 'cancel'] as const) {
      expect(
        transitionIntent(
          cancelled.ok ? cancelled.value : cancelled,
          action(type),
        ),
      ).toEqual({
        ok: false,
        error: 'INVALID_TRANSITION',
      });
    }
  });

  it('reports revision overflow without changing the intent', () => {
    const intent = intentForStatus('ready', Number.MAX_SAFE_INTEGER);
    const result = transitionIntent(
      intent,
      action('revise', Number.MAX_SAFE_INTEGER),
    );
    expect(result).toEqual({ ok: false, error: 'REVISION_OVERFLOW' });
    expect(intent).toEqual({
      ...validIntent,
      status: 'ready',
      revision: Number.MAX_SAFE_INTEGER,
    });
  });

  it('does not mutate frozen inputs and does not share nested output objects', () => {
    const intent = Object.freeze({
      ...intentForStatus('draft'),
      steps: Object.freeze([{ ...validStep }]),
    });
    const revise = Object.freeze({
      ...action('revise'),
      steps: Object.freeze([{ id: 'new-step', summary: 'New work' }]),
    });
    const result = transitionIntent(intent, revise);
    expect(result.ok).toBe(true);
    expect(intent).toEqual({ ...validIntent, steps: [{ ...validStep }] });
    expect(revise).toEqual({
      type: 'revise',
      expectedRevision: 1,
      instruction: 'Revised task',
      steps: [{ id: 'new-step', summary: 'New work' }],
    });
    if (result.ok) {
      expect(result.value).not.toBe(intent);
      expect(result.value.steps).not.toBe(revise.steps);
      const firstOutputStep = result.value.steps[0];
      expect(firstOutputStep).toBeDefined();
      if (firstOutputStep) firstOutputStep.summary = 'Changed output only';
      expect(revise.steps[0]?.summary).toBe('New work');
    }
  });

  it('keeps review results JSON serializable and independently parsed', () => {
    const result = transitionIntent(intentForStatus('draft'), action('submit'));
    expect(result.ok).toBe(true);
    const roundTrip = JSON.parse(JSON.stringify(result)) as typeof result;
    expect(roundTrip).toEqual(result);
    if (roundTrip.ok) {
      expect(TaskIntentSchema.safeParse(roundTrip.value).success).toBe(true);
    }
  });
});
