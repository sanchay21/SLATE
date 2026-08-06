import { useEditor, useValue } from 'tldraw';
import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function LeftToolbar() {
  const editor = useEditor();
  const currentToolId = useValue('current tool id', () => editor.getCurrentToolId(), [editor]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="pointer-events-auto z-50 m-4 flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentToolId === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => editor.setCurrentTool(tool.id)}
            title={tool.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive 
                ? "bg-blue-100 text-blue-600" 
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
}
