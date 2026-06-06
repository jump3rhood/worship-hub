import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api';
import { SONG_TAGS, TagBadge } from '../tags';

// ---------- Drag handle icon ----------
function DragHandle({ listeners, attributes }) {
  return (
    <button
      {...listeners}
      {...attributes}
      className="touch-none cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors p-1"
      aria-label="Drag to reorder"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm8-12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
      </svg>
    </button>
  );
}

// ---------- Sortable song row ----------
function SortableSongRow({ song, index, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl group"
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <span className="text-slate-600 font-mono text-sm w-5 text-center shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium text-white truncate">{song.title}</p>
          {song.tag && <TagBadge tag={song.tag} />}
        </div>
        {song.artist && <p className="text-sm text-slate-400 truncate">{song.artist}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => onEdit(song)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Edit song"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(song)}
          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition-colors"
          aria-label="Delete song"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------- Song modal (add / edit) ----------
const EMPTY_FORM = { title: '', artist: '', lyrics: '', chords: '', tag: '' };

const toForm = (s) => s
  ? { title: s.title || '', artist: s.artist || '', lyrics: s.lyrics || '', chords: s.chords || '', tag: s.tag || '' }
  : EMPTY_FORM;

function SongModal({ song, songs, songIndex, onSave, onClose, onNavigate }) {
  const [form, setForm] = useState(() => toForm(song));
  const [tab, setTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when navigating to a different song
  useEffect(() => {
    setForm(toForm(song));
    setError('');
  }, [song?.id]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(toForm(song));

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function tryClose() {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    onClose();
  }

  function tryNavigate(target) {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    onNavigate(target);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); setTab('details'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const hasPrev = song && songIndex > 0;
  const hasNext = song && songIndex >= 0 && songIndex < songs.length - 1;

  return (
    // No backdrop click-to-close — prevents accidental data loss and text-selection drag dismissal
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h3 className="text-lg font-semibold text-white">{song ? 'Edit Song' : 'Add Song'}</h3>
          <div className="flex items-center gap-1">
            {song && (
              <>
                <button
                  onClick={() => tryNavigate(songs[songIndex - 1])}
                  disabled={!hasPrev}
                  title={hasPrev ? songs[songIndex - 1].title : undefined}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-slate-500 w-10 text-center tabular-nums">{songIndex + 1} / {songs.length}</span>
                <button
                  onClick={() => tryNavigate(songs[songIndex + 1])}
                  disabled={!hasNext}
                  title={hasNext ? songs[songIndex + 1].title : undefined}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1" />
              </>
            )}
            <button onClick={tryClose} className="p-1 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {['details', 'lyrics', 'chords'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {t === 'chords' ? 'Chord Sheet' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Song Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={update('title')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Amazing Grace"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Artist / Author</label>
                <input
                  type="text"
                  value={form.artist}
                  onChange={update('artist')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. John Newton"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tag <span className="text-slate-500 font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SONG_TAGS.map((t) => {
                    const active = form.tag === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tag: active ? '' : t.value }))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? t.pillActive : t.pill}`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'lyrics' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Lyrics <span className="text-slate-500 font-normal">(paste or type)</span>
              </label>
              <textarea
                value={form.lyrics}
                onChange={update('lyrics')}
                rows={18}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none leading-relaxed"
                placeholder="Paste lyrics here…"
              />
            </div>
          )}

          {tab === 'chords' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Chord Sheet <span className="text-slate-500 font-normal">(paste chord chart or Nashville notation)</span>
              </label>
              <textarea
                value={form.chords}
                onChange={update('chords')}
                rows={18}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Paste chord sheet here… (monospace font preserves alignment)"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={tryClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving…' : song ? 'Save Changes' : 'Add Song'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Delete confirm dialog ----------
function DeleteConfirm({ song, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Remove song?</h3>
        <p className="text-slate-400 text-sm mb-6">
          "<span className="text-white">{song.title}</span>" will be removed from the setlist.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {deleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Admin page ----------
export default function Admin() {
  const [songs, setSongs] = useState([]);
  const [sundayDate, setSundayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalSong, setModalSong] = useState(undefined); // undefined = closed, null = new, song = edit
  const [deleteSong, setDeleteSong] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [savingDate, setSavingDate] = useState(false);
  const [dateMsg, setDateMsg] = useState('');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(() => {
    api.getSongs().then(({ songs, sundayDate }) => {
      setSongs(songs);
      setSundayDate(sundayDate || '');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleLogout() {
    api.logout();
    navigate('/');
  }

  // Drag end: reorder locally then persist
  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = songs.findIndex((s) => s.id === active.id);
    const newIndex = songs.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(songs, oldIndex, newIndex);
    setSongs(newOrder);
    await api.reorderSongs(newOrder.map((s) => s.id));
  }

  async function handleSaveSong(form) {
    if (modalSong) {
      await api.updateSong(modalSong.id, form);
    } else {
      await api.createSong(form);
    }
    load();
  }

  async function handleDeleteConfirm() {
    await api.deleteSong(deleteSong.id);
    setDeleteSong(null);
    load();
  }

  async function handleDateChange(e) {
    const date = e.target.value;
    setSundayDate(date);
    setSavingDate(true);
    setDateMsg('');
    try {
      await api.updateSundayDate(date);
      setDateMsg('Saved');
      setTimeout(() => setDateMsg(''), 2000);
    } catch {
      setDateMsg('Failed to save');
    } finally {
      setSavingDate(false);
    }
  }

  const activeSong = songs.find((s) => s.id === activeId);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm">♪</div>
            <div>
              <span className="font-semibold text-white">Worship Hub</span>
              <span className="ml-2 text-xs text-violet-400 font-medium uppercase tracking-wider">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">View public</a>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-400 transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manage Setlist</h1>
            <p className="text-slate-400 text-sm">Drag to reorder · Click to edit</p>
          </div>
          <button
            onClick={() => setModalSong(null)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Song
          </button>
        </div>

        {/* Sunday date picker */}
        <div className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-slate-300 shrink-0">Sunday Date</label>
          <input
            type="date"
            value={sundayDate}
            onChange={handleDateChange}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          {dateMsg && (
            <span className={`text-xs font-medium ${dateMsg === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>
              {dateMsg}
            </span>
          )}
        </div>

        {/* Song list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 mb-3">No songs yet.</p>
            <button onClick={() => setModalSong(null)} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
              + Add the first song
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {songs.map((song, idx) => (
                  <SortableSongRow
                    key={song.id}
                    song={song}
                    index={idx}
                    onEdit={(s) => setModalSong(s)}
                    onDelete={(s) => setDeleteSong(s)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeSong && (
                <div className="flex items-center gap-3 p-4 bg-slate-800 border border-violet-700 rounded-xl shadow-2xl">
                  <span className="text-slate-500 text-sm">⠿⠿</span>
                  <div>
                    <p className="font-medium text-white">{activeSong.title}</p>
                    {activeSong.artist && <p className="text-sm text-slate-400">{activeSong.artist}</p>}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Modals */}
      {modalSong !== undefined && (
        <SongModal
          song={modalSong || null}
          songs={songs}
          songIndex={modalSong ? songs.findIndex((s) => s.id === modalSong.id) : -1}
          onSave={handleSaveSong}
          onClose={() => setModalSong(undefined)}
          onNavigate={(s) => setModalSong(s)}
        />
      )}
      {deleteSong && (
        <DeleteConfirm
          song={deleteSong}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteSong(null)}
        />
      )}
    </div>
  );
}
