import React, { useState } from 'react';
import { Word, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS, ReadingRecordSourceInfo } from '../types';
import { useData } from '../contexts/DataContext';
import { EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ArrowUturnLeftIcon } from './icons';

interface WordCardProps {
  word: Word;
  onEdit: (word: Word) => void;
  onDelete: (wordId: string) => void;
  onUndoReview?: (word: Word) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onEdit, onDelete, onUndoReview }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { categories } = useData(); 

  const getNextReviewDate = (currentWord: Word): Date | null => {
    if (currentWord.reviewStage >= EbbinghausStage.MASTERED) return null;
    
    const reviewStageForOffset = currentWord.reviewStage as EbbinghausStage;
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[reviewStageForOffset];

    if (offsetDays === null || offsetDays === undefined) return null; 
    
    const nextDate = new Date(currentWord.createdAt);
    nextDate.setDate(nextDate.getDate() + offsetDays);
    return nextDate;
  };
  
  const nextReviewDate = getNextReviewDate(word);

  const getReadingRecordDisplayText = (readingRecordSource?: ReadingRecordSourceInfo | null): string | null => {
    if (readingRecordSource && readingRecordSource.readingRecordCategoryId && readingRecordSource.referenceName) {
        const category = categories.find(c => c.id === readingRecordSource.readingRecordCategoryId);
        const categoryName = category ? category.name : '未知记录类型';
        return `${categoryName}: ${readingRecordSource.referenceName}`;
    }
    return null;
  };

  const handleUndoReviewClick = () => {
    if (onUndoReview && word.reviewStage > EbbinghausStage.LEARNED) {
      // Removed window.confirm
      onUndoReview(word);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 my-3 transition-all hover:shadow-xl flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{word.text}</h3>
          {word.definitions.slice(0, 1).map((def, index) => (
            <p key={index} className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">{def.partOfSpeech}:</span> {def.definition.substring(0, 100)}{def.definition.length > 100 ? '...' : ''}
            </p>
          ))}
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          {onUndoReview && word.reviewStage > EbbinghausStage.LEARNED && (
            <button
              onClick={handleUndoReviewClick}
              className="p-2 text-slate-500 hover:text-yellow-600 dark:text-slate-400 dark:hover:text-yellow-400 transition-colors"
              title="撤销上次复习"
              aria-label="撤销上次复习"
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onEdit(word)}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            title="编辑单词"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => {
                // Removed window.confirm
                onDelete(word.id);
            }}
            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="删除单词"
          >
            <TrashIcon />
          </button>
           <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title={isExpanded ? "收起详情" : "展开详情"}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {word.definitions.map((def, index) => (
            <div key={index} className="mb-2">
              <p className="text-md font-semibold text-slate-700 dark:text-slate-200">{def.partOfSpeech}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 ml-2">{def.definition}</p>
              {def.example && <p className="text-sm text-slate-500 dark:text-slate-400 ml-2 italic">例: {def.example}</p>}
            </div>
          ))}
          {word.notes && (
            <div className="mt-2">
              <p className="text-md font-semibold text-slate-700 dark:text-slate-200">备注:</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 ml-2 whitespace-pre-wrap">{word.notes}</p>
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            {/* Removed sourceType display */}
            {word.readingRecordSource && (
                <p>阅读记录: {getReadingRecordDisplayText(word.readingRecordSource)}</p>
            )}
            <p>添加时间: {new Date(word.createdAt).toLocaleDateString('zh-CN')}</p>
            <p>复习阶段: {word.reviewStage} / {EbbinghausStage.MASTERED}</p>
             {nextReviewDate && word.reviewStage < EbbinghausStage.MASTERED && (
              <p>下次复习: {nextReviewDate.toLocaleDateString('zh-CN')}</p>
            )}
            {word.reviewStage >= EbbinghausStage.MASTERED && (
                <p className="text-green-500 font-medium">已掌握!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCard;