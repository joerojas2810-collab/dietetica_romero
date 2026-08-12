'use client';

import { useState, useEffect } from 'react';
import {
  ArrowUpRight, CalendarDays, CirclePlus, Cloud,
  Receipt, ShieldCheck, Sparkles, Trash2, CreditCard,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { Movimiento, MetodoPago, CategoriaGasto, ArqueoDiario } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import SectionCard from '@/components/shared/SectionCard';
import AmountField from '@/components/shared/AmountField';
import BillField from '@/components/shared/BillField';
import CreditCardIcon from '@/components/shared/CreditCardIcon';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const today = format(new Date(), 'yyyy-MM-dd');

interface GastoRow {
  concept: string;
  amount: string;
  method: MetodoPago;
  category: CategoriaGasto;
}

export default function DayForm({ onSave }: { onSave: (msg: string) => void }) {
  const [fecha, setFecha] = useState(today);
  const [cobroMP, setCobroMP] = useState('');
  const [cobroEfectivo, setCobroEfectivo] = useState('');
  const [cobroDebito, setCobroDebito] = useState('');
  const [cobroCredito, setCobroCredito] = useState('');
  const [qty100, setQty100] = useState('');
  const [qty200, setQty200] = useState('');
  const [qty500, setQty500] = useState('');
  const [qty1000, setQty1000] = useState('');
  const [qty2000, setQty2000] = useState('');
  const [qty10000, setQty10000] = useState('');
  const [qty20000, setQty20000] = useState('');
  const [gastos, setGastos] = useState<GastoRow[]>([
    { concept: '', amount: '', method: 'Efectivo', category: 'OPERATIVO' },
  ]);
  const [saving, setSaving] = useState(false);
  const [ultimoArqueo, setUltimoArqueo] = useState<ArqueoDiario | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const cajaChicaArqueo = (a: ArqueoDiario) =>
    Number(a.bill_100 ?? 0) +
    Number(a.bill_200 ?? 0) +
    Number(a.bill_500 ?? 0) +
    Number(a.bill_1000 ?? 0) +
    Number(a.bill_2000 ?? 0);

  const cartucheraArqueo = (a: ArqueoDiario) =>
    Number(a.bill_10000 ?? 0) + Number(a.bill_20000 ?? 0);

  useEffect(() => {
    const fetchUltimoArqueo = async () => {
      const ayer = format(
        new Date(new Date().setDate(new Date().getDate() - 1)),
        'yyyy-MM-dd'
      );
      const arqueos = await db.getArqueosMes('2000-01-01', ayer);
      const ultimo = arqueos
        .filter(a =>
          a.bill_100 != null || a.bill_200 != null ||
          a.bill_500 != null || a.bill_1000 != null || a.bill_2000 != null
        )
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null;
      setUltimoArqueo(ultimo);
    };
    fetchUltimoArqueo();
  }, []);

  const totalCobrado = n(cobroMP) + n(cobroEfectivo) + n(cobroDebito) + n(cobroCredito);
  const totalBanco = n(cobroDebito) + n(cobroCredito);

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
      if (n(cobroMP) > 0)
        cobros.push({ fecha, concepto: 'Cobro MP', entrada: n(cobroMP), salida: 0, metodo: 'MercadoPago' });
      if (n(cobroEfectivo) > 0)
        cobros.push({ fecha, concepto: 'Cobro Efectivo', entrada: n(cobroEfectivo), salida: 0, metodo: 'Efectivo' });
      if (n(cobroDebito) > 0)
        cobros.push({ fecha, concepto: 'Cobro Débito', entrada: n(cobroDebito), salida: 0, metodo: 'Debito' });
      if (n(cobroCredito) > 0)
        cobros.push({ fecha, concepto: 'Cobro Crédito', entrada: n(cobroCredito), salida: 0, metodo: 'Credito' });

      const gastosRows: Omit<Movimiento, 'id' | 'created_at'>[] = gastos
        .filter(g => g.concept.trim() && n(g.amount) > 0)
        .map(g => ({
          fecha,
          concepto: g.concept,
          entrada: 0,
          salida: n(g.amount),
          metodo: g.method,
          categoria: g.category,
        }));

      await db.insertMovimientos([...cobros, ...gastosRows]);
      await db.upsertArqueo({
        fecha,
        bill_100: val100,
        bill_200: val200,
        bill_500: val500,
        bill_1000: val1000,
        bill_2000: val2000,
        bill_10000: val10000,
        bill_20000: val20000,
        a_caja_fuerte: cajaFuerteTotal,
      });

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
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Cargá el día
          </h2>
          <p className="mt-2 text-sm text-[#849083]">Completá los valores del cierre.</p>
        </div>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none"
        />
      </div>

      {/* ── Card último cierre caja chica ─────────────────────────── */}
      {ultimoArqueo && (
        <div className="mb-5 rounded-3xl border border-[#e5eae1] bg-white shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <button
            onClick={() => setMostrarDetalle(v => !v)}
            className="flex w-full items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef3e8]">
                <Receipt size={16} className="text-[#40562a]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#849083]">
                  Último cierre · {format(parseISO(ultimoArqueo.fecha), "d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-lg font-bold text-[#253729]">
                  Caja chica: {money(cajaChicaArqueo(ultimoArqueo))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-semibold text-[#526b53] sm:block">
                Cartuchera: {money(cartucheraArqueo(ultimoArqueo))}
              </span>
              {mostrarDetalle
                ? <ChevronUp size={16} className="text-[#849083]" />
                : <ChevronDown size={16} className="text-[#849083]" />
              }
            </div>
          </button>

          {mostrarDetalle && (
            <div className="border-t border-[#e5eae1] px-6 pb-5 pt-4">
              <p className="mb-3 text-xs font-bold text-[#40562a]">Detalle de billetes</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { label: '$100',   val: Number(ultimoArqueo.bill_100  ?? 0), denom: 100   },
                  { label: '$200',   val: Number(ultimoArqueo.bill_200  ?? 0), denom: 200   },
                  { label: '$500',   val: Number(ultimoArqueo.bill_500  ?? 0), denom: 500   },
                  { label: '$1.000', val: Number(ultimoArqueo.bill_1000 ?? 0), denom: 1000  },
                  { label: '$2.000', val: Number(ultimoArqueo.bill_2000 ?? 0), denom: 2000  },
                ].map(({ label, val, denom }) => (
                  <div key={denom} className="rounded-xl border border-[#e5eae1] bg-[#f9fbf7] px-3 py-2">
                    <p className="text-[10px] text-[#849083]">{label}</p>
                    <p className="text-xs font-bold text-[#3c4e3e]">
                      {val > 0 ? `${val / denom} × ${label}` : '—'}
                    </p>
                    <p className="text-[11px] font-semibold text-[#40562a]">
                      {val > 0 ? money(val) : '$ 0'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#d5e5d1] bg-[#f2f0e8] p-4">
                <p className="mb-2 text-xs font-bold text-[#40562a]">→ Cartuchera</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '$10.000', val: Number(ultimoArqueo.bill_10000 ?? 0), denom: 10000 },
                    { label: '$20.000', val: Number(ultimoArqueo.bill_20000 ?? 0), denom: 20000 },
                  ].map(({ label, val, denom }) => (
                    <div key={denom} className="rounded-xl border border-[#c8dcc3] bg-white px-3 py-2">
                      <p className="text-[10px] text-[#849083]">{label}</p>
                      <p className="text-xs font-bold text-[#3c4e3e]">
                        {val > 0 ? `${val / denom} × ${label}` : '—'}
                      </p>
                      <p className="text-[11px] font-semibold text-[#40562a]">
                        {val > 0 ? money(val) : '$ 0'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-[#40562a] px-4 py-2 text-white">
                  <span className="text-xs">Total cartuchera</span>
                  <span className="text-sm font-bold">{money(cartucheraArqueo(ultimoArqueo))}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
                <span className="text-xs font-medium text-[#768676]">Total caja chica</span>
                <span className="text-lg font-bold text-[#40562a]">
                  {money(cajaChicaArqueo(ultimoArqueo))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          {/* ── 01 Cobros ──────────────────────────────────────────────── */}
          <SectionCard
            number="01"
            title="Cobros del sistema"
            description="Ingresá lo que informa Franquify."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AmountField
                label="Cobro Efectivo"
                value={cobroEfectivo}
                setValue={setCobroEfectivo}
                icon={<Receipt size={16} />}
              />
              <AmountField
                label="Cobro MP"
                value={cobroMP}
                setValue={setCobroMP}
                icon={<Cloud size={16} />}
              />
              <AmountField
                label="Cobro Débito"
                value={cobroDebito}
                setValue={setCobroDebito}
                icon={<CreditCardIcon />}
              />
              <AmountField
                label="Cobro Crédito"
                value={cobroCredito}
                setValue={setCobroCredito}
                icon={<CreditCard size={16} />}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#768676]">Total cobrado</span>
              <span className="text-lg font-bold text-[#40562a]">{money(totalCobrado)}</span>
            </div>

            {totalBanco > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-[#e5eae1] px-4 py-2">
                <span className="text-[11px] font-medium text-[#849083]">
                  → Banco (Déb + Cred)
                </span>
                <span className="text-sm font-bold text-[#526b53]">{money(totalBanco)}</span>
              </div>
            )}
          </SectionCard>

          {/* ── 02 Arqueo de billetes ──────────────────────────────────── */}
          <SectionCard
            number="02"
            title="Arqueo de billetes"
            description="Contá el efectivo físico."
          >
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
                <p className="text-[10px] uppercase tracking-wider text-[#759376]">
                  Diferencia vs. sistema
                </p>
                <p className="mt-1 text-2xl font-bold text-[#4f8755]">
                  {difEfectivo === 0
                    ? '✓ Sin diferencia'
                    : difEfectivo > 0
                      ? `+${money(difEfectivo)}`
                      : `-${money(Math.abs(difEfectivo))}`}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── 03 Gastos ──────────────────────────────────────────────── */}
          <SectionCard
            number="03"
            title="Gastos del día"
            description="Sumá cada gasto."
          >
            <div className="space-y-3">
              {gastos.map((row, i) => (
                <div
                  key={i}
                  className="grid gap-2 rounded-xl border border-[#e8ede5] bg-[#fbfcfa] p-3 sm:grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr_auto] sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
                >
                  <input
                    value={row.concept}
                    onChange={e =>
                      setGastos(gastos.map((g, j) =>
                        j === i ? { ...g, concept: e.target.value } : g
                      ))
                    }
                    placeholder="Ej: Compra proveedor"
                    className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none focus:border-[#9ab498]"
                  />
                  <input
                    value={row.amount}
                    onChange={e =>
                      setGastos(gastos.map((g, j) =>
                        j === i ? { ...g, amount: e.target.value } : g
                      ))
                    }
                    placeholder="$ 0"
                    inputMode="numeric"
                    className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-sm outline-none focus:border-[#9ab498]"
                  />
                  <select
                    value={row.method}
                    onChange={e =>
                      setGastos(gastos.map((g, j) =>
                        j === i ? { ...g, method: e.target.value as MetodoPago } : g
                      ))
                    }
                    className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="MercadoPago">MercadoPago</option>
                    <option value="Debito">Débito (Banco)</option>
                    <option value="Credito">Crédito (Banco)</option>
                  </select>
                  <select
                    value={row.category}
                    onChange={e =>
                      setGastos(gastos.map((g, j) =>
                        j === i ? { ...g, category: e.target.value as CategoriaGasto } : g
                      ))
                    }
                    className="h-11 rounded-lg border border-[#e2e8df] bg-white px-3 text-xs outline-none"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="OPERATIVO">Operativo</option>
                    <option value="MATERIA PRIMA">Materia Prima</option>
                    <option value="DESECHABLES">Desechables</option>
                    <option value="EXTRAORDINARIO">Extraordinario</option>
                    <option value="GISELA">Gisela</option>
                    <option value="AHORRO">Ahorro</option>
                  </select>
                  <button
                    onClick={() => setGastos(gastos.filter((_, j) => j !== i))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#b5beb4] hover:bg-[#fff0ee] hover:text-[#c7796e]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setGastos([...gastos, { concept: '', amount: '', method: 'Efectivo', category: 'OPERATIVO' }])
              }
              className="mt-4 flex items-center gap-2 text-xs font-bold text-[#527758] hover:text-[#40562a]"
            >
              <CirclePlus size={16} /> Agregar otro gasto
            </button>
          </SectionCard>
        </div>

        {/* ── Resumen lateral ──────────────────────────────────────────── */}
        <div className="h-fit space-y-5 xl:sticky xl:top-[100px]">
          <div className="rounded-3xl bg-[#40562a] p-6 text-white shadow-xl shadow-[#40562a20]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#c2dbbe]">
              <Sparkles size={14} /> Resumen del día
            </div>

            <p className="mt-6 text-xs text-[#bdd5b9]">Total cobrado</p>
            <p className="mt-1 text-3xl font-bold tracking-[-0.05em]">{money(totalCobrado)}</p>

            <div className="my-5 h-px bg-white/15" />

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#c5d8c1]">Efectivo</span>
                <span className="font-bold">{money(n(cobroEfectivo))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c5d8c1]">MercadoPago</span>
                <span className="font-bold">{money(n(cobroMP))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c5d8c1]">Débito</span>
                <span className="font-bold">{money(n(cobroDebito))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#c5d8c1]">Crédito</span>
                <span className="font-bold">{money(n(cobroCredito))}</span>
              </div>

              {totalBanco > 0 && (
                <>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between">
                    <span className="text-[#a8c5a3]">→ Total Banco</span>
                    <span className="font-bold text-[#d7e9c9]">{money(totalBanco)}</span>
                  </div>
                </>
              )}

              <div className="h-px bg-white/10" />
              <div className="flex justify-between">
                <span className="text-[#c5d8c1]">Gastos cargados</span>
                <span className="font-bold">
                  {gastos.filter(g => n(g.amount) > 0).length}
                </span>
              </div>
            </div>

            <button
              onClick={handleGuardar}
              disabled={saving}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7e9c9] py-3.5 text-sm font-bold text-[#40562a] transition hover:bg-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar el día'} <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="flex gap-3 rounded-2xl border border-[#e3e9de] bg-white p-4">
            <ShieldCheck size={19} className="shrink-0 text-[#6a986c]" />
            <p className="text-xs leading-5 text-[#849083]">
              Si ya cargaste este día, los datos se actualizan automáticamente. Nada se duplica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}