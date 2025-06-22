import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import WordsPage from './pages/WordsPage.tsx';
import KnowledgePage from './pages/KnowledgePage.tsx';
import TasksPage from './pages/TasksPage.tsx';
import DataManagementPage from './pages/DataManagementPage.tsx';
import OutlineManagementPage from './pages/OutlineManagementPage.tsx';
import MindMapPage from './pages/MindMapPage.tsx'; 
import { DataProvider } from './contexts/DataContext.tsx';

const App: React.FC = () => {
  return (
    <DataProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/words" replace />} />
            <Route path="/words" element={<WordsPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/outline" element={<OutlineManagementPage />} />
            <Route path="/mindmap" element={<MindMapPage />} />
            <Route path="/data" element={<DataManagementPage />} />
            <Route path="/settings" element={<Navigate to="/data" replace />} /> {/* Redirect old settings path */}
          </Routes>
        </main>
        <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
          Lumina © {new Date().getFullYear()} by Oilchure. 专为科研学习打造.
        </footer>
      </div>
    </DataProvider>
  );
};

export default App;