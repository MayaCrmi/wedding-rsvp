import { useState, useEffect } from "react";
import type { Task, TaskCategory, TaskPriority, TaskFormData } from "../../types";
import {
  PRIORITY_LABELS, TASK_CATEGORY_LABELS, TASK_CATEGORY_ICONS,
} from "../../types";

interface Props {
  task?: Task | null;
  onSave: (data: TaskFormData) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: TaskCategory[] = [
  "venue","catering","photography","music","attire",
  "beauty","flowers","invitations","legal","honeymoon","other",
];

const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];

const DUE_OPTIONS = [
  { value: 14, label: "12+ חודשים לפני" },
  { value: 9,  label: "9 חודשים לפני" },
  { value: 6,  label: "6 חודשים לפני" },
  { value: 3,  label: "3 חודשים לפני" },
  { value: 1,  label: "חודש לפני" },
];

const DEFAULT: TaskFormData = {
  title: "", description: "", category: "other",
  priority: "medium", due_months_before: 3,
};

export default function TaskModal({ task, onSave, onClose }: Props) {
  const [form, setForm] = useState<TaskFormData>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setForm({
        title:             task.title,
        description:       task.description || "",
        category:          task.category,
        priority:          task.priority,
        due_months_before: task.due_months_before,
      });
    } else {
      setForm(DEFAULT);
    }
  }, [task]);

  const set = (key: keyof TaskFormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("כותרת חובה"); return; }
    setSaving(true); setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {task ? "✏️ עריכת משימה" : "➕ משימה חדשה"}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת *</label>
            <input
              className="form-control"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="תיאור קצר של המשימה"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">תיאור / הערות</label>
            <textarea
              className="form-control"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="פרטים נוספים..."
              rows={3}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">קטגוריה</label>
              <select className="form-control" value={form.category}
                onChange={(e) => set("category", e.target.value as TaskCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {TASK_CATEGORY_ICONS[c]} {TASK_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">עדיפות</label>
              <select className="form-control" value={form.priority}
                onChange={(e) => set("priority", e.target.value as TaskPriority)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">מתי לבצע</label>
              <select className="form-control" value={form.due_months_before}
                onChange={(e) => set("due_months_before", parseInt(e.target.value))}>
                {DUE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "שומר..." : task ? "שמור שינויים" : "הוסף משימה"}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}
