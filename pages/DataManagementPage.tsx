import React, { ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { ExportData, Word, KnowledgePoint, Category, Task, ReadingRecordSourceInfo, TaskQuadrant } from '../types';
import { ArrowUpOnSquareIcon, ArrowDownOnSquareIcon } from '../components/icons';

// XLSX type declaration (since it's loaded from CDN)
declare var XLSX: any;

const DataManagementPage: React.FC = () => {
  const { importData, exportData } = useData();

  const handleExportData = () => {
    try {
      const dataToExport = exportData();
      const wb = XLSX.utils.book_new();
      
      const wordsSheet = XLSX.utils.json_to_sheet(dataToExport.words.map(word => ({
        id: word.id,
        text: word.text,
        definitions: JSON.stringify(word.definitions),
        notes: word.notes,
        readingRecordSource: word.readingRecordSource ? JSON.stringify(word.readingRecordSource) : undefined,
        createdAt: word.createdAt,
        reviewStage: word.reviewStage,
        lastReviewedAt: word.lastReviewedAt,
      })));
      XLSX.utils.book_append_sheet(wb, wordsSheet, "Words");
      
      const knowledgePointsSheet = XLSX.utils.json_to_sheet(dataToExport.knowledgePoints);
      XLSX.utils.book_append_sheet(wb, knowledgePointsSheet, "KnowledgePoints");
      
      const categoriesSheet = XLSX.utils.json_to_sheet(dataToExport.categories);
      XLSX.utils.book_append_sheet(wb, categoriesSheet, "Categories");

      const tasksSheet = XLSX.utils.json_to_sheet(dataToExport.tasks);
      XLSX.utils.book_append_sheet(wb, tasksSheet, "Tasks");

      XLSX.writeFile(wb, "lumina_data_export.xlsx");
      alert('数据导出成功！');
    } catch (error) {
      console.error("Error exporting data:", error);
      alert('数据导出失败。请查看控制台获取更多信息。');
    }
  };

  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File data is empty.");
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const importedWordsRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Words"] || []);
        const importedWords: Word[] = importedWordsRaw.map((word: any) => ({
            id: word.id || `word-${Date.now()}-${Math.random()}`,
            text: word.text || '',
            definitions: JSON.parse(word.definitions || '[]'),
            notes: word.notes || '',
            // sourceType removed
            readingRecordSource: word.readingRecordSource ? JSON.parse(word.readingRecordSource) : null,
            createdAt: Number(word.createdAt) || Date.now(),
            lastReviewedAt: Number(word.lastReviewedAt) || Date.now(),
            reviewStage: Number(word.reviewStage) || 0,
        }));

        const importedKnowledgePointsRaw = XLSX.utils.sheet_to_json(workbook.Sheets["KnowledgePoints"] || []);
        const importedKnowledgePoints: KnowledgePoint[] = importedKnowledgePointsRaw.map((kp: any) => ({
            id: kp.id || `kp-${Date.now()}-${Math.random()}`,
            title: kp.title || '',
            content: kp.content || '',
            notes: kp.notes || '',
            categoryId: kp.categoryId || null,
            source: kp.source || undefined,
            createdAt: Number(kp.createdAt) || Date.now(),
        }));

        const importedCategoriesRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Categories"] || []);
        const importedCategories: Category[] = importedCategoriesRaw.map((cat: any) => ({
            id: cat.id || `cat-${Date.now()}-${Math.random()}`,
            name: cat.name || '',
            parentId: cat.parentId || null,
        }));

        const importedTasksRaw = XLSX.utils.sheet_to_json(workbook.Sheets["Tasks"] || []);
        const importedTasks: Task[] = importedTasksRaw.map((task: any) => ({
            id: task.id || `task-${Date.now()}-${Math.random()}`,
            text: task.text || '',
            quadrant: task.quadrant || TaskQuadrant.URGENT_IMPORTANT,
            isCompleted: Boolean(task.isCompleted),
            isCarriedOver: Boolean(task.isCarriedOver),
            isLongTerm: Boolean(task.isLongTerm),
            createdAt: Number(task.createdAt) || Date.now(),
            completedAt: task.completedAt ? Number(task.completedAt) : undefined,
        }));


        if (window.confirm('导入数据将会覆盖现有数据（单词、知识点、分类、任务）。确定要继续吗？')) {
          importData({
            words: importedWords,
            knowledgePoints: importedKnowledgePoints,
            categories: importedCategories,
            tasks: importedTasks,
          });
          alert('数据导入成功！');
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert('数据导入失败。请确保文件格式正确 (包含 Words, KnowledgePoints, Categories, Tasks 表单，并且JSON字段格式正确)，并查看控制台获取更多信息。');
      } finally {
        event.target.value = ''; // Reset file input
      }
    };
    reader.readAsBinaryString(file);
  };
  

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">数据</h1>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">导出数据</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">将您的所有词汇、知识点、大纲和任务导出为 Excel (.xlsx) 文件。该文件可用于备份或在其他设备上导入。</p>
            <button
              onClick={handleExportData}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors"
              aria-label="导出所有数据到Excel文件"
            >
              <ArrowUpOnSquareIcon className="w-5 h-5 mr-2" />
              导出到 Excel
            </button>
          </div>
          <hr className="dark:border-slate-700 my-6"/>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">导入数据</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">从之前导出的 Lumina Excel (.xlsx) 文件导入数据。 <strong className="text-red-500 dark:text-red-400">注意：此操作将覆盖当前应用中的所有现有数据。</strong></p>
            <label className="flex items-center bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors cursor-pointer w-max" role="button" aria-label="选择Excel文件导入数据">
              <ArrowDownOnSquareIcon className="w-5 h-5 mr-2" />
              选择文件导入
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleImportData}
                className="hidden"
                aria-hidden="true"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;