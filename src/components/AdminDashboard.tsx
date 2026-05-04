import { useState, useEffect } from 'react';
import { supabase, type Post, type Category, type Draft } from '../lib/supabase';
import { LogOut, Plus, Trash2, CreditCard as Edit2, FileText, Folder, Globe, ExternalLink } from 'lucide-react';
import DraftEditor from './DraftEditor';
import CategoryManager from './CategoryManager';

interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'wip' | 'published' | 'categories';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    author: '',
    is_featured: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [postsData, draftsData, categoriesData] = await Promise.all([
        supabase.from('posts').select('*, categories(*)').order('published_at', { ascending: false }),
        supabase.from('drafts').select('*, categories(*)').order('updated_at', { ascending: false }),
        supabase.from('categories').select('*').order('order', { ascending: true })
      ]);

      if (postsData.error) throw postsData.error;
      if (draftsData.error) throw draftsData.error;
      if (categoriesData.error) throw categoriesData.error;

      setPosts(postsData.data || []);
      setDrafts(draftsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([{ ...formData, published_at: new Date().toISOString() }]);

        if (error) throw error;
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post');
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  }

  async function handleUnpublish(postId: string) {
    if (!confirm('Move this article back to WIP?')) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const { error: draftError } = await supabase
        .from('drafts')
        .insert({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category_id: post.category_id,
          author: post.author,
          is_featured: post.is_featured,
          status: 'draft',
        });

      if (draftError) throw draftError;

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      fetchData();
    } catch (error) {
      console.error('Error unpublishing post:', error);
      alert('Failed to unpublish post');
    }
  }

  function handleEdit(post: Post) {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category_id: post.category_id,
      author: post.author,
      is_featured: post.is_featured
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category_id: '',
      author: '',
      is_featured: false
    });
    setShowForm(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold">Write or Wrong</h2>
          <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm ${
              activeTab === 'dashboard'
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Globe size={16} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('wip')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm ${
              activeTab === 'wip'
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText size={16} />
            WIP Drafts
            {drafts.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'wip' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>{drafts.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('published')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm ${
              activeTab === 'published'
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Globe size={16} />
            Published
            {posts.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'published' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>{posts.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 text-sm ${
              activeTab === 'categories'
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Folder size={16} />
            Categories
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <a
            href="/"
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            <ExternalLink size={16} />
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-600">Manage your content and workflow</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-600">Published</p>
                    <Globe size={20} className="text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold">{posts.length}</p>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-600">WIP Drafts</p>
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold">{drafts.length}</p>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-600">Categories</p>
                    <Folder size={20} className="text-gray-400" />
                  </div>
                  <p className="text-3xl font-bold">{categories.length}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-bold mb-4">Recent Articles</h2>
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No published articles yet.</p>
                  ) : (
                    posts.slice(0, 5).map(post => (
                      <div key={post.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{post.title}</p>
                          <p className="text-xs text-gray-500">{post.author} &middot; {post.categories?.name || 'Uncategorized'}</p>
                        </div>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Published</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wip' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Work In Progress</h1>
                  <p className="text-gray-600 mt-1">Create and manage article drafts</p>
                </div>
                <button
                  onClick={() => {
                    setEditingDraft(null);
                    setShowDraftEditor(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  New Draft
                </button>
              </div>

              {showDraftEditor && (
                <DraftEditor
                  draft={editingDraft || undefined}
                  categories={categories}
                  onClose={() => setShowDraftEditor(false)}
                  onSave={() => {
                    fetchData();
                    setShowDraftEditor(false);
                  }}
                />
              )}

              <div className="space-y-3">
                {drafts.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                    <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No drafts yet. Create your first one!</p>
                  </div>
                ) : (
                  drafts.map(draft => (
                    <div key={draft.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{draft.title || 'Untitled'}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {draft.author} &middot; Updated {new Date(draft.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded mr-4 flex-shrink-0">WIP</span>
                      <button
                        onClick={() => {
                          setEditingDraft(draft);
                          setShowDraftEditor(true);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'published' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Published Articles</h1>
                  <p className="text-gray-600 mt-1">Manage your live content</p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  New Article
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-gray-200 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold mb-8">
                    {editingPost ? 'Edit Article' : 'Create New Article'}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Slug</label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="url-friendly-slug"
                          required
                          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Author</label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg text-sm"
                        >
                          <option value="">Select a category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Excerpt</label>
                      <input
                        type="text"
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        placeholder="Short description"
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={12}
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded-lg resize-none text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="w-4 h-4 border border-gray-300 cursor-pointer rounded"
                      />
                      <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                        Featured Article
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        {editingPost ? 'Update Article' : 'Publish Article'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                    <Globe size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No published articles yet</p>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                          {post.is_featured && (
                            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded flex-shrink-0">Featured</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {post.author} &middot; {post.categories?.name || 'Uncategorized'} &middot; {new Date(post.published_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleUnpublish(post.id)}
                          className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors font-medium"
                        >
                          Unpublish
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Categories</h1>
                <p className="text-gray-600 mt-1">Manage article categories and navigation</p>
              </div>
              <CategoryManager onClose={() => {}} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
