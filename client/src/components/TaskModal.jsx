import { useEffect, useState } from 'react';
import Modal from './Modal';
import api, { apiErrorMessage } from '../api';
import { useWho } from '../context/WhoContext';

export default function TaskModal({ task, people, onClose, onUpdate, onDelete }) {
  const { who } = useWho();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [comments, setComments] = useState(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    api
      .get(`/tasks/${task.id}/comments`)
      .then(({ data }) => setComments(data.comments))
      .catch(() => setComments([]));
  }, [task.id]);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title,
        description,
        status,
        priority,
        assignee: assignee || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save task'));
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete task'));
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentError('');
    try {
      const { data } = await api.post(`/tasks/${task.id}/comments`, { body: commentBody });
      setComments((prev) => [...prev, data.comment]);
      setCommentBody('');
    } catch (err) {
      setCommentError(apiErrorMessage(err, 'Could not add comment'));
    }
  }

  return (
    <Modal title="Task details" onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <div className="form-row">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Assignee
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {people.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>

      <div className="form-actions form-actions-split">
        <button type="button" className="btn btn-danger-ghost" onClick={handleDelete}>
          Delete task
        </button>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <hr className="modal-divider" />

      <h3 className="comments-heading">Comments</h3>
      <div className="comments-list">
        {comments === null && <p className="muted">Loading comments…</p>}
        {comments?.length === 0 && <p className="muted">No comments yet.</p>}
        {comments?.map((c) => (
          <div className="comment" key={c.id}>
            <div className="comment-meta">
              <strong>{c.author}</strong>
              <span className="muted">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <p>{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddComment} className="comment-form">
        {commentError && <div className="alert alert-error">{commentError}</div>}
        <textarea
          rows={2}
          placeholder={`Comment as ${who}…`}
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          Add comment
        </button>
      </form>
    </Modal>
  );
}
