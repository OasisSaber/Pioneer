# Demo reference policy

## Purpose

`demos/` contains M1 presentation assets, design-validation artifacts, and visual baselines. It is not the Pioneer product runtime.

These single-file HTML demonstrations are frozen reference implementations for offline review and presentation. They preserve interaction evidence while the formal product is implemented separately.

## Allowed changes

Allowed changes are limited to repairing presentation behavior, preserving offline execution, applying an explicitly approved visual baseline, or fixing accessibility, security, and factual defects.

Any visual change requires an explicit visual handoff. The active, user-managed visual authority is the [Pioneer Figma file](https://www.figma.com/design/EQis9ep9ZQsEenrUVXwlFU/Pioneer?node-id=0-1&t=j0sOVgTRV0rMWZNx-1). This repository must not write to that Figma file or add Figma credentials.

## Disallowed changes

- Do not treat a demo as evolving product code or silently expand its scope.
- Do not import these HTML files into the Electron application as runtime source.
- Do not replace the user-managed Figma authority or infer a visual handoff from the existence of a demo.
- Do not add external runtime dependencies that break double-clickable offline execution.

## Formal product

New product-domain behavior belongs in `apps/desktop`. The Electron application must not import these HTML files as runtime source.

The formal product target is the planned `apps/desktop` Electron + React + TypeScript application. Until an explicit visual handoff occurs, implementation uses engineering fallbacks and the demos remain historical reference material only.
