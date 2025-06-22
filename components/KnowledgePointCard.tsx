import React, { useState } from 'react';
import { KnowledgePoint, Category } from '../types';
import { useData } from '../contexts/DataContext';
import { EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface KnowledgePointCardProps {
  knowledgePoint: KnowledgePoint;
  onEdit: (kp: KnowledgePoint) => void;
  onDelete: (kpId: string) => void;
}

const KnowledgePointCard: React.FC<KnowledgePointCardProps> = ({ knowledgePoint, onEdit, onDelete }) => {
  const { categories } = useData();
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryPath = (categoryId: string | null): string => {
    if (!categoryId) return '未分类';
    let path = '';
    let currentCat = categories.find(c => c.id === categoryId);
    while (currentCat) {
      path = currentCat.name + (path ? ` / ${path}` : '');
      currentCat = categories.find(c => c.id === currentCat!.parentId);
    }
    return path || '未分类';
  };

  const categoryName = getCategoryPath(knowledgePoint.categoryId);

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 my-3 transition-all hover:shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400">{knowledgePoint.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{categoryName}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{knowledgePoint.content}</p>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={() => onEdit(knowledgePoint)}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            title="编辑知识点"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => {
                if(window.confirm(`确定要删除知识点 "${knowledgePoint.title}" 吗？`)) {
                    onDelete(knowledgePoint.id);
                }
            }}
            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="删除知识点"
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
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
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
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            添加时间: {new Date(knowledgePoint.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgePointCard;