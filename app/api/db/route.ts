import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ─── Cliente Supabase (service key, solo servidor) ────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ─── Cache de tokens validados (5 minutos) ────────────────────────────────────
const tokenCache = new Map<string, { valid: boolean; userId: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// ─── CAMBIO #1: Simplificar autenticación - Solo validar JWT ──────────────────
async function autenticar(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  // Verificar cache primero
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.valid ? cached.userId : null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    const valid = !error && !!user;
    const userId = user?.id ?? null;

    tokenCache.set(token, { valid, userId, timestamp: Date.now() });

    // Limpiar cache si crece mucho
    if (tokenCache.size > 100) {
      const now = Date.now();
      tokenCache.forEach((v, k) => {
        if (now - v.timestamp > CACHE_TTL) tokenCache.delete(k);
      });
    }

    return valid ? userId : null;
  } catch (error) {
    console.error('[auth] Error validating token:', error);
    return null;
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type MetodoPago = 'Efectivo' | 'Debito' | 'Credito' | 'MercadoPago';
type CategoriaGasto =
  | 'PERSONAL'
  | 'OPERATIVO'
  | 'MATERIA PRIMA'
  | 'DESECHABLES'
  | 'EXTRAORDINARIO'
  | 'GISELA'
  | 'AHORRO';

interface MovimientoInsert {
  fecha: string;
  concepto: string;
  entrada: number;
  salida: number;
  metodo: MetodoPago;
  categoria?: CategoriaGasto | null;
}

interface ArqueoUpsert {
  fecha: string;
  bill_100?: number;
  bill_200?: number;
  bill_500?: number;
  bill_1000?: number;
  bill_2000?: number;
  bill_10000?: number;
  bill_20000?: number;
  a_caja_fuerte?: number;
  disponible_mp?: number;
  disponible_debito?: number;
  disponible_banco?: number;
  cierre_caja_chica?: number;
  observaciones?: string | null;
}

interface GastoFijoInsert {
  periodo: string;
  concepto: string;
  monto: number;
}

interface DiferenciaInsert {
  fecha: string;
  metodo: MetodoPago;
  monto: number;
  signo: 1 | -1;
  tipo: 'reasignacion' | 'diferencia_real';
  observacion?: string | null;
}

// ─── Helpers de respuesta ─────────────────────────────────────────────────────
const ok = (data: unknown) => NextResponse.json(data);
const err = (msg: string, status = 400) =>
  NextResponse.json({ error: msg }, { status });

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // CAMBIO #2: Validar JWT y obtener user_id
  const userId = await autenticar(req);
  if (!userId) {
    return err('No autorizado', 401);
  }

  let body: { action?: unknown; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return err('Body inválido');
  }

  if (typeof body.action !== 'string') {
    return err('Action inválida');
  }

  const action = body.action;
  const p = (body.payload ?? {}) as Record<string, unknown>;

  try {
    switch (action) {
      // ═══════════════════════════════════════════════════════════════════════
      // MOVIMIENTOS
      // ═══════════════════════════════════════════════════════════════════════

      case 'getMovimientosMes': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .gte('fecha', p.inicio)
          .lte('fecha', p.fin)
          .order('fecha', { ascending: true });

        if (error) throw error;
        return ok({ data });
      }

      case 'getMovimientosMesDesc': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .gte('fecha', p.inicio)
          .lte('fecha', p.fin)
          .order('fecha', { ascending: false });

        if (error) throw error;
        return ok({ data });
      }

      case 'getMovimientosDia': {
        if (!p.fecha) return err('Falta fecha');

        let query = supabase
          .from('movimientos')
          .select('*')
          .eq('fecha', p.fecha as string);

        if (p.metodo) {
          query = query.eq('metodo', p.metodo as string);
        }

        const { data, error } = await query.order('created_at', {
          ascending: false,
        });

        if (error) throw error;
        return ok({ data });
      }

      case 'deleteMovimientosDia': {
        if (!p.fecha) return err('Falta fecha');

        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('fecha', p.fecha as string);

        if (error) throw error;
        return ok({ ok: true });
      }

      case 'insertMovimientos': {
        const rows = p.rows as MovimientoInsert[] | undefined;
        if (!rows || rows.length === 0) return ok({ ok: true, data: [] });

        const { data, error } = await supabase
          .from('movimientos')
          .insert(rows)
          .select();

        if (error) throw error;
        return ok({ data });
      }

      case 'updateMovimiento': {
        if (!p.id) return err('Falta id');

        const { data, error } = await supabase
          .from('movimientos')
          .update({
            concepto: p.concepto,
            entrada: p.entrada,
            salida: p.salida,
            metodo: p.metodo,
            categoria: p.categoria,
          })
          .eq('id', p.id as string)
          .select();

        if (error) throw error;
        return ok({ data });
      }

      case 'deleteMovimiento': {
        if (!p.id) return err('Falta id');

        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('id', p.id as string);

        if (error) throw error;
        return ok({ ok: true });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ARQUEO DIARIO
      // ═══════════════════════════════════════════════════════════════════════

      case 'getArqueoMes': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('*')
          .gte('fecha', p.inicio)
          .lte('fecha', p.fin)
          .order('fecha', { ascending: false })
          .limit(1);

        if (error) throw error;
        return ok({ data });
      }

      case 'getArqueoDia': {
        if (!p.fecha) return err('Falta fecha');

        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('*')
          .eq('fecha', p.fecha as string)
          .limit(1);

        if (error) throw error;
        return ok({ data: data?.[0] ?? null });
      }

      case 'getArqueoTotal': {
        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('a_caja_fuerte');

        if (error) throw error;
        return ok({ data });
      }

      case 'getArqueosMes': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('*')
          .gte('fecha', p.inicio)
          .lte('fecha', p.fin)
          .order('fecha', { ascending: false });

        if (error) throw error;
        return ok({ data });
      }

      case 'upsertArqueo': {
        const arqueo = p as unknown as ArqueoUpsert;
        if (!arqueo?.fecha) return err('Falta fecha en arqueo');

        const { data, error } = await supabase
          .from('arqueo_diario')
          .upsert(arqueo, { onConflict: 'fecha' })
          .select();

        if (error) throw error;
        return ok({ data });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SALDOS APERTURA
      // ═══════════════════════════════════════════════════════════════════════

      case 'getSaldoApertura': {
        if (!p.periodo) return err('Falta periodo');

        const { data, error } = await supabase
          .from('saldos_apertura')
          .select('*')
          .eq('periodo', p.periodo as string)
          .limit(1);

        if (error) throw error;
        return ok({ data: data?.[0] ?? null });
      }

      case 'getSaldosApertura': {
        const { data, error } = await supabase
          .from('saldos_apertura')
          .select('*')
          .order('periodo', { ascending: false });

        if (error) throw error;
        return ok({ data });
      }

      case 'upsertSaldoApertura': {
        if (!p.periodo) return err('Falta periodo');

        const { data, error } = await supabase
          .from('saldos_apertura')
          .upsert(p, { onConflict: 'periodo' })
          .select();

        if (error) throw error;
        return ok({ data });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // GASTOS FIJOS
      // ═══════════════════════════════════════════════════════════════════════

      case 'getGastosFijos': {
        if (!p.periodo) return err('Falta periodo');

        const { data, error } = await supabase
          .from('gastos_fijos')
          .select('*')
          .eq('periodo', p.periodo as string)
          .order('concepto', { ascending: true });

        if (error) throw error;
        return ok({ data });
      }

      case 'insertGastoFijo': {
        const row = p as unknown as GastoFijoInsert;
        if (!row?.periodo || !row?.concepto || !row?.monto) {
          return err('Payload inválido para gasto fijo');
        }

        const { data, error } = await supabase
          .from('gastos_fijos')
          .insert({
            periodo: row.periodo,
            concepto: row.concepto,
            monto: row.monto,
          })
          .select();

        if (error) throw error;
        return ok({ data });
      }

      case 'deleteGastoFijo': {
        if (!p.id) return err('Falta id');

        const { error } = await supabase
          .from('gastos_fijos')
          .delete()
          .eq('id', p.id as string);

        if (error) throw error;
        return ok({ ok: true });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // DIFERENCIAS ARQUEO
      // ═══════════════════════════════════════════════════════════════════════

      case 'insertDiferencia': {
        const row = p as unknown as DiferenciaInsert;
        if (!row?.fecha || !row?.metodo || !row?.monto || !row?.signo || !row?.tipo) {
          return err('Payload inválido para diferencia');
        }

        const { data, error } = await supabase
          .from('diferencias_arqueo')
          .insert({
            fecha: row.fecha,
            metodo: row.metodo,
            monto: row.monto,
            signo: row.signo,
            tipo: row.tipo,
            observacion: row.observacion ?? null,
          })
          .select();

        if (error) throw error;
        return ok({ data });
      }

      case 'getDiferenciasMes': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const { data, error } = await supabase
          .from('diferencias_arqueo')
          .select('*')
          .gte('fecha', p.inicio)
          .lte('fecha', p.fin)
          .order('fecha', { ascending: false });

        if (error) throw error;
        return ok({ data });
      }

      case 'deleteDiferencia': {
        if (!p.id) return err('Falta id');

        const { error } = await supabase
          .from('diferencias_arqueo')
          .delete()
          .eq('id', p.id as string);

        if (error) throw error;
        return ok({ ok: true });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CONSULTAS UNIFICADAS
      // ═══════════════════════════════════════════════════════════════════════

      case 'getDashboardData': {
        if (!p.inicio || !p.fin || !p.periodo) {
          return err('Faltan inicio, fin o periodo');
        }

        const [movsRes, arqRes, gfRes] = await Promise.all([
          supabase
            .from('movimientos')
            .select('*')
            .gte('fecha', p.inicio)
            .lte('fecha', p.fin)
            .order('fecha', { ascending: true }),
          supabase
            .from('arqueo_diario')
            .select('*')
            .gte('fecha', p.inicio)
            .lte('fecha', p.fin)
            .order('fecha', { ascending: false })
            .limit(1),
          supabase
            .from('gastos_fijos')
            .select('*')
            .eq('periodo', p.periodo as string)
            .order('concepto', { ascending: true }),
        ]);

        if (movsRes.error) throw movsRes.error;
        if (arqRes.error) throw arqRes.error;
        if (gfRes.error) throw gfRes.error;

        return ok({
          movimientos: movsRes.data,
          arqueo: arqRes.data?.[0] ?? null,
          gastosFijos: gfRes.data,
        });
      }

      case 'getReportesData': {
        if (!p.inicio || !p.fin) return err('Faltan inicio o fin');

        const [saldosRes, movsRes, arqueosRes] = await Promise.all([
          supabase
            .from('saldos_apertura')
            .select('*')
            .order('periodo', { ascending: false }),
          supabase
            .from('movimientos')
            .select('*')
            .gte('fecha', p.inicio)
            .lte('fecha', p.fin)
            .order('fecha', { ascending: true }),
          supabase
            .from('arqueo_diario')
            .select('*')
            .gte('fecha', p.inicio)
            .lte('fecha', p.fin)
            .order('fecha', { ascending: false }),
        ]);

        if (saldosRes.error) throw saldosRes.error;
        if (movsRes.error) throw movsRes.error;
        if (arqueosRes.error) throw arqueosRes.error;

        return ok({
          saldos: saldosRes.data,
          movimientos: movsRes.data,
          arqueos: arqueosRes.data,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════

      default:
        return err(`Action desconocida: ${action}`);
    }
  } catch (e) {
    // CAMBIO #3: Mejor logging con detalles
    const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
    console.error(`[api/db] Error en action "${action}":`, errorMsg);
    return err('Error interno del servidor', 500);
  }
}