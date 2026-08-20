import { createClient } from '@supabase/supabase-js';
import type {
  Movimiento,
  ArqueoDiario,
  MetodoPago,
  GastoFijo,
  SaldoApertura,
  DiferenciaArqueo,
} from '@/lib/supabase';

export const supabaseAuth = createClient(
  'https://tqvdfxuetpdoqskyqjcc.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getToken(): Promise<string> {
  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session?.access_token) throw new Error('No hay sesión activa');
  return session.access_token;
}

async function dbRequest<T>(
  action: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const token = await getToken();

  const res = await fetch('/api/db', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-api-secret': process.env.NEXT_PUBLIC_API_SECRET!,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('🔴 ERROR EN API DB:', res.status, err);
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

export const db = {
  updateMovimiento: async (
    id: string,
    row: {
      concepto: string;
      entrada: number;
      salida: number;
      metodo: string;
      categoria?: string | null;
    }
  ): Promise<void> => {
    await dbRequest('updateMovimiento', { id, ...row });
  },

  getReportesData: async (
    inicio: string,
    fin: string
  ): Promise<{
    saldos: SaldoApertura[];
    movimientos: Movimiento[];
    arqueos: ArqueoDiario[];
  }> => {
    const res = await dbRequest<{
      saldos: SaldoApertura[];
      movimientos: Movimiento[];
      arqueos: ArqueoDiario[];
    }>('getReportesData', { inicio, fin });

    return {
      saldos: res.saldos ?? [],
      movimientos: res.movimientos ?? [],
      arqueos: res.arqueos ?? [],
    };
  },

  getDashboardData: async (
    inicio: string,
    fin: string,
    periodo: string
  ): Promise<{
    movimientos: Movimiento[];
    arqueos: ArqueoDiario[];
    gastosFijos: GastoFijo[];
    apertura: SaldoApertura | null;
  }> => {
    const res = await dbRequest<{
      movimientos: Movimiento[];
      arqueos: ArqueoDiario[];
      gastosFijos: GastoFijo[];
      apertura: SaldoApertura | null;
    }>('getDashboardData', { inicio, fin, periodo });

    return {
      movimientos: res.movimientos ?? [],
      arqueos: res.arqueos ?? [],
      gastosFijos: res.gastosFijos ?? [],
      apertura: res.apertura ?? null,
    };
  },

  getMovimientosMes: async (inicio: string, fin: string): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosMes',
      { inicio, fin }
    );
    return data ?? [];
  },

  getMovimientosMesDesc: async (inicio: string, fin: string): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosMesDesc',
      { inicio, fin }
    );
    return data ?? [];
  },

  getMovimientosDia: async (fecha: string, metodo?: MetodoPago): Promise<Movimiento[]> => {
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'getMovimientosDia',
      { fecha, metodo }
    );
    return data ?? [];
  },

  getArqueoMes: async (inicio: string, fin: string): Promise<ArqueoDiario | null> => {
    const { data } = await dbRequest<{ data: ArqueoDiario[] }>(
      'getArqueoMes',
      { inicio, fin }
    );
    return data?.[0] ?? null;
  },

  getArqueoDia: async (fecha: string): Promise<ArqueoDiario | null> => {
    const { data } = await dbRequest<{ data: ArqueoDiario | null }>(
      'getArqueoDia',
      { fecha }
    );
    return data ?? null;
  },

  getArqueoTotal: async (): Promise<number> => {
    const { data } = await dbRequest<{ data: { a_caja_fuerte: number }[] }>(
      'getArqueoTotal'
    );
    return (data ?? []).reduce((s, r) => s + Number(r.a_caja_fuerte), 0);
  },

  getArqueosMes: async (inicio: string, fin: string): Promise<ArqueoDiario[]> => {
    const { data } = await dbRequest<{ data: ArqueoDiario[] }>(
      'getArqueosMes',
      { inicio, fin }
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

  upsertSaldoApertura: async (row: SaldoApertura): Promise<void> => {
    await dbRequest('upsertSaldoApertura', row as unknown as Record<string, unknown>);
  },

  deleteMovimientosDia: async (fecha: string): Promise<void> => {
    await dbRequest('deleteMovimientosDia', { fecha });
  },

  insertMovimientos: async (
    rows: Omit<Movimiento, 'id' | 'created_at'>[]
  ): Promise<Movimiento[]> => {
    if (rows.length === 0) return [];
    const { data } = await dbRequest<{ data: Movimiento[] }>(
      'insertMovimientos',
      { rows }
    );
    return data ?? [];
  },

  upsertArqueo: async (
    arqueo: Partial<ArqueoDiario> & { fecha: string }
  ): Promise<void> => {
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

  insertDiferencia: async (
    row: Omit<DiferenciaArqueo, 'id' | 'created_at'>
  ): Promise<DiferenciaArqueo | null> => {
    const { data } = await dbRequest<{ data: DiferenciaArqueo[] }>(
      'insertDiferencia',
      row as Record<string, unknown>
    );
    return data?.[0] ?? null;
  },

  getDiferenciasMes: async (inicio: string, fin: string): Promise<DiferenciaArqueo[]> => {
    const { data } = await dbRequest<{ data: DiferenciaArqueo[] }>(
      'getDiferenciasMes',
      { inicio, fin }
    );
    return data ?? [];
  },

  deleteDiferencia: async (id: string): Promise<void> => {
    await dbRequest('deleteDiferencia', { id });
  },
};