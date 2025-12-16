import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Input } from './ui';

type Mode = 'signin' | 'signup';

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Введи email і пароль');
        return;
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
      <h1 className="text-xl font-semibold text-slate-50 mb-2">REVA</h1>
      <p className="text-slate-400 text-sm mb-6">
        Увійди або зареєструйся, щоб зберігати свої виписки та транзакції.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Мінімум 6 символів"
        />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isLoading}
        >
          {isLoading
            ? mode === 'signup'
              ? 'Реєстрація...'
              : 'Вхід...'
            : mode === 'signup'
              ? 'Зареєструватися'
              : 'Увійти'}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 w-full text-center text-slate-400 text-xs hover:text-slate-200 transition-colors"
        onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
      >
        {mode === 'signup'
          ? 'Вже є акаунт? Увійти'
          : 'Немає акаунта? Зареєструватися'}
      </button>
    </div>
  );
}


