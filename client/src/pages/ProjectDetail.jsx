import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../api';
import { PEOPLE } from '../people';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';
import NewTaskForm from '../components/NewTaskForm';

const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [newTaskStatus, setNewTaskStatus] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const loadProject = useCallback(() => {
    api
      .get(`/projects/${id}`)
      .then(({ data }) => setProject(data.project))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load project')));
  }, [id]);

  useEffect(loadProject, [loadProject]);

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <Link to="/">Back to dashboard</Link>
      </div>
    );
  }

  if (!project) {
    return <div className="page">Loading…</div>;
  }

  const taskCounts = {
    total: project.tasks.length,
    done: project.tasks.filter((t) => t.status === 'done').length,
  };
  const progress = taskCounts.total === 0 ? 0 : Math.round((taskCounts.done / taskCounts.total) * 100);

  async function handleStatusChange(e) {
    const status = e.target.value;
    const { data } = await api.put(`/projects/${id}`, { status });
    setProject((prev) => ({ ...prev, status: data.project.status }));
  }

  async function handleDeleteProject() {
    if (!window.confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return;
    await api.delete(`/projects/${id}`);
    navigate('/');
  }

  async function handleCreateTask(payload) {
    const { data } = await api.post(`/projects/${id}/tasks`, payload);
    setProject((prev) => ({ ...prev, tasks: [...prev.tasks, data.task] }));
    setNewTaskStatus(null);
  }

  async function handleUpdateTask(taskId, payload) {
    const { data } = await api.put(`/tasks/${taskId}`, payload);
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? data.task : t)),
    }));
  }

  async function handleDeleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
    setProject((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
  }

  function handleDragStart(e, task) {
    e.dataTransfer.setData('text/plain', task.id);
  }

  function handleDrop(e, columnKey) {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task || task.status === columnKey) return;
    handleUpdateTask(taskId, { status: columnKey }).catch((err) =>
      setError(apiErrorMessage(err, 'Could not move task'))
    );
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = project.tasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← All projects
      </Link>

      <div className="project-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div className="project-header-actions">
          <button className="btn btn-danger-ghost" onClick={handleDeleteProject}>
            Delete project
          </button>
        </div>
      </div>

      <div className="project-summary">
        <div className="project-summary-progress">
          <ProgressBar value={progress} />
          <span>
            {progress}% · {taskCounts.done}/{taskCounts.total} tasks done
          </span>
        </div>
        <label className="project-status-select">
          Status
          <select value={project.status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {project.dueDate && (
          <span className="project-summary-due">
            Due {new Date(project.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="board">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`board-column ${dragOverColumn === col.key ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.key);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="board-column-header">
              <h3>{col.label}</h3>
              <span className="muted">{tasksByStatus[col.key].length}</span>
            </div>

            <div className="board-column-body">
              {tasksByStatus[col.key].map((task) => (
                <TaskCard key={task.id} task={task} onClick={setActiveTask} onDragStart={handleDragStart} />
              ))}
            </div>

            <button className="btn btn-ghost btn-add-task" onClick={() => setNewTaskStatus(col.key)}>
              + Add task
            </button>
          </div>
        ))}
      </div>

      {activeTask && (
        <TaskModal
          task={activeTask}
          people={PEOPLE}
          onClose={() => setActiveTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {newTaskStatus && (
        <Modal title="New task" onClose={() => setNewTaskStatus(null)}>
          <NewTaskForm
            status={newTaskStatus}
            people={PEOPLE}
            onCreate={handleCreateTask}
            onCancel={() => setNewTaskStatus(null)}
          />
        </Modal>
      )}
    </div>
  );
}
