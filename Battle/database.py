import os
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING
from flask import g


# 프로그램의 환경 변수에 .env 파일의 변수들을 추가
load_dotenv()

# 환경 변수에서 ID와 PW 가져오기
MONGO_ID = os.environ.get('MONGO_ID')
MONGO_PASSWORD = os.environ.get('MONGO_PASSWORD')

MONGO_URI = f"mongodb+srv://findmate_dev:{MONGO_PASSWORD}@cluster-findmate.h34d6se.mongodb.net/findmate_dev?retryWrites=true&w=majority&appName=Cluster-findMate"

client = MongoClient(MONGO_URI)

def get_db():
    db = client.get_default_database()
    return db

def ensure_user_indexes():
    """users.userId unique 인덱스 보장 (앱 시작 시 1회 호출 권장)"""
    db = get_db()
    db["users"].create_index([("userId", ASCENDING)], unique=True)
    