
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, KnowledgePoint, Word } from '../types';
import { BookOpenIcon, DocumentTextIcon, SquaresFourIcon, FolderPlusIcon, ChevronDownIcon, ChevronRightIcon } from '../components/icons';
import { READING_RECORDS_CATEGORY_ID, READING_RECORD_LITERATURE_ID } from '../constants';

interface MindMapNodeData {
  id: string;
  name: string;
  type: 'category' | 'knowledgePoint' | 'word' | 'literatureGroup';
  children?: MindMapNodeData[];
  data?: KnowledgePoint | Word; 
  depth: number;
}

interface MindMapNodeDisplayProps {
  node: MindMapNodeData;
  isGloballyExpanded: boolean;
}

const calculateNodeMargin = (depth: number): string => {
  if (depth === 0) return '0';
  // Always use networkWeb margin logic
  return `${depth * 1.5}rem`; 
};

const MindMapNodeDisplay: React.FC<MindMapNodeDisplayProps> = ({ node, isGloballyExpanded }) => {
  const NodeIcon = 
    node.type === 'knowledgePoint' ? DocumentTextIcon :
    node.type === 'word' ? BookOpenIcon :
    node.type === 'literatureGroup' ? FolderPlusIcon :
    node.type === 'category' && node.id === READING_RECORDS_CATEGORY_ID ? SquaresFourIcon :
    node.type === 'category' ? FolderPlusIcon :
    null;

  const hasChildren = node.children && node.children.length > 0;

  const getBaseNodeClasses = (type: MindMapNodeData['type'], depth: number, nodeId: string) => {
    let classes = "flex items-center my-0.5 border-l-4 transition-colors ";
    // Always use networkWeb styling (pill shape)
    classes += "px-3 py-1.5 rounded-full text-sm "; // Increased py and text-sm
    if (nodeId === READING_RECORDS_CATEGORY_ID) classes += 'bg-green-100 dark:bg-green-800 hover:bg-green-200 dark:hover:bg-green-700 border-green-400 dark:border-green-600 font-semibold ';
    else if (type === 'literatureGroup') classes += 'bg-sky-100 dark:bg-sky-700 hover:bg-sky-200 dark:hover:bg-sky-600 border-sky-400 dark:border-sky-500 ';
    else if (type === 'category') classes += depth === 1 ? 'bg-indigo-100 dark:bg-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-600 border-indigo-400 dark:border-indigo-500 ' : 'bg-purple-100 dark:bg-purple-600 hover:bg-purple-200 dark:hover:bg-purple-500 border-purple-400 dark:border-purple-500 ';
    else if (type === 'knowledgePoint') classes += 'bg-teal-50 dark:bg-teal-800 hover:bg-teal-100 dark:hover:bg-teal-700 border-teal-400 dark:border-teal-600 ';
    else if (type === 'word') classes += 'bg-orange-50 dark:bg-orange-800 hover:bg-orange-100 dark:hover:bg-orange-700 border-orange-400 dark:border-orange-600 ';
    else classes += 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-400 dark:border-slate-500 ';
    return classes;
  };
  
  const nodeMargin = calculateNodeMargin(node.depth);

  return (
    <li className={`mindmap-li relative list-none`}>
      <div 
        className={getBaseNodeClasses(node.type, node.depth, node.id)}
        style={{ marginLeft: nodeMargin }}
      >
        {/* Expansion toggle removed - global control now */}
        {NodeIcon && <NodeIcon className={"w-3.5 h-3.5 mr-2 flex-shrink-0 text-slate-600 dark:text-slate-300"} />} {/* Increased icon size and margin */}
        <span className={`font-medium text-slate-800 dark:text-slate-100 truncate text-sm`} title={node.name}> {/* Changed to text-sm */}
          {node.name}
        </span>
        {node.data && 'createdAt' in node.data && (
            <span className={`ml-auto pl-2 flex-shrink-0 text-2xs text-slate-500 dark:text-slate-400`}> {/* Increased pl */}
                {new Date(node.data.createdAt).toLocaleDateString('zh-CN')}
            </span>
        )}
      </div>
      {isGloballyExpanded && hasChildren && (
        <ul className={`mindmap-ul relative list-none pl-network-ul`}>
          {node.children!.map(childNode => (
            <MindMapNodeDisplay 
              key={childNode.id} 
              node={childNode} 
              isGloballyExpanded={isGloballyExpanded}
            />
          ))}
        </ul>
      )}
    </li>
  );
};


