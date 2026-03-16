/**
 * 笔记管理服务
 */

import {
  AIAnalysisType,
  CreateNoteParams,
  INoteStorage,
  Note,
  NoteError,
  NoteErrorType,
  NoteManagerConfig,
  NoteManagerStats,
  QueryNotesParams,
  TextPosition,
  UpdateNoteParams,
} from '../../types/notes';
import { NoteStorageService } from './note-storage';
import { textPositionUtils } from '../utils/text-position';
import { noteStyleUtils } from '../utils/note-styles';

const DEFAULT_CONFIG: Required<Pick<NoteManagerConfig, 'autoSave' | 'autoSaveInterval' | 'enableHighlight' | 'maxNotesPerPosition' | 'storageKey'>> = {
  autoSave: true,
  autoSaveInterval: 1000,
  enableHighlight: true,
  maxNotesPerPosition: 5,
  storageKey: 'lexicon_notes',
};

type NoteManagerEventMap = {
  noteCreated: Note;
  noteUpdated: Note;
  noteDeleted: string;
  highlightClicked: string;
  activeNoteChanged: string | null;
  notesImported: undefined;
};

export class NoteManager {
  private static instance: NoteManager;
  private readonly storage: INoteStorage;
  private readonly config: NoteManagerConfig;
  private activeNoteId: string | null = null;
  private readonly highlightClickHandlers = new Map<string, (noteId: string) => void>();
  private readonly eventListeners = new Map<
    keyof NoteManagerEventMap,
    Set<(payload: NoteManagerEventMap[keyof NoteManagerEventMap]) => void>
  >();

  constructor(config: Partial<NoteManagerConfig> = {}) {
    const mergedConfig: NoteManagerConfig = { ...DEFAULT_CONFIG, ...config };
    this.config = mergedConfig;
    this.storage = mergedConfig.storage ?? new NoteStorageService(mergedConfig.storageKey);

    if (mergedConfig.enableHighlight) {
      noteStyleUtils.initializeStyles();
    }
  }

  static getInstance(config?: Partial<NoteManagerConfig>): NoteManager {
    if (!NoteManager.instance) {
      NoteManager.instance = new NoteManager(config);
    }
    return NoteManager.instance;
  }

  private createError(type: NoteErrorType, message: string, details?: unknown): NoteError {
    return {
      type,
      message,
      details,
      timestamp: new Date(),
    };
  }

