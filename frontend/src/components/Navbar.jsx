export default function Navbar() {
    return (
      <nav className="w-full p-4 bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-green-500 flex items-center justify-center font-bold">WF</div>
            <h1 className="text-xl font-semibold text-white">WiFi Crowd Campus</h1>
          </div>
          <div className="text-sm text-gray-300">Live density & heatmap</div>
        </div>
      </nav>
    );
  }
  