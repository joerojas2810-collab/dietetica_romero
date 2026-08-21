'use client';

import { useEffect, useState } from 'react';
import {
  CalendarRange, ShieldAlert, Sparkles, ArrowRightLeft,
  Coins, CreditCard, Smartphone, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import { format, startOfMonth, endOfMonth, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function CierreMes() {
  const [mes, setMes] = useState(mesActual);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Valores sugeridos calculados automáticamente
  const [sugCajaChica, setSugCajaChica] = useState(0);
  const [sugCartuchera, setSugCartuchera] = useState(0);
  const [sugBanco, setSugBanco] = useState(0);
  const [sugMP, setSugMP] = useState(0);

  // Inputs editables por el usuario
  const [cajaChica, setCajaChica] = useState('');
  const [cartuchera, setCartuchera] = useState('');
  const [banco, setBanco] = useState('');
  const [mercadopago, setMercadopago] = useState('');

  const n = (v: string) => parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;

  useEffect(() => {
    const calcularPropuestas = async () => {
      setLoading(true);
      setSuccess(false);
      try {
        const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
        const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');

        // 1. Obtener la apertura inicial cargada de este mes
        const ap = await db.getSaldoApertura(inicio);
        const apCajaChica = Number(ap?.caja_chica ?? ap?.efectivo ?? 0);
        const apCartuchera = Number(ap?.cartuchera ?? 0);
        const apBanco = Number(ap?.banco ?? ap?.debito ?? 0);
        const apMP = Number(ap?.mercadopago ?? 0);

        // 2. Obtener arqueos y movimientos para calcular arrastres reales
        const [movs, arqueos] = await Promise.all([
          db.getMovimientosMes(inicio, fin),
          db.getArqueosMes(inicio, fin),
        ]);

        // 🪙 Caja Chica Arrastre Real
        // Solo restamos salidas de Efectivo comunes (que no dicen "Cartuchera:")
        const entradasEf = movs.filter(m => m.metodo === 'Efectivo').reduce((s, m) => s + Number(m.entrada), 0);
        const salidasEfCaja = movs.filter(m => m.metodo === 'Efectivo' && !m.concepto.startsWith('Cartuchera:')).reduce((s, m) => s + Number(m.salida), 0);
        const calcCaja = apCajaChica + entradasEf - salidasEfCaja;

        // 🔒 Cartuchera Arrastre Real
        // Suma envíos diarios de arqueo y resta gastos de cartuchera
        const enviosCartuchera = arqueos.reduce((s, a) => s + Number(a.a_caja_fuerte ?? 0), 0);
        const salidasCartuchera = movs.filter(m => m.metodo === 'Efectivo' && m.concepto.startsWith('Cartuchera:')).reduce((s, m) => s + Number(m.salida), 0);
        const calcCartu = apCartuchera + enviosCartuchera - salidasCartuchera;

        // 💳 Banco Arrastre Real
        const entradasBanco = movs.filter(m => m.metodo === 'Debito' || m.metodo === 'Credito').reduce((s, m) => s + Number(m.entrada), 0);
        const salidasBanco = movs.filter(m => m.metodo === 'Debito' || m.metodo === 'Credito').reduce((s, m) => s + Number(m.salida), 0);
        const calcBan = apBanco + entradasBanco - salidasBanco;

        // 📱 MercadoPago Arrastre Real
        const entradasMP = movs.filter(m => m.metodo === 'MercadoPago').reduce((s, m) => s + Number(m.entrada), 0);
        const salidasMP = movs.filter(m => m.metodo === 'MercadoPago').reduce((s, m) => s + Number(m.salida), 0);
        const calcM = apMP + entradasMP - salidasMP;

        // Seteamos las propuestas en pantalla
        setSugCajaChica(calcCaja);
        setSugCartuchera(calcCartu);
        setSugBanco(calcBan);
        setSugMP(calcM);

        // Inicializamos los inputs editables con las propuestas sugeridas
        setCajaChica(String(calcCaja));
        setCartuchera(String(calcCartu));
        setBanco(String(calcBan));
        setMercadopago(String(calcM));

      } catch (err) {
        console.error('Error al calcular el asistente de cierre:', err);
      } finally {
        setLoading(false);
      }
    };

    calcularPropuestas();
  }, [mes]);

  const handleCierre = async () => {
    setSaving(true);
    try {
      // Calcular la fecha del 1 de mes del periodo entrante
      const proximoPeriodo = format(addMonths(parseISO(mes), 1), 'yyyy-MM-dd');

      await db.upsertSaldoApertura({
        periodo: proximoPeriodo,
        caja_chica: n(cajaChica),
        cartuchera: n(cartuchera),
        banco: n(banco),
        mercadopago: n(mercadopago),
        efectivo: n(cajaChica), // Legacy
        debito: n(banco), // Legacy
      });

      setSuccess(true);
    } catch (err) {
      console.error('Error guardando apertura del mes entrante:', err);
    } finally {
      setSaving(false);
    }
  };

  const mesSiguienteTexto = format(addMonths(parseISO(mes), 1), 'MMMM yyyy', { locale: es });

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-[#849083]">
      Calculando saldos recomendados de cierre...
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-xl">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <CalendarRange size={14} /> Asistente contable
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Cierre de Mes
          </h2>
          <p className="mt-2 text-sm text-[#849083]">
            Traspaso automático de caja y saldos para el mes entrante.
          </p>
        </div>
        <select
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none"
        >
          {Array.from({ length: 6 }, (_, i) => {
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

      <div className="space-y-5">
        
        {/* Info Box */}
        <div className="flex gap-3 rounded-2xl border border-[#c9ddc5] bg-[#eff8ed] p-4 text-xs text-[#3d6942]">
          <Sparkles size={18} className="shrink-0 text-[#6a986c]" />
          <div>
            <p className="font-bold">✨ Asistente de cálculo inteligente activo</p>
            <p className="mt-1 leading-5">
              Analizamos todas las entradas, salidas, arqueos y comisiones registradas en {format(parseISO(mes), 'MMMM', { locale: es })}. Los montos recomendados se colocaron de forma automática.
            </p>
          </div>
        </div>

        {/* Panel de saldos recomendados y editables */}
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6 shadow-[0_8px_30px_rgba(65,82,55,0.04)] space-y-4">
          <p className="text-sm font-bold text-[#253729]">Aperturas propuestas para {mesSiguienteTexto}</p>

          {/* Caja Chica */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-[#849083]">
              <span className="flex items-center gap-1"><Coins size={13} /> Caja Chica sugerida</span>
              <span className="text-[#40562a] font-bold">{money(sugCajaChica)}</span>
            </div>
            <input
              type="text"
              value={cajaChica}
              onChange={e => setCajaChica(e.target.value)}
              placeholder="0"
              className="w-full h-11 rounded-xl border border-[#e2e8df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#9ab498]"
            />
          </div>

          {/* Cartuchera */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-[#849083]">
              <span className="flex items-center gap-1"><ArrowRightLeft size={13} /> Cartuchera sugerida</span>
              <span className="text-[#40562a] font-bold">{money(sugCartuchera)}</span>
            </div>
            <input
              type="text"
              value={cartuchera}
              onChange={e => setCartuchera(e.target.value)}
              placeholder="0"
              className="w-full h-11 rounded-xl border border-[#e2e8df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#9ab498]"
            />
          </div>

          {/* Banco */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-[#849083]">
              <span className="flex items-center gap-1"><CreditCard size={13} /> Banco sugerido</span>
              <span className="text-[#40562a] font-bold">{money(sugBanco)}</span>
            </div>
            <input
              type="text"
              value={banco}
              onChange={e => setBanco(e.target.value)}
              placeholder="0"
              className="w-full h-11 rounded-xl border border-[#e2e8df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#9ab498]"
            />
          </div>

          {/* Mercado Pago */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-[#849083]">
              <span className="flex items-center gap-1"><Smartphone size={13} /> MercadoPago sugerido</span>
              <span className="text-[#40562a] font-bold">{money(sugMP)}</span>
            </div>
            <input
              type="text"
              value={mercadopago}
              onChange={e => setMercadopago(e.target.value)}
              placeholder="0"
              className="w-full h-11 rounded-xl border border-[#e2e8df] bg-white px-3 text-sm font-semibold outline-none focus:border-[#9ab498]"
            />
          </div>

          <button
            onClick={handleCierre}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#40562a] py-3.5 text-sm font-bold text-white transition hover:bg-[#30431f] disabled:opacity-60"
          >
            {saving ? 'Procesando cierre...' : `Aprobar e Iniciar ${mesSiguienteTexto}`}
            <ShieldCheck size={16} />
          </button>
        </div>

        {/* Mensaje de Éxito */}
        {success && (
          <div className="rounded-2xl border border-[#c9ddc5] bg-[#eff8ed] p-4 flex items-center gap-2 text-xs font-semibold text-[#3d6942] animate-in fade-in duration-300">
            <CheckCircle2 size={16} className="text-[#6a986c]" />
            Cierre completo. Los saldos de apertura para {mesSiguienteTexto} ya están listos en el Dashboard.
          </div>
        )}

        <div className="flex gap-3 rounded-2xl border border-[#e3e9de] bg-white p-4 text-xs text-[#849083]">
          <ShieldAlert size={19} className="shrink-0 text-[#bda76a]" />
          <p className="leading-5">
            Recordá que podés editar los valores propuestos a mano si es que hubo algún movimiento externo no contemplado en el sistema antes de confirmar.
          </p>
        </div>

      </div>
    </div>
  );
}