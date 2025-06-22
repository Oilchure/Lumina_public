import { Category, TaskQuadrant, PartOfSpeechCh } from './types';

export const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
export const API_TIMEOUT_MS = 4000;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-lit-eng', name: '文献英语', parentId: null },
  { id: 'cat-lit-eng-noun', name: '名词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-verb', name: '动词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-adj', name: '形容词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-adv', name: '副词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-pronoun', name: '代词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-prep', name: '介词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-conj', name: '连词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-interj', name: '感叹词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-num', name: '数词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-art', name: '冠词', parentId: 'cat-lit-eng' },
  { id: 'cat-lit-eng-other', name: '其他词性', parentId: 'cat-lit-eng' },
  
  { id: 'cat-lit-idea', name: '文献思路', parentId: null },
  { id: 'cat-lit-idea-research', name: '研究方法', parentId: 'cat-lit-idea' },
  { id: 'cat-lit-idea-writing', name: '写作方法', parentId: 'cat-lit-idea' },

  { id: 'cat-reading-log', name: '阅读记录', parentId: null },
  { id: 'cat-reading-log-paper', name: '文献', parentId: 'cat-reading-log' },
  { id: 'cat-reading-log-reference', name: '工具书', parentId: 'cat-reading-log' },
  { id: 'cat-reading-log-novel', name: '小说', parentId: 'cat-reading-log' },
  { id: 'cat-reading-log-pro', name: '专业书', parentId: 'cat-reading-log' },

  { id: 'cat-daily-thoughts', name: '每日感悟', parentId: null },
];

export const MAX_DEFINITIONS_TO_SAVE = 3;
export const MAX_EXAMPLES_PER_DEFINITION = 1;

export const TASK_QUADRANT_LABELS: Record<TaskQuadrant, string> = {
  [TaskQuadrant.URGENT_IMPORTANT]: '紧急且重要',
  [TaskQuadrant.IMPORTANT_NOT_URGENT]: '重要但不紧急',
  [TaskQuadrant.URGENT_NOT_IMPORTANT]: '紧急但不重要',
  [TaskQuadrant.NOT_IMPORTANT_NOT_URGENT]: '不重要也不紧急',
};

export const TASK_QUADRANT_COLORS: Record<TaskQuadrant, string> = {
  [TaskQuadrant.URGENT_IMPORTANT]: 'bg-red-500 dark:bg-red-700',
  [TaskQuadrant.IMPORTANT_NOT_URGENT]: 'bg-blue-500 dark:bg-blue-700',
  [TaskQuadrant.URGENT_NOT_IMPORTANT]: 'bg-yellow-500 dark:bg-yellow-600',
  [TaskQuadrant.NOT_IMPORTANT_NOT_URGENT]: 'bg-gray-500 dark:bg-gray-600',
};

// Maps English POS from API to Chinese terms
export const API_POS_TO_CHINESE_MAP: Record<string, PartOfSpeechCh> = {
  'noun': '名词',
  'verb': '动词',
  'adjective': '形容词',
  'adverb': '副词',
  'pronoun': '代词',
  'preposition': '介词',
  'conjunction': '连词',
  'interjection': '感叹词',
  'numeral': '数词',
  'article': '冠词',
  // Add more mappings as needed from dictionary API responses
};

// Maps Chinese POS names to their specific category IDs under "文献英语"
export const CHINESE_POS_TO_CATEGORY_ID_MAP: Record<PartOfSpeechCh, string> = {
  '名词': 'cat-lit-eng-noun',
  '动词': 'cat-lit-eng-verb',
  '形容词': 'cat-lit-eng-adj',
  '副词': 'cat-lit-eng-adv',
  '代词': 'cat-lit-eng-pronoun',
  '介词': 'cat-lit-eng-prep',
  '连词': 'cat-lit-eng-conj',
  '感叹词': 'cat-lit-eng-interj',
  '数词': 'cat-lit-eng-num',
  '冠词': 'cat-lit-eng-art',
  '其他': 'cat-lit-eng-other',
};

export const DAILY_THOUGHTS_CATEGORY_ID = 'cat-daily-thoughts';
export const LITERATURE_ENGLISH_CATEGORY_ID = 'cat-lit-eng';

export const READING_RECORDS_CATEGORY_ID = 'cat-reading-log';
export const READING_RECORD_LITERATURE_ID = 'cat-reading-log-paper';
export const READING_RECORD_REFERENCE_ID = 'cat-reading-log-reference';
export const READING_RECORD_NOVEL_ID = 'cat-reading-log-novel';
export const READING_RECORD_PRO_BOOK_ID = 'cat-reading-log-pro';

export const READING_RECORD_CHILD_CATEGORIES = [
    { id: READING_RECORD_LITERATURE_ID, name: '文献' },
    { id: READING_RECORD_REFERENCE_ID, name: '工具书' },
    { id: READING_RECORD_NOVEL_ID, name: '小说' },
    { id: READING_RECORD_PRO_BOOK_ID, name: '专业书' },
];