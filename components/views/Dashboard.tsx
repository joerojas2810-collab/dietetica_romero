'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays, Cloud, PiggyBank, Receipt,
  ShieldCheck, Sparkles, TrendingUp, Wallet, Building2,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Movimiento, ArqueoDiario, GastoFijo, SaldoApertura } from '@/lib/supabase';
import { db } from '@/lib/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { money, compactMoney, semaforo } from '@/lib/helpers';
import StatCard from '@/components/shared/StatCard';
import ControlBadge from '@/components/shared/ControlBadge';
import ControlRow from '@/components/shared/ControlRow';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function Dashboard() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [arqueos, setArqueos] = useState<ArqueoDiario[]>([]);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [apertura, setApertura] = useState<SaldoApertura | null>(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesActual);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');

      const { movimientos: movs, arqueos: arqs, gastosFijos: gf, apertura: ap } = 
        await db.getDashboardData(inicio, fin, inicio);

      setMovimientos(movs);
      setArqueos(arqs);
      setGastosFijos(gf);
      setApertura(ap);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  // ── APERTURAS ─────────────────────────────────────────────────────
  const apEfectivo = Number(apertura?.caja_chica ?? apertura?.efectivo ?? 0);
  const apBanco = Number(apertura?.banco ?? apertura?.debito ?? 0);
  const apMP = Number(apertura?.mercadopago ?? 0);

  // ── MOVIMIENTOS NETOS DEL MES TOTALES ─────────────────────────────
  const movEfectivo = movimientos
    .filter(m => m.metodo === 'Efectivo')
    .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

  const movBanco = movimientos
    .filter(m => m.metodo === 'Debito' || m.metodo === 'Credito')
    .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

  const movMP = movimientos
    .filter(m => m.metodo === 'MercadoPago')
    .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

  const totalEntradas = movimientos.reduce((s, m) => s + Number(m.entrada), 0);
  const totalSalidas = movimientos.reduce((s, m) => s + Number(m.salida), 0);
  const resultado = totalEntradas - totalSalidas;

  // ── SALDOS REALES AL DÍA DE HOY (SISTEMA) ─────────────────────────
  const saldoEfectivo = apEfectivo + movEfectivo;
  const saldoBanco = apBanco + movBanco;
  const saldoMP = apMP + movMP;
  const saldoTotal = saldoEfectivo + saldoBanco + saldoMP;

  // ── CÁLCULO DE SALDOS HISTÓRICOS HASTA UNA FECHA LIMITE ───────────
  const getSaldoBancoHasta = (fechaLimite: string) => {
    const movsFiltrados = movimientos.filter(m => m.fecha <= fechaLimite);
    const movBancoFiltrado = movsFiltrados
      .filter(m => m.metodo === 'Debito' || m.metodo === 'Credito')
      .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
    return apBanco + movBancoFiltrado;
  };

  const getSaldoMPHasta = (fechaLimite: string) => {
    const movsFiltrados = movimientos.filter(m => m.fecha <= fechaLimite);
    const movMPFiltrado = movsFiltrados
      .filter(m => m.metodo === 'MercadoPago')
      .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
    return apMP + movMPFiltrado;
  };

  const getSaldoEfectivoHasta = (fechaLimite: string) => {
    const movsFiltrados = movimientos.filter(m => m.fecha <= fechaLimite);
    const movEfectivoFiltrado = movsFiltrados
      .filter(m => m.metodo === 'Efectivo')
      .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
    return apEfectivo + movEfectivoFiltrado;
  };

  // ── AUDITORÍA DE ÚLTIMO CONTROL DISPONIBLE CON MONTOS REALES ──────
  // Banco (Solo toma arqueos donde realmente se guardó un disponible mayor a 0)
  const arqBanco = arqueos.find(a => 
    (a.disponible_banco != null && Number(a.disponible_banco) > 0) || 
    (a.disponible_debito != null && Number(a.disponible_debito) > 0)
  );
  const disponibleBanco = arqBanco
    ? Number(arqBanco.disponible_banco ?? arqBanco.disponible_debito)
    : null;
  const difBanco = disponibleBanco !== null ? disponibleBanco - getSaldoBancoHasta(arqBanco!.fecha) : null;
  const fechaBanco = arqBanco ? format(parseISO(arqBanco.fecha), "d 'de' MMM", { locale: es }) : '';

  // MercadoPago (Solo toma arqueos donde realmente se controló MP con saldo mayor a 0)
  const arqMP = arqueos.find(a => a.disponible_mp != null && Number(a.disponible_mp) > 0);
  const disponibleMP = arqMP ? Number(arqMP.disponible_mp) : null;
  const difMP = disponibleMP !== null ? disponibleMP - getSaldoMPHasta(arqMP!.fecha) : null;
  const fechaMP = arqMP ? format(parseISO(arqMP.fecha), "d 'de' MMM", { locale: es }) : '';

  // Efectivo (Solo toma arqueos con conteo físico cargado)
  const arqEf = arqueos.find(a => a.total_contado != null && Number(a.total_contado) > 0);
  const contadoEfectivo = arqEf ? Number(arqEf.total_contado) : null;
  const difEfectivo = contadoEfectivo !== null ? contadoEfectivo - getSaldoEfectivoHasta(arqEf!.fecha) : null;
  const fechaEf = arqEf ? format(parseISO(arqEf.fecha), "d 'de' MMM", { locale: es }) : '';

  // ── Gráficos ──────────────────────────────────────────────────────
  const ventasPorDia = useMemo(() => {
    const mapa: Record<string, number> = {};
    movimientos.filter(m => m.entrada > 0).forEach(m => {
      mapa[m.fecha] = (mapa[m.fecha] || 0) + Number(m.entrada);
    });
    return Object.entries(mapa).map(([fecha, value]) => ({
      day: format(parseISO(fecha), 'd'),
      value,
    })).sort((a, b) => Number(a.day) - Number(b.day));
  }, [movimientos]);

  const diasAbiertos = ventasPorDia.filter(d => d.value > 0).length;
  const promedioDiario = diasAbiertos > 0 ? Math.round(totalEntradas / diasAbiertos) : 0;

  const gastosPorCategoria = useMemo(() => {
    const colores: Record<string, string> = {
      'MATERIA PRIMA': '#758b5b',
      'PERSONAL':      '#c6a15b',
      'OPERATIVO':     '#9aa88d',
      'DESECHABLES':   '#d9c8a4',
      'AHORRO':        '#4c6651',
      'GISELA':        '#a07b9c',
      'EXTRAORDINARIO':'#c47b5b',
    };
    const mapa: Record<string, number> = {};
    movimientos.filter(m => m.salida > 0 && m.categoria).forEach(m => {
      mapa[m.categoria!] = (mapa[m.categoria!] || 0) + Number(m.salida);
    });
    return Object.entries(mapa).map(([name, value]) => ({
      name, value, color: colores[name] || '#888',
    })).sort((a, b) => b.value - a.value);
  }, [movimientos]);

  const totalGastosFijos = gastosFijos.reduce((s, g) => s + Number(g.monto), 0);
  const metaDiaria = totalGastosFijos > 0 ? Math.round(totalGastosFijos / 24) : 0;
  const brechaVsMeta = promedioDiario - metaDiaria;

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Cargando datos...
    </div>
  );

  const fechaBase = parseISO(mes);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Sparkles size={14} /> Tu negocio, en equilibrio
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Resumen del mes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Promedio sobre {diasAbiertos} días abiertos
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

      {/* ── KPIs principales (Saldos reales de sistema hoy) ───────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Saldo total"
          value={money(saldoTotal)}
          icon={<Wallet size={18} />}
          accent="green"
        />
        <StatCard
          label="Efectivo"
          value={money(saldoEfectivo)}
          icon={<Receipt size={18} />}
          accent="sand"
        />
        <StatCard
          label="Banco"
          value={money(saldoBanco)}
          icon={<Building2 size={18} />}
          accent="blue"
        />
        <StatCard
          label="MercadoPago"
          value={money(saldoMP)}
          icon={<Cloud size={18} />}
          accent="lilac"
        />
        <StatCard
          label="Resultado del mes"
          value={money(resultado)}
          icon={<TrendingUp size={18} />}
          accent="green"
        />
      </div>

      {/* ── Meta diaria ─────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Gastos fijos del mes"
          value={money(totalGastosFijos)}
          icon={<PiggyBank size={18} />}
          accent="sand"
        />
        <StatCard
          label="Meta diaria"
          value={money(metaDiaria)}
          icon={<CalendarDays size={18} />}
          accent="blue"
        />
        <StatCard
          label="Brecha vs meta"
          value={`${brechaVsMeta > 0 ? '+' : brechaVsMeta < 0 ? '-' : ''}${money(Math.abs(brechaVsMeta))}`}
          icon={<Sparkles size={18} />}
          accent={brechaVsMeta >= 0 ? 'green' : 'sand'}
        />
      </div>

      {/* ── Arqueo badges con fechas independientes de última auditoría real ─── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <ControlBadge
          label={fechaEf ? `Diferencia Efectivo (${fechaEf})` : "Diferencia Efectivo"}
          dif={difEfectivo}
          status={semaforo(difEfectivo)}
        />
        <ControlBadge
          label={fechaBanco ? `Diferencia Banco (${fechaBanco})` : "Diferencia Banco"}
          dif={difBanco}
          status={semaforo(difBanco)}
        />
        <ControlBadge
          label={fechaMP ? `Diferencia MP (${fechaMP})` : "Diferencia MP"}
          dif={difMP}
          status={semaforo(difMP)}
        />
      </div>

      {/* ── Gráficos ────────────────────────────────────────────────── */}
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">Ventas del mes</p>
              <p className="mt-1 text-xs text-[#99a398]">Evolución diaria de cobros</p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="text-3xl font-bold tracking-[-0.05em]">
              {compactMoney(totalEntradas)}
            </span>
            <span className="text-xs text-[#849083]">
              Promedio diario: <strong>{money(promedioDiario)}</strong>
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorDia} margin={{ top: 10, right: 0, left: -22, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#edf0ea" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip cursor={{ fill: '#f4f7f1' }} formatter={v => money(Number(v))} labelFormatter={l => `Día ${l}`} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="#839358" radius={[4, 4, 0, 0]} barSize={9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eef1eb] pt-4 text-xs">
            <span className="text-[#8c998c]">{diasAbiertos} días abiertos</span>
            <span className="font-semibold text-[#5e8661]">Total: {money(totalEntradas)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">Gastos por categoría</p>
              <p className="mt-1 text-xs text-[#99a398]">
                Distribución de {compactMoney(totalSalidas)}
              </p>
            </div>
          </div>
          {gastosPorCategoria.length > 0 ? (
            <>
              <div className="relative mx-auto mt-2 h-[230px] w-full max-w-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gastosPorCategoria}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={97}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {gastosPorCategoria.map(entry => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={v => money(Number(v))}
                      contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{compactMoney(totalSalidas)}</span>
                  <span className="text-[10px] text-[#99a398]">total gastos</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#eef1eb] pt-4">
                {gastosPorCategoria.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px] text-[#7f8c7e]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                    <span className="ml-auto font-semibold text-[#516550]">
                      {Math.round(item.value / totalSalidas * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-[#849083]">
              Sin gastos cargados
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">Resumen mensual</p>
                <p className="mt-1 text-xs text-[#99a398]">Evolución de ventas</p>
              </div>
            </div>
            {ventasPorDia.length > 0 ? (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ventasPorDia} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#edf0ea" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} tickFormatter={v => `${v / 1000}k`} />
                      <Tooltip formatter={v => money(Number(v))} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" name="Ventas" stroke="#6f8441" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex gap-4 text-[11px] text-[#8a9689]">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2 w-2 rounded-full bg-[#6f8441]" />Ventas
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#849083]">
                Sin datos para graficar
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">Diferencias de Arqueo</p>
                <p className="mt-1 text-xs text-[#c0d7bd]">Detalle de auditoría por cuenta</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck size={18} />
              </span>
            </div>
            <div className="mt-7 space-y-4">
              <ControlRow
                label={fechaEf ? `Efectivo (${fechaEf})` : "Diferencia Efectivo"}
                value={difEfectivo !== null ? money(difEfectivo) : '—'}
                status={semaforo(difEfectivo)}
              />
              <ControlRow
                label={fechaBanco ? `Banco (${fechaBanco})` : "Diferencia Banco"}
                value={difBanco !== null ? money(difBanco) : '—'}
                status={semaforo(difBanco)}
              />
              <ControlRow
                label={fechaMP ? `MP (${fechaMP})` : "Diferencia MP"}
                value={difMP !== null ? money(difMP) : '—'}
                status={semaforo(difMP)}
              />
            </div>
            {arqueos.length > 0 && arqueos[0].observaciones && (
              <div className="mt-5 rounded-xl bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#c0d7bd]">
                  Última Observación ({format(parseISO(arqueos[0].fecha), "d/MM")})
                </p>
                <p className="mt-1 text-xs">{arqueos[0].observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}