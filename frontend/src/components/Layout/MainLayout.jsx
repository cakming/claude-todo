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
import AdminUsersView from '../../pages/AdminUsersView';
import EmptyState from '../Common/EmptyState';

export default function MainLayout() {
  const [currentView, setCurrentView] = useState('epics');
  const { currentProject } = useApp();

  // Keyboard shortcuts: 1-6 switch views (ignored while typing in a field).
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      const map = { 1: 'epics', 2: 'features', 3: 'tasks', 4: 'tree', 5: 'docs', 6: 'activity' };
      if (map[e.key]) setCurrentView(map[e.key]);
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
        return <EpicView />;
      case 'features':
        return <FeatureView />;
      case 'tasks':
        return <TaskView />;
      case 'tree':
        return <TreeView />;
      case 'docs':
        return <DocsView />;
      case 'activity':
        return <ActivityView />;
      default:
        return <EpicView />;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}
