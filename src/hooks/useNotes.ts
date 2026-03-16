/**
 * 笔记管理 Hook
 */

import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import {
  AIAnalysisType,
  CreateNoteParams,
  Note,
  NoteError,
  NoteErrorType,
  NoteManagerStats,
  QueryNotesParams,
  TextPosition,
  UpdateNoteParams,
  UseNotesReturn,
} from '../types/notes';
import { noteManager } from '../lib/services/note-manager';

const EMPTY_STATS: NoteManagerStats = {
  total: 0,
  byType: {
    [AIAnalysisType.VOCABULARY]: 0,
    [AIAnalysisType.GRAMMAR]: 0,
    [AIAnalysisType.CULTURAL]: 0,
    [AIAnalysisType.SEMANTIC]: 0,
  },
  deleted: 0,
};

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NoteError | null>(null);
  const [statistics, setStatistics] = useState<NoteManagerStats>(EMPTY_STATS);

  const mountedRef = useRef(true);

  const safeSetNotes = useCallback((value: SetStateAction<Note[]>) => {
    if (mountedRef.current) {
      setNotes(value);
    }
  }, []);

  const safeSetActiveNoteId = useCallback((value: SetStateAction<string | null>) => {
    if (mountedRef.current) {
      setActiveNoteId(value);
    }
  }, []);

  const safeSetLoading = useCallback((value: boolean) => {
    if (mountedRef.current) {
      setLoading(value);
    }
  }, []);

  const safeSetError = useCallback((value: NoteError | null) => {
    if (mountedRef.current) {
      setError(value);
    }
  }, []);

  const safeSetStatistics = useCallback((value: NoteManagerStats) => {
    if (mountedRef.current) {
      setStatistics(value);
    }
  }, []);

  const createError = useCallback((type: NoteErrorType, message: string, details?: unknown): NoteError => ({
    type,
    message,
    details,
    timestamp: new Date(),
  }), []);

  const handleError = useCallback((err: unknown, context: string) => {
    console.error(`Error in ${context}:`, err);
    safeSetError(
      createError(
        NoteErrorType.UNKNOWN_ERROR,
        err instanceof Error ? `${context}: ${err.message}` : `${context}: 未知错误`,
        err
      )
    );
  }, [createError, safeSetError]);

  const clearError = useCallback(() => {
    safeSetError(null);
  }, [safeSetError]);

  const refreshStatistics = useCallback(async () => {
    try {
      const stats = await noteManager.getStatistics();
      safeSetStatistics(stats);
    } catch (err) {
      console.warn('Failed to refresh note statistics:', err);
    }
  }, [safeSetStatistics]);

  const refreshNotes = useCallback(async (params: QueryNotesParams = {}) => {
    try {
      safeSetLoading(true);
      clearError();
      const fetchedNotes = await noteManager.queryNotes(params);
      safeSetNotes(fetchedNotes);
    } catch (err) {
      handleError(err, 'refreshNotes');
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, safeSetLoading, safeSetNotes]);

  const createNote = useCallback(async (params: CreateNoteParams): Promise<Note | null> => {
    try {
      safeSetLoading(true);
      clearError();
      const note = await noteManager.createNote(params);
      safeSetNotes((prev) => (prev.some((item) => item.id === note.id) ? prev : [...prev, note]));
      await refreshStatistics();
      return note;
    } catch (err) {
      handleError(err, 'createNote');
      return null;
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, refreshStatistics, safeSetLoading, safeSetNotes]);

  const updateNote = useCallback(async (noteId: string, params: UpdateNoteParams): Promise<Note | null> => {
    try {
      safeSetLoading(true);
      clearError();
      const updatedNote = await noteManager.updateNote(noteId, params);
      safeSetNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)));
      await refreshStatistics();
      return updatedNote;
    } catch (err) {
      handleError(err, 'updateNote');
      return null;
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, refreshStatistics, safeSetLoading, safeSetNotes]);

  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    try {
      safeSetLoading(true);
      clearError();
      const success = await noteManager.deleteNote(noteId);
      if (success) {
        safeSetNotes((prev) => prev.filter((note) => note.id !== noteId));
        if (activeNoteId === noteId) {
          safeSetActiveNoteId(null);
        }
        await refreshStatistics();
      }
      return success;
    } catch (err) {
      handleError(err, 'deleteNote');
      return false;
    } finally {
      safeSetLoading(false);
    }
  }, [activeNoteId, clearError, handleError, refreshStatistics, safeSetActiveNoteId, safeSetLoading, safeSetNotes]);

  const getNote = useCallback(async (noteId: string): Promise<Note | null> => {
    try {
      clearError();
      return await noteManager.getNote(noteId);
    } catch (err) {
      handleError(err, 'getNote');
      return null;
    }
  }, [clearError, handleError]);

  const getNotesAtPosition = useCallback(async (position: TextPosition): Promise<Note[]> => {
    try {
      clearError();
      return await noteManager.getNotesAtPosition(position);
    } catch (err) {
      handleError(err, 'getNotesAtPosition');
      return [];
    }
  }, [clearError, handleError]);

  const createNoteFromSelection = useCallback(async (
    analysisType: AIAnalysisType,
    content: string,
    title?: string
  ): Promise<Note | null> => {
    try {
      safeSetLoading(true);
      clearError();
      const note = await noteManager.createNoteFromSelection(analysisType, content, title);
      if (note) {
        safeSetNotes((prev) => (prev.some((item) => item.id === note.id) ? prev : [...prev, note]));
        await refreshStatistics();
      }
      return note;
    } catch (err) {
      handleError(err, 'createNoteFromSelection');
      return null;
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, refreshStatistics, safeSetLoading, safeSetNotes]);

  const setActiveNote = useCallback((noteId: string | null) => {
    noteManager.setActiveNote(noteId);
    safeSetActiveNoteId(noteId);
  }, [safeSetActiveNoteId]);

  const restoreAllHighlights = useCallback(async () => {
    try {
      safeSetLoading(true);
      clearError();
      await noteManager.restoreAllHighlights();
    } catch (err) {
      handleError(err, 'restoreAllHighlights');
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, safeSetLoading]);

  const clearAllHighlights = useCallback(() => {
    noteManager.clearAllHighlights();
    safeSetActiveNoteId(null);
  }, [safeSetActiveNoteId]);

  const exportNotes = useCallback(async (): Promise<string | null> => {
    try {
      safeSetLoading(true);
      clearError();
      return await noteManager.exportNotes();
    } catch (err) {
      handleError(err, 'exportNotes');
      return null;
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, safeSetLoading]);

  const importNotes = useCallback(async (data: string): Promise<boolean> => {
    try {
      safeSetLoading(true);
      clearError();
      const success = await noteManager.importNotes(data);
      if (success) {
        await refreshNotes();
        await refreshStatistics();
      }
      return success;
    } catch (err) {
      handleError(err, 'importNotes');
      return false;
    } finally {
      safeSetLoading(false);
    }
  }, [clearError, handleError, refreshNotes, refreshStatistics, safeSetLoading]);

  useEffect(() => {
    mountedRef.current = true;

    const handleCreated = (note: Note) => {
      safeSetNotes((prev) => (prev.some((item) => item.id === note.id) ? prev : [...prev, note]));
      void refreshStatistics();
    };
    const handleUpdated = (note: Note) => {
      safeSetNotes((prev) => prev.map((item) => (item.id === note.id ? note : item)));
      void refreshStatistics();
    };
    const handleDeleted = (noteId: string) => {
      safeSetNotes((prev) => prev.filter((item) => item.id !== noteId));
      if (noteId === activeNoteId) {
        safeSetActiveNoteId(null);
      }
      void refreshStatistics();
    };
    const handleHighlightClicked = (noteId: string) => {
      safeSetActiveNoteId(noteId);
    };
    const handleActiveChanged = (noteId: string | null) => {
      safeSetActiveNoteId(noteId);
    };

    noteManager.on('noteCreated', handleCreated);
    noteManager.on('noteUpdated', handleUpdated);
    noteManager.on('noteDeleted', handleDeleted);
    noteManager.on('highlightClicked', handleHighlightClicked);
    noteManager.on('activeNoteChanged', handleActiveChanged);

    void refreshNotes();
    void refreshStatistics();
    safeSetActiveNoteId(noteManager.getActiveNoteId());

    return () => {
      mountedRef.current = false;
      noteManager.off('noteCreated', handleCreated);
      noteManager.off('noteUpdated', handleUpdated);
      noteManager.off('noteDeleted', handleDeleted);
      noteManager.off('highlightClicked', handleHighlightClicked);
      noteManager.off('activeNoteChanged', handleActiveChanged);
    };
  }, [activeNoteId, refreshNotes, refreshStatistics, safeSetActiveNoteId, safeSetNotes]);

  return {
    notes,
    activeNoteId,
    loading,
    error,
    statistics,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    getNotesAtPosition,
    createNoteFromSelection,
    setActiveNote,
    refreshNotes,
    clearError,
    restoreAllHighlights,
    clearAllHighlights,
    exportNotes,
    importNotes,
  };
}

export default useNotes;
