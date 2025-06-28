import React, { useState } from 'react';
import { KnowledgePoint, Category, EbbinghausStage, EBBINGHAUS_REVIEW_OFFSETS_DAYS } from '../types.ts';
import { useData } from '../contexts/DataContext.tsx';
import { EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon, XMarkIcon, ArrowUturnLeftIcon } from './icons.tsx';

interface KnowledgePointCardProps {
  knowledgePoint: KnowledgePoint;
  onEdit: (kp: KnowledgePoint) => void;
  onDelete: (kpId: string) => void; 
  isReviewMode?: boolean;
  onMarkAsRemembered?: (kp: KnowledgePoint) => void;
  onMarkAsForgotten?: (kp: KnowledgePoint) => void;
  onUndoReview?: (kp: KnowledgePoint) => void;
}

const KnowledgePointCard: React.FC<KnowledgePointCardProps> = ({ 
  knowledgePoint, 
  onEdit, 
  onDelete,
  isReviewMode = false,
  onMarkAsRemembered,
  onMarkAsForgotten,
  onUndoReview
}) => {
  const { categories } = useData();
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryPath = (categoryId: string | null): string => {
    if (!categoryId) return '未分类';
    let path = '';
    let currentCat = categories.find(c => c.id === categoryId);
    const visited = new Set<string>();
    while (currentCat && !visited.has(currentCat.id)) {
      visited.add(currentCat.id);
      path = currentCat.name + (path ? ` / ${path}` : '');
      const parentId = currentCat.parentId; 
      currentCat = categories.find(c => c.id === parentId);
    }
    return path || '未分类';
  };

  const categoryName = getCategoryPath(knowledgePoint.categoryId);

  const getNextReviewDate = (kp: KnowledgePoint): Date | null => {
    if (kp.reviewStage >= EbbinghausStage.MASTERED) return null;
    const reviewStageForOffset = kp.reviewStage as EbbinghausStage;
    
    const offsetDays = EBBINGHAUS_REVIEW_OFFSETS_DAYS[reviewStageForOffset];

    if (offsetDays === null || offsetDays === undefined) return null;
    
    const baseDate = new Date(kp.lastReviewedAt); 
    baseDate.setDate(baseDate.getDate() + offsetDays);
    baseDate.setHours(0,0,0,0); 
    return baseDate;
  };
  
  const nextReviewDate = getNextReviewDate(knowledgePoint);

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 my-3 transition-all hover:shadow-xl flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex-grow mr-2">
          <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">{knowledgePoint.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{categoryName}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{knowledgePoint.content}</p>
        </div>
        <div className="flex space-x-1 flex-shrink-0 items-center">
          {isReviewMode && onMarkAsRemembered && (
            <button
              onClick={() => onMarkAsRemembered(knowledgePoint)}
              className="p-1.5 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors rounded-full hover:bg-green-100 dark:hover:bg-green-700"
              title="记住了"
              aria-label="标记为记住了"
            >
              <CheckIcon className="w-5 h-5" />
            </button>
          )}
          {isReviewMode && onMarkAsForgotten && (
            <button
              onClick={() => onMarkAsForgotten(knowledgePoint)}
              className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full hover:bg-red-100 dark:hover:bg-red-700"
              title="忘记了"
              aria-label="标记为忘记了"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
           {onUndoReview && knowledgePoint.reviewStage > EbbinghausStage.LEARNED && (
            <button
              onClick={() => onUndoReview(knowledgePoint)}
              className="p-1.5 text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-700"
              title="撤销上次复习"
              aria-label="撤销上次复习"
            >
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
          )}
          {!isReviewMode && (
            <>
              <button
                onClick={() => onEdit(knowledgePoint)}
                className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                title="编辑知识点"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`确定要删除知识点 "${knowledgePoint.title}" 吗？`)) {
                    onDelete(knowledgePoint.id);
                  }
                }}
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                title="删除知识点"
              >
                <TrashIcon />
              </button>
            </>
          )}
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
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          <div>
            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200">内容:</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 ml-2 whitespace-pre-wrap">{knowledgePoint.content}</p>
          </div>
          {knowledgePoint.source && (
            <div className="mt-2">
              <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200">来源:</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 ml-2 whitespace-pre-wrap">{knowledgePoint.source}</p>
            </div>
          )}
          {knowledgePoint.notes && (
            <div className="mt-2">
              <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200">备注:</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 ml-2 whitespace-pre-wrap">{knowledgePoint.notes}</p>
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>添加时间: {new Date(knowledgePoint.createdAt).toLocaleDateString('zh-CN')}</p>
            <p>上次复习: {new Date(knowledgePoint.lastReviewedAt).toLocaleString('zh-CN', {dateStyle:'short', timeStyle:'short'})}</p>
            <p>复习阶段: {EbbinghausStage[knowledgePoint.reviewStage]} ({knowledgePoint.reviewStage} / {Object.keys(EbbinghausStage).filter(k => !isNaN(Number(k))).length -1})</p>
             {nextReviewDate && knowledgePoint.reviewStage < EbbinghausStage.MASTERED && (
              <p>下次复习: {nextReviewDate.toLocaleDateString('zh-CN')}</p>
            )}
            {knowledgePoint.reviewStage >= EbbinghausStage.MASTERED && (
                <p className="text-green-500 font-medium">已掌握!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointCard;