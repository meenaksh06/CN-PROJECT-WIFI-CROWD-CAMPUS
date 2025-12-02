
import React from 'react';


function colorFromValue(v, max = 1) {
  const pct = Math.min(1, Math.max(0, v / Math.max(max, 1)));
  const r = Math.round(255 * pct);
  const g = Math.round(200 * (1 - pct));
  return `rgb(${r}, ${g}, 80)`;
}

function formatNumber(n, decimals = 1) {
  if (n === null || typeof n === 'undefined' || Number.isNaN(Number(n))) return '-';
  return Number(n).toFixed(decimals);
}

export default function Heatmap({ items = [] }) {
  if (!items || items.length === 0) {
    return <div className="p-6 text-gray-400">No data to show.</div>;
  }

  // determine max for color scaling (use est_people first, fallback to unique_devices)
  const numericValues = items.map(it => {
    const v = Number(it.est_people ?? it.unique_devices ?? 0);
    return Number.isFinite(v) ? v : 0;
  });
  const maxVal = Math.max(1, ...numericValues); // avoid divide by zero

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-300">Zones: {items.length}</div>
        <div className="text-xs text-gray-400">Color = estimated people (scaled to max {formatNumber(maxVal,0)})</div>
      </div>

      <div
        className="grid gap-4"
        style={{

          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
        }}
      >
        {items.map((it, i) => {
          const value = Number(it.est_people ?? it.unique_devices ?? 0);
          const bg = colorFromValue(value, maxVal);

          return (
            <div
              key={`${it.ap_id}-${i}`}
              className="rounded-lg p-3 h-36 shadow-lg border border-gray-800"
              style={{ background: bg }}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white/90">Zone</div>
                  <div className="text-lg font-bold text-white mt-1 truncate">{it.ap_id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/95 font-bold">{formatNumber(value, 1)}</div>
                  <div className="text-xs text-white/80">est</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/90 flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/90">Devices</span>
                  <span className="font-semibold">{it.unique_devices ?? '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/90">RSSI</span>
                  <span className="font-semibold">{formatNumber(it.mean_rssi, 1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>


      <div className="mt-4 text-xs text-gray-400 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div style={{ width: 28, height: 14, background: colorFromValue(0, maxVal) }} className="rounded" />
          <div>Low</div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 28, height: 14, background: colorFromValue(maxVal / 2, maxVal) }} className="rounded" />
          <div>Medium</div>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ width: 28, height: 14, background: colorFromValue(maxVal, maxVal) }} className="rounded" />
          <div>High</div>
        </div>
      </div>
    </div>
  );
}
