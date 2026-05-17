import sqlite3
import re
import os
from datetime import datetime, timedelta
import random

DB_PATH = "wedding.db"
UPLOADS_DIR = "uploads"


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
    os.makedirs(UPLOADS_DIR, exist_ok=True)

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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL DEFAULT 'other',
            priority TEXT NOT NULL DEFAULT 'medium'
                CHECK(priority IN ('high', 'medium', 'low')),
            due_months_before INTEGER NOT NULL DEFAULT 3,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL DEFAULT 'other',
            business_name TEXT NOT NULL,
            contact_name TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            price REAL,
            deposit_amount REAL,
            deposit_paid INTEGER NOT NULL DEFAULT 0,
            booking_date TEXT,
            meeting_date TEXT,
            event_date TEXT,
            notes TEXT,
            contract_filename TEXT,
            contract_path TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    cur.execute("SELECT COUNT(*) FROM guests")
    if cur.fetchone()[0] == 0:
        _seed_guests(cur)

    cur.execute("SELECT COUNT(*) FROM tasks")
    if cur.fetchone()[0] == 0:
        _seed_tasks(cur)

    cur.execute("SELECT COUNT(*) FROM vendors")
    if cur.fetchone()[0] == 0:
        _seed_vendors(cur)

    conn.commit()
    conn.close()


