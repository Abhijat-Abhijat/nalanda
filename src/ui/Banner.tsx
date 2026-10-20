import { useStore } from '../engine/store';
import { STORAGE_KEY } from '../engine/persistence';

export function Banner() {
  const { status, backup, saveFailed } = useStore();
  if ((status === 'ok' || status === 'empty') && !saveFailed) return null;
  const message =
    status === 'ok' || status === 'empty' ? 'Your browser could not save your last change, for example because storage is full. Use Export on the Progress page to keep a copy.'
    : status === 'unavailable' ? 'Your browser blocks storage, so progress will not be saved. Use Export on the Progress page to keep a copy.'
    : status === 'corrupt' ? 'Saved progress could not be read. It was left untouched. Download a backup, then import or reset on the Progress page.'
    : 'Saved progress comes from a newer version of Nalanda. It was left untouched.';
  const download = () => {
    const blob = new Blob([backup ?? ''], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${STORAGE_KEY}-backup.json`;
    a.click();
  };
  return (
    <div className="banner" role="alert">
      {message} {backup && <button type="button" onClick={download}>Download backup</button>}
    </div>
  );
}
