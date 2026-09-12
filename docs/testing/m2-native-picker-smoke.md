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
