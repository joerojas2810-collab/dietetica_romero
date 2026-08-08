'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import BillField from '@/components/shared/BillField';
import { format } from 'date-fns';

export default function Cartuchera() {
  const [loading, setLoading] = useState(true);
  const [totalSistema, setTotalSistema] = useState(0);
  const [cReal1000, setCReal1000] = useState('');
  const [cReal2000, setCReal2000] = useState('');
  const [cReal10000, setCReal10000] = useState('');
  const [cReal20000, setCReal20000] = useState('');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const totalCartucheraReal = n(cReal1000) * 1000 + n(cReal2000) * 2000 + n(cReal10000) * 10000 + n(cReal20000) * 20000;
  const diferencia = totalCartucheraReal - totalSistema;

  useEffect(() => {
    const fetchTotal = async () => {
      setLoading(true);
      const total = await db.getArqueoTotal();
      setTotalSistema(total);
      setLoading(false);
    };
    fetchTotal();
  }, [saved]);

  const handleGuardar = async () => {
    if (diferencia !== 0 && !observacion.trim()) return;
    setSaving(true);
    await db.insertMovimientos([{
      fecha: format(new Date(), 'yyyy-MM-dd'),
      concepto: diferencia > 0 ? `Sobrante cartuchera: ${observacion}` : `Faltante cartuchera: ${observacion}`,
      entrada: diferencia > 0 ? Math.abs(diferencia) : 0,
      salida: diferencia < 0 ? Math.abs(diferencia) : 0,
      metodo: 'Efectivo',
      categoria: 'EXTRAORDINARIO',
    }]);
    setSaving(false);
    setSaved(true);
    setCReal1000(''); setCReal2000(''); setCReal10000(''); setCReal20000('');
    setObservacion('');
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
          <ShieldCheck size={14} /> Control físico
        </div>
        <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Cartuchera</h2>
        <p className="mt-2 text-sm text-[#849083]">Verificá que el monto físico coincida con el sistema.</p>
      </div>

      <div className="max-w-xl space-y-5">
        {/* Total sistema */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="text-xs font-medium text-[#849083]">Total cartuchera según sistema</p>
          <p className="mt-2 text-4xl font-bold text-[#40562a]">{money(totalSistema)}</p>
          <p className="mt-2 text-[11px] text-[#99a398]">Suma de todos los billetes $10.000 y $20.000 enviados a cartuchera</p>
        </div>

        {/* Conteo real */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">¿Cuánto hay realmente?</p>
          <div className="grid grid-cols-2 gap-3">
            <BillField label="$1.000" qty={cReal1000} setQty={setCReal1000} denom={1000} />
            <BillField label="$2.000" qty={cReal2000} setQty={setCReal2000} denom={2000} />
            <BillField label="$10.000" qty={cReal10000} setQty={setCReal10000} denom={10000} />
            <BillField label="$20.000" qty={cReal20000} setQty={setCReal20000} denom={20000} />
          </div>

          {totalCartucheraReal > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[#40562a] px-4 py-2 text-white">
              <span className="text-xs">Total contado</span>
              <span className="text-sm font-bold">{money(totalCartucheraReal)}</span>
            </div>
          )}

          {totalCartucheraReal > 0 && (
            <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${
              diferencia === 0
                ? 'border border-[#c9ddc5] bg-[#eff8ed]'
                : Math.abs(diferencia) <= 1000
                  ? 'border border-[#e8c96e] bg-[#fef9e7]'
                  : 'border border-[#f0b9b3] bg-[#fdf0ee]'
            }`}>
              <span className="text-xs font-medium">Diferencia</span>
              <span className="text-lg font-bold">
                {diferencia === 0
                  ? '✓ Coincide'
                  : `${diferencia > 0 ? '+' : ''}${money(diferencia)}`}
              </span>
            </div>
          )}

          {diferencia !== 0 && totalCartucheraReal > 0 && (
            <div className="mt-3">
              <textarea
                value={observacion}
                onChange={e => setObservacion(e.target.value)}
                placeholder="Justificá la diferencia..."
                className="w-full rounded-lg border border-[#e2d8a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#c6a15b] focus:ring-2 focus:ring-[#f0e4b8]"
                rows={2}
              />
            </div>
          )}

          {totalCartucheraReal > 0 && (diferencia === 0 || observacion.trim()) && (
            <button
              onClick={handleGuardar}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Confirmar control'}
              <ShieldCheck size={16} />
            </button>
          )}

          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Control registrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}