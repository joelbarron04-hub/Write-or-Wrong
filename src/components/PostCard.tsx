import type { Post } from '../lib/supabase';

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export default function PostCard({ post, onClick }: PostCardProps) {
  const date = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <article className="border-b border-gray-200 pb-12 mb-12 last:border-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500">
          <span>{post.categories?.name || 'Uncategorized'}</span>
          <span>•</span>
          <time dateTime={post.published_at}>{date}</time>
        </div>

        <button
          onClick={onClick}
          className="text-left group"
        >
          <h2 className="text-4xl font-semibold mb-4 group-hover:text-gray-600 transition-colors">
            {post.title}
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            {post.excerpt}
          </p>
        </button>

        <div className="text-sm text-gray-600 mt-2">
          By {post.author}
        </div>
      </div>
    </article>
  );
}
