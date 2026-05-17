import { useState, useEffect, useCallback } from "react";
import type { Task, TaskCategory, TaskPriority, TaskFormData } from "../../types";
import {
  PRIORITY_LABELS, TASK_CATEGORY_LABELS, TASK_CATEGORY_ICONS,
  dueMonthsLabel,
} from "../../types";
import { fetchTasks, createTask, updateTask, deleteTask } from "../../api/client";
import TaskModal from "./TaskModal";

// Groups ordered from most urgent to furthest
const GROUP_ORDER = [1, 3, 6, 9, 14];

function groupTasks(tasks: Task[]): { label: string; months: number; tasks: Task[] }[] {
  const map = new Map<number, Task[]>();
  for (const t of tasks) {
    // Normalize to nearest bucket
    let bucket = 1;
    if (t.due_months_before >= 12) bucket = 14;
    else if (t.due_months_before >= 9) bucket = 9;
    else if (t.due_months_before >= 6) bucket = 6;
    else if (t.due_months_before >= 3) bucket = 3;
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(t);
  }
  return GROUP_ORDER
    .filter((m) => map.has(m))
    .map((m) => ({ label: dueMonthsLabel(m), months: m, tasks: map.get(m)! }));
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   "badge-declined",
  medium: "badge-pending",
  low:    "badge-family",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "">("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [editTask, setEditTask] = useState<Task | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { category?: string } = {};
      if (filterCategory) params.category = filterCategory;
      const data = await fetchTasks(params);
      setTasks(data);
    } catch {
      setError("שגיאה בטעינת המשימות");
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (task: Task) => {
    try {
      const updated = await updateTask(task.id, { completed: task.completed ? 0 : 1 });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError("שגיאה בעדכון המשימה");
    }
  };

  const handleSave = async (data: TaskFormData) => {
    if (editTask) {
      const updated = await updateTask(editTask.id, data);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await createTask(data);
      setTasks((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirm(null);
  };

  const toggleGroup = (months: number) =>
    setCollapsedGroups((s) => {
      const n = new Set(s);
      n.has(months) ? n.delete(months) : n.add(months);
      return n;
    });

  const displayed = showCompleted ? tasks : tasks.filter((t) => !t.completed);
  const groups    = groupTasks(displayed);
  const total     = tasks.length;
  const done      = tasks.filter((t) => t.completed).length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  const categories = Array.from(new Set(tasks.map((t) => t.category))) as TaskCategory[];

  return (
    <div>
      <h2 className="page-title">📋 רשימת משימות</h2>

      {/* Progress */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span className="card-title" style={{ marginBottom: 0 }}>התקדמות כללית</span>
          <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--deep)" }}>{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #6aaa85, #3d8f65)" }} />
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          <span>✅ הושלמו: <strong style={{ color: "var(--deep)" }}>{done}</strong></span>
          <span>⏳ נותרו: <strong style={{ color: "var(--deep)" }}>{total - done}</strong></span>
          <span>סה״כ: <strong style={{ color: "var(--deep)" }}>{total}</strong></span>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="filters-bar" style={{ marginBottom: "1rem" }}>
        <select className="form-control" value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TaskCategory | "")}>
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c} value={c}>{TASK_CATEGORY_ICONS[c]} {TASK_CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
          <input
            type="checkbox"
            className="checkbox-custom"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          הצג משימות שהושלמו
        </label>
      </div>

      <div className="filters-actions">
        <button className="btn btn-primary" onClick={() => setEditTask(null)}>
          ➕ הוסף משימה
        </button>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "auto" }}>
          {loading ? "טוען..." : `${displayed.length} משימות מוצגות`}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>אין משימות להצגה</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setEditTask(null)}>
            הוסף משימה ראשונה
          </button>
        </div>
      )}

      {/* Grouped task list */}
      {groups.map(({ label, months, tasks: groupTasks }) => {
        const collapsed  = collapsedGroups.has(months);
        const groupDone  = groupTasks.filter((t) => t.completed).length;
        const groupTotal = groupTasks.length;

        return (
          <div key={months} className="task-group">
            <button
              className="task-group-header"
              onClick={() => toggleGroup(months)}
            >
              <span className="task-group-chevron">{collapsed ? "▶" : "▼"}</span>
              <span className="task-group-label">{label}</span>
              <span className="task-group-count">
                {groupDone}/{groupTotal}
                {groupDone === groupTotal && groupTotal > 0 && (
                  <span style={{ marginRight: 6, color: "var(--status-attending)" }}>✓</span>
                )}
              </span>
            </button>

            {!collapsed && (
              <div className="task-list">
                {groupTasks.map((task) => (
                  <div key={task.id} className={`task-item${task.completed ? " task-done" : ""}`}>
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={!!task.completed}
                      onChange={() => handleToggle(task)}
                    />
                    <span className="task-icon">{TASK_CATEGORY_ICONS[task.category]}</span>
                    <div className="task-body">
                      <span className="task-title">{task.title}</span>
                      {task.description && (
                        <span className="task-desc">{task.description}</span>
                      )}
                    </div>
                    <div className="task-meta">
                      <span className={`badge ${PRIORITY_COLORS[task.priority]}`} style={{ fontSize: "0.7rem" }}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span className="badge badge-other" style={{ fontSize: "0.7rem" }}>
                        {TASK_CATEGORY_LABELS[task.category]}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => setEditTask(task)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(task.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ מחיקת משימה</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
              האם למחוק את המשימה? הפעולה לא ניתנת לביטול.
            </p>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>מחק</button>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Task modal */}
      {editTask !== undefined && (
        <TaskModal
          task={editTask}
          onSave={handleSave}
          onClose={() => setEditTask(undefined)}
        />
      )}
    </div>
  );
}
