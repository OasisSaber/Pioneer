import type { CatalogWarning } from '../../shared/contracts/catalog';

export interface CatalogNoticeProps {
  warnings: CatalogWarning[];
  stale: boolean;
  error: string | null;
}

export function CatalogNotice({
  warnings,
  stale,
  error,
}: CatalogNoticeProps): React.JSX.Element | null {
  if (warnings.length === 0 && error === null) return null;

  return (
    <section
      aria-label="Catalog notice"
      className="catalog-notice"
      role="status"
    >
      {stale ? <strong>Showing the last available scan.</strong> : null}
      {error !== null ? <p>{error}</p> : null}
      {warnings.length > 0 ? (
        <ul>
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.path}`}>{warning.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
