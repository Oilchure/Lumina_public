import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext.tsx';
import { KnowledgePoint, Category, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS } from '../types.ts';
import { 
    DAILY_THOUGHTS_CATEGORY_ID,
    READING_RECORDS_CATEGORY_ID,
    READING_RECORD_LITERATURE_ID,
    READING_RECORD_REFERENCE_ID,
    READING_RECORD_NOVEL_ID,
    READING_RECORD_PRO_BOOK_ID,
} from '../constants.ts';
import KnowledgePointCard from '../components/KnowledgePointCard.tsx';
import Modal from '../components/Modal.tsx';
import { PlusIcon } from '../components/icons.tsx';

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
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');

  // Form state
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState('');

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
      setCurrentSource('');
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
        title: titleToSave,
        content: currentContent.trim(),
        notes: currentNotes.trim(),
        categoryId: currentCategoryId,
        source: currentSource.trim() || undefined,
      });
    }
    handleCloseModal();
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

  const knowledgePointsEligibleForReview = useMemo(() => {
    return knowledgePoints.filter(kp => kp.categoryId !== DAILY_THOUGHTS_CATEGORY_ID);
  }, [knowledgePoints]);

  const isKnowledgePointDueForReview = useCallback((kp: KnowledgePoint): boolean => {
    if (kp.reviewStage >= EbbinghausStage.MASTERED) return false;
    
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[kp.reviewStage as EbbinghausStage];
    if (offsetDays === null || offsetDays === undefined) return false;
    
    const dueDate = new Date(kp.lastReviewedAt);
    dueDate.setDate(dueDate.getDate() + offsetDays);
    
    const today = new Date();
    today.setHours(0,0,0,0); 
    dueDate.setHours(0,0,0,0); 

    return new Date().getTime() >= dueDate.getTime();
  }, []);

  const knowledgePointsForReview = useMemo(() => {
    return knowledgePointsEligibleForReview
      .filter(isKnowledgePointDueForReview)
      .sort((a,b) => {
        const offsetA = EBBINGHAUS_REVIEW_OFFSETS_DAYS[a.reviewStage as EbbinghausStage] || Infinity;
        const offsetB = EBBINGHAUS_REVIEW_OFFSETS_DAYS[b.reviewStage as EbbinghausStage] || Infinity;
        
        const dueDateA = new Date(a.lastReviewedAt);
        dueDateA.setDate(dueDateA.getDate() + offsetA);
        
        const dueDateB = new Date(b.lastReviewedAt);
        dueDateB.setDate(dueDateB.getDate() + offsetB);
        
        return dueDateA.getTime() - dueDateB.getTime();
    });
  }, [knowledgePointsEligibleForReview, isKnowledgePointDueForReview]);

  const handleMarkAsRememberedKP = (kp: KnowledgePoint) => {
    const nextStage = kp.reviewStage + 1;
    updateKnowledgePoint({
      ...kp,
      reviewStage: Math.min(nextStage, EbbinghausStage.MASTERED) as EbbinghausStage,
      lastReviewedAt: Date.now(),
    });
  };

  const handleMarkAsForgottenKP = (kp: KnowledgePoint) => {
    updateKnowledgePoint({
      ...kp,
      reviewStage: EbbinghausStage.LEARNED, 
      lastReviewedAt: Date.now(),
    });
  };
  
  const handleUndoReviewKP = (kp: KnowledgePoint) => {
    if (kp.reviewStage > EbbinghausStage.LEARNED) {
      const prevStage = kp.reviewStage - 1;
      updateKnowledgePoint({
        ...kp,
        reviewStage: prevStage as EbbinghausStage,
        lastReviewedAt: Date.now(), 
      });
    }
  };
  
  const displayedKnowledgePoints = useMemo(() => {
    if (viewMode === 'review') {
      return knowledgePointsForReview;
    } 
    
    return knowledgePoints.filter(kp => {
      const matchesSearch = searchTerm ? (
                            kp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            kp.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            kp.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (kp.source && kp.source.toLowerCase().includes(searchTerm.toLowerCase()))
                          ) : true;
      
      let matchesCategory = true;
      if (filterCategory) {
          if (kp.categoryId === null && filterCategory === "unassigned") {
               matchesCategory = true;
          } else if (kp.categoryId === null) {
              matchesCategory = false;
          } else { 
              matchesCategory = false;
              let currentIterationCategoryId: string | null = kp.categoryId;
              const visitedCats = new Set<string>();
              while(currentIterationCategoryId && !visitedCats.has(currentIterationCategoryId)) {
                  visitedCats.add(currentIterationCategoryId);
                  if (currentIterationCategoryId === filterCategory) {
                      matchesCategory = true;
                      break;
                  }
                  const parentCat = categories.find(c => c.id === currentIterationCategoryId);
                  currentIterationCategoryId = parentCat ? parentCat.parentId : null;
              }
          }
      }
      return matchesSearch && matchesCategory;
    });
  }, [knowledgePoints, knowledgePointsForReview, viewMode, searchTerm, filterCategory, categories]);

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

  const handleDeleteKnowledgePointDirect = (kpId: string) => {
    deleteKnowledgePoint(kpId); // Direct call from context
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
          {viewMode === 'review' ? `复习 (${knowledgePointsForReview.length})` : '知识点库'}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch">
          {viewMode === 'all' && (
            <>
              <input
                type="text"
                placeholder="搜索知识点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-slate-100 flex-grow sm:flex-grow-0 sm:min-w-[160px]"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-slate-100 sm:min-w-[150px]"
              >
                <option value="">所有分类</option>
                <option value="unassigned">未分类</option>
                {renderCategoryOptions()}
              </select>
            </>
          )}
          <div className="flex gap-1">
             <button
                onClick={() => setViewMode('all')}
                className={`py-2 px-3 rounded-md transition-colors text-sm font-medium flex-1 sm:flex-auto ${viewMode === 'all' ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                aria-pressed={viewMode === 'all'}
            >
                全部知识点
            </button>
            <button
                onClick={() => setViewMode('review')}
                className={`py-2 px-3 rounded-md transition-colors text-sm font-medium flex-1 sm:flex-auto ${viewMode === 'review' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                aria-pressed={viewMode === 'review'}
            >
                复习 {viewMode !== 'review' && knowledgePointsForReview.length > 0 ? `(${knowledgePointsForReview.length})` : ''}
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors"
            aria-label="添加新知识"
          >
            <PlusIcon className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">添加知识</span>
          </button>
        </div>
      </div>
      
      {displayedKnowledgePoints.length === 0 && viewMode === 'all' && !searchTerm && !filterCategory && knowledgePoints.length === 0 && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">还没有添加任何知识点。</p>
            <p className="text-slate-500 dark:text-slate-400">点击 "添加知识" 开始吧！</p>
        </div>
      )}
      {displayedKnowledgePoints.length === 0 && viewMode === 'review' && (
         <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
            <p className="text-slate-500 dark:text-slate-400 text-lg">太棒了！今天没有需要复习的知识点。</p>
            {knowledgePoints.length > 0 && <p className="text-slate-500 dark:text-slate-400">去 "全部知识点" 看看，或者添加新内容吧！</p>}
        </div>
      )}
      {displayedKnowledgePoints.length === 0 && viewMode === 'all' && (searchTerm || filterCategory) && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">未找到匹配的知识点。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedKnowledgePoints.map(kp => (
          <KnowledgePointCard 
            key={kp.id} 
            knowledgePoint={kp} 
            onEdit={() => handleOpenModal(kp)} 
            onDelete={handleDeleteKnowledgePointDirect}
            isReviewMode={viewMode === 'review'}
            onMarkAsRemembered={handleMarkAsRememberedKP}
            onMarkAsForgotten={handleMarkAsForgottenKP}
            onUndoReview={handleUndoReviewKP}
          />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingKp ? '编辑知识' : '添加新知识'} size="lg">
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
           <div style={{ display: (currentCategoryId === DAILY_THOUGHTS_CATEGORY_ID || !currentCategoryId ) ? 'none' : 'block' }}>
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
              {editingKp ? '保存更改' : '添加知识'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KnowledgePage;