def _seed_guests(cur):
    base_date = datetime(2025, 11, 1)

    guests = [
        ("מיכל כהן",    "054-1234567", "michal@gmail.com",  "bride", "family",  2, "צמחונית",          "attending"),
        ("יעל לוי",     "052-9876543", "yael@gmail.com",    "bride", "family",  4, "",                  "attending"),
        ("רחל ברקוביץ", "050-1112233", "rachel@gmail.com",  "bride", "family",  3, "ללא גלוטן",         "attending"),
        ("שרה גולדברג", "053-4445566", "sara@gmail.com",    "bride", "family",  2, "",                  "not_attending"),
        ("נועה שפירא",  "054-7778899", "noa@gmail.com",     "bride", "friends", 2, "",                  "attending"),
        ("תמר אביב",    "052-3334455", "tamar@gmail.com",   "bride", "friends", 1, "אלרגיה לבוטנים",   "pending"),
        ("דנה מזרחי",   "050-6667788", "dana@gmail.com",    "bride", "friends", 2, "",                  "attending"),
        ("לירון כץ",    "053-9990011", "liron@gmail.com",   "bride", "work",    1, "",                  "pending"),
        ("אורית פרץ",   "054-2223344", "orit@gmail.com",    "bride", "work",    2, "",                  "not_attending"),
        ("גלית רוזן",   "052-5556677", "galit@gmail.com",   "bride", "other",   3, "מגיעה מחיפה",       "attending"),
        ("יוסי לוי",    "054-9998887", "yossi@gmail.com",  "groom", "family",  2, "",                  "attending"),
        ("אבי כהן",     "052-1112224", "avi@gmail.com",     "groom", "family",  4, "כשר",               "attending"),
        ("משה פרידמן",  "050-3334446", "moshe@gmail.com",  "groom", "family",  3, "",                  "attending"),
        ("דוד אזולאי",  "053-5556668", "david@gmail.com",  "groom", "family",  2, "",                  "pending"),
        ("רוני שמש",    "054-7778880", "roni@gmail.com",   "groom", "friends", 2, "",                  "attending"),
        ("איתן בן-דוד", "052-9990002", "eitan@gmail.com",  "groom", "friends", 1, "",                  "not_attending"),
        ("נדב הרצוג",   "050-2223334", "nadav@gmail.com",  "groom", "friends", 3, "חלבי בלבד",         "attending"),
        ("גיל מנחם",    "bad-number",  "gil@gmail.com",    "groom", "work",    1, "",                  "pending"),
        ("אורן שוחט",   "053-6667778", "oren@gmail.com",   "groom", "work",    2, "",                  "pending"),
        ("יניב טל",     "12345",       "yaniv@gmail.com",  "groom", "other",   2, "מספר לא תקין",      "pending"),
    ]

    for name, phone, email, side, grp, party_size, notes, status in guests:
        valid = 1 if validate_israeli_phone(phone) else 0
        offset_days = random.randint(0, 20)
        created = (base_date + timedelta(days=offset_days)).isoformat()
        responded_at = None
        invited_at = None
        if status != "pending":
            responded_at = (base_date + timedelta(days=offset_days + 5)).isoformat()
            invited_at   = (base_date + timedelta(days=offset_days + 1)).isoformat()

        cur.execute("""
            INSERT INTO guests
              (name, phone, email, side, grp, party_size, notes, rsvp_status,
               phone_valid, invited_at, responded_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (name, phone, email, side, grp, party_size, notes, status,
              valid, invited_at, responded_at, created))


def _seed_tasks(cur):
    # (title, description, category, priority, due_months_before, completed)
    tasks = [
        # 12+ months before
        ("קביעת תאריך החתונה",       "בחרו תאריך שמתאים לשניכם ולמשפחה",    "other",        "high",   14, 1),
        ("הזמנת אולם אירועים",        "השוו בין אולמות ובצעו הזמנה",          "venue",        "high",   12, 1),
        ("הזמנת צלם",                 "בחרו צלם סטילס ווידאו",               "photography",  "high",   12, 1),
        ("קביעת תקציב כללי",          "הגדירו תקציב ראשוני וחלוקה לקטגוריות","other",        "high",   12, 1),
        ("רשימת מוזמנים ראשונית",     "ערכו רשימה ראשונית עם מספר אורחים",   "other",        "high",   12, 0),

        # 9 months before
        ("הזמנת קייטרינג",            "טעימות ובחירת תפריט",                  "catering",     "high",    9, 1),
        ("בחירת DJ / להקה",           "שמיעת דמו ובחירת מוזיקה לאירוע",      "music",        "high",    9, 0),
        ("בחירת שמלת כלה",            "ביקורים בבוטיקים ובחירת שמלה",        "attire",       "high",    9, 0),
        ("בחירת חליפה לחתן",          "מדידה והזמנה",                         "attire",       "medium",  9, 0),
        ("הזמנת פרחים / עיצוב",       "פגישה עם מעצב פרחים",                 "flowers",      "medium",  9, 0),
        ("תכנון ירח הדבש",            "בחירת יעד ובדיקת תאריכים",             "honeymoon",    "medium",  9, 0),

        # 6 months before
        ("הדפסת הזמנות",              "עיצוב, הדפסה ומשלוח הזמנות",          "invitations",  "high",    6, 0),
        ("הזמנת ספר מוזיקה",          "הכינו פלייליסט לאירוע",               "music",        "medium",  6, 0),
        ("ביצוע הסדרי לינה לאורחים",  "בעיקר לאורחים מרחוק",                 "other",        "low",     6, 0),
        ("תכנון עיצוב האולם",         "פרטי קישוט, מרכזי שולחן, תאורה",     "flowers",      "medium",  6, 0),
        ("הזמנת רב מסדר קידושין",     "מציאת רב ותיאום",                      "legal",        "high",    6, 0),
        ("הכנת מסמכי נישואין",        "כל הניירת הנדרשת למשרד הדתי",         "legal",        "high",    6, 0),

        # 3 months before
        ("מדידות שמלה סופיות",        "הגעה לבוטיק לתיקונים אחרונים",        "attire",       "high",    3, 0),
        ("טעימת עוגת חתונה",          "בחרו עוגה ועיצוב",                     "catering",     "medium",  3, 0),
        ("הזמנת רכב חתן וכלה",        "לימוזינה, וינטג׳ או רכב מיוחד",       "other",        "medium",  3, 0),
        ("תיאום לוח זמנים לאירוע",    "סדר האירועים, כניסת חתן, חופה, ריקודים","other",      "high",    3, 0),
        ("הכנת רשימת תמונות לצלם",    "תמונות חובה עם משפחה וחברים",         "photography",  "medium",  3, 0),
        ("הזמנת ספר מנחות",           "קנו ספר וארגנו עט לשולחן הכניסה",     "other",        "low",     3, 0),
        ("מספרה ואיפור לחתונה",       "גיבוש עם מאפרת ומעצבת שיער",          "beauty",       "high",    3, 0),

        # 1 month before
        ("אישור סופי כמות אורחים",    "עדכנו קייטרינג ואולם בכמות הסופית",   "catering",     "high",    1, 0),
        ("הכנת סידורי ישיבה",         "תכנון טבלת הושבה",                     "other",        "high",    1, 0),
        ("בדיקת כל החוזים",           "ודאו שכל הפרטים נכונים עם הספקים",    "other",        "high",    1, 0),
        ("הכנת מעטפות למוזיקאים",     "טיפים ותשלומים אחרונים",              "music",        "medium",  1, 0),
        ("מניקור ופדיקור לכלה",       "תיאום עם ספא / קוסמטיקאית",           "beauty",       "medium",  1, 0),
        ("חזרה על נאום ברכות",        "אם יש נאומים תרגלו אותם",              "other",        "low",     1, 0),
    ]

    for i, (title, desc, cat, prio, months, done) in enumerate(tasks):
        completed_at = datetime.now().isoformat() if done else None
        cur.execute("""
            INSERT INTO tasks
              (title, description, category, priority, due_months_before,
               completed, completed_at, display_order, created_at)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (title, desc, cat, prio, months, done, completed_at, i,
              datetime.now().isoformat()))


