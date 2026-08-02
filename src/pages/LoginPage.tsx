import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, isLoading, signIn } = useAuth();
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      route('/', true);
    }
  }, [user, isLoading]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      setError('Please enter your handle');
      return;
    }

    setError('');
    setIsSigningIn(true);
    try {
      await signIn(cleanHandle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Check your handle.');
      setIsSigningIn(false);
    }
  };

  return (
    <div class="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      {/* Brand Header */}
      <div class="flex flex-col items-center text-center mb-8">
        <a href="/" class="flex items-center gap-2.5 no-underline group">
          <span class="w-10 h-10 inline-flex items-center justify-center transition-transform duration-200 group-hover:rotate-45 text-emerald">
            <svg viewBox="0 0 64 65" class="w-9 h-9 fill-current stroke-current">
              <g transform="matrix(0.920107,0,0,0.920107,-355.555,-444.393)">
                <path
                  d="M415.242,550.594L415.674,528.13L398.826,541.234L389.178,522.514L409.338,516.178L392.49,504.226L407.322,489.25L418.842,506.53L425.034,485.794L443.754,495.586L430.794,513.01L452.538,512.578L449.082,533.458L428.922,525.97L436.122,546.994L415.242,550.594Z"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  style="fill-rule:nonzero;stroke-width:4px;"
                />
              </g>
            </svg>
          </span>
          <span class="text-4xl font-brand tracking-tight text-emerald select-none">
            Chive
          </span>
        </a>
      </div>

      {/* Login Card */}
      <div class="w-full max-w-sm bg-white border-2 border-emerald/20 rounded-2xl p-6 sm:p-8 shadow-[4px_4px_0px_#ebf7ed]">
        <form onSubmit={handleSubmit} class="flex flex-col">
          <label class="block text-xs font-sharp font-bold uppercase tracking-wider text-slate-600 mb-2">
            Handle
          </label>
          <input
            type="text"
            placeholder="handle.bsky.social"
            value={handle}
            onInput={(e) => {
              setHandle((e.target as HTMLInputElement).value);
              setError('');
            }}
            disabled={isSigningIn}
            autoFocus
            class="w-full bg-mint/30 border-2 border-emerald/30 focus:border-emerald rounded-xl py-2.5 px-3.5 text-sm font-tech text-slate-800 focus:outline-none transition-all placeholder:text-slate-400 mb-2"
          />

          <p class="text-xs text-slate-500 font-body leading-relaxed mb-5">
            Use your <strong class="font-bold text-slate-700">AT Protocol</strong> handle to log in. If you're unsure, this is likely your Bluesky (<code class="bg-mint px-1 py-0.5 rounded text-emerald font-tech text-[11px]">.bsky.social</code>) account.
          </p>

          {error && (
            <div class="text-red-600 text-xs font-body mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSigningIn || !handle.trim()}
            class="w-full bg-emerald hover:bg-forest text-white font-sharp font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSigningIn ? 'Redirecting...' : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div class="mt-6 text-center text-xs text-slate-400 font-body">
        Don't have an account?{' '}
        <a
          href="https://bsky.app"
          target="_blank"
          rel="noopener noreferrer"
          class="text-emerald font-heading no-underline hover:underline"
        >
          Create an account
        </a>{' '}
        on Bluesky!
      </div>
    </div>
  );
}
