import { useState, useEffect } from 'react';
import { supabase, type Draft, type Category } from '../lib/supabase';
import { Save, X, Trash2, CheckCircle } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface DraftEditorProps {
  draft?: Draft;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export default function DraftEditor({ draft, categories, onClose, onSave }: DraftEditorProps) {
  const [title, setTitle] = useState(draft?.title || '');
  const [slug, setSlug] = useState(draft?.slug || '');
  const [excerpt, setExcerpt] = useState(draft?.excerpt || '');
  const [content, setContent] = useState(draft?.content || '');
  const [author, setAuthor] = useState(draft?.author || 'Anonymous');
  const [categoryId, setCategoryId] = useState(draft?.category_id || '');
  const [isFeatured, setIsFeatured] = useState(draft?.is_featured || false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setSlug(draft.slug);
      setExcerpt(draft.excerpt);
      setContent(draft.content);
      setAuthor(draft.author);
      setCategoryId(draft.category_id);
      setIsFeatured(draft.is_featured);
    }
  }, [draft]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!draft) {
      setSlug(generateSlug(newTitle));
    }
  };

  const autoSaveDraft = async (data: Partial<Draft>) => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (draft) {
        const { error } = await supabase
          .from('drafts')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('drafts')
          .insert({
            title: data.title || title,
            slug: data.slug || slug,
            excerpt: data.excerpt || excerpt,
            content: data.content || content,
            author: data.author || author,
            category_id: data.category_id || categoryId,
            is_featured: data.is_featured !== undefined ? data.is_featured : isFeatured,
            status: 'draft',
          });

        if (error) throw error;
      }

      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimer) clearTimeout(saveTimer);

    const timer = setTimeout(() => {
      autoSaveDraft({
        title,
        slug,
        excerpt,
        content,
        author,
        category_id: categoryId,
        is_featured: isFeatured,
      });
    }, 2000);

    setSaveTimer(timer);

    return () => clearTimeout(timer);
  }, [title, slug, excerpt, content, author, categoryId, isFeatured]);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setIsSaving(true);
    try {
      const postData = {
        title,
        slug,
        excerpt: excerpt || title.substring(0, 150),
        content,
        author,
        category_id: categoryId || null,
        is_featured: isFeatured,
        published_at: new Date().toISOString(),
      };

      if (draft && draft.status === 'published') {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', draft.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('posts')
          .insert(postData);

        if (error) throw error;

        if (draft) {
          await supabase
            .from('drafts')
            .delete()
            .eq('id', draft.id);
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Publish failed:', error);
      alert('Failed to publish article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft) return;

    if (!confirm('Delete this draft?')) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', draft.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete draft');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">{draft ? 'Edit Draft' : 'New Draft'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="Article title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="url-friendly-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="Short description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="Author name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 focus:outline-none text-sm"
              >
                <option value="">No category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write or paste your article content here..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Save size={14} /> Saving...
              </span>
            )}
            {lastSaved && !isSaving && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle size={14} /> Saved at {lastSaved}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {draft && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Close
            </button>

            <button
              onClick={handlePublish}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm font-medium"
            >
              <CheckCircle size={16} /> Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