const MindMapPage: React.FC = () => {
  const { categories, knowledgePoints, words } = useData();
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(true); // Default to expanded

  const treeData = useMemo(() => {
    const readingRecordsRootCat = categories.find(c => c.id === READING_RECORDS_CATEGORY_ID);
    if (!readingRecordsRootCat) return null;

    const buildTreeRecursive = (category: Category, currentDepth: number): MindMapNodeData => {
      let children: MindMapNodeData[] = [];

      const subCategories = categories
        .filter(c => c.parentId === category.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(sc => buildTreeRecursive(sc, currentDepth + 1));
      children.push(...subCategories);
      
      if (category.id === READING_RECORD_LITERATURE_ID) {
        const literatureMap = new Map<string, { kps: KnowledgePoint[], words: Word[] }>();
        knowledgePoints.forEach(kp => {
          if (kp.categoryId === READING_RECORD_LITERATURE_ID && kp.source) {
            if (!literatureMap.has(kp.source)) literatureMap.set(kp.source, { kps: [], words: [] });
            literatureMap.get(kp.source)!.kps.push(kp);
          }
        });
        words.forEach(word => {
          if (word.readingRecordSource?.readingRecordCategoryId === READING_RECORD_LITERATURE_ID && word.readingRecordSource.referenceName) {
            const litName = word.readingRecordSource.referenceName;
            if (!literatureMap.has(litName)) literatureMap.set(litName, { kps: [], words: [] });
            literatureMap.get(litName)!.words.push(word);
          }
        });
        
        const literatureGroupNodes: MindMapNodeData[] = Array.from(literatureMap.entries())
          .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
          .map(([literatureName, items]) => {
            const litKps = items.kps.sort((a,b)=>a.title.localeCompare(b.title)).map(kp => ({
              id: `kp-${kp.id}`, name: kp.title, type: 'knowledgePoint'as 'knowledgePoint', data: kp, depth: currentDepth + 2,
            }));
            const litWords = items.words.sort((a,b)=>a.text.localeCompare(b.text)).map(word => ({
              id: `word-${word.id}`, name: word.text, type: 'word'as 'word', data: word, depth: currentDepth + 2,
            }));
            return {
              id: `litgroup-${category.id}-${literatureName.replace(/\s+/g, '-')}`,
              name: literatureName,
              type: 'literatureGroup'as 'literatureGroup',
              depth: currentDepth + 1,
              children: [...litKps, ...litWords].sort((a,b) => a.name.localeCompare(b.name)),
            };
          });
        children.push(...literatureGroupNodes);

      } else { 
        const childKPs = knowledgePoints
          .filter(kp => kp.categoryId === category.id)
          .sort((a, b) => a.title.localeCompare(b.title))
          .map(kp => ({
            id: `kp-${kp.id}`, name: kp.title, type: 'knowledgePoint'as 'knowledgePoint', data: kp, depth: currentDepth + 1,
          }));
        children.push(...childKPs);

        const childWords = words
          .filter(w => w.readingRecordSource?.readingRecordCategoryId === category.id)
          .sort((a, b) => a.text.localeCompare(b.text))
          .map(word => ({
            id: `word-${word.id}`, name: word.text, type: 'word'as 'word', data: word, depth: currentDepth + 1,
          }));
        children.push(...childWords);
      }
      
      children.sort((a,b) => {
          const typeOrder = { category: 0, literatureGroup: 1, knowledgePoint: 2, word: 3 };
          if (typeOrder[a.type] !== typeOrder[b.type]) {
              return typeOrder[a.type] - typeOrder[b.type];
          }
          return a.name.localeCompare(b.name);
      });

      return {
        id: category.id,
        name: category.name,
        type: 'category',
        depth: currentDepth,
        children: children.length > 0 ? children : undefined,
      };
    };
    
    return buildTreeRecursive(readingRecordsRootCat, 0);

  }, [categories, knowledgePoints, words]);

  const toggleGlobalExpansion = () => {
    setIsGloballyExpanded(prev => !prev);
  };

  if (!treeData) {
    return (
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <p className="text-slate-500 dark:text-slate-400">无法加载思维导图：未找到 "阅读记录" 根分类。请在“大纲”页面确保此分类存在。</p>
      </div>
    );
  }
  
  const hasContent = treeData.children && treeData.children.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">思维导图</h1>
        <div className="flex gap-2">
            <button
                onClick={toggleGlobalExpansion}
                className={`py-2 px-4 rounded-md transition-colors text-sm font-medium
                            bg-blue-500 hover:bg-blue-600 text-white`}
                aria-live="polite"
                aria-pressed={isGloballyExpanded}
            >
                {isGloballyExpanded ? '全部折叠' : '全部展开'}
            </button>
        </div>
      </div>
      
      <div className={`p-2 sm:p-4 bg-white dark:bg-slate-800 rounded-lg shadow min-h-[60vh] overflow-auto custom-scrollbar`}>
        {!hasContent ? (
          <p className="text-slate-500 dark:text-slate-400 p-4">阅读记录中尚无内容。请先在词汇或知识点页面添加并关联到阅读记录分类。</p>
        ) : (
          <ul className="mindmap-root-ul list-none p-0">
            <MindMapNodeDisplay 
                node={treeData} 
                isGloballyExpanded={isGloballyExpanded}
            />
          </ul>
        )}
      </div>
      <style>{`
        /* Always use network UL padding */
        .mindmap-ul.pl-network-ul { padding-left: 2rem; /* pl-8 for network, more base indent for UL */ }

        .mindmap-ul::before, .mindmap-li::before {
          content: "";
          position: absolute;
          background-color: #cbd5e1; /* slate-300 */
          z-index: 0; 
        }
        .dark .mindmap-ul::before, .dark .mindmap-li::before {
          background-color: #475569; /* slate-600 */
        }

        .mindmap-ul::before { /* Vertical line for UL */
          left: 0.25rem; 
          top: -0.75rem; /* Adjusted for larger py-1.5 node height */
          bottom: 0.75rem; /* Adjusted for larger py-1.5 node height */
          width: 2px;
        }
        
        /* Adjust top for network view (pill py-1.5 -> h-~2rem. text-sm line-height ~1.25rem. Center ~1rem)*/
        .pl-network-ul > .mindmap-li::before { 
          top: 1rem; 
          height: 2px;
        }

        /* Width for network view's horizontal connector */
        .pl-network-ul > .mindmap-li::before {
           width: 1.6rem; /* To connect across most of the 2rem ul padding-left, starting from 0.25rem */
        }
        
        .mindmap-li > div { 
            position: relative;
            z-index: 1; /* Ensure node content is above lines */
            display: inline-flex; /* Helps withpill shape and centering */
            min-width: 70px; /* Minimum width for nodes, increased slightly */
            justify-content: flex-start; /* Align content to start for better readability */
            align-items: center;
        }

        .mindmap-root-ul > .mindmap-li::before, 
        .mindmap-root-ul > .mindmap-li::after {
            display: none; 
        }
        .mindmap-root-ul::before {
            display: none;
        }
        .text-2xs {
          font-size: 0.625rem; /* 10px */
          line-height: 0.875rem; /* 14px */
        }
      `}</style>
    </div>
  );
};

export default MindMapPage;
