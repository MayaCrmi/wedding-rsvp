import time
import random
from datetime import datetime
from flask import Blueprint, request, jsonify

from models import get_db, validate_israeli_phone

messages_bp = Blueprint("messages", __name__)


@messages_bp.route("/send", methods=["POST"])
def mock_send():
    """
    Mock-send RSVP invitations to a list of guest IDs.
    Returns per-guest send results (success/fail based on phone validity).
    Does NOT actually send any messages.
    """
    data = request.get_json()
    guest_ids = data.get("guest_ids", [])
    template = data.get("template", "")

    if not guest_ids:
        return jsonify({"error": "לא נבחרו מוזמנים"}), 400
    if not template.strip():
        return jsonify({"error": "הודעה ריקה"}), 400

    conn = get_db()
    placeholders = ",".join("?" * len(guest_ids))
    rows = conn.execute(
        f"SELECT id, name, phone, phone_valid FROM guests WHERE id IN ({placeholders})",
        guest_ids,
    ).fetchall()

    results = []
    success_ids = []
    now = datetime.now().isoformat()

    for row in rows:
        phone_valid = bool(row["phone_valid"])
        if phone_valid:
            success_ids.append(row["id"])
            results.append({
                "id": row["id"],
                "name": row["name"],
                "phone": row["phone"],
                "status": "success",
                "message": "נשלח בהצלחה",
            })
        else:
            results.append({
                "id": row["id"],
                "name": row["name"],
                "phone": row["phone"] or "—",
                "status": "failed",
                "message": "נכשל — מספר לא תקין",
            })

    if success_ids:
        placeholders2 = ",".join("?" * len(success_ids))
        conn.execute(
            f"UPDATE guests SET invited_at = ? WHERE id IN ({placeholders2})",
            [now] + success_ids,
        )

    # Save message log
    conn.execute(
        "INSERT INTO messages (template_text, sent_at, recipient_count) VALUES (?,?,?)",
        (template, now, len(success_ids)),
    )

    conn.commit()
    conn.close()

    return jsonify({
        "results": results,
        "total": len(results),
        "success_count": len(success_ids),
        "failed_count": len(results) - len(success_ids),
    })


@messages_bp.route("/history", methods=["GET"])
def message_history():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM messages ORDER BY sent_at DESC LIMIT 20"
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])
