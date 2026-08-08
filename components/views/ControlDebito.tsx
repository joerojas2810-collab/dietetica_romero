'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Pencil, Receipt, ShieldCheck, Trash2,
} from 'lucide-react';
import { Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format } from 'date-fns';

export default function ControlDebito() {
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [movsDia, setMovsDia] = useState<Movimiento[]>([]);
  const [ingresosDebito, setIngresosDebito] = useState(0);
  const [acreditacionReal, setAcreditacionReal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tipo, setTipo] = useState<'comision' | 'error' | null>(null);
  const [editing, setEditing] = useState<Movimiento | null>(null);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const diferencia = n(acreditacionReal) - ingresosDebito;
  const porcentaje = ingresosDebito > 0 ? ((Math.abs(diferencia) / ingresosDebito) * 100).toFixed(2) : '0';

  const fetchData = async () => {
    setLoading(true);
    const movs = await db.getMovimientosDia(fecha, 'Debito');
    setMovsDia(movs);
    setIngresosDebito(movs.reduce((s, m) => s + Number(m.entrada), 0));
    setLoading(false);
    setSaved(false);
    setTipo(null);
    setAcreditacionReal('');
  };

  useEffect(() => {
    fetchData();
  }, [fecha]);

  const handleGuardar = async () => {
    if (diferencia !== 0 && !tipo) return;
    setSaving(true);
    await db.upsertArqueo({ fecha, disponible_debito: n(acreditacionReal) });
    if (diferencia !== 0) {
      const esComision = tipo === 'comision';
      await db.insertMovimientos([{
        fecha,
        concepto: esComision ? `Comisión POSNET (${porcentaje}%)` : diferencia < 0 ? 'Error negativo Débito' : 'Error positivo Débito',
        entrada: diferencia > 0 ? Math.abs(diferencia) : 0,
        salida: diferencia < 0 ? Math.abs(diferencia) : 0,
        metodo: 'Debito',
        categoria: esComision ? 'OPERATIVO' : 'EXTRAORDINARIO',
      }]);
    }
    setSaving(false);
    setSaved(true);
  };

  const handleDelete = async (id: string) => {
    await db.deleteMovimiento(id);
    fetchData();
  };

  const handleUpdate = async (updated: {
    concepto: string;
    entrada: number;
    salida: number;
    metodo: string;
    categoria?: string | null;
  }) => {
    if (!editing?.id) return;
    await db.updateMovimiento(editing.id, updated);
    setEditing(null);
    fetchData();
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Receipt size={14} /> Control de cierre
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Débito</h2>
          <p className="mt-2 text-sm text-[#849083]">Compará lo cobrado con lo acreditado.</p>
        </div>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none" />
      </div>

      <div className="max-w-xl space-y-5">
        {/* Cobros del día — editables */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cobros Débito del día</p>
          <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
            <span className="text-xs font-medium text-[#3d6942]">Total cobrado</span>
            <span className="text-lg font-bold text-[#3d6942]">{money(ingresosDebito)}</span>
          </div>

          {/* Lista de movimientos individuales */}
          {movsDia.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold text-[#849083]">Detalle de cobros Débito</p>
              {movsDia.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      Number(m.entrada) > 0 ? 'bg-[#e5f1e2] text-[#619167]' : 'bg-[#f9ebe6] text-[#bd806d]'
                    }`}>
                      {Number(m.entrada) > 0 ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#3c4e3e]">{m.concepto}</p>
                      <p className="text-[10px] text-[#99a398]">{m.categoria || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${Number(m.entrada) > 0 ? 'text-[#56805b]' : 'text-[#ba7665]'}`}>
                      {Number(m.entrada) > 0 ? `+${money(Number(m.entrada))}` : `-${money(Number(m.salida))}`}
                    </span>
                    <button onClick={() => setEditing(m)} className="text-[#b5beb4] hover:text-[#40562a]">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(m.id!)} className="text-[#b5beb4] hover:text-[#ba4a3a]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acreditación */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Acreditación real en cuenta</p>
          <AmountField label="Monto acreditado en banco" value={acreditacionReal} setValue={setAcreditacionReal} />

          {n(acreditacionReal) > 0 && diferencia !== 0 && (
            <>
              <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${
                Math.abs(diferencia) <= 1000 ? 'border border-[#e8c96e] bg-[#fef9e7]' : 'border border-[#f0b9b3] bg-[#fdf0ee]'
              }`}>
                <span className="text-xs font-medium">Diferencia</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{diferencia > 0 ? '+' : ''}{money(diferencia)}</span>
                  <span className="ml-2 text-[10px]">({porcentaje}%)</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-3 text-xs font-bold text-[#40562a]">¿Qué es esta diferencia?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTipo('comision')} className={`rounded-xl border-2 p-4 text-left transition ${
                    tipo === 'comision' ? 'border-[#40562a] bg-[#edf0e2]' : 'border-[#e5eae1] bg-white hover:border-[#b9c8b3]'
                  }`}>
                    <p className="text-sm font-bold">📊 Comisión</p>
                    <p className="mt-1 text-[11px] text-[#849083]">Costo normal del banco/POSNET</p>
                  </button>
                  <button onClick={() => setTipo('error')} className={`rounded-xl border-2 p-4 text-left transition ${
                    tipo === 'error' ? 'border-[#ba4a3a] bg-[#fdf0ee]' : 'border-[#e5eae1] bg-white hover:border-[#f0b9b3]'
                  }`}>
                    <p className="text-sm font-bold">⚠️ Error</p>
                    <p className="mt-1 text-[11px] text-[#849083]">Diferencia inesperada</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {n(acreditacionReal) > 0 && diferencia === 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#c9ddc5] bg-[#eff8ed] p-4">
              <span className="text-xs font-medium">Diferencia</span>
              <span className="text-lg font-bold">✓ Coincide</span>
            </div>
          )}

          {n(acreditacionReal) > 0 && (diferencia === 0 || tipo) && (
            <button onClick={handleGuardar} disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
              {saving ? 'Guardando...' : 'Confirmar control Débito'} <ShieldCheck size={16} />
            </button>
          )}

          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              {tipo === 'comision' ? `Comisión ${money(Math.abs(diferencia))} (${porcentaje}%) registrada` : 'Control registrado'}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditMovimientoModal
          movimiento={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}