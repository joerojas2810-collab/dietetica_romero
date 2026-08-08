export const money = (v: number) =>
  `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;

export const compactMoney = (v: number) =>
  v >= 1000000
    ? `$ ${(v / 1000000).toFixed(1).replace('.', ',')}M`
    : money(v);

export const semaforo = (dif: number | null) => {
  if (dif === null) return 'sin-dato';
  if (dif === 0) return 'ok';
  if (Math.abs(dif) <= 1000) return 'warn';
  return 'error';
};