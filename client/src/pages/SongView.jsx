import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { TagBadge } from '../tags';

export default function SongView() {
  const { id } = useParams();
  const [songs, setSongs] = useState([]);
  const [tab, setTab] = useState('lyrics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the full list once; navigation is client-side from here
  useEffect(() => {
    api.getSongs()
      .then(({ songs }) => setSongs(songs))
      .catch(() => setError('Could not load songs.'))
      .finally(() => setLoading(false));
  }, []);

  const songIndex = songs.findIndex((s) => s.id === parseInt(id, 10));
  const song = songs[songIndex] ?? null;
  const prevSong = songIndex > 0 ? songs[songIndex - 1] : null;
  const nextSong = songIndex >= 0 && songIndex < songs.length - 1 ? songs[songIndex + 1] : null;

  // Reset tab when navigating to a different song
  useEffect(() => {
    if (song) {
      if (!song.lyrics?.trim() && song.chords?.trim()) setTab('chords');
      else setTab('lyrics');
    }
  }, [song?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">{error || 'Song not found.'}</p>
        <Link to="/" className="text-violet-400 hover:text-violet-300 text-sm">← Back to setlist</Link>
      </div>
    );
  }

  const hasLyrics = !!song.lyrics?.trim();
  const hasChords = !!song.chords?.trim();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          {/* Back to setlist */}
          <Link to="/" className="text-slate-400 hover:text-white transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Branding */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm shrink-0">♪</div>
            <span className="font-semibold text-lg text-white tracking-tight truncate">Worship Hub</span>
          </div>

          {/* Prev / position / next */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              to={prevSong ? `/song/${prevSong.id}` : '#'}
              aria-disabled={!prevSong}
              title={prevSong?.title}
              className={`p-1.5 rounded-lg transition-colors ${
                prevSong
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-700 pointer-events-none'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-xs text-slate-500 w-10 text-center tabular-nums">
              {songIndex + 1} / {songs.length}
            </span>
            <Link
              to={nextSong ? `/song/${nextSong.id}` : '#'}
              aria-disabled={!nextSong}
              title={nextSong?.title}
              className={`p-1.5 rounded-lg transition-colors ${
                nextSong
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-700 pointer-events-none'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Song title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{song.title}</h1>
            {song.tag && <TagBadge tag={song.tag} />}
          </div>
          {song.artist && <p className="text-slate-400 text-base">{song.artist}</p>}
        </div>

        {/* Tabs */}
        {(hasLyrics || hasChords) && (
          <div className="flex gap-1 p-1 bg-slate-900 rounded-xl w-fit mb-8 border border-slate-800">
            {hasLyrics && (
              <button
                onClick={() => setTab('lyrics')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === 'lyrics'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lyrics
              </button>
            )}
            {hasChords && (
              <button
                onClick={() => setTab('chords')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === 'chords'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chord Sheet
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8">
          {tab === 'lyrics' && (
            hasLyrics
              ? <div className="lyrics-text text-slate-100 leading-relaxed">{song.lyrics}</div>
              : <p className="text-slate-500 italic">No lyrics added.</p>
          )}
          {tab === 'chords' && (
            hasChords
              ? <div className="chords-text text-slate-100">{song.chords}</div>
              : <p className="text-slate-500 italic">No chord sheet added.</p>
          )}
        </div>
      </main>
    </div>
  );
}
