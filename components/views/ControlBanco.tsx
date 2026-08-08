'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Pencil, ShieldCheck, Trash2,
  CreditCard, Smartphone, Banknote, ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format } from 'date-fns';

type Metodo = 'Debito' | 'Credito' | 'MercadoPago' | 'Efectivo';

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
  Credito: {
    label: 'Crédito',
    icon: CreditCard,
    bg: 'bg-[#f0e8f5]',
    bgSoft: 'bg-[#f7f2fa]',
    text: 'text-[#6b4d8a]',
    border: 'border-[#d8c8e8]',
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

const METODOS: Metodo[] = ['Debito', 'Credito', 'MercadoPago', 'Efectivo'];

type DecisionBanco = 'comision' | 'ajuste' | null;

export default function ControlBanco() {
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [movsPorMetodo, setMovsPorMetodo] = useState<Record<Metodo, Movimiento[]>>({
    Debito: [], Credito: [], MercadoPago: [], Efectivo: [],
  });
  const [ingresosPorMetodo, setIngresosPorMetodo] = useState<Record<Metodo, number>>({
    Debito: 0, Credito: 0, MercadoPago: 0, Efectivo: 0,
  });
  const [expandido, setExpandido] = useState<Record<Metodo, boolean>>({
    Debito: true, Credito: true, MercadoPago: false, Efectivo: false,
  });

  // Control banco
  const [acreditadoBanco, setAcreditadoBanco] = useState('');
  const [decision, setDecision] = useState<DecisionBanco>(null);
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<Movimiento | null>(null);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  // Banco = Débito + Crédito
  const cobradoBanco = ingresosPorMetodo.Debito + ingresosPorMetodo.Credito;
  const acreditadoReal = n(acreditadoBanco);
  // diferencia: positivo = acreditaron más, negativo = acreditaron menos
  const diferencia = acreditadoReal - cobradoBanco;
  const porcentaje = cobradoBanco > 0
    ? ((Math.abs(diferencia) / cobradoBanco) * 100).toFixed(2)
    : '0';

  const fetchData = async () => {
    setLoading(true);
    const results: Record<Metodo, Movimiento[]> = {
      Debito: [], Credito: [], MercadoPago: [], Efectivo: [],
    };
    const ingresos: Record<Metodo, number> = {
      Debito: 0, Credito: 0, MercadoPago: 0, Efectivo: 0,
    };

    await Promise.all(
      METODOS.map(async (metodo) => {
        const movs = await db.getMovimientosDia(fecha, metodo);
        results[metodo] = movs;
        ingresos[metodo] = movs.reduce((s, m) => s + Number(m.entrada), 0);
      })
    );

    setMovsPorMetodo(results);
    setIngresosPorMetodo(ingresos);
    setLoading(false);
    setSaved(false);
    setDecision(null);
    setObservacion('');
    setAcreditadoBanco('');
  };

  useEffect(() => { fetchData(); }, [fecha]);

  const handleGuardar = async () => {
    if (diferencia !== 0 && !decision) return;
    setSaving(true);

    // Guardar acreditado real en arqueo
    await db.upsertArqueo({ fecha, disponible_banco: acreditadoReal });

    if (diferencia !== 0) {
      if (decision === 'comision') {
        // Comisión → movimiento de salida real
        await db.insertMovimientos([{
          fecha,
          concepto: `Comisión banco POSNET (${porcentaje}%)`,
          entrada: 0,
          salida: Math.abs(diferencia),
          metodo: 'Debito',
          categoria: 'OPERATIVO',
        }]);
      } else if (decision === 'ajuste') {
        // Ajuste → registrar en diferencias_arqueo
        await db.insertDiferencia({
          fecha,
          metodo: diferencia > 0 ? 'Credito' : 'Debito',
          monto: Math.abs(diferencia),
          signo: diferencia > 0 ? 1 : -1,
          tipo: 'diferencia_real',
          observacion: observacion || null,
        });
      }
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

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Cargando...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Building2 size={14} /> Control de cierre
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Banco
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Débito + Crédito → misma cuenta. Compará con lo acreditado.
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

        {/* ── COBROS DEL DÍA ─────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[#253729]">Cobros del día</p>
            <span className="text-xs font-semibold text-[#849083]">
              Total: <span className="text-[#3d6942]">{money(totalCobrado)}</span>
            </span>
          </div>

          {/* Tarjetas */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                  <div className={`mb-1 flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
                    <Icon size={11} />
                    <span className="truncate">{cfg.label}</span>
                  </div>
                  <p className={`text-sm font-bold ${cfg.text}`}>{money(monto)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[10px] text-[#99a398]">
                      {cant} cobro{cant !== 1 ? 's' : ''}
                    </p>
                    {cant > 0 && (
                      expandido[metodo]
                        ? <ChevronUp size={10} className="text-[#99a398]" />
                        : <ChevronDown size={10} className="text-[#99a398]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Subtotal banco */}
          {cobradoBanco > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#c9ddc5] bg-[#f2f8ef] px-4 py-2">
              <span className="text-[11px] font-semibold text-[#3d6942]">
                → Total Banco (Déb + Cred)
              </span>
              <span className="text-sm font-bold text-[#3d6942]">{money(cobradoBanco)}</span>
            </div>
          )}

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
                        <p className="text-xs font-semibold text-[#3c4e3e]">{m.concepto}</p>
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

        {/* ── CONTROL BANCO ──────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-[#3d6942]" />
            <p className="text-sm font-bold">Control Banco</p>
          </div>

          {/* Resumen sistema */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-[#f2f8ef] px-4 py-2.5">
              <span className="text-xs text-[#3d6942]">Cobrado Débito</span>
              <span className="text-sm font-bold text-[#3d6942]">
                {money(ingresosPorMetodo.Debito)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f7f2fa] px-4 py-2.5">
              <span className="text-xs text-[#6b4d8a]">Cobrado Crédito</span>
              <span className="text-sm font-bold text-[#6b4d8a]">
                {money(ingresosPorMetodo.Credito)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
              <span className="text-xs font-semibold text-[#3d6942]">
                Total sistema → Banco
              </span>
              <span className="text-lg font-bold text-[#3d6942]">{money(cobradoBanco)}</span>
            </div>
          </div>

          {/* Input acreditado real */}
          <AmountField
            label="Monto real acreditado en banco"
            value={acreditadoBanco}
            setValue={setAcreditadoBanco}
          />

          {/* Resultado */}
          {acreditadoReal > 0 && (
            <>
              {/* Sin diferencia */}
              {diferencia === 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#c9ddc5] bg-[#eff8ed] p-4">
                  <span className="text-xs font-medium">Diferencia</span>
                  <span className="text-lg font-bold text-[#3d6942]">✓ Coincide</span>
                </div>
              )}

              {/* Con diferencia */}
              {diferencia !== 0 && (
                <>
                  {/* Cálculo visual */}
                  <div className="mt-4 rounded-xl bg-[#f9f9f4] p-4 text-xs text-[#849083]">
                    <div className="flex justify-between">
                      <span>Sistema (Déb + Cred)</span>
                      <span className="font-semibold text-[#3c4e3e]">{money(cobradoBanco)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acreditado real</span>
                      <span className="font-semibold text-[#3c4e3e]">{money(acreditadoReal)}</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-[#e5eae1] pt-1 font-bold">
                      <span>Diferencia</span>
                      <span className={diferencia > 0 ? 'text-[#3d6942]' : 'text-[#ba4a3a]'}>
                        {diferencia > 0 ? '+' : ''}{money(diferencia)}
                        <span className="ml-1 text-[10px] font-normal">({porcentaje}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Contexto de otros métodos */}
                  <div className="mt-3 rounded-xl border border-[#e8d47a] bg-[#fef9e7] p-4">
                    <p className="text-[11px] font-bold text-[#926c00]">
                      💡 Antes de decidir, revisá los otros métodos
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#926c00]">MP del día</span>
                        <span className="font-semibold text-[#926c00]">
                          {money(ingresosPorMetodo.MercadoPago)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#926c00]">Efectivo del día</span>
                        <span className="font-semibold text-[#926c00]">
                          {money(ingresosPorMetodo.Efectivo)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-[#a07800]">
                      Si la diferencia compensa con otro método, editá el movimiento
                      correspondiente antes de confirmar.
                    </p>
                  </div>

                  {/* Decisión */}
                  <div className="mt-4">
                    <p className="mb-3 text-xs font-bold text-[#40562a]">
                      ¿Qué es esta diferencia?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDecision('comision')}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          decision === 'comision'
                            ? 'border-[#40562a] bg-[#edf0e2]'
                            : 'border-[#e5eae1] bg-white hover:border-[#b9c8b3]'
                        }`}
                      >
                        <p className="text-sm font-bold">📊 Comisión banco</p>
                        <p className="mt-1 text-[11px] text-[#849083]">
                          Costo real del POSNET. Se registra como gasto operativo.
                        </p>
                      </button>
                      <button
                        onClick={() => setDecision('ajuste')}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          decision === 'ajuste'
                            ? 'border-[#ba4a3a] bg-[#fdf0ee]'
                            : 'border-[#e5eae1] bg-white hover:border-[#f0b9b3]'
                        }`}
                      >
                        <p className="text-sm font-bold">⚠️ Ajuste / Error</p>
                        <p className="mt-1 text-[11px] text-[#849083]">
                          Diferencia revisada. Se registra en el listado de ajustes.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Observación si es ajuste */}
                  {decision === 'ajuste' && (
                    <div className="mt-3">
                      <textarea
                        value={observacion}
                        onChange={e => setObservacion(e.target.value)}
                        placeholder="Describí brevemente el motivo del ajuste (opcional)"
                        rows={2}
                        className="w-full rounded-xl border border-[#e2e8df] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#9ab498] resize-none"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Botón confirmar */}
              {(diferencia === 0 || decision) && (
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Confirmar control Banco'}
                  <ShieldCheck size={16} />
                </button>
              )}

              {/* Confirmado */}
              {saved && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bdd8b8]">
                    ✓
                  </div>
                  {decision === 'comision'
                    ? `Comisión ${money(Math.abs(diferencia))} (${porcentaje}%) registrada como gasto operativo`
                    : decision === 'ajuste'
                      ? `Ajuste ${money(Math.abs(diferencia))} registrado en listado de diferencias`
                      : 'Control banco registrado — sin diferencia'}
                </div>
              )}
            </>
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