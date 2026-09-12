# M2 push and checkout rename runbook

## Status and authority

This is a non-executing, post-delivery operational runbook. The M2 implementation plan must not execute any command below automatically. Use it only after the reviewed M2 change is locally sealed and a human gives explicit authorization to push and rename the checkout.

## Preconditions

1. Obtain explicit human authorization for the remote push. Local implementation or review approval is not push authorization.
2. Fetch and verify the fresh remote state immediately before pushing. Confirm the intended remote, target bookmark/branch, and absence of an unexpected remote advance.
3. Push only the reviewed, locally sealed change. Stop and ask if remote verification differs from the reviewed baseline.
4. Confirm that the push succeeded and that the expected remote revision is visible before considering a local checkout rename.

## Controlled checkout rename

1. Close Codex, terminals, editors, Electron, Node, test runners, file explorers, and any other process holding the checkout.
2. Verify that the source is exactly `D:\Projects\Pioneer` and the destination is exactly its sibling `D:\Projects\Pioneer`.
3. Confirm the destination does not already exist. Do not merge, overwrite, delete, or rename any other path.
4. Rename only that exact source directory to that exact destination directory.
5. Reopen the repository from `D:\Projects\Pioneer`.

## Post-rename verification

From the reopened checkout, run:

```powershell
jj status
git remote -v
pnpm check
```

Require all three to finish successfully. A directory rename alone is not proof that the checkout, remote identity, dependencies, Electron launch, or full quality gate still works.

## Stop conditions

Stop without improvising if authorization is missing, the remote moved, the destination exists, a process still holds the checkout, the exact sibling paths differ, or any post-rename command fails. Do not perform a destructive cleanup, force push, remote rewrite, or alternate-path rename as a workaround.
