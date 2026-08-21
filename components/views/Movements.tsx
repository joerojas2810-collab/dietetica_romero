'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Search, SlidersHorizontal, ArrowDownLeft, ArrowUpRight,
  Trash2, Pencil, Download, AlertTriangle, X
} from 'lucide-react';
import { Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

export default function Movements() {
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesActual);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [search, setSearch] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState<string>('todos');
  const [editing, setEditing] = useState<Movimiento | null>(null);

  // Estados para modal de borrado seguro
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingConcept, setDeletingConcept] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
    const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');
    const data = await db.getMovimientosMesDesc(inicio, fin);
    setMovimientos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [mes]);

  // Filtrado
  const filtered = useMemo(() => {
    return movimientos.filter(m => {
      const matchSearch = m.concepto.toLowerCase().includes(search.toLowerCase()) ||
                          (m.categoria && m.categoria.toLowerCase().includes(search.toLowerCase()));
      const matchMetodo = metodoFiltro === 'todos' || m.metodo === metodoFiltro;
      return matchSearch && matchMetodo;
    });
  }, [movimientos, search, metodoFiltro]);

  // Borrado Seguro
  const triggerDeleteConfirm = (id: string, concepto: string) => {
    setDeletingId(id);
    setDeletingConcept(concepto);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await db.deleteMovimiento(deletingId);
    setDeletingId(null);
    setDeletingConcept('');
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

  // Exportar Filtrado a CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    let csv = '\uFEFF'; // UTF-8 BOM para Excel
    csv += 'Fecha;Concepto;Método;Categoría;Entrada;Salida\n';
    filtered.forEach(m => {
      csv += `${m.fecha};"${m.concepto}";${m.metodo};${m.categoria || '—'};${m.entrada};${m.salida}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_${mes.substring(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-[#849083]">Cargando movimientos...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">Movimientos</h2>
          <p className="mt-2 text-sm text-[#849083]">Lista de transacciones registradas.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] hover:bg-[#f5f5ec] transition"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <input
            type="date"
            value={mes}
            onChange={e => setMes(e.target.value)}
            className="rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] outline-none"
          />
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative col-span-2">
          <Search size={15} className="absolute left-4 top-3.5 text-[#99a398]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por concepto o categoría..."
            className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#e2e8df] bg-white text-sm outline-none focus:border-[#9ab498]"
          />
        </div>
        <select
          value={metodoFiltro}
          onChange={e => setMetodoFiltro(e.target.value)}
          className="h-11 rounded-xl border border-[#e2e8df] bg-white px-4 text-xs font-semibold outline-none"
        >
          <option value="todos">Todos los Métodos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="MercadoPago">MercadoPago</option>
          <option value="Debito">Débito (Banco)</option>
          <option value="Credito">Crédito (Banco)</option>
        </select>
      </div>

      {/* Listado de Movimientos */}
      <div className="rounded-3xl border border-[#e5eae1] bg-white overflow-hidden shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#849083]">Sin movimientos para mostrar.</div>
        ) : (
          <div className="divide-y divide-[#f0f3ee]">
            {filtered.map(m => {
              const esEntrada = Number(m.entrada) > 0;
              const esCartuchera = m.concepto.startsWith('Cartuchera:');
              return (
                <div key={m.id} className="flex items-center justify-between p-4 hover:bg-[#fcfdfb] transition">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      esEntrada ? 'bg-[#e5f1e2] text-[#3d6942]' : 'bg-[#fdf0ee] text-[#ba4a3a]'
                    }`}>
                      {esEntrada ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#253729]">
                        {esCartuchera ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[10px] bg-[#e3eae0] text-[#40562a] px-1.5 py-0.5 rounded-md font-bold">Cartuchera 🔒</span>
                            {m.concepto.replace('Cartuchera: ', '')}
                          </span>
                        ) : m.concepto}
                      </p>
                      <p className="text-[10px] text-[#99a398] mt-0.5">
                        {format(parseISO(m.fecha), "d 'de' MMMM", { locale: es })} · {m.metodo} · {m.categoria || 'Sin categoría'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${esEntrada ? 'text-[#3d6942]' : 'text-[#ba4a3a]'}`}>
                      {esEntrada ? '+' : '-'}{money(esEntrada ? Number(m.entrada) : Number(m.salida))}
                    </span>
                    <button onClick={() => setEditing(m)} className="text-[#b5beb4] hover:text-[#40562a] transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => triggerDeleteConfirm(m.id!, m.concepto)} className="text-[#b5beb4] hover:text-[#ba4a3a] transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditMovimientoModal movimiento={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />
      )}

      {/* ── Modal de Confirmación de Borrado Seguro ─────────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex gap-3 text-[#ba4a3a]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fdf0ee]">
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#253729] truncate">¿Borrar movimiento?</h3>
                <p className="text-xs text-[#849083] truncate mt-0.5">{deletingConcept}</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#526b53]">
              Esta acción no se puede deshacer. Se descontará permanentemente del historial del mes y afectará el balance de tu Dashboard de forma inmediata.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-[#dfe7da] bg-white py-2.5 text-xs font-bold text-[#526b53] transition hover:bg-[#f5f5ec]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-[#ba4a3a] py-2.5 text-xs font-bold text-white transition hover:bg-[#96372a]"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}