"use client";

import { useState } from "react";
import { X, StickyNote, Trash2 } from "lucide-react";

interface NoteData {
  id: string;
  content: string;
  highlightId: string | null;
  highlightText?: string;
  createdAt: string;
}

interface NotesPanelProps {
  notes: NoteData[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

export function NotesPanel({
  notes,
  onClose,
  onDelete,
  onEdit,
}: NotesPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function startEdit(note: NoteData) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  function saveEdit(id: string) {
    onEdit(id, editContent);
    setEditingId(null);
  }

  return (
    <div className="fixed right-0 top-[57px] z-30 h-[calc(100vh-57px)] w-80 border-l border-ink/[0.06] bg-paper-cool shadow-warm-lg">
      <div className="flex items-center justify-between border-b border-ink/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-ink-light" />
          <h3 className="text-sm font-medium text-ink">Notes</h3>
          <span className="rounded-full bg-paper-warm px-1.5 py-0.5 text-xs text-ink-light">
            {notes.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-paper-warm"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="h-full overflow-y-auto px-4 py-3">
        {notes.length === 0 ? (
          <div className="py-8 text-center">
            <StickyNote className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-2 text-sm text-ink-muted">
              No notes for this section yet.
            </p>
            <p className="text-xs text-ink-faint">
              Select text and click &quot;Add Note&quot; to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md border border-ink/[0.08] p-3"
              >
                {note.highlightText && (
                  <div className="mb-2 rounded-sm bg-paper-warm px-2 py-1">
                    <p className="font-serif text-xs text-ink-light italic">
                      &ldquo;{note.highlightText.slice(0, 100)}
                      {note.highlightText.length > 100 ? "..." : ""}&rdquo;
                    </p>
                  </div>
                )}

                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full resize-none rounded-md border border-ink/[0.08] px-2 py-1 text-sm text-ink focus:border-ink-faint focus:outline-none"
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(note.id)}
                        className="text-xs font-medium text-ink hover:text-ink-light"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-ink-muted hover:text-ink-light"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p
                      className="cursor-pointer text-sm text-ink"
                      onClick={() => startEdit(note)}
                    >
                      {note.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-ink-muted">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onDelete(note.id)}
                        className="text-ink-muted hover:text-serif-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
