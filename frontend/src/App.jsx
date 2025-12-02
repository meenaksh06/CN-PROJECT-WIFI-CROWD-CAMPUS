import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Heatmap from './components/Heatmap';
import { getDensity } from './api';

function Card({ title, value, subtitle }) {
  return (
    <div className="bg-[#071123] p-4 rounded-lg shadow border border-gray-800">
      <div className="text-sm text-gray-300">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

function normalizeItems(rawArray = []) {
  // rawArray expected: [{ap_id, unique_devices, mean_rssi, est_people}, ...]
  // Map to consistent structure and sort by AP id numeric suffix if present
  const items = (rawArray || []).map((r) => ({
    ap_id: r.ap_id || r.ap_iface || 'AP-unknown',
    unique_devices: Number(r.unique_devices ?? r.unique_devices ?? 0),
    mean_rssi: r.mean_rssi,
    est_people: Number(typeof r.est_people !== 'undefined' ? r.est_people : (r.unique_devices ? (r.unique_devices / 1.2) : 0)),
  }));

  // try to sort: if ap_id contains number, sort by that, fallback to string sort
  items.sort((a, b) => {
    const numA = (a.ap_id.match(/\d+/) || [null])[0];
    const numB = (b.ap_id.match(/\d+/) || [null])[0];
    if (numA && numB) return Number(numA) - Number(numB);
    if (numA) return -1;
    if (numB) return 1;
    return a.ap_id.localeCompare(b.ap_id);
  });

  return items;
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState(null);

  async function fetchDensity() {
    setLoading(true);
    setError(null);
    try {
      const res = await getDensity();
      // The backend returns { data: [...] }
      const payload = res?.data?.data || res?.data || [];
      const parsed = normalizeItems(payload);
      setItems(parsed);
      setUpdatedAt(new Date().toLocaleString());
    } catch (err) {
      console.error(err);
      setError('Could not fetch density from backend. Check backend is running and CORS is enabled.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDensity();
    const t = setInterval(fetchDensity, 8000); // refresh every 8s
    return () => clearInterval(t);
  }, []);

  const total = items.reduce((acc, it) => acc + (Number(it.est_people) || 0), 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total estimated people" value={loading ? '...' : total.toFixed(1)} subtitle={`Updated: ${updatedAt || '-'}`} />
          <Card title="Zones monitored" value={items.length || '0'} subtitle="Number of APs shown on heatmap" />
          <div className="bg-[#071123] p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-300">Actions</div>
                <div className="text-xs text-gray-400 mt-1">Manual refresh or debugging</div>
              </div>
              <div className="flex gap-2">
                <button onClick={fetchDensity} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Refresh</button>
              </div>
            </div>
            {error && <div className="text-sm text-red-400 mt-3">{error}</div>}
          </div>
        </div>

        <div className="bg-[#071123] rounded-lg border border-gray-800 p-4">
          <h2 className="text-lg font-semibold mb-2">Heatmap</h2>
          {loading ? (
            <div className="p-6 text-gray-400">Loading...</div>
          ) : (
            <Heatmap items={items} columns={4} />
          )}
        </div>
      </div>
    </div>
  );
}
