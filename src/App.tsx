import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import BankStatementForm from './components/BankStatementForm';
import { AuthForm } from './components/AuthForm';
import { supabase } from './lib/supabase';
import { Button } from './components/ui';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        Завантаження...
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

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between text-slate-200">
          <div>
            <h1 className="text-xl font-semibold">REVA</h1>
            <p className="text-xs text-slate-400">
              Увійшов як {session.user.email}
            </p>
          </div>
          <Button variant="danger" onClick={handleSignOut}>
            Вийти
          </Button>
        </header>

        <BankStatementForm />
      </div>
    </div>
  );
}

