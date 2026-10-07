import { LeftToolbar } from '../ui/LeftToolbar';
import { TopToolbar } from '../ui/TopToolbar';
import { RightSidebar } from '../ui/RightSidebar';
import { ExportMenu } from '../ui/ExportMenu';
import { CanvasTagPanel } from './CanvasTagPanel';
import type { TLShapeId } from 'tldraw';
import { MessageSquare, LogOut } from 'lucide-react';

interface CustomUIProps {
  onHighlightShape?: (shapeId: TLShapeId) => void;
  user?: any;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onSignOut?: () => void;
}

export function CustomUI({
  onHighlightShape,
  user,
  isChatOpen,
  onToggleChat,
  onSignOut,
}: CustomUIProps) {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden">
      {/* Left Toolbar */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <LeftToolbar />
      </div>

      {/* Top Center Shape Styles & AI Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex justify-center">
        <TopToolbar />
      </div>

      {/* Top Right Header (Export, Chat, Profile & Sign out) */}
      <div className="absolute top-4 right-4 z-[60] flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg shadow-neutral-900/5 border border-neutral-200/90 pointer-events-auto select-none">
        <ExportMenu />

        {onToggleChat && (
          <>
            <div className="h-4 w-px bg-neutral-200 mx-0.5" />
            <button
              onClick={onToggleChat}
              className={`px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs font-medium active:scale-95 cursor-pointer ${
                isChatOpen
                  ? 'bg-blue-50 text-blue-600 shadow-xs border border-blue-200/70'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent'
              }`}
              title="Chat & Voice/Video Collaboration"
            >
              <MessageSquare size={14} />
              <span>Chat</span>
            </button>
          </>
        )}

        {user && (
          <>
            <div className="h-4 w-px bg-neutral-200 mx-0.5" />
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover"
                title={user.user_metadata.name || user.email}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold"
                title={user.email}
              >
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar (Layers & Assets) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <RightSidebar />
      </div>

      {/* Bottom Left Tag Panel */}
      <div className="absolute left-4 bottom-4">
        <CanvasTagPanel onHighlightShape={onHighlightShape} />
      </div>
    </div>
  );
}
