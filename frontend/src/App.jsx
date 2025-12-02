import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Heatmap from "./components/Heatmap";
import { getDensity } from "./api";

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
  const items = (rawArray || []).map((r) => ({
    ap_id: r.ap_id || r.ap_iface || "AP-unknown",
    unique_devices: Number(r.unique_devices ?? 0),
    mean_rssi: r.mean_rssi,
    est_people: Number(
      typeof r.est_people !== "undefined"
        ? r.est_people
        : r.unique_devices
        ? r.unique_devices / 1.2
        : 0
    ),
  }));

  // sort AP IDs numerically where possible
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
  const [simLoading, setSimLoading] = useState(false); // NEW

  async function fetchDensity() {
    try {
      setLoading(true);
      setError(null);

      const res = await getDensity();
      const payload = res?.data?.data || res?.data || [];
      const parsed = normalizeItems(payload);

      setItems(parsed);
      setUpdatedAt(new Date().toLocaleString());
    } catch (err) {
      console.error(err);
      setError(
        "Could not fetch density from backend. Check backend is running and CORS is enabled."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function changeLocation() {
    try {
      setSimLoading(true);
      setError(null);

      await fetch("http://localhost:8000/simulate", {
        method: "POST",
      });

      await fetchDensity();
    } catch (err) {
      console.error(err);
      setError("Simulation failed. Check backend logs.");
    } finally {
      setSimLoading(false);
    }
  }

  useEffect(() => {
    fetchDensity();
    const t = setInterval(fetchDensity, 8000);
    return () => clearInterval(t);
  }, []);

  const total = items.reduce(
    (acc, it) => acc + (Number(it.est_people) || 0),
    0
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            title="Total estimated people"
            value={loading ? "..." : total.toFixed(1)}
            subtitle={`Updated: ${updatedAt || "-"}`}
          />

          <Card
            title="Zones monitored"
            value={items.length || "0"}
            subtitle="Number of APs shown on heatmap"
          />

          {/* Actions Card */}
          <div className="bg-[#071123] p-4 rounded-lg border border-gray-800 flex flex-col justify-between">
            <div>
              <div className="text-sm text-gray-300">Actions</div>
              <div className="text-xs text-gray-400 mt-1">
                Simulate crowd change
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={changeLocation}
                disabled={simLoading}
                className={`px-3 py-1 rounded text-sm text-white ${
                  simLoading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {simLoading ? "Simulating..." : "Change Location"}
              </button>
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
