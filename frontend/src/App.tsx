import { useState, useEffect } from 'react';
import { Canvas } from './components/canvas/Canvas';
import { supabase } from './lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div className="absolute top-4 right-4 z-50 flex items-center gap-4 bg-white p-2 rounded-lg shadow">
        {user.user_metadata.avatar_url && (
          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
        )}
        <span className="text-sm font-medium">{user.user_metadata.name || user.email}</span>
        <button 
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Sign out
        </button>
      </div>
      <Canvas />
    </div>
  );
}

export default App;
