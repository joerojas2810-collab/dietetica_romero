'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Cloud, Pencil, ShieldCheck, Trash2,
  CreditCard, Smartphone, Banknote, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format } from 'date-fns';

type Metodo = 'Debito' | 'MercadoPago' | 'Efectivo';

const METODOS_CONFIG: Record<Metodo, {
  label: string;
  icon: typeof CreditCard;
  bg: string;
  bgSoft: string;
  text: string;
  border: string;
}> = {
  Debito: {
    label: 'Débito',
    icon: CreditCard,
    bg: 'bg-[#e5f1e2]',
    bgSoft: 'bg-[#f2f8ef]',
    text: 'text-[#3d6942]',
    border: 'border-[#c9ddc5]',
  },
  MercadoPago: {
    label: 'Mercado Pago',
    icon: Smartphone,
    bg: 'bg-[#e0ecf8]',
    bgSoft: 'bg-[#eff5fb]',
    text: 'text-[#2d5a8e]',
    border: 'border-[#b8d4f0]',
  },
  Efectivo: {
    label: 'Efectivo',
    icon: Banknote,
    bg: 'bg-[#fef4e2]',
    bgSoft: 'bg-[#fdf9ef]',
    text: 'text-[#8a6a2a]',
    border: 'border-[#e8d47a]',
  },
};

const METODOS: Metodo[] = ['Debito', 'MercadoPago', 'Efectivo'];

