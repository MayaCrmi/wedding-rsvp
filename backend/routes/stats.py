from flask import Blueprint, jsonify
from models import get_db

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("", methods=["GET"])
def get_stats():
    conn = get_db()

    # Overall RSVP counts
    status_rows = conn.execute("""
        SELECT rsvp_status, COUNT(*) as count, SUM(party_size) as total_people
        FROM guests
        GROUP BY rsvp_status
    """).fetchall()

    status_map = {r["rsvp_status"]: {"count": r["count"], "people": r["total_people"] or 0}
                  for r in status_rows}

    # By side
    side_rows = conn.execute("""
        SELECT side, rsvp_status, COUNT(*) as count, SUM(party_size) as total_people
        FROM guests
        GROUP BY side, rsvp_status
    """).fetchall()

    sides = {"bride": {}, "groom": {}}
    for r in side_rows:
        sides[r["side"]][r["rsvp_status"]] = {
            "count": r["count"],
            "people": r["total_people"] or 0,
        }

    # By group
    group_rows = conn.execute("""
        SELECT grp, rsvp_status, COUNT(*) as count, SUM(party_size) as total_people
        FROM guests
        GROUP BY grp, rsvp_status
    """).fetchall()

    groups: dict = {}
    for r in group_rows:
        g = r["grp"]
        if g not in groups:
            groups[g] = {}
        groups[g][r["rsvp_status"]] = {
            "count": r["count"],
            "people": r["total_people"] or 0,
        }

    totals = conn.execute("""
        SELECT
            COUNT(*) as total_guests,
            SUM(party_size) as total_people,
            SUM(CASE WHEN rsvp_status = 'attending' THEN party_size ELSE 0 END) as attending_people,
            SUM(CASE WHEN rsvp_status = 'not_attending' THEN 1 ELSE 0 END) as declined_guests,
            SUM(CASE WHEN rsvp_status = 'pending' THEN 1 ELSE 0 END) as pending_guests,
            SUM(CASE WHEN rsvp_status = 'attending' THEN 1 ELSE 0 END) as attending_guests,
            SUM(CASE WHEN phone_valid = 0 THEN 1 ELSE 0 END) as invalid_phones,
            SUM(CASE WHEN invited_at IS NOT NULL THEN 1 ELSE 0 END) as invited_count
        FROM guests
    """).fetchone()

    conn.close()

    return jsonify({
        "totals": dict(totals),
        "by_status": status_map,
        "by_side": sides,
        "by_group": groups,
    })
