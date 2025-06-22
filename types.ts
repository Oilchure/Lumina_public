export interface WordDefinition {
  partOfSpeech: string; // Will store Chinese POS name
  definition: string;
  example?: string;
}

export interface ReadingRecordSourceInfo {
  readingRecordCategoryId: string; // ID of 'cat-reading-log-paper', 'cat-reading-log-reference', etc.
  referenceName: string; // e.g., Literature name, book title, article title
}

export interface Word {
  id: string;
  text: string;
  definitions: WordDefinition[];
  notes: string;
  // sourceType: 'api' | 'manual'; // Removed: How the definition was obtained
  readingRecordSource?: ReadingRecordSourceInfo | null; // Optional: Link to a reading record
  createdAt: number; // timestamp
  reviewStage: number; // 0-6, corresponding to Ebbinghaus stages (0-5 for review, 6 for mastered)
  lastReviewedAt: number; // timestamp
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export interface KnowledgePoint {
  id:string;
  title: string;
  content: string;
  notes: string;
  categoryId: string | null; // ID of the category it belongs to
  createdAt: number; // timestamp
  source?: string; // Optional source field (e.g. literature name, book title)
}

export enum EbbinghausStage {
  LEARNED = 0, // D0
  REVIEW_1_DAY = 1, // D1
  REVIEW_2_DAYS = 2, // D2
  REVIEW_7_DAYS = 3, // D7
  REVIEW_30_DAYS = 4, // D30
  REVIEW_165_DAYS = 5, // D165
  MASTERED = 6, // Beyond final review
}

export const EBBINGHAUS_REVIEW_OFFSETS_DAYS: Record<EbbinghausStage, number | null> = {
  [EbbinghausStage.LEARNED]: 0, 
  [EbbinghausStage.REVIEW_1_DAY]: 1,
  [EbbinghausStage.REVIEW_2_DAYS]: 2,
  [EbbinghausStage.REVIEW_7_DAYS]: 7,
  [EbbinghausStage.REVIEW_30_DAYS]: 30,
  [EbbinghausStage.REVIEW_165_DAYS]: 165,
  [EbbinghausStage.MASTERED]: null, // No next review
};


export type DictionaryAPIResponse = Array<{
  word: string;
  phonetic?: string;
  phonetics: Array<{ text?: string; audio?: string }>;
  meanings: Array<{
    partOfSpeech: string; // English POS from API
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }>;
  }>;
  sourceUrls?: string[];
}>;

export enum TaskQuadrant {
  URGENT_IMPORTANT = 'urgent-important', // 紧急且重要
  IMPORTANT_NOT_URGENT = 'important-not-urgent', // 重要但不紧急
  URGENT_NOT_IMPORTANT = 'urgent-not-important', // 紧急但不重要
  NOT_IMPORTANT_NOT_URGENT = 'not-important-not-urgent', // 不重要也不紧急
}

export interface Task {
  id: string;
  text: string;
  quadrant: TaskQuadrant;
  isCompleted: boolean;
  createdAt: number; // Timestamp for the date the task is for
  isCarriedOver?: boolean; // If true, was carried from previous day
  isLongTerm?: boolean; // If true, not subject to daily clear
  completedAt?: number; // Timestamp of completion
}

// Data structure for export/import
export interface ExportData {
  words: Word[];
  knowledgePoints: KnowledgePoint[];
  categories: Category[];
  tasks: Task[];
}

export const CHINESE_POS_TERMS = [
  '名词', '动词', '形容词', '副词', '代词', 
  '介词', '连词', '感叹词', '数词', '冠词', '其他'
] as const;

export type PartOfSpeechCh = typeof CHINESE_POS_TERMS[number];