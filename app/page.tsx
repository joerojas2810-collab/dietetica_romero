'use client';

import Login from '@/components/Login';
import { useEffect, useState, useMemo } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays,
  ChevronDown, CirclePlus, ClipboardList, Cloud, Download,
  Filter, Menu, PiggyBank, Receipt,
  Search, Settings2, ShieldCheck,
  Sparkles, Trash2, TrendingUp, Wallet, X,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Movimiento, ArqueoDiario, MetodoPago, CategoriaGasto, GastoFijo, SaldoApertura } from '@/lib/supabase';
import { db, supabaseAuth } from '@/lib/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v: number) =>
  `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;
const compactMoney = (v: number) =>
  v >= 1000000 ? `$ ${(v / 1000000).toFixed(1).replace('.', ',')}M` : money(v);
const today = format(new Date(), 'yyyy-MM-dd');
const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

type View =
  | 'dashboard'
  | 'day'
  | 'movements'
  | 'cartuchera'
  | 'controlmp'
  | 'controldebito'
  | 'pagos'
  | 'config'
  | 'cierre'
  | 'reportes';

// ─── App principal ─────────────────────────────────────────────────────────────
export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // Verifica si ya hay una sesión activa de Supabase
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setCheckingAuth(false);
    });

    // Escucha cambios de sesión (login / logout / token refresh)
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      (_event, session) => {
        setAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3200);
  };

  const handleLogout = async () => {
    await supabaseAuth.auth.signOut();
    setAuthenticated(false);
  };

  // Mientras verifica la sesión, no muestra nada (evita flash del login)
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f2]">
        <div className="text-sm text-[#849083]">Cargando...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#243126]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e5e9df] bg-[#fbfcf8] px-5 py-6 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <button onClick={() => setView('dashboard')} className="text-left">
            <div className="relative h-[82px] w-[188px] overflow-hidden rounded-2xl bg-[#fdfdf9]">
              <img src="/IMG_7336.jpg" alt="Dietética Romero" className="h-full w-full object-cover object-center" />
            </div>
          </button>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">Operación</p>
        <nav className="space-y-1">
          <NavItem active={view === 'dashboard'} icon={<BarChart3 size={18} />} label="Dashboard" onClick={() => { setView('dashboard'); setMobileOpen(false); }} />
          <NavItem active={view === 'day'} icon={<CalendarDays size={18} />} label="Carga del día" badge="Hoy" onClick={() => { setView('day'); setMobileOpen(false); }} />
          <NavItem active={view === 'movements'} icon={<ClipboardList size={18} />} label="Movimientos" onClick={() => { setView('movements'); setMobileOpen(false); }} />
        </nav>

        <NavItem active={view === 'cartuchera'} icon={<ShieldCheck size={18} />} label="Cartuchera" onClick={() => { setView('cartuchera'); setMobileOpen(false); }} />
        <NavItem active={view === 'controlmp'} icon={<Cloud size={18} />} label="Control MP" onClick={() => { setView('controlmp'); setMobileOpen(false); }} />
        <NavItem active={view === 'controldebito'} icon={<CreditCardIcon />} label="Control Débito" onClick={() => { setView('controldebito'); setMobileOpen(false); }} />
        <NavItem active={view === 'pagos'} icon={<CirclePlus size={18} />} label="Pagos individuales" onClick={() => { setView('pagos'); setMobileOpen(false); }} />

        <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">Administración</p>
        <nav className="space-y-1">
        <NavItem active={view === 'cierre'} icon={<PiggyBank size={18} />} label="Cierre de mes" onClick={() => { setView('cierre'); setMobileOpen(false); }}/>        
        <NavItem active={view === 'config'} icon={<Settings2 size={18} />} label="Configuración" onClick={() => { setView('config'); setMobileOpen(false); }}/>
        <NavItem active={view === 'reportes'} icon={<BarChart3 size={18} />} label="Reportes" onClick={() => { setView('reportes'); setMobileOpen(false); }} />
        </nav>

        <div className="mt-auto rounded-2xl bg-[#eef3e8] p-4">
          <div className="mb-2 flex items-center gap-2 text-[#5f805f]">
            <ShieldCheck size={17} />
            <span className="text-xs font-semibold">Datos protegidos</span>
          </div>
          <p className="text-[11px] leading-5 text-[#71806c]">Tu información se guarda de forma segura en Supabase.</p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#e4e9de] bg-white p-3 transition hover:bg-[#fdf0ee]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e3f3] font-bold text-sm text-[#4a5b2c]">DR</div>
          <div className="text-left">
            <p className="text-xs font-bold">D. Romero</p>
            <p className="text-[11px] text-[#ba7665]">Cerrar sesión</p>
          </div>
        </button>
      </aside>

      {/* Main */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8ece4] bg-[#f6f7f2]/95 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#93a092]">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-[-0.03em]">
                {view === 'dashboard' ? 'Resumen del negocio'
                  : view === 'day' ? 'Carga del día'
                  : view === 'movements' ? 'Movimientos'
                  : view === 'cartuchera' ? 'Control de cartuchera'
                  : view === 'controlmp' ? 'Control MercadoPago'
                  : view === 'controldebito' ? 'Control Débito'
                  : view === 'config' ? 'Configuración'
                  : view === 'cierre' ? 'Cierre de mes'    
                  : view === 'reportes' ? 'Reportes'              
                  : 'Pagos individuales'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e1e7dc] bg-white py-2 pl-2 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e3f3] text-[10px] font-bold text-[#4a5b2c]">
              DR
            </div>
            <span className="hidden text-xs font-semibold sm:block">D. Romero</span>
            <ChevronDown size={14} className="text-[#849181]" />
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {view === 'dashboard' && <Dashboard />}
          {view === 'day' && <DayForm onSave={toast} />}
          {view === 'movements' && <Movements />}
          {view === 'cartuchera' && <Cartuchera />}
          {view === 'controlmp' && <ControlMP />}
          {view === 'controldebito' && <ControlDebito />}
          {view === 'pagos' && <PagosIndividuales />}
          {view === 'config' && <Configuracion />}
          {view === 'cierre' && <CierreMes />}
          {view === 'reportes' && <Reportes />}
        </section>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#c9ddc5] bg-[#eff8ed] px-5 py-4 text-sm font-semibold text-[#3d6942] shadow-xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
          {toastMsg}
        </div>
      )}
    </main>
  );
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ icon, label, badge, active, onClick }: {
  icon?: React.ReactNode; label: string; badge?: string; active?: boolean; onClick?: () => void
}) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${active ? 'bg-[#edf0e2] text-[#4d612e] shadow-sm' : 'text-[#788578] hover:bg-[#f0f4ec] hover:text-[#3c5d41]'}`}>
      <span className={active ? 'text-[#6f8441]' : 'text-[#96a396] group-hover:text-[#5a7a5d]'}>{icon}</span>
      <span>{label}</span>
      {badge && <span className="ml-auto rounded-full bg-[#e4ead4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#566735]">{badge}</span>}
    </button>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [arqueo, setArqueo] = useState<ArqueoDiario | null>(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesActual);
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const [movs, arq, gf] = await Promise.all([
  db.getMovimientosMes(inicio, fin),
  db.getArqueoMes(inicio, fin),
  db.getGastosFijos(inicio),
]);

setMovimientos(movs);
setArqueo(arq);
setGastosFijos(gf);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  const totalEntradas = movimientos.reduce((s, m) => s + Number(m.entrada), 0);
  const totalSalidas = movimientos.reduce((s, m) => s + Number(m.salida), 0);
  const resultado = totalEntradas - totalSalidas;
  const saldoEfectivo = movimientos.filter(m => m.metodo === 'Efectivo').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
  const saldoDebito = movimientos.filter(m => m.metodo === 'Debito').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
  const saldoMP = movimientos.filter(m => m.metodo === 'MercadoPago').reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);
  const saldoTotal = saldoEfectivo + saldoDebito + saldoMP;

    const ventasPorDia = useMemo(() => {
    const mapa: Record<string, number> = {};
    movimientos.filter(m => m.entrada > 0).forEach(m => {
      mapa[m.fecha] = (mapa[m.fecha] || 0) + Number(m.entrada);
    });
    return Object.entries(mapa).map(([fecha, value]) => ({
      day: format(parseISO(fecha), 'd'),
      value,
    }));
  }, [movimientos]);

  const diasAbiertos = ventasPorDia.filter(d => d.value > 0).length;
  const promedioDiario = diasAbiertos > 0 ? Math.round(totalEntradas / diasAbiertos) : 0;

  const totalGastosFijos = gastosFijos.reduce((s, g) => s + Number(g.monto), 0);
  const metaDiaria = totalGastosFijos > 0 ? Math.round(totalGastosFijos / 24) : 0;
  const brechaVsMeta = promedioDiario - metaDiaria;

  const estadoMeta =
    brechaVsMeta >= 0 ? 'ok'
    : Math.abs(brechaVsMeta) <= 1000 ? 'warn'
    : 'error';

  const gastosPorCategoria = useMemo(() => {
    const colores: Record<string, string> = {
      'MATERIA PRIMA': '#758b5b', 'PERSONAL': '#c6a15b',
      'OPERATIVO': '#9aa88d', 'DESECHABLES': '#d9c8a4',
      'AHORRO': '#4c6651', 'GISELA': '#6b5769', 'EXTRAORDINARIO': '#c47b5b',
    };
    const mapa: Record<string, number> = {};
    movimientos.filter(m => m.salida > 0 && m.categoria).forEach(m => {
      mapa[m.categoria!] = (mapa[m.categoria!] || 0) + Number(m.salida);
    });
    return Object.entries(mapa).map(([name, value]) => ({
      name, value, color: colores[name] || '#888',
    }));
  }, [movimientos]);

  const difEfectivo = arqueo ? (arqueo.total_contado || 0) - saldoEfectivo : null;
  const difDebito = arqueo ? (arqueo.disponible_debito || 0) - saldoDebito : null;
  const difMP = arqueo ? (arqueo.disponible_mp || 0) - saldoMP : null;

  const semaforo = (dif: number | null) => {
    if (dif === null) return 'sin-dato';
    if (dif === 0) return 'ok';
    if (Math.abs(dif) <= 1000) return 'warn';
    return 'error';
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando datos...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Sparkles size={14} /> Tu negocio, en equilibrio
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Resumen del mes</h2>
          <p className="mt-2 text-sm text-[#849083]">Promedio sobre {diasAbiertos} días abiertos</p>
        </div>
        <select value={mes} onChange={e => setMes(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none">
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const val = format(startOfMonth(d), 'yyyy-MM-dd');
            return <option key={val} value={val}>{format(d, 'MMMM yyyy', { locale: es })}</option>;
          })}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Saldo total" value={money(saldoTotal)} icon={<Wallet size={18} />} accent="green" />
        <StatCard label="Efectivo" value={money(saldoEfectivo)} icon={<Receipt size={18} />} accent="sand" />
        <StatCard label="Débito" value={money(saldoDebito)} icon={<CreditCardIcon />} accent="blue" />
        <StatCard label="MercadoPago" value={money(saldoMP)} icon={<Cloud size={18} />} accent="lilac" />
        <StatCard label="Resultado del mes" value={money(resultado)} icon={<TrendingUp size={18} />} accent="green" />
      </div>

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

<div className="mt-4">
  <ControlBadge
    label="Estado meta diaria"
    dif={brechaVsMeta}
    status={estadoMeta}
  />
</div>

      {arqueo && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <ControlBadge label="Arqueo efectivo" dif={difEfectivo} status={semaforo(difEfectivo)} />
          <ControlBadge label="Disponible Débito" dif={difDebito} status={semaforo(difDebito)} />
          <ControlBadge label="Disponible MP" dif={difMP} status={semaforo(difMP)} />
        </div>
      )}

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-sm font-bold">Ventas del mes</p>
              <p className="mt-1 text-xs text-[#99a398]">Evolución diaria de cobros</p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="text-3xl font-bold tracking-[-0.05em]">{compactMoney(totalEntradas)}</span>
            <span className="text-xs text-[#849083]">Promedio diario: <strong>{money(promedioDiario)}</strong></span>
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
              <p className="mt-1 text-xs text-[#99a398]">Distribución de {compactMoney(totalSalidas)}</p>
            </div>
          </div>
          {gastosPorCategoria.length > 0 ? (
            <>
              <div className="relative mx-auto mt-2 h-[230px] w-full max-w-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gastosPorCategoria} dataKey="value" nameKey="name" innerRadius={72} outerRadius={97} paddingAngle={3} stroke="none">
                      {gastosPorCategoria.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={v => money(Number(v))} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} />
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
            <div className="flex h-48 items-center justify-center text-sm text-[#849083]">Sin gastos cargados</div>
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
                  <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#6f8441]" />Ventas</span>
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-[#849083]">Sin datos para graficar</div>
            )}
          </div>

          <div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">Controles del día</p>
                <p className="mt-1 text-xs text-[#c0d7bd]">Último arqueo registrado</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck size={18} />
              </span>
            </div>
            <div className="mt-7 space-y-4">
              <ControlRow label="Arqueo de efectivo" value={difEfectivo !== null ? money(difEfectivo) : '—'} status={semaforo(difEfectivo)} />
              <ControlRow label="Disponible Débito" value={difDebito !== null ? money(difDebito) : '—'} status={semaforo(difDebito)} />
              <ControlRow label="Disponible MP" value={difMP !== null ? money(difMP) : '—'} status={semaforo(difMP)} />
            </div>
            {arqueo?.observaciones && (
              <div className="mt-5 rounded-xl bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[#c0d7bd]">Observación</p>
                <p className="mt-1 text-xs">{arqueo.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="group rounded-2xl border border-[#e5eae1] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent === 'green' ? 'bg-[#e8edda] text-[#60763a]' : accent === 'sand' ? 'bg-[#f5ecdb] text-[#a98548]' : accent === 'blue' ? 'bg-[#e3edf0] text-[#597d85]' : 'bg-[#edeae3] text-[#7a806b]'}`}>
        {icon}
      </span>
      <p className="mt-4 text-xs text-[#8b988b]">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function ControlBadge({ label, dif, status }: { label: string; dif: number | null; status: string }) {
  const colors = {
    ok: 'bg-[#e5f1e2] text-[#3d6942] border-[#c9ddc5]',
    warn: 'bg-[#fef9e7] text-[#926c00] border-[#f0d296]',
    error: 'bg-[#fdf0ee] text-[#ba4a3a] border-[#f0b9b3]',
    'sin-dato': 'bg-[#f5f5f5] text-[#888] border-[#ddd]',
  };
  const dot = { ok: 'bg-[#76ad6d]', warn: 'bg-[#e1bb70]', error: 'bg-[#d9534f]', 'sin-dato': 'bg-[#aaa]' };
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${colors[status as keyof typeof colors]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot[status as keyof typeof dot]}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold">{dif !== null ? money(dif) : '—'}</span>
    </div>
  );
}

function ControlRow({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${status === 'ok' ? 'bg-[#a9d89d]' : status === 'warn' ? 'bg-[#e1bb70]' : 'bg-[#d9534f]'}`} />
        <span className="text-xs text-[#e0eadd]">{label}</span>
      </div>
      <span className={`text-xs font-bold ${status === 'ok' ? 'text-[#c2e6b9]' : status === 'warn' ? 'text-[#f0d296]' : 'text-[#f0b9b3]'}`}>
        {value}
      </span>
    </div>
  );
}

function CreditCardIcon() {
  return (
    <div className="relative h-[17px] w-[19px] rounded-[3px] border-2 border-current">
      <span className="absolute left-0 top-[3px] h-[2px] w-full bg-current" />
      <span className="absolute bottom-[3px] left-[3px] h-[2px] w-[5px] bg-current" />
    </div>
  );
}

// ─── DAY FORM ─────────────────────────────────────────────────────────────────
interface GastoRow { concept: string; amount: string; method: MetodoPago; category: CategoriaGasto; }

function DayForm({ onSave }: { onSave: (msg: string) => void }) {
  const [fecha, setFecha] = useState(today);
  const [cobroMP, setCobroMP] = useState('');
  const [cobroEfectivo, setCobroEfectivo] = useState('');
  const [cobroDebito, setCobroDebito] = useState('');
  const [qty100, setQty100] = useState('');
  const [qty200, setQty200] = useState('');
  const [qty500, setQty500] = useState('');
  const [qty1000, setQty1000] = useState('');
  const [qty2000, setQty2000] = useState('');
  const [qty10000, setQty10000] = useState('');
  const [qty20000, setQty20000] = useState('');
  const [gastos, setGastos] = useState<GastoRow[]>([{ concept: '', amount: '', method: 'Efectivo', category: 'OPERATIVO' }]);
  const [saving, setSaving] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const totalCobrado = n(cobroMP) + n(cobroEfectivo) + n(cobroDebito);
  const val100 = n(qty100) * 100;
  const val200 = n(qty200) * 200;
  const val500 = n(qty500) * 500;
  const val1000 = n(qty1000) * 1000;
  const val2000 = n(qty2000) * 2000;
  const val10000 = n(qty10000) * 10000;
  const val20000 = n(qty20000) * 20000;
  const cajaFuerteTotal = val10000 + val20000;
  const totalContado = val100 + val200 + val500 + val1000 + val2000 + cajaFuerteTotal;
  const difEfectivo = totalContado - n(cobroEfectivo);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await db.deleteMovimientosDia(fecha);

      const cobros: Omit<Movimiento, 'id' | 'created_at'>[] = [];
      if (n(cobroMP) > 0) cobros.push({ fecha, concepto: 'Cobro MP', entrada: n(cobroMP), salida: 0, metodo: 'MercadoPago' });
      if (n(cobroEfectivo) > 0) cobros.push({ fecha, concepto: 'Cobro Efectivo', entrada: n(cobroEfectivo), salida: 0, metodo: 'Efectivo' });
      if (n(cobroDebito) > 0) cobros.push({ fecha, concepto: 'Cobro Débito', entrada: n(cobroDebito), salida: 0, metodo: 'Debito' });

      const gastosRows: Omit<Movimiento, 'id' | 'created_at'>[] = gastos
        .filter(g => g.concept.trim() && n(g.amount) > 0)
        .map(g => ({ fecha, concepto: g.concept, entrada: 0, salida: n(g.amount), metodo: g.method, categoria: g.category }));

      await db.insertMovimientos([...cobros, ...gastosRows]);
      await db.upsertArqueo({ fecha, bill_100: val100, bill_200: val200, bill_500: val500, bill_1000: val1000, bill_2000: val2000, a_caja_fuerte: cajaFuerteTotal });

      onSave('¡Día guardado correctamente!');
    } catch (e) {
      console.error('Error al guardar:', e);
      onSave('Error al guardar. Intentá de nuevo.');
    }
    setSaving(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <CalendarDays size={14} /> Registro diario
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Cargá el día</h2>
          <p className="mt-2 text-sm text-[#849083]">Completá los valores del cierre para mantener todo en orden.</p>
        </div>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <SectionCard number="01" title="Cobros del sistema" description="Ingresá lo que informa el sistema de ventas.">
            <div className="grid gap-3 sm:grid-cols-3">
              <AmountField label="Cobro MP" value={cobroMP} setValue={setCobroMP} icon={<Cloud size={16} />} />
              <AmountField label="Cobro Efectivo" value={cobroEfectivo} setValue={setCobroEfectivo} icon={<Receipt size={16} />} />
              <AmountField label="Cobro Débito" value={cobroDebito} setValue={setCobroDebito} icon={<CreditCardIcon />} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#768676]">Total cobrado</span>
              <span className="text-lg font-bold text-[#40562a]">{money(totalCobrado)}</span>
            </div>
          </SectionCard>

          <SectionCard number="02" title="Arqueo de billetes" description="Contá el efectivo físico en caja.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <BillField label="$100" qty={qty100} setQty={setQty100} denom={100} />
              <BillField label="$200" qty={qty200} setQty={setQty200} denom={200} />
              <BillField label="$500" qty={qty500} setQty={setQty500} denom={500} />
              <BillField label="$1.000" qty={qty1000} setQty={setQty1000} denom={1000} />
              <BillField label="$2.000" qty={qty2000} setQty={setQty2000} denom={2000} />
            </div>
            <div className="mt-4 rounded-xl border border-[#d5e5d1] bg-[#f2f0e8] p-4">
              <p className="mb-3 text-xs font-bold text-[#40562a]">→ A cartuchera</p>
              <div className="grid grid-cols-2 gap-3">
                <BillField label="$10.000" qty={qty10000} setQty={setQty10000} denom={10000} />
                <BillField label="$20.000" qty={qty20000} setQty={setQty20000} denom={20000} />
              </div>
              {cajaFuerteTotal > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#40562a] px-4 py-2 text-white">
                  <span className="text-xs">Total cartuchera</span>
                  <span className="text-sm font-bold">{money(cajaFuerteTotal)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#40562a] p-4 text-white">
                <p className="text-[10px] uppercase tracking-wider text-[#bdd6b8]">Total contado</p>
                <p className="mt-1 text-2xl font-bold">{money(totalContado)}</p>
              </div>
              <div className="rounded-xl border border-[#d5e5d1] bg-[#f2f0e8] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#759376]">Diferencia vs. sistema</p>
                <p className="mt-1 text-2xl font-bold text-[#4f8755]">
                  {difEfectivo === 0 ? '✓ Sin diferencia' : difEfectivo > 0 ? `+${money(difEfectivo)}` : `-${money(Math.abs(difEfectivo))}`}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard number="03" title="Gastos del día" description="Sumá cada gasto realizado durante la jornada.">
            <div className="space-y-3">
              {gastos.map((row, i) => (
                <div key={i} className="grid gap-2 rounded-xl border border-[#e8ede5] bg-[#fbfcfa] p-3 sm:grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-0">
                  <input value={row.concept} onChange={e => setGastos(gastos.map((g, j) => j === i ? { ...g, concept: e.target.value } : g))} placeholder="Ej: Compra proveedor" className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none focus:border-[#9ab498]" />
                  <input value={row.amount} onChange={e => setGastos(gastos.map((g, j) => j === i ? { ...g, amount: e.target.value } : g))} placeholder="$ 0" inputMode="numeric" className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none focus:border-[#9ab498]" />
                  <select value={row.method} onChange={e => setGastos(gastos.map((g, j) => j === i ? { ...g, method: e.target.value as MetodoPago } : g))} className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none">
                    <option>Efectivo</option><option>Debito</option><option>MercadoPago</option>
                  </select>
                  <select value={row.category} onChange={e => setGastos(gastos.map((g, j) => j === i ? { ...g, category: e.target.value as CategoriaGasto } : g))} className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none">
                    <option value="PERSONAL">Personal</option>
                    <option value="OPERATIVO">Operativo</option>
                    <option value="MATERIA PRIMA">Materia Prima</option>
                    <option value="DESECHABLES">Desechables</option>
                    <option value="EXTRAORDINARIO">Extraordinario</option>
                    <option value="GISELA">Gisela</option>
                    <option value="AHORRO">Ahorro</option>
                  </select>
                  <button onClick={() => setGastos(gastos.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#b5beb4] hover:bg-[#fff0ee] hover:text-[#c7796e]">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setGastos([...gastos, { concept: '', amount: '', method: 'Efectivo', category: 'OPERATIVO' }])} className="mt-4 flex items-center gap-2 text-xs font-bold text-[#527758] hover:text-[#40562a]">
              <CirclePlus size={16} /> Agregar otro gasto
            </button>
          </SectionCard>
        </div>

        <div className="h-fit space-y-5 xl:sticky xl:top-[100px]">
          <div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#c2dbbe]">
              <Sparkles size={14} /> Resumen del día
            </div>
            <p className="mt-6 text-xs text-[#bdd5b9]">Total cobrado</p>
            <p className="mt-1 text-3xl font-bold tracking-[-0.05em]">{money(totalCobrado)}</p>
            <div className="my-5 h-px bg-white/15" />
            <div className="space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-[#c5d8c1]">MercadoPago</span><span className="font-bold">{money(n(cobroMP))}</span></div>
              <div className="flex justify-between"><span className="text-[#c5d8c1]">Efectivo</span><span className="font-bold">{money(n(cobroEfectivo))}</span></div>
              <div className="flex justify-between"><span className="text-[#c5d8c1]">Débito</span><span className="font-bold">{money(n(cobroDebito))}</span></div>
              <div className="flex justify-between"><span className="text-[#c5d8c1]">Gastos cargados</span><span className="font-bold">{gastos.filter(g => n(g.amount) > 0).length}</span></div>
            </div>
            <button onClick={handleGuardar} disabled={saving} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7e9c9] py-3.5 text-sm font-bold text-[#40562a] transition hover:bg-white disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar el día'} <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 rounded-2xl border border-[#e3e9de] bg-white p-4">
            <ShieldCheck size={19} className="shrink-0 text-[#6a986c]" />
            <p className="text-xs leading-5 text-[#849083]">Si ya cargaste este día, los datos se actualizan automáticamente. Nada se duplica.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2e5] text-[11px] font-bold text-[#5c805b]">{number}</span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs text-[#99a398]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function AmountField({ label, value, setValue, icon }: { label: string; value: string; setValue: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#788778]">{icon && <span className="text-[#789473]">{icon}</span>}{label}</span>}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">$</span>
        <input value={value} onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-[#9ab498] focus:bg-white focus:ring-2 focus:ring-[#dcebd8]" />
      </div>
    </label>
  );
}

function BillField({ label, qty, setQty, denom }: { label: string; qty: string; setQty: (v: string) => void; denom: number }) {
  const total = (parseInt(qty) || 0) * denom;
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#788778]">
        <span>Billetes {label}</span>
        <span className="text-[#40562a]">{total > 0 ? money(total) : ''}</span>
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">×</span>
        <input value={qty} onChange={e => setQty(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-[#9ab498] focus:bg-white focus:ring-2 focus:ring-[#dcebd8]" />
      </div>
    </label>
  );
}

// ─── Cartuchera ────────────────────────────────────────────────────────────────
function Cartuchera() {
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
    setCReal1000(''); setCReal2000(''); setCReal10000(''); setCReal20000(''); setObservacion('');
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><ShieldCheck size={14} /> Control físico</div>
        <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Cartuchera</h2>
        <p className="mt-2 text-sm text-[#849083]">Verificá que el monto físico coincida con el sistema.</p>
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="text-xs font-medium text-[#849083]">Total cartuchera según sistema</p>
          <p className="mt-2 text-4xl font-bold text-[#40562a]">{money(totalSistema)}</p>
          <p className="mt-2 text-[11px] text-[#99a398]">Suma de todos los billetes $10.000 y $20.000 enviados a cartuchera</p>
        </div>
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
            <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${diferencia === 0 ? 'border border-[#c9ddc5] bg-[#eff8ed]' : Math.abs(diferencia) <= 1000 ? 'border border-[#e8c96e] bg-[#fef9e7]' : 'border border-[#f0b9b3] bg-[#fdf0ee]'}`}>
              <span className="text-xs font-medium">Diferencia</span>
              <span className="text-lg font-bold">{diferencia === 0 ? '✓ Coincide' : `${diferencia > 0 ? '+' : ''}${money(diferencia)}`}</span>
            </div>
          )}
          {diferencia !== 0 && totalCartucheraReal > 0 && (
            <div className="mt-3">
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Justificá la diferencia..." className="w-full rounded-lg border border-[#e2d8a8] bg-white px-3 py-2 text-sm outline-none focus:border-[#c6a15b]" rows={2} />
            </div>
          )}
          {totalCartucheraReal > 0 && (diferencia === 0 || observacion.trim()) && (
            <button onClick={handleGuardar} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
              {saving ? 'Guardando...' : 'Confirmar control'} <ShieldCheck size={16} />
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

// ─── ControlMP ─────────────────────────────────────────────────────────────────
function ControlMP() {
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
                  <p className="mt-1 text-[11px] text-[#ba7665]">Verificá si hay pagos o gastos en MP que no se cargaron al sistema.</p>
                </div>
              )}
              {diferencia > 0 && (
                <div className="mt-3 rounded-xl border border-[#e8c96e] bg-[#fef9e7] p-4">
                  <p className="text-xs font-bold text-[#926c00]">ℹ️ Sobran {money(diferencia)}</p>
                  <p className="mt-1 text-[11px] text-[#926c00]">Hay más plata de la esperada. Se registrará como diferencia positiva.</p>
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

// ─── ControlDebito ─────────────────────────────────────────────────────────────
function ControlDebito() {
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [ingresosDebito, setIngresosDebito] = useState(0);
  const [acreditacionReal, setAcreditacionReal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tipo, setTipo] = useState<'comision' | 'error' | null>(null);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const diferencia = n(acreditacionReal) - ingresosDebito;
  const porcentaje = ingresosDebito > 0 ? ((Math.abs(diferencia) / ingresosDebito) * 100).toFixed(2) : '0';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const movs = await db.getMovimientosDia(fecha, 'Debito');
      setIngresosDebito(movs.reduce((s, m) => s + Number(m.entrada), 0));
      setLoading(false);
      setSaved(false);
      setTipo(null);
      setAcreditacionReal('');
    };
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

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><Receipt size={14} /> Control de cierre</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Débito</h2>
          <p className="mt-2 text-sm text-[#849083]">Compará lo cobrado con lo acreditado.</p>
        </div>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none" />
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cobros Débito del día</p>
          <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
            <span className="text-xs font-medium text-[#3d6942]">Total cobrado</span>
            <span className="text-lg font-bold text-[#3d6942]">{money(ingresosDebito)}</span>
          </div>
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Acreditación real en cuenta</p>
          <AmountField label="Monto acreditado en banco" value={acreditacionReal} setValue={setAcreditacionReal} />
          {n(acreditacionReal) > 0 && diferencia !== 0 && (
            <>
              <div className={`mt-4 flex items-center justify-between rounded-xl p-4 ${Math.abs(diferencia) <= 1000 ? 'border border-[#e8c96e] bg-[#fef9e7]' : 'border border-[#f0b9b3] bg-[#fdf0ee]'}`}>
                <span className="text-xs font-medium">Diferencia</span>
                <div className="text-right">
                  <span className="text-lg font-bold">{diferencia > 0 ? '+' : ''}{money(diferencia)}</span>
                  <span className="ml-2 text-[10px]">({porcentaje}%)</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-3 text-xs font-bold text-[#40562a]">¿Qué es esta diferencia?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTipo('comision')} className={`rounded-xl border-2 p-4 text-left transition ${tipo === 'comision' ? 'border-[#40562a] bg-[#edf0e2]' : 'border-[#e5eae1] bg-white hover:border-[#b9c8b3]'}`}>
                    <p className="text-sm font-bold">📊 Comisión</p>
                    <p className="mt-1 text-[11px] text-[#849083]">Costo normal del banco/POSNET</p>
                  </button>
                  <button onClick={() => setTipo('error')} className={`rounded-xl border-2 p-4 text-left transition ${tipo === 'error' ? 'border-[#ba4a3a] bg-[#fdf0ee]' : 'border-[#e5eae1] bg-white hover:border-[#f0b9b3]'}`}>
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
            <button onClick={handleGuardar} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
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
    </div>
  );
}

// ─── PagosIndividuales ─────────────────────────────────────────────────────────
function PagosIndividuales() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo');
  const [categoria, setCategoria] = useState<CategoriaGasto>('OPERATIVO');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('salida');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pagosDelDia, setPagosDelDia] = useState<Movimiento[]>([]);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const fetchPagos = async () => {
    const data = await db.getMovimientosDia(fecha);
    setPagosDelDia(data);
  };

  useEffect(() => {
    fetchPagos();
    setSaved(false);
  }, [fecha]);

  const handleGuardar = async () => {
    if (!concepto.trim() || n(monto) <= 0) return;
    setSaving(true);
    await db.insertMovimientos([{
      fecha, concepto,
      entrada: tipo === 'entrada' ? n(monto) : 0,
      salida: tipo === 'salida' ? n(monto) : 0,
      metodo,
      categoria: tipo === 'salida' ? categoria : null,
    }]);
    setConcepto(''); setMonto('');
    setSaving(false); setSaved(true);
    fetchPagos();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = async (id: string) => {
    await db.deleteMovimiento(id);
    fetchPagos();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><CirclePlus size={14} /> Registro individual</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Pagos individuales</h2>
          <p className="mt-2 text-sm text-[#849083]">Agregá pagos o cobros sueltos a cualquier día.</p>
        </div>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-5 text-sm font-bold">Nuevo movimiento</p>
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold text-[#788778]">Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTipo('salida')} className={`rounded-xl border-2 p-3 text-center text-sm font-bold transition ${tipo === 'salida' ? 'border-[#ba4a3a] bg-[#fdf0ee] text-[#ba4a3a]' : 'border-[#e5eae1] text-[#849083]'}`}>↑ Gasto / Pago</button>
              <button onClick={() => setTipo('entrada')} className={`rounded-xl border-2 p-3 text-center text-sm font-bold transition ${tipo === 'entrada' ? 'border-[#40562a] bg-[#edf0e2] text-[#40562a]' : 'border-[#e5eae1] text-[#849083]'}`}>↓ Cobro / Ingreso</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold text-[#788778]">Concepto</label>
            <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Pago proveedor / Cobro cliente" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-3 text-sm outline-none focus:border-[#9ab498]" />
          </div>
          <AmountField label="Monto" value={monto} setValue={setMonto} />
          <div className="mt-4 mb-4">
            <p className="mb-2 text-[11px] font-semibold text-[#788778]">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(['Efectivo', 'Debito', 'MercadoPago'] as MetodoPago[]).map(m => (
                <button key={m} onClick={() => setMetodo(m)} className={`rounded-xl border-2 py-2 text-xs font-bold transition ${metodo === m ? 'border-[#40562a] bg-[#edf0e2] text-[#40562a]' : 'border-[#e5eae1] text-[#849083]'}`}>
                  {m === 'MercadoPago' ? 'MP' : m}
                </button>
              ))}
            </div>
          </div>
          {tipo === 'salida' && (
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold text-[#788778]">Categoría</p>
              <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaGasto)} className="h-11 w-full rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none">
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
          <button onClick={handleGuardar} disabled={saving || !concepto.trim() || n(monto) <= 0} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60">
            {saving ? 'Guardando...' : 'Registrar movimiento'} <CirclePlus size={16} />
          </button>
          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Movimiento registrado
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-5 text-sm font-bold">Movimientos del {format(parseISO(fecha), "d 'de' MMMM", { locale: es })}</p>
          {pagosDelDia.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#849083]">Sin movimientos</div>
          ) : (
            <div className="space-y-2">
              {pagosDelDia.map(m => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${Number(m.entrada) > 0 ? 'bg-[#e5f1e2] text-[#619167]' : 'bg-[#f9ebe6] text-[#bd806d]'}`}>
                      {Number(m.entrada) > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#3c4e3e]">{m.concepto}</p>
                      <p className="text-[10px] text-[#99a398]">{m.metodo}{m.categoria ? ` · ${m.categoria}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${Number(m.entrada) > 0 ? 'text-[#56805b]' : 'text-[#ba7665]'}`}>
                      {Number(m.entrada) > 0 ? `+${money(Number(m.entrada))}` : `-${money(Number(m.salida))}`}
                    </span>
                    <button onClick={() => handleDelete(m.id!)} className="text-[#b5beb4] hover:text-[#ba4a3a]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Configuracion ─────────────────────────────────────────────────────────────────
function Configuracion() {
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

    await db.insertGastoFijo({
      periodo: mes,
      concepto: concepto.trim(),
      monto: n(monto),
    });

    setConcepto('');
    setMonto('');
    setSaving(false);
    setSaved(true);
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
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Settings2 size={14} /> Parámetros del negocio
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Gastos fijos mensuales
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Definí los costos fijos del mes para calcular la meta diaria.
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

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-5 text-sm font-bold">Nuevo gasto fijo</p>

          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold text-[#788778]">
              Concepto
            </label>
            <input
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ej: Alquiler / Luz / ABL / Internet"
              className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-3 text-sm outline-none focus:border-[#9ab498]"
            />
          </div>

          <AmountField label="Monto mensual" value={monto} setValue={setMonto} />

          <button
            onClick={handleGuardar}
            disabled={saving || !concepto.trim() || n(monto) <= 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Agregar gasto fijo'}
            <CirclePlus size={16} />
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
          <p className="mb-5 text-sm font-bold">
            Gastos fijos de {format(parseISO(mes), 'MMMM yyyy', { locale: es })}
          </p>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              No hay gastos fijos cargados para este mes
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#3c4e3e]">{item.concepto}</p>
                    <p className="text-[11px] text-[#99a398]">Gasto fijo mensual</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#ba7665]">
                      {money(Number(item.monto))}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="text-[#b5beb4] hover:text-[#ba4a3a]"
                    >
                      <Trash2 size={14} />
                    </button>
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

function CierreMes() {
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

      const movEf = movs
        .filter(m => m.metodo === 'Efectivo')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      const movDb = movs
        .filter(m => m.metodo === 'Debito')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      const movMp = movs
        .filter(m => m.metodo === 'MercadoPago')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

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

    await db.upsertSaldoApertura({
      periodo: mesSiguiente,
      efectivo: saldoEfectivo,
      debito: saldoDebito,
      mercadopago: saldoMP,
    });

    setSaving(false);
    setSaved(true);
    setYaExiste(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#849083]">
        Cargando...
      </div>
    );
  }

  const fechaBase = parseISO(mes);
  const mesNombre = format(fechaBase, 'MMMM yyyy', { locale: es });
  const mesSigDate = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1);
  const mesSigNombre = format(mesSigDate, 'MMMM yyyy', { locale: es });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <PiggyBank size={14} /> Cierre mensual
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Cierre de mes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Revisá los saldos finales y trasladalos como apertura del mes siguiente.
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

      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-4 text-sm font-bold">Resumen de {mesNombre}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Apertura del mes</span>
              <span className="text-sm font-bold text-[#40562a]">
                {money(aperturaEfectivo + aperturaDebito + aperturaMP)}
              </span>
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
          <p className="mb-3 text-[11px] text-[#99a398]">
            Estos saldos se trasladarán como apertura de {mesSigNombre}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]">
                <Receipt size={14} /> Efectivo
              </span>
              <div className="text-right">
                <p className="text-[10px] text-[#99a398]">Apertura {money(aperturaEfectivo)}</p>
                <span className="text-sm font-bold">{money(saldoEfectivo)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]">
                <CreditCardIcon /> Débito
              </span>
              <div className="text-right">
                <p className="text-[10px] text-[#99a398]">Apertura {money(aperturaDebito)}</p>
                <span className="text-sm font-bold">{money(saldoDebito)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-[#6f7f6d]">
                <Cloud size={14} /> MercadoPago
              </span>
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
              <span className="text-xs font-bold text-[#926c00]">
                ⚠️ Ya existe una apertura cargada para {mesSigNombre}
              </span>
            </div>
          )}

          {saved ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
              Cierre registrado — Apertura de {mesSigNombre} guardada
            </div>
          ) : (
            <button
              onClick={handleCerrar}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
            >
              {saving
                ? 'Cerrando...'
                : yaExiste
                  ? `Actualizar apertura de ${mesSigNombre}`
                  : `Cerrar ${mesNombre} y abrir ${mesSigNombre}`}
              <PiggyBank size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Reportes() {
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

      const [saldos, movs, arqueos] = await Promise.all([
        db.getSaldosApertura(),
        db.getMovimientosMes(inicio, fin),
        db.getArqueosMes(inicio, fin),
      ]);

      setAperturas(saldos);

      // saldos por día y método (solo del mes)
      const porDia: Record<string, { ef: number; db: number; mp: number }> = {};
      movs.forEach(m => {
        if (!porDia[m.fecha]) porDia[m.fecha] = { ef: 0, db: 0, mp: 0 };
        const delta = Number(m.entrada) - Number(m.salida);
        if (m.metodo === 'Efectivo') porDia[m.fecha].ef += delta;
        if (m.metodo === 'Debito') porDia[m.fecha].db += delta;
        if (m.metodo === 'MercadoPago') porDia[m.fecha].mp += delta;
      });

      const lista = arqueos.map(a => {
        const s = porDia[a.fecha] || { ef: 0, db: 0, mp: 0 };
        return {
          fecha: a.fecha,
          difEfectivo: a.total_contado != null ? Number(a.total_contado) - s.ef : null,
          difDebito: a.disponible_debito != null ? Number(a.disponible_debito) - s.db : null,
          difMP: a.disponible_mp != null ? Number(a.disponible_mp) - s.mp : null,
          observaciones: a.observaciones,
        };
      });

      // solo días con algún desvío
      setDesvios(
        lista.filter(d =>
          (d.difEfectivo != null && d.difEfectivo !== 0) ||
          (d.difDebito != null && d.difDebito !== 0) ||
          (d.difMP != null && d.difMP !== 0)
        )
      );

      setLoading(false);
    };

    fetchData();
  }, [mes]);

  const semaforo = (dif: number | null) => {
    if (dif === null) return 'sin-dato';
    if (dif === 0) return 'ok';
    if (Math.abs(dif) <= 1000) return 'warn';
    return 'error';
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando...</div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <BarChart3 size={14} /> Historial y controles
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Reportes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Aperturas de mes y desvíos de efectivo, débito y MercadoPago.
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
        {/* Aperturas / cierres */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Aperturas de mes</p>
          <p className="mb-5 text-xs text-[#99a398]">
            Cada fila es el saldo de apertura (cierre del mes anterior).
          </p>

          {aperturas.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              Sin aperturas registradas
            </div>
          ) : (
            <div className="space-y-2">
              {aperturas.map(a => (
                <div key={a.periodo} className="rounded-xl border border-[#edf0eb] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-[#3c4e3e]">
                      {format(parseISO(a.periodo), 'MMMM yyyy', { locale: es })}
                    </p>
                    <span className="text-sm font-bold text-[#40562a]">
                      {money(Number(a.efectivo) + Number(a.debito) + Number(a.mercadopago))}
                    </span>
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

        {/* Desvíos del mes */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Desvíos del mes</p>
          <p className="mb-5 text-xs text-[#99a398]">
            Días con diferencia ≠ 0 en efectivo, débito o MP.
          </p>

          {desvios.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-[#849083]">
              Sin desvíos en este mes
            </div>
          ) : (
            <div className="space-y-3">
              {desvios.map(d => (
                <div key={d.fecha} className="rounded-xl border border-[#edf0eb] p-4">
                  <p className="mb-3 text-xs font-bold text-[#3c4e3e]">
                    {format(parseISO(d.fecha), "d 'de' MMMM", { locale: es })}
                  </p>

                  <div className="space-y-2">
                    <ControlBadge
                      label="Efectivo"
                      dif={d.difEfectivo}
                      status={semaforo(d.difEfectivo)}
                    />
                    <ControlBadge
                      label="Débito"
                      dif={d.difDebito}
                      status={semaforo(d.difDebito)}
                    />
                    <ControlBadge
                      label="MercadoPago"
                      dif={d.difMP}
                      status={semaforo(d.difMP)}
                    />
                  </div>

                  {d.observaciones && (
                    <p className="mt-3 text-[11px] text-[#849083]">
                      Obs: {d.observaciones}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Movements ─────────────────────────────────────────────────────────────────
function Movements() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesActual);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');
      const data = await db.getMovimientosMesDesc(inicio, fin);
      setMovimientos(data);
      setLoading(false);
    };
    fetchData();
  }, [mes]);

  const filtered = useMemo(() =>
    movimientos.filter(m => m.concepto.toLowerCase().includes(search.toLowerCase())),
    [movimientos, search]
  );

  const totalEntradas = filtered.reduce((s, m) => s + Number(m.entrada), 0);
  const totalSalidas = filtered.reduce((s, m) => s + Number(m.salida), 0);

  const handleDelete = async (id: string) => {
    await db.deleteMovimiento(id);
    setMovimientos(movimientos.filter(m => m.id !== id));
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><ClipboardList size={14} /> Libro diario</div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Movimientos</h2>
          <p className="mt-2 text-sm text-[#849083]">Consultá y ordená toda la actividad.</p>
        </div>
        <div className="flex gap-3">
          <select value={mes} onChange={e => setMes(e.target.value)} className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none">
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              const val = format(startOfMonth(d), 'yyyy-MM-dd');
              return <option key={val} value={val}>{format(d, 'MMMM yyyy', { locale: es })}</option>;
            })}
          </select>
          <button className="flex items-center gap-2 rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53]">
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>
      <div className="rounded-3xl border border-[#e5eae1] bg-white shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa79a]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar concepto..." className="h-10 w-full rounded-xl border border-[#e3e9e0] bg-[#fbfcfa] pl-9 pr-3 text-xs outline-none focus:border-[#9ab498]" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-[#e2e8df] px-3 py-2 text-xs font-semibold text-[#758475]">
              <Filter size={14} /> Filtros
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#849083]">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-[#edf0eb] text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0aba0]">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Concepto</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Entrada</th>
                  <th className="px-6 py-4 text-right">Salida</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-[#f0f2ee] transition hover:bg-[#fbfcfa]">
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-[#899689]">{format(parseISO(m.fecha), 'd MMM yyyy', { locale: es })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${m.entrada > 0 ? 'bg-[#e5f1e2] text-[#619167]' : 'bg-[#f9ebe6] text-[#bd806d]'}`}>
                          {m.entrada > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </span>
                        <span className="text-xs font-semibold text-[#3c4e3e]">{m.concepto}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="rounded-full bg-[#f0f4ed] px-2.5 py-1 text-[10px] font-semibold text-[#748573]">{m.metodo}</span></td>
                    <td className="px-6 py-4 text-xs text-[#899689]">{m.categoria || '—'}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#56805b]">{m.entrada > 0 ? money(Number(m.entrada)) : '—'}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#ba7665]">{m.salida > 0 ? money(Number(m.salida)) : '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(m.id!)} className="text-[#a6b0a5] hover:text-[#ba4a3a]"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fbfcfa]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-bold text-[#708070]">Totales del mes</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#56805b]">{money(totalEntradas)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#ba7665]">{money(totalSalidas)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {filtered.length === 0 && (
              <div className="flex h-48 items-center justify-center text-sm text-[#849083]">Sin movimientos para mostrar</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}