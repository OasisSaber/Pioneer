import { z } from 'zod';

const MAX_ID_LENGTH = 256;
const MAX_INSTRUCTION_LENGTH = 16_384;
const MAX_STEP_SUMMARY_LENGTH = 2_048;

const nonBlankString = (maxLength: number) =>
  z
    .string()
    .max(maxLength)
    .superRefine((value, context) => {
      if (value.trim().length === 0) {
        context.addIssue({
          code: 'custom',
          message: 'Value must not be blank.',
        });
      }
    });

const positiveSafeInteger = z
  .number()
  .refine(
    (value) => Number.isSafeInteger(value) && value > 0,
    'Expected a positive safe integer.',
  );

export const TaskIntentStatusSchema = z.enum([
  'draft',
  'reviewing',
  'ready',
  'cancelled',
]);

export const TaskIntentStepSchema = z
  .object({
    id: nonBlankString(MAX_ID_LENGTH),
    summary: nonBlankString(MAX_STEP_SUMMARY_LENGTH),
  })
  .strict();

export const TaskIntentStepsSchema = z
  .array(TaskIntentStepSchema)
  .min(1)
  .max(100)
  .superRefine((steps, context) => {
    const ids = new Set<string>();
    steps.forEach((step, index) => {
      if (ids.has(step.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: 'Step ids must be unique.',
        });
      }
      ids.add(step.id);
    });
  });

export const TaskIntentSchema = z
  .object({
    id: nonBlankString(MAX_ID_LENGTH),
    projectId: nonBlankString(MAX_ID_LENGTH),
    revision: positiveSafeInteger,
    instruction: nonBlankString(MAX_INSTRUCTION_LENGTH),
    steps: TaskIntentStepsSchema,
    status: TaskIntentStatusSchema,
  })
  .strict();

const expectedRevision = { expectedRevision: positiveSafeInteger };

const SubmitActionSchema = z
  .object({ type: z.literal('submit'), ...expectedRevision })
  .strict();
const ReviseActionSchema = z
  .object({
    type: z.literal('revise'),
    ...expectedRevision,
    instruction: nonBlankString(MAX_INSTRUCTION_LENGTH),
    steps: TaskIntentStepsSchema,
  })
  .strict();
const ConfirmActionSchema = z
  .object({ type: z.literal('confirm'), ...expectedRevision })
  .strict();
const CancelActionSchema = z
  .object({ type: z.literal('cancel'), ...expectedRevision })
  .strict();

export const IntentActionSchema = z.discriminatedUnion('type', [
  SubmitActionSchema,
  ReviseActionSchema,
  ConfirmActionSchema,
  CancelActionSchema,
]);

export type TaskIntentStatus = z.infer<typeof TaskIntentStatusSchema>;
export type TaskIntentStep = z.infer<typeof TaskIntentStepSchema>;
export type TaskIntent = z.infer<typeof TaskIntentSchema>;
export type IntentAction = z.infer<typeof IntentActionSchema>;

export const INTENT_ERROR_CODES = [
  'INVALID_INTENT',
  'INVALID_ACTION',
  'STALE_REVISION',
  'INVALID_TRANSITION',
  'REVISION_OVERFLOW',
] as const;

export const IntentErrorCodeSchema = z.enum(INTENT_ERROR_CODES);
export type IntentErrorCode = z.infer<typeof IntentErrorCodeSchema>;

export type IntentResult =
  { ok: true; value: TaskIntent } | { ok: false; error: IntentErrorCode };
