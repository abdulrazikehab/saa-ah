import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, AlignLeft, AlignCenter, 
  AlignRight, Link, Image as ImageIcon, Undo, Redo,
  LucideIcon
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  className,
  dir = 'ltr'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const updateActiveStates = () => {
    setActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    });
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateActiveStates();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    label,
    title,
    isActive
  }: { 
    onClick: () => void; 
    icon?: LucideIcon; 
    label?: React.ReactNode;
    title: string;
    isActive?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 text-white/80 hover:bg-white/10 hover:text-white transition-colors",
        isActive && "bg-white/20 text-white"
      )}
      onClick={onClick}
      title={title}
    >
      {Icon ? <Icon className="h-4 w-4" /> : label}
    </Button>
  );

  return (
    <div className={cn("border rounded-md overflow-hidden bg-background flex flex-col", className)}>
      {/* Toolbar - Dark Theme matching image */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-[#0f172a] border-b border-slate-800">
        <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} title="Redo" />
        
        <div className="w-px h-4 bg-slate-700 mx-1" />
        
        <ToolbarButton onClick={() => execCommand('insertImage', prompt('Enter image URL') || '')} icon={ImageIcon} title="Insert Image" />
        <ToolbarButton onClick={() => execCommand('createLink', prompt('Enter URL') || '')} icon={Link} title="Insert Link" />
        
        <div className="w-px h-4 bg-slate-700 mx-1" />
        
        <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} title="Align Left" isActive={activeStates.justifyLeft} />
        <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} title="Align Center" isActive={activeStates.justifyCenter} />
        <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} title="Align Right" isActive={activeStates.justifyRight} />
        
        <div className="w-px h-4 bg-slate-700 mx-1" />
        
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Ordered List" />
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Unordered List" />
        
        <div className="w-px h-4 bg-slate-700 mx-1" />
        
        {/* Real Effect Text Buttons */}
        <ToolbarButton 
          onClick={() => execCommand('strikeThrough')} 
          label={<span className="line-through font-serif text-lg">S</span>} 
          title="Strikethrough" 
          isActive={activeStates.strikeThrough} 
        />
        <ToolbarButton 
          onClick={() => execCommand('underline')} 
          label={<span className="underline font-serif text-lg">U</span>} 
          title="Underline" 
          isActive={activeStates.underline} 
        />
        <ToolbarButton 
          onClick={() => execCommand('italic')} 
          label={<span className="italic font-serif text-lg">I</span>} 
          title="Italic" 
          isActive={activeStates.italic} 
        />
        <ToolbarButton 
          onClick={() => execCommand('bold')} 
          label={<span className="font-bold font-serif text-lg">B</span>} 
          title="Bold" 
          isActive={activeStates.bold} 
        />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={updateActiveStates}
        onKeyUp={updateActiveStates}
        className={cn(
          "min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert relative overflow-y-auto",
          dir === 'rtl' ? 'text-right' : 'text-left',
          !value && "before:content-[attr(data-placeholder)] before:absolute before:text-muted-foreground before:pointer-events-none"
        )}
        dir={dir}
        data-placeholder={placeholder}
      />
    </div>
  );
}
