'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Movimiento, MetodoPago, CategoriaGasto } from '@/lib/supabase';

interface Props {
  movimiento: Movimiento;
  onSave: (updated: {
    concepto: string;
    entrada: number;
    salida: number;
    metodo: string;
    categoria?: string | null;
  }) => void;
  onClose: () => void;
}

const METODOS: MetodoPago[] = ['Efectivo', 'Debito', 'Credito', 'MercadoPago'];

const METODO_LABEL: Record<MetodoPago, string> = {
  Efectivo: 'Efectivo',
  Debito: 'Débito',
  Credito: 'Crédito',
  MercadoPago: 'MP',
};

export default function EditMovimientoModal({ movimiento, onSave, onClose }: Props) {
  const [concepto, setConcepto] = useState(movimiento.concepto);
  const [monto, setMonto] = useState(
    String(Number(movimiento.entrada) > 0 ? movimiento.entrada : movimiento.salida)
  );
  const [tipo, setTipo] = useState<'entrada' | 'salida'>(
    Number(movimiento.entrada) > 0 ? 'entrada' : 'salida'
  );
  const [metodo, setMetodo] = useState<MetodoPago>(movimiento.metodo);
  const [categoria, setCategoria] = useState<CategoriaGasto | ''>(
    (movimiento.categoria as CategoriaGasto) || ''
  );

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const handleSave = () => {
    if (!concepto.trim() || n(monto) <= 0) return;
    onSave({
      concepto: concepto.trim(),
      entrada: tipo === 'entrada' ? n(monto) : 0,
      salida: tipo === 'salida' ? n(monto) : 0,
      metodo,
      categoria: tipo === 'salida' && categoria ? categoria : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-bold">Editar movimiento</p>
          <button onClick={onClose} className="text-[#a6b0a5] hover:text-[#ba4a3a]">
            <X size={18} />
          </button>
        </div>

        {/* Tipo */}
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-semibold text-[#788778]">Tipo</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTipo('salida')}
              className={`rounded-xl border-2 p-2.5 text-center text-xs font-bold transition ${
                tipo === 'salida'
                  ? 'border-[#ba4a3a] bg-[#fdf0ee] text-[#ba4a3a]'
                  : 'border-[#e5eae1] text-[#849083]'
              }`}
            >
              ↑ Gasto
            </button>
            <button
              onClick={() => setTipo('entrada')}
              className={`rounded-xl border-2 p-2.5 text-center text-xs font-bold transition ${
                tipo === 'entrada'
                  ? 'border-[#40562a] bg-[#edf0e2] text-[#40562a]'
                  : 'border-[#e5eae1] text-[#849083]'
              }`}
            >
              ↓ Ingreso
            </button>
          </div>
        </div>

        {/* Concepto */}
        <div className="mb-4">
          <label className="mb-2 block text-[11px] font-semibold text-[#788778]">
            Concepto
          </label>
          <input
            value={concepto}
            onChange={e => setConcepto(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-3 text-sm outline-none focus:border-[#9ab498]"
          />
        </div>

        {/* Monto */}
        <div className="mb-4">
          <label className="mb-2 block text-[11px] font-semibold text-[#788778]">
            Monto
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">
              $
            </span>
            <input
              value={monto}
              onChange={e => setMonto(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className="h-11 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none focus:border-[#9ab498]"
            />
          </div>
        </div>

        {/* Método */}
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-semibold text-[#788778]">Método</p>
          <div className="grid grid-cols-4 gap-2">
            {METODOS.map(m => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={`rounded-xl border-2 py-2 text-xs font-bold transition ${
                  metodo === m
                    ? 'border-[#40562a] bg-[#edf0e2] text-[#40562a]'
                    : 'border-[#e5eae1] text-[#849083]'
                }`}
              >
                {METODO_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Categoría */}
        {tipo === 'salida' && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold text-[#788778]">Categoría</p>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value as CategoriaGasto)}
              className="h-11 w-full rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none"
            >
              <option value="">Sin categoría</option>
              <option value="PERSONAL">Personal</option>
              <option value="OPERATIVO">Operativo</option>
              <option value="MATERIA PRIMA">Materia Prima</option>
              <option value="DESECHABLES">Desechables</option>
              <option value="EXTRAORDINARIO">Extraordinario</option>
              <option value="GISELA">Gisela</option>
              <option value="AHORRO">Ahorro</option>
            </select>
          </div>
        )}

        {/* Botones */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#e5eae1] py-2.5 text-xs font-bold text-[#849083] transition hover:bg-[#f5f5f0]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!concepto.trim() || n(monto) <= 0}
            className="flex-1 rounded-xl bg-[#40562a] py-2.5 text-xs font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}