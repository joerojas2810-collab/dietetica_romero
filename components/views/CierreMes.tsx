'use client';

import { useEffect, useState } from 'react';
import { Cloud, PiggyBank, Receipt } from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import CreditCardIcon from '@/components/shared/CreditCardIcon';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function CierreMes() {
  const [mes, setMes] = useState(mesActual);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [yaExiste, setYaExiste] = useState(false);

  const [aperturaEfectivo, setAperturaEfectivo] = useState(0);
  const [aperturaDebito, setAperturaDebito] = useState(0);
  const [aperturaMP, setAperturaMP] = useState(0);
  const [saldoEfectivo, setSaldoEfectivo] = useState(0);
  const [saldoDebito, setSaldoDebito] = useState(0);
  const [saldoMP, setSaldoMP] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSalidas, setTotalSalidas] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSaved(false);

      const fechaBase = parseISO(mes);
      const inicio = format(startOfMonth(fechaBase), 'yyyy-MM-dd');
      const fin = format(endOfMonth(fechaBase), 'yyyy-MM-dd');
      const mesSiguiente = format(
        startOfMonth(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1)),
        'yyyy-MM-dd'
      );

      const [movs, apertura, existente] = await Promise.all([
        db.getMovimientosMes(inicio, fin),
        db.getSaldoApertura(mes),
        db.getSaldoApertura(mesSiguiente),
      ]);

      const apEf = Number(apertura?.efectivo || 0);
      const apDb = Number(apertura?.debito || 0);
      const apMp = Number(apertura?.mercadopago || 0);

      setAperturaEfectivo(apEf);
      setAperturaDebito(apDb);
      setAperturaMP(apMp);

      const movEf = movs.filter(m => m.metodo === 'Efectivo').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
      const movDb = movs.filter(m => m.metodo === 'Debito').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
      const movMp = movs.filter(m => m.metodo === 'MercadoPago').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      setSaldoEfectivo(apEf + movEf);
      setSaldoDebito(apDb + movDb);
      setSaldoMP(apMp + movMp);
      setTotalEntradas(movs.reduce((s, m) => s + Number(m.entrada), 0));
      setTotalSalidas(movs.reduce((s, m) => s + Number(m.salida), 0));
      setYaExiste(!!existente);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  const resultado = totalEntradas - totalSalidas;
  const saldoTotal = saldoEfectivo + saldoDebito + saldoMP;

  const handleCerrar = async () => {
    setSaving(true);
    const fechaBase = parseISO(mes);
    const mesSiguiente = format(
      startOfMonth(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1)),
      'yyyy-MM-dd'
    );
    await db.upsertSaldoApertura({ periodo: mesSiguiente, efectivo: saldoEfectivo, debito: saldoDebito, mercadopago: saldoMP });
    setSaving(false);
    setSaved(true);
    setYaExiste(true);
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  const fechaBase = parseISO(mes);
  const mesNombre = format(fechaBase, 'MMMM yyyy', { locale: es });
  const mesSigNombre = format(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1), 'MMMM yyyy', { locale: es });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><PiggyBank size={14} /> Cierre mensual</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Cierre de mes</h2>
          <p className="mt-2 text-sm text-[#849083]">Revisá los saldos finales y trasladalos como apertura del mes siguiente.</p>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const val = format(startOfMonth(d), 'yyyy-MM-dd');
            return <option key={val} value={val}>{format(d, 'MMMM yyyy', { locale: es })}</option>;
          })}
        </select>
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-4 text-sm font-bold">Resumen de {mesNombre}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Apertura del mes</span>
              <span className="text-sm font-bold text-[#40562a]">{money(aperturaEfectivo + aperturaDebito + aperturaMP)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
              <span className="text-xs font-medium text-[#3d6942]">Total entradas</span>
              <span className="text-sm font-bold text-[#3d6942]">{money(totalEntradas)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f9ebe6] px-4 py-3">
              <span className="text-xs font-medium text-[#ba7665]">Total salidas</span>
              <span className="text-sm font-bold text-[#ba7665]">{money(totalSalidas)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Resultado del mes</span>
              <span className="text-lg font-bold text-[#40562a]">{money(resultado)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-4 text-sm font-bold">Saldos finales</p>
          <p className="mb-3 text-[11px] text-[#99a398]">Estos saldos se trasladarán como apertura de {mesSigNombre}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]"><Receipt size={14} /> Efectivo</span>
              <div className="text-right">
                <p className="text-[10px] text-[#99a398]">Apertura {money(aperturaEfectivo)}</p>
                <span className="text-sm font-bold">{money(saldoEfectivo)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]"><CreditCardIcon /> Débito</span>
              <div className="text-right">
                <p className="text-[10px] text-[#99a398]">Apertura {money(aperturaDebito)}</p>
                <span className="text-sm font-bold">{money(saldoDebito)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]"><Cloud size={14} /> MercadoPago</span>
              <div className="text-right">
                <p className="text-[10px] text-[#99a398]">Apertura {money(aperturaMP)}</p>
                <span className="text-sm font-bold">{money(saldoMP)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#40562a] px-4 py-3 text-white">
              <span className="text-xs font-medium">Saldo total final</span>
              <span className="text-lg font-bold">{money(saldoTotal)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          {yaExiste && !saved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e8c96e] bg-[#fef9e7] px-4 py-3">
              <span className="text-xs font-bold text-[#926c00]">⚠️ Ya existe una apertura cargada para {mesSigNombre}</span>
            </div>
          )}
          {saved ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Cierre registrado — Apertura de {mesSigNombre} guardada
            </div>
          ) : (
            <button onClick={handleCerrar} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
              {saving ? 'Cerrando...' : yaExiste ? `Actualizar apertura de ${mesSigNombre}` : `Cerrar ${mesNombre} y abrir ${mesSigNombre}`}
              <PiggyBank size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}