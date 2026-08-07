// app/api/db/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ─── Cliente servidor con service_role (nunca sale del servidor) ──────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ─── Cliente para verificar tokens de usuarios ────────────────────────────────
// Necesitamos un cliente separado para validar JWTs sin privilegios elevados
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ─── Autenticación: valida que el JWT sea real y vigente ──────────────────────
async function autenticar(req: NextRequest): Promise<boolean> {
  // Capa 1: secreto estático (evita requests externos sin token)
  const apiSecret = req.headers.get('x-api-secret');
  if (apiSecret !== process.env.API_SECRET) return false;

  // Capa 2: JWT de Supabase Auth (verifica que hay un usuario real logueado)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.replace('Bearer ', '');

  // getUser valida el JWT contra Supabase — si expiró o es falso, falla
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return false;

  return true;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type MetodoPago = 'Efectivo' | 'Debito' | 'MercadoPago';
type CategoriaGasto =
  | 'PERSONAL' | 'OPERATIVO' | 'MATERIA PRIMA'
  | 'DESECHABLES' | 'EXTRAORDINARIO' | 'GISELA' | 'AHORRO';

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
  a_caja_fuerte?: number;
  disponible_mp?: number;
  disponible_debito?: number;
  observaciones?: string | null;
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Doble verificación: secreto + JWT
  const esValido = await autenticar(req);
  if (!esValido) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Parsear body
  let body: { action: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { action, payload = {} } = body;

  // 3. Ejecutar action
  try {
    switch (action) {

      case 'getMovimientosMes': {
        const { inicio, fin } = payload as { inicio: string; fin: string };
        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .gte('fecha', inicio)
          .lte('fecha', fin)
          .order('fecha', { ascending: true });
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'getMovimientosMesDesc': {
        const { inicio, fin } = payload as { inicio: string; fin: string };
        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .gte('fecha', inicio)
          .lte('fecha', fin)
          .order('fecha', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'getArqueoMes': {
        const { inicio, fin } = payload as { inicio: string; fin: string };
        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('*')
          .gte('fecha', inicio)
          .lte('fecha', fin)
          .order('fecha', { ascending: false })
          .limit(1);
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'getArqueoTotal': {
        const { data, error } = await supabase
          .from('arqueo_diario')
          .select('a_caja_fuerte');
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'getMovimientosDia': {
        const { fecha, metodo } = payload as { fecha: string; metodo?: MetodoPago };
        let query = supabase
          .from('movimientos')
          .select('*')
          .eq('fecha', fecha);
        if (metodo) query = query.eq('metodo', metodo);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteMovimientosDia': {
        const { fecha } = payload as { fecha: string };
        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('fecha', fecha);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'insertMovimientos': {
        const { rows } = payload as { rows: MovimientoInsert[] };
        if (!rows || rows.length === 0) {
          return NextResponse.json({ ok: true, data: [] });
        }
        const { data, error } = await supabase
          .from('movimientos')
          .insert(rows)
          .select();
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'upsertArqueo': {
        const arqueo = payload as ArqueoUpsert;
        const { data, error } = await supabase
          .from('arqueo_diario')
          .upsert(arqueo, { onConflict: 'fecha' })
          .select();
        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteMovimiento': {
        const { id } = payload as { id: string };
        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: `Action desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error(`[api/db] Error en action "${action}":`, err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}