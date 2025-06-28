
import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState, useRef } from 'react';
import { Word, KnowledgePoint, Category, ExportData, Task, EbbinghausStage } from '../types.ts';
import { fetchDataFromServer, saveDataToServer } from '../services/apiService.ts';

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

  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dataStateRef = useRef<ExportData | undefined>();
  dataStateRef.current = { words, knowledgePoints, categories, tasks };

  const saveTimeoutRef = useRef<number | null>(null);

  const triggerSave = useCallback(() => {
    if (isLoading) return; // Don't save while initial load is happening

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      if (dataStateRef.current) {
        saveDataToServer(dataStateRef.current).catch(err => {
          console.error("Auto-save failed:", err);
          setError("自动保存数据失败。请检查网络连接。");
        });
      }
    }, 1500); // Debounce save by 1.5 seconds
  }, [isLoading, setError]);

  // Initial data load from server
  useEffect(() => {
    fetchDataFromServer()
      .then(data => {
        setWords(data.words || []);
        setKnowledgePoints(data.knowledgePoints || []);
        setCategories(data.categories || []);
        setTasks(data.tasks || []);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load data:", err);
        setError("无法从服务器加载数据。请检查网络连接或服务器状态。");
      })
      .finally(() => {
        setIsLoading(false);
      });
      
    return () => { // Cleanup timeout on unmount
        if(saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, []);
  
  // Daily task clearing logic (remains the same)
  useEffect(() => {
    if (isLoading) return; // Don't clear tasks until initial data is loaded

    const todayStr = getTodayDateString();
    const lastClearDate = localStorage.getItem('lumina-last-tasks-clear-date'); // Use a simple LS item for this one-off check
    
    if (lastClearDate !== todayStr) {
      const yesterdayTimestamp = new Date(todayStr).getTime() - 24 * 60 * 60 * 1000;
      const newTasks = tasks.filter(task => {
        if (task.isLongTerm) return true;
        if (task.isCarriedOver && task.createdAt <= yesterdayTimestamp) return true;
        const taskDate = new Date(task.createdAt);
        const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
        return taskDateStr === todayStr;
      });
      setTasks(newTasks);
      triggerSave();
      localStorage.setItem('lumina-last-tasks-clear-date', todayStr);
    }
  }, [isLoading, tasks, setTasks, triggerSave]);


  const addWord = (word: Word) => {
    setWords(prev => [word, ...prev].sort((a,b) => b.createdAt - a.createdAt));
    triggerSave();
  };
  const updateWord = (updatedWord: Word) => {
    setWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w).sort((a,b) => b.createdAt - a.createdAt));
    triggerSave();
  };
  const deleteWord = (wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
    triggerSave();
  };

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
    triggerSave();
  };
  const updateKnowledgePoint = (updatedKp: KnowledgePoint) => {
    setKnowledgePoints(prev => prev.map(kp => kp.id === updatedKp.id ? updatedKp : kp).sort((a,b) => b.createdAt - a.createdAt));
    triggerSave();
  };
  const deleteKnowledgePoint = (kpId: string) => {
    setKnowledgePoints(prev => prev.filter(kp => kp.id !== kpId));
    triggerSave();
  };
  
  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
    triggerSave();
  };
  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    triggerSave();
  };
  
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
    triggerSave();
    return true;
  }, [knowledgePoints, categories, setCategories, triggerSave]);

  const addTask = (task: Task) => {
    setTasks(prev => [task, ...prev].sort((a,b) => b.createdAt - a.createdAt));
    triggerSave();
  };
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t).sort((a,b) => b.createdAt - a.createdAt));
    triggerSave();
  };
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    triggerSave();
  };

  // Import/Export can still be useful for manual backups
  const importData = (data: ExportData) => {
    if (window.confirm("这会覆盖当前所有数据并从服务器重新同步。确定吗？")) {
        if (data.words) setWords(data.words.sort((a,b) => b.createdAt - a.createdAt));
        if (data.knowledgePoints) setKnowledgePoints(data.knowledgePoints.sort((a,b) => b.createdAt - a.createdAt));
        if (data.categories) setCategories(data.categories);
        if (data.tasks) setTasks(data.tasks.sort((a,b) => b.createdAt - a.createdAt));
        triggerSave();
    }
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
      isLoading, error
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
