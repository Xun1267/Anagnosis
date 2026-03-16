/**
 * 基于 localStorage 的笔记存储服务
 */

import {
  AIAnalysisType,
  CreateNoteParams,
  INoteStorage,
  Note,
  NoteError,
  NoteErrorType,
  NoteQueryParams,
  NoteQueryResult,
  NoteStorageStats,
  TextPosition,
  UpdateNoteParams,
} from '../../types/notes';

const STORAGE_KEY = 'lexicon_notes';
const CURRENT_VERSION = '1.0.0';

export class NoteStorageService implements INoteStorage {
  private notes: Map<string, Note> = new Map();
  private isInitialized = false;
  private readonly storageKey: string;
  private readonly versionKey: string;

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey;
    this.versionKey = `${storageKey}_version`;
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.loadFromStorage();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize note storage:', error);
      this.notes = new Map();
      this.isInitialized = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async loadFromStorage(): Promise<void> {
    const version = localStorage.getItem(this.versionKey);
    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      this.notes = new Map();
      await this.saveToStorage();
      return;
    }

    const notesArray: Note[] = JSON.parse(data);
    this.notes = new Map();

    notesArray.forEach((note) => {
      const processedNote: Note = {
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      };
      this.notes.set(processedNote.id, processedNote);
    });

