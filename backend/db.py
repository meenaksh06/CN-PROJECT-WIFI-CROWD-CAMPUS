import sqlite3

DB = 'backend/aggregations.db'

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY,
        minute TEXT,
        ap_id TEXT,
        device_hash TEXT,
        rssi INTEGER
    )""")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS aggregates (
        minute TEXT,
        ap_id TEXT,
        unique_devices INTEGER,
        mean_rssi REAL,
        PRIMARY KEY (minute, ap_id)
    )""")
    con.commit()
    con.close()

def insert_probe(minute, ap_id, device_hash, rssi):
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute('INSERT INTO observations (minute, ap_id, device_hash, rssi) VALUES (?,?,?,?)',
                (minute, ap_id, device_hash, rssi))
    con.commit()
    con.close()

def compute_aggregates():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute('SELECT minute, ap_id, COUNT(DISTINCT device_hash) as unique_devices, AVG(rssi) as mean_rssi FROM observations GROUP BY minute, ap_id')
    rows = cur.fetchall()
    for minute, ap_id, unique_devices, mean_rssi in rows:
        cur.execute('REPLACE INTO aggregates (minute, ap_id, unique_devices, mean_rssi) VALUES (?,?,?,?)',
                    (minute, ap_id, unique_devices, mean_rssi))
    con.commit()
    con.close()

def get_current_aggregates():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute('SELECT ap_id, unique_devices, mean_rssi FROM aggregates')
    rows = cur.fetchall()
    con.close()
    return [{'ap_id': r[0], 'unique_devices': r[1], 'mean_rssi': r[2]} for r in rows]

