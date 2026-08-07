// lib/supabase.ts
// ATENCIÓN: el cliente de Supabase fue eliminado del frontend.
// Ahora solo exportamos los tipos TypeScript.
// Las queries van por /api/db (ver lib/api.ts)

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