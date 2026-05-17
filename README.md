# RSVP — ניהול הזמנות לחתונה

פרויקט אוניברסיטה: אפליקציית ניהול RSVP לחתונות.  
ממשק בעברית, כיוון RTL, עם 4 לשוניות.

## הפעלה

### Backend (Flask)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# ← פועל על http://localhost:5001
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# ← פועל על http://localhost:5173
```

## טכנולוגיות

| שכבה     | טכנולוגיה                            |
|----------|--------------------------------------|
| Frontend | React 18 + TypeScript + Vite + Axios |
| Charts   | Recharts                             |
| Backend  | Python Flask + SQLite                |
| Excel    | openpyxl                             |

## לשוניות

1. **לוח בקרה** — סטטיסטיקות, גרפים (donut + bar), אחוז מענה
2. **רשימת מוזמנים** — טבלה, פילטרים, הוספה, עריכה, מחיקה, ייבוא מ-Excel
3. **שליחת הזמנות** — תבנית הודעה, בחירת נמענים, שליחה מדומה עם אנימציה
4. **תגובות** — צפייה בתגובות, פילטרים, ייצוא CSV

## הערות
- השליחה **מדומה בלבד** — לא נשלחות הודעות אמיתיות
- מספרים לא תקינים מסומנים ⚠️ ומכשילים בשליחה
- מוזמנים לדוגמה נטענים אוטומטית בהפעלה ראשונה
