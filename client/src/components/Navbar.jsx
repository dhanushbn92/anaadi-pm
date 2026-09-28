import { Link } from 'react-router-dom';
import { useWho } from '../context/WhoContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { who, setWho } = useWho();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Anaadi PM
      </Link>
      <div className="navbar-user">
        <Avatar name={who} size="sm" />
        <span className="navbar-name">{who}</span>
        <button className="btn btn-ghost btn-small" onClick={() => setWho(null)}>
          Switch
        </button>
      </div>
    </header>
  );
}
