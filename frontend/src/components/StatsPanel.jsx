import React from 'react';

function StatCard({ icon, label, value, subValue, color = 'cyan' }) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-5
      bg-gradient-to-br ${colorClasses[color]}
      border backdrop-blur-sm
      transition-all duration-300 hover:scale-[1.02]
    `}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-current opacity-5" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-xl bg-current/10 ${colorClasses[color].split(' ')[3]}`}>
            {icon}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1 font-mono">{value}</p>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

export default function StatsPanel({ data, loading, locationName }) {
  const totalPeople = data?.total_people || 0;
  const zonesCount = data?.zones_count || 0;
  const zones = data?.data || [];
  
  const avgOccupancy = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + (z.occupancy_pct || 0), 0) / zones.length)
    : 0;
  
  const highDensityZones = zones.filter(z => z.status === 'high').length;
  const totalDevices = zones.reduce((sum, z) => sum + (z.unique_devices || 0), 0);
  const avgRssi = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + (z.mean_rssi || 0), 0) / zones.length)
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{locationName || 'Campus'}</h2>
            <p className="text-xs text-gray-400">Real-time crowd density</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          label="Total People"
          value={Math.round(totalPeople)}
          subValue="Estimated across all zones"
          color="cyan"
        />
        
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="Avg Occupancy"
          value={`${avgOccupancy}%`}
          subValue={`${zonesCount} zones monitored`}
          color="green"
        />
        
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          label="High Density"
          value={highDensityZones}
          subValue={highDensityZones > 0 ? 'Zones above 75% capacity' : 'All zones normal'}
          color="orange"
        />
        
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          label="Active Devices"
          value={totalDevices}
          subValue={avgRssi ? `Avg signal: ${avgRssi} dBm` : 'WiFi probe data'}
          color="purple"
        />
      </div>
    </div>
  );
}
