import { useEditor, useValue } from 'tldraw';
import type { TLShape, TLShapeId } from 'tldraw';
import { useState } from 'react';
import { CanvasTag } from './CanvasTag';
import { getAllTaggedShapes, focusTaggedShape } from '../../lib/tags/slateTags';
import { Bookmark, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CanvasTagPanelProps {
  onHighlightShape?: (shapeId: TLShapeId) => void;
}

export function CanvasTagPanel({ onHighlightShape }: CanvasTagPanelProps) {
  const editor = useEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscribe to tagged shapes reactively
  const taggedItems = useValue(
    'taggedShapes',
    () => getAllTaggedShapes(editor),
    [editor]
  );

  const selectedShapeIds = useValue(
    'selectedShapeIds',
    () => editor.getSelectedShapeIds(),
    [editor]
  );

  const getShapeLabel = (shape: TLShape): string => {
    if (shape.type === 'geo') return (shape.props as any).geo || 'Shape';
    if (shape.type === 'image') return 'Image';
    if (shape.type === 'text') return 'Text';
    if (shape.type === 'draw') return 'Drawing';
    if (shape.type === 'arrow') return 'Arrow';
    if (shape.type === 'rich-text') return 'Rich Text';
    if (shape.type === 'ai-draft') return 'AI Draft';
    if (shape.type === 'note') return 'Note';
    return shape.type;
  };

  const handleTagClick = (tag: string, shapeId: TLShapeId) => {
    setErrorMessage(null);
    const success = focusTaggedShape(
      editor,
      { shapeId, tag },
      {
        duration: 250,
        inset: 80,
        onHighlight: (id) => {
          if (onHighlightShape) {
            onHighlightShape(id);
          }
        },
        onNotFound: () => {
          setErrorMessage('Element no longer exists');
          setTimeout(() => setErrorMessage(null), 3000);
        },
      }
    );

    if (!success) {
      setErrorMessage('Element no longer exists');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="pointer-events-auto z-40 flex flex-col w-64 bg-white/95 backdrop-blur-sm border border-neutral-200/90 rounded-xl shadow-lg shadow-neutral-900/5 overflow-hidden transition-all duration-200">
      {/* Header */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50/80 border-b border-neutral-200/80 cursor-pointer select-none hover:bg-neutral-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark size={15} className="text-blue-600" />
          <span className="text-xs font-semibold text-neutral-800 tracking-tight">Canvas References</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 font-medium">
            {taggedItems.length}
          </span>
        </div>
        <button
          className="text-neutral-400 hover:text-neutral-600 p-0.5"
          aria-label={collapsed ? 'Expand References' : 'Collapse References'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="flex flex-col p-2 max-h-64 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {taggedItems.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-neutral-400 leading-relaxed">
              No references yet.<br />
              <span className="text-[11px] text-neutral-500">Right-click any shape and select <strong className="text-neutral-700 font-semibold">"Tag"</strong> to create one.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {taggedItems.map(({ shape, tag }) => {
                const isSelected = selectedShapeIds.includes(shape.id);
                return (
                  <CanvasTag
                    key={`${shape.id}-${tag}`}
                    tag={tag}
                    shapeName={getShapeLabel(shape)}
                    isSelected={isSelected}
                    onClick={() => handleTagClick(tag, shape.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
