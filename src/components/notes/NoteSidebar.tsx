/**
 * 笔记侧栏
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AIAnalysisType, type Note, type NoteSidebarProps } from '../../types/notes';
import { useNotes } from '../../hooks/useNotes';

function getAnalysisTypeLabel(type: AIAnalysisType): string {
  switch (type) {
    case AIAnalysisType.VOCABULARY:
      return '词汇';
    case AIAnalysisType.GRAMMAR:
      return '语法';
    case AIAnalysisType.CULTURAL:
      return '文化';
    case AIAnalysisType.SEMANTIC:
      return '语义';
    default:
      return '笔记';
  }
}

export const NoteSidebar: React.FC<NoteSidebarProps> = ({
  isVisible,
  onClose,
  activeNoteId = null,
  onNoteSelect,
  onNoteUpdate,
  onNoteDelete,
  className = '',
  style,
  width = 360,
}) => {
  const {
    notes,
    loading,
    error,
    statistics,
    getNote,
    updateNote,
    deleteNote,
    clearError,
  } = useNotes();

  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AIAnalysisType | 'all'>('all');

  useEffect(() => {
    if (!activeNoteId) {
      setCurrentNote(null);
      setIsEditing(false);
      return;
    }

    void getNote(activeNoteId).then((note) => {
      setCurrentNote(note);
      setTitle(note?.title || '');
      setContent(note?.content || '');
    });
  }, [activeNoteId, getNote]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = window.setTimeout(() => {
      clearError();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [clearError, error]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (filterType !== 'all' && note.analysisType !== filterType) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      const query = searchQuery.toLowerCase();
      return (
        note.title?.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.selectedText.toLowerCase().includes(query)
      );
    });
  }, [filterType, notes, searchQuery]);

  const handleSave = async () => {
    if (!currentNote) {
      return;
    }

    const updated = await updateNote(currentNote.id, {
      ...(title.trim() ? { title: title.trim() } : {}),
      content: content.trim(),
    });

    if (updated) {
      setCurrentNote(updated);
      setIsEditing(false);
      onNoteUpdate?.(updated);
    }
  };

  const handleDelete = async () => {
    if (!currentNote) {
      return;
    }

    if (!window.confirm('确定要删除这个笔记吗？')) {
      return;
    }

    const success = await deleteNote(currentNote.id);
    if (success) {
      onNoteDelete?.(currentNote.id);
      setCurrentNote(null);
      setIsEditing(false);
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width,
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-4px 0 20px rgba(15, 23, 42, 0.08)',
        ...style,
      }}
      data-selection-ui="true"
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong>笔记</strong>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
            关闭
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          共 {statistics.total} 条有效笔记，已删除 {statistics.deleted} 条
        </div>
        {error && <div style={{ marginTop: '8px', color: '#dc2626', fontSize: '12px' }}>{error.message}</div>}
      </div>

      <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="搜索笔记"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '8px' }}
        />
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value as AIAnalysisType | 'all')}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
        >
          <option value="all">全部类型</option>
          <option value={AIAnalysisType.VOCABULARY}>词汇</option>
          <option value={AIAnalysisType.GRAMMAR}>语法</option>
          <option value={AIAnalysisType.CULTURAL}>文化</option>
          <option value={AIAnalysisType.SEMANTIC}>语义</option>
        </select>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', borderBottom: '1px solid #e5e7eb', maxHeight: '40vh' }}>
          {loading && <div style={{ padding: '16px', color: '#64748b' }}>加载中...</div>}
          {!loading && filteredNotes.length === 0 && <div style={{ padding: '16px', color: '#64748b' }}>暂无匹配笔记</div>}
          {!loading && filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setCurrentNote(note);
                setTitle(note.title || '');
                setContent(note.content);
                setIsEditing(false);
                onNoteSelect?.(note);
              }}
              style={{
                width: '100%',
                border: 0,
                borderBottom: '1px solid #f1f5f9',
                background: note.id === currentNote?.id ? '#eff6ff' : '#ffffff',
                padding: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>{getAnalysisTypeLabel(note.analysisType)}</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{note.title || note.selectedText.slice(0, 24)}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{note.selectedText.slice(0, 60)}</div>
            </button>
          ))}
        </div>

        <div style={{ overflowY: 'auto', padding: '16px' }}>
          {!currentNote && <div style={{ color: '#64748b' }}>点击高亮或左侧列表中的笔记查看详情。</div>}
          {currentNote && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#2563eb' }}>{getAnalysisTypeLabel(currentNote.analysisType)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} style={{ border: 0, background: '#0f172a', color: '#fff', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                      编辑
                    </button>
                  )}
                  <button onClick={handleDelete} style={{ border: 0, background: '#fee2e2', color: '#b91c1c', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                    删除
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
                选中文本: {currentNote.selectedText}
              </div>

              {isEditing ? (
                <>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="标题"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '8px' }}
                  />
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={10}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'vertical', marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleSave} style={{ border: 0, background: '#0f172a', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setTitle(currentNote.title || '');
                        setContent(currentNote.content);
                        setIsEditing(false);
                      }}
                      style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#334155', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      取消
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#0f172a' }}>{currentNote.content}</div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default NoteSidebar;
