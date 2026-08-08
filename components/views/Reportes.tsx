'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { SaldoApertura } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money, semaforo } from '@/lib/helpers';
import ControlBadge from '@/components/shared/ControlBadge';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function Reportes() {
  const [mes, setMes] = useState(mesActual);
  const [loading, setLoading] = useState(true);
  const [aperturas, setAperturas] = useState<SaldoApertura[]>([]);
  const [desvios, setDesvios] = useState<{
    fecha: string;
    difEfectivo: number | null;
    difDebito: number | null;
    difMP: number | null;
    observaciones?: string | null;
  }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');

      const [saldos, movs] = await Promise.all([
        db.getSaldosApertura(),
        db.getMovimientosMes(inicio, fin),
      ]);

      setAperturas(saldos);

      const porDia: Record<string, { ef: number; db: number; mp: number }> = {};
      movs.forEach(m => {
        if (!porDia[m.fecha]) porDia[m.fecha] = { ef: 0, db: 0, mp: 0 };
        const delta = Number(m.entrada) - Number(m.salida);
        if (m.metodo === 'Efectivo') porDia[m.fecha].ef += delta;
        if (m.metodo === 'Debito') porDia[m.fecha].db += delta;
        if (m.metodo === 'MercadoPago') porDia[m.fecha].mp += delta;
      });

      setDesvios([]);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><BarChart3 size={14} /> Historial y controles</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Reportes</h2>
          <p className="mt-2 text-sm text-[#849083]">Aperturas de mes y desvíos de efectivo, débito y MercadoPago.</p>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const val = format(startOfMonth(d), 'yyyy-MM-dd');
            return <option key={val} value={val}>{format(d, 'MMMM yyyy', { locale: es })}</option>;
          })}
        </select>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Aperturas de mes</p>
          <p className="mb-5 text-xs text-[#99a398]">Cada fila es el saldo de apertura (cierre del mes anterior).</p>
          {aperturas.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">Sin aperturas registradas</div>
          ) : (
            <div className="space-y-2">
              {aperturas.map(a => (
                <div key={a.periodo} className="rounded-xl border border-[#edf0eb] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#3c4e3e]">{format(parseISO(a.periodo), 'MMMM yyyy', { locale: es })}</p>
                    <span className="text-sm font-bold text-[#40562a]">{money(Number(a.efectivo) + Number(a.debito) + Number(a.mercadopago))}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                      <p className="text-[#849083]">Efectivo</p>
                      <p className="font-semibold">{money(Number(a.efectivo))}</p>
                    </div>
                    <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                      <p className="text-[#849083]">Débito</p>
                      <p className="font-semibold">{money(Number(a.debito))}</p>
                    </div>
                    <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                      <p className="text-[#849083]">MP</p>
                      <p className="font-semibold">{money(Number(a.mercadopago))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Desvíos del mes</p>
          <p className="mb-5 text-xs text-[#99a398]">Días con diferencia ≠ 0 en efectivo, débito o MP.</p>
          {desvios.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">Sin desvíos en este mes</div>
          ) : (
            <div className="space-y-3">
              {desvios.map(d => (
                <div key={d.fecha} className="rounded-xl border border-[#edf0eb] p-4">
                  <p className="mb-3 text-xs font-bold text-[#3c4e3e]">{format(parseISO(d.fecha), "d 'de' MMMM", { locale: es })}</p>
                  <div className="space-y-2">
                    <ControlBadge label="Efectivo" dif={d.difEfectivo} status={semaforo(d.difEfectivo)} />
                    <ControlBadge label="Débito" dif={d.difDebito} status={semaforo(d.difDebito)} />
                    <ControlBadge label="MercadoPago" dif={d.difMP} status={semaforo(d.difMP)} />
                  </div>
                  {d.observaciones && <p className="mt-3 text-[11px] text-[#849083]">Obs: {d.observaciones}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}