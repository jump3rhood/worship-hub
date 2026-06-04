import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [sundayDate, setSundayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getSongs()
      .then(({ songs, sundayDate }) => {
        setSongs(songs);
        setSundayDate(sundayDate || '');
      })
      .catch(() => setError('Could not load songs. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm">
              ♪
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">Worship Hub</span>
          </div>
          <button
            onClick={() => navigate(api.isLoggedIn() ? '/admin' : '/admin/login')}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            {api.isLoggedIn() ? 'Admin' : 'Leader login'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Sunday label */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-violet-400 font-semibold mb-1">
            This Sunday
          </p>
          <h1 className="text-2xl font-bold text-white">
            {sundayDate ? formatDate(sundayDate) : 'Setlist'}
          </h1>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-950 border border-red-800 text-red-300 px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && songs.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">♪</div>
            <p className="text-lg">No songs in the setlist yet.</p>
            <p className="text-sm mt-1">The worship leader will add songs soon.</p>
          </div>
        )}

        {!loading && songs.length > 0 && (
          <ol className="space-y-3">
            {songs.map((song, idx) => (
              <li key={song.id}>
                <Link
                  to={`/song/${song.id}`}
                  className="flex items-center gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-violet-700 hover:bg-slate-800/80 transition-all group"
                >
                  <span className="text-2xl font-bold text-slate-600 group-hover:text-violet-500 transition-colors w-8 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{song.title}</p>
                    {song.artist && (
                      <p className="text-sm text-slate-400 truncate">{song.artist}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {song.lyrics && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Lyrics
                      </span>
                    )}
                    {song.chords && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Chords
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
