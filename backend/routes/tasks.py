from flask import Blueprint, request, jsonify
from datetime import datetime
from models import get_db

tasks_bp = Blueprint("tasks", __name__)


def row_to_dict(row):
    return dict(row)


@tasks_bp.route("", methods=["GET"])
def list_tasks():
    completed = request.args.get("completed")
    category  = request.args.get("category")

    query  = "SELECT * FROM tasks WHERE 1=1"
    params = []

    if completed is not None:
        query += " AND completed = ?"
        params.append(int(completed))
    if category:
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY due_months_before DESC, display_order ASC"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@tasks_bp.route("", methods=["POST"])
def create_task():
    data = request.get_json()
    if not data.get("title", "").strip():
        return jsonify({"error": "כותרת חובה"}), 400

    conn = get_db()
    max_order = conn.execute("SELECT COALESCE(MAX(display_order),0) FROM tasks").fetchone()[0]
    cur = conn.execute("""
        INSERT INTO tasks
          (title, description, category, priority, due_months_before,
           completed, display_order, created_at)
        VALUES (?,?,?,?,?,0,?,?)
    """, (
        data["title"].strip(),
        data.get("description", ""),
        data.get("category", "other"),
        data.get("priority", "medium"),
        int(data.get("due_months_before", 3)),
        max_order + 1,
        datetime.now().isoformat(),
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row)), 201


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json()
    conn = get_db()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404

    new_completed = data.get("completed", existing["completed"])
    completed_at  = existing["completed_at"]
    if new_completed and not existing["completed"]:
        completed_at = datetime.now().isoformat()
    elif not new_completed:
        completed_at = None

    conn.execute("""
        UPDATE tasks SET
            title              = ?,
            description        = ?,
            category           = ?,
            priority           = ?,
            due_months_before  = ?,
            completed          = ?,
            completed_at       = ?,
            display_order      = ?
        WHERE id = ?
    """, (
        data.get("title",             existing["title"]),
        data.get("description",       existing["description"]),
        data.get("category",          existing["category"]),
        data.get("priority",          existing["priority"]),
        int(data.get("due_months_before", existing["due_months_before"])),
        int(new_completed),
        completed_at,
        int(data.get("display_order", existing["display_order"])),
        task_id,
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db()
    if not conn.execute("SELECT id FROM tasks WHERE id = ?", (task_id,)).fetchone():
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@tasks_bp.route("/summary", methods=["GET"])
def tasks_summary():
    conn = get_db()
    row = conn.execute("""
        SELECT
            COUNT(*) as total,
            SUM(completed) as done,
            COUNT(*) - SUM(completed) as remaining
        FROM tasks
    """).fetchone()
    # Next 3 incomplete tasks ordered by urgency (fewest months = most urgent)
    upcoming = conn.execute("""
        SELECT id, title, category, priority, due_months_before
        FROM tasks
        WHERE completed = 0
        ORDER BY due_months_before ASC, display_order ASC
        LIMIT 3
    """).fetchall()
    conn.close()
    return jsonify({
        "total":     row["total"],
        "done":      row["done"] or 0,
        "remaining": row["remaining"] or 0,
        "upcoming":  [row_to_dict(r) for r in upcoming],
    })
