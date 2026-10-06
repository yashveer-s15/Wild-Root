"""SQLite persistence behind a small repository boundary for future PostgreSQL migration."""
import sqlite3,json,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DB=Path(os.getenv('WILDROOT_DB') or str(ROOT/'wildroot.db'))
def connection():
    db=sqlite3.connect(DB)
    db.row_factory=sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db
def initialize():
    with connection() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',profile TEXT NOT NULL DEFAULT '{}');
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS treks(id TEXT PRIMARY KEY,data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS saved(user_id INTEGER REFERENCES users(id),trek_id TEXT REFERENCES treks(id) ON DELETE CASCADE,PRIMARY KEY(user_id,trek_id));
        CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),trek_id TEXT REFERENCES treks(id),date TEXT,travellers INTEGER,package TEXT,contact TEXT,emergency TEXT,status TEXT DEFAULT 'Confirmed');
        CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY,title TEXT,description TEXT);
        CREATE TABLE IF NOT EXISTS packing(user_id INTEGER REFERENCES users(id),trek_id TEXT,items TEXT,PRIMARY KEY(user_id,trek_id));
        ''')
        if not db.execute('SELECT COUNT(*) FROM treks').fetchone()[0]:
            db.executemany('INSERT INTO treks VALUES(?,?)',[(t['id'],json.dumps(t)) for t in json.loads((ROOT/'data.json').read_text())])
def all_treks():
    with connection() as db:return [json.loads(r['data']) for r in db.execute('SELECT data FROM treks')]
