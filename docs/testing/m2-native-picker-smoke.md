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

## M2 final-gate handoff — 2026-09-13

The remote M2 repair branch is `fix/m2-final-gate`. Automated Electron E2E continues to exercise the deterministic picker seam, but the following three cases still require a human to interact with the real Windows native directory picker. Do not mark them PASS from CI evidence alone.

### Required disposable roots

Prepare two disposable folders outside the Pioneer checkout, for example:

```text
D:\Temp\PioneerPickerA\alpha-project\
D:\Temp\PioneerPickerA\nested-container\not-an-immediate-project\
D:\Temp\PioneerPickerB\beta-project\
```

Add a small `README.md` or `package.json` inside `alpha-project` and `beta-project`. Do not use a production workspace to manufacture failure cases.

### G1 · Immediate-child-only discovery

1. Launch the reviewed build from `fix/m2-final-gate`.
2. Use the real **Change workspace** button.
3. In the native picker, select `D:\Temp\PioneerPickerA`.
4. Confirm that `alpha-project` and `nested-container` are discovered as immediate child directories.
5. Confirm that `not-an-immediate-project` is **not** promoted to a separate top-level project card.
6. Record the observed root path and visible project-card names.

Status: **PASS — human-observed**.

Observed on Windows:
- Selected root: `D:\Temp\PioneerPickerA`
- Visible cards: `alpha-project`, `nested-container`
- Nested project not promoted: yes

### G2 · Switching roots replaces the catalog

1. Starting from `PioneerPickerA`, choose **Change workspace** again.
2. Select `D:\Temp\PioneerPickerB` in the real native picker.
3. Confirm that the displayed root changes to `PioneerPickerB`.
4. Confirm that `beta-project` appears.
5. Confirm that the `PioneerPickerA` cards disappear instead of being merged into the new catalog.

Status: **PASS — human-observed**.

Observed on Windows:
- Previous root: `D:\Temp\PioneerPickerA`
- New root: `D:\Temp\PioneerPickerB`
- Visible cards after switch: `beta-project`
- Previous cards retained: no

### G3 · Unavailable-root recovery

Use a disposable root only:

1. Select a disposable workspace through the native picker and confirm it loads.
2. Close Pioneer.
3. Rename or remove that disposable root outside Pioneer.
4. Reopen Pioneer.
5. Confirm that the app reports the workspace root as unavailable without crashing or mutating another workspace.
6. Use **Change workspace** to select a valid disposable root and confirm normal recovery.

Status: **PASS — human-observed**.

Observed on Windows:
- Remembered root renamed while app closed (`D:\Temp\PioneerPickerB.offline`)
- Application reopened without crash
- Unavailable-root state shown
- Change workspace remained functional
- Recovery root: `D:\Temp\PioneerPickerA`

### Acceptance boundary

M2 may be marked complete only when:

- G1, G2, and G3 have human-observed PASS evidence;
- the Windows CI quality gate passes on the reviewed revision;
- the final diff has been independently reviewed;
- no merge or publication claim is made without the human authorization required by `AGENTS.md`.
