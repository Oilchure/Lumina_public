
import React from 'react';
import { Task, TaskQuadrant } from '../types';
import { TASK_QUADRANT_LABELS, TASK_QUADRANT_COLORS } from '../constants';
import { CheckIcon, TrashIcon, EditIcon, ArrowPathIcon, ArchiveBoxIcon, SparklesIcon } from './icons';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onToggleCarryOver: (task: Task) => void;
  onToggleLongTerm: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
    task, 
    onToggleComplete, 
    onDelete, 
    onEdit,
    onToggleCarryOver,
    onToggleLongTerm
}) => {
  const quadrantColor = TASK_QUADRANT_COLORS[task.quadrant] || 'bg-gray-500';
  const quadrantLabel = TASK_QUADRANT_LABELS[task.quadrant] || '未知象限';

  return (
    <div className={`p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${task.isCompleted ? 'border-green-500 dark:border-green-600 bg-slate-50 dark:bg-slate-800 opacity-70' : `${quadrantColor.replace('bg-', 'border-')} bg-white dark:bg-slate-800`}`}>
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <div className="flex items-center mb-1">
             <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full mr-1.5 text-white ${quadrantColor}`}>
                {quadrantLabel}
            </span>
            {task.isLongTerm && <ArchiveBoxIcon className="w-3.5 h-3.5 text-purple-500 mr-1" title="长期任务"/>}
            {task.isCarriedOver && !task.isLongTerm && <ArrowPathIcon className="w-3.5 h-3.5 text-cyan-500 mr-1" title="延续任务"/>}
          </div>
          <p className={`text-sm text-slate-800 dark:text-slate-100 ${task.isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
            {task.text}
          </p>
           {task.isCompleted && task.completedAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              完成于: {new Date(task.completedAt).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-0.5 ml-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-0.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            title="编辑任务"
            aria-label="编辑任务"
          >
            <EditIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
                if (window.confirm(`确定要删除任务 "${task.text}" 吗？`)) {
                    onDelete(task.id);
                }
            }}
            className="p-0.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            title="删除任务"
            aria-label="删除任务"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1 items-center justify-between">
        <button
            onClick={() => onToggleComplete(task)}
            className={`px-2 py-0.5 text-xs font-medium rounded-md flex items-center transition-colors
                        ${task.isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600' 
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500'}`}
            aria-pressed={task.isCompleted}
            aria-label={task.isCompleted ? "标记为未完成" : "标记为已完成"}
        >
            <CheckIcon className={`w-3.5 h-3.5 mr-1 ${task.isCompleted ? 'text-green-700 dark:text-green-100' : 'text-slate-500'}`} />
            {task.isCompleted ? '已完成' : '待完成'}
        </button>
        <div className="flex gap-1">
            <button
                onClick={() => onToggleCarryOver(task)}
                disabled={task.isLongTerm}
                className={`p-0.5 rounded-md transition-colors ${task.isCarriedOver && !task.isLongTerm ? 'bg-cyan-100 dark:bg-cyan-600 text-cyan-700 dark:text-cyan-100' : 'text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400'} ${task.isLongTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={task.isCarriedOver ? "取消延续到明天" : "延续到明天"}
                aria-pressed={task.isCarriedOver}
            >
                <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onToggleLongTerm(task)}
                className={`p-0.5 rounded-md transition-colors ${task.isLongTerm ? 'bg-purple-100 dark:bg-purple-600 text-purple-700 dark:text-purple-100' : 'text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400'}`}
                title={task.isLongTerm ? "取消长期保存" : "长期保存"}
                aria-pressed={task.isLongTerm}
            >
                <ArchiveBoxIcon className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
