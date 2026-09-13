# M2 push and checkout rename runbook

## Status

**Retired. No checkout rename is required.**

The clean-room repository rebuild established the canonical checkout as:

`D:\\Projects\\Pioneer`

The previous version of this runbook contained identical source and destination paths. That was a stale migration artifact and must not be executed.

## Remaining post-M2 verification

After an explicitly authorized push, verify the canonical checkout in place:

```powershell
jj status
git remote -v
pnpm check
```

Requirements:

1. `jj status` must show the expected reviewed working-copy state.
2. `git remote -v` must point to the intended `OasisSaber/Pioneer` repository.
3. `pnpm check` must pass from `D:\\Projects\\Pioneer`.
4. Do not rename, move, merge, overwrite, or delete the checkout as part of M2 closure.

## Stop conditions

Stop without improvising if the remote moved unexpectedly, the checkout path differs from the canonical path, or any verification command fails. Do not perform a destructive cleanup, force push, remote rewrite, or alternate-path migration as a workaround.
