'use client';

import { useEffect, useState } from 'react';
import { Cloud, ShieldCheck } from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import { format } from 'date-fns';

export default function ControlMP() {
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cierreAnterior, setCierreAnterior] = useState('');
  const [cierreHoy, setCierreHoy] = useState('');
  const [ingresosMP, setIngresosMP] = useState(0);
  const [egresosMP, setEgresosMP] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const esperado = n(cierreAnterior) + ingresosMP - egresosMP;
  const diferencia = n(cierreHoy) - esperado;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const movs = await db.getMovimientosDia(fecha, 'MercadoPago');
      setIngresosMP(movs.reduce((s, m) => s + Number(m.entrada), 0));
      setEgresosMP(movs.reduce((s, m) => s + Number(m.salida), 0));
      setLoading(false);
      setSaved(false);
    };
    fetchData();
  }, [fecha]);

  const handleGuardar = async () => {
    setSaving(true);
    await db.upsertArqueo({ fecha, disponible_mp: n(cierreHoy) });
    if (diferencia !== 0) {
      await db.insertMovimientos([{
        fecha,
        concepto: diferencia > 0 ? 'Diferencia positiva MP' : 'Diferencia negativa MP',
        entrada: diferencia > 0 ? Math.abs(diferencia) : 0,
        salida: diferencia < 0 ? Math.abs(diferencia) : 0,
        metodo: 'MercadoPago',
        categoria: 'EXTRAORDINARIO',
      }]);
    }
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><Cloud size={14} /> Control de cierre</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">MercadoPago</h2>
          <p className="mt-2 text-sm text-[#849083]">Verificá que el saldo real coincida con el sistema.</p>
        </div>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none" />
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre del día anterior</p>
          <AmountField label="Último saldo MP" value={cierreAnterior} setValue={setCierreAnterior} />
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Movimientos MP del día</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
              <span className="text-xs font-medium text-[#3d6942]">Ingresos MP</span>
              <span className="text-sm font-bold text-[#3d6942]">+{money(ingresosMP)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f9ebe6] px-4 py-3">
              <span className="text-xs font-medium text-[#ba7665]">Egresos MP</span>
              <span className="text-sm font-bold text-[#ba7665]">-{money(egresosMP)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Saldo esperado</span>
              <span className="text-lg font-bold text-[#40562a]">{money(esperado)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre real de hoy</p>
          <AmountField label="Saldo real en MercadoPago" value={cierreHoy} setValue={setCierreHoy} />
          {n(cierreHoy) > 0 && (
            <>
              <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${diferencia === 0 ? 'border border-[#c9ddc5] bg-[#eff8ed]' : 'border border-[#f0b9b3] bg-[#fdf0ee]'}`}>
                <span className="text-xs font-medium">Diferencia</span>
                <span className="text-lg font-bold">{diferencia === 0 ? '✓ Coincide' : `${diferencia > 0 ? '+' : ''}${money(diferencia)}`}</span>
              </div>
              {diferencia < 0 && (
                <div className="mt-3 rounded-xl border border-[#f0b9b3] bg-[#fdf0ee] p-4">
                  <p className="text-xs font-bold text-[#ba4a3a]">⚠️ Faltan {money(Math.abs(diferencia))}</p>
                  <p className="mt-1 text-[11px] text-[#ba7665]">Verificá si hay pagos o gastos en MP que no se cargaron.</p>
                </div>
              )}
              {diferencia > 0 && (
                <div className="mt-3 rounded-xl border border-[#e8c96e] bg-[#fef9e7] p-4">
                  <p className="text-xs font-bold text-[#926c00]">ℹ️ Sobran {money(diferencia)}</p>
                  <p className="mt-1 text-[11px] text-[#926c00]">Se registrará como diferencia positiva.</p>
                </div>
              )}
              <button onClick={handleGuardar} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
                {saving ? 'Guardando...' : 'Confirmar control MP'} <ShieldCheck size={16} />
              </button>
            </>
          )}
          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Control MP registrado{diferencia !== 0 ? ` — Diferencia ${diferencia > 0 ? '+' : ''}${money(diferencia)} impactada` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}