'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import BillField from '@/components/shared/BillField';
import { format } from 'date-fns';

type DecisionCartuchera = 'reasignacion' | 'diferencia_real' | null;

export default function Cartuchera() {
  const [loading, setLoading] = useState(true);
  const [totalSistema, setTotalSistema] = useState(0);
  const [cReal10000, setCReal10000] = useState('');
  const [cReal20000, setCReal20000] = useState('');
  const [decision, setDecision] = useState<DecisionCartuchera>(null);
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  const totalReal = n(cReal10000) * 10000 + n(cReal20000) * 20000;
  // positivo = hay más de lo que dice el sistema
  // negativo = hay menos de lo que dice el sistema
  const diferencia = totalReal - totalSistema;
  const porcentaje = totalSistema > 0
    ? ((Math.abs(diferencia) / totalSistema) * 100).toFixed(2)
    : '0';

  const fetchTotal = async () => {
    setLoading(true);
    const total = await db.getArqueoTotal();
    setTotalSistema(total);
    setLoading(false);
  };

  useEffect(() => { fetchTotal(); }, []);

  const handleGuardar = async () => {
    if (diferencia !== 0 && !decision) return;
    setSaving(true);

    const fecha = format(new Date(), 'yyyy-MM-dd');

    await db.insertDiferencia({
      fecha,
      metodo: 'Efectivo',
      monto: Math.abs(diferencia),
      signo: diferencia > 0 ? 1 : -1,
      tipo: decision ?? 'diferencia_real',
      observacion: observacion.trim() || null,
    });

    setSaving(false);
    setSaved(true);
    setCReal10000('');
    setCReal20000('');
    setDecision(null);
    setObservacion('');
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Cargando...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
          <ShieldCheck size={14} /> Control físico
        </div>
        <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
          Cartuchera
        </h2>
        <p className="mt-2 text-sm text-[#849083]">
          Contá los billetes grandes y compará con el sistema.
        </p>
      </div>

      <div className="max-w-xl space-y-5">

        {/* ── TOTAL SISTEMA ──────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="text-xs font-medium text-[#849083]">
            Total cartuchera según sistema
          </p>
          <p className="mt-2 text-4xl font-bold text-[#40562a]">{money(totalSistema)}</p>
          <p className="mt-2 text-[11px] text-[#99a398]">
            Suma acumulada de todos los billetes $10.000 y $20.000 enviados a cartuchera
          </p>
        </div>

        {/* ── CONTEO REAL ────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-4 text-sm font-bold">Conteo físico</p>

          <div className="grid grid-cols-2 gap-3">
            <BillField label="$10.000" qty={cReal10000} setQty={setCReal10000} denom={10000} />
            <BillField label="$20.000" qty={cReal20000} setQty={setCReal20000} denom={20000} />
          </div>

          {totalReal > 0 && (
            <>
              {/* Resumen cálculo */}
              <div className="mt-4 rounded-xl bg-[#f9f9f4] p-4 text-xs text-[#849083]">
                <div className="flex justify-between">
                  <span>Sistema</span>
                  <span className="font-semibold text-[#3c4e3e]">{money(totalSistema)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Contado real</span>
                  <span className="font-semibold text-[#3c4e3e]">{money(totalReal)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-[#e5eae1] pt-1 font-bold">
                  <span>Diferencia</span>
                  <span className={diferencia === 0
                    ? 'text-[#3d6942]'
                    : diferencia > 0
                      ? 'text-[#3d6942]'
                      : 'text-[#ba4a3a]'
                  }>
                    {diferencia === 0
                      ? '✓ Coincide'
                      : `${diferencia > 0 ? '+' : ''}${money(diferencia)} (${porcentaje}%)`}
                  </span>
                </div>
              </div>

              {/* Sin diferencia */}
              {diferencia === 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#c9ddc5] bg-[#eff8ed] p-4">
                  <span className="text-xs font-medium">Estado</span>
                  <span className="text-lg font-bold text-[#3d6942]">✓ Todo coincide</span>
                </div>
              )}

              {/* Con diferencia */}
              {diferencia !== 0 && (
                <>
                  {/* Semáforo */}
                  <div className={`mt-4 rounded-xl border p-4 ${
                    Math.abs(diferencia) <= 2000
                      ? 'border-[#e8c96e] bg-[#fef9e7]'
                      : 'border-[#f0b9b3] bg-[#fdf0ee]'
                  }`}>
                    <p className={`text-xs font-bold ${
                      Math.abs(diferencia) <= 2000 ? 'text-[#926c00]' : 'text-[#ba4a3a]'
                    }`}>
                      {diferencia > 0
                        ? `⬆ Sobran ${money(diferencia)} en cartuchera`
                        : `⬇ Faltan ${money(Math.abs(diferencia))} en cartuchera`}
                    </p>
                    <p className="mt-1 text-[11px] text-[#849083]">
                      Revisá si hay billetes que no se registraron o se retiraron sin anotar.
                    </p>
                  </div>

                  {/* Decisión */}
                  <div className="mt-4">
                    <p className="mb-3 text-xs font-bold text-[#40562a]">
                      ¿Qué es esta diferencia?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setDecision('reasignacion')}
                        className={`rounded-xl border-2 p-4 text-left transition ${
                          decision === 'reasignacion'
                            ? 'border-[#40562a] bg-[#edf0e2]'
                            : 'border-[#e5eae1] bg-white hover:border-[#b9c8b3]'
                        }`}
                      >
                        <p className="text-sm font-bold">🔄 Error de registro</p>
                        <p className="mt-1 text-[11px] text-[#849083]">
                          Billetes que entraron o salieron sin registrarse.
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
                          Faltante o sobrante real que no tiene explicación.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Observación */}
                  {decision && (
                    <div className="mt-3">
                      <textarea
                        value={observacion}
                        onChange={e => setObservacion(e.target.value)}
                        placeholder="Describí brevemente el motivo (opcional)"
                        rows={2}
                        className="w-full resize-none rounded-xl border border-[#e2e8df] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#9ab498]"
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
                  {saving ? 'Guardando...' : 'Confirmar control cartuchera'}
                  <ShieldCheck size={16} />
                </button>
              )}

              {/* Confirmado */}
              {saved && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bdd8b8]">
                    ✓
                  </div>
                  {diferencia === 0
                    ? 'Control registrado — sin diferencia'
                    : decision === 'reasignacion'
                      ? `Error de registro ${money(Math.abs(diferencia))} anotado`
                      : `Diferencia real ${money(Math.abs(diferencia))} registrada`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}