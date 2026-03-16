/**
 * 笔记功能相关类型定义
 */

export enum AIAnalysisType {
  VOCABULARY = 'vocabulary',
  GRAMMAR = 'grammar',
  CULTURAL = 'cultural',
  SEMANTIC = 'semantic',
}

export interface TextPosition {
  startOffset: number;
  endOffset: number;
  selectedText: string;
  containerSelector?: string | undefined;
  paragraphIndex?: number | undefined;
  lineNumber?: number | undefined;
}

export interface Note {
  id: string;
  title?: string | undefined;
  content: string;
  analysisType: AIAnalysisType;
  position: TextPosition;
  selectedText: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean | undefined;
  tags?: string[] | undefined;
  userNote?: string | undefined;
}

export interface CreateNoteParams {
  content: string;
  analysisType: AIAnalysisType;
  position: TextPosition;
  title?: string | undefined;
  tags?: string[] | undefined;
  userNote?: string | undefined;
}

export interface UpdateNoteParams {
  title?: string | undefined;
  content?: string | undefined;
  analysisType?: AIAnalysisType | undefined;
  position?: TextPosition | undefined;
  tags?: string[] | undefined;
  userNote?: string | undefined;
}

export interface NoteQueryParams {
  analysisType?: AIAnalysisType;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
  includeDeleted?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export type QueryNotesParams = NoteQueryParams;

export interface NoteQueryResult {
  notes: Note[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface NoteStorageStats {
  totalNotes: number;
  activeNotes: number;
  deletedNotes: number;
  storageSize: number;
  byAnalysisType: Record<AIAnalysisType, number>;
}

export interface INoteStorage {
  create(params: CreateNoteParams): Promise<Note>;
  getById(id: string): Promise<Note | null>;
  query(params?: NoteQueryParams): Promise<NoteQueryResult>;
  update(id: string, params: UpdateNoteParams): Promise<Note>;
  delete(id: string): Promise<boolean>;
  permanentDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<Note>;
  getByPosition(position: TextPosition): Promise<Note[]>;
  export(): Promise<Note[]>;
  import(notes: Note[]): Promise<boolean>;
  clear(): Promise<boolean>;
  getStats(): Promise<NoteStorageStats>;
}

export interface ITextPositionUtils {
  calculatePosition(selection: Selection): TextPosition | null;
  validatePosition(position: TextPosition): boolean;
  restoreSelection(position: TextPosition): boolean;
  isOverlapping(pos1: TextPosition, pos2: TextPosition): boolean;
  mergePositions(positions: TextPosition[]): TextPosition[];
  getTextInRange(position: TextPosition): string | null;
}

export interface NoteStyleConfig {
  className: string;
  underlineStyle: 'solid' | 'dashed' | 'dotted' | 'double' | 'wavy';
  color: string;
  backgroundColor: string;
  borderColor: string;
}

export interface NoteHighlightProps {
  note: Note;
  isActive?: boolean;
  isSelected?: boolean;
  onClick?: ((note: Note, event: React.MouseEvent) => void) | undefined;
  onDoubleClick?: ((note: Note, event: React.MouseEvent) => void) | undefined;
  onContextMenu?: ((note: Note, event: React.MouseEvent) => void) | undefined;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface NoteSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  activeNoteId?: string | null;
  onNoteSelect?: ((note: Note) => void) | undefined;
  onNoteUpdate?: ((note: Note) => void) | undefined;
  onNoteDelete?: ((noteId: string) => void) | undefined;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
}

export interface NoteManagerStats {
  total: number;
  byType: Record<AIAnalysisType, number>;
  deleted: number;
}

export interface UseNotesReturn {
  notes: Note[];
  activeNoteId: string | null;
  loading: boolean;
  error: NoteError | null;
  statistics: NoteManagerStats;
  createNote: (params: CreateNoteParams) => Promise<Note | null>;
  updateNote: (noteId: string, params: UpdateNoteParams) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  getNote: (noteId: string) => Promise<Note | null>;
  getNotesAtPosition: (position: TextPosition) => Promise<Note[]>;
  createNoteFromSelection: (analysisType: AIAnalysisType, content: string, title?: string) => Promise<Note | null>;
  setActiveNote: (noteId: string | null) => void;
  refreshNotes: (params?: NoteQueryParams) => Promise<void>;
  clearError: () => void;
  restoreAllHighlights: () => Promise<void>;
  clearAllHighlights: () => void;
  exportNotes: () => Promise<string | null>;
  importNotes: (data: string) => Promise<boolean>;
}

export interface NoteManagerConfig {
  storage?: INoteStorage;
  positionUtils?: ITextPositionUtils;
  autoSave?: boolean;
  autoSaveInterval?: number;
  maxNotesLimit?: number;
  enableHighlight?: boolean;
  maxNotesPerPosition?: number;
  storageKey?: string;
}

export enum NoteErrorType {
  STORAGE_ERROR = 'storage_error',
  POSITION_ERROR = 'position_error',
  STYLE_ERROR = 'style_error',
  VALIDATION_ERROR = 'validation_error',
  NOT_FOUND_ERROR = 'not_found_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

export interface NoteError {
  type: NoteErrorType;
  message: string;
  details?: unknown;
  timestamp: Date;
}
