from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import db
import joblib
import os
from typing import List, Optional
import random
import time
import hashlib

app = FastAPI(
    title="WiFi Crowd Campus API",
    description="Real-time crowd density monitoring using WiFi probe requests",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
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
        print("Loaded ML model:", MODEL_PATH)
    except Exception as e:
        print("Model load failed:", e)
        model = None

CAMPUS_LOCATIONS = {
    "main_campus": {
        "name": "Main Campus",
        "aps": [
            {"id": "AP-LIB-01", "zone": "Library Floor 1", "capacity": 150},
            {"id": "AP-LIB-02", "zone": "Library Floor 2", "capacity": 120},
            {"id": "AP-CAF-01", "zone": "Main Cafeteria", "capacity": 200},
            {"id": "AP-LEC-101", "zone": "Lecture Hall 101", "capacity": 300},
            {"id": "AP-LEC-102", "zone": "Lecture Hall 102", "capacity": 250},
            {"id": "AP-LAB-01", "zone": "Computer Lab A", "capacity": 60},
            {"id": "AP-LAB-02", "zone": "Computer Lab B", "capacity": 60},
            {"id": "AP-GYM-01", "zone": "Sports Complex", "capacity": 100},
        ]
    },
    "engineering_block": {
        "name": "Engineering Block",
        "aps": [
            {"id": "AP-ENG-101", "zone": "EE Lab", "capacity": 50},
            {"id": "AP-ENG-102", "zone": "CS Lab", "capacity": 60},
            {"id": "AP-ENG-103", "zone": "Mech Workshop", "capacity": 40},
            {"id": "AP-ENG-LEC", "zone": "Eng Lecture Hall", "capacity": 200},
            {"id": "AP-ENG-CAF", "zone": "Eng Cafeteria", "capacity": 80},
            {"id": "AP-ENG-LIB", "zone": "Eng Library", "capacity": 100},
        ]
    },
    "student_center": {
        "name": "Student Center",
        "aps": [
            {"id": "AP-SC-LOBBY", "zone": "Main Lobby", "capacity": 100},
            {"id": "AP-SC-FOOD", "zone": "Food Court", "capacity": 250},
            {"id": "AP-SC-GAME", "zone": "Gaming Zone", "capacity": 50},
            {"id": "AP-SC-STUDY", "zone": "Study Lounge", "capacity": 80},
            {"id": "AP-SC-EVENT", "zone": "Event Hall", "capacity": 400},
        ]
    },
    "science_block": {
        "name": "Science Block",
        "aps": [
            {"id": "AP-SCI-PHY", "zone": "Physics Lab", "capacity": 45},
            {"id": "AP-SCI-CHEM", "zone": "Chemistry Lab", "capacity": 45},
            {"id": "AP-SCI-BIO", "zone": "Biology Lab", "capacity": 45},
            {"id": "AP-SCI-LEC1", "zone": "Science Hall 1", "capacity": 150},
            {"id": "AP-SCI-LEC2", "zone": "Science Hall 2", "capacity": 150},
        ]
    }
}

current_location = "main_campus"


def random_mac():
    return hashlib.sha256(os.urandom(16)).hexdigest()[:12]


def estimate_people(unique_devices: int, mean_rssi: float = None) -> float:
    if model and mean_rssi is not None:
        try:
            prediction = model.predict([[unique_devices, mean_rssi]])
            return round(float(prediction[0]), 1)
        except Exception:
            pass
    return round(unique_devices / 1.2, 1) if unique_devices else 0


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "WiFi Crowd Campus",
        "version": "1.0.0",
        "current_location": current_location,
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model is not None
    }


@app.get("/locations")
async def get_locations():
    return {
        "current": current_location,
        "available": {
            key: {
                "name": loc["name"],
                "ap_count": len(loc["aps"]),
                "zones": [ap["zone"] for ap in loc["aps"]]
            }
            for key, loc in CAMPUS_LOCATIONS.items()
        }
    }


