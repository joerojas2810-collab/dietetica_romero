'use client';

import { useEffect, useState } from 'react';
import { Cloud, PiggyBank, Receipt, Building2, LockKeyhole } from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import CreditCardIcon from '@/components/shared/CreditCardIcon';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function CierreMes() {
  const [mes, setMes] = useState(mesActual);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [yaExiste, setYaExiste] = useState(false);

  // Aperturas del mes
  const [aperturas, setAperturas] = useState({
    caja_chica: 0,
    cartuchera: 0,
    banco: 0,
    mp: 0,
  });

  // Saldos finales calculados
  const [saldos, setSaldos] = useState({
    caja_chica: 0,
    cartuchera: 0,
    banco: 0,
    mp: 0,
  });

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

      const [movs, apertura, existente, arqueos] = await Promise.all([
        db.getMovimientosMes(inicio, fin),
        db.getSaldoApertura(mes),
        db.getSaldoApertura(mesSiguiente),
        db.getArqueosMes(inicio, fin),
      ]);

      // Aperturas del mes
      const apCajaChica = Number(apertura?.caja_chica || apertura?.efectivo || 0);
      const apCartuchera = Number(apertura?.cartuchera || 0);
      const apBanco = Number(apertura?.banco || apertura?.debito || 0);
      const apMP = Number(apertura?.mercadopago || 0);

      setAperturas({
        caja_chica: apCajaChica,
        cartuchera: apCartuchera,
        banco: apBanco,
        mp: apMP,
      });

      // Movimientos del mes por cuenta real
      // Efectivo → caja chica
      const movCajaChica = movs
        .filter(m => m.metodo === 'Efectivo')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      // Banco → Débito + Crédito
      const movBanco = movs
        .filter(m => m.metodo === 'Debito' || m.metodo === 'Credito')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      // MP
      const movMP = movs
        .filter(m => m.metodo === 'MercadoPago')
        .reduce((s, m) => s + Number(m.entrada) - Number(m.salida), 0);

      // Cartuchera → suma acumulada de a_caja_fuerte del mes
      const totalCartucheraEnviada = arqueos
        .reduce((s, a) => s + Number(a.a_caja_fuerte || 0), 0);

      setSaldos({
        caja_chica: apCajaChica + movCajaChica,
        cartuchera: apCartuchera + totalCartucheraEnviada,
        banco: apBanco + movBanco,
        mp: apMP + movMP,
      });

      setTotalEntradas(movs.reduce((s, m) => s + Number(m.entrada), 0));
      setTotalSalidas(movs.reduce((s, m) => s + Number(m.salida), 0));
      setYaExiste(!!existente);
      setLoading(false);
    };

    fetchData();
  }, [mes]);

  const resultado = totalEntradas - totalSalidas;
  const aperturaTotal = Object.values(aperturas).reduce((a, b) => a + b, 0);
  const saldoTotal = Object.values(saldos).reduce((a, b) => a + b, 0);

  const handleCerrar = async () => {
    setSaving(true);
    const fechaBase = parseISO(mes);
    const mesSiguiente = format(
      startOfMonth(new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1)),
      'yyyy-MM-dd'
    );

    await db.upsertSaldoApertura({
      periodo: mesSiguiente,
      // Campos legacy (compatibilidad)
      efectivo: saldos.caja_chica,
      debito: saldos.banco,
      mercadopago: saldos.mp,
      // Campos nuevos
      caja_chica: saldos.caja_chica,
      cartuchera: saldos.cartuchera,
      banco: saldos.banco,
    });

    setSaving(false);
    setSaved(true);
    setYaExiste(true);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Cargando...
    </div>
  );

  const fechaBase = parseISO(mes);
  const mesNombre = format(fechaBase, 'MMMM yyyy', { locale: es });
  const mesSigNombre = format(
    new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 1),
    'MMMM yyyy',
    { locale: es }
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <PiggyBank size={14} /> Cierre mensual
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Cierre de mes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Revisá los saldos finales y trasladarlos como apertura del mes siguiente.
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

        {/* ── RESUMEN DEL MES ────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-4 text-sm font-bold">Resumen de {mesNombre}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-medium text-[#40562a]">Apertura del mes</span>
              <span className="text-sm font-bold text-[#40562a]">{money(aperturaTotal)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#e5f1e2] px-4 py-3">
              <span className="text-xs font-medium text-[#3d6942]">Total entradas</span>
              <span className="text-sm font-bold text-[#3d6942]">+{money(totalEntradas)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#f9ebe6] px-4 py-3">
              <span className="text-xs font-medium text-[#ba7665]">Total salidas</span>
              <span className="text-sm font-bold text-[#ba7665]">-{money(totalSalidas)}</span>
            </div>
            <div className="border-t border-dashed border-[#e5eae1]" />
            <div className="flex items-center justify-between rounded-xl bg-[#f5f5ec] px-4 py-3">
              <span className="text-xs font-semibold text-[#40562a]">Resultado del mes</span>
              <span className={`text-lg font-bold ${resultado >= 0 ? 'text-[#3d6942]' : 'text-[#ba4a3a]'}`}>
                {resultado >= 0 ? '+' : ''}{money(resultado)}
              </span>
            </div>
          </div>
        </div>

        {/* ── SALDOS FINALES POR CUENTA ──────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          <p className="mb-1 text-sm font-bold">Saldos finales por cuenta</p>
          <p className="mb-4 text-[11px] text-[#99a398]">
            Se trasladarán como apertura de {mesSigNombre}
          </p>

          <div className="space-y-2">
            {/* Caja chica */}
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-[#6f7f6d]" />
                <div>
                  <p className="text-xs font-semibold text-[#3c4e3e]">Caja chica</p>
                  <p className="text-[10px] text-[#99a398]">
                    Apertura {money(aperturas.caja_chica)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{money(saldos.caja_chica)}</span>
            </div>

            {/* Cartuchera */}
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <div className="flex items-center gap-2">
                <LockKeyhole size={14} className="text-[#6f7f6d]" />                <div>
                  <p className="text-xs font-semibold text-[#3c4e3e]">Cartuchera</p>
                  <p className="text-[10px] text-[#99a398]">
                    Apertura {money(aperturas.cartuchera)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{money(saldos.cartuchera)}</span>
            </div>

            {/* Banco */}
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-[#6f7f6d]" />
                <div>
                  <p className="text-xs font-semibold text-[#3c4e3e]">Banco</p>
                  <p className="text-[10px] text-[#99a398]">
                    Apertura {money(aperturas.banco)} · Déb + Cred
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{money(saldos.banco)}</span>
            </div>

            {/* MP */}
            <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] px-4 py-3">
              <div className="flex items-center gap-2">
                <Cloud size={14} className="text-[#6f7f6d]" />
                <div>
                  <p className="text-xs font-semibold text-[#3c4e3e]">MercadoPago</p>
                  <p className="text-[10px] text-[#99a398]">
                    Apertura {money(aperturas.mp)}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{money(saldos.mp)}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-[#40562a] px-4 py-3 text-white">
              <span className="text-xs font-semibold">Saldo total final</span>
              <span className="text-lg font-bold">{money(saldoTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── ACCIÓN ─────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
          {yaExiste && !saved && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e8c96e] bg-[#fef9e7] px-4 py-3">
              <span className="text-xs font-bold text-[#926c00]">
                ⚠️ Ya existe una apertura cargada para {mesSigNombre}. Podés actualizarla.
              </span>
            </div>
          )}

          {saved ? (
            <div className="flex items-center gap-2 rounded-xl border border-[#c9ddc5] bg-[#eff8ed] px-4 py-3 text-sm font-semibold text-[#3d6942]">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#bdd8b8]">
                ✓
              </div>
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