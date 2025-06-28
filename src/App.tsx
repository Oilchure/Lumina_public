import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import WordsPage from './pages/WordsPage.tsx';
import KnowledgePage from './pages/KnowledgePage.tsx';
import TasksPage from './pages/TasksPage.tsx';
import DataManagementPage from './pages/DataManagementPage.tsx';
import OutlineManagementPage from './pages/OutlineManagementPage.tsx';
import MindMapPage from './pages/MindMapPage.tsx'; 
import { DataProvider, useData } from './contexts/DataContext.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';

const AppContent: React.FC = () => {
  const { isLoading, error } = useData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="正在同步数据..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold">同步错误</p>
            <p>{error} 您可以继续使用，但更改可能不会被保存。</p>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/words" replace />} />
          <Route path="/words" element={<WordsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/outline" element={<OutlineManagementPage />} />
          <Route path="/mindmap" element={<MindMapPage />} />
          <Route path="/data" element={<DataManagementPage />} />
          <Route path="/settings" element={<Navigate to="/data" replace />} />
        </Routes>
      </main>
      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
        Lumina © {new Date().getFullYear()} by Oilchure. 专为科研学习打造.
      </footer>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
