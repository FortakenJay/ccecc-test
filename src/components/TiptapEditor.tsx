"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faStrikethrough,
  faCode,
  faHeading,
  faListUl,
  faListOl,
  faQuoteLeft,
  faImage,
  faLink,
  faUndo,
  faRedo,
} from '@fortawesome/free-solid-svg-icons';
import { useCallback } from 'react';

interface TiptapEditorProps {
  content: any;
  onChange: (json: any) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder = 'Start writing your blog post...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 hover:text-red-700 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Bold"
        >
          <FontAwesomeIcon icon={faBold} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Italic"
        >
          <FontAwesomeIcon icon={faItalic} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Strikethrough"
        >
          <FontAwesomeIcon icon={faStrikethrough} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('code') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Code"
        >
          <FontAwesomeIcon icon={faCode} className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          type="button"
          title="Heading 1"
        >
          <FontAwesomeIcon icon={faHeading} className="w-4 h-4" />
          <span className="text-xs">1</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          type="button"
          title="Heading 2"
        >
          <FontAwesomeIcon icon={faHeading} className="w-4 h-4" />
          <span className="text-xs">2</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          type="button"
          title="Heading 3"
        >
          <FontAwesomeIcon icon={faHeading} className="w-4 h-4" />
          <span className="text-xs">3</span>
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Bullet List"
        >
          <FontAwesomeIcon icon={faListUl} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Numbered List"
        >
          <FontAwesomeIcon icon={faListOl} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Quote"
        >
          <FontAwesomeIcon icon={faQuoteLeft} className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Media */}
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200"
          type="button"
          title="Add Image"
        >
          <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
        </button>
        <button
          onClick={setLink}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
          type="button"
          title="Add Link"
        >
          <FontAwesomeIcon icon={faLink} className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          title="Undo"
        >
          <FontAwesomeIcon icon={faUndo} className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          title="Redo"
        >
          <FontAwesomeIcon icon={faRedo} className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
