from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from . import db
import joblib, os
from typing import List

app = FastAPI()


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db.init_db()


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

            print("Processing packet:", p)


            minute = datetime.utcfromtimestamp(float(p.get("ts"))).strftime("%Y-%m-%dT%H:%M")
            ap_id = p.get("ap_iface") or "AP-unknown"
            device = p.get("device")
            rssi = p.get("rssi")


            db.insert_probe(minute, ap_id, device, rssi)
            accepted += 1
        except Exception as e:
            print("❌ Error processing packet:", p, e)
            continue


    db.compute_aggregates()
    return {"accepted": accepted}


@app.get('/counts')
async def counts():
    aggs = db.get_current_aggregates()
    results = []
    for a in aggs:
        est_people = None
        if model:
            pass

        est_people = round(a['unique_devices'] / 1.2, 1) if a['unique_devices'] else 0
        results.append({'ap_id': a['ap_id'], 'unique_devices': a['unique_devices'], 'mean_rssi': a['mean_rssi'], 'est_people': est_people})
    return {'data': results}



@app.get('/predict')
async def predict_alias():
    return await counts()


