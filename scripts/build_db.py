import json
import sqlite3
from pathlib import Path

base = Path(__file__).resolve().parent.parent
skills_path = base / "data" / "skills.json"
db_path = base / "data" / "skills.db"

skills = json.loads(skills_path.read_text(encoding="utf-8"))

if db_path.exists():
    db_path.unlink()

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute(
    """
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT,
  name_zh TEXT,
  short_description TEXT,
  short_description_zh TEXT,
  long_description TEXT,
  long_description_zh TEXT,
  category TEXT,
  platforms TEXT,
  tags TEXT,
  popularity INTEGER,
  popularity_label TEXT,
  source_name TEXT,
  source_url TEXT,
  detail_url TEXT
)
"""
)

for s in skills:
    cur.execute(
        """
        INSERT INTO skills (
          id, name, name_zh, short_description, short_description_zh, long_description, long_description_zh, category, platforms, tags,
          popularity, popularity_label, source_name, source_url, detail_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            s["id"],
            s["name"],
            s.get("name_zh", ""),
            s.get("short_description", ""),
            s.get("short_description_zh", ""),
            s.get("long_description", ""),
            s.get("long_description_zh", ""),
            s.get("category", ""),
            json.dumps(s.get("platforms", []), ensure_ascii=False),
            json.dumps(s.get("tags", []), ensure_ascii=False),
            s.get("popularity"),
            s.get("popularity_label"),
            s.get("source_name", ""),
            s.get("source_url", ""),
            s.get("detail_url", ""),
        ),
    )

conn.commit()
conn.close()
print(f"skills: {len(skills)} -> {db_path}")
