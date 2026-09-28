const express = require('express');
const prisma = require('../db');
const { PEOPLE, whoAmI } = require('../lib/identity');

const router = express.Router();

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function requireWho(req, res, next) {
  const who = whoAmI(req);
  if (!who) return res.status(400).json({ error: 'Unknown user' });
  req.who = who;
  next();
}

router.use(requireWho);

router.get('/projects/:projectId/tasks', async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.projectId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({ tasks });
});

router.post('/projects/:projectId/tasks', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { title, description, status, priority, dueDate, assignee } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(', ')}` });
  }
  if (assignee && !PEOPLE.includes(assignee)) {
    return res.status(400).json({ error: 'Unknown assignee' });
  }

  const maxOrder = await prisma.task.aggregate({
    where: { projectId: req.params.projectId, status: status || 'todo' },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? -1) + 1,
      projectId: req.params.projectId,
      assignee: assignee || null,
      createdBy: req.who,
    },
  });

  res.status(201).json({ task });
});

router.put('/tasks/:id', async (req, res) => {
  const { title, description, status, priority, dueDate, assignee, order } = req.body || {};

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(', ')}` });
  }
  if (assignee && !PEOPLE.includes(assignee)) {
    return res.status(400).json({ error: 'Unknown assignee' });
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(assignee !== undefined ? { assignee: assignee || null } : {}),
      ...(order !== undefined ? { order } : {}),
    },
  }).catch(() => null);

  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

router.delete('/tasks/:id', async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

// --- Comments ---

router.get('/tasks/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ comments });
});

router.post('/tasks/:id/comments', async (req, res) => {
  const { body } = req.body || {};
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  const comment = await prisma.comment
    .create({ data: { body: body.trim(), taskId: req.params.id, author: req.who } })
    .catch(() => null);

  if (!comment) return res.status(404).json({ error: 'Task not found' });
  res.status(201).json({ comment });
});

module.exports = router;
