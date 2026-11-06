// Un datetime-local representa una hora de pared. En octubre puede corresponder a dos instantes.
const reloj = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
export function instantesMadrid(valor: string): Date[] {
  if (!valor) return [];
  const pared = Date.parse(valor + "Z");
  if (!Number.isFinite(pared)) return [];
  return [120, 60]
    .map((offset) => new Date(pared - offset * 60000))
    .filter((d) => reloj.format(d).replace(" ", "T") === valor);
}
