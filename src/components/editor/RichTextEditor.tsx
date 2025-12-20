"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Link as LinkIcon, Unlink, List, ListOrdered } from 'lucide-react'
import clsx from 'clsx'
import './editor.css'

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-cyan-400 hover:text-cyan-300 underline',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-slate-300 text-sm leading-relaxed',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()

      return
    }

    // update
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20 focus-within:border-cyan-500/50 transition-colors">

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive('bold') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          )}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive('italic') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          )}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onClick={setLink}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive('link') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          )}
          title="Link"
        >
          <LinkIcon size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-1.5 rounded transition-colors text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
          title="Unlink"
        >
          <Unlink size={16} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive('bulletList') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          )}
          title="Bullet List"
        >
          <List size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive('orderedList') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
          )}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>

      </div>

      {/* Editor Content */}
      <div className="p-4 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