  private emit<K extends keyof NoteManagerEventMap>(event: K, payload: NoteManagerEventMap[K]): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in ${String(event)} listener:`, error);
      }
    });
  }

  on<K extends keyof NoteManagerEventMap>(event: K, listener: (payload: NoteManagerEventMap[K]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as (payload: NoteManagerEventMap[keyof NoteManagerEventMap]) => void);
  }

  off<K extends keyof NoteManagerEventMap>(event: K, listener: (payload: NoteManagerEventMap[K]) => void): void {
    this.eventListeners.get(event)?.delete(listener as (payload: NoteManagerEventMap[keyof NoteManagerEventMap]) => void);
  }

  async createNote(params: CreateNoteParams): Promise<Note> {
    if (!textPositionUtils.validatePosition(params.position)) {
      throw this.createError(NoteErrorType.VALIDATION_ERROR, 'Invalid text position for note creation');
    }

    const existingNotes = await this.getNotesAtPosition(params.position);
    if (existingNotes.length >= (this.config.maxNotesPerPosition ?? DEFAULT_CONFIG.maxNotesPerPosition)) {
      throw this.createError(NoteErrorType.VALIDATION_ERROR, 'Too many notes attached to this location');
    }

    const note = await this.storage.create(params);
    if (this.config.enableHighlight) {
      this.applyHighlight(note);
    }

    this.emit('noteCreated', note);
    return note;
  }

  async updateNote(noteId: string, params: UpdateNoteParams): Promise<Note> {
    const existingNote = await this.storage.getById(noteId);
    if (!existingNote) {
      throw this.createError(NoteErrorType.NOT_FOUND_ERROR, `Note not found: ${noteId}`);
    }

    if (params.position && !textPositionUtils.validatePosition(params.position)) {
      throw this.createError(NoteErrorType.VALIDATION_ERROR, 'Invalid text position for note update');
    }

    const updatedNote = await this.storage.update(noteId, params);

    if (this.config.enableHighlight) {
      this.removeHighlight(noteId);
      this.applyHighlight(updatedNote);
    }

    this.emit('noteUpdated', updatedNote);
    return updatedNote;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    const success = await this.storage.delete(noteId);
    if (!success) {
      return false;
    }

    if (this.config.enableHighlight) {
      this.removeHighlight(noteId);
    }

    if (this.activeNoteId === noteId) {
      this.activeNoteId = null;
      this.emit('activeNoteChanged', null);
    }

    this.highlightClickHandlers.delete(noteId);
    this.emit('noteDeleted', noteId);
    return true;
  }

  async getNote(noteId: string): Promise<Note | null> {
    return this.storage.getById(noteId);
  }

  async queryNotes(params: QueryNotesParams = {}): Promise<Note[]> {
    const result = await this.storage.query(params);
    return result.notes;
  }

  async getNotesAtPosition(position: TextPosition): Promise<Note[]> {
    return this.storage.getByPosition(position);
  }

  async createNoteFromSelection(analysisType: AIAnalysisType, content: string, title?: string): Promise<Note | null> {
    const position = textPositionUtils.getCurrentSelection();
    if (!position) {
      throw this.createError(NoteErrorType.VALIDATION_ERROR, 'No text selection found');
    }

    return this.createNote({
      analysisType,
      content,
      position,
      ...(title ? { title } : {}),
    });
  }

  setActiveNote(noteId: string | null): void {
    if (this.activeNoteId) {
      noteStyleUtils.setHighlightActive(this.activeNoteId, false);
    }

    this.activeNoteId = noteId;

    if (noteId) {
      noteStyleUtils.setHighlightActive(noteId, true);
    }

    this.emit('activeNoteChanged', noteId);
  }

  getActiveNoteId(): string | null {
    return this.activeNoteId;
  }

  async restoreAllHighlights(): Promise<void> {
    if (!this.config.enableHighlight) {
      return;
    }

    noteStyleUtils.clearAllHighlights();
    this.highlightClickHandlers.clear();

    const notes = await this.queryNotes({ includeDeleted: false });
    notes.forEach((note) => this.applyHighlight(note));
  }

  clearAllHighlights(): void {
    noteStyleUtils.clearAllHighlights();
    this.highlightClickHandlers.clear();
    this.activeNoteId = null;
  }

  async getStatistics(): Promise<NoteManagerStats> {
    const stats = await this.storage.getStats();
    return {
      total: stats.activeNotes,
      byType: stats.byAnalysisType,
      deleted: stats.deletedNotes,
    };
  }

  async exportNotes(): Promise<string> {
    const notes = await this.storage.export();
    return JSON.stringify(notes, null, 2);
  }

  async importNotes(data: string): Promise<boolean> {
    const notes = JSON.parse(data) as Note[];
    const success = await this.storage.import(notes);
    if (success) {
      await this.restoreAllHighlights();
      this.emit('notesImported', undefined);
    }
    return success;
  }

  destroy(): void {
    this.clearAllHighlights();
    this.eventListeners.clear();
  }

  private applyHighlight(note: Note): void {
    if (!this.config.enableHighlight || !note.position.containerSelector) {
      return;
    }

    const clickHandler = (noteId: string) => {
      this.setActiveNote(noteId);
      this.emit('highlightClicked', noteId);
    };

    this.highlightClickHandlers.set(note.id, clickHandler);
    noteStyleUtils.applyHighlight(note.position, note.analysisType, note.id, clickHandler);
  }

  private removeHighlight(noteId: string): void {
    noteStyleUtils.removeHighlight(noteId);
  }
}

export const noteManager = NoteManager.getInstance();

export function initializeNoteManager(config?: Partial<NoteManagerConfig>): NoteManager {
  return NoteManager.getInstance(config);
}
