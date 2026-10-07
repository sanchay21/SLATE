import { ChatPanel } from './ChatPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  insertedTag?: string | null;
  onClearInsertedTag?: () => void;
  onTagClick?: (tag: string) => void;
}

export function ChatDrawer({
  isOpen,
  onClose,
  insertedTag,
  onClearInsertedTag,
  onTagClick,
}: ChatDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 md:inset-auto md:right-16 md:bottom-6 md:top-auto z-[75] flex md:w-[400px] md:h-[580px] md:max-h-[calc(100vh-100px)] pointer-events-auto">
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/30 md:hidden z-[-1]"
        onClick={onClose}
      />

      {/* Main Floating Chat Window */}
      <div className="flex-1 flex flex-col bg-white rounded-none md:rounded-2xl shadow-2xl border-0 md:border md:border-neutral-200/90 overflow-hidden min-h-0">
        <ChatPanel
          onClose={onClose}
          insertedTag={insertedTag}
          onClearInsertedTag={onClearInsertedTag}
          onTagClick={onTagClick}
        />
      </div>
    </div>
  );
}
