'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabaseAuth } from '@/lib/api';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !pass.trim()) return;
    setLoading(true);
    setError('');

    const { error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (authError) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    // Supabase guarda la sesión automáticamente en localStorage
    // No necesitamos hacer nada más
    onLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f2]">
      <div className="w-full max-w-sm rounded-3xl border border-[#e5eae1] bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#40562a] text-white">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#243126]">Dietética Romero</h1>
          <p className="mt-1 text-sm text-[#849083]">Ingresá tus credenciales</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-[#788778]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#9ab498] focus:ring-2 focus:ring-[#dcebd8]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold text-[#788778]">
              Contraseña
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-4 text-sm outline-none focus:border-[#9ab498] focus:ring-2 focus:ring-[#dcebd8]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[#f0b9b3] bg-[#fdf0ee] px-4 py-3 text-xs font-semibold text-[#ba4a3a]">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email.trim() || !pass.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3.5 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-[#b0b8af]">
          Acceso protegido · Supabase Auth
        </p>
      </div>
    </div>
  );
}