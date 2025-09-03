# seed_categories.py
from datetime import datetime
from database import get_db

CATEGORIES = [
    "자료구조/알고리즘","운영체제","네트워크","데이터베이스",
    "컴퓨터구조","보안","웹/프론트엔드","백엔드",
    "클라우드/DevOps","코딩테스트","기타" 
]

def slugify(name: str) -> str:
    return (
        name.strip()
            .replace(" ", "-")
            .replace("/", "-")
            .replace("_", "-")
            .replace("DevOps", "devops")
            .lower()
    )

def upsert_categories():
    db = get_db()
    for i, name in enumerate(CATEGORIES, start=1):
        key = slugify(name)
        db["categories"].update_one(
            {"key": key},
            {"$set": {
                "name": name,
                "active": True,
                "order": i,
                "updated_at": datetime.utcnow(),
            }, "$setOnInsert": {
                "created_at": datetime.utcnow()
            }},
            upsert=True
        )
    print("[OK] Seeded categories:", CATEGORIES)

if __name__ == "__main__":
    upsert_categories()
