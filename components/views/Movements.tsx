'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ClipboardList, Download,
  Filter, Pencil, Search, Trash2,
} from 'lucide-react';
import { Movimiento } from '@/lib/supabase';
import { db } from '@/lib/api';
import { money } from '@/lib/helpers';
import EditMovimientoModal from '@/components/shared/EditMovimientoModal';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const mesActual = format(startOfMonth(new Date()), 'yyyy-MM-dd');

const METODO_LABEL: Record<string, string> = {
  Efectivo: 'Efectivo',
  Debito: 'Débito',
  Credito: 'Crédito',
  MercadoPago: 'MP',
};

const METODOS_FILTRO = ['Todos', 'Efectivo', 'Debito', 'Credito', 'MercadoPago'] as const;
type FiltroMetodo = typeof METODOS_FILTRO[number];

function exportarCSV(movimientos: Movimiento[]) {
  const headers = ['Fecha', 'Concepto', 'Método', 'Categoría', 'Entrada', 'Salida'];
  const rows = movimientos.map(m => [
    m.fecha,
    `"${m.concepto.replace(/"/g, '""')}"`,
    m.metodo,
    m.categoria || '',
    Number(m.entrada) > 0 ? Number(m.entrada) : '',
    Number(m.salida) > 0 ? Number(m.salida) : '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movimientos_${format(new Date(), 'yyyy-MM')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Movements() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [search, setSearch] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<FiltroMetodo>('Todos');
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(mesActual);
  const [editing, setEditing] = useState<Movimiento | null>(null);
  const [showFiltros, setShowFiltros] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const inicio = format(startOfMonth(parseISO(mes)), 'yyyy-MM-dd');
    const fin = format(endOfMonth(parseISO(mes)), 'yyyy-MM-dd');
    const data = await db.getMovimientosMesDesc(inicio, fin);
    setMovimientos(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [mes]);

  const filtered = useMemo(() =>
    movimientos.filter(m => {
      const matchSearch = m.concepto.toLowerCase().includes(search.toLowerCase());
      const matchMetodo = filtroMetodo === 'Todos' || m.metodo === filtroMetodo;
      return matchSearch && matchMetodo;
    }),
    [movimientos, search, filtroMetodo]
  );

  const totalEntradas = filtered.reduce((s, m) => s + Number(m.entrada), 0);
  const totalSalidas = filtered.reduce((s, m) => s + Number(m.salida), 0);

  const handleDelete = async (id: string) => {
    await db.deleteMovimiento(id);
    setMovimientos(prev => prev.filter(m => m.id !== id));
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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#5d713c]">
            <ClipboardList size={14} /> Libro diario
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.05em] text-[#253729] sm:text-[38px]">
            Movimientos
          </h2>
          <p className="mt-2 text-sm text-[#849083]">Consultá y ordená toda la actividad.</p>
        </div>
        <div className="flex gap-3">
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
          <button
            onClick={() => exportarCSV(filtered)}
            className="flex items-center gap-2 rounded-xl border border-[#dfe7da] bg-white px-4 py-3 text-sm font-semibold text-[#526b53] transition hover:bg-[#f2f5ef]"
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#e5eae1] bg-white shadow-[0_8px_30px_rgba(65,82,55,0.04)]">
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa79a]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar concepto..."
                className="h-10 w-full rounded-xl border border-[#e3e9e0] bg-[#fbfcfa] pl-9 pr-3 text-xs outline-none focus:border-[#9ab498]"
              />
            </div>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                showFiltros || filtroMetodo !== 'Todos'
                  ? 'border-[#40562a] bg-[#edf0e2] text-[#40562a]'
                  : 'border-[#e2e8df] text-[#758475]'
              }`}
            >
              <Filter size={14} /> Filtros
              {filtroMetodo !== 'Todos' && (
                <span className="ml-1 rounded-full bg-[#40562a] px-1.5 py-0.5 text-[9px] text-white">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Filtro por método */}
          {showFiltros && (
            <div className="flex flex-wrap gap-2">
              {METODOS_FILTRO.map(m => (
                <button
                  key={m}
                  onClick={() => setFiltroMetodo(m)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    filtroMetodo === m
                      ? 'bg-[#40562a] text-white'
                      : 'bg-[#f0f4ed] text-[#748573] hover:bg-[#e5eae1]'
                  }`}
                >
                  {m === 'Todos' ? 'Todos' : METODO_LABEL[m]}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#849083]">
            Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-[#edf0eb] text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0aba0]">
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Concepto</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4 text-right">Entrada</th>
                  <th className="px-6 py-4 text-right">Salida</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr
                    key={m.id}
                    className="border-b border-[#f0f2ee] transition hover:bg-[#fbfcfa]"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-[#899689]">
                      {format(parseISO(m.fecha), 'd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          m.entrada > 0
                            ? 'bg-[#e5f1e2] text-[#619167]'
                            : 'bg-[#f9ebe6] text-[#bd806d]'
                        }`}>
                          {m.entrada > 0
                            ? <ArrowDownLeft size={14} />
                            : <ArrowUpRight size={14} />}
                        </span>
                        <span className="text-xs font-semibold text-[#3c4e3e]">
                          {m.concepto}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        m.metodo === 'Credito'
                          ? 'bg-[#f0e8f5] text-[#6b4d8a]'
                          : m.metodo === 'Debito'
                            ? 'bg-[#e5f1e2] text-[#3d6942]'
                            : m.metodo === 'MercadoPago'
                              ? 'bg-[#e0ecf8] text-[#2d5a8e]'
                              : 'bg-[#fef4e2] text-[#8a6a2a]'
                      }`}>
                        {METODO_LABEL[m.metodo] ?? m.metodo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#899689]">
                      {m.categoria || '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#56805b]">
                      {m.entrada > 0 ? money(Number(m.entrada)) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-[#ba7665]">
                      {m.salida > 0 ? money(Number(m.salida)) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(m)}
                          className="text-[#a6b0a5] hover:text-[#40562a]"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id!)}
                          className="text-[#a6b0a5] hover:text-[#ba4a3a]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fbfcfa]">
                  <td colSpan={4} className="px-6 py-4 text-xs font-bold text-[#708070]">
                    {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
                    {filtroMetodo !== 'Todos' && ` · ${METODO_LABEL[filtroMetodo]}`}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#56805b]">
                    {money(totalEntradas)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#ba7665]">
                    {money(totalSalidas)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>

            {filtered.length === 0 && (
              <div className="flex h-48 items-center justify-center text-sm text-[#849083]">
                Sin movimientos para mostrar
              </div>
            )}
          </div>
        )}
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