    if (version !== CURRENT_VERSION) {
      await this.saveToStorage();
    }
  }

  private async saveToStorage(): Promise<void> {
    const notesArray = Array.from(this.notes.values());
    localStorage.setItem(this.storageKey, JSON.stringify(notesArray));
    localStorage.setItem(this.versionKey, CURRENT_VERSION);
  }

  private generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private createError(type: NoteErrorType, message: string, details?: unknown): NoteError {
    return {
      type,
      message,
      details,
      timestamp: new Date(),
    };
  }

  async create(params: CreateNoteParams): Promise<Note> {
    await this.ensureInitialized();

    const now = new Date();
    const note: Note = {
      id: this.generateId(),
      content: params.content,
      analysisType: params.analysisType,
      position: params.position,
      selectedText: params.position.selectedText,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      ...(params.title ? { title: params.title } : { title: `${params.position.selectedText.slice(0, 20)}...` }),
      tags: params.tags || [],
      userNote: params.userNote || '',
    };

    this.notes.set(note.id, note);
    await this.saveToStorage();
    return note;
  }

  async getById(id: string): Promise<Note | null> {
    await this.ensureInitialized();
    const note = this.notes.get(id);
    return note && !note.isDeleted ? note : null;
  }

  async query(params: NoteQueryParams = {}): Promise<NoteQueryResult> {
    await this.ensureInitialized();

    let filteredNotes = Array.from(this.notes.values());

    if (!params.includeDeleted) {
      filteredNotes = filteredNotes.filter((note) => !note.isDeleted);
    }

    if (params.analysisType) {
      filteredNotes = filteredNotes.filter((note) => note.analysisType === params.analysisType);
    }

    if (params.tags?.length) {
      filteredNotes = filteredNotes.filter((note) => params.tags!.some((tag) => note.tags?.includes(tag)));
    }

    if (params.dateRange) {
      const { start, end } = params.dateRange;
      filteredNotes = filteredNotes.filter((note) => note.createdAt >= start && note.createdAt <= end);
    }

    if (params.searchText) {
      const query = params.searchText.toLowerCase();
      filteredNotes = filteredNotes.filter((note) =>
        note.content.toLowerCase().includes(query) ||
        note.title?.toLowerCase().includes(query) ||
        note.userNote?.toLowerCase().includes(query) ||
        note.selectedText.toLowerCase().includes(query)
      );
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    filteredNotes.sort((a, b) => {
      const aValue =
        sortBy === 'title'
          ? a.title || ''
          : sortBy === 'updatedAt'
            ? a.updatedAt.getTime()
            : a.createdAt.getTime();
      const bValue =
        sortBy === 'title'
          ? b.title || ''
          : sortBy === 'updatedAt'
            ? b.updatedAt.getTime()
            : b.createdAt.getTime();

      if (aValue === bValue) {
        return 0;
      }

      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    const total = filteredNotes.length;
    const page = params.pagination?.page || 1;
    const pageSize = params.pagination?.pageSize || total || 1;
    const startIndex = (page - 1) * pageSize;
    const notes = filteredNotes.slice(startIndex, startIndex + pageSize);

    return {
      notes,
      total,
      page,
      pageSize,
      hasNext: startIndex + pageSize < total,
    };
  }

  async update(id: string, params: UpdateNoteParams): Promise<Note> {
    await this.ensureInitialized();

    const existing = this.notes.get(id);
    if (!existing || existing.isDeleted) {
      throw this.createError(NoteErrorType.NOT_FOUND_ERROR, 'Note not found or deleted');
    }

    const updated: Note = {
      ...existing,
      content: params.content !== undefined ? params.content : existing.content,
      analysisType: params.analysisType !== undefined ? params.analysisType : existing.analysisType,
      position: params.position !== undefined ? params.position : existing.position,
      selectedText: params.position?.selectedText ?? existing.selectedText,
      updatedAt: new Date(),
      ...(params.title !== undefined ? { title: params.title } : {}),
      ...(params.tags !== undefined ? { tags: params.tags } : {}),
      ...(params.userNote !== undefined ? { userNote: params.userNote } : {}),
    };

    this.notes.set(id, updated);
    await this.saveToStorage();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const note = this.notes.get(id);
    if (!note) {
      return false;
    }

    this.notes.set(id, {
      ...note,
      isDeleted: true,
      updatedAt: new Date(),
    });
    await this.saveToStorage();
    return true;
  }

  async permanentDelete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const success = this.notes.delete(id);
    if (success) {
      await this.saveToStorage();
    }
    return success;
  }

  async restore(id: string): Promise<Note> {
    await this.ensureInitialized();
    const note = this.notes.get(id);
    if (!note) {
      throw this.createError(NoteErrorType.NOT_FOUND_ERROR, 'Note not found');
    }

    const restored: Note = {
      ...note,
      isDeleted: false,
      updatedAt: new Date(),
    };
    this.notes.set(id, restored);
    await this.saveToStorage();
    return restored;
  }

  async getByPosition(position: TextPosition): Promise<Note[]> {
    await this.ensureInitialized();
    return Array.from(this.notes.values()).filter((note) => {
      if (note.isDeleted) {
        return false;
      }
      if (note.position.containerSelector !== position.containerSelector) {
        return false;
      }
      return !(note.position.endOffset <= position.startOffset || position.endOffset <= note.position.startOffset);
    });
  }

  async export(): Promise<Note[]> {
    await this.ensureInitialized();
    return Array.from(this.notes.values()).filter((note) => !note.isDeleted);
  }

  async import(notes: Note[]): Promise<boolean> {
    await this.ensureInitialized();

    notes.forEach((note) => {
      if (!this.notes.has(note.id)) {
        this.notes.set(note.id, {
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        });
      }
    });

    await this.saveToStorage();
    return true;
  }

  async clear(): Promise<boolean> {
    await this.ensureInitialized();
    this.notes.clear();
    await this.saveToStorage();
    return true;
  }

  async getStats(): Promise<NoteStorageStats> {
    await this.ensureInitialized();

    const allNotes = Array.from(this.notes.values());
    const activeNotes = allNotes.filter((note) => !note.isDeleted);
    const deletedNotes = allNotes.filter((note) => note.isDeleted);
    const byAnalysisType: Record<AIAnalysisType, number> = {
      [AIAnalysisType.VOCABULARY]: 0,
      [AIAnalysisType.GRAMMAR]: 0,
      [AIAnalysisType.CULTURAL]: 0,
      [AIAnalysisType.SEMANTIC]: 0,
    };

    activeNotes.forEach((note) => {
      byAnalysisType[note.analysisType] += 1;
    });

    const storageData = localStorage.getItem(this.storageKey) || '';

    return {
      totalNotes: allNotes.length,
      activeNotes: activeNotes.length,
      deletedNotes: deletedNotes.length,
      storageSize: new Blob([storageData]).size,
      byAnalysisType,
    };
  }
}

export const noteStorage = new NoteStorageService();
