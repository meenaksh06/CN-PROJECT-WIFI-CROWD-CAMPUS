
import csv, requests, time

URL = "http://localhost:8000/ingest"
BATCH_SIZE = 60
SLEEP = 0.5

with open('data/sample_probes.csv') as f:
    r = csv.DictReader(f)
    batch = []
    for row in r:
        batch.append({'ts': row['timestamp'], 'ap_iface': row['ap_id'], 'device': row['device'], 'rssi': int(row['rssi'])})
        if len(batch) >= BATCH_SIZE:
            try:
                requests.post(URL, json=batch, timeout=5)
                print("Sent", len(batch))
            except Exception as e:
                print("Err", e)
            batch=[]
            time.sleep(SLEEP)
    if batch:
        requests.post(URL, json=batch)
        print("Sent final", len(batch))

