# WiFi Crowd Campus - Complete Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technologies Used](#3-technologies-used)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Database Design](#6-database-design)
7. [API Documentation](#7-api-documentation)
8. [Computer Networks Concepts](#8-computer-networks-concepts)
9. [How Data Flows](#9-how-data-flows)
10. [Setup & Running](#10-setup--running)

---

## 1. Project Overview

### What is WiFi Crowd Campus?
WiFi Crowd Campus is a **real-time crowd density monitoring system** that estimates the number of people in different zones of a campus by analyzing WiFi probe requests from mobile devices.

### Problem Statement
- Universities and large campuses need to know crowd density in real-time
- Manual counting is impractical
- Traditional methods (cameras, sensors) are expensive

### Solution
- Passively monitor WiFi probe requests that mobile devices automatically send
- Count unique devices per zone (Access Point)
- Estimate crowd density based on device count
- Display real-time data on a web dashboard

### Key Features
1. Real-time crowd monitoring
2. Multiple campus locations support
3. Zone-wise density visualization (heatmap)
4. Occupancy percentage calculation
5. Data simulation for testing
6. Auto-refresh every 8 seconds

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     WiFi Probes      ┌──────────────┐
│   Mobile     │ ──────────────────►  │   Access     │
│   Devices    │   (802.11 frames)    │   Points     │
└──────────────┘                      └──────┬───────┘
                                             │
                                             │ Captured Data
                                             ▼
                                      ┌──────────────┐
                                      │   Sniffer    │
                                      │  (Optional)  │
                                      └──────┬───────┘
                                             │
                                             │ HTTP POST /ingest
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   main.py   │  │    db.py    │  │   SQLite    │              │
│  │  (Routes)   │◄─┤ (Database)  │◄─┤  Database   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                                                        │
│         │ API Endpoints: /predict, /simulate, /locations         │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ HTTP GET/POST (JSON)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   App.jsx   │  │  useState   │  │  useEffect  │              │
│  │ (Component) │  │  (State)    │  │  (Polling)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Zone Heatmap Display                │            │
│  │  [Library: 45 people] [Cafeteria: 120 people]   │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
    ┌──────────┐
    │  Browser │
    │  (User)  │
    └──────────┘
```

---

## 3. Technologies Used

### 3.1 Python
**What:** A high-level programming language known for simplicity and readability.

**Why used:** 
- Easy to write and maintain
- Rich ecosystem of libraries
- Great for web APIs and data processing

**In this project:** Backend server logic, database operations, data processing.

### 3.2 FastAPI
**What:** A modern, fast web framework for building APIs with Python.

**Why used:**
- High performance (based on Starlette and Pydantic)
- Automatic API documentation
- Built-in data validation
- Async support

**Key features used:**
```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/predict")  # GET endpoint
async def predict():
    return {"data": [...]}

@app.post("/simulate")  # POST endpoint
async def simulate():
    return {"success": True}
```

### 3.3 Uvicorn
**What:** An ASGI (Asynchronous Server Gateway Interface) server for Python.

**Why used:**
- Runs FastAPI applications
- Supports async/await
- Hot reload during development

**Usage:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3.4 SQLite
**What:** A lightweight, file-based relational database.

**Why used:**
- No separate server needed
- Perfect for small to medium applications
- Zero configuration
- Single file storage

**In this project:** Stores probe observations and aggregated data.

### 3.5 React (JavaScript)
**What:** A JavaScript library for building user interfaces.

**Why used:**
- Component-based architecture
- Efficient DOM updates (Virtual DOM)
- Rich ecosystem

**Key concepts used:**
- **useState:** Manage component state
- **useEffect:** Handle side effects (API calls, timers)
- **useCallback:** Memoize functions
- **useRef:** Mutable references that persist across renders

### 3.6 CORS (Cross-Origin Resource Sharing)
**What:** A security mechanism that allows/restricts web pages from making requests to different domains.

**Why used:** Frontend (localhost:5173) needs to call backend (localhost:8000).

**Implementation:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3.7 HTTP/REST API
**What:** HTTP (HyperText Transfer Protocol) is the foundation of data communication on the web. REST (Representational State Transfer) is an architectural style for APIs.

**Methods used:**
- **GET:** Retrieve data (e.g., GET /predict)
- **POST:** Create/trigger actions (e.g., POST /simulate)
- **DELETE:** Remove data (e.g., DELETE /data)

### 3.8 JSON (JavaScript Object Notation)
**What:** A lightweight data interchange format.

**Why used:** Standard format for API communication between frontend and backend.

**Example:**
```json
{
  "data": [
    {
      "ap_id": "AP-LIB-01",
      "zone": "Library Floor 1",
      "est_people": 45,
      "occupancy_pct": 30
    }
  ]
}
```

---

## 4. Backend Implementation

### 4.1 File Structure
```
backend/
├── main.py          # FastAPI application, routes, business logic
├── db.py            # Database operations (SQLite)
├── aggregations.db  # SQLite database file (auto-created)
└── requirements.txt # Python dependencies
```

### 4.2 main.py Explained

#### Application Setup
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="WiFi Crowd Campus API",
    description="Real-time crowd density monitoring",
    version="1.0.0"
)
```
- Creates FastAPI application instance
- Metadata used for auto-generated documentation

#### CORS Configuration
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- Allows frontend to make cross-origin requests
- Without this, browser blocks API calls

#### Campus Locations Configuration
```python
CAMPUS_LOCATIONS = {
    "main_campus": {
        "name": "Main Campus",
        "aps": [
            {"id": "AP-LIB-01", "zone": "Library Floor 1", "capacity": 150},
            {"id": "AP-LIB-02", "zone": "Library Floor 2", "capacity": 120},
            # ... more access points
        ]
    },
    # ... more locations
}
```
- Defines all campus locations and their access points
- Each AP has: id, zone name, capacity

#### People Estimation Function
```python
def estimate_people(unique_devices: int, mean_rssi: float = None) -> float:
    if model and mean_rssi is not None:
        try:
            prediction = model.predict([[unique_devices, mean_rssi]])
            return round(float(prediction[0]), 1)
        except Exception:
            pass
    return round(unique_devices / 1.2, 1) if unique_devices else 0
```
- Converts device count to people estimate
- Uses ML model if available
- Fallback: devices / 1.2 (assumes 1.2 devices per person)

#### Key Endpoints

**GET /predict** - Returns current crowd data:
```python
@app.get('/predict')
async def predict_alias():
    return await counts()
```

**POST /simulate** - Generates test data:
```python
@app.post("/simulate")
async def simulate(rows: int = Query(default=50)):
    # Generate random probe data
    # Insert into database
    # Return success response
```

**POST /locations/{location_id}** - Switch campus location:
```python
@app.post("/locations/{location_id}")
async def set_location(location_id: str):
    global current_location
    current_location = location_id
    db.clear_data()
    return {"success": True, "location": location_id}
```

### 4.3 db.py Explained

#### Database Connection
```python
def get_connection():
    con = sqlite3.connect(DB, timeout=30)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    return con
```
- **WAL (Write-Ahead Logging):** Improves concurrent access performance
- **synchronous=NORMAL:** Balances safety and speed

#### Database Schema
```python
def init_db():
    # observations table - raw probe data
    cur.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        minute TEXT NOT NULL,
        ap_id TEXT NOT NULL,
        device_hash TEXT NOT NULL,
        rssi INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    
    # aggregates table - computed summaries
    cur.execute("""
    CREATE TABLE IF NOT EXISTS aggregates (
        minute TEXT NOT NULL,
        ap_id TEXT NOT NULL,
        unique_devices INTEGER DEFAULT 0,
        mean_rssi REAL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (minute, ap_id)
    )""")
```

#### Aggregation Logic
```python
def compute_aggregates():
    cur.execute('''
        SELECT minute, ap_id, 
               COUNT(DISTINCT device_hash) as unique_devices, 
               AVG(rssi) as mean_rssi 
        FROM observations 
        GROUP BY minute, ap_id
    ''')
```
- Groups raw observations by time and access point
- Counts unique devices (removes duplicates)
- Calculates average signal strength

---

## 5. Frontend Implementation

### 5.1 File Structure
```
frontend/
├── src/
│   ├── App.jsx       # Main React component
│   ├── main.jsx      # Entry point
│   └── index.css     # Minimal styles
├── index.html        # HTML template
├── package.json      # Dependencies
└── vite.config.js    # Vite configuration
```

### 5.2 App.jsx Explained

#### State Management
```javascript
const [data, setData] = useState([]);           // Zone data from API
const [currentLocation, setCurrentLocation] = useState('main_campus');
const [loading, setLoading] = useState(true);   // Loading indicator
const [simulating, setSimulating] = useState(false);
const [lastUpdate, setLastUpdate] = useState(null);
const [message, setMessage] = useState(null);   // User feedback
```
- **useState:** React hook for component-level state
- Each state variable has a setter function

#### Refs for Mutable Values
```javascript
const isFetching = useRef(false);
```
- **useRef:** Creates a mutable reference
- Doesn't cause re-renders when changed
- Used to prevent duplicate API calls

#### Data Fetching
```javascript
const fetchData = useCallback(async () => {
    if (isFetching.current) return;  // Prevent duplicate calls
    isFetching.current = true;
    
    try {
        const res = await fetch(`${API_BASE}/predict`);
        const json = await res.json();
        setData(json.data || []);
        setLastUpdate(new Date().toLocaleTimeString());
    } catch {
        console.error('Failed to fetch');
    } finally {
        isFetching.current = false;
    }
}, []);
```
- **useCallback:** Memoizes function to prevent recreation on every render
- **async/await:** Modern JavaScript for handling asynchronous operations
- **fetch:** Browser API for HTTP requests

#### Auto-Refresh with useEffect
```javascript
useEffect(() => {
    if (globalIntervalId) clearInterval(globalIntervalId);
    fetchData();
    globalIntervalId = setInterval(fetchData, POLL_INTERVAL);
    return () => {
        if (globalIntervalId) clearInterval(globalIntervalId);
        globalIntervalId = null;
    };
}, [fetchData]);
```
- **useEffect:** Runs side effects after render
- **setInterval:** Calls fetchData every 8 seconds
- **Cleanup function:** Clears interval when component unmounts

#### Conditional Rendering
```javascript
{loading && data.length === 0 ? (
    <p>Loading...</p>
) : data.length === 0 ? (
    <p>No data. Click "Simulate Data" to generate sample data.</p>
) : (
    <div>
        {data.map((zone) => (
            <ZoneCard key={zone.ap_id} zone={zone} />
        ))}
    </div>
)}
```
- **Ternary operator:** Conditional rendering based on state
- **map():** Renders list of zone cards

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│      observations       │       │       aggregates        │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, AUTO)           │       │ minute (PK)             │
│ minute (TEXT)           │──────►│ ap_id (PK)              │
│ ap_id (TEXT)            │       │ unique_devices (INT)    │
│ device_hash (TEXT)      │       │ mean_rssi (REAL)        │
│ rssi (INTEGER)          │       │ updated_at (TIMESTAMP)  │
│ created_at (TIMESTAMP)  │       └─────────────────────────┘
└─────────────────────────┘
         │
         │ GROUP BY minute, ap_id
         │ COUNT(DISTINCT device_hash)
         │ AVG(rssi)
         ▼
    [Aggregated Data]
```

### 6.2 Table Descriptions

**observations** - Raw probe request data:
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Auto-incrementing primary key |
| minute | TEXT | Timestamp rounded to minute (e.g., "2024-12-08T14:30") |
| ap_id | TEXT | Access point identifier (e.g., "AP-LIB-01") |
| device_hash | TEXT | Hashed MAC address of device |
| rssi | INTEGER | Signal strength in dBm (-35 to -85) |
| created_at | TIMESTAMP | When record was inserted |

**aggregates** - Computed summaries:
| Column | Type | Description |
|--------|------|-------------|
| minute | TEXT | Timestamp (part of composite primary key) |
| ap_id | TEXT | Access point ID (part of composite primary key) |
| unique_devices | INTEGER | Count of unique devices |
| mean_rssi | REAL | Average signal strength |
| updated_at | TIMESTAMP | Last computation time |

### 6.3 SQL Operations

**Insert probe data:**
```sql
INSERT INTO observations (minute, ap_id, device_hash, rssi) 
VALUES (?, ?, ?, ?)
```

**Compute aggregates:**
```sql
SELECT minute, ap_id, 
       COUNT(DISTINCT device_hash) as unique_devices, 
       AVG(rssi) as mean_rssi 
FROM observations 
GROUP BY minute, ap_id
```

**Get latest data per AP:**
```sql
SELECT a.ap_id, a.unique_devices, a.mean_rssi
FROM aggregates a
INNER JOIN (
    SELECT ap_id, MAX(minute) as max_minute
    FROM aggregates
    GROUP BY ap_id
) latest ON a.ap_id = latest.ap_id AND a.minute = latest.max_minute
```

---

## 7. API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### GET /
Health check and basic info.

**Response:**
```json
{
    "status": "online",
    "service": "WiFi Crowd Campus",
    "version": "1.0.0",
    "current_location": "main_campus"
}
```

#### GET /predict
Get current crowd density data.

**Response:**
```json
{
    "data": [
        {
            "ap_id": "AP-LIB-01",
            "zone": "Library Floor 1",
            "unique_devices": 54,
            "mean_rssi": -62.5,
            "est_people": 45,
            "capacity": 150,
            "occupancy_pct": 30.0,
            "status": "low"
        }
    ],
    "location": "main_campus",
    "location_name": "Main Campus",
    "timestamp": "2024-12-08T14:30:00",
    "total_people": 245,
    "zones_count": 8
}
```

#### GET /locations
Get available campus locations.

**Response:**
```json
{
    "current": "main_campus",
    "available": {
        "main_campus": {
            "name": "Main Campus",
            "ap_count": 8,
            "zones": ["Library Floor 1", "Library Floor 2", ...]
        }
    }
}
```

#### POST /locations/{location_id}
Switch to a different campus location.

**Response:**
```json
{
    "success": true,
    "location": "engineering_block",
    "name": "Engineering Block"
}
```

#### POST /simulate
Generate simulated probe data for testing.

**Query Parameters:**
- `rows` (optional): Number of time periods to simulate (default: 50)

**Response:**
```json
{
    "success": true,
    "generated": 12500,
    "accepted": 12500,
    "location": "main_campus",
    "location_name": "Main Campus",
    "zones": 8,
    "status": "ok"
}
```

#### POST /ingest
Ingest real probe request data (for production use).

**Request Body:**
```json
[
    {
        "ts": 1702043400,
        "ap_iface": "AP-LIB-01",
        "device": "aa:bb:cc:dd:ee:ff",
        "rssi": -65
    }
]
```

#### DELETE /data
Clear all data from database.

---

## 8. Computer Networks Concepts

### 8.1 WiFi Probe Requests
**What:** When a mobile device's WiFi is enabled, it periodically broadcasts "probe requests" to discover nearby access points.

**Technical Details:**
- Uses IEEE 802.11 management frames
- Contains device MAC address
- Sent on all WiFi channels
- Frequency: Every few seconds when not connected

**In this project:** We capture these probes to count unique devices in range of each access point.

### 8.2 MAC Address
**What:** Media Access Control address - a unique identifier assigned to network interfaces.

**Format:** `AA:BB:CC:DD:EE:FF` (48 bits, 6 octets)

**Privacy concern:** Modern devices use MAC randomization, which this system accounts for by using hashing.

### 8.3 RSSI (Received Signal Strength Indicator)
**What:** A measurement of signal power in dBm (decibels relative to milliwatt).

**Values:**
- -30 dBm: Excellent (very close)
- -50 dBm: Good
- -70 dBm: Fair
- -85 dBm: Poor (far away)

**In this project:** RSSI helps estimate distance from access point.

### 8.4 Access Point (AP)
**What:** A networking device that creates a wireless local area network (WLAN).

**In this project:** Each AP covers a specific zone (Library, Cafeteria, etc.). The AP ID is used to identify the zone.

### 8.5 HTTP Protocol
**What:** HyperText Transfer Protocol - the foundation of data communication on the web.

**Key aspects used:**
- **Request/Response model:** Client sends request, server responds
- **Methods:** GET (read), POST (create/action), DELETE (remove)
- **Status codes:** 200 (OK), 404 (Not Found), 500 (Server Error)
- **Headers:** Content-Type: application/json

### 8.6 REST Architecture
**What:** Representational State Transfer - an architectural style for APIs.

**Principles followed:**
1. **Stateless:** Each request contains all information needed
2. **Resource-based:** URLs represent resources (/locations, /predict)
3. **HTTP methods:** Used as verbs (GET, POST, DELETE)
4. **JSON responses:** Standard data format

### 8.7 Client-Server Model
**What:** A distributed architecture where clients request services from servers.

**In this project:**
- **Server:** FastAPI backend (port 8000)
- **Client:** React frontend (port 5173)
- **Communication:** HTTP requests over TCP/IP

### 8.8 Polling vs WebSockets
**Polling (used in this project):**
- Client periodically requests updates (every 8 seconds)
- Simple to implement
- Some latency acceptable

**WebSockets (alternative):**
- Persistent two-way connection
- Real-time updates
- More complex

---

## 9. How Data Flows

### 9.1 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW - Step by Step                    │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Data Generation (Simulation)
────────────────────────────────────
User clicks "Simulate Data" button
            │
            ▼
Frontend sends: POST /simulate
            │
            ▼
Backend generates random probe data:
- For each time period (50 default)
- For each access point in location
- Generate random devices with RSSI values
            │
            ▼
Data inserted into SQLite database

STEP 2: Aggregation
───────────────────
Backend computes aggregates:
            │
            ▼
┌─────────────────────────────────────────────┐
│ SELECT minute, ap_id,                        │
│        COUNT(DISTINCT device_hash),          │
│        AVG(rssi)                             │
│ FROM observations                            │
│ GROUP BY minute, ap_id                       │
└─────────────────────────────────────────────┘
            │
            ▼
Results stored in aggregates table

STEP 3: Frontend Fetches Data (Every 8 seconds)
───────────────────────────────────────────────
            │
            ▼
Frontend sends: GET /predict
            │
            ▼
Backend retrieves latest aggregates:
- Gets most recent data per AP
- Calculates est_people (devices / 1.2)
- Calculates occupancy_pct
- Adds zone info from config
            │
            ▼
Returns JSON response
            │
            ▼
Frontend updates React state
            │
            ▼
React re-renders zone cards with new data
            │
            ▼
User sees updated heatmap
```

### 9.2 Data Transformation

```
Raw Probe Data                Aggregated Data              Display Data
─────────────                 ───────────────              ────────────
{                             {                            {
  minute: "14:30"               minute: "14:30"              ap_id: "AP-LIB-01"
  ap_id: "AP-LIB-01"           ap_id: "AP-LIB-01"           zone: "Library Floor 1"
  device: "abc123"    ───►      unique_devices: 54  ───►    est_people: 45
  rssi: -65                     mean_rssi: -62.5             capacity: 150
}                             }                              occupancy_pct: 30
{                                                            status: "low"
  minute: "14:30"                                          }
  ap_id: "AP-LIB-01"
  device: "def456"
  rssi: -60
}
... (hundreds of probes)
```

---

## 10. Setup & Running

### 10.1 Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 10.2 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install fastapi uvicorn joblib

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 10.3 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 10.4 Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 10.5 Usage
1. Open frontend in browser
2. Select a campus location from dropdown
3. Click "Simulate Data" to generate test data
4. View zone heatmap with crowd density
5. Data auto-refreshes every 8 seconds

---

## Appendix A: Key Code Snippets

### Backend - People Estimation
```python
def estimate_people(unique_devices: int, mean_rssi: float = None) -> float:
    # If ML model is loaded, use it
    if model and mean_rssi is not None:
        prediction = model.predict([[unique_devices, mean_rssi]])
        return round(float(prediction[0]), 1)
    # Fallback: assume 1.2 devices per person
    return round(unique_devices / 1.2, 1)
```

### Frontend - Auto-refresh Hook
```javascript
useEffect(() => {
    fetchData();  // Initial fetch
    const interval = setInterval(fetchData, 8000);  // Poll every 8s
    return () => clearInterval(interval);  // Cleanup on unmount
}, []);
```

### Database - Get Latest Aggregates
```sql
SELECT a.ap_id, a.unique_devices, a.mean_rssi
FROM aggregates a
INNER JOIN (
    SELECT ap_id, MAX(minute) as max_minute
    FROM aggregates
    GROUP BY ap_id
) latest ON a.ap_id = latest.ap_id 
        AND a.minute = latest.max_minute
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| API | Application Programming Interface - a set of protocols for building software |
| AP | Access Point - a device that creates a WiFi network |
| CORS | Cross-Origin Resource Sharing - browser security mechanism |
| dBm | Decibels relative to milliwatt - unit for signal strength |
| HTTP | HyperText Transfer Protocol - web communication protocol |
| JSON | JavaScript Object Notation - data interchange format |
| MAC | Media Access Control - hardware address for network devices |
| REST | Representational State Transfer - API architectural style |
| RSSI | Received Signal Strength Indicator - signal power measurement |
| SQL | Structured Query Language - database query language |
| WAL | Write-Ahead Logging - database journaling mode |

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Project:** WiFi Crowd Campus - Computer Networks Project

