import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../api';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import NewProjectForm from '../components/NewProjectForm';

const STATUS_LABELS = {
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  archived: 'Archived',
};

export default function Dashboard() {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  function loadProjects() {
    api
      .get('/projects')
      .then(({ data }) => setProjects(data.projects))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load projects')));
  }

  useEffect(loadProjects, []);

  async function handleCreate(payload) {
    const { data } = await api.post('/projects', payload);
    setProjects((prev) => [data.project, ...(prev || [])]);
    setShowNewProject(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">Shared by the whole team — anyone can add or update</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
          + New project
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {projects === null && !error && <p>Loading projects…</p>}

      {projects && projects.length === 0 && (
        <div className="empty-state">
          <p>No projects yet.</p>
          <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
            Create your first project
          </button>
        </div>
      )}

      <div className="project-grid">
        {projects?.map((project) => (
          <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <span className={`badge badge-${project.status}`}>
                {STATUS_LABELS[project.status] || project.status}
              </span>
            </div>
            {project.description && (
              <p className="project-card-desc">{project.description}</p>
            )}
            <ProgressBar value={project.progress} />
            <div className="project-card-footer">
              <span>{project.progress}% complete</span>
              <span>
                {project.taskCounts.done}/{project.taskCounts.total} tasks
              </span>
            </div>
            {project.dueDate && (
              <div className="project-card-due">
                Due {new Date(project.dueDate).toLocaleDateString()}
              </div>
            )}
          </Link>
        ))}
      </div>

      {showNewProject && (
        <Modal title="New project" onClose={() => setShowNewProject(false)}>
          <NewProjectForm onCreate={handleCreate} onCancel={() => setShowNewProject(false)} />
        </Modal>
      )}
    </div>
  );
}
