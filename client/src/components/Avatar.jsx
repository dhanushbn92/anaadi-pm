import { colorFor, initialsFor } from '../people';

export default function Avatar({ name, size = 'md' }) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: colorFor(name) }}>
      {initialsFor(name)}
    </span>
  );
}
