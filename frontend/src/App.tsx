import { useState, useEffect } from 'react';
import { Canvas } from './components/canvas/Canvas';
import { supabase } from './lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Editor, TLShapeId } from 'tldraw';
import { CometChatProvider, CometChatIncomingCall } from '@cometchat/chat-uikit-react';
import { ensureLoggedIn, logoutCometChat } from './lib/cometchat/cometchatClient';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { focusTaggedShape } from './lib/tags/slateTags';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [insertedTag, setInsertedTag] = useState<string | null>(null);
  const [highlightedShapeId, setHighlightedShapeId] = useState<TLShapeId | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        ensureLoggedIn(
          currentUser.id,
          currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
          currentUser.user_metadata?.avatar_url
        ).catch((err) => console.error('CometChat init error:', err));
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        ensureLoggedIn(
          currentUser.id,
          currentUser.user_metadata?.name || currentUser.email?.split('@')[0],
          currentUser.user_metadata?.avatar_url
        ).catch((err) => console.error('CometChat login error:', err));
      } else {
        logoutCometChat().catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const signOut = async () => {
    await logoutCometChat();
    await supabase.auth.signOut();
  };

  const handleTagCreated = (tag: string) => {
    setInsertedTag(tag);
    setIsChatOpen(true);
  };

  const handleTagClick = (tag: string) => {
    if (editor) {
      focusTaggedShape(
        editor,
        { tag },
        {
          onHighlight: (shapeId) => {
            setHighlightedShapeId(shapeId);
          },
        }
      );
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold mb-8">Welcome to SLATE</h1>
        <button 
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <CometChatProvider theme="light">
      <div className="h-screen w-screen flex flex-col overflow-hidden relative">
        {/* Incoming Call Component Mounted at Root */}
        <CometChatIncomingCall />

        {/* Tldraw Canvas with CustomUI */}
        <Canvas
          user={user}
          onTagCreated={handleTagCreated}
          onEditorReady={(ed) => setEditor(ed)}
          highlightedShapeId={highlightedShapeId}
          onClearHighlight={() => setHighlightedShapeId(null)}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onSignOut={signOut}
        />

        {/* CometChat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          insertedTag={insertedTag}
          onClearInsertedTag={() => setInsertedTag(null)}
          onTagClick={handleTagClick}
        />
      </div>
    </CometChatProvider>
  );
}

export default App;

