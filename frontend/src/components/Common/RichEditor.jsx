import { useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { marked } from 'marked';

// A small Notion-style block editor (TipTap). Content is HTML. Pages saved by
// the old markdown editor are converted on load, so they open cleanly here.
function toHtml(body) {
  if (!body) return '';
  // If it already looks like HTML, use as-is; otherwise treat as markdown.
  return /<[a-z][\s\S]*>/i.test(body) ? body : marked.parse(body, { async: false });
}

function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`px-2 py-1 text-sm rounded border ${
        active ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

// props: value (html/markdown string), onChange(html), onImageUpload() => url
export default function RichEditor({ value, onChange, onImageUpload }) {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false })],
    content: toHtml(value),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'markdown-body min-h-[300px] px-3 py-2 focus:outline-none',
        'aria-label': 'Page body'
      }
    }
  });

  // Reflect external content changes (e.g. switching to a different page).
  useEffect(() => {
    if (!editor) return;
    const next = toHtml(value);
    if (next !== editor.getHTML()) editor.commands.setContent(next, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const insertImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImageUpload) return;
    const url = await onImageUpload(file);
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="Heading 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading 2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet list">
          • List
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="Code block">
          {'</>'}
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="Quote">
          ❝
        </ToolbarButton>
        {onImageUpload && (
          <ToolbarButton onClick={() => fileRef.current?.click()} label="Insert image">
            🖼 Image
          </ToolbarButton>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={insertImage} className="hidden" />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
