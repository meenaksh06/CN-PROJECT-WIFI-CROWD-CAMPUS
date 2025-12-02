
from fastapi import FastAPI, Body
from datetime import datetime
import backend.db as db
import joblib, os
from typing import List, Dict

app = FastAPI()
db.init_db()

# optionally set MODEL_PATH env var to use ML; else ML disabled
MODEL_PATH = os.environ.get('MODEL_PATH', '')
model = None
if MODEL_PATH:
    try:
        model = joblib.load(MODEL_PATH)
        print("Loaded model:", MODEL_PATH)
    except Exception as e:
        print("Model load failed:", e)
        model = None
        
@app.post("/ingest")
async def ingest(batch: List[dict]):
    """
    Accepts a list of probe packets and stores them into the database.
    Example payload:
    [
      {"ts": 1730544000, "ap_iface": "AP-1", "device": "device_001", "rssi": -55},
      {"ts": 1730544060, "ap_iface": "AP-2", "device": "device_002", "rssi": -63}
    ]
    """
    accepted = 0

    for p in batch:
        try:
            # Debug print for visibility
            print("Processing packet:", p)

            # Convert timestamp to minute-level granularity
            minute = datetime.utcfromtimestamp(float(p.get("ts"))).strftime("%Y-%m-%dT%H:%M")
            ap_id = p.get("ap_iface") or "AP-unknown"
            device = p.get("device")
            rssi = p.get("rssi")

            # Insert into DB
            db.insert_probe(minute, ap_id, device, rssi)
            accepted += 1
        except Exception as e:
            print("❌ Error processing packet:", p, e)
            continue

    # Recompute aggregates
    db.compute_aggregates()
    return {"accepted": accepted}


@app.get('/counts')
async def counts():
    aggs = db.get_current_aggregates()
    results = []
    for a in aggs:
        est_people = None
        if model:
            # feature vector must match training: [probes, mean_rssi, std_rssi, median_rssi]
            # but our aggregates table has only probes and mean_rssi; use simple mapping: probes->people or call a separate feature aggregator
            # For demo we use device->people heuristic if ML not applicable
            pass
        # device->people heuristic (explain in report)
        est_people = round(a['unique_devices'] / 1.2, 1) if a['unique_devices'] else 0
        results.append({'ap_id': a['ap_id'], 'unique_devices': a['unique_devices'], 'mean_rssi': a['mean_rssi'], 'est_people': est_people})
    return {'data': results}

# @app.get("/")
# def read_root():
#     return {"status":"ok"}

# @app.get("/ingest")
# def ingest_info():
#     return {"info": "POST JSON list to this endpoint. Example: [{\"ts\":..., \"ap_iface\":\"AP01\", \"device\":\"dev-1\", \"rssi\":-45}]"}
