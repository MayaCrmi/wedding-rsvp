import sqlite3
import re
from datetime import datetime, timedelta
import random

DB_PATH = "wedding.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def validate_israeli_phone(phone: str) -> bool:
    """Accept formats: 05X-XXXXXXX, 05XXXXXXXXX, +9725XXXXXXXXX"""
    if not phone:
        return False
    cleaned = re.sub(r"[\s\-]", "", phone)
    patterns = [
        r"^05\d{8}$",
        r"^\+9725\d{8}$",
        r"^9725\d{8}$",
    ]
    return any(re.match(p, cleaned) for p in patterns)


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            side TEXT NOT NULL CHECK(side IN ('bride', 'groom')),
            grp TEXT NOT NULL CHECK(grp IN ('family', 'friends', 'work', 'other')),
            party_size INTEGER NOT NULL DEFAULT 1,
            notes TEXT,
            rsvp_status TEXT NOT NULL DEFAULT 'pending'
                CHECK(rsvp_status IN ('pending', 'attending', 'not_attending')),
            phone_valid INTEGER NOT NULL DEFAULT 0,
            invited_at TEXT,
            responded_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            template_text TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            recipient_count INTEGER NOT NULL DEFAULT 0
        )
    """)

    cur.execute("SELECT COUNT(*) FROM guests")
    if cur.fetchone()[0] == 0:
        _seed(cur)

    conn.commit()
    conn.close()


def _seed(cur):
    base_date = datetime(2025, 11, 1)

    guests = [
        # Bride family
        ("מיכל כהן",     "054-1234567", "michal@gmail.com",   "bride", "family",  2, "צמחונית",          "attending"),
        ("יעל לוי",      "052-9876543", "yael@gmail.com",      "bride", "family",  4, "",                  "attending"),
        ("רחל ברקוביץ",  "050-1112233", "rachel@gmail.com",   "bride", "family",  3, "ללא גלוטן",         "attending"),
        ("שרה גולדברג",  "053-4445566", "sara@gmail.com",     "bride", "family",  2, "",                  "not_attending"),
        ("נועה שפירא",   "054-7778899", "noa@gmail.com",      "bride", "friends", 2, "",                  "attending"),
        ("תמר אביב",     "052-3334455", "tamar@gmail.com",    "bride", "friends", 1, "אלרגיה לבוטנים",   "pending"),
        ("דנה מזרחי",    "050-6667788", "dana@gmail.com",     "bride", "friends", 2, "",                  "attending"),
        ("לירון כץ",     "053-9990011", "liron@gmail.com",    "bride", "work",    1, "",                  "pending"),
        ("אורית פרץ",    "054-2223344", "orit@gmail.com",     "bride", "work",    2, "",                  "not_attending"),
        ("גלית רוזן",    "052-5556677", "galit@gmail.com",    "bride", "other",   3, "מגיעה מחיפה",       "attending"),

        # Groom family
        ("יוסי לוי",     "054-9998887", "yossi@gmail.com",   "groom", "family",  2, "",                  "attending"),
        ("אבי כהן",      "052-1112224", "avi@gmail.com",      "groom", "family",  4, "כשר",               "attending"),
        ("משה פרידמן",   "050-3334446", "moshe@gmail.com",   "groom", "family",  3, "",                  "attending"),
        ("דוד אזולאי",   "053-5556668", "david@gmail.com",   "groom", "family",  2, "",                  "pending"),
        ("רוני שמש",     "054-7778880", "roni@gmail.com",    "groom", "friends", 2, "",                  "attending"),
        ("איתן בן-דוד",  "052-9990002", "eitan@gmail.com",   "groom", "friends", 1, "",                  "not_attending"),
        ("נדב הרצוג",    "050-2223334", "nadav@gmail.com",   "groom", "friends", 3, "חלבי בלבד",         "attending"),
        ("גיל מנחם",     "bad-number",  "gil@gmail.com",     "groom", "work",    1, "",                  "pending"),
        ("אורן שוחט",    "053-6667778", "oren@gmail.com",    "groom", "work",    2, "",                  "pending"),
        ("יניב טל",      "12345",       "yaniv@gmail.com",   "groom", "other",   2, "מספר לא תקין - בדוק","pending"),
    ]

    for i, (name, phone, email, side, grp, party_size, notes, status) in enumerate(guests):
        valid = 1 if validate_israeli_phone(phone) else 0
        offset_days = random.randint(0, 20)
        created = (base_date + timedelta(days=offset_days)).isoformat()
        responded_at = None
        invited_at = None
        if status != "pending":
            responded_at = (base_date + timedelta(days=offset_days + 5)).isoformat()
            invited_at = (base_date + timedelta(days=offset_days + 1)).isoformat()

        cur.execute("""
            INSERT INTO guests
              (name, phone, email, side, grp, party_size, notes, rsvp_status,
               phone_valid, invited_at, responded_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (name, phone, email, side, grp, party_size, notes, status,
              valid, invited_at, responded_at, created))
