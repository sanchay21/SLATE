import { useEditor, useValue, GeoShapeGeoStyle } from 'tldraw';
import { 
  MousePointer2, 
  Hand,
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Diamond,
  Triangle,
  Star,
  StickyNote,
  Minus, 
  ArrowRight, 
  Type,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { createShapeId } from 'tldraw';

export function LeftToolbar() {
  const editor = useEditor();
  const currentToolId = useValue('current tool id', () => editor.getCurrentToolId(), [editor]);
  const currentGeo = useValue('geo style', () => editor.getSharedStyles().getAsKnownValue(GeoShapeGeoStyle), [editor]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'hand', icon: Hand, label: 'Hand' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle', geo: 'rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', geo: 'ellipse' },
    { id: 'diamond', icon: Diamond, label: 'Diamond', geo: 'diamond' },
    { id: 'triangle', icon: Triangle, label: 'Triangle', geo: 'triangle' },
    { id: 'star', icon: Star, label: 'Star', geo: 'star' },
    { id: 'note', icon: StickyNote, label: 'Sticky Note' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'rich-text', icon: Type, label: 'Text', isAction: true },
  ];

  return (
    <div className="pointer-events-auto z-50 flex flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm max-h-[calc(100vh-2rem)] overflow-y-auto">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = tool.geo
          ? currentToolId === 'geo' && currentGeo === tool.geo
          : currentToolId === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.isAction && tool.id === 'rich-text') {
                const center = editor.getViewportPageBounds().center;
                const id = createShapeId();
                editor.createShape({
                  id,
                  type: 'rich-text',
                  x: center.x - 125,
                  y: center.y - 50,
                });
                editor.setSelectedShapeIds([id]);
              } else if (tool.geo) {
                editor.setStyleForNextShapes(GeoShapeGeoStyle, tool.geo as any);
                editor.setCurrentTool('geo');
              } else {
                editor.setCurrentTool(tool.id);
              }
            }}
            title={tool.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold" 
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
}
