
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Word, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS } from '../types';
import WordCard from '../components/WordCard';
import Modal from '../components/Modal';
import { CheckIcon } from '../components/icons';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const ReviewPage: React.FC = () => {
  const { words, updateWord, deleteWord } = useData();
  const [editingWordDetails, setEditingWordDetails] = useState<Word | null>(null); // For WordCard's edit functionality
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For WordCard's edit functionality

  const isWordDueForReview = (word: Word): boolean => {
    if (word.reviewStage >= EbbinghausStage.MASTERED) {
      return false; // Already mastered
    }
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[word.reviewStage as EbbinghausStage];
    if (offsetDays === null || offsetDays === undefined) { // MASTERED or invalid stage
        return false;
    }
    // For stage 0 (just learned), review is due based on offsetDays[0] which is typically 0 or 1.
    // Let's assume stage 0 means it's due on day 1 (offsetDays[EbbinghausStage.REVIEW_1_DAY])
    // The logic in EBBINGHAUS_REVIEW_OFFSETS_DAYS implies word.reviewStage points to the *next* interval.
    // e.g. if reviewStage = 0 (Learned), next review is after offsetDays[0] = 1 day.
    
    // Correct logic: if word.reviewStage is the *current* completed stage.
    // Next review interval determined by EBBINGHAUS_REVIEW_OFFSETS_DAYS[word.reviewStage + 1] if not mastered.
    // But our EBBINGHAUS_REVIEW_OFFSETS_DAYS maps current stage to offset from createdAt.
    // Example: Stage 0 (Learned) -> offset is 1 day. Due date is createdAt + 1 day.
    // Stage 1 (Reviewed after 1 day) -> offset is 2 days. Due date is createdAt + 2 days.
    
    const dueDate = new Date(word.createdAt);
    dueDate.setDate(dueDate.getDate() + offsetDays);
    return Date.now() >= dueDate.getTime();
  };
  
  const wordsDueForReview = useMemo(() => {
    return words.filter(isWordDueForReview).sort((a,b) => {
        const offsetA = EBBINGHAUS_REVIEW_OFFSETS_DAYS[a.reviewStage as EbbinghausStage] || Infinity;
        const offsetB = EBBINGHAUS_REVIEW_OFFSETS_DAYS[b.reviewStage as EbbinghausStage] || Infinity;
        const dueDateA = new Date(a.createdAt);
        dueDateA.setDate(dueDateA.getDate() + offsetA);
        const dueDateB = new Date(b.createdAt);
        dueDateB.setDate(dueDateB.getDate() + offsetB);
        return dueDateA.getTime() - dueDateB.getTime();
    });
  }, [words]);

  const handleMarkAsReviewed = (word: Word) => {
    const nextStage = word.reviewStage + 1;
    const updatedReviewedWord: Word = {
      ...word,
      reviewStage: nextStage as EbbinghausStage,
      lastReviewedAt: Date.now(),
    };
    updateWord(updatedReviewedWord);
  };

  // Edit word functionality (copied from WordsPage for consistency, could be refactored)
  const [currentWordText, setCurrentWordText] = useState('');
  const [currentDefinitions, setCurrentDefinitions] = useState<Word['definitions']>([]);
  const [currentNotes, setCurrentNotes] = useState('');
  
  const openEditModal = (word: Word) => {
    setEditingWordDetails(word);
    setCurrentWordText(word.text);
    setCurrentDefinitions(word.definitions.length > 0 ? word.definitions : [{ partOfSpeech: '', definition: '', example: '' }]);
    setCurrentNotes(word.notes);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWordDetails(null);
  };
  
  const handleDefinitionChange = (index: number, field: keyof Word['definitions'][0], value: string) => {
    const newDefinitions = [...currentDefinitions];
    newDefinitions[index] = { ...newDefinitions[index], [field]: value };
    setCurrentDefinitions(newDefinitions);
  };

  const addDefinitionField = () => setCurrentDefinitions([...currentDefinitions, { partOfSpeech: '', definition: '', example: '' }]);
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


  return (
    <div className="space-y-6">
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">今日复习</h1>
        <p className="text-slate-600 dark:text-slate-300">根据艾宾浩斯遗忘曲线，这些是今天需要复习的单词。</p>
      </div>

      {wordsDueForReview.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-slate-500 dark:text-slate-400 text-lg">太棒了！今天没有需要复习的单词。</p>
          <p className="text-slate-500 dark:text-slate-400">去添加一些新单词，或者回顾一下已掌握的吧！</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wordsDueForReview.map(word => (
          <div key={word.id} className="relative group">
            <WordCard 
              word={word} 
              onEdit={openEditModal} 
              onDelete={deleteWord} 
            />
            <button
              onClick={() => handleMarkAsReviewed(word)}
              className="absolute top-6 right-20 sm:right-24 md:right-20 lg:right-24  bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center text-sm"
              title="标记为已复习"
            >
              <CheckIcon className="w-4 h-4 mr-1" /> 已复习
            </button>
          </div>
        ))}
      </div>
      
      {/* Modal for Editing Word Details - from WordCard interaction */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="编辑单词详情" size="xl">
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
                  <input type="text" id={`edit-pos-${index}`} value={def.partOfSpeech} onChange={(e) => handleDefinitionChange(index, 'partOfSpeech', e.target.value)} required className="mt-1 block w-full input-standard" />
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
              <button type="button" onClick={closeEditModal} className="btn-secondary">取消</button>
              <button type="submit" className="btn-primary">保存更改</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ReviewPage;
