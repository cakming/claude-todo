export default function Sidebar({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'epics', icon: '📊', label: 'Epics' },
    { id: 'features', icon: '✨', label: 'Features' },
    { id: 'tasks', icon: '✅', label: 'Tasks' },
    { id: 'tree', icon: '🌲', label: 'Tree View' },
    { id: 'activity', icon: '📜', label: 'Activity' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
