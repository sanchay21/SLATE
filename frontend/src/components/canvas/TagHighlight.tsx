import { useEditor, useValue } from 'tldraw';
import type { TLShapeId } from 'tldraw';
import { useEffect, useState } from 'react';

interface TagHighlightProps {
  shapeId: TLShapeId | null;
  onComplete?: () => void;
  durationMs?: number;
}

export function TagHighlight({ shapeId, onComplete, durationMs = 1800 }: TagHighlightProps) {
  const editor = useEditor();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shapeId) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, durationMs);

    return () => clearTimeout(timer);
  }, [shapeId, durationMs, onComplete]);

  // Compute viewport bounds reactively as camera or shape transforms
  const highlightBox = useValue(
    'highlightBox',
    () => {
      if (!shapeId || !visible) return null;

      const shape = editor.getShape(shapeId);
      if (!shape) return null;

      const bounds = editor.getShapePageBounds(shapeId);
      if (!bounds) return null;

      const topLeft = editor.pageToViewport({ x: bounds.minX, y: bounds.minY });
      const bottomRight = editor.pageToViewport({ x: bounds.maxX, y: bounds.maxY });

      const tag = (shape.meta as any)?.slateTag || (shape.meta as any)?.tag;

      return {
        x: topLeft.x,
        y: topLeft.y,
        width: Math.max(1, bottomRight.x - topLeft.x),
        height: Math.max(1, bottomRight.y - topLeft.y),
        tag: typeof tag === 'string' ? tag : undefined,
      };
    },
    [editor, shapeId, visible]
  );

  if (!visible || !highlightBox) return null;

  const padding = 10;

  return (
    <div
      className="pointer-events-none absolute z-[100] transition-opacity duration-300"
      style={{
        left: highlightBox.x - padding,
        top: highlightBox.y - padding,
        width: highlightBox.width + padding * 2,
        height: highlightBox.height + padding * 2,
      }}
    >
      {/* Glowing boundary box */}
      <div className="relative w-full h-full rounded-xl border-2 border-blue-500 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.5)] animate-pulse">
        {/* Corner indicators */}
        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm" />
        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm" />

        {/* Tag badge label above shape */}
        {highlightBox.tag && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white font-mono text-xs font-semibold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            <span>{highlightBox.tag}</span>
          </div>
        )}
      </div>
    </div>
  );
}
