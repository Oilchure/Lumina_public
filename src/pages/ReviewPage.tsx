import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext.tsx';
import { Word, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS, WordDefinition, CHINESE_POS_TERMS } from '../types.ts';
import WordCard from '../components/WordCard.tsx';
import Modal from '../components/Modal.tsx';

const ReviewPage: React.FC = () => {
  const { words, updateWord, deleteWord } = useData();
  const [editingWordDetails, setEditingWordDetails] = useState<Word | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isWordDueForReview = (word: Word): boolean => {
    if (word.reviewStage >= EbbinghausStage.MASTERED) return false;
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[word.reviewStage as EbbinghausStage];
    if (offsetDays === null || offsetDays === undefined) return false;
    
    const dueDate = new Date(word.lastReviewedAt); 
    dueDate.setDate(dueDate.getDate() + offsetDays);
    
    const today = new Date();
    today.setHours(0,0,0,0); 
    dueDate.setHours(0,0,0,0);
    return new Date().getTime() >= dueDate.getTime();
  };
  
  const wordsDueForReview = useMemo(() => {
    return words.filter(isWordDueForReview).sort((a,b) => {
        const offsetA = EBBINGHAUS_REVIEW_OFFSETS_DAYS[a.reviewStage as EbbinghausStage] || Infinity;
        const offsetB = EBBINGHAUS_REVIEW_OFFSETS_DAYS[b.reviewStage as EbbinghausStage] || Infinity;
        const dueDateA = new Date(a.lastReviewedAt);
        dueDateA.setDate(dueDateA.getDate() + offsetA);
        const dueDateB = new Date(b.lastReviewedAt);
        dueDateB.setDate(dueDateB.getDate() + offsetB);
        return dueDateA.getTime() - dueDateB.getTime();
    });
  }, [words]);

  const handleMarkAsRemembered = (word: Word) => {
    const nextStage = word.reviewStage + 1;
    updateWord({
      ...word,
      reviewStage: Math.min(nextStage, EbbinghausStage.MASTERED) as EbbinghausStage,
      lastReviewedAt: Date.now(),
    });
  };

  const handleMarkAsForgotten = (word: Word) => {
    updateWord({
      ...word,
      reviewStage: EbbinghausStage.LEARNED,
      lastReviewedAt: Date.now(),
    });
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

  // Edit word functionality
  const [currentWordText, setCurrentWordText] = useState('');
  const [currentDefinitions, setCurrentDefinitions] = useState<WordDefinition[]>([]);
  const [currentNotes, setCurrentNotes] = useState('');
  
  const openEditModal = (word: Word) => {
    setEditingWordDetails(word);
    setCurrentWordText(word.text);
    setCurrentDefinitions(word.definitions.length > 0 ? word.definitions : [{ partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
    setCurrentNotes(word.notes);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWordDetails(null);
  };
  
  const handleDefinitionChange = (index: number, field: keyof WordDefinition, value: string) => {
    const newDefinitions = [...currentDefinitions];
    newDefinitions[index] = { ...newDefinitions[index], [field]: value };
    setCurrentDefinitions(newDefinitions);
  };

  const addDefinitionField = () => setCurrentDefinitions([...currentDefinitions, { partOfSpeech: CHINESE_POS_TERMS[0], definition: '', example: '' }]);
  const removeDefinitionField = (index: number) => {
    if (currentDefinitions.length > 1) setCurrentDefinitions(currentDefinitions.filter((_, i) => i !== index));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWordDetails || !currentWordText.trim()) return;
    const finalDefinitions = currentDefinitions.filter(def => def.partOfSpeech.trim() && def.definition.trim());
    if (finalDefinitions.length === 0) { alert('至少需要一个有效的词性和释义。'); return; }

    updateWord({
      ...editingWordDetails,
      text: currentWordText.trim(),
      definitions: finalDefinitions,
      notes: currentNotes.trim(),
    });
    closeEditModal();
  };

  const handleDeleteWordDirect = (wordId: string) => {
    deleteWord(wordId); 
  };


  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">(Legacy) 今日词汇复习</h1>
        <p className="text-slate-600 dark:text-slate-300">此页面为旧版词汇复习页。推荐使用“词汇”页面中的“今日复习”功能。</p>
        <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">注意：知识点复习请前往“知识点”页面。</p>
      </div>

      {wordsDueForReview.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-slate-500 dark:text-slate-400 text-lg">太棒了！今天没有需要复习的单词。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordsDueForReview.map(word => (
          <div key={word.id} className="relative group">
            <WordCard 
              word={word} 
              onEdit={openEditModal} 
              onDelete={handleDeleteWordDirect} // Direct delete
              isReviewMode={true} 
              onMarkAsRemembered={handleMarkAsRemembered}
              onMarkAsForgotten={handleMarkAsForgotten}
              onUndoReview={handleUndoReview}
            />
          </div>
        ))}
      </div>
      
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="编辑单词详情 (Legacy)" size="xl">
        {editingWordDetails && (
           <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label htmlFor="editWordText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">单词</label>
              <input
                type="text"
                id="editWordText"
                value={currentWordText}
                onChange={(e) => setCurrentWordText(e.target.value)}
                required
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
             {currentDefinitions.map((def, index) => (
              <div key={index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">释义 {index + 1}</h4>
                  {currentDefinitions.length > 1 && (
                    <button type="button" onClick={() => removeDefinitionField(index)} className="text-red-500 hover:text-red-700 text-xs">移除</button>
                  )}
                </div>
                <div>
                  <label htmlFor={`edit-pos-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">词性</label>
                  <select id={`edit-pos-${index}`} value={def.partOfSpeech} onChange={(e) => handleDefinitionChange(index, 'partOfSpeech', e.target.value)} required className="mt-1 block w-full input-standard">
                    {CHINESE_POS_TERMS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`edit-definition-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">释义</label>
                  <textarea id={`edit-definition-${index}`} value={def.definition} onChange={(e) => handleDefinitionChange(index, 'definition', e.target.value)} rows={2} required className="mt-1 block w-full input-standard" />
                </div>
                <div>
                  <label htmlFor={`edit-example-${index}`} className="block text-xs font-medium text-slate-700 dark:text-slate-300">例句</label>
                  <textarea id={`edit-example-${index}`} value={def.example || ''} onChange={(e) => handleDefinitionChange(index, 'example', e.target.value)} rows={2} className="mt-1 block w-full input-standard" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addDefinitionField} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">+ 添加释义</button>
            <div>
              <label htmlFor="editNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">备注</label>
              <textarea
                id="editNotes"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">取消</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">保存更改</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ReviewPage;