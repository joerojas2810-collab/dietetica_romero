'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { SaldoApertura, DiferenciaArqueo, ArqueoDiario, Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

function DifBadge({ label, monto, signo }: {
  label: string;
  monto: number;
  signo: 1 | -1;
}) {
  const positivo = signo === 1;
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] ${
      positivo ? 'bg-[#e5f1e2] text-[#3d6942]' : 'bg-[#fdf0ee] text-[#ba4a3a]'
    }`}>
      <span className="font-medium">{label}</span>
      <span className="font-bold">
        {positivo ? '+' : '-'}{money(monto)}
      </span>
    </div>
  );
}

export default function Reportes() {
  const [mes, setMes] = useState(mesActual);
  const [loading, setLoading] = useState(true);
  const [aperturas, setAperturas] = useState<SaldoApertura[]>([]);
  const [diferencias, setDiferencias] = useState<DiferenciaArqueo[]>([]);
  const [arqueosMes, setArqueosMes] = useState<ArqueoDiario[]>([]);
  const [movsMes, setMovsMes] = useState<Movimiento[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');

      const [saldos, difs, arqueos, movs] = await Promise.all([
        db.getSaldosApertura(),
        db.getDiferenciasMes(inicio, fin),
        db.getArqueosMes(inicio, fin),
        db.getMovimientosMes(inicio, fin),
      ]);

      setAperturas(saldos);
      setDiferencias(difs);
      setArqueosMes(arqueos);
      setMovsMes(movs);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  const difsPorFecha = diferencias.reduce<Record<string, DiferenciaArqueo[]>>(
    (acc, d) => {
      if (!acc[d.fecha]) acc[d.fecha] = [];
      acc[d.fecha].push(d);
      return acc;
    },
    {}
  );
  const fechasConDifs = Object.keys(difsPorFecha).sort((a, b) => b.localeCompare(a));

  const totalReasignaciones = diferencias.filter(d => d.tipo === 'reasignacion').length;
  const totalReales = diferencias.filter(d => d.tipo === 'diferencia_real').length;
  const montoTotalDifs = diferencias.reduce((s, d) => s + d.monto * d.signo, 0);

  // ── Helpers caja chica ────────────────────────────────────────────
  const calcCajaChica = (a: ArqueoDiario) =>
    Number(a.bill_100 ?? 0) +
    Number(a.bill_200 ?? 0) +
    Number(a.bill_500 ?? 0) +
    Number(a.bill_1000 ?? 0) +
    Number(a.bill_2000 ?? 0);

  const calcCartuchera = (a: ArqueoDiario) =>
    Number(a.bill_10000 ?? 0) + Number(a.bill_20000 ?? 0);

  const cobroEfectivoPorFecha = movsMes
    .filter(m => m.metodo === 'Efectivo' && Number(m.entrada) > 0)
    .reduce<Record<string, number>>((acc, m) => {
      acc[m.fecha] = (acc[m.fecha] ?? 0) + Number(m.entrada);
      return acc;
    }, {});

  const gastosEfectivoPorFecha = movsMes
    .filter(m => m.metodo === 'Efectivo' && Number(m.salida) > 0)
    .reduce<Record<string, number>>((acc, m) => {
      acc[m.fecha] = (acc[m.fecha] ?? 0) + Number(m.salida);
      return acc;
    }, {});

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Cargando...
    </div>
  );

  const fechaBase = parseISO(mes);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <BarChart3 size={14} /> Historial y controles
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Reportes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Aperturas de mes y diferencias registradas en arqueos.
          </p>
        </div>
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const val = format(startOfMonth(d), 'yyyy-MM-dd');
            return (
              <option key={val} value={val}>
                {format(d, 'MMMM yyyy', { locale: es })}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">

        {/* ── APERTURAS DE MES ───────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Aperturas de mes</p>
          <p className="mb-5 text-xs text-[#99a398]">
            Saldo de apertura de cada mes (cierre del mes anterior).
          </p>

          {aperturas.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              Sin aperturas registradas
            </div>
          ) : (
            <div className="space-y-2">
              {aperturas.map(a => {
                const cajaChica = Number(a.caja_chica ?? a.efectivo ?? 0);
                const cartuchera = Number(a.cartuchera ?? 0);
                const banco = Number(a.banco ?? a.debito ?? 0);
                const mp = Number(a.mercadopago ?? 0);
                const total = cajaChica + cartuchera + banco + mp;

                return (
                  <div key={a.periodo} className="rounded-xl border border-[#edf0eb] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#3c4e3e]">
                        {format(parseISO(a.periodo), 'MMMM yyyy', { locale: es })}
                      </p>
                      <span className="text-sm font-bold text-[#40562a]">
                        {money(total)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                      <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                        <p className="text-[#849083]">Caja chica</p>
                        <p className="font-semibold">{money(cajaChica)}</p>
                      </div>
                      <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                        <p className="text-[#849083]">Cartuchera</p>
                        <p className="font-semibold">{money(cartuchera)}</p>
                      </div>
                      <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                        <p className="text-[#849083]">Banco</p>
                        <p className="font-semibold">{money(banco)}</p>
                      </div>
                      <div className="rounded-lg bg-[#f5f5ec] px-2 py-2">
                        <p className="text-[#849083]">MP</p>
                        <p className="font-semibold">{money(mp)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── DIFERENCIAS DEL MES ────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Diferencias del mes</p>
          <p className="mb-4 text-xs text-[#99a398]">
            Ajustes aceptados en arqueos de banco, MP, efectivo y cartuchera.
          </p>

          {diferencias.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-xl bg-[#f5f5ec] p-3 text-center">
                <p className="text-[#849083]">Total difs</p>
                <p className="text-lg font-bold text-[#3c4e3e]">{diferencias.length}</p>
              </div>
              <div className="rounded-xl bg-[#fdf0ee] p-3 text-center">
                <p className="text-[#849083]">Reasignaciones</p>
                <p className="text-lg font-bold text-[#ba4a3a]">{totalReasignaciones}</p>
              </div>
              <div className="rounded-xl bg-[#fef9e7] p-3 text-center">
                <p className="text-[#849083]">Reales</p>
                <p className="text-lg font-bold text-[#926c00]">{totalReales}</p>
              </div>
            </div>
          )}

          {diferencias.length > 0 && (
            <div className={`mb-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
              montoTotalDifs >= 0
                ? 'bg-[#e5f1e2] text-[#3d6942]'
                : 'bg-[#fdf0ee] text-[#ba4a3a]'
            }`}>
              <span className="text-xs font-medium">Impacto neto del mes</span>
              <span className="font-bold">
                {montoTotalDifs >= 0 ? '+' : ''}{money(montoTotalDifs)}
              </span>
            </div>
          )}

          {fechasConDifs.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              Sin diferencias registradas en{' '}
              {format(fechaBase, 'MMMM', { locale: es })}
            </div>
          ) : (
            <div className="space-y-3">
              {fechasConDifs.map(fecha => {
                const difs = difsPorFecha[fecha];
                return (
                  <div key={fecha} className="rounded-xl border border-[#edf0eb] p-4">
                    <p className="mb-3 text-xs font-bold text-[#3c4e3e]">
                      {format(parseISO(fecha), "d 'de' MMMM", { locale: es })}
                    </p>
                    <div className="space-y-2">
                      {difs.map(d => (
                        <div key={d.id}>
                          <DifBadge
                            label={`${
                              d.metodo === 'MercadoPago' ? 'MP' :
                              d.metodo === 'Debito' ? 'Débito' :
                              d.metodo === 'Credito' ? 'Crédito' :
                              'Efectivo'
                            } · ${d.tipo === 'reasignacion' ? 'Reasignación' : 'Diferencia real'}`}
                            monto={d.monto}
                            signo={d.signo as 1 | -1}
                          />
                          {d.observacion && (
                            <p className="mt-1 rounded-lg bg-[#f5f5ec] px-3 py-1.5 text-[10px] text-[#849083]">
                              📝 {d.observacion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── HISTÓRICO CAJA CHICA ───────────────────────────────────────── */}
      {arqueosMes.length > 0 && (
        <div className="mt-5 rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Histórico caja chica</p>
          <p className="mb-5 text-xs text-[#99a398]">
            Cierre diario de billetes chicos y cartuchera del mes seleccionado.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#e5eae1] text-left text-[#849083]">
                  <th className="pb-3 pr-4 font-semibold">Fecha</th>
                  <th className="pb-3 pr-3 text-right font-semibold">$100</th>
                  <th className="pb-3 pr-3 text-right font-semibold">$200</th>
                  <th className="pb-3 pr-3 text-right font-semibold">$500</th>
                  <th className="pb-3 pr-3 text-right font-semibold">$1.000</th>
                  <th className="pb-3 pr-3 text-right font-semibold">$2.000</th>
                  <th className="pb-3 pr-3 text-right font-semibold">Caja chica</th>
                  <th className="pb-3 pr-3 text-right font-semibold">Cartuchera</th>
                  <th className="pb-3 pr-3 text-right font-semibold">Cobro Efvo</th>
                  <th className="pb-3 text-right font-semibold">Gastos Efvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3ee]">
                {[...arqueosMes]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .map(a => {
                    const cajaChica = calcCajaChica(a);
                    const cartuchera = calcCartuchera(a);
                    const cobro = cobroEfectivoPorFecha[a.fecha] ?? 0;
                    const gastos = gastosEfectivoPorFecha[a.fecha] ?? 0;
                    return (
                      <tr key={a.fecha} className="hover:bg-[#f9fbf7]">
                        <td className="py-3 pr-4 font-semibold text-[#3c4e3e]">
                          {format(parseISO(a.fecha), "d MMM", { locale: es })}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#849083]">
                          {Number(a.bill_100 ?? 0) > 0 ? money(Number(a.bill_100)) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#849083]">
                          {Number(a.bill_200 ?? 0) > 0 ? money(Number(a.bill_200)) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#849083]">
                          {Number(a.bill_500 ?? 0) > 0 ? money(Number(a.bill_500)) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#849083]">
                          {Number(a.bill_1000 ?? 0) > 0 ? money(Number(a.bill_1000)) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#849083]">
                          {Number(a.bill_2000 ?? 0) > 0 ? money(Number(a.bill_2000)) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right font-bold text-[#40562a]">
                          {money(cajaChica)}
                        </td>
                        <td className="py-3 pr-3 text-right font-semibold text-[#526b53]">
                          {cartuchera > 0 ? money(cartuchera) : '—'}
                        </td>
                        <td className="py-3 pr-3 text-right text-[#3d6942]">
                          {cobro > 0 ? `+${money(cobro)}` : '—'}
                        </td>
                        <td className="py-3 text-right text-[#ba7665]">
                          {gastos > 0 ? `-${money(gastos)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}