const express = require('express');
const prisma = require('../db');
const { whoAmI } = require('../lib/identity');

const router = express.Router();

function requireWho(req, res, next) {
  const who = whoAmI(req);
  if (!who) return res.status(400).json({ error: 'Unknown user' });
  req.who = who;
  next();
}

function withProgress(project) {
  const tasks = project.tasks || [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  return {
    ...project,
    taskCounts: {
      total,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      done,
    },
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

router.use(requireWho);

router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    include: { tasks: { select: { status: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ projects: projects.map(withProgress) });
});

router.post('/', async (req, res) => {
  const { name, description, status, dueDate } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description || null,
      status: status || 'active',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.who,
    },
    include: { tasks: { select: { status: true } } },
  });

  res.status(201).json({ project: withProgress(project) });
});

router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { tasks: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project: withProgress(project) });
});

router.put('/:id', async (req, res) => {
  const { name, description, status, dueDate } = req.body || {};
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    include: { tasks: { select: { status: true } } },
  }).catch(() => null);

  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project: withProgress(project) });
});

router.delete('/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

module.exports = router;
