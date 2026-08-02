import Router, { Route } from 'preact-router';
import { useState } from 'preact/hooks';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ExplorePage } from './pages/ExplorePage';
import { BookmarksPage } from './pages/BookmarksPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  const [currentUrl, setCurrentUrl] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
  const isLoginPage = currentUrl === '/login';
  const showHeaderFooter = !isEmbedded && !isLoginPage;

  return (
    <div class="min-h-screen bg-paper text-slate-800 font-body flex flex-col">
      {showHeaderFooter && <Header />}
      <div class="flex-grow flex flex-col">
        <Router onChange={(e) => {
          if (typeof window !== 'undefined') {
            (window as any).__chive_nav_count = ((window as any).__chive_nav_count || 0) + 1;
          }
          setCurrentUrl(e.url.split('?')[0]);
          window.scrollTo(0, 0);
        }}>
          <Route path="/oauth/callback" component={OAuthCallbackPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/explore" component={ExplorePage} />
          <Route path="/bookmarks" component={BookmarksPage} />
          <Route path="/collections" component={CollectionsPage} />
          <Route path="/collections/:slug" component={CollectionDetailPage} />
          <Route path="/create" component={CreateRecipePage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/profile/:identifier" component={ProfilePage} />
          <Route path="/recipe/:rkey" component={RecipeDetailPage} />
          <Route path="/recipe/:author/:rkey" component={RecipeDetailPage} />
          <Route default component={NotFoundPage} />
        </Router>
      </div>
      {showHeaderFooter && <Footer />}
    </div>
  );
}