export default function ControlMP() {
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Todos los movimientos del día por método
  const [movsPorMetodo, setMovsPorMetodo] = useState<Record<Metodo, Movimiento[]>>({
    Debito: [], MercadoPago: [], Efectivo: [],
  });
  const [ingresosPorMetodo, setIngresosPorMetodo] = useState<Record<Metodo, number>>({
    Debito: 0, MercadoPago: 0, Efectivo: 0,
  });
  const [expandido, setExpandido] = useState<Record<Metodo, boolean>>({
    Debito: false, MercadoPago: true, Efectivo: false,
  });

  // Control específico MP
  const [cierreAnterior, setCierreAnterior] = useState('');
  const [cierreHoy, setCierreHoy] = useState('');
  const [egresosMP, setEgresosMP] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<Movimiento | null>(null);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const ingresosMP = ingresosPorMetodo.MercadoPago;
  const esperado = n(cierreAnterior) + ingresosMP - egresosMP;
  const diferencia = n(cierreHoy) - esperado;

  const fetchData = async () => {
    setLoading(true);

    const results: Record<Metodo, Movimiento[]> = {
      Debito: [], MercadoPago: [], Efectivo: [],
    };
    const ingresos: Record<Metodo, number> = {
      Debito: 0, MercadoPago: 0, Efectivo: 0,
    };

    await Promise.all(
      METODOS.map(async (metodo) => {
        const movs = await db.getMovimientosDia(fecha, metodo);
        results[metodo] = movs;
        ingresos[metodo] = movs.reduce((s, m) => s + Number(m.entrada), 0);
      })
    );

    // Egresos MP separado
    const egMP = results.MercadoPago.reduce((s, m) => s + Number(m.salida), 0);

    setMovsPorMetodo(results);
    setIngresosPorMetodo(ingresos);
    setEgresosMP(egMP);
    setLoading(false);
    setSaved(false);
  };

  useEffect(() => {
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

  const handleDelete = async (id: string) => {
    await db.deleteMovimiento(id);
    fetchData();
  };

  const handleUpdate = async (updated: {
    concepto: string;
    entrada: number;
    salida: number;
    metodo: string;
    categoria?: string | null;
  }) => {
    if (!editing?.id) return;
    await db.updateMovimiento(editing.id, updated);
    setEditing(null);
    fetchData();
  };

  const totalCobrado = Object.values(ingresosPorMetodo).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#849083]">
        Cargando...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Cloud size={14} /> Control de cierre
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            MercadoPago
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Verificá que el saldo real coincida con el sistema.
          </p>
        </div>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none"
        />
      </div>

      <div className="max-w-xl space-y-5">

        {/* RESUMEN DE LOS 3 COBROS DEL DÍA */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[#253729]">Cobros del día</p>
            <span className="text-xs font-semibold text-[#849083]">
              Total:{' '}
              <span className="text-[#3d6942]">{money(totalCobrado)}</span>
            </span>
          </div>

          {/* Tarjetas por método */}
          <div className="grid grid-cols-3 gap-2">
            {METODOS.map(metodo => {
              const cfg = METODOS_CONFIG[metodo];
              const Icon = cfg.icon;
              const monto = ingresosPorMetodo[metodo];
              const cant = movsPorMetodo[metodo].length;
              return (
                <button
                  key={metodo}
                  onClick={() =>
                    setExpandido(prev => ({ ...prev, [metodo]: !prev[metodo] }))
                  }
                  className={`rounded-2xl border ${cfg.border} ${cfg.bgSoft} p-3 text-left transition hover:shadow-sm`}
                >
                  <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-semibold ${cfg.text}`}>
                    <Icon size={12} />
                    <span>{cfg.label}</span>
                  </div>
                  <p className={`text-sm font-bold ${cfg.text}`}>{money(monto)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-[#99a398]">
                      {cant} cobro{cant !== 1 ? 's' : ''}
                    </p>
                    {cant > 0 && (
                      expandido[metodo]
                        ? <ChevronUp size={11} className="text-[#99a398]" />
                        : <ChevronDown size={11} className="text-[#99a398]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle expandible */}
          {METODOS.map(metodo => {
            const movs = movsPorMetodo[metodo];
            const cfg = METODOS_CONFIG[metodo];
            if (!expandido[metodo] || movs.length === 0) return null;

            return (
              <div key={metodo} className="mt-4 space-y-2">
                <p className={`text-[11px] font-semibold ${cfg.text}`}>
                  Detalle {cfg.label}
                </p>
                {movs.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        Number(m.entrada) > 0
                          ? 'bg-[#e5f1e2] text-[#619167]'
                          : 'bg-[#f9ebe6] text-[#bd806d]'
                      }`}>
                        {Number(m.entrada) > 0
                          ? <ArrowDownLeft size={13} />
                          : <ArrowUpRight size={13} />}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#3c4e3e]">
                          {m.concepto}
                        </p>
                        <p className="text-[10px] text-[#99a398]">
                          {m.categoria || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${
                        Number(m.entrada) > 0 ? 'text-[#56805b]' : 'text-[#ba7665]'
                      }`}>
                        {Number(m.entrada) > 0
                          ? `+${money(Number(m.entrada))}`
                          : `-${money(Number(m.salida))}`}
                      </span>
                      <button
                        onClick={() => setEditing(m)}
                        className="text-[#b5beb4] hover:text-[#40562a]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id!)}
                        className="text-[#b5beb4] hover:text-[#ba4a3a]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* CIERRE ANTERIOR */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre del día anterior</p>
          <AmountField
            label="Último saldo MP"
            value={cierreAnterior}
            setValue={setCierreAnterior}
          />
        </div>

        {/* MOVIMIENTOS MP + SALDO ESPERADO */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone size={16} className="text-[#2d5a8e]" />
            <p className="text-sm font-bold">Movimientos MP del día</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#e0ecf8] px-4 py-3">
              <span className="text-xs font-medium text-[#2d5a8e]">Cierre anterior</span>
              <span className="text-sm font-bold text-[#2d5a8e]">
                {n(cierreAnterior) > 0 ? money(n(cierreAnterior)) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
              <span className="text-xs font-medium text-[#3d6942]">Ingresos MP</span>
              <span className="text-sm font-bold text-[#3d6942]">
                +{money(ingresosMP)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f9ebe6] px-4 py-3">
              <span className="text-xs font-medium text-[#ba7665]">Egresos MP</span>
              <span className="text-sm font-bold text-[#ba7665]">
                -{money(egresosMP)}
              </span>
            </div>

            {/* Separador visual */}
            <div className="border-t border-dashed border-[#e5eae1]" />

            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Saldo esperado</span>
              <span className="text-lg font-bold text-[#40562a]">{money(esperado)}</span>
            </div>
          </div>
        </div>

        {/* CIERRE REAL */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre real de hoy</p>
          <AmountField
            label="Saldo real en MercadoPago"
            value={cierreHoy}
            setValue={setCierreHoy}
          />

          {n(cierreHoy) > 0 && (
            <>
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

              {diferencia < 0 && (
                <div className="mt-3 rounded-xl border border-[#f0b9b3] bg-[#fdf0ee] p-4">
                  <p className="text-xs font-bold text-[#ba4a3a]">
                    ⚠️ Faltan {money(Math.abs(diferencia))}
                  </p>
                  <p className="mt-1 text-[11px] text-[#ba7665]">
                    Verificá si hay pagos o gastos en MP que no se cargaron.
                  </p>
                </div>
              )}

              {diferencia > 0 && (
                <div className="mt-3 rounded-xl border border-[#e8c96e] bg-[#fef9e7] p-4">
                  <p className="text-xs font-bold text-[#926c00]">
                    ℹ️ Sobran {money(diferencia)}
                  </p>
                  <p className="mt-1 text-[11px] text-[#926c00]">
                    Se registrará como diferencia positiva.
                  </p>
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Confirmar control MP'}{' '}
                <ShieldCheck size={16} />
              </button>
            </>
          )}

          {saved && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#bdd8b8]">
                ✓
              </div>
              Control MP registrado
              {diferencia !== 0
                ? ` — Diferencia ${diferencia > 0 ? '+' : ''}${money(diferencia)} impactada`
                : ''}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditMovimientoModal
          movimiento={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}