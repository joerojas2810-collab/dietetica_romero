'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Cloud, Pencil, ShieldCheck, Trash2,
  CreditCard, Smartphone, Banknote, ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { Movimiento, ArqueoDiario } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

  // Control Banco
  const [cierreAnterior, setCierreAnterior] = useState('');
  const [cierreHoy, setCierreHoy] = useState('');
  const [egresosBanco, setEgresosBanco] = useState(0);
  const [decision, setDecision] = useState<'comision' | 'diferencia_real' | null>(null);
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [editing, setEditing] = useState<Movimiento | null>(null);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
  const toAmountString = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return '';
    const num = Number(v);
    return Number.isFinite(num) ? String(num) : '';
  };

  const cobradoBanco = ingresosPorMetodo.Debito + ingresosPorMetodo.Credito;
  const esperado = n(cierreAnterior) + cobradoBanco - egresosBanco;
  const cierreReal = n(cierreHoy);
  const diferencia = cierreReal - esperado;
  const porcentaje = esperado > 0 ? ((Math.abs(diferencia) / esperado) * 100).toFixed(2) : '0';

  const fetchData = async ({ preserveNotice = false }: { preserveNotice?: boolean } = {}) => {
    setLoading(true);
    if (!preserveNotice) {
      setSaveMessage('');
      setSaveError('');
    }

    const results: Record<Metodo, Movimiento[]> = {
      Debito: [], Credito: [], MercadoPago: [], Efectivo: [],
    };
    const ingresos: Record<Metodo, number> = {
      Debito: 0, Credito: 0, MercadoPago: 0, Efectivo: 0,
    };

    try {
      await Promise.all(
        METODOS.map(async (metodo) => {
          const movs = await db.getMovimientosDia(fecha, metodo);
          results[metodo] = movs;
          ingresos[metodo] = movs.reduce((s, m) => s + Number(m.entrada), 0);
        })
      );

      const [arqHoy, arqueosHistoricos] = await Promise.all([
        db.getArqueoDia(fecha),
        db.getArqueosMes('2000-01-01', fecha),
      ]);

      const egBan = results.Debito.reduce((s, m) => s + Number(m.salida), 0) + 
                    results.Credito.reduce((s, m) => s + Number(m.salida), 0);

      const ultimoBancoPrevio = arqueosHistoricos
        .filter(a => a.fecha < fecha && (a.disponible_banco != null || a.disponible_debito != null))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

      setMovsPorMetodo(results);
      setIngresosPorMetodo(ingresos);
      setEgresosBanco(egBan);

      setCierreAnterior(toAmountString(ultimoBancoPrevio?.disponible_banco ?? ultimoBancoPrevio?.disponible_debito));
      setCierreHoy(toAmountString(arqHoy?.disponible_banco ?? arqHoy?.disponible_debito));
      
      setDecision(null);
      setObservacion('');
    } catch (err) {
      console.error('Error cargando Control Banco:', err);
      setSaveError('No se pudieron obtener los datos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fecha]);

  const handleGuardar = async () => {
    if (diferencia !== 0 && !decision) return;
    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      let notice = 'Control Banco registrado — sin diferencia';

      // 1. Guardar el cierre real en arqueo_diario
      await db.upsertArqueo({ 
        fecha, 
        disponible_banco: cierreReal 
      });

      if (diferencia !== 0) {
        if (decision === 'comision') {
          // Registrar comisión del posnet como una salida real OPERATIVO
          await db.insertMovimientos([{
            fecha,
            concepto: 'Comisión Posnet / Tarjetas',
            entrada: 0,
            salida: Math.abs(diferencia),
            metodo: 'Debito',
            categoria: 'OPERATIVO'
          }]);
          notice = `Comisión por ${money(Math.abs(diferencia))} registrada como gasto de salida.`;
        } else if (decision === 'diferencia_real') {
          // Registrar diferencia real en tabla de diferencias para auditoría
          await db.insertDiferencia({
            fecha,
            metodo: 'Debito',
            monto: Math.abs(diferencia),
            signo: diferencia > 0 ? 1 : -1,
            tipo: 'diferencia_real',
            observacion: observacion || 'Ajuste de arqueo de banco'
          });
          notice = `Diferencia real de ${money(Math.abs(diferencia))} registrada en Reportes.`;
        }
      }

      await fetchData({ preserveNotice: true });
      setSaveMessage(notice);
    } catch (err) {
      console.error('Error guardando control banco:', err);
      setSaveError('Hubo un problema al procesar el guardado.');
    } finally {
      setSaving(false);
    }
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
      Cargando Banco...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <Building2 size={14} /> Control de cierre
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Cuenta Banco
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Auditoría de acreditaciones de tarjetas de Débito y Crédito.
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
        
        {/* Cobros del día */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-[#253729]">Ventas del día</p>
            <span className="text-xs font-semibold text-[#849083]">
              Banco (Déb + Cred): <span className="text-[#3d6942] font-bold">{money(cobradoBanco)}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['Debito', 'Credito'].map(m => {
              const metodo = m as Metodo;
              const cfg = METODOS_CONFIG[metodo];
              const Icon = cfg.icon;
              const monto = ingresosPorMetodo[metodo];
              const cant = movsPorMetodo[metodo].length;
              return (
                <button
                  key={metodo}
                  onClick={() => setExpandido(prev => ({ ...prev, [metodo]: !prev[metodo] }))}
                  className={`rounded-2xl border ${cfg.border} ${cfg.bgSoft} p-3 text-left transition hover:shadow-sm`}
                >
                  <div className={`mb-1 flex items-center gap-1 text-[10px] font-semibold ${cfg.text}`}>
                    <Icon size={11} />
                    <span>{cfg.label}</span>
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

          {/* Listados Expandidos */}
          {['Debito', 'Credito'].map(m => {
            const metodo = m as Metodo;
            const movs = movsPorMetodo[metodo];
            const cfg = METODOS_CONFIG[metodo];
            if (!expandido[metodo] || movs.length === 0) return null;
            return (
              <div key={metodo} className="mt-4 space-y-2 border-t border-[#edf0eb] pt-3">
                <p className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>
                  Detalle {cfg.label}
                </p>
                {movs.map(mov => (
                  <div key={mov.id} className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#3c4e3e] font-semibold">{mov.concepto}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#56805b]">{money(Number(mov.entrada))}</span>
                      <button onClick={() => setEditing(mov)} className="text-[#b5beb4] hover:text-[#40562a]">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(mov.id!)} className="text-[#b5beb4] hover:text-[#ba4a3a]">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Cierre Anterior */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre del día anterior</p>
          <AmountField
            label="Último saldo en cuenta Banco"
            value={cierreAnterior}
            setValue={setCierreAnterior}
          />
        </div>

        {/* Saldos Esperados */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <div className="mb-3 flex items-center gap-2 text-[#2d5a8e]">
            <Building2 size={16} />
            <p className="text-sm font-bold">Movimientos Banco esperados</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-[#f2f0e8] px-4 py-3 text-xs">
              <span className="text-[#526b53] font-medium">Saldo anterior</span>
              <span className="font-bold text-[#3c4e3e]">{money(n(cierreAnterior))}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3 text-xs">
              <span className="text-[#3d6942] font-medium">+ Ingresos Banco (Déb + Cred)</span>
              <span className="font-bold text-[#3d6942]">+{money(cobradoBanco)}</span>
            </div>
            {egresosBanco > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-[#fdf0ee] px-4 py-3 text-xs">
                <span className="text-[#ba4a3a] font-medium">− Egresos Banco</span>
                <span className="font-bold text-[#ba4a3a]">-{money(egresosBanco)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-[#e5eae1] my-2" />
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-bold text-[#40562a]">Saldo esperado</span>
              <span className="text-lg font-bold text-[#40562a]">{money(esperado)}</span>
            </div>
          </div>
        </div>

        {/* Cierre real y cálculo de diferencias */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-3 text-sm font-bold">Cierre real de hoy</p>
          <AmountField
            label="Saldo acreditado real en Homebanking"
            value={cierreHoy}
            setValue={setCierreHoy}
          />

          {cierreReal > 0 && (
            <>
              {diferencia === 0 ? (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#c9ddc5] bg-[#eff8ed] p-4">
                  <span className="text-xs font-medium">Diferencia</span>
                  <span className="text-lg font-bold text-[#3d6942]">✓ Coincide</span>
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-xl bg-[#f9f9f4] p-4 text-xs text-[#849083]">
                    <div className="flex justify-between">
                      <span>Saldo esperado</span>
                      <span className="font-semibold text-[#3c4e3e]">{money(esperado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo real acreditado</span>
                      <span className="font-semibold text-[#3c4e3e]">{money(cierreReal)}</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-[#e5eae1] pt-1 font-bold">
                      <span>Diferencia</span>
                      <span className={diferencia > 0 ? 'text-[#3d6942]' : 'text-[#ba4a3a]'}>
                        {diferencia > 0 ? '+' : ''}{money(diferencia)}
                        <span className="ml-1 text-[10px] font-normal">({porcentaje}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Toma de Decisiones */}
                  <div className="mt-4">
                    <p className="mb-3 text-xs font-bold text-[#40562a]">¿Qué originó esta diferencia?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDecision('comision')}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          decision === 'comision'
                            ? 'border-[#3d6942] bg-[#eff8ed]'
                            : 'border-[#e5eae1] bg-white hover:border-[#c9ddc5]'
                        }`}
                      >
                        <p className="text-sm font-bold">💳 Comisión Posnet</p>
                        <p className="mt-1 text-[11px] text-[#849083]">
                          Es el descuento por arancel del posnet. Se carga como salida de Gasto Operativo.
                        </p>
                      </button>
                      <button
                        onClick={() => setDecision('diferencia_real')}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          decision === 'diferencia_real'
                            ? 'border-[#ba4a3a] bg-[#fdf0ee]'
                            : 'border-[#e5eae1] bg-white hover:border-[#f0b9b3]'
                        }`}
                      >
                        <p className="text-sm font-bold">⚠️ Diferencia real</p>
                        <p className="mt-1 text-[11px] text-[#849083]">
                          Faltante o sobrante no identificado en el banco. Se asienta en Reportes.
                        </p>
                      </button>
                    </div>
                  </div>

                  {decision === 'diferencia_real' && (
                    <div className="mt-3">
                      <textarea
                        value={observacion}
                        onChange={e => setObservacion(e.target.value)}
                        placeholder="Describí brevemente el motivo (ej. Retención impositiva)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-[#e2e8df] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#9ab498]"
                      />
                    </div>
                  )}
                </>
              )}

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

              {saveError && (
                <div className="mt-3 rounded-xl border border-[#f0b9b3] bg-[#fdf0ee] px-4 py-3 text-xs font-semibold text-[#ba4a3a]">
                  {saveError}
                </div>
              )}

              {saveMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bdd8b8]">✓</div>
                  {saveMessage}
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