import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.ts';
import { Word, KnowledgePoint, Category, ExportData, Task, TaskQuadrant, EbbinghausStage } from '../types.ts';
import { DEFAULT_CATEGORIES }
from '../constants.ts';

interface DataContextType {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  addWord: (word: Word) => void;
  updateWord: (updatedWord: Word) => void;
  deleteWord: (wordId: string) => void;
  
  knowledgePoints: KnowledgePoint[];
  setKnowledgePoints: React.Dispatch<React.SetStateAction<KnowledgePoint[]>>;
  addKnowledgePoint: (kpData: Omit<KnowledgePoint, 'id' | 'reviewStage' | 'lastReviewedAt' | 'createdAt'> & Partial<Pick<KnowledgePoint, 'id' | 'createdAt'>>) => void;
  updateKnowledgePoint: (updatedKp: KnowledgePoint) => void;
  deleteKnowledgePoint: (kpId: string) => void;
  
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  addCategory: (category: Category) => void;
  updateCategory: (updatedCategory: Category) => void;
  deleteCategory: (categoryId: string) => boolean; 

  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  addTask: (task: Task) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  
  importData: (data: ExportData) => void;
  exportData: () => ExportData;

  lastUsedSource: string | null;
  setLastUsedSource: (source: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [words, setWords] = useLocalStorage<Word[]>('lumina-words', []);
  const [knowledgePoints, setKnowledgePoints] = useLocalStorage<KnowledgePoint[]>('lumina-knowledgepoints', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('lumina-categories', DEFAULT_CATEGORIES);
  const [tasks, setTasks] = useLocalStorage<Task[]>('lumina-tasks', []);
  const [lastTasksClearDate, setLastTasksClearDate] = useLocalStorage<string>('lumina-last-tasks-clear-date', '');
  const [lastUsedSource, setLastUsedSource] = useLocalStorage<string | null>('lumina-last-source', null);

  useEffect(() => {
    const todayStr = getTodayDateString();
    if (lastTasksClearDate !== todayStr) {
      const yesterdayTimestamp = new Date(todayStr).getTime() - 24 * 60 * 60 * 1000;
      
      setTasks(prevTasks => {
        const newTasks = prevTasks.filter(task => {
          if (task.isLongTerm) return true; 
          if (task.isCarriedOver && task.createdAt <= yesterdayTimestamp) {
            return true;
          }
          const taskDate = new Date(task.createdAt);
          const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
          return taskDateStr === todayStr;
        });
        return newTasks;
      });
      setLastTasksClearDate(todayStr);
    }
  }, [lastTasksClearDate, setLastTasksClearDate, setTasks]);


  const addWord = (word: Word) => setWords(prev => [word, ...prev].sort((a,b) => b.createdAt - a.createdAt));
  const updateWord = (updatedWord: Word) => setWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w).sort((a,b) => b.createdAt - a.createdAt));
  const deleteWord = (wordId: string) => setWords(prev => prev.filter(w => w.id !== wordId));

  const addKnowledgePoint = (kpData: Omit<KnowledgePoint, 'id' |'reviewStage' | 'lastReviewedAt' | 'createdAt'> & Partial<Pick<KnowledgePoint, 'id' | 'createdAt'>>) => {
    const now = Date.now();
    const fullKp: KnowledgePoint = {
      id: kpData.id || `kp-${now}-${Math.random().toString(36).substring(2, 9)}`,
      title: kpData.title,
      content: kpData.content,
      notes: kpData.notes,
      categoryId: kpData.categoryId,
      source: kpData.source,
      createdAt: kpData.createdAt || now,
      reviewStage: EbbinghausStage.LEARNED,
      lastReviewedAt: now,                
    };
    setKnowledgePoints(prev => [fullKp, ...prev].sort((a,b) => b.createdAt - a.createdAt));
  };
  const updateKnowledgePoint = (updatedKp: KnowledgePoint) => setKnowledgePoints(prev => prev.map(kp => kp.id === updatedKp.id ? updatedKp : kp).sort((a,b) => b.createdAt - a.createdAt));
  const deleteKnowledgePoint = (kpId: string) => setKnowledgePoints(prev => prev.filter(kp => kp.id !== kpId));
  
  const addCategory = (category: Category) => setCategories(prev => [...prev, category]);
  const updateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  
  const deleteCategory = useCallback((categoryId: string): boolean => {
    if (knowledgePoints.some(kp => kp.categoryId === categoryId)) {
      alert('无法删除：仍有知识点属于此分类。请先将这些知识点移至其他分类或设为未分类。');
      return false;
    }
    if (categories.some(c => c.parentId === categoryId)) {
        alert('无法删除：此分类下仍有子分类。请先删除或移动子分类。');
        return false;
    }
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    return true;
  }, [knowledgePoints, categories, setCategories]);

  const addTask = (task: Task) => setTasks(prev => [task, ...prev].sort((a,b) => b.createdAt - a.createdAt));
  const updateTask = (updatedTask: Task) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t).sort((a,b) => b.createdAt - a.createdAt));
  const deleteTask = (taskId: string) => setTasks(prev => prev.filter(t => t.id !== taskId));

  const importData = (data: ExportData) => {
    if (data.words) setWords(data.words.sort((a,b) => b.createdAt - a.createdAt));
    if (data.knowledgePoints) setKnowledgePoints(data.knowledgePoints.sort((a,b) => b.createdAt - a.createdAt));
    if (data.categories) setCategories(data.categories);
    if (data.tasks) setTasks(data.tasks.sort((a,b) => b.createdAt - a.createdAt));
  };

  const exportData = (): ExportData => {
    return { words, knowledgePoints, categories, tasks };
  };

  return (
    <DataContext.Provider value={{
      words, setWords, addWord, updateWord, deleteWord,
      knowledgePoints, setKnowledgePoints, addKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint,
      categories, setCategories, addCategory, updateCategory, deleteCategory,
      tasks, setTasks, addTask, updateTask, deleteTask,
      importData, exportData,
      lastUsedSource, setLastUsedSource
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};