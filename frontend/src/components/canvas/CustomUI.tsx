
import { LeftToolbar } from '../ui/LeftToolbar';
import { TopToolbar } from '../ui/TopToolbar';
import { RightSidebar } from '../ui/RightSidebar';
import { CanvasTagPanel } from './CanvasTagPanel';
import type { TLShapeId } from 'tldraw';

interface CustomUIProps {
  onHighlightShape?: (shapeId: TLShapeId) => void;
}

export function CustomUI({ onHighlightShape }: CustomUIProps) {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <LeftToolbar />
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex justify-center">
        <TopToolbar />
      </div>

      <div className="absolute right-4 top-20 bottom-4">
        <RightSidebar />
      </div>

      <div className="absolute left-4 bottom-4">
        <CanvasTagPanel onHighlightShape={onHighlightShape} />
      </div>
    </div>
  );
}
