import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Header from './components/Header';
import HomePage from './components/HomePage';
import PostDetail from './components/PostDetail';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

import type { Post } from './lib/supabase';

function App() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handlePostClick = (post: Post, categorySlug: string) => {
    setCategoryFilter(categorySlug);
    setSelectedPost(post);
  };

  const handleBackToHome = () => {
    setSelectedPost(null);
  };

  const handleCategoryClick = (slug: string | null) => {
    setCategoryFilter(slug);
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isAdminRoute) {
    if (session) {
      return <AdminDashboard onLogout={() => setSession(null)} />;
    }
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onCategoryClick={handleCategoryClick}
        currentCategory={categoryFilter}
      />

      {selectedPost ? (
        <PostDetail post={selectedPost} onBack={handleBackToHome} />
      ) : (
        <HomePage
          categoryFilter={categoryFilter}
          onPostClick={handlePostClick}
        />
      )}

      <footer className="border-t border-gray-300 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-sm text-gray-500 text-center">
            Write or Wrong &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