@app.post("/locations/{location_id}")
async def set_location(location_id: str):
    global current_location
    
    if location_id not in CAMPUS_LOCATIONS:
        return {"error": f"Unknown location: {location_id}", "available": list(CAMPUS_LOCATIONS.keys())}
    
    current_location = location_id
    db.clear_data()
    
    return {
        "success": True,
        "location": location_id,
        "name": CAMPUS_LOCATIONS[location_id]["name"]
    }


@app.post("/ingest")
async def ingest(batch: List[dict]):
    accepted = 0

    for p in batch:
        try:
            minute = datetime.utcfromtimestamp(float(p.get("ts"))).strftime("%Y-%m-%dT%H:%M")
            ap_id = p.get("ap_iface") or "AP-unknown"
            device = p.get("device")
            rssi = p.get("rssi")

            db.insert_probe(minute, ap_id, device, rssi)
            accepted += 1
        except Exception:
            continue

    db.compute_aggregates()
    return {"accepted": accepted, "total": len(batch)}


@app.get('/counts')
async def counts():
    aggs = db.get_current_aggregates()
    location_config = CAMPUS_LOCATIONS.get(current_location, {})
    ap_info = {ap["id"]: ap for ap in location_config.get("aps", [])}
    
    results = []
    for a in aggs:
        ap_id = a['ap_id']
        unique_devices = a['unique_devices'] or 0
        mean_rssi = a['mean_rssi']
        est_people = estimate_people(unique_devices, mean_rssi)
        
        zone_info = ap_info.get(ap_id, {})
        capacity = zone_info.get("capacity", 100)
        occupancy_pct = round((est_people / capacity) * 100, 1) if capacity > 0 else 0
        
        results.append({
            'ap_id': ap_id,
            'zone': zone_info.get("zone", ap_id),
            'unique_devices': unique_devices,
            'mean_rssi': round(mean_rssi, 1) if mean_rssi else None,
            'est_people': est_people,
            'capacity': capacity,
            'occupancy_pct': min(occupancy_pct, 100),
            'status': 'high' if occupancy_pct > 75 else 'medium' if occupancy_pct > 40 else 'low'
        })
    
    results.sort(key=lambda x: x['ap_id'])
    
    return {
        'data': results,
        'location': current_location,
        'location_name': location_config.get("name", "Unknown"),
        'timestamp': datetime.utcnow().isoformat(),
        'total_people': sum(r['est_people'] for r in results),
        'zones_count': len(results)
    }


@app.get('/predict')
async def predict_alias():
    return await counts()


@app.post("/simulate")
async def simulate(
    rows: int = Query(default=50, ge=1, le=500),
    location: Optional[str] = Query(default=None)
):
    global current_location
    
    target_location = location or current_location
    if target_location not in CAMPUS_LOCATIONS:
        return {"error": f"Unknown location: {target_location}"}
    
    if location:
        current_location = location
    
    db.clear_data()
    
    loc_config = CAMPUS_LOCATIONS[target_location]
    aps = loc_config["aps"]
    
    batch = []
    now = time.time()
    
    for i in range(rows):
        ts = now - (rows - i) * 60
        minute = datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M")
        hour_factor = 0.3 + 0.7 * abs(((i % 24) - 12) / 12)
        
        for ap in aps:
            base_crowd = int(ap["capacity"] * random.uniform(0.1, 0.6) * hour_factor)
            crowd = max(1, base_crowd + random.randint(-5, 10))
            
            for _ in range(crowd):
                mac = random_mac()
                rssi = random.randint(-85, -35)
                batch.append((minute, ap["id"], mac, rssi))
    
    db.insert_probes_batch(batch)
    db.compute_aggregates()
    
    return {
        "success": True,
        "generated": len(batch),
        "accepted": len(batch),
        "location": target_location,
        "location_name": loc_config["name"],
        "zones": len(aps),
        "status": "ok"
    }


@app.delete("/data")
async def clear_data():
    db.clear_data()
    return {"status": "cleared", "timestamp": datetime.utcnow().isoformat()}
