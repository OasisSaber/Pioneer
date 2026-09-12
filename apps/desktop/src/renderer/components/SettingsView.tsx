import type { CatalogWarning } from '../../shared/contracts/catalog';
import { CatalogNotice } from './CatalogNotice';

export interface SettingsViewProps {
  rootPath: string | null;
  chooseRoot: () => Promise<void>;
  error: string | null;
  stale: boolean;
  warnings: CatalogWarning[];
  busy: boolean;
}

const applicationVersion = '0.1.0';
const buildMode =
  process.env.NODE_ENV === 'production' ? 'Production' : 'Development';

export function SettingsView({
  rootPath,
  chooseRoot,
  error,
  stale,
  warnings,
  busy,
}: SettingsViewProps): React.JSX.Element {
  return (
    <section
      aria-busy={busy}
      aria-labelledby="settings-title"
      className="settings-view"
    >
      <h1 id="settings-title">Settings</h1>
      <CatalogNotice error={error} stale={stale} warnings={warnings} />
      <dl className="metadata-list">
        <div>
          <dt>Current workspace</dt>
          <dd className="path-text">{rootPath ?? 'No workspace selected'}</dd>
        </div>
        <div>
          <dt>Application version</dt>
          <dd>{applicationVersion}</dd>
        </div>
        <div>
          <dt>Build mode</dt>
          <dd>{buildMode}</dd>
        </div>
      </dl>
      <button
        className="button button--primary"
        disabled={busy}
        onClick={() => void chooseRoot()}
        type="button"
      >
        Change workspace
      </button>
      {busy ? (
        <p aria-live="polite" role="status">
          Changing workspace…
        </p>
      ) : null}
    </section>
  );
}
