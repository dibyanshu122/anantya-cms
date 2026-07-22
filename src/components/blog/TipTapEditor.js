import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FiBold, FiItalic, FiUnderline, FiAlignLeft, FiAlignCenter,
  FiAlignRight, FiList, FiLink, FiImage, FiCode, FiList as FiTOC
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import MediaSelector from '../common/MediaSelector';

const MenuBar = ({ editor }) => {
  const [showMediaSelector, setShowMediaSelector] = React.useState(false);

  if (!editor) return null;

  const btnClass = (active) => `toolbar-btn ${active ? 'is-active' : ''}`;

  const setLink = () => {
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    setShowMediaSelector(true);
  };

  const generateTOC = () => {
    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2, h3'));
    
    if (headings.length === 0) {
      toast.error('No H2 or H3 headings found for TOC', { id: 'toc' });
      return;
    }

    let tocHTML = '<div class="blog-toc"><h3>Table of Contents</h3><ul>';
    headings.forEach((el) => {
      const text = el.textContent;
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      el.id = id;
      tocHTML += `<li><a href="#${id}">${text}</a></li>`;
    });
    tocHTML += '</ul></div><hr/>';

    const newBody = tocHTML + doc.body.innerHTML;
    editor.commands.setContent(newBody, true);
    toast.success('Table of Contents generated!', { id: 'toc' });
  };

  return (
    <div className="tiptap-toolbar">
      {/* Headings */}
      <select 
        className="form-select toolbar-select"
        onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level === 0) editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level }).run();
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? 1 :
          editor.isActive('heading', { level: 2 }) ? 2 :
          editor.isActive('heading', { level: 3 }) ? 3 :
          editor.isActive('heading', { level: 4 }) ? 4 : 0
        }
      >
        <option value={0}>Paragraph</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
        <option value={4}>Heading 4</option>
      </select>

      <div className="toolbar-divider" />

      {/* Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold"
        type="button"
      >
        <FiBold size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic"
        type="button"
      >
        <FiItalic size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline"
        type="button"
      >
        <FiUnderline size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="Align Left"
        type="button"
      >
        <FiAlignLeft size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="Align Center"
        type="button"
      >
        <FiAlignCenter size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="Align Right"
        type="button"
      >
        <FiAlignRight size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
        type="button"
      >
        <FiList size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Media */}
      <button
        onClick={addImage}
        className={btnClass(editor.isActive('image'))}
        title="Insert Image"
        type="button"
      >
        <FiImage size={15} />
      </button>

      {showMediaSelector && (
        <MediaSelector 
          onSelect={(url) => {
            const altText = window.prompt("Enter Image Alt Text (SEO):", "");
            const titleText = window.prompt("Enter Image Title (Optional):", "");
            editor.chain().focus().setImage({ src: url, alt: altText || '', title: titleText || '' }).run();
            setShowMediaSelector(false);
          }} 
          onClose={() => setShowMediaSelector(false)} 
        />
      )}

      <div className="toolbar-divider" />

      {/* Insert */}
      <button onClick={setLink} className={btnClass(editor.isActive('link'))} title="Insert Link" type="button">
        <FiLink size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive('codeBlock'))}
        title="Code Block"
        type="button"
      >
        <FiCode size={15} />
      </button>

      <div className="toolbar-divider" />

      {/* Custom Components */}
      <button
        onClick={() => {
          editor.commands.insertContent('<p><strong>[LEAD_FORM]</strong></p>');
          toast.success('Lead Form shortcode inserted!');
        }}
        className="toolbar-btn"
        title="Insert Lead Form"
        type="button"
        style={{ padding: '0 10px', fontSize: 13, width: 'auto', fontWeight: 600, color: '#f59e0b' }}
      >
        📝 Lead Form
      </button>

      <div className="toolbar-divider" />
      
      <button
        onClick={generateTOC}
        className="toolbar-btn"
        title="Generate Table of Contents"
        type="button"
        style={{ padding: '0 10px', fontSize: 13, width: 'auto', fontWeight: 600, color: 'var(--primary)' }}
      >
        <FiTOC size={14} style={{ marginRight: 6 }} /> Auto TOC
      </button>
    </div>
  );
};

export default function TipTapEditor({ content, onChange, placeholder = 'Write your blog post here...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Effect to update content when the prop changes (e.g., initial load)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); // false = don't emit update
    }
  }, [content, editor]);

  return (
    <div className="tiptap-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content-wrap" />
    </div>
  );
}
