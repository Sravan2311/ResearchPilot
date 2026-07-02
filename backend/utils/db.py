import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load Mongo URI from environment, fallback to local host
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "researchpilot"

db_client = None
db = None
is_mock_db = False

# Simple mock database fallback in case MongoDB is not running locally
class MockCollection:
    def __init__(self):
        self.data = {}

    def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(len(self.data) + 1)
        self.data[document["_id"]] = document
        return type('InsertOneResult', (object,), {'inserted_id': document["_id"]})()

    def find_one(self, query):
        for doc in self.data.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, query=None):
        query = query or {}
        results = []
        for doc in self.data.values():
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        return results

    def update_one(self, query, update):
        doc = self.find_one(query)
        if doc:
            set_data = update.get("$set", {})
            for k, v in set_data.items():
                doc[k] = v
            return type('UpdateResult', (object,), {'modified_count': 1})()
        return type('UpdateResult', (object,), {'modified_count': 0})()

    def delete_one(self, query):
        doc = self.find_one(query)
        if doc and doc.get("_id") in self.data:
            del self.data[doc["_id"]]
            return type('DeleteResult', (object,), {'deleted_count': 1})()
        return type('DeleteResult', (object,), {'deleted_count': 0})()

class MockDatabase:
    def __init__(self):
        self.users = MockCollection()
        self.dossiers = MockCollection()
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection()
        return self._collections[name]

try:
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    db_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Trigger a connection test
    db_client.admin.command('ping')
    db = db_client[DB_NAME]
    print("Successfully connected to MongoDB!")
except (ConnectionFailure, Exception) as e:
    print(f"Could not connect to MongoDB: {e}.")
    print("Falling back to simulated In-Memory Database for testing.")
    db = MockDatabase()
    is_mock_db = True

def get_db():
    return db
