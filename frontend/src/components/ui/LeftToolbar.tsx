import React from 'react';
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
  ImagePlus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { createShapeId } from 'tldraw';
import { openSvgOrImagePicker } from '../../lib/assets/slateAssetHelper';

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
    { id: 'upload-svg', icon: ImagePlus, label: 'Upload SVG / Image', isUpload: true },
  ];

  // Tool divider after specific tool IDs for clean visual hierarchy
  const dividerAfterIds = new Set(['hand', 'eraser', 'star']);

  return (
    <div className="pointer-events-auto z-50 flex flex-col gap-0.5 rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-1 shadow-lg shadow-neutral-900/5 select-none">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = tool.geo
          ? currentToolId === 'geo' && currentGeo === tool.geo
          : currentToolId === tool.id;
        
        return (
          <React.Fragment key={tool.id}>
            <button
              onClick={() => {
                if ((tool as any).isUpload) {
                  openSvgOrImagePicker(editor);
                } else if (tool.isAction && tool.id === 'rich-text') {
                  const center = editor.getViewportPageBounds().center;
                  const id = createShapeId();
                  editor.createShape({
                    id,
                    type: 'rich-text' as any,
                    x: center.x - 125,
                    y: center.y - 50,
                  });
                  editor.select(id);
                } else if (tool.geo) {
                  editor.setStyleForNextShapes(GeoShapeGeoStyle, tool.geo as any);
                  editor.setCurrentTool('geo');
                } else {
                  editor.setCurrentTool(tool.id);
                }
              }}
              title={tool.label}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95",
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-xs border border-blue-200/70" 
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 border border-transparent"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
            </button>
            {dividerAfterIds.has(tool.id) && (
              <div className="h-px bg-neutral-200/70 my-0.5 mx-1" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
