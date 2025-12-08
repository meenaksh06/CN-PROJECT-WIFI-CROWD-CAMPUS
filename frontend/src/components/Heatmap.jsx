import React from 'react';

function getHeatColor(occupancyPct) {
  if (occupancyPct >= 75) {
    return {
      bg: 'linear-gradient(135deg, #ff4757 0%, #ff6b35 100%)',
      glow: 'rgba(255, 71, 87, 0.3)',
      text: '#fff',
      badge: 'badge-high',
    };
  } else if (occupancyPct >= 40) {
    return {
      bg: 'linear-gradient(135deg, #ff9f43 0%, #feca57 100%)',
      glow: 'rgba(255, 159, 67, 0.3)',
      text: '#1a1a2e',
      badge: 'badge-medium',
    };
  } else {
    return {
      bg: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
      glow: 'rgba(0, 212, 255, 0.3)',
      text: '#0a0e17',
      badge: 'badge-low',
    };
  }
}

function formatNumber(n, decimals = 1) {
  if (n === null || typeof n === 'undefined' || Number.isNaN(Number(n))) return '-';
  return Number(n).toFixed(decimals);
}

function ZoneCard({ item, index }) {
  const occupancy = item.occupancy_pct || 0;
  const colors = getHeatColor(occupancy);
  
  return (
    <div
      className="animate-scale-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="relative rounded-2xl p-5 h-44 transition-all duration-300 hover:scale-[1.02] cursor-default overflow-hidden group"
        style={{
          background: colors.bg,
          boxShadow: `0 8px 32px ${colors.glow}`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-semibold uppercase tracking-wider opacity-80"
                style={{ color: colors.text }}
              >
                Zone
              </span>
              <span className={`badge ${colors.badge}`}>
                {item.status || 'active'}
              </span>
            </div>
            <h3 
              className="text-lg font-bold mt-1 truncate"
              style={{ color: colors.text }}
              title={item.zone || item.ap_id}
            >
              {item.zone || item.ap_id}
            </h3>
            <p 
              className="text-xs opacity-70 font-mono truncate"
              style={{ color: colors.text }}
            >
              {item.ap_id}
            </p>
          </div>
          
          <div className="text-right ml-3">
            <div 
              className="text-3xl font-bold font-mono"
              style={{ color: colors.text }}
            >
              {formatNumber(item.est_people, 0)}
            </div>
            <div 
              className="text-xs uppercase tracking-wide opacity-80"
              style={{ color: colors.text }}
            >
              people
            </div>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-xs mb-1" style={{ color: colors.text }}>
            <span className="opacity-70">Occupancy</span>
            <span className="font-mono font-semibold">{formatNumber(occupancy, 0)}%</span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(occupancy, 100)}%`,
                background: 'rgba(255,255,255,0.5)',
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-3 relative z-10">
          <div>
            <span className="text-xs opacity-60 block" style={{ color: colors.text }}>Devices</span>
            <span className="font-mono font-semibold text-sm" style={{ color: colors.text }}>{item.unique_devices ?? '-'}</span>
          </div>
          <div>
            <span className="text-xs opacity-60 block" style={{ color: colors.text }}>RSSI</span>
            <span className="font-mono font-semibold text-sm" style={{ color: colors.text }}>{formatNumber(item.mean_rssi, 0)} dBm</span>
          </div>
          <div>
            <span className="text-xs opacity-60 block" style={{ color: colors.text }}>Capacity</span>
            <span className="font-mono font-semibold text-sm" style={{ color: colors.text }}>{item.capacity ?? '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Heatmap({ items = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="h-44 rounded-2xl bg-gray-800/50 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Data Available</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Click "Simulate Data" to generate sample crowd data for this location.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>{items.length} zones monitored</span>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #00d4ff, #00ff88)' }} />
            <span className="text-gray-400">Low (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #ff9f43, #feca57)' }} />
            <span className="text-gray-400">Medium (40-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #ff4757, #ff6b35)' }} />
            <span className="text-gray-400">High (&gt;75%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ZoneCard key={item.ap_id || index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
