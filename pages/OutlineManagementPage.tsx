import React, { useState, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import Modal from '../components/Modal';
import { EditIcon, TrashIcon, FolderPlusIcon, ChevronDownIcon, ChevronRightIcon } from '../components/icons';

const OutlineManagementPage: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, knowledgePoints } = useData();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const resetCategoryForm = useCallback(() => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryParentId(null);
  }, []);

  const handleOpenCategoryModal = (categoryToEdit?: Category, parentToPreselect?: string | null) => {
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
      setCategoryName(categoryToEdit.name);
      setCategoryParentId(categoryToEdit.parentId);
    } else {
      resetCategoryForm();
      if (parentToPreselect !== undefined) {
         setCategoryParentId(parentToPreselect);
      }
    }
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    resetCategoryForm();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert('分类名称不能为空');
      return;
    }
    if (editingCategory) {
      if (editingCategory.id === categoryParentId) {
        alert('分类不能成为自身的父分类。');
        return;
      }
      let tempParentId = categoryParentId;
      while(tempParentId){ // Check for circular dependency
        if(tempParentId === editingCategory.id){
            alert('不能将分类的父级设置为其自身或其子级。');
            return;
        }
        const parentCat = categories.find(c => c.id === tempParentId);
        tempParentId = parentCat ? parentCat.parentId : null;
      }
      updateCategory({ ...editingCategory, name: categoryName.trim(), parentId: categoryParentId });
    } else {
      addCategory({
        id: `cat-${Date.now()}`,
        name: categoryName.trim(),
        parentId: categoryParentId,
      });
    }
    handleCloseCategoryModal();
  };
  
  const getCategoryUsageCount = (categoryId: string): number => {
    return knowledgePoints.filter(kp => kp.categoryId === categoryId).length;
  }

  const renderCategoryTree = (parentId: string | null = null, depth = 0): React.ReactNode[] => {
    const children = categories
      .filter(cat => cat.parentId === parentId)
      .sort((a,b) => a.name.localeCompare(b.name));

    return children.flatMap(cat => {
        const usageCount = getCategoryUsageCount(cat.id);
        const hasChildren = categories.some(c => c.parentId === cat.id);
        const isExpanded = expandedCategories.has(cat.id);
        return (
            <React.Fragment key={cat.id}>
            <div 
                className={`flex items-center justify-between py-1.5 px-2 my-0.5 rounded transition-colors group hover:bg-slate-100 dark:hover:bg-slate-700`}
                style={{ paddingLeft: `${depth * 1.5 + 0.5}rem`}}
            >
                <div className="flex items-center flex-grow min-w-0"> 
                 {(hasChildren || depth < 2) && ( // Allow expansion icon for top two levels even if no children yet, for adding sub-cats
                    <button 
                        onClick={() => toggleCategoryExpansion(cat.id)} 
                        className="p-1 mr-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `折叠 ${cat.name}` : `展开 ${cat.name}`}
                    >
                        {isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5"/> : <ChevronRightIcon className="w-3.5 h-3.5"/>}
                    </button>
                 )}
                 {!(hasChildren || depth < 2) && <span className="w-[1.375rem] mr-1"></span>}
                <span className="text-slate-800 dark:text-slate-100 font-medium truncate" title={cat.name}>{cat.name}</span>
                {usageCount > 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{usageCount}</span>}
                </div>
                <div className="space-x-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => handleOpenCategoryModal(undefined, cat.id)}
                    className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                    title={`在 "${cat.name}" 下添加子分类`}
                    aria-label={`在 "${cat.name}" 下添加子分类`}
                >
                    <FolderPlusIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handleOpenCategoryModal(cat)} 
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" 
                    title="编辑分类"
                    aria-label={`编辑分类 ${cat.name}`}
                >
                    <EditIcon className="w-4 h-4"/>
                </button>
                <button 
                    onClick={() => {
                       if (window.confirm(`确定要删除分类 "${cat.name}" 吗？此操作不可撤销。`)) {
                           deleteCategory(cat.id);
                       }
                    }} 
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="删除分类"
                    aria-label={`删除分类 ${cat.name}`}
                >
                    <TrashIcon className="w-4 h-4"/>
                </button>
                </div>
            </div>
            {isExpanded && renderCategoryTree(cat.id, depth + 1)}
            </React.Fragment>
        )
      });
  };
  
  // Renders options for parent selection dropdown, preventing circular dependencies.
  const renderCategoryOptionsForParentSelect = (currentEditingCategoryId?: string, parentId: string | null = null, depth = 0): React.ReactNode[] => {
    return categories
      .filter(cat => {
        if (cat.id === currentEditingCategoryId) return false; // Cannot be its own parent.
        
        // Prevent selecting a child of currentEditingCategory as its parent
        if (currentEditingCategoryId) {
            let tempParent = cat.parentId;
            while(tempParent) {
                if (tempParent === currentEditingCategoryId) return false;
                const parentCat = categories.find(c => c.id === tempParent);
                tempParent = parentCat ? parentCat.parentId : null;
            }
        }
        return cat.parentId === parentId;
      })
      .sort((a,b) => a.name.localeCompare(b.name))
      .flatMap(cat => [
        <option key={cat.id} value={cat.id} className="dark:bg-slate-700 dark:text-slate-100">
          {'--'.repeat(depth)} {cat.name}
        </option>,
        ...renderCategoryOptionsForParentSelect(currentEditingCategoryId, cat.id, depth + 1)
      ]);
  };


  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">大纲</h1>
            <button
                onClick={() => handleOpenCategoryModal(undefined, null)} // Pass null for top-level
                className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors"
                aria-label="添加新顶级分类"
            >
                <FolderPlusIcon className="w-5 h-5 mr-2" />
                添加顶级分类
            </button>
        </div>
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {categories.filter(c => c.parentId === null).length === 0 && !categories.some(c=>c.parentId !== null) && (
                 <p className="text-slate-500 dark:text-slate-400 p-2">还没有分类，点击上面按钮添加一个吧。</p>
            )}
            {renderCategoryTree()}
          </div>
        </div>
      </div>
      
      <Modal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} title={editingCategory ? '编辑分类' : '添加新分类'}>
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">分类名称</label>
            <input
              type="text"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="categoryParent" className="block text-sm font-medium text-slate-700 dark:text-slate-300">父分类</label>
            <select
              id="categoryParent"
              value={categoryParentId || ''}
              onChange={(e) => setCategoryParentId(e.target.value || null)}
              className="mt-1 block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 dark:bg-slate-700 dark:text-slate-100"
              aria-describedby="category-parent-description"
            >
              <option value="">-- 无 (设为顶级分类) --</option>
              {renderCategoryOptionsForParentSelect(editingCategory?.id)}
            </select>
            <p id="category-parent-description" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                选择一个父分类，或留空以创建顶级分类。
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={handleCloseCategoryModal}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingCategory ? '保存更改' : '添加分类'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OutlineManagementPage;
