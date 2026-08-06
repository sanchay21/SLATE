
import { LeftToolbar } from '../ui/LeftToolbar';
import { TopToolbar } from '../ui/TopToolbar';

export function CustomUI() {
  return (
    <div className="pointer-events-none absolute inset-0 flex h-full w-full">
      <LeftToolbar />
      <div className="flex h-full flex-1 flex-col">
        <TopToolbar />
      </div>
    </div>
  );
}
