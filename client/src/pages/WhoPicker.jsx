import { PEOPLE } from '../people';
import { useWho } from '../context/WhoContext';
import Avatar from '../components/Avatar';

export default function WhoPicker() {
  const { setWho } = useWho();

  return (
    <div className="who-page">
      <div className="who-card">
        <h1>Who's this?</h1>
        <p>Pick your name to continue — it's used to attribute the tasks and comments you add.</p>
        <div className="who-buttons">
          {PEOPLE.map((name) => (
            <button key={name} className="who-btn" onClick={() => setWho(name)}>
              <Avatar name={name} size="lg" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
