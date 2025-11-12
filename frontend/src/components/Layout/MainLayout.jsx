import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';
import EpicView from '../../pages/EpicView';
import FeatureView from '../../pages/FeatureView';
import TaskView from '../../pages/TaskView';
import TreeView from '../../pages/TreeView';
import EmptyState from '../Common/EmptyState';

export default function MainLayout() {
  const [currentView, setCurrentView] = useState('epics');
  const { currentProject } = useApp();

  const renderView = () => {
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
