import { useEditor, useValue, DefaultColorStyle, DefaultSizeStyle, DefaultFillStyle, DefaultFontStyle, DefaultTextAlignStyle } from 'tldraw';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '../../lib/utils';
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
  { value: 'l', label: 'Large', px: 6 },
  { value: 'xl', label: 'X-Large', px: 9 },
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
  { value: 'start', label: 'Left', icon: AlignLeft },
  { value: 'middle', label: 'Center', icon: AlignCenter },
  { value: 'end', label: 'Right', icon: AlignRight },
] as const;

export function TopToolbar() {
  const editor = useEditor();

  const currentColor = useValue('color', () => editor.getSharedStyles().getAsKnownValue(DefaultColorStyle), [editor]);
  const currentSize = useValue('size', () => editor.getSharedStyles().getAsKnownValue(DefaultSizeStyle), [editor]);
  const currentFill = useValue('fill', () => editor.getSharedStyles().getAsKnownValue(DefaultFillStyle), [editor]);
  const currentFont = useValue('font', () => editor.getSharedStyles().getAsKnownValue(DefaultFontStyle), [editor]);
  const currentAlign = useValue('align', () => editor.getSharedStyles().getAsKnownValue(DefaultTextAlignStyle), [editor]);
  
  const selectedShapes = useValue('selectedShapes', () => editor.getSelectedShapes(), [editor]);

  const isRichTextSelected = selectedShapes.length > 0 && selectedShapes.every((s) => (s.type as string) === 'rich-text');
  const selectedRichTextShape = isRichTextSelected && selectedShapes.length === 1 
    ? (selectedShapes[0] as unknown as IRichTextShape) 
    : null;

  const handleRichTextChange = (props: Partial<IRichTextShape['props']>) => {
    if (!isRichTextSelected) return;
    editor.updateShapes(
      selectedShapes.map((s: any) => ({
        id: s.id,
        type: 'rich-text' as any,
        props: {
          ...s.props,
          ...props,
        },
      })) as any
    );
  };

  const setStyle = (style: any, value: any) => {
    editor.setStyleForNextShapes(style, value);
    editor.setStyleForSelectedShapes(style, value);
  };

  return (
    <div className="pointer-events-auto z-50 flex items-center gap-1 rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md px-2 py-1 shadow-lg shadow-neutral-900/5 select-none whitespace-nowrap">
      {/* Colors */}
      <div className="flex items-center gap-1 px-1">
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
                "h-4.5 w-4.5 rounded-full transition-all duration-100 hover:scale-115 active:scale-95",
                isActive 
                  ? "ring-2 ring-blue-500 ring-offset-1.5 scale-110 shadow-xs" 
                  : "hover:shadow-xs"
              )}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          );
        })}
      </div>

      <div className="h-4 w-px bg-neutral-200/80 mx-1 shrink-0" />

      {/* Size / Stroke Width */}
      <div className="flex items-center">
        {isRichTextSelected ? (
          <select
            value={selectedRichTextShape?.props.fontSize || 16}
            onChange={(e) => handleRichTextChange({ fontSize: parseInt(e.target.value) })}
            className="h-7 text-xs font-medium px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-lg text-neutral-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80].map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-0.5">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(DefaultSizeStyle, s.value)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 active:scale-95",
                  currentSize === s.value 
                    ? "bg-neutral-200/90 shadow-xs" 
                    : "hover:bg-neutral-100"
                )}
                title={s.label}
              >
                <div 
                  className="rounded-full bg-neutral-800" 
                  style={{ width: s.px, height: s.px }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-neutral-200/80 mx-1 shrink-0" />

      {/* Fill */}
      <div className="flex items-center gap-0.5">
        {FILLS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStyle(DefaultFillStyle, f.value)}
            className={cn(
              "h-7 px-2 text-[11px] font-medium rounded-lg transition-all duration-150 active:scale-95",
              currentFill === f.value 
                ? "bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-200/70" 
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent"
            )}
            title={`Fill: ${f.label}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-neutral-200/80 mx-1 shrink-0" />

      {/* Font & Typography */}
      <div className="flex items-center gap-1">
        {isRichTextSelected ? (
          <div className="flex items-center gap-1">
            <select
              value={selectedRichTextShape?.props.fontFamily || 'Arial'}
              onChange={(e) => handleRichTextChange({ fontFamily: e.target.value })}
              className="h-7 text-xs font-medium px-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-lg text-neutral-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              {['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Impact'].map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
              ))}
            </select>
            <button
              onClick={() => handleRichTextChange({ fontWeight: selectedRichTextShape?.props.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={cn(
                "h-7 w-7 flex items-center justify-center text-xs font-bold rounded-lg border transition-all active:scale-95",
                selectedRichTextShape?.props.fontWeight === 'bold' 
                  ? "bg-blue-50 text-blue-600 border-blue-200/70 shadow-xs" 
                  : "bg-white border-neutral-200/80 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => handleRichTextChange({ fontStyle: selectedRichTextShape?.props.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={cn(
                "h-7 w-7 flex items-center justify-center text-xs italic font-serif rounded-lg border transition-all active:scale-95",
                selectedRichTextShape?.props.fontStyle === 'italic' 
                  ? "bg-blue-50 text-blue-600 border-blue-200/70 shadow-xs" 
                  : "bg-white border-neutral-200/80 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
              title="Italic"
            >
              I
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStyle(DefaultFontStyle, f.value)}
                className={cn(
                  "h-7 px-2 text-[11px] font-medium rounded-lg transition-all duration-150 active:scale-95",
                  currentFont === f.value 
                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-200/70" 
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent"
                )}
                title={`Font: ${f.label}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-neutral-200/80 mx-1 shrink-0" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        {ALIGNS.map((a) => {
          const Icon = a.icon;
          const mappedRichTextAlign = a.value === 'start' ? 'left' : a.value === 'middle' ? 'center' : 'right';
          const isActive = isRichTextSelected
            ? selectedRichTextShape?.props.textAlign === mappedRichTextAlign
            : currentAlign === a.value;

          return (
            <button
              key={a.value}
              onClick={() => {
                if (isRichTextSelected) {
                  handleRichTextChange({ textAlign: mappedRichTextAlign });
                } else {
                  setStyle(DefaultTextAlignStyle, a.value);
                }
              }}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-95",
                isActive 
                  ? "bg-blue-50 text-blue-600 shadow-xs border border-blue-200/70" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent"
              )}
              title={`Align ${a.label}`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.25 : 1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
