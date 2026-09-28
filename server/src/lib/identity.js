const PEOPLE = ['Dhanush', 'Rishi', 'Keshav'];

// No accounts, no passwords: the client sends who it's acting as in a
// header, and every one of the three people can read and write everything.
function whoAmI(req) {
  const name = req.header('X-User-Name');
  return PEOPLE.includes(name) ? name : null;
}

module.exports = { PEOPLE, whoAmI };
