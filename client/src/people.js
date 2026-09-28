export const PEOPLE = ['Dhanush', 'Rishi', 'Keshav'];

const COLORS = { Dhanush: '#1F6F65', Rishi: '#B9822C', Keshav: '#6E5B9E' };

export function colorFor(name) {
  return COLORS[name] || '#8FA79C';
}

export function initialsFor(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}
