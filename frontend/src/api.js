const API_BASE = 'http://127.0.0.1:8000';

export async function getDensity() {
  const res = await fetch(`${API_BASE}/predict`);
  if (!res.ok) throw new Error(`Failed to fetch density: ${res.status}`);
  return res.json();
}

export async function getLocations() {
  const res = await fetch(`${API_BASE}/locations`);
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return res.json();
}

export async function setLocation(locationId) {
  const res = await fetch(`${API_BASE}/locations/${locationId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to set location: ${res.status}`);
  return res.json();
}

export async function simulate(rows = 100) {
  const res = await fetch(`${API_BASE}/simulate?rows=${rows}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Simulation failed: ${res.status}`);
  return res.json();
}

export async function postIngest(batch = []) {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`);
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export default { getDensity, getLocations, setLocation, simulate, postIngest, checkHealth };
