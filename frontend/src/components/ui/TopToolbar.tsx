import { useEditor, useValue, DefaultColorStyle, DefaultSizeStyle, DefaultFillStyle, DefaultFontStyle, DefaultTextAlignStyle, createShapeId } from 'tldraw';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { extractContext } from '../../lib/ai/context';
import { askAi } from '../../lib/ai/client';
import { getPlacementCoordinates } from '../../lib/ai/placement';
import type { IRichTextShape } from '../canvas/shapes/RichTextShape';

const COLORS = [
  { value: 'black', label: 'Black', hex: '#1e1e1e' },
  { value: 'grey', label: 'Grey', hex: '#7e7e7e' },
  { value: 'light-violet', label: 'Violet', hex: '#a855f7' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'light-blue', label: 'Light Blue', hex: '#06b6d4' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
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

const FONTS = [
  { value: 'draw', label: 'Draw' },
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Mono' },
] as const;

const ALIGNS = [
  { value: 'start', label: 'Left', icon: 'AlignLeft' },
  { value: 'middle', label: 'Center', icon: 'AlignCenter' },
  { value: 'end', label: 'Right', icon: 'AlignRight' },
] as const;

export function TopToolbar() {
  const editor = useEditor();
  const [isLoading, setIsLoading] = useState(false);

  const currentColor = useValue('color', () => editor.getSharedStyles().getAsKnownValue(DefaultColorStyle), [editor]);
  const currentSize = useValue('size', () => editor.getSharedStyles().getAsKnownValue(DefaultSizeStyle), [editor]);
  const currentFill = useValue('fill', () => editor.getSharedStyles().getAsKnownValue(DefaultFillStyle), [editor]);
  const currentFont = useValue('font', () => editor.getSharedStyles().getAsKnownValue(DefaultFontStyle), [editor]);
  const currentAlign = useValue('align', () => editor.getSharedStyles().getAsKnownValue(DefaultTextAlignStyle), [editor]);
  
  const selectedShapeIds = useValue('selectedShapeIds', () => editor.getSelectedShapeIds(), [editor]);
  const selectedShapes = useValue('selectedShapes', () => editor.getSelectedShapes(), [editor]);
  const hasSelection = selectedShapeIds.length > 0;

  const isRichTextSelected = selectedShapes.every((s) => s.type === 'rich-text');
  const selectedRichTextShape = isRichTextSelected && selectedShapes.length === 1 
    ? (selectedShapes[0] as IRichTextShape) 
    : null;

  const handleRichTextChange = (props: Partial<IRichTextShape['props']>) => {
    if (!isRichTextSelected) return;
    editor.updateShapes(
      selectedShapes.map((s) => ({
        id: s.id,
        type: 'rich-text',
        props: {
          ...s.props,
          ...props,
        },
      }))
    );
  };

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
    <div className="pointer-events-auto z-50 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 shadow-sm">
      {/* Colors */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Color</span>
        <div className="flex gap-1">
          {COLORS.map((c) => {
            const isActive = isRichTextSelected 
              ? selectedRichTextShape?.props.color === c.hex
              : currentColor === c.value;
              
            return (
              <button
                key={c.value}
                onClick={() => {
                  if (isRichTextSelected) {
                    handleRichTextChange({ color: c.hex });
                  } else {
                    setStyle(DefaultColorStyle, c.value);
                  }
                }}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-all",
                  isActive ? "border-blue-500 scale-110" : "border-transparent hover:scale-110"
                )}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            );
          })}
        </div>
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      {/* Stroke Width / Rich Text Size */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Size</span>
        {isRichTextSelected ? (
          <select
            value={selectedRichTextShape?.props.fontSize || 16}
            onChange={(e) => handleRichTextChange({ fontSize: parseInt(e.target.value) })}
            className="border rounded p-1 text-sm bg-white"
          >
            {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        ) : (
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
        )}
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

      {/* Font */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Font</span>
        {isRichTextSelected ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedRichTextShape?.props.fontFamily || 'Arial'}
              onChange={(e) => handleRichTextChange({ fontFamily: e.target.value })}
              className="border rounded p-1 text-sm bg-white"
            >
              {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Impact'].map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
              ))}
            </select>
            <button
              onClick={() => handleRichTextChange({ fontWeight: selectedRichTextShape?.props.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={cn(
                "px-2 py-1 text-xs font-bold rounded-md border",
                selectedRichTextShape?.props.fontWeight === 'bold' ? "bg-neutral-200 border-neutral-400" : "bg-white border-neutral-200 hover:bg-neutral-50"
              )}
            >
              B
            </button>
            <button
              onClick={() => handleRichTextChange({ fontStyle: selectedRichTextShape?.props.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={cn(
                "px-2 py-1 text-xs italic rounded-md border",
                selectedRichTextShape?.props.fontStyle === 'italic' ? "bg-neutral-200 border-neutral-400" : "bg-white border-neutral-200 hover:bg-neutral-50"
              )}
            >
              I
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStyle(DefaultFontStyle, f.value)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                  currentFont === f.value 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
                title={f.label}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-neutral-200" />

      {/* Align */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-neutral-500">Align</span>
        <div className="flex gap-1">
          {ALIGNS.map((a) => {
            const isActive = isRichTextSelected
              ? selectedRichTextShape?.props.textAlign === a.value
              : currentAlign === a.value;

            return (
              <button
                key={a.value}
                onClick={() => {
                  if (isRichTextSelected) {
                    handleRichTextChange({ textAlign: a.value });
                  } else {
                    setStyle(DefaultTextAlignStyle, a.value);
                  }
                }}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
                title={a.label}
              >
                {a.label}
              </button>
            );
          })}
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
