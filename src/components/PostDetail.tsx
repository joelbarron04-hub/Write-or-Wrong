import { ArrowLeft } from 'lucide-react';
import type { Post } from '../lib/supabase';
import Comments from './Comments';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
}

function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

export default function PostDetail({ post, onBack }: PostDetailProps) {
  const date = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm uppercase tracking-widest text-gray-600 hover:text-black transition-colors mb-12"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <article>
        <header className="mb-12">
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500 mb-6">
            <span>{post.categories?.name || 'Uncategorized'}</span>
            <span>&middot;</span>
            <time dateTime={post.published_at}>{date}</time>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600">
            By {post.author}
          </p>
        </header>

        {isHtmlContent(post.content) ? (
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div className="prose-custom">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-xl leading-relaxed mb-6 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </article>

      <Comments postId={post.id} />
    </main>
  );
}
