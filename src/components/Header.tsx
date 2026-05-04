import { useState, useEffect } from 'react';
import { supabase, type Category } from '../lib/supabase';

interface HeaderProps {
  onCategoryClick?: (slug: string | null) => void;
  currentCategory?: string | null;
}

export default function Header({ onCategoryClick, currentCategory }: HeaderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="border-b border-gray-300">
      <div className="max-w-4xl mx-auto px-6">
        <div className="py-8">
          <button
            onClick={() => onCategoryClick?.(null)}
            className="text-2xl font-semibold tracking-tight hover:text-gray-600 transition-colors"
          >
            Write or Wrong
          </button>
        </div>

        <nav className="pb-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm uppercase tracking-wider">
            <li>
              <button
                onClick={() => onCategoryClick?.(null)}
                className={`hover:text-gray-600 transition-colors ${!currentCategory ? 'text-black' : 'text-gray-500'}`}
              >
                All
              </button>
            </li>
            {!loading && categories.map((category) => (
              <li key={category.slug}>
                <button
                  onClick={() => onCategoryClick?.(category.slug)}
                  className={`hover:text-gray-600 transition-colors ${currentCategory === category.slug ? 'text-black' : 'text-gray-500'}`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
