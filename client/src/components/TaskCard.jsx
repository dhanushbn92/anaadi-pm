import Avatar from './Avatar';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

export default function TaskCard({ task, onClick, onDragStart }) {
  const overdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
    >
      <div className="task-card-top">
        <span className={`priority-dot priority-${task.priority}`} title={`${PRIORITY_LABELS[task.priority]} priority`} />
        <span className="task-card-title">{task.title}</span>
      </div>
      <div className="task-card-meta">
        {task.assignee ? (
          <span className="task-card-assignee">
            <Avatar name={task.assignee} size="sm" /> {task.assignee}
          </span>
        ) : (
          <span />
        )}
        {task.dueDate && (
          <span className={`task-card-due ${overdue ? 'overdue' : ''}`}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
