// lib/preload.ts
// Precarga los chunks de cada vista al hacer hover en el nav

const preloadMap: Record<string, () => Promise<unknown>> = {
  dashboard:    () => import('@/components/views/Dashboard'),
  day:          () => import('@/components/views/DayForm'),
  movements:    () => import('@/components/views/Movements'),
  cartuchera:   () => import('@/components/views/Cartuchera'),
  controlmp:    () => import('@/components/views/ControlMP'),
  controlbanco: () => import('@/components/views/ControlBanco'),
  pagos:        () => import('@/components/views/PagosIndividuales'),
  config:       () => import('@/components/views/Configuracion'),
  cierre:       () => import('@/components/views/CierreMes'),
  reportes:     () => import('@/components/views/Reportes'),
};

const preloaded = new Set<string>();

export function preloadView(view: string) {
  if (preloaded.has(view)) return;
  preloaded.add(view);
  preloadMap[view]?.();
}