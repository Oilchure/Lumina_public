import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Word, WordDefinition, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS, PartOfSpeechCh, CHINESE_POS_TERMS, ReadingRecordSourceInfo } from '../types';
import { 
    LITERATURE_ENGLISH_CATEGORY_ID, 
    CHINESE_POS_TO_CATEGORY_ID_MAP, 
    READING_RECORDS_CATEGORY_ID, 
    READING_RECORD_CHILD_CATEGORIES,
    READING_RECORD_LITERATURE_ID
} from '../constants';
import WordCard from '../components/WordCard';
import Modal from '../components/Modal';
import { PlusIcon, CheckIcon, ChevronUpIcon, ChevronDownIcon, ArrowUturnLeftIcon } from '../components/icons';
import { fetchWordDefinitions } from '../services/dictionaryService';
import LoadingSpinner from '../components/LoadingSpinner';

const WordsPage: React.FC = () => {
  const { words, addWord, updateWord, deleteWord, categories } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');

  // Form state
  const [currentWordText, setCurrentWordText] = useState('');
  const [currentDefinitions, setCurrentDefinitions] = useState<WordDefinition[]>([]);
  const [currentNotes, setCurrentNotes] = useState('');
  // const [currentSourceType, setCurrentSourceType] = useState<'api' | 'manual'>('manual'); // Removed
  const [currentReadingRecordSource, setCurrentReadingRecordSource] = useState<ReadingRecordSourceInfo | null>(null);
  const [classifyToLitEng, setClassifyToLitEng] = useState(false);
  
  const resetForm = useCallback(() => {
    setCurrentWordText('');
    setCurrentDefinitions([{ partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
    setCurrentNotes('');
    // setCurrentSourceType('manual'); // Removed
    setCurrentReadingRecordSource(null);
    setEditingWord(null);
    setClassifyToLitEng(false);
  }, []);

  useEffect(() => {
    if (editingWord) {
      setCurrentWordText(editingWord.text);
      setCurrentDefinitions(editingWord.definitions.length > 0 ? editingWord.definitions : [{ partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
      setCurrentNotes(editingWord.notes);
      // setCurrentSourceType(editingWord.sourceType); // Removed
      setCurrentReadingRecordSource(editingWord.readingRecordSource || null);
      setClassifyToLitEng(false); 
    } else {
      resetForm();
    }
  }, [editingWord, resetForm]);

  const handleOpenModal = (wordToEdit?: Word) => {
    if (wordToEdit) {
      setEditingWord(wordToEdit);
    } else {
      setEditingWord(null); 
      resetForm(); 
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWord(null);
    resetForm();
  };

  const handleDefinitionChange = (index: number, field: keyof WordDefinition, value: string) => {
    const newDefinitions = [...currentDefinitions];
    newDefinitions[index] = { ...newDefinitions[index], [field]: value };
    setCurrentDefinitions(newDefinitions);
  };

  const addDefinitionField = () => {
    setCurrentDefinitions([...currentDefinitions, { partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
  };

  const removeDefinitionField = (index: number) => {
    if (currentDefinitions.length > 1) {
      setCurrentDefinitions(currentDefinitions.filter((_, i) => i !== index));
    }
  };

  const moveDefinition = (index: number, direction: 'up' | 'down') => {
    const newDefinitions = [...currentDefinitions];
    const item = newDefinitions[index];
    if (direction === 'up' && index > 0) {
      newDefinitions.splice(index, 1);
      newDefinitions.splice(index - 1, 0, item);
    } else if (direction === 'down' && index < newDefinitions.length - 1) {
      newDefinitions.splice(index, 1);
      newDefinitions.splice(index + 1, 0, item);
    }
    setCurrentDefinitions(newDefinitions);
  };

  const handleFetchFromApi = async () => {
    if (!currentWordText.trim()) {
      alert('请输入要查询的单词。');
      return;
    }
    setIsLoadingApi(true);
    const defs = await fetchWordDefinitions(currentWordText.trim());
    setIsLoadingApi(false);
    if (defs && defs.length > 0) {
      setCurrentDefinitions(defs);
      // setCurrentSourceType('api'); // Removed
    } else {
      alert('未找到释义，或API请求超时。请尝试手动输入。');
      setCurrentDefinitions([{ partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
      // setCurrentSourceType('manual'); // Removed
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWordText.trim()) {
      alert('单词不能为空');
      return;
    }
    const finalDefinitions = currentDefinitions.filter(
      def => def.partOfSpeech.trim() && def.definition.trim()
    );

    if (finalDefinitions.length === 0) {
      alert('至少需要一个有效的词性和释义。');
      return;
    }

    const now = Date.now();
    let wordToSave: Word;

    if (editingWord) {
      wordToSave = {
        ...editingWord,
        text: currentWordText.trim(),
        definitions: finalDefinitions,
        notes: currentNotes.trim(),
        // sourceType: currentSourceType, // Removed
        readingRecordSource: currentReadingRecordSource?.referenceName ? currentReadingRecordSource : null,
      };
      updateWord(wordToSave);
    } else {
      wordToSave = {
        id: `word-${now}`,
        text: currentWordText.trim(),
        definitions: finalDefinitions,
        notes: currentNotes.trim(),
        // sourceType: currentSourceType, // Removed
        readingRecordSource: currentReadingRecordSource?.referenceName ? currentReadingRecordSource : null,
        createdAt: now,
        lastReviewedAt: now,
        reviewStage: EbbinghausStage.LEARNED,
      };
      addWord(wordToSave);
    }
    handleCloseModal();
  };

  const isWordDueForReview = useCallback((word: Word): boolean => {
    if (word.reviewStage >= EbbinghausStage.MASTERED) {
      return false; 
    }
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[word.reviewStage as EbbinghausStage];
    if (offsetDays === null || offsetDays === undefined) { 
        return false;
    }
    const dueDate = new Date(word.createdAt);
    dueDate.setDate(dueDate.getDate() + offsetDays);
    
    const today = new Date();
    today.setHours(0,0,0,0); 
    dueDate.setHours(0,0,0,0); 

    return new Date().getTime() >= dueDate.getTime();
  }, []);
  
  const wordsForReview = useMemo(() => {
    return words.filter(isWordDueForReview).sort((a,b) => {
        const offsetA = EBBINGHAUS_REVIEW_OFFSETS_DAYS[a.reviewStage as EbbinghausStage] || Infinity;
        const offsetB = EBBINGHAUS_REVIEW_OFFSETS_DAYS[b.reviewStage as EbbinghausStage] || Infinity;
        const dueDateA = new Date(a.createdAt);
        dueDateA.setDate(dueDateA.getDate() + offsetA);
        const dueDateB = new Date(b.createdAt);
        dueDateB.setDate(dueDateB.getDate() + offsetB);
        return dueDateA.getTime() - dueDateB.getTime();
    });
  }, [words, isWordDueForReview]);

  const handleMarkAsReviewed = (word: Word) => {
    const nextStage = word.reviewStage + 1;
    const updatedReviewedWord: Word = {
      ...word,
      reviewStage: Math.min(nextStage, EbbinghausStage.MASTERED) as EbbinghausStage,
      lastReviewedAt: Date.now(),
    };
    updateWord(updatedReviewedWord);
  };

  const handleUndoReview = (word: Word) => {
    if (word.reviewStage > EbbinghausStage.LEARNED) {
      const prevStage = word.reviewStage - 1;
      updateWord({
        ...word,
        reviewStage: prevStage as EbbinghausStage,
        lastReviewedAt: Date.now(), 
      });
    }
  };
  
  const displayedWords = useMemo(() => {
    const sourceList = viewMode === 'review' ? wordsForReview : words;
    if (!searchTerm.trim()) return sourceList;
    return sourceList.filter(word => 
        word.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definitions.some(def => def.definition.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [words, wordsForReview, viewMode, searchTerm]);

  const autoResizeTextarea = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            {viewMode === 'review' ? `今日复习 (${wordsForReview.length})` : '词汇列表'}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch">
          <input
            type="text"
            placeholder="搜索词汇..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100 flex-grow sm:flex-grow-0 sm:min-w-[200px]"
          />
          <div className="flex gap-1">
            <button
                onClick={() => setViewMode('all')}
                className={`py-2 px-3 rounded-md transition-colors text-sm font-medium flex-1 sm:flex-auto ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                aria-pressed={viewMode === 'all'}
            >
                全部词汇
            </button>
            <button
                onClick={() => setViewMode('review')}
                className={`py-2 px-3 rounded-md transition-colors text-sm font-medium flex-1 sm:flex-auto ${viewMode === 'review' ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                aria-pressed={viewMode === 'review'}
            >
                今日复习 {viewMode !== 'review' && wordsForReview.length > 0 ? `(${wordsForReview.length})` : ''}
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors"
            aria-label="添加新词汇"
          >
            <PlusIcon className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">添加词汇</span>
          </button>
        </div>
      </div>

      {displayedWords.length === 0 && !searchTerm && viewMode === 'all' && words.length === 0 && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">还没有添加任何词汇。</p>
            <p className="text-slate-500 dark:text-slate-400">点击 "添加词汇" 开始吧！</p>
        </div>
      )}
      {displayedWords.length === 0 && viewMode === 'review' && (
         <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
            <p className="text-slate-500 dark:text-slate-400 text-lg">太棒了！今天没有需要复习的词汇。</p>
            {words.length > 0 && <p className="text-slate-500 dark:text-slate-400">去 "全部词汇" 看看，或者添加新词吧！</p>}
        </div>
      )}
      {displayedWords.length === 0 && searchTerm && (
         <div className="text-center py-10">
            <p className="text-slate-500 dark:text-slate-400 text-lg">未找到匹配的词汇。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedWords.map(word => (
          <div key={word.id} className="relative group">
            <WordCard 
                word={word} 
                onEdit={() => handleOpenModal(word)} 
                onDelete={deleteWord} 
                onUndoReview={handleUndoReview}
            />
            {viewMode === 'review' && isWordDueForReview(word) && ( 
                 <button
                    onClick={() => handleMarkAsReviewed(word)}
                    className="absolute top-2 right-[calc(theme(spacing.2)*1+theme(spacing.5)*3+1.25rem*3)] z-10 bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center text-xs"
                    title="标记为已复习"
                    aria-label={`标记词汇 ${word.text} 为已复习`}
                >
                    <CheckIcon className="w-3 h-3 mr-1" /> 已复习
                </button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingWord ? '编辑词汇' : '添加新词汇'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="wordText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">词汇</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <input
                type="text"
                name="wordText"
                id="wordText"
                value={currentWordText}
                onChange={(e) => setCurrentWordText(e.target.value)}
                required
                className="flex-1 block w-full min-w-0 rounded-none rounded-l-md border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
                />
                <button 
                type="button"
                onClick={handleFetchFromApi}
                disabled={isLoadingApi || !currentWordText.trim()}
                className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-600 text-slate-500 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-500 disabled:opacity-50"
                >
                {isLoadingApi ? <LoadingSpinner size="sm" /> : '获取释义'}
                </button>
            </div>
          </div>
          
          <div className="max-h-[35vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {currentDefinitions.map((def, index) => (
              <div key={index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md space-y-2 relative">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">释义 {index + 1}</h4>
                  <div className="flex items-center space-x-1">
                    {currentDefinitions.length > 1 && (
                      <>
                        <button type="button" onClick={() => moveDefinition(index, 'up')} disabled={index === 0} className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-50" aria-label={`释义 ${index + 1} 上移`}><ChevronUpIcon className="w-4 h-4" /></button>
                        <button type="button" onClick={() => moveDefinition(index, 'down')} disabled={index === currentDefinitions.length - 1} className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-50" aria-label={`释义 ${index + 1} 下移`}><ChevronDownIcon className="w-4 h-4" /></button>
                        <button type="button" onClick={() => removeDefinitionField(index)} className="p-1 text-red-500 hover:text-red-700" aria-label={`移除释义 ${index + 1}`}>
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.197-2.348.372C2.016 4.809 1 6.235 1 7.864v7.272A2.75 2.75 0 0 0 3.75 18h12.5A2.75 2.75 0 0 0 19 15.136V7.864c0-1.63-1.016-3.055-2.652-3.295-.768-.175-1.553-.295-2.348-.372v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM7.5 3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.5h-5v-.5Zm-1.498 5.927a.75.75 0 0 1 1.06 0L10 12.44l2.938-2.763a.75.75 0 1 1 1.061 1.06L11.06 13.5l2.939 2.763a.75.75 0 1 1-1.06 1.06L10 14.56l-2.938 2.763a.75.75 0 0 1-1.061-1.06L8.94 13.5l-2.939-2.763a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor={`pos-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">词性</label>
                  <select id={`pos-${index}`} value={def.partOfSpeech} onChange={(e) => handleDefinitionChange(index, 'partOfSpeech', e.target.value)} required={index === 0 || def.definition.trim() !== ''} className="mt-1 block w-full input-standard">
                    {CHINESE_POS_TERMS.map(pos_term => (<option key={pos_term} value={pos_term}>{pos_term}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`definition-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">释义</label>
                  <textarea id={`definition-${index}`} value={def.definition} onChange={(e) => handleDefinitionChange(index, 'definition', e.target.value)} onInput={autoResizeTextarea} rows={2} placeholder="e.g., a word used to identify any of a class of people, places, or things" required={index === 0 || def.partOfSpeech.trim() !== ''} className="mt-1 block w-full input-standard resize-none overflow-hidden"/>
                </div>
                <div>
                  <label htmlFor={`example-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">例句 (可选)</label>
                  <textarea id={`example-${index}`} value={def.example || ''} onChange={(e) => handleDefinitionChange(index, 'example', e.target.value)} onInput={autoResizeTextarea} rows={2} placeholder="e.g., The quick brown fox jumps over the lazy dog." className="mt-1 block w-full input-standard resize-none overflow-hidden"/>
                </div>
              </div>
            ))}
            <button type="button" onClick={addDefinitionField} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1">+ 添加更多释义</button>
          </div>

          {/* Source Information Section - Removed sourceType select */}
          <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-md space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">来源信息</h4>
            <div>
                <label htmlFor="readingRecordCategory" className="block text-xs font-medium text-slate-700 dark:text-slate-300">关联阅读记录 (可选)</label>
                <select 
                    id="readingRecordCategory"
                    value={currentReadingRecordSource?.readingRecordCategoryId || ''}
                    onChange={(e) => {
                        const catId = e.target.value;
                        if (catId) {
                            setCurrentReadingRecordSource(prev => ({ ...prev, readingRecordCategoryId: catId, referenceName: prev?.referenceName || '' }));
                        } else {
                            setCurrentReadingRecordSource(null);
                        }
                    }}
                    className="mt-1 block w-full input-standard"
                >
                    <option value="">-- 不关联阅读记录 --</option>
                    {READING_RECORD_CHILD_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            {currentReadingRecordSource?.readingRecordCategoryId && (
                 <div>
                    <label htmlFor="referenceName" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        {currentReadingRecordSource.readingRecordCategoryId === READING_RECORD_LITERATURE_ID ? '文献名称' : '具体名称/篇章'}
                    </label>
                    <input
                        type="text"
                        id="referenceName"
                        value={currentReadingRecordSource.referenceName || ''}
                        onChange={(e) => setCurrentReadingRecordSource(prev => prev ? {...prev, referenceName: e.target.value} : null)}
                        placeholder={currentReadingRecordSource.readingRecordCategoryId === READING_RECORD_LITERATURE_ID ? "例如：Nature 2023, Doe et al." : "例如：具体书名或篇章名"}
                        className="mt-1 block w-full input-standard"
                    />
                </div>
            )}
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">备注 (可选)</label>
            <textarea id="notes" name="notes" value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} onInput={autoResizeTextarea} rows={3} className="mt-1 block w-full input-standard resize-none overflow-hidden"/>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">取消</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{editingWord ? '保存更改' : '添加词汇'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WordsPage;