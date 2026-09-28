require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const { PEOPLE } = require('./lib/identity');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/people', (req, res) => res.json({ people: PEOPLE }));

app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes); // exposes /api/projects/:id/tasks, /api/tasks/:id, /api/tasks/:id/comments

// Serve the built React app (client/dist) in production, so one process
// handles both the API and the page.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
