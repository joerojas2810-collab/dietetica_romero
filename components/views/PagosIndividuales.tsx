'use client';

import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { Movimiento, MetodoPago, CategoriaGasto } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import AmountField from '@/components/shared/AmountField';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


export default function PagosIndividuales() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo');
  const [categoria, setCategoria] = useState<CategoriaGasto>('OPERATIVO');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('salida');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pagosDelDia, setPagosDelDia] = useState<Movimiento[]>([]);
  const [editing, setEditing] = useState<Movimiento | null>(null);

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
            <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Pago proveedor" className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] px-3 text-sm outline-none focus:border-[#9ab498]" />
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
                    <div className="flex items-center gap-2">
  <button onClick={() => setEditing(m)} className="text-[#b5beb4] hover:text-[#40562a]">
    <Pencil size={14} />
  </button>
  <button onClick={() => handleDelete(m.id!)} className="text-[#b5beb4] hover:text-[#ba4a3a]">
    <Trash2 size={14} />
  </button>
</div>                  </div>
      {editing && (
        <EditMovimientoModal
          movimiento={editing}
          onSave={handleUpdate}
          onClose={() => setEditing(null)}
        />
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