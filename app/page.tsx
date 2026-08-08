'use client';

import Login from '@/components/Login';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  BarChart3, Building2, CalendarDays, ChevronDown, CirclePlus,
  ClipboardList, Cloud, Menu, PiggyBank,
  Settings2, ShieldCheck, X,
} from 'lucide-react';
import { supabaseAuth } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import NavItem from '@/components/shared/NavItem';
import {
  DashboardSkeleton, DayFormSkeleton, MovementsSkeleton,
  ControlSkeleton, CartucheraSkeleton, PagosSkeleton, GenericSkeleton,
} from '@/components/shared/ViewSkeletons';

const Dashboard = dynamic(() => import('@/components/views/Dashboard'), {
  loading: () => <DashboardSkeleton />,
});
const DayForm = dynamic(() => import('@/components/views/DayForm'), {
  loading: () => <DayFormSkeleton />,
});
const Movements = dynamic(() => import('@/components/views/Movements'), {
  loading: () => <MovementsSkeleton />,
});
const Cartuchera = dynamic(() => import('@/components/views/Cartuchera'), {
  loading: () => <CartucheraSkeleton />,
});
const ControlMP = dynamic(() => import('@/components/views/ControlMP'), {
  loading: () => <ControlSkeleton />,
});
const ControlBanco = dynamic(() => import('@/components/views/ControlBanco'), {
  loading: () => <ControlSkeleton />,
});
const PagosIndividuales = dynamic(() => import('@/components/views/PagosIndividuales'), {
  loading: () => <PagosSkeleton />,
});
const Configuracion = dynamic(() => import('@/components/views/Configuracion'), {
  loading: () => <GenericSkeleton />,
});
const CierreMes = dynamic(() => import('@/components/views/CierreMes'), {
  loading: () => <GenericSkeleton />,
});
const Reportes = dynamic(() => import('@/components/views/Reportes'), {
  loading: () => <GenericSkeleton />,
});

type View =
  | 'dashboard'
  | 'day'
  | 'movements'
  | 'cartuchera'
  | 'controlmp'
  | 'controlbanco'
  | 'pagos'
  | 'config'
  | 'cierre'
  | 'reportes';

const viewTitles: Record<View, string> = {
  dashboard:    'Resumen del negocio',
  day:          'Carga del día',
  movements:    'Movimientos',
  cartuchera:   'Control de cartuchera',
  controlmp:    'Control MercadoPago',
  controlbanco: 'Control Banco',
  pagos:        'Pagos individuales',
  config:       'Configuración',
  cierre:       'Cierre de mes',
  reportes:     'Reportes',
};

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setCheckingAuth(false);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      (_event, session) => setAuthenticated(!!session)
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

  const nav = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  if (checkingAuth) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f2]">
      <DashboardSkeleton />
    </div>
  );

  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#243126]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e5e9df] bg-[#fbfcf8] px-5 py-6 transition-transform duration-300 lg:translate-x-0 overflow-y-auto ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <button onClick={() => nav('dashboard')} className="text-left">
            <div className="relative h-[82px] w-[188px] overflow-hidden rounded-2xl bg-[#fdfdf9]">
              <img
                src="/IMG_7336.jpg"
                alt="Dietética Romero"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </button>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">
          Operación
        </p>
        <nav className="space-y-1">
          <NavItem active={view === 'dashboard'} icon={<BarChart3 size={18} />} label="Dashboard" viewKey="dashboard" onClick={() => nav('dashboard')} />
          <NavItem active={view === 'day'} icon={<CalendarDays size={18} />} label="Carga del día" badge="Hoy" viewKey="day" onClick={() => nav('day')} />
          <NavItem active={view === 'movements'} icon={<ClipboardList size={18} />} label="Movimientos" viewKey="movements" onClick={() => nav('movements')} />
        </nav>

        <p className="mb-3 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">
          Arqueos
        </p>
        <nav className="space-y-1">
          <NavItem active={view === 'cartuchera'} icon={<ShieldCheck size={18} />} label="Cartuchera" viewKey="cartuchera" onClick={() => nav('cartuchera')} />
          <NavItem active={view === 'controlmp'} icon={<Cloud size={18} />} label="Control MP" viewKey="controlmp" onClick={() => nav('controlmp')} />
          <NavItem active={view === 'controlbanco'} icon={<Building2 size={18} />} label="Control Banco" viewKey="controlbanco" onClick={() => nav('controlbanco')} />
          <NavItem active={view === 'pagos'} icon={<CirclePlus size={18} />} label="Pagos individuales" viewKey="pagos" onClick={() => nav('pagos')} />
        </nav>

        <p className="mb-3 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aea0]">
          Administración
        </p>
        <nav className="space-y-1">
          <NavItem active={view === 'cierre'} icon={<PiggyBank size={18} />} label="Cierre de mes" viewKey="cierre" onClick={() => nav('cierre')} />
          <NavItem active={view === 'config'} icon={<Settings2 size={18} />} label="Configuración" viewKey="config" onClick={() => nav('config')} />
          <NavItem active={view === 'reportes'} icon={<BarChart3 size={18} />} label="Reportes" viewKey="reportes" onClick={() => nav('reportes')} />
        </nav>

        <div className="mt-auto rounded-2xl bg-[#eef3e8] p-4">
          <div className="mb-2 flex items-center gap-2 text-[#5f805f]">
            <ShieldCheck size={17} />
            <span className="text-xs font-semibold">Datos protegidos</span>
          </div>
          <p className="text-[11px] leading-5 text-[#71806c]">
            Tu información se guarda de forma segura en Supabase.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#e4e9de] bg-white p-3 transition hover:bg-[#fdf0ee]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e3f3] text-sm font-bold text-[#4a5b2c]">
            DR
          </div>
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
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#93a092]">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-[-0.03em]">
                {viewTitles[view]}
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
          {view === 'dashboard'    && <Dashboard />}
          {view === 'day'          && <DayForm onSave={toast} />}
          {view === 'movements'    && <Movements />}
          {view === 'cartuchera'   && <Cartuchera />}
          {view === 'controlmp'    && <ControlMP />}
          {view === 'controlbanco' && <ControlBanco />}
          {view === 'pagos'        && <PagosIndividuales />}
          {view === 'config'       && <Configuracion />}
          {view === 'cierre'       && <CierreMes />}
          {view === 'reportes'     && <Reportes />}
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