import { useEffect, useState } from 'react';
import { supabase, type Post, type Category } from '../lib/supabase';
import PostCard from './PostCard';
import { ChevronDown } from 'lucide-react';

interface HomePageProps {
  categoryFilter: string | null;
  onPostClick: (post: Post, categorySlug: string) => void;
}

export default function HomePage({ categoryFilter, onPostClick }: HomePageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestPosts, setLatestPosts] = useState<Record<string, Post[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryFilter) {
      fetchCategoryPosts();
    } else {
      fetchAllData();
    }
  }, [categoryFilter]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [categoriesData, postsData] = await Promise.all([
        supabase.from('categories').select('*').order('order', { ascending: true }),
        supabase.from('posts').select('*, categories(*)').order('published_at', { ascending: false }),
      ]);

      if (categoriesData.error) throw categoriesData.error;
      if (postsData.error) throw postsData.error;

      setCategories(categoriesData.data || []);
      setPosts(postsData.data || []);

      const grouped: Record<string, Post[]> = {};
      for (const cat of categoriesData.data || []) {
        grouped[cat.id] = (postsData.data || []).filter(p => p.category_id === cat.id).slice(0, 3);
      }
      setLatestPosts(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategoryPosts() {
    setLoading(true);
    try {
      const [categoriesData, postsData] = await Promise.all([
        supabase.from('categories').select('*').order('order', { ascending: true }),
        (async () => {
          let query = supabase
            .from('posts')
            .select('*, categories(*)')
            .order('published_at', { ascending: false });

          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoryFilter)
            .maybeSingle();

          if (category) {
            query = query.eq('category_id', category.id);
          }
          return query;
        })(),
      ]);

      if (categoriesData.error) throw categoriesData.error;
      setCategories(categoriesData.data || []);

      const { data, error } = await postsData;
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const activeCategory = categoryFilter
    ? categories.find(c => c.slug === categoryFilter)
    : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6">
      {!categoryFilter ? (
        <>
          <section className="py-20 border-b border-gray-300">
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Everyday subjects.<br />Divergent angles.
            </h1>
            <p className="text-2xl text-gray-700 max-w-2xl leading-relaxed">
              A reflective writing practice exploring the mundane and the profound,
              the obvious and the overlooked, the things we think we know and the
              things we're still figuring out.
            </p>
          </section>

          <section className="py-16">
            <div className="space-y-0">
              {categories.map((category) => {
                const isExpanded = expandedCategory === category.id;
                const catPosts = latestPosts[category.id] || [];

                return (
                  <div key={category.id} className="border-b border-gray-200 last:border-0">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full text-left py-10 group"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold mb-3 group-hover:text-gray-600 transition-colors">
                            {category.name}
                          </h2>
                          {category.description && (
                            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                              {category.description}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          size={24}
                          className={`mt-2 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="pb-10 pl-2">
                        {catPosts.length === 0 ? (
                          <p className="text-gray-400 text-sm italic">No posts yet in this category.</p>
                        ) : (
                          <div className="space-y-6">
                            {catPosts.map((post) => (
                              <button
                                key={post.id}
                                onClick={() => onPostClick(post, category.slug)}
                                className="block w-full text-left group/post"
                              >
                                <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-400 mb-2">
                                  <time dateTime={post.published_at}>
                                    {new Date(post.published_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </time>
                                  <span>•</span>
                                  <span>By {post.author}</span>
                                </div>
                                <h3 className="text-xl font-semibold group-hover/post:text-gray-600 transition-colors mb-1">
                                  {post.title}
                                </h3>
                                {post.excerpt && (
                                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                                    {post.excerpt}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          {activeCategory && (
            <section className="py-20 border-b border-gray-300">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                {activeCategory.name}
              </h1>
              {activeCategory.description && (
                <p className="text-xl text-gray-700 max-w-2xl leading-relaxed">
                  {activeCategory.description}
                </p>
              )}
            </section>
          )}

          <section className="py-16">
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-12">
                No posts found in this category.
              </p>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => onPostClick(post, categoryFilter)}
                />
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
