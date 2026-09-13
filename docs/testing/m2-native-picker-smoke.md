# M2 Windows native picker smoke

This document records manual Windows picker evidence only. Automated build or launch logs are not substitutes for native picker interaction.

## Evidence record — 2026-09-05

- Application build: Pioneer `0.1.0`, Task 6 working copy based on content commit `27aa01012d67`
- Platform: Windows
- Disposable test roots: not selected
- Console status: not observed

| Case                                                                               | Observed outcome                                                                                            | Status  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- |
| Cancel leaves the current catalog unchanged                                        | Native picker interaction was not executed.                                                                 | Pending |
| Selecting a valid root loads only its immediate child directories                  | Native picker interaction was not executed.                                                                 | Pending |
| Switching roots replaces the current catalog                                       | Native picker interaction was not executed.                                                                 | Pending |
| Selecting an unreadable or unavailable disposable root shows a recoverable message | No disposable error root was created or selected; no production workspace was used to manufacture an error. | Pending |

No manual/native-picker pass is claimed for this record.

## Follow-up evidence and deferral — 2026-09-09

- User-supplied screenshot shows the native selection result loaded at `D:\Project\SandBox` with project cards. This proves visible catalog loading, not immediate-child-only coverage.
- After being asked to use Change workspace and cancel, the user replied "通过". Cancellation preserving the path and cards is therefore **PASS (user-reported)**, not agent-operated proof.
- Immediate-child-only verification, switching roots, and unavailable-root recovery remain **Pending (user deferred)**.
- User explicitly requested "跳过验收继续开发". This authorizes deferring remaining manual checks to continue development; it does not convert them to passes or establish complete M2 acceptance.
- Earlier Computer Use attempts were blocked by native-dialog targeting and provide no additional passes. No current build identity or console-clean claim is inferred from the screenshot.


## Remote M2 gate evidence — 2026-09-13

A Windows GitHub Actions run on the hardened M2 branch completed the authoritative automated gate successfully:

- Workflow: `M2 Quality Gate`
- Run ID: `34728719901`
- Platform: GitHub-hosted Windows Server 2025
- `pnpm verify:repository`: **PASS**
- `pnpm check`: **PASS**
- Real Electron E2E therefore passed for the committed deterministic picker seam, including immediate-child discovery, root switching, unavailable-root recovery, fixture immutability, and tab behavior.

This automated evidence does **not** operate the native Windows directory dialog. The native-picker evidence boundary remains intentionally separate.

### Remaining native-dialog closure

The following three cases still require one human-operated Windows smoke pass against the reviewed build:

| Case | Automated behavior evidence | Native dialog evidence |
| --- | --- | --- |
| Selecting a valid root loads only its immediate child directories | PASS via Real Electron E2E | Pending |
| Switching roots replaces the current catalog | PASS via Real Electron E2E | Pending |
| Selecting an unavailable disposable root shows a recoverable message | PASS via Real Electron E2E | Pending |

Cancellation already has the 2026-09-09 **PASS (user-reported)** evidence above.

Until these three native-dialog interactions are observed, M2 should remain `IN PROGRESS`; the automated gate alone must not be described as complete native-picker acceptance.
