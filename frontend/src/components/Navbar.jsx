import React from 'react';

export default function Navbar({ isLive = true, lastUpdate = null }) {
  return (
    <nav className="sticky top-0 z-40 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              {isLive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full live-indicator shadow-lg shadow-emerald-500/50" />
              )}
            </div>
            
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                WiFi Crowd <span className="gradient-text">Campus</span>
              </h1>
              <p className="text-xs text-gray-400 -mt-0.5">Real-time density monitoring</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 live-indicator' : 'bg-gray-500'}`} />
              <span className="text-sm text-gray-300">
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>

            {lastUpdate && (
              <div className="text-sm text-gray-400">
                <span className="text-gray-500">Updated: </span>
                <span className="font-mono text-cyan-400">{lastUpdate}</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <svg className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-cyan-400">8s refresh</span>
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 live-indicator' : 'bg-gray-500'}`} />
            <span className="text-xs text-gray-400">{isLive ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </nav>
  );
}
