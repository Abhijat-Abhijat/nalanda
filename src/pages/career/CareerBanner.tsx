import { useCareer } from '../../career/store';
import { downloadText } from './download';

// Career-data health notice, shown on every page (mirrors the progress Banner).
export default function CareerBanner() {
  const { status, backup, saveFailed, error } = useCareer();
  if (status === 'corrupt') {
    return (
      <p className="notice" role="status">
        Your saved career data could not be read. It has not been changed, and new career changes are not saved until you import a backup or reset it in Career data.{' '}
        {backup ? <button className="btn" onClick={() => downloadText('nalanda-career-unreadable.json', backup, 'application/json')}>Download saved data</button> : null}
      </p>
    );
  }
  if (status === 'unavailable') return <p className="notice" role="status">This browser is blocking storage, so career changes are not saved after you close the tab.</p>;
  if (saveFailed) return <p className="notice" role="status">Your last career change was not saved. Storage may be full; export your career data as a backup.</p>;
  if (error) return <p className="notice" role="status">{error}</p>;
  return null;
}
