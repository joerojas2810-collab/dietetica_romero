import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type MetodoPago = 'Efectivo' | 'Debito' | 'MercadoPago';

export type CategoriaGasto =
  | 'PERSONAL'
  | 'OPERATIVO'
  | 'MATERIA PRIMA'
  | 'DESECHABLES'
  | 'EXTRAORDINARIO'
  | 'GISELA'
  | 'AHORRO';

export interface Movimiento {
  id?: string;
  fecha: string;
  concepto: string;
  entrada: number;
  salida: number;
  metodo: MetodoPago;
  categoria?: CategoriaGasto | null;
  created_at?: string;
}

export interface ArqueoDiario {
  id?: string;
  fecha: string;
  bill_100: number;
  bill_200: number;
  bill_500: number;
  bill_1000: number;
  bill_2000: number;
  a_caja_fuerte: number;
  disponible_mp?: number | null;
  disponible_debito?: number | null;
  observaciones?: string | null;
  total_contado?: number;
}

export interface SaldoApertura {
  periodo: string;
  efectivo: number;
  debito: number;
  mercadopago: number;
}

export interface GastoFijo {
  id?: string;
  periodo: string;
  concepto: string;
  monto: number;
}