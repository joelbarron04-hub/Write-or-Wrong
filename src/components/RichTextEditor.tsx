import { useState, useRef } from 'react';
import { Bold, Italic, Heading2, Quote } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Start typing or paste content..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  };

  const insertHeading = () => {
    document.execCommand('formatBlock', false, '<h2>');
    editorRef.current?.focus();
  };

  const insertBlockquote = () => {
    document.execCommand('formatBlock', false, '<blockquote>');
    editorRef.current?.focus();
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <button
          onClick={() => applyFormat('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => applyFormat('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} className="text-gray-700" />
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onClick={insertHeading}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 2"
        >
          <Heading2 size={18} className="text-gray-700" />
        </button>
        <button
          onClick={insertBlockquote}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Block Quote"
        >
          <Quote size={18} className="text-gray-700" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 leading-relaxed"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
        suppressContentEditableWarning
      >
        {value ? (
          <div dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-2">
        You can paste content from Word, Google Docs, or any other source directly into the editor.
      </p>
    </div>
  );
}
