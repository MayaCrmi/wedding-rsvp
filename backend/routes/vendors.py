import os
from flask import Blueprint, request, jsonify, send_from_directory
from datetime import datetime
from werkzeug.utils import secure_filename
from models import get_db, UPLOADS_DIR

vendors_bp = Blueprint("vendors", __name__)

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def row_to_dict(row):
    return dict(row)


@vendors_bp.route("", methods=["GET"])
def list_vendors():
    category = request.args.get("category")
    query    = "SELECT * FROM vendors WHERE 1=1"
    params   = []

    if category:
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY created_at DESC"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([row_to_dict(r) for r in rows])


@vendors_bp.route("/summary", methods=["GET"])
def vendors_summary():
    conn = get_db()
    row = conn.execute("""
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN booking_date IS NOT NULL THEN 1 ELSE 0 END) as booked,
            COALESCE(SUM(price), 0) as total_budget,
            COALESCE(SUM(CASE WHEN deposit_paid = 1 THEN deposit_amount ELSE 0 END), 0) as deposits_paid,
            COALESCE(SUM(CASE WHEN deposit_paid = 0 AND deposit_amount > 0 THEN deposit_amount ELSE 0 END), 0) as deposits_outstanding
        FROM vendors
    """).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@vendors_bp.route("/<int:vendor_id>", methods=["GET"])
def get_vendor(vendor_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "לא נמצא"}), 404
    return jsonify(row_to_dict(row))


@vendors_bp.route("", methods=["POST"])
def create_vendor():
    data = request.get_json()
    if not data.get("business_name", "").strip():
        return jsonify({"error": "שם העסק חובה"}), 400

    conn = get_db()
    cur = conn.execute("""
        INSERT INTO vendors
          (category, business_name, contact_name, phone, email, website,
           price, deposit_amount, deposit_paid,
           booking_date, meeting_date, event_date, notes, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        data.get("category",      "other"),
        data["business_name"].strip(),
        data.get("contact_name",  ""),
        data.get("phone",         ""),
        data.get("email",         ""),
        data.get("website",       ""),
        data.get("price")         or None,
        data.get("deposit_amount") or None,
        int(data.get("deposit_paid", 0)),
        data.get("booking_date")  or None,
        data.get("meeting_date")  or None,
        data.get("event_date")    or None,
        data.get("notes",         ""),
        datetime.now().isoformat(),
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row)), 201


@vendors_bp.route("/<int:vendor_id>", methods=["PUT"])
def update_vendor(vendor_id):
    data = request.get_json()
    conn = get_db()
    existing = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404

    conn.execute("""
        UPDATE vendors SET
            category        = ?,
            business_name   = ?,
            contact_name    = ?,
            phone           = ?,
            email           = ?,
            website         = ?,
            price           = ?,
            deposit_amount  = ?,
            deposit_paid    = ?,
            booking_date    = ?,
            meeting_date    = ?,
            event_date      = ?,
            notes           = ?
        WHERE id = ?
    """, (
        data.get("category",       existing["category"]),
        data.get("business_name",  existing["business_name"]),
        data.get("contact_name",   existing["contact_name"]),
        data.get("phone",          existing["phone"]),
        data.get("email",          existing["email"]),
        data.get("website",        existing["website"]),
        data.get("price")          if "price" in data else existing["price"],
        data.get("deposit_amount") if "deposit_amount" in data else existing["deposit_amount"],
        int(data.get("deposit_paid", existing["deposit_paid"])),
        data.get("booking_date",   existing["booking_date"]) or None,
        data.get("meeting_date",   existing["meeting_date"]) or None,
        data.get("event_date",     existing["event_date"])   or None,
        data.get("notes",          existing["notes"]),
        vendor_id,
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@vendors_bp.route("/<int:vendor_id>", methods=["DELETE"])
def delete_vendor(vendor_id):
    conn = get_db()
    existing = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404

    # Remove contract file if present
    if existing["contract_path"] and os.path.exists(existing["contract_path"]):
        try:
            os.remove(existing["contract_path"])
        except OSError:
            pass

    conn.execute("DELETE FROM vendors WHERE id = ?", (vendor_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@vendors_bp.route("/<int:vendor_id>/contract", methods=["POST"])
def upload_contract(vendor_id):
    conn = get_db()
    existing = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404

    if "file" not in request.files:
        conn.close()
        return jsonify({"error": "קובץ חסר"}), 400

    file = request.files["file"]
    if not file.filename or not allowed_file(file.filename):
        conn.close()
        return jsonify({"error": "סוג קובץ לא נתמך. מותר: PDF, Word, תמונות"}), 400

    # Remove old file
    if existing["contract_path"] and os.path.exists(existing["contract_path"]):
        try:
            os.remove(existing["contract_path"])
        except OSError:
            pass

    safe_name  = secure_filename(file.filename)
    stored_name = f"vendor_{vendor_id}_{safe_name}"
    dest_path   = os.path.join(UPLOADS_DIR, stored_name)
    file.save(dest_path)

    conn.execute(
        "UPDATE vendors SET contract_filename = ?, contract_path = ? WHERE id = ?",
        (safe_name, dest_path, vendor_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@vendors_bp.route("/<int:vendor_id>/contract", methods=["GET"])
def download_contract(vendor_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    conn.close()
    if not row or not row["contract_path"]:
        return jsonify({"error": "אין חוזה מצורף"}), 404

    directory = os.path.abspath(UPLOADS_DIR)
    filename  = os.path.basename(row["contract_path"])
    return send_from_directory(directory, filename, as_attachment=True,
                               download_name=row["contract_filename"])


@vendors_bp.route("/<int:vendor_id>/contract", methods=["DELETE"])
def delete_contract(vendor_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "לא נמצא"}), 404

    if row["contract_path"] and os.path.exists(row["contract_path"]):
        try:
            os.remove(row["contract_path"])
        except OSError:
            pass

    conn.execute(
        "UPDATE vendors SET contract_filename = NULL, contract_path = NULL WHERE id = ?",
        (vendor_id,),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})
