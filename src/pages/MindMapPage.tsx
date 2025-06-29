import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext.tsx';
import { Category, KnowledgePoint, Word } from '../types.ts';
import { BookOpenIcon, DocumentTextIcon, SquaresFourIcon, FolderPlusIcon } from '../components/icons.tsx';

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
  return `${depth * 1.5}rem`; 
};

const MindMapNodeDisplay: React.FC<MindMapNodeDisplayProps> = ({ node, isGloballyExpanded }) => {
  const NodeIcon = 
    node.type === 'knowledgePoint' ? DocumentTextIcon :
    node.type === 'word' ? BookOpenIcon :
    node.type === 'literatureGroup' ? FolderPlusIcon :
    node.type === 'category' && node.id === 'cat-reading-log' ? SquaresFourIcon :
    node.type === 'category' ? FolderPlusIcon :
    null;

  const hasChildren = node.children && node.children.length > 0;

  const getBaseNodeClasses = (type: MindMapNodeData['type'], depth: number, nodeId: string) => {
    let classes = "flex items-center my-0.5 border-l-4 transition-colors ";
    classes += "px-3 py-1.5 rounded-full text-sm "; 
    if (type === 'category' && depth === 0) classes += 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border-slate-400 dark:border-slate-500 font-semibold text-base ';
    else if (type === 'literatureGroup') classes += 'bg-sky-100 dark:bg-sky-800 hover:bg-sky-200 dark:hover:bg-sky-700 border-sky-400 dark:border-sky-600 ';
    else if (type === 'category') classes += 'bg-indigo-100 dark:bg-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-700 border-indigo-400 dark:border-indigo-600 ';
    else if (type === 'knowledgePoint') classes += 'bg-teal-50 dark:bg-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-800/60 border-teal-400 dark:border-teal-700 ';
    else if (type === 'word') classes += 'bg-orange-50 dark:bg-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-800/60 border-orange-400 dark:border-orange-700 ';
    else classes += 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-400 dark:border-slate-600 ';
    return classes;
  };
  
  const nodeMargin = calculateNodeMargin(node.depth);

  return (
    <li className={`mindmap-li relative list-none`}>
      <div 
        className={getBaseNodeClasses(node.type, node.depth, node.id)}
        style={{ marginLeft: nodeMargin }}
      >
        {NodeIcon && <NodeIcon className={"w-4 h-4 mr-2 flex-shrink-0 text-slate-600 dark:text-slate-300"} />}
        <span className={`font-medium text-slate-800 dark:text-slate-100 truncate`} title={node.name}>
          {node.name}
        </span>
        {node.data && 'createdAt' in node.data && (
            <span className={`ml-auto pl-2 flex-shrink-0 text-2xs text-slate-500 dark:text-slate-400`}>
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
  const [isGloballyExpanded, setIsGloballyExpanded] = useState(true);

  const treeData = useMemo(() => {
    const buildTreeRecursive = (category: Category, currentDepth: number): MindMapNodeData => {
      let children: MindMapNodeData[] = [];

      const subCategories = categories
        .filter(c => c.parentId === category.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(sc => buildTreeRecursive(sc, currentDepth + 1));

      const itemsWithSourceMap = new Map<string, { kps: KnowledgePoint[], words: Word[] }>();
      const itemsWithoutSourceKPs: KnowledgePoint[] = [];
      const itemsWithoutSourceWords: Word[] = [];

      knowledgePoints.filter(kp => kp.categoryId === category.id).forEach(kp => {
        if (kp.source && kp.source.trim()) {
          const source = kp.source.trim();
          if (!itemsWithSourceMap.has(source)) itemsWithSourceMap.set(source, { kps: [], words: [] });
          itemsWithSourceMap.get(source)!.kps.push(kp);
        } else {
          itemsWithoutSourceKPs.push(kp);
        }
      });
      
      words.filter(w => w.readingRecordSource?.readingRecordCategoryId === category.id).forEach(word => {
        if (word.readingRecordSource.referenceName && word.readingRecordSource.referenceName.trim()) {
          const source = word.readingRecordSource.referenceName.trim();
          if (!itemsWithSourceMap.has(source)) itemsWithSourceMap.set(source, { kps: [], words: [] });
          itemsWithSourceMap.get(source)!.words.push(word);
        } else {
          itemsWithoutSourceWords.push(word);
        }
      });
      
      const literatureGroupNodes: MindMapNodeData[] = Array.from(itemsWithSourceMap.entries())
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .map(([sourceName, items]) => {
          const litKps = items.kps.map(kp => ({
            id: `kp-${kp.id}`, name: kp.title, type: 'knowledgePoint' as const, data: kp, depth: currentDepth + 2,
          }));
          const litWords = items.words.map(word => ({
            id: `word-${word.id}`, name: word.text, type: 'word' as const, data: word, depth: currentDepth + 2,
          }));
          return {
            id: `litgroup-${category.id}-${sourceName.replace(/\s+/g, '-')}`,
            name: sourceName,
            type: 'literatureGroup' as const,
            depth: currentDepth + 1,
            children: [...litKps, ...litWords].sort((a,b) => (a.data?.createdAt || 0) - (b.data?.createdAt || 0)),
          };
        });

      const directItemNodes: MindMapNodeData[] = [
        ...itemsWithoutSourceKPs.map(kp => ({
            id: `kp-${kp.id}`, name: kp.title, type: 'knowledgePoint' as const, data: kp, depth: currentDepth + 1,
        })),
        ...itemsWithoutSourceWords.map(word => ({
            id: `word-${word.id}`, name: word.text, type: 'word' as const, data: word, depth: currentDepth + 1,
        }))
      ];
      
      children = [...subCategories, ...literatureGroupNodes, ...directItemNodes];

      children.sort((a, b) => {
        const typeOrder: Record<string, number> = { category: 0, literatureGroup: 1, knowledgePoint: 2, word: 3 };
        const aTypeOrder = typeOrder[a.type] ?? 99;
        const bTypeOrder = typeOrder[b.type] ?? 99;
        if (aTypeOrder !== bTypeOrder) {
          return aTypeOrder - bTypeOrder;
        }
        if (a.data?.createdAt && b.data?.createdAt) {
            return a.data.createdAt - b.data.createdAt;
        }
        return a.name.localeCompare(b.name);
      });

      return { id: category.id, name: category.name, type: 'category', depth: currentDepth, children: children.length > 0 ? children : undefined };
    };

    return categories
      .filter(c => c.parentId === null)
      .sort((a,b) => a.name.localeCompare(b.name))
      .map(cat => buildTreeRecursive(cat, 0));
  }, [categories, knowledgePoints, words]);

  const toggleGlobalExpansion = () => {
    setIsGloballyExpanded(prev => !prev);
  };
  
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
        {treeData.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 p-4">没有可显示的分类。请在“大纲”页面添加分类开始。</p>
        ) : (
          <ul className="mindmap-root-ul list-none p-0">
            {treeData.map(rootNode => (
              <MindMapNodeDisplay 
                  key={rootNode.id}
                  node={rootNode} 
                  isGloballyExpanded={isGloballyExpanded}
              />
            ))}
          </ul>
        )}
      </div>
      <style>{`
        .mindmap-ul.pl-network-ul { padding-left: 2rem; }
        .mindmap-ul::before, .mindmap-li::before {
          content: "";
          position: absolute;
          background-color: #cbd5e1; /* slate-300 */
          z-index: 0; 
        }
        .dark .mindmap-ul::before, .dark .mindmap-li::before {
          background-color: #475569; /* slate-600 */
        }
        .mindmap-ul::before {
          left: 0.25rem; 
          top: -0.75rem;
          bottom: 0.75rem;
          width: 2px;
        }
        .pl-network-ul > .mindmap-li::before { 
          top: 1rem; 
          height: 2px;
        }
        .pl-network-ul > .mindmap-li::before {
           width: 1.6rem;
        }
        .mindmap-li > div { 
            position: relative;
            z-index: 1;
            display: inline-flex;
            min-width: 70px;
            justify-content: flex-start;
            align-items: center;
        }
        .mindmap-root-ul > li > .mindmap-ul::before {
           display: none;
        }
        .mindmap-root-ul > .mindmap-li::before, 
        .mindmap-root-ul > .mindmap-li::after {
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