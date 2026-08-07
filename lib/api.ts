// lib/api.ts
import { createClient } from '@supabase/supabase-js';
import type {
  Movimiento,
  ArqueoDiario,
  MetodoPago,
  GastoFijo,
  SaldoApertura,
} from '@/lib/supabase';
// ─── Cliente Supabase Auth (SOLO para autenticación, no para queries) ─────────
// Usa la anon key porque solo la necesitamos para obtener el JWT del usuario
// Esta clave con RLS activado no da acceso a los datos
export const supabaseAuth = createClient(
  'https://tqvdfxuetpdoqskyqjcc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Helper: obtiene el JWT del usuario logueado ──────────────────────────────
async function getToken(): Promise<string> {
  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session?.access_token) throw new Error('No hay sesión activa');
  return session.access_token;
}

// ─── Helper base ──────────────────────────────────────────────────────────────
async function dbRequest<T>(
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const token = await getToken();

  const res = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // JWT del usuario — expira cada hora, Supabase lo refresca automáticamente
      // Si alguien lo intercepta, solo vale mientras dure la sesión
      'Authorization': `Bearer ${token}`,
      // Secreto adicional que evita llamadas directas a /api/db desde afuera
      'x-api-secret': process.env.NEXT_PUBLIC_API_SECRET!,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("🔴 ERROR EN API DB:", res.status, err); // ← AGREGÁ ESTO
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

// ─── API pública ───────────────────────────────────────────────────────────────
export const db = {

  getMovimientosMes: async (inicio: string, fin: string): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosMes', { inicio, fin }
    );
    return data ?? [];
  },

  getMovimientosMesDesc: async (inicio: string, fin: string): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosMesDesc', { inicio, fin }
    );
    return data ?? [];
  },

  getArqueoMes: async (inicio: string, fin: string): Promise<ArqueoDiario | null> => {
    const { data } = await dbRequest<{ data: ArqueoDiario[] }>(
      'getArqueoMes', { inicio, fin }
    );
    return data?.[0] ?? null;
  },

  getArqueoTotal: async (): Promise<number> => {
    const { data } = await dbRequest<{ data: { a_caja_fuerte: number }[] }>(
      'getArqueoTotal'
    );
    return (data ?? []).reduce((s, r) => s + Number(r.a_caja_fuerte), 0);
  },

  getMovimientosDia: async (fecha: string, metodo?: MetodoPago): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosDia', { fecha, metodo }
    );
    return data ?? [];
  },

    getSaldoApertura: async (periodo: string): Promise<SaldoApertura | null> => {
    const { data } = await dbRequest<{ data: SaldoApertura | null }>(
      'getSaldoApertura',
      { periodo }
    );
    return data ?? null;
  },

    getSaldosApertura: async (): Promise<SaldoApertura[]> => {
    const { data } = await dbRequest<{ data: SaldoApertura[] }>(
      'getSaldosApertura'
    );
    return data ?? [];
  },

  getArqueosMes: async (inicio: string, fin: string): Promise<ArqueoDiario[]> => {
    const { data } = await dbRequest<{ data: ArqueoDiario[] }>(
      'getArqueosMes',
      { inicio, fin }
    );
    return data ?? [];
  },

  upsertSaldoApertura: async (row: SaldoApertura): Promise<void> => {
    await dbRequest('upsertSaldoApertura', row as unknown as Record<string, unknown>);
  },

  deleteMovimientosDia: async (fecha: string): Promise<void> => {
    await dbRequest('deleteMovimientosDia', { fecha });
  },

  insertMovimientos: async (rows: Omit<Movimiento, 'id' | 'created_at'>[]): Promise<Movimiento[]> => {
    if (rows.length === 0) return [];
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'insertMovimientos', { rows }
    );
    return data ?? [];
  },

  upsertArqueo: async (arqueo: Partial<ArqueoDiario> & { fecha: string }): Promise<void> => {
    await dbRequest('upsertArqueo', arqueo as Record<string, unknown>);
  },

    getGastosFijos: async (periodo: string): Promise<GastoFijo[]> => {
    const { data } = await dbRequest<{ data: GastoFijo[] }>(
      'getGastosFijos',
      { periodo }
    );
    return data ?? [];
  },

  insertGastoFijo: async (
    row: Omit<GastoFijo, 'id'>
  ): Promise<GastoFijo | null> => {
    const { data } = await dbRequest<{ data: GastoFijo[] }>(
      'insertGastoFijo',
      row as Record<string, unknown>
    );
    return data?.[0] ?? null;
  },

  deleteGastoFijo: async (id: string): Promise<void> => {
    await dbRequest('deleteGastoFijo', { id });
  },

  deleteMovimiento: async (id: string): Promise<void> => {
    await dbRequest('deleteMovimiento', { id });
  },
};