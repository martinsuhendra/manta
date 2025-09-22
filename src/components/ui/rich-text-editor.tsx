"use client";

import * as React from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter content...",
  disabled = false,
  className
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={cn("min-h-[100px] border rounded-md bg-background", className)}>
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rich-text-editor border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 1 }) && 'bg-accent'
          )}
          disabled={disabled}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 2 }) && 'bg-accent'
          )}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('heading', { level: 3 }) && 'bg-accent'
          )}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') && 'bg-accent'
          )}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') && 'bg-accent'
          )}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') && 'bg-accent'
          )}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') && 'bg-accent'
          )}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className={cn("prose prose-sm max-w-none", disabled && "opacity-50")}>
        <EditorContent
          editor={editor}
          className="min-h-[100px] max-h-[200px] overflow-y-auto p-3 focus:outline-none"
        />
      </div>

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 100px;
          max-height: 200px;
          overflow-y: auto;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor .prose ul,
        .prose ul {
          list-style-type: disc !important;
          margin-left: 0.75rem !important;
          padding-left: 0.5rem !important;
        }
        .rich-text-editor .prose ol,
        .prose ol {
          list-style-type: decimal !important;
          margin-left: 0.75rem !important;
          padding-left: 0.5rem !important;
        }
        .rich-text-editor .prose li,
        .prose li {
          margin-left: 0 !important;
          padding-left: 0.125rem !important;
          display: list-item !important;
        }
        .rich-text-editor .prose h1,
        .rich-text-editor .prose h2,
        .rich-text-editor .prose h3 {
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .rich-text-editor .prose h1 { font-size: 1.25rem; }
        .rich-text-editor .prose h2 { font-size: 1.125rem; }
        .rich-text-editor .prose h3 { font-size: 1rem; }
        .rich-text-editor .prose p {
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .prose strong {
          font-weight: 600;
        }
        .rich-text-editor .prose em {
          font-style: italic;
        }
        .rich-text-editor .prose a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}