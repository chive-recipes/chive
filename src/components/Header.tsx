import { Bookmark, Search, Menu, X, LayoutGrid, LogOut, LogIn, Plus, User as UserIcon } from 'lucide-preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { route, useRouter } from 'preact-router';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHomepageSearch, setShowHomepageSearch] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const authDropdownRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: isAuthLoading, signOut: authSignOut } = useAuth();

  const [{ url }] = useRouter();
  const isHomepage = url.split('?')[0] === '/';
  const hurl = url.split('?')[1] || '';
  const searchParams = new URLSearchParams(hurl);
  const q = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(q);
  }, [q]);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setShowAuthDropdown(false);
  }, [url]);

  // Close auth dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) {
        setShowAuthDropdown(false);
      }
    }
    if (showAuthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAuthDropdown]);

  // Handle homepage scroll-triggered header search bar (Pattern A)
  useEffect(() => {
    if (!isHomepage) {
      setShowHomepageSearch(true);
      return;
    }
    const checkScroll = () => {
      setShowHomepageSearch(typeof window !== 'undefined' && window.scrollY > 200);
    };
    // Check initial state
    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, [isHomepage]);

  const handleSearch = (e: Event) => {
    e.preventDefault();
    route(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = async () => {
    setShowAuthDropdown(false);
    await authSignOut();
  };

  // ── Auth button (desktop) ──────────────────────────────────────────────

  const renderAuthButton = () => {
    // Loading state: skeleton circle
    if (isAuthLoading) {
      return (
        <div class="hidden md:block w-8 h-8 rounded-full bg-slate-100 animate-pulse border-2 border-slate-200" />
      );
    }

    // Signed in: avatar with dropdown
    if (user) {
      return (
        <div class="relative" ref={authDropdownRef}>
          <button
            onClick={() => setShowAuthDropdown(!showAuthDropdown)}
            class="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald cursor-pointer hover:shadow-[2px_2px_0px_#ebf7ed] transition-all focus:outline-none"
            aria-label="Account menu"
            title={user.displayName || user.handle}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName || user.handle}
                class="w-full h-full object-cover"
              />
            ) : (
              <div class="w-full h-full bg-emerald/20 flex items-center justify-center text-emerald font-brand text-sm">
                {(user.displayName || user.handle).charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {showAuthDropdown && (
            <div class="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-emerald rounded-2xl shadow-[4px_4px_0px_#ebf7ed] z-50 overflow-hidden">
              <a
                href={`/profile/${user.handle}`}
                onClick={() => setShowAuthDropdown(false)}
                class="p-4 border-b-2 border-mint flex items-center gap-3 hover:bg-mint/40 transition-colors no-underline cursor-pointer group block"
              >
                <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" class="w-full h-full object-cover" />
                  ) : (
                    <div class="w-full h-full bg-emerald/20 flex items-center justify-center text-emerald font-brand">
                      {(user.displayName || user.handle).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div class="min-w-0">
                  {user.displayName && (
                    <div class="font-sharp font-bold text-sm text-slate-800 group-hover:text-emerald transition-colors truncate">
                      {user.displayName}
                    </div>
                  )}
                  <div class="font-tech text-xs text-slate-400 group-hover:text-emerald/80 transition-colors truncate">
                    @{user.handle}
                  </div>
                </div>
              </a>
              <a
                href={`/profile/${user.handle}`}
                onClick={() => setShowAuthDropdown(false)}
                class="flex items-center gap-3 w-full p-3 text-left text-slate-700 hover:text-emerald hover:bg-mint transition-colors font-sharp font-bold text-sm cursor-pointer border-b-2 border-mint no-underline group"
              >
                <UserIcon class="w-4 h-4 text-emerald" />
                Your Profile
              </a>
              <a
                href="/create"
                onClick={() => setShowAuthDropdown(false)}
                class="flex items-center gap-3 w-full p-3 text-left text-slate-700 hover:text-emerald hover:bg-mint transition-colors font-sharp font-bold text-sm cursor-pointer border-b-2 border-mint no-underline group"
              >
                <Plus class="w-4 h-4 text-emerald" />
                Post Recipe
              </a>
              <button
                onClick={handleSignOut}
                class="flex items-center gap-3 w-full p-3 text-left text-slate-700 hover:text-emerald hover:bg-mint transition-colors font-sharp font-bold text-sm cursor-pointer group"
              >
                <LogOut class="w-4 h-4 text-emerald" />
                Sign out
              </button>
            </div>
          )}
        </div>
      );
    }

    // Signed out: sign-in button linking to /login page (hidden on mobile, visible on desktop)
    return (
      <a
        href="/login"
        class="hidden md:flex items-center gap-1.5 text-emerald bg-mint/40 hover:bg-mint font-sharp font-bold text-sm px-3 py-1.5 rounded-xl border border-emerald/30 hover:border-emerald/60 transition-all cursor-pointer focus:outline-none no-underline"
      >
        <LogIn class="w-4 h-4" />
        Sign in
      </a>
    );
  };

  // ── Mobile auth section ────────────────────────────────────────────────

  const renderMobileAuth = () => {
    if (isAuthLoading) return null;

    if (user) {
      return (
        <>
          <a
            href={`/profile/${user.handle}`}
            onClick={() => setIsMenuOpen(false)}
            class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl w-full text-left cursor-pointer font-sharp font-bold text-slate-700 hover:text-emerald transition-colors no-underline"
          >
            <UserIcon class="w-6 h-6 text-emerald" />
            <span>Your Profile</span>
          </a>
          <a
            href="/create"
            onClick={() => setIsMenuOpen(false)}
            class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl w-full text-left cursor-pointer font-sharp font-bold text-slate-700 hover:text-emerald transition-colors no-underline"
          >
            <Plus class="w-6 h-6 text-emerald" />
            <span>Post Recipe</span>
          </a>
          <button
            onClick={handleSignOut}
            class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl w-full text-left cursor-pointer font-sharp font-bold text-slate-700 hover:text-emerald transition-colors"
          >
            <LogOut class="w-6 h-6 text-emerald" />
            <span>Sign out</span>
          </button>
        </>
      );
    }

    return (
      <a
        href="/login"
        class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl no-underline text-slate-700 hover:text-emerald transition-colors cursor-pointer font-sharp font-bold"
      >
        <LogIn class="w-6 h-6 text-emerald" />
        <span>Sign in</span>
      </a>
    );
  };

  return (
    <nav class="border-b-4 border-emerald bg-white sticky top-0 z-50 px-4 py-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] print:hidden w-full">
      <div class="flex justify-between items-center gap-4">
        {/* Logo */}
        <a href="/" class="flex items-center gap-1.5 cursor-pointer no-underline shrink-0 group">
          <span class="text-xl font-brand tracking-tight text-emerald flex items-center select-none">
            <span class="w-6 h-6 inline-flex items-center justify-center transition-transform duration-200 group-hover:rotate-45 origin-center mr-1">
              <svg
                viewBox="0 0 64 65"
                class="w-5 h-5 fill-current stroke-current"
              >
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
            Chive
          </span>
        </a>
        <div class="flex items-center gap-2 xs:gap-3 md:gap-6 flex-grow justify-end">
          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            class={`relative w-full transition-all duration-300 ease-out origin-right ${showHomepageSearch
              ? 'max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-md opacity-100 scale-100 pointer-events-auto'
              : 'max-w-0 opacity-0 scale-95 pointer-events-none overflow-hidden'
              }`}
          >
            <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search class="text-emerald w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={typeof window !== 'undefined' && window.innerWidth < 640 ? "Search..." : "Search recipes..."}
              class="w-full bg-mint/50 border-2 border-emerald rounded-xl py-1.5 pl-9 pr-3 text-sm font-bold text-emerald shadow-[2px_2px_0px_#27ae60] focus:shadow-[1px_1px_0px_#27ae60] focus:translate-y-[1px] focus:outline-none transition-all placeholder:text-emerald/50 font-tech"
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            />
          </form>
          {/* Desktop Nav Actions */}
          <div class="hidden md:flex items-center gap-4 text-emerald">
            <a href="/collections" class="hover:bg-mint p-2 rounded-xl transition-colors" title="Collections">
              <LayoutGrid class="w-5 h-5" />
            </a>
            <a href="/bookmarks" class="hover:bg-mint p-2 rounded-xl transition-colors" title="Bookmarks">
              <Bookmark class="w-5 h-5" />
            </a>
          </div>
          {/* Auth Button (Visible on both Mobile and Desktop) */}
          <div class="flex items-center shrink-0">
            {renderAuthButton()}
          </div>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            class="md:hidden p-2 text-emerald hover:bg-mint rounded-xl transition-colors focus:outline-none shrink-0"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X class="w-6 h-6" /> : <Menu class="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div class="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-emerald p-4 animate-slide-down shadow-xl">
          <div class="flex flex-col gap-2 font-sharp font-bold">
            <a href="/collections" class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl no-underline text-slate-700 hover:text-emerald transition-colors">
              <LayoutGrid class="w-6 h-6 text-emerald" />
              <span>Collections</span>
            </a>
            <a href="/bookmarks" class="flex items-center gap-4 p-3 hover:bg-mint rounded-xl no-underline text-slate-700 hover:text-emerald transition-colors">
              <Bookmark class="w-6 h-6 text-emerald" />
              <span>Your Bookmarks</span>
            </a>
            <div class="border-t-2 border-mint pt-3 mt-1">
              {renderMobileAuth()}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
