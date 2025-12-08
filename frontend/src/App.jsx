import React, { useEffect, useState, useRef, useCallback } from 'react';

const API_BASE = 'http://127.0.0.1:8000';
const POLL_INTERVAL = 8000;

const LOCATIONS = {
  main_campus: 'Main Campus',
  engineering_block: 'Engineering Block', 
  student_center: 'Student Center',
  science_block: 'Science Block',
};

let globalIntervalId = null;

export default function App() {
  const [data, setData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState('main_campus');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [message, setMessage] = useState(null);
  
  const isFetching = useRef(false);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2000);
  };

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    try {
      const res = await fetch(`${API_BASE}/predict`);
      const json = await res.json();
      setData(json.data || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      console.error('Failed to fetch');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const handleLocationChange = async (e) => {
    const locationId = e.target.value;
    if (isFetching.current) return;
    
    isFetching.current = true;
    setLoading(true);
    
    try {
      await fetch(`${API_BASE}/locations/${locationId}`, { method: 'POST' });
      setCurrentLocation(locationId);
      showMessage(`Switched to ${LOCATIONS[locationId]}`);
      isFetching.current = false;
      await fetchData();
    } catch {
      showMessage('Failed to switch');
      isFetching.current = false;
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (isFetching.current || simulating) return;
    
    setSimulating(true);
    isFetching.current = true;
    
    try {
      const res = await fetch(`${API_BASE}/simulate`, { method: 'POST' });
      const json = await res.json();
      showMessage(`Generated ${json.generated} probes`);
      isFetching.current = false;
      await fetchData();
    } catch {
      showMessage('Simulation failed');
      isFetching.current = false;
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (globalIntervalId) clearInterval(globalIntervalId);
    fetchData();
    globalIntervalId = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (globalIntervalId) clearInterval(globalIntervalId);
      globalIntervalId = null;
    };
  }, [fetchData]);

  const getColor = (pct) => {
    if (pct > 75) return '#ef4444';
    if (pct > 40) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111827', 
      color: '#f3f4f6',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid #374151',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          WiFi Crowd Campus
        </h1>
        <span style={{ fontSize: '14px', color: '#9ca3af' }}>
          {lastUpdate ? `Updated: ${lastUpdate}` : 'Loading...'}
        </span>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {message && (
          <div style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: '#1f2937',
            border: '1px solid #374151',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={currentLocation}
            onChange={handleLocationChange}
            disabled={loading || simulating}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {Object.entries(LOCATIONS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <button
            onClick={handleSimulate}
            disabled={loading || simulating}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: loading || simulating ? 'not-allowed' : 'pointer',
              opacity: loading || simulating ? 0.6 : 1
            }}
          >
            {simulating ? 'Simulating...' : 'Simulate Data'}
          </button>

          {/* <button
            onClick={fetchData}
            disabled={loading || simulating}
            style={{
              padding: '10px 20px',
              backgroundColor: '#374151',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: loading || simulating ? 'not-allowed' : 'pointer',
              opacity: loading || simulating ? 0.6 : 1
            }}
          >
            Refresh
          </button> */}
        </div>

        <h2 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '600' }}>
          Zone Heatmap - {LOCATIONS[currentLocation]}
        </h2>

        {loading && data.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : data.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No data. Click "Simulate Data" to generate sample data.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {data.map((zone) => (
              <div
                key={zone.ap_id}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  padding: '20px',
                  borderLeft: `4px solid ${getColor(zone.occupancy_pct || 0)}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      margin: 0 
                    }}>
                      {zone.ap_name || zone.ap_id}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      margin: '4px 0 0 0'
                    }}>
                      {zone.ap_id}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: getColor(zone.occupancy_pct || 0)
                  }}>
                    {Math.round(zone.est_people || 0)}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '6px'
                  }}>
                    <span>Occupancy</span>
                    <span style={{ color: getColor(zone.occupancy_pct || 0) }}>
                      {Math.round(zone.occupancy_pct || 0)}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: '#374151',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(zone.occupancy_pct || 0, 100)}%`,
                      height: '100%',
                      backgroundColor: getColor(zone.occupancy_pct || 0),
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}>
                    <span>Devices: {zone.unique_devices || 0}</span>
                    <span>Capacity: {zone.capacity || 100}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          display: 'flex',
          gap: '24px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#22c55e',
              borderRadius: '2px'
            }} />
            <span>Low (&lt;40%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#f59e0b',
              borderRadius: '2px'
            }} />
            <span>Medium (40-75%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#ef4444',
              borderRadius: '2px'
            }} />
            <span>High (&gt;75%)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
