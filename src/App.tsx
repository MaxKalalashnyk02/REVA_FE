import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import BankStatementForm from './components/BankStatementForm';
import { AuthForm } from './components/AuthForm';
import { DocumentHistory } from './components/DocumentHistory';
import { supabase } from './lib/supabase';
import { Button, Loader } from './components/ui';

type View = 'create' | 'history';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('create');
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleEdit = (documentId: string) => {
    setEditingDocumentId(documentId);
    setCurrentView('create');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between text-slate-200">
          <div>
            <h1 className="text-xl font-semibold">REVA</h1>
            <p className="text-xs text-slate-400">
              Signed in as {session.user.email}
            </p>
          </div>
          
          <div className="flex gap-3 items-center">
            <button
              onClick={() => {
                setCurrentView('create');
                setEditingDocumentId(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'create'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-transparent border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-transparent border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10'
              }`}
            >
              History
            </button>
          </div>

          <Button variant="danger" onClick={handleSignOut}>
            Sign out
          </Button>
        </header>

        {currentView === 'create' ? (
          <BankStatementForm documentId={editingDocumentId} />
        ) : (
          <DocumentHistory onEdit={handleEdit} onBack={() => setCurrentView('create')} />
        )}
      </div>
    </div>
  );
}

