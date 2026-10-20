import type { WorldState } from '../content/load';

// Shown while a world's lessons are downloading, or if the download failed.
export function WorldStatus({ state }: { state: WorldState }) {
  if (state.status === 'error') {
    return <p className="feedback bad" role="alert">This world could not be loaded. Check your connection and reload the page.</p>;
  }
  return <p className="muted" role="status">Loading...</p>;
}
