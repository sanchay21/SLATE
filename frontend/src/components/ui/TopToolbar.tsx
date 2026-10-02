import { useEditor, useValue, DefaultColorStyle, DefaultSizeStyle, DefaultFillStyle, createShapeId } from 'tldraw';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { extractContext } from '../../lib/ai/context';
import { askAi } from '../../lib/ai/client';
import { getPlacementCoordinates } from '../../lib/ai/placement';

const COLORS = [
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
] as const;

const SIZES = [
  { value: 's', label: 'Small', px: 2 },
  { value: 'm', label: 'Medium', px: 4 },
  { value: 'l', label: 'Large', px: 8 },
  { value: 'xl', label: 'X-Large', px: 12 },
] as const;

const FILLS = [
  { value: 'none', label: 'None' },
  { value: 'semi', label: 'Semi' },
  { value: 'solid', label: 'Solid' },
  { value: 'pattern', label: 'Pattern' },
] as const;

export function TopToolbar() {
  const editor = useEditor();
  const [isLoading, setIsLoading] = useState(false);

  const currentColor = useValue('color', () => editor.getSharedStyles().getAsKnownValue(DefaultColorStyle), [editor]);
  const currentSize = useValue('size', () => editor.getSharedStyles().getAsKnownValue(DefaultSizeStyle), [editor]);
  const currentFill = useValue('fill', () => editor.getSharedStyles().getAsKnownValue(DefaultFillStyle), [editor]);
  
  const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor]);
  const hasSelection = selectedShapeIds.length > 0;

  const setStyle = (style: any, value: any) => {
    editor.setStyleForNextShapes(style, value);
    editor.setStyleForSelectedShapes(style, value);
  };

  const handleAskAi = async () => {
    if (!hasSelection || isLoading) return;
    
    setIsLoading(true);
    try {
      const context = await extractContext(editor, 100);
      if (!context) return;
      
      const response = await askAi(context);
      
      const { x, y } = getPlacementCoordinates(editor, context);
      
      const id = createShapeId();
      editor.createShape({
        id,
        type: 'ai-draft',
        x,
        y,
        props: {
          w: 400,
          h: 300,
          text: response,
          isDraft: true
        }
      });
      
    } catch (e) {
      console.error(e);
      alert('Error asking AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto z-50 m-4 flex items-center gap-6 rounded-xl border border-neutral-200 bg-white px-4 py-2 shadow-sm self-center">
      {/* Colors */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Color</span>
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setStyle(DefaultColorStyle, c.value)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-all",
                currentColor === c.value ? "border-blue-500 scale-110" : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      {/* Stroke Width */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Size</span>
        <div className="flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(DefaultSizeStyle, s.value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                currentSize === s.value ? "bg-neutral-200" : "hover:bg-neutral-100"
              )}
              title={s.label}
            >
              <div 
                className="rounded-full bg-black" 
                style={{ width: s.px, height: s.px }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      {/* Fill */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Fill</span>
        <div className="flex gap-1">
          {FILLS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStyle(DefaultFillStyle, f.value)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                currentFill === f.value 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
              title={f.label}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      {/* Ask AI */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAskAi}
          disabled={!hasSelection || isLoading}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2",
            hasSelection && !isLoading
              ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg" 
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Thinking...
            </>
          ) : (
            'Ask AI'
          )}
        </button>
      </div>
    </div>
  );
}
