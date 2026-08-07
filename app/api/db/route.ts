import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function autenticar(req: NextRequest): Promise<boolean> {
  const apiSecret = req.headers.get('x-api-secret');
  if (apiSecret !== process.env.API_SECRET) return false;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return false;

  return true;
}

type MetodoPago = 'Efectivo' | 'Debito' | 'MercadoPago';
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
  a_caja_fuerte?: number;
  disponible_mp?: number;
  disponible_debito?: number;
  observaciones?: string | null;
}

interface GastoFijoInsert {
  periodo: string;
  concepto: string;
  monto: number;
}

export async function POST(req: NextRequest) {
  const esValido = await autenticar(req);

  if (!esValido) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: { action?: unknown; payload?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Action inválida' }, { status: 400 });
  }

  const action = body.action;
  const payload = body.payload;

  try {
    switch (action) {
      case 'getMovimientosMes': {
        const { inicio, fin } = (payload ?? {}) as {
          inicio: string;
          fin: string;
        };

        if (!inicio || !fin) {
          return NextResponse.json(
            { error: 'Faltan inicio o fin' },
            { status: 400 }
          );
        }

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
        const { inicio, fin } = (payload ?? {}) as {
          inicio: string;
          fin: string;
        };

        if (!inicio || !fin) {
          return NextResponse.json(
            { error: 'Faltan inicio o fin' },
            { status: 400 }
          );
        }

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
        const { inicio, fin } = (payload ?? {}) as {
          inicio: string;
          fin: string;
        };

        if (!inicio || !fin) {
          return NextResponse.json(
            { error: 'Faltan inicio o fin' },
            { status: 400 }
          );
        }

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
        const { fecha, metodo } = (payload ?? {}) as {
          fecha: string;
          metodo?: MetodoPago;
        };

        if (!fecha) {
          return NextResponse.json(
            { error: 'Falta fecha' },
            { status: 400 }
          );
        }

        let query = supabase.from('movimientos').select('*').eq('fecha', fecha);

        if (metodo) {
          query = query.eq('metodo', metodo);
        }

        const { data, error } = await query.order('created_at', {
          ascending: false,
        });

        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteMovimientosDia': {
        const { fecha } = (payload ?? {}) as { fecha: string };

        if (!fecha) {
          return NextResponse.json(
            { error: 'Falta fecha' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('fecha', fecha);

        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'insertMovimientos': {
        const { rows } = (payload ?? {}) as { rows: MovimientoInsert[] };

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
        const arqueo = (payload ?? null) as ArqueoUpsert | null;

        if (!arqueo?.fecha || typeof arqueo.fecha !== 'string') {
          return NextResponse.json(
            { error: 'Payload inválido: falta fecha en arqueo' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('arqueo_diario')
          .upsert(arqueo, { onConflict: 'fecha' })
          .select();

        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'deleteMovimiento': {
        const { id } = (payload ?? {}) as { id: string };

        if (!id) {
          return NextResponse.json({ error: 'Falta id' }, { status: 400 });
        }

        const { error } = await supabase
          .from('movimientos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

              case 'getGastosFijos': {
        const { periodo } = (payload ?? {}) as { periodo: string };

        if (!periodo) {
          return NextResponse.json(
            { error: 'Falta periodo' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('gastos_fijos')
          .select('*')
          .eq('periodo', periodo)
          .order('concepto', { ascending: true });

        if (error) throw error;
        return NextResponse.json({ data });
      }

      case 'insertGastoFijo': {
        const row = (payload ?? null) as GastoFijoInsert | null;

        if (!row?.periodo || !row?.concepto || !row?.monto) {
          return NextResponse.json(
            { error: 'Payload inválido para gasto fijo' },
            { status: 400 }
          );
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
        return NextResponse.json({ data });
      }

      case 'deleteGastoFijo': {
        const { id } = (payload ?? {}) as { id: string };

        if (!id) {
          return NextResponse.json(
            { error: 'Falta id' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('gastos_fijos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

            case 'getSaldoApertura': {
        const { periodo } = (payload ?? {}) as { periodo: string };

        if (!periodo) {
          return NextResponse.json({ error: 'Falta periodo' }, { status: 400 });
        }

        const { data, error } = await supabase
          .from('saldos_apertura')
          .select('*')
          .eq('periodo', periodo)
          .limit(1);

        if (error) throw error;
        return NextResponse.json({ data: data?.[0] ?? null });
      }

      case 'upsertSaldoApertura': {
        const row = (payload ?? null) as {
          periodo: string;
          efectivo: number;
          debito: number;
          mercadopago: number;
        } | null;

        if (!row?.periodo) {
          return NextResponse.json({ error: 'Falta periodo' }, { status: 400 });
        }

        const { data, error } = await supabase
          .from('saldos_apertura')
          .upsert(row, { onConflict: 'periodo' })
          .select();

        if (error) throw error;
        return NextResponse.json({ data });
      }

      default:
        return NextResponse.json(
          { error: `Action desconocida: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error(`[api/db] Error en action "${action}":`, err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}