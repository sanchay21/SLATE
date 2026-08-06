import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { CustomUI } from './CustomUI';

export function Canvas() {
  return (
    <div className="absolute inset-0 h-full w-full bg-neutral-50">
      <Tldraw hideUi={true}>
        <CustomUI />
      </Tldraw>
    </div>
  );
}
