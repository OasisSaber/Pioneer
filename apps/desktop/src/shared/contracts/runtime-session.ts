import { z } from 'zod';

import { TaskIntentSchema } from './task-intent';

const MAX_SESSION_ID_LENGTH = 512;
const MAX_PROJECT_ID_LENGTH = 256;

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

export const ReadyTaskIntentSchema = TaskIntentSchema.extend({
  status: z.literal('ready'),
}).strict();

export const runtimeSessionIdForIntent = (intent: {
  id: string;
  revision: number;
}): string => `session:${intent.id}:r${String(intent.revision)}`;

export const RuntimeSessionCapabilitiesSchema = z
  .object({
    modelAccess: z.literal(false),
    toolExecution: z.literal(false),
    fileMutation: z.literal(false),
  })
  .strict();

export const RuntimeSessionSchema = z
  .object({
    id: nonBlankString(MAX_SESSION_ID_LENGTH),
    projectId: nonBlankString(MAX_PROJECT_ID_LENGTH),
    approvedIntent: ReadyTaskIntentSchema,
    status: z.literal('initialized'),
    capabilities: RuntimeSessionCapabilitiesSchema,
  })
  .strict()
  .superRefine((session, context) => {
    if (session.projectId !== session.approvedIntent.projectId) {
      context.addIssue({
        code: 'custom',
        path: ['projectId'],
        message: 'Runtime session project must match the approved intent.',
      });
    }

    if (session.id !== runtimeSessionIdForIntent(session.approvedIntent)) {
      context.addIssue({
        code: 'custom',
        path: ['id'],
        message: 'Runtime session id must match the approved intent revision.',
      });
    }
  });

export const RUNTIME_SESSION_ERROR_CODES = [
  'INVALID_INTENT',
  'INTENT_NOT_READY',
] as const;

export const RuntimeSessionErrorCodeSchema = z.enum(
  RUNTIME_SESSION_ERROR_CODES,
);

export type ReadyTaskIntent = z.infer<typeof ReadyTaskIntentSchema>;
export type RuntimeSessionCapabilities = z.infer<
  typeof RuntimeSessionCapabilitiesSchema
>;
export type RuntimeSession = z.infer<typeof RuntimeSessionSchema>;
export type RuntimeSessionErrorCode = z.infer<
  typeof RuntimeSessionErrorCodeSchema
>;

export type RuntimeSessionResult =
  | { ok: true; value: RuntimeSession }
  | { ok: false; error: RuntimeSessionErrorCode };
