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
  readingRecordSource?: ReadingRecordSourceInfo | null; // Optional: Link to a reading record
  createdAt: number; // timestamp
  reviewStage: number; // Corresponds to EbbinghausStage enum values
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
  reviewStage: number; // Corresponds to EbbinghausStage enum values
  lastReviewedAt: number; // timestamp
}

export enum EbbinghausStage {
  LEARNED = 0,        // Just learned or reset (e.g., after "Forgotten")
  REVIEW_AFTER_1_DAY = 1,   // Review after 1 day (from lastReviewedAt)
  REVIEW_AFTER_2_DAYS = 2,  // Review after 2 days (from lastReviewedAt)
  REVIEW_AFTER_4_DAYS = 3,  // Review after 4 days (from lastReviewedAt)
  REVIEW_AFTER_8_DAYS = 4,  // Review after 8 days (from lastReviewedAt)
  REVIEW_AFTER_15_DAYS = 5, // Review after 15 days (from lastReviewedAt)
  MASTERED = 6,      // Mastered (e.g., after 30 days from lastReviewedAt)
}

// EBBINGHAUS_REVIEW_OFFSETS_DAYS maps the current EbbinghausStage to the NEXT review interval in days,
// calculated from 'lastReviewedAt'.
// For example:
// - If an item is at LEARNED (0), its next review is due 1 day after 'lastReviewedAt'.
//   Upon successful review, it moves to REVIEW_AFTER_1_DAY (1), and 'lastReviewedAt' is updated.
// - If at REVIEW_AFTER_1_DAY (1), next review is due 2 days after the new 'lastReviewedAt'.
export const EBBINGHAUS_REVIEW_OFFSETS_DAYS: Record<EbbinghausStage, number | null> = {
  [EbbinghausStage.LEARNED]: 1,
  [EbbinghausStage.REVIEW_AFTER_1_DAY]: 2,
  [EbbinghausStage.REVIEW_AFTER_2_DAYS]: 4,
  [EbbinghausStage.REVIEW_AFTER_4_DAYS]: 8,
  [EbbinghausStage.REVIEW_AFTER_8_DAYS]: 15,
  [EbbinghausStage.REVIEW_AFTER_15_DAYS]: 30, // After this review, item is considered MASTERED.
  [EbbinghausStage.MASTERED]: null, // Mastered, no further scheduled review.
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