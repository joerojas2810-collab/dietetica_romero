'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  ClipboardList,
  Cloud,
  Download,
  Filter,
  Leaf,
  Menu,
  MoreHorizontal,
  Pencil,
  PiggyBank,
  Receipt,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const sales = [
  { day: '01', value: 128000 }, { day: '02', value: 154000 }, { day: '03', value: 0 },
  { day: '04', value: 186000 }, { day: '05', value: 172000 }, { day: '06', value: 219000 },
  { day: '07', value: 0 }, { day: '08', value: 198000 }, { day: '09', value: 237000 },
  { day: '10', value: 205000 }, { day: '11', value: 264000 }, { day: '12', value: 228000 },
  { day: '13', value: 0 }, { day: '14', value: 246000 }, { day: '15', value: 285000 },
  { day: '16', value: 258000 }, { day: '17', value: 296000 }, { day: '18', value: 312000 },
  { day: '19', value: 0 }, { day: '20', value: 278000 }, { day: '21', value: 336000 },
  { day: '22', value: 321000 }, { day: '23', value: 0 }, { day: '24', value: 344000 },
  { day: '25', value: 0 }, { day: '26', value: 0 }, { day: '27', value: 0 },
  { day: '28', value: 0 }, { day: '29', value: 0 }, { day: '30', value: 0 },
];
const monthly = [
  { month: 'Oct', sales: 4120000, expenses: 1940000, result: 2180000 },
  { month: 'Nov', sales: 4580000, expenses: 2120000, result: 2460000 },
  { month: 'Dic', sales: 5310000, expenses: 2380000, result: 2930000 },
  { month: 'Ene', sales: 4890000, expenses: 2260000, result: 2630000 },
  { month: 'Feb', sales: 5760000, expenses: 2510000, result: 3250000 },
  { month: 'Mar', sales: 5012000, expenses: 2190000, result: 2822000 },
];
const expenses = [
  { name: 'Materia prima', value: 840000, color: '#758b5b' },
  { name: 'Personal', value: 510000, color: '#c6a15b' },
  { name: 'Operativo', value: 324000, color: '#9aa88d' },
  { name: 'Desechables', value: 168000, color: '#d9c8a4' },
  { name: 'Ahorro', value: 98000, color: '#4c6651' },
];
const movements = [
  { date: '24 Mar, 2025', concept: 'Cobro MP', method: 'MercadoPago', type: 'entry', amount: 344000 },
  { date: '24 Mar, 2025', concept: 'Compra proveedor — La Granja', method: 'Efectivo', type: 'exit', amount: 85000, category: 'Materia prima' },
  { date: '24 Mar, 2025', concept: 'Cobro Efectivo', method: 'Efectivo', type: 'entry', amount: 126000 },
  { date: '24 Mar, 2025', concept: 'Luz del local', method: 'Debito', type: 'exit', amount: 46200, category: 'Operativo' },
  { date: '24 Mar, 2025', concept: 'Cobro Débito', method: 'Debito', type: 'entry', amount: 74000 },
  { date: '23 Mar, 2025', concept: 'Sueldo Gisela', method: 'Efectivo', type: 'exit', amount: 95000, category: 'Personal' },
];

const money = (value: number) => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)}`;
const compactMoney = (value: number) => value >= 1000000 ? `$ ${(value / 1000000).toFixed(1).replace('.', ',')}M` : money(value);

type View = 'dashboard' | 'day' | 'movements';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [search, setSearch] = useState('');
  const [cash, setCash] = useState(126000);
  const [mp, setMp] = useState(344000);
  const [debit, setDebit] = useState(74000);
  const [expensesRows, setExpensesRows] = useState([{ concept: '', amount: '', method: 'Efectivo', category: 'Materia prima' }]);

  const filteredMovements = useMemo(() => movements.filter((movement) => movement.concept.toLowerCase().includes(search.toLowerCase())), [search]);
  const totalSales = sales.reduce((sum, item) => sum + item.value, 0);
  const openDays = sales.filter((item) => item.value > 0).length;
  const average = Math.round(totalSales / openDays);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.value, 0);

  const handleSave = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 3200);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#243126]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e5e9df] bg-[#fbfcf8] px-5 py-6 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <button onClick={() => setView('dashboard')} className="text-left" aria-label="Ir al dashboard">
            <div className="relative h-[82px] w-[188px] overflow-hidden rounded-2xl bg-[#fdfdf9]">
              <Image src="/IMG_7336.jpg" alt="Dietética Romero" fill priority sizes="188px" className="object-cover object-center" />
            </div>
          </button>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">Operación</p>
        <nav className="space-y-1">
          <NavItem active={view === 'dashboard'} icon={<BarChart3 size={18} />} label="Dashboard" onClick={() => { setView('dashboard'); setMobileOpen(false); }} />
          <NavItem active={view === 'day'} icon={<CalendarDays size={18} />} label="Carga del día" badge="Hoy" onClick={() => { setView('day'); setMobileOpen(false); }} />
          <NavItem active={view === 'movements'} icon={<ClipboardList size={18} />} label="Movimientos" onClick={() => { setView('movements'); setMobileOpen(false); }} />
        </nav>
        <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">Administración</p>
        <nav className="space-y-1">
          <NavItem icon={<PiggyBank size={18} />} label="Cierre de mes" />
          <NavItem icon={<Settings2 size={18} />} label="Configuración" />
        </nav>
        <div className="mt-auto rounded-2xl bg-[#eef3e8] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#5f805f]"><ShieldCheck size={17} /><span className="text-xs font-semibold">Datos protegidos</span></div>
          <p className="text-[11px] leading-5 text-[#71806c]">Tu información se guarda de forma segura y se sincroniza automáticamente.</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#70806d]"><Cloud size={13} /> Última sincronización: ahora</div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#e4e9de] bg-white p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e3f3] font-serif text-sm font-bold text-[#4a5b2c]">DR</div>
          <div><p className="text-xs font-bold">D. Romero</p><p className="text-[11px] text-[#91a091]">Administrador</p></div>
          <MoreHorizontal size={16} className="ml-auto text-[#a3aea2]" />
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8ece4] bg-[#f6f7f2]/95 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button><div><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#93a092]">Lunes, 24 de marzo de 2025</p><h1 className="mt-0.5 text-xl font-bold tracking-[-0.03em]">{view === 'dashboard' ? 'Resumen del negocio' : view === 'day' ? 'Carga del día' : 'Movimientos'}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><button className="hidden rounded-full border border-[#e1e7dc] bg-white p-2.5 text-[#788478] transition hover:border-[#b9c8b3] hover:text-[#416448] sm:block"><CircleHelp size={17} /></button><div className="hidden h-6 w-px bg-[#e2e7df] sm:block" /><button className="flex items-center gap-2 rounded-full border border-[#e1e7dc] bg-white py-2 pl-2 pr-3 transition hover:border-[#b9c8b3]"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e9e3f3] text-[10px] font-bold text-[#4a5b2c]">DR</div><span className="hidden text-xs font-semibold sm:block">D. Romero</span><ChevronDown size={14} className="text-[#849181]" /></button></div>
        </header>

        <section className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {view === 'dashboard' && <Dashboard totalSales={totalSales} average={average} openDays={openDays} totalExpenses={totalExpenses} />}
          {view === 'day' && <DayForm cash={cash} setCash={setCash} mp={mp} setMp={setMp} debit={debit} setDebit={setDebit} rows={expensesRows} setRows={setExpensesRows} onSave={handleSave} />}
          {view === 'movements' && <Movements search={search} setSearch={setSearch} filteredMovements={filteredMovements} />}
        </section>
      </div>
      {showToast && <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#c9ddc5] bg-[#eff8ed] px-5 py-4 text-sm font-semibold text-[#3d6942] shadow-xl shadow-[#3b5b3215] animate-in slide-in-from-bottom-4"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div> Día guardado correctamente</div>}
    </main>
  );
}

function NavItem({ icon, label, badge, active, onClick }: { icon: React.ReactNode; label: string; badge?: string; active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${active ? 'bg-[#edf0e2] text-[#4d612e] shadow-sm' : 'text-[#788578] hover:bg-[#f0f4ec] hover:text-[#3c5d41]'}`}><span className={active ? 'text-[#6f8441]' : 'text-[#96a396] group-hover:text-[#5a7a5d]'}>{icon}</span><span>{label}</span>{badge && <span className="ml-auto rounded-full bg-[#e4ead4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#566735]">{badge}</span>}</button>;
}

function Dashboard({ totalSales, average, openDays, totalExpenses }: { totalSales: number; average: number; openDays: number; totalExpenses: number }) {
  return <div className="animate-in fade-in duration-500">
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><Sparkles size={14} /> Tu negocio, en equilibrio</div><h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Un vistazo a marzo</h2><p className="mt-2 text-sm text-[#849083]">Controlá tus números y tomá mejores decisiones.</p></div><button className="flex w-fit items-center gap-2 rounded-xl bg-[#40562a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#40562a20] transition hover:-translate-y-0.5 hover:bg-[#30431f]"><CalendarDays size={16} /> Marzo 2025 <ChevronDown size={15} /></button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Saldo total" value="$ 1.284.600" detail="+8,2% vs. mes anterior" trend="up" icon={<Wallet size={18} />} accent="green" /><StatCard label="Efectivo" value="$ 326.400" detail="25,4% del saldo" icon={<Receipt size={18} />} accent="sand" /><StatCard label="Débito" value="$ 418.200" detail="32,6% del saldo" icon={<CreditCardIcon />} accent="blue" /><StatCard label="MercadoPago" value="$ 540.000" detail="42,0% del saldo" icon={<Cloud size={18} />} accent="lilac" /><StatCard label="Resultado del mes" value={compactMoney(totalSales - totalExpenses)} detail="+12,4% vs. mes anterior" trend="up" icon={<TrendingUp size={18} />} accent="green" /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="text-sm font-bold">Ventas del mes</p><p className="mt-1 text-xs text-[#99a398]">Evolución diaria de cobros</p></div><button className="rounded-lg p-2 text-[#98a296] hover:bg-[#f3f6f1]"><MoreHorizontal size={18} /></button></div><div className="mb-5 flex flex-wrap items-baseline gap-x-5 gap-y-2"><span className="text-3xl font-bold tracking-[-0.05em]">{compactMoney(totalSales)}</span><span className="flex items-center gap-1 text-xs font-semibold text-[#5d8b62]"><ArrowUpRight size={14} /> 8,2% este mes</span></div><div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={sales} margin={{ top: 10, right: 0, left: -22, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0ea" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} interval={2} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} /><Tooltip cursor={{ fill: '#f4f7f1' }} formatter={(value) => money(Number(value))} labelFormatter={(label) => `Día ${label}`} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} /><Bar dataKey="value" fill="#839358" radius={[4, 4, 0, 0]} barSize={9} /></BarChart></ResponsiveContainer></div><div className="mt-4 flex items-center justify-between border-t border-[#eef1eb] pt-4 text-xs"><span className="text-[#8c998c]">Meta diaria: <strong className="text-[#536852]">$ 215.000</strong></span><span className="font-semibold text-[#5e8661]">{openDays} días abiertos</span></div></div>
      <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">Gastos por categoría</p><p className="mt-1 text-xs text-[#99a398]">Distribución de {compactMoney(totalExpenses)}</p></div><button className="rounded-lg p-2 text-[#98a296] hover:bg-[#f3f6f1]"><MoreHorizontal size={18} /></button></div><div className="relative mx-auto mt-2 h-[230px] w-full max-w-[290px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenses} dataKey="value" nameKey="name" innerRadius={72} outerRadius={97} paddingAngle={3} stroke="none">{expenses.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold">$ 1,9M</span><span className="text-[10px] text-[#99a398]">total gastos</span></div></div><div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#eef1eb] pt-4">{expenses.map((item) => <div key={item.name} className="flex items-center gap-2 text-[11px] text-[#7f8c7e]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}<span className="ml-auto font-semibold text-[#516550]">{Math.round(item.value / totalExpenses * 100)}%</span></div>)}</div></div>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6"><div className="mb-4 flex items-start justify-between"><div><p className="text-sm font-bold">Resumen mensual</p><p className="mt-1 text-xs text-[#99a398]">Últimos 6 meses</p></div><button className="flex items-center gap-1.5 text-xs font-semibold text-[#5d713c]">Ver detalle <ArrowUpRight size={14} /></button></div><div className="h-[220px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0ea" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#a3ada2', fontSize: 10 }} tickFormatter={(value) => `${value / 1000000}M`} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ border: '1px solid #e3e9df', borderRadius: 12, fontSize: 12 }} /><Line type="monotone" dataKey="sales" name="Ventas" stroke="#6f8441" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="expenses" name="Gastos" stroke="#c8a35f" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="result" name="Resultado" stroke="#9daf9d" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div><div className="mt-2 flex gap-4 text-[11px] text-[#8a9689]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#6f8441]" />Ventas</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#c8a35f]" />Gastos</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#9daf9d]" />Resultado</span></div></div><ControlCard /></div>
  </div>;
}

function StatCard({ label, value, detail, trend, icon, accent }: { label: string; value: string; detail: string; trend?: string; icon: React.ReactNode; accent: string }) { return <div className="group rounded-2xl border border-[#e5eae1] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#415f3c10]"><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent === 'green' ? 'bg-[#e8edda] text-[#60763a]' : accent === 'sand' ? 'bg-[#f5ecdb] text-[#a98548]' : accent === 'blue' ? 'bg-[#e3edf0] text-[#597d85]' : 'bg-[#edeae3] text-[#7a806b]'}`}>{icon}</span>{trend && <span className="rounded-full bg-[#edf7eb] px-2 py-1 text-[10px] font-bold text-[#5c8c62]">{trend === 'up' ? '↑ 8,2%' : ''}</span>}</div><p className="mt-4 text-xs text-[#8b988b]">{label}</p><p className="mt-1 text-[22px] font-bold tracking-[-0.05em]">{value}</p><p className="mt-1 text-[10px] text-[#a0aaa0]">{detail}</p></div>; }
function CreditCardIcon() { return <div className="relative h-[17px] w-[19px] rounded-[3px] border-2 border-current"><span className="absolute left-0 top-[3px] h-[2px] w-full bg-current" /><span className="absolute bottom-[3px] left-[3px] h-[2px] w-[5px] bg-current" /></div>; }
function ControlCard() { return <div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">Controles del día</p><p className="mt-1 text-xs text-[#c0d7bd]">Último arqueo registrado</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><ShieldCheck size={18} /></span></div><div className="mt-7 space-y-4"><ControlRow label="Arqueo de efectivo" value="+$ 2.400" status="ok" /><ControlRow label="Disponible Débito" value="-$ 1.200" status="warn" /><ControlRow label="Disponible MP" value="$ 0" status="ok" /></div><button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-semibold transition hover:bg-white/20">Ver último arqueo <ArrowUpRight size={14} /></button></div>; }
function ControlRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' }) { return <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className={`h-2 w-2 rounded-full ${status === 'ok' ? 'bg-[#a9d89d]' : 'bg-[#e1bb70]'}`} /><span className="text-xs text-[#e0eadd]">{label}</span></div><span className={`text-xs font-bold ${status === 'ok' ? 'text-[#c2e6b9]' : 'text-[#f0d296]'}`}>{value}</span></div>; }

function DayForm({ cash, setCash, mp, setMp, debit, setDebit, rows, setRows, onSave }: { cash: number; setCash: (value: number) => void; mp: number; setMp: (value: number) => void; debit: number; setDebit: (value: number) => void; rows: { concept: string; amount: string; method: string; category: string }[]; setRows: (rows: { concept: string; amount: string; method: string; category: string }[]) => void; onSave: () => void }) {
  const total = cash + mp + debit; const diffCash = 2400;
  return <div className="animate-in fade-in duration-500"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><CalendarDays size={14} /> Registro diario</div><h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Cargá el día</h2><p className="mt-2 text-sm text-[#849083]">Completá los valores del cierre para mantener todo en orden.</p></div><button className="flex w-fit items-center gap-2 rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53]"><CalendarDays size={16} /> 24 de marzo, 2025 <ChevronDown size={15} /></button></div><div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]"><div className="space-y-5"><SectionCard number="01" title="Cobros del sistema" description="Ingresá lo que informa el sistema de ventas."><div className="grid gap-3 sm:grid-cols-3"><AmountField label="Cobro MP" value={mp} setValue={setMp} icon={<Cloud size={16} />} /><AmountField label="Cobro Efectivo" value={cash} setValue={setCash} icon={<Receipt size={16} />} /><AmountField label="Cobro Débito" value={debit} setValue={setDebit} icon={<CreditCardIcon />} /></div><div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3"><span className="text-xs font-medium text-[#768676]">Total cobrado</span><span className="text-lg font-bold text-[#40562a]">{money(total)}</span></div></SectionCard><SectionCard number="02" title="Arqueo de billetes" description="Contá el efectivo físico en caja y caja fuerte."><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><AmountField label="$ 100 / 200" value={2300} setValue={() => {}} /><AmountField label="$ 500 / 1.000" value={12400} setValue={() => {}} /><AmountField label="$ 2.000" value={8200} setValue={() => {}} /><AmountField label="A caja fuerte" value={85000} setValue={() => {}} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#40562a] p-4 text-white"><p className="text-[10px] uppercase tracking-wider text-[#bdd6b8]">Total contado</p><p className="mt-1 text-2xl font-bold">$ 326.400</p></div><div className="rounded-xl border border-[#d5e5d1] bg-[#f2f0e8] p-4"><div className="flex items-center justify-between"><p className="text-[10px] uppercase tracking-wider text-[#759376]">Diferencia vs. sistema</p><span className="h-2 w-2 rounded-full bg-[#76ad6d]" /></div><p className="mt-1 text-2xl font-bold text-[#4f8755]">+{money(diffCash)}</p></div></div></SectionCard><SectionCard number="03" title="Gastos del día" description="Sumá cada gasto realizado durante la jornada."><div className="space-y-3">{rows.map((row, index) => <div key={index} className="grid gap-2 rounded-xl border border-[#e8ede5] bg-[#fbfcfa] p-3 sm:grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"><input value={row.concept} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, concept: event.target.value } : item))} placeholder="Ej: Compra proveedor" className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none transition focus:border-[#9ab498] focus:ring-2 focus:ring-[#dcebd8]" /><input value={row.amount} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, amount: event.target.value } : item))} placeholder="$ 0" inputMode="numeric" className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none transition focus:border-[#9ab498] focus:ring-2 focus:ring-[#dcebd8]" /><select value={row.method} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, method: event.target.value } : item))} className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none"><option>Efectivo</option><option>Debito</option><option>MercadoPago</option></select><select value={row.category} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, category: event.target.value } : item))} className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none"><option>Materia prima</option><option>Operativo</option><option>Personal</option><option>Desechables</option><option>Ahorro</option></select><button onClick={() => setRows(rows.filter((_, i) => i !== index))} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#b5beb4] transition hover:bg-[#fff0ee] hover:text-[#c7796e]"><Trash2 size={16} /></button></div>)}</div><button onClick={() => setRows([...rows, { concept: '', amount: '', method: 'Efectivo', category: 'Materia prima' }])} className="mt-4 flex items-center gap-2 text-xs font-bold text-[#527758] transition hover:text-[#40562a]"><CirclePlus size={16} /> Agregar otro gasto</button></SectionCard></div><div className="h-fit space-y-5 xl:sticky xl:top-[100px]"><div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]"><div className="flex items-center gap-2 text-xs font-semibold text-[#c2dbbe]"><Sparkles size={14} /> Resumen del día</div><p className="mt-6 text-xs text-[#bdd5b9]">Total cobrado</p><p className="mt-1 text-3xl font-bold tracking-[-0.05em]">{money(total)}</p><div className="my-5 h-px bg-white/15" /><div className="space-y-4"><SummaryLine label="MercadoPago" value={money(mp)} /><SummaryLine label="Efectivo" value={money(cash)} /><SummaryLine label="Débito" value={money(debit)} /><SummaryLine label="Gastos cargados" value={money(0)} /></div><button onClick={onSave} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7e9c9] py-3.5 text-sm font-bold text-[#40562a] transition hover:bg-white hover:shadow-lg">Guardar el día <ArrowUpRight size={16} /></button></div><div className="flex gap-3 rounded-2xl border border-[#e3e9de] bg-white p-4"><ShieldCheck size={19} className="shrink-0 text-[#6a986c]" /><p className="text-xs leading-5 text-[#849083]">Si ya cargaste este día, los datos se actualizan automáticamente. Nada se duplica.</p></div></div></div></div>;
}
function SectionCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) { return <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2e5] text-[11px] font-bold text-[#5c805b]">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-[#99a398]">{description}</p></div></div>{children}</div>; }
function AmountField({ label, value, setValue, icon }: { label: string; value: number; setValue: (value: number) => void; icon?: React.ReactNode }) { return <label className="block"><span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#788778]">{icon && <span className="text-[#789473]">{icon}</span>}{label}</span><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">$</span><input value={value.toString()} onChange={(event) => setValue(Number(event.target.value.replace(/\D/g, '')) || 0)} inputMode="numeric" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-[#9ab498] focus:bg-white focus:ring-2 focus:ring-[#dcebd8]" /></div></label>; }
function SummaryLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between text-xs"><span className="text-[#c5d8c1]">{label}</span><span className="font-bold">{value}</span></div>; }

function Movements({ search, setSearch, filteredMovements }: { search: string; setSearch: (value: string) => void; filteredMovements: typeof movements }) { return <div className="animate-in fade-in duration-500"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]"><ClipboardList size={14} /> Libro diario</div><h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Movimientos</h2><p className="mt-2 text-sm text-[#849083]">Consultá y ordená toda la actividad de marzo.</p></div><button className="flex w-fit items-center gap-2 rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53]"><Download size={16} /> Exportar</button></div><div className="rounded-3xl border border-[#e5eae1] bg-white shadow-[0_8px_30px_rgba(65,82,55,0.04)]"><div className="flex flex-col gap-3 border-b border-[#edf0eb] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="relative w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa79a]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar concepto..." className="h-10 w-full rounded-xl border border-[#e3e9e0] bg-[#fbfcfa] pl-9 pr-3 text-xs outline-none focus:border-[#9ab498]" /></div><div className="flex gap-2"><button className="flex items-center gap-2 rounded-xl border border-[#e2e8df] px-3 py-2 text-xs font-semibold text-[#758475]"><Filter size={14} /> Filtros</button><button className="flex items-center gap-2 rounded-xl border border-[#e2e8df] px-3 py-2 text-xs font-semibold text-[#758475]"><SlidersHorizontal size={14} /> Marzo 2025</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-[#edf0eb] text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0aba0]"><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Concepto</th><th className="px-6 py-4">Método</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4 text-right">Importe</th><th className="px-6 py-4" /></tr></thead><tbody>{filteredMovements.map((movement, index) => <tr key={`${movement.concept}-${index}`} className="border-b border-[#f0f2ee] transition hover:bg-[#fbfcfa]"><td className="whitespace-nowrap px-6 py-4 text-xs text-[#899689]">{movement.date}</td><td className="px-6 py-4"><div className="flex items-center gap-2.5"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${movement.type === 'entry' ? 'bg-[#e5f1e2] text-[#619167]' : 'bg-[#f9ebe6] text-[#bd806d]'}`}>{movement.type === 'entry' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}</span><span className="text-xs font-semibold text-[#3c4e3e]">{movement.concept}</span></div></td><td className="px-6 py-4"><span className="rounded-full bg-[#f0f4ed] px-2.5 py-1 text-[10px] font-semibold text-[#748573]">{movement.method}</span></td><td className="px-6 py-4 text-xs text-[#899689]">{movement.category || '—'}</td><td className={`px-6 py-4 text-right text-xs font-bold ${movement.type === 'entry' ? 'text-[#56805b]' : 'text-[#ba7665]'}`}>{movement.type === 'entry' ? '+' : '-'} {money(movement.amount)}</td><td className="px-6 py-4"><button className="text-[#a6b0a5] transition hover:text-[#5b795b]"><Pencil size={15} /></button></td></tr>)}</tbody><tfoot><tr className="bg-[#fbfcfa]"><td colSpan={4} className="px-6 py-4 text-xs font-bold text-[#708070]">Totales del mes</td><td className="px-6 py-4 text-right text-sm font-bold text-[#40562a]">$ 5.012.000</td><td /></tr></tfoot></table></div></div></div>; }
