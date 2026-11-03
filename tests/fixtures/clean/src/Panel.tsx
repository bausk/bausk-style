import { readTokens, lightweightChartsOptions } from 'bausk-style';

export function Panel({ title, live }: { title: string; live: boolean }) {
  return (
    <section className="bs-panel">
      <header className="bs-panel__head">
        <span className="bs-panel__title">{title}</span>
        <span className={live ? 'bs-tag is-positive' : 'bs-tag is-caution'}>{live ? 'live' : 'stale 2h'}</span>
      </header>
      <div className="bs-panel__body bg-bg-subtle text-fg-muted rounded-control border-hair border-line" />
    </section>
  );
}

export const chartOptions = () => lightweightChartsOptions(readTokens() as never);
