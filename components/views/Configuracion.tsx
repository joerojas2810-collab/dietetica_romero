'use client';

import { useEffect, useState } from 'react';
import { CirclePlus, Settings2, Trash2 } from 'lucide-react';
import { GastoFijo } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import { format, startOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function Configuracion() {
  const [mes, setMes] = useState(mesActual);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [items, setItems] = useState<GastoFijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const fetchGastos = async () => {
    setLoading(true);
    const data = await db.getGastosFijos(mes);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGastos();
    setSaved(false);
  }, [mes]);

  const totalGastosFijos = items.reduce((s, g) => s + Number(g.monto), 0);
  const metaDiaria = totalGastosFijos > 0 ? Math.round(totalGastosFijos / 24) : 0;

  const handleGuardar = async () => {
    if (!concepto.trim() || n(monto) <= 0) return;
    setSaving(true);
    await db.insertGastoFijo({ periodo: mes, concepto: concepto.trim(), monto: n(monto) });
    setConcepto(''); setMonto('');
    setSaving(false); setSaved(true);
    fetchGastos();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = async (id: string) => {
    await db.deleteGastoFijo(id);
    fetchGastos();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><Settings2 size={14} /> Parámetros del negocio</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Gastos fijos mensuales</h2>
          <p className="mt-2 text-sm text-[#849083]">Definí los costos fijos del mes para calcular la meta diaria.</p>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const val = format(startOfMonth(d), 'yyyy-MM-dd');
            return <option key={val} value={val}>{format(d, 'MMMM yyyy', { locale: es })}</option>;
          })}
        </select>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-5 text-sm font-bold">Nuevo gasto fijo</p>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold text-[#788778]">Concepto</label>
            <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Alquiler / Luz / ABL" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-3 text-sm outline-none focus:border-[#9ab498]" />
          </div>
          <AmountField label="Monto mensual" value={monto} setValue={setMonto} />
          <button onClick={handleGuardar} disabled={saving || !concepto.trim() || n(monto) <= 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
            {saving ? 'Guardando...' : 'Agregar gasto fijo'} <CirclePlus size={16} />
          </button>
          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Gasto fijo registrado
            </div>
          )}
          <div className="mt-6 rounded-2xl bg-[#eef3e8] p-4">
            <p className="text-[11px] font-semibold text-[#6a7d62]">Resumen del mes</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6f7f6d]">Total gastos fijos</span>
                <span className="font-bold text-[#243126]">{money(totalGastosFijos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6f7f6d]">Meta diaria (24 días)</span>
                <span className="font-bold text-[#40562a]">{money(metaDiaria)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-5 text-sm font-bold">Gastos fijos de {format(parseISO(mes), 'MMMM yyyy', { locale: es })}</p>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">Sin gastos fijos cargados</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3">
                  <div>
                    <p className="text-sm font-semibold text-[#3c4e3e]">{item.concepto}</p>
                    <p className="text-[11px] text-[#99a398]">Gasto fijo mensual</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#ba7665]">{money(Number(item.monto))}</span>
                    <button onClick={() => handleDelete(item.id!)} className="text-[#b5beb4] hover:text-[#ba4a3a]"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-xl bg-[#fbfcfa] px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#6f7f6d]">Total</span>
                  <span className="font-bold text-[#243126]">{money(totalGastosFijos)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}