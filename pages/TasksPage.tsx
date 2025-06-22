
import React, { useState, useEffect, useCallback, useMemo, ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { Task, TaskQuadrant } from '../types';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import { PlusIcon, ArrowUpOnSquareIcon } from '../components/icons';
import { TASK_QUADRANT_LABELS, TASK_QUADRANT_COLORS } from '../constants';

// XLSX type declaration (since it's loaded from CDN)
declare var XLSX: any;

const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const TasksPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [currentTaskText, setCurrentTaskText] = useState('');
  const [currentQuadrant, setCurrentQuadrant] = useState<TaskQuadrant>(TaskQuadrant.URGENT_IMPORTANT);

  const todayDateStr = getTodayDateString();

  const todaysTasks = useMemo(() => {
    return tasks
        .filter(task => {
            if (task.isLongTerm) return true; 
            const taskDate = new Date(task.createdAt);
            const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
            return taskDateStr === todayDateStr || task.isCarriedOver;
        })
        .sort((a,b) => (a.isCompleted ? 1 : -1) || (b.createdAt - a.createdAt)); 
  }, [tasks, todayDateStr]);


  const resetForm = useCallback(() => {
    setCurrentTaskText('');
    setCurrentQuadrant(TaskQuadrant.URGENT_IMPORTANT);
    setEditingTask(null);
  }, []);

  useEffect(() => {
    if (editingTask) {
      setCurrentTaskText(editingTask.text);
      setCurrentQuadrant(editingTask.quadrant);
    } else {
      resetForm();
    }
  }, [editingTask, resetForm]);

  const handleOpenModal = (taskToEdit?: Task) => {
    setEditingTask(taskToEdit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTaskText.trim()) {
      alert('任务内容不能为空');
      return;
    }

    const now = Date.now();
    if (editingTask) {
      updateTask({
        ...editingTask,
        text: currentTaskText.trim(),
        quadrant: currentQuadrant,
      });
    } else {
      addTask({
        id: `task-${now}`,
        text: currentTaskText.trim(),
        quadrant: currentQuadrant,
        isCompleted: false,
        createdAt: now, 
      });
    }
    handleCloseModal();
  };

  const handleToggleComplete = (task: Task) => {
    updateTask({ ...task, isCompleted: !task.isCompleted, completedAt: !task.isCompleted ? Date.now() : undefined });
  };
  
  const handleToggleCarryOver = (task: Task) => {
    if (task.isLongTerm) return; 
    updateTask({ ...task, isCarriedOver: !task.isCarriedOver });
  };

  const handleToggleLongTerm = (task: Task) => {
    const newIsLongTerm = !task.isLongTerm;
    updateTask({ 
        ...task, 
        isLongTerm: newIsLongTerm,
        isCarriedOver: newIsLongTerm ? false : task.isCarriedOver 
    });
  };

  const handleExportTasks = () => {
    try {
      const tasksToExport = todaysTasks.map(task => ({
        '内容': task.text,
        '象限': TASK_QUADRANT_LABELS[task.quadrant],
        '是否完成': task.isCompleted ? '是' : '否',
        '创建日期': new Date(task.createdAt).toLocaleDateString('zh-CN'),
        '完成时间': task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '',
        '长期任务': task.isLongTerm ? '是' : '否',
        '延续任务': task.isCarriedOver ? '是' : '否',
      }));

      if (tasksToExport.length === 0) {
        alert('今日没有任务可以导出。');
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(tasksToExport);
      XLSX.utils.book_append_sheet(wb, ws, `Lumina_Tasks_${todayDateStr}`);
      XLSX.writeFile(wb, `Lumina_Tasks_${todayDateStr}.xlsx`);
      alert('今日任务导出成功！');
    } catch (error) {
      console.error("Error exporting tasks:", error);
      alert('任务导出失败。请查看控制台获取更多信息。');
    }
  };
  
  const quadrantOrder: TaskQuadrant[] = [
    TaskQuadrant.URGENT_IMPORTANT,
    TaskQuadrant.IMPORTANT_NOT_URGENT,
    TaskQuadrant.URGENT_NOT_IMPORTANT,
    TaskQuadrant.NOT_IMPORTANT_NOT_URGENT,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">今日任务 ({new Date().toLocaleDateString('zh-CN')})</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportTasks}
            className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-2.5 rounded-md shadow transition-colors text-xs sm:text-sm"
            aria-label="导出今日任务"
          >
            <ArrowUpOnSquareIcon className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
            导出今日
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-2.5 rounded-md shadow transition-colors text-xs sm:text-sm"
            aria-label="添加新任务"
          >
            <PlusIcon className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
            添加任务
          </button>
        </div>
      </div>

      {todaysTasks.length === 0 && (
         <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-lg shadow col-span-1 sm:col-span-2">
            <p className="text-slate-500 dark:text-slate-400 text-lg">今日无任务。</p>
            <p className="text-slate-500 dark:text-slate-400">点击 "添加任务" 开始新的一天吧！</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrantOrder.map(quadrant => {
          const tasksInQuadrant = todaysTasks.filter(t => t.quadrant === quadrant);
          
          return (
            <div key={quadrant} className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow flex flex-col min-h-[160px]">
              <h2 className={`text-base font-semibold mb-2 p-2 rounded-t-md text-white ${TASK_QUADRANT_COLORS[quadrant]}`}>
                {TASK_QUADRANT_LABELS[quadrant]} ({tasksInQuadrant.length})
              </h2>
              {tasksInQuadrant.length > 0 ? (
                <div className="space-y-2 p-1 sm:p-2 max-h-60 overflow-y-auto custom-scrollbar flex-grow">
                  {tasksInQuadrant.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggleComplete={handleToggleComplete}
                      onDelete={deleteTask}
                      onEdit={handleOpenModal}
                      onToggleCarryOver={handleToggleCarryOver}
                      onToggleLongTerm={handleToggleLongTerm}
                    />
                  ))}
                </div>
              ) : (
                 <div className="p-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center flex-grow flex items-center justify-center">
                    <p>此象限暂无任务。</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? '编辑任务' : '添加新任务'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taskText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">任务内容</label>
            <textarea
              id="taskText"
              value={currentTaskText}
              onChange={(e) => setCurrentTaskText(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="taskQuadrant" className="block text-sm font-medium text-slate-700 dark:text-slate-300">任务象限</label>
            <select
              id="taskQuadrant"
              value={currentQuadrant}
              onChange={(e) => setCurrentQuadrant(e.target.value as TaskQuadrant)}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            >
              {Object.values(TaskQuadrant).map(quad => (
                <option key={quad} value={quad}>{TASK_QUADRANT_LABELS[quad]}</option>
              ))}
            </select>
          </div>
           {editingTask && ( 
            <div className="space-y-2 pt-2">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="taskIsCompleted"
                        checked={editingTask.isCompleted}
                        onChange={() => handleToggleComplete(editingTask)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-slate-600 dark:border-slate-500"
                    />
                    <label htmlFor="taskIsCompleted" className="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                        标记为已完成
                    </label>
                </div>
                {!editingTask.isLongTerm && (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="taskIsCarriedOver"
                            checked={!!editingTask.isCarriedOver}
                            onChange={() => handleToggleCarryOver(editingTask)}
                            className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 dark:bg-slate-600 dark:border-slate-500"
                        />
                        <label htmlFor="taskIsCarriedOver" className="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                            延续到明天
                        </label>
                    </div>
                )}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="taskIsLongTerm"
                        checked={!!editingTask.isLongTerm}
                        onChange={() => handleToggleLongTerm(editingTask)}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-slate-600 dark:border-slate-500"
                    />
                    <label htmlFor="taskIsLongTerm" className="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                        长期保存 (不自动清除)
                    </label>
                </div>
            </div>
           )}
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingTask ? '保存更改' : '添加任务'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