def _seed_vendors(cur):
    now = datetime.now().isoformat()
    vendors = [
        # (category, business_name, contact_name, phone, email, website,
        #  price, deposit_amount, deposit_paid, booking_date, meeting_date, notes)
        ("venue",        "אולם ורסאי",         "מנהל האולם - דני כהן", "054-1111111",
         "versailles@gmail.com", "versailles-hall.co.il",
         45000, 10000, 1, "2025-06-15", "2025-05-01",
         "אולם עם נוף לים, כולל חניה. סגור לשבת."),

        ("photography",  "סטודיו רז",          "רז לוי",               "052-2222222",
         "raz@studio.co.il", "razstudio.com",
         12000, 3000, 1, "2025-07-01", "2025-06-01",
         "צלם + וידאו. כולל אלבום דיגיטלי. זמן עריכה 3 חודשים."),

        ("catering",     "טעמים בע״מ",          "שף שמעון פרץ",         "050-3333333",
         "taamim@catering.co.il", "",
         38000, 8000, 1, "2025-08-10", "2025-07-15",
         "תפריט ים תיכוני + בשרי. 250 סועדים. כולל שירות ומלצרים."),

        ("music",        "DJ מאסטר מיקס",       "יוסי שמש",             "053-4444444",
         "dj@mastermix.co.il", "mastermix.co.il",
         6500, 2000, 0, None, "2025-09-01",
         "עדיין בשלב משא ומתן. בקשנו פלייליסט לדוגמה."),

        ("florist",      "פרחי גן עדן",         "נעמי פרץ",             "054-5555555",
         "naomi@flowers.co.il", "",
         8000, 0, 0, None, None,
         "פגישה ראשונה עוד לא נקבעה. המלצה מחברה."),

        ("hair_makeup",  "סטודיו ביוטי קוין",   "אביגיל מזרחי",         "052-6666666",
         "beauty@queen.co.il", "beautyqueen.co.il",
         3500, 500, 1, "2025-10-01", "2025-09-15",
         "כולל כלה + 2 שושבינות. מגיעה לאולם ב-14:00."),
    ]

    for (cat, biz, contact, phone, email, website,
         price, deposit, dep_paid, book_date, meet_date, notes) in vendors:
        cur.execute("""
            INSERT INTO vendors
              (category, business_name, contact_name, phone, email, website,
               price, deposit_amount, deposit_paid,
               booking_date, meeting_date, notes, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (cat, biz, contact, phone, email, website,
              price, deposit, dep_paid,
              book_date, meet_date, notes, now))
