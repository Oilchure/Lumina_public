import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { KnowledgePoint, Category } from '../types';
import { 
    DAILY_THOUGHTS_CATEGORY_ID,
    READING_RECORDS_CATEGORY_ID,
    READING_RECORD_LITERATURE_ID,
    READING_RECORD_REFERENCE_ID,
    READING_RECORD_NOVEL_ID,
    READING_RECORD_PRO_BOOK_ID
} from '../constants';
import KnowledgePointCard from '../components/KnowledgePointCard';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/icons';

const getTodayDateForTitle = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const KnowledgePage: React.FC = () => {
  const { knowledgePoints, addKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint, categories } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKp, setEditingKp] = useState<KnowledgePoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');


  // Form state
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState(''); // This will store literature name, book title, etc.


  const resetForm = useCallback(() => {
    setCurrentTitle('');
    setCurrentContent('');
    setCurrentNotes('');
    setCurrentCategoryId(null);
    setCurrentSource('');
    setEditingKp(null);
  }, []);

  useEffect(() => {
    if (editingKp) {
      setCurrentTitle(editingKp.title);
      setCurrentContent(editingKp.content);
      setCurrentNotes(editingKp.notes);
      setCurrentCategoryId(editingKp.categoryId);
      setCurrentSource(editingKp.source || '');
    } else {
      resetForm();
    }
  }, [editingKp, resetForm]);

  const handleOpenModal = (kpToEdit?: KnowledgePoint) => {
    if (kpToEdit) {
      setEditingKp(kpToEdit);
    } else {
      setEditingKp(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingKp(null);
    resetForm();
  };

  const handleCategoryChangeInModal = (categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
    if (!editingKp && categoryId === DAILY_THOUGHTS_CATEGORY_ID) {
      setCurrentTitle(getTodayDateForTitle());
      setCurrentSource(''); // Daily thoughts typically don't have an external source name
    } else if (!editingKp) {
      if (currentTitle === getTodayDateForTitle() && currentCategoryId !== DAILY_THOUGHTS_CATEGORY_ID) {
         setCurrentTitle('');
      }
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let titleToSave = currentTitle.trim();
    if (!titleToSave || !currentContent.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    if (!editingKp && currentCategoryId === DAILY_THOUGHTS_CATEGORY_ID && titleToSave === '') {
        titleToSave = getTodayDateForTitle();
    }


    const now = Date.now();
    if (editingKp) {
      updateKnowledgePoint({
        ...editingKp,
        title: titleToSave,
        content: currentContent.trim(),
        notes: currentNotes.trim(),
        categoryId: currentCategoryId,
        source: currentSource.trim() || undefined,
      });
    } else {
      addKnowledgePoint({
        id: `kp-${now}`,
        title: titleToSave,
        content: currentContent.trim(),
        notes: currentNotes.trim(),
        categoryId: currentCategoryId,
        createdAt: now,
        source: currentSource.trim() || undefined,
      });
    }
    handleCloseModal();
  };
  
  const getCategoryPath = (categoryId: string, allCategories: Category[]): string => {
    let path = '';
    let currentCat = allCategories.find(c => c.id === categoryId);
    const visited = new Set<string>(); 
    while (currentCat && !visited.has(currentCat.id)) {
      visited.add(currentCat.id);
      path = currentCat.name + (path ? ` / ${path}` : '');
      currentCat = allCategories.find(c => c.id === currentCat!.parentId);
    }
    return path;
  };

  const renderCategoryOptions = (parentId: string | null = null, depth = 0): React.ReactNode[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a,b) => a.name.localeCompare(b.name)) 
      .flatMap(cat => [
        <option key={cat.id} value={cat.id} className="dark:bg-slate-700 dark:text-slate-100">
          {'--'.repeat(depth)} {cat.name}
        </option>,
        ...renderCategoryOptions(cat.id, depth + 1)
      ]);
  };
  
  const filteredKnowledgePoints = knowledgePoints.filter(kp => {
    const matchesSearch = kp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          kp.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          kp.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (kp.source && kp.source.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesCategory = true;
    if (filterCategory) {
        if (kp.categoryId === null && filterCategory === "unassigned") { // Special case for explicitly filtering "unassigned"
             matchesCategory = true;
        } else if (kp.categoryId === null) {
            matchesCategory = false;
        } else {
            matchesCategory = false;
            let currentCatId: string | null = kp.categoryId;
            while(currentCatId) {
                if (currentCatId === filterCategory) {
                    matchesCategory = true;
                    break;
                }
                const parentCat = categories.find(c => c.id === currentCatId);
                currentCatId = parentCat ? parentCat.parentId : null;
            }
        }
    }
    return matchesSearch && matchesCategory;
  });

  const autoResizeTextarea = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const isReadingRecordCategory = (categoryId: string | null): boolean => {
    if (!categoryId) return false;
    const cat = categories.find(c => c.id === categoryId);
    return cat?.parentId === READING_RECORDS_CATEGORY_ID;
  };
  
  const getSourceInputPlaceholder = (): string => {
    if (currentCategoryId === READING_RECORD_LITERATURE_ID) return "例如: Nature 2023, Doe et al.";
    if (currentCategoryId === READING_RECORD_REFERENCE_ID) return "例如: 《牛津高阶词典》";
    if (currentCategoryId === READING_RECORD_NOVEL_ID) return "例如: 《三体》第一章";
    if (currentCategoryId === READING_RECORD_PRO_BOOK_ID) return "例如: 《深入理解计算机系统》第3版";
    return "具体来源名称 (如文献名、书名)";
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">我的知识点</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="搜索知识点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-slate-100 flex-grow sm:flex-grow-0"
          />
           <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="">所有分类</option>
            <option value="unassigned">未分类</option> {/* Added option for unassigned */}
            {renderCategoryOptions()}
          </select>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            添加知识点
          </button>
        </div>
      </div>
      
      {filteredKnowledgePoints.length === 0 && !searchTerm && !filterCategory && knowledgePoints.length === 0 && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">还没有添加任何知识点。</p>
            <p className="text-slate-500 dark:text-slate-400">点击 "添加知识点" 开始吧！</p>
        </div>
      )}
      {filteredKnowledgePoints.length === 0 && (searchTerm || filterCategory) && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">未找到匹配的知识点。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKnowledgePoints.map(kp => (
          <KnowledgePointCard key={kp.id} knowledgePoint={kp} onEdit={() => handleOpenModal(kp)} onDelete={deleteKnowledgePoint} />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingKp ? '编辑知识点' : '添加新知识点'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="kpCategory" className="block text-sm font-medium text-slate-700 dark:text-slate-300">分类</label>
            <select
              id="kpCategory"
              value={currentCategoryId || ''}
              onChange={(e) => handleCategoryChangeInModal(e.target.value || null)}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="">-- 选择分类 (或不分类) --</option>
              {renderCategoryOptions()}
            </select>
          </div>
          <div>
            <label htmlFor="kpTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300">标题</label>
            <input
              type="text"
              id="kpTitle"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              required
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="kpContent" className="block text-sm font-medium text-slate-700 dark:text-slate-300">内容</label>
            <textarea
              id="kpContent"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              onInput={autoResizeTextarea}
              rows={5}
              required
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100 resize-none overflow-hidden"
            />
          </div>
           <div style={{ display: (currentCategoryId === DAILY_THOUGHTS_CATEGORY_ID || !currentCategoryId ) ? 'none' : 'block' }}> {/* Hide source for daily thoughts or no category */}
            <label htmlFor="kpSource" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                { isReadingRecordCategory(currentCategoryId) || currentCategoryId === READING_RECORDS_CATEGORY_ID ? '具体名称 (如文献名、书名)' : '来源 (可选)' }
            </label>
            <input
              type="text"
              id="kpSource"
              value={currentSource}
              onChange={(e) => setCurrentSource(e.target.value)}
              placeholder={getSourceInputPlaceholder()}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="kpNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">备注 (可选)</label>
            <textarea
              id="kpNotes"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              onInput={autoResizeTextarea}
              rows={3}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100 resize-none overflow-hidden"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {editingKp ? '保存更改' : '添加知识点'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KnowledgePage;