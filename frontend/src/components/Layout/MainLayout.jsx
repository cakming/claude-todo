import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';
import EpicView from '../../pages/EpicView';
import FeatureView from '../../pages/FeatureView';
import TaskView from '../../pages/TaskView';
import TreeView from '../../pages/TreeView';
import DocsView from '../../pages/DocsView';
import ActivityView from '../../pages/ActivityView';
import TrashView from '../../pages/TrashView';
import AdminUsersView from '../../pages/AdminUsersView';
import EmptyState from '../Common/EmptyState';

export default function MainLayout() {
  const [currentView, setCurrentView] = useState('epics');
  // Drill-down filter carried between views (e.g. Epic card -> its Features).
  const [viewFilter, setViewFilter] = useState(null);
  const { currentProject } = useApp();

  // Navigate to a view, optionally focusing a filter. Manual navigation
  // (sidebar/keyboard) clears any drill-down filter.
  const navigate = (view, filter = null) => {
    setViewFilter(filter);
    setCurrentView(view);
  };

  // Keyboard shortcuts: 1-7 switch views (ignored while typing in a field).
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      const map = { 1: 'epics', 2: 'features', 3: 'tasks', 4: 'tree', 5: 'docs', 6: 'activity', 7: 'trash' };
      if (map[e.key]) navigate(map[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderView = () => {
    // Users management is not project-scoped.
    if (currentView === 'users') {
      return <AdminUsersView />;
    }

    if (!currentProject) {
      return (
        <EmptyState
          icon="📁"
          title="No Project Selected"
          message="Please select a project from the dropdown above or create a new one to get started."
        />
      );
    }

    switch (currentView) {
      case 'epics':
        return <EpicView onDrill={(epic) => navigate('features', { epicId: epic._id })} />;
      case 'features':
        return (
          <FeatureView
            drillFilter={viewFilter}
            onDrill={(feature) => navigate('tasks', { featureId: feature._id })}
          />
        );
      case 'tasks':
        return <TaskView drillFilter={viewFilter} />;
      case 'tree':
        return <TreeView />;
      case 'docs':
        return <DocsView />;
      case 'activity':
        return <ActivityView />;
      case 'trash':
        return <TrashView />;
      default:
        return <EpicView />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} setCurrentView={(v) => navigate(v)} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
