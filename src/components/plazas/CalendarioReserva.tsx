import { useEffect, useState } from 'react';
import { consultarFranjas } from '../../services/reservas.service';
import { instantesMadrid } from '../../models/horaMadrid';

const reloj = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const pared = (t: number) => reloj.format(t).replace(' ', 'T');
type Franja = { inicio: number; fin: number; estado?: string };

export function CalendarioReserva({ plazaId, disabled, propietario, alCambiarDia, alElegir }: {
  plazaId: number; disabled?: boolean; propietario?: boolean; alCambiarDia?: () => void;
  alElegir?: (inicio: string, fin: string, i: number, f: number) => void;
}) {
  const hoy = pared(Date.now()).slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [resultado, setResultado] = useState<{fecha: string; franjas: Franja[]; error?: string}>();
  useEffect(() => {
    if (!fecha) return;
    const control = new AbortController();
    let ultima = 0;
    const cargar = () => {
      const actual = ++ultima;
      void consultarFranjas(plazaId, fecha, control.signal)
      .then(franjas => { if (actual === ultima && !control.signal.aborted) setResultado({ fecha, franjas }); })
      .catch((e: Error) => { if (actual === ultima && !control.signal.aborted) setResultado({ fecha, franjas: [], error: e.message }); });
    };
    cargar();
    const intervalo = window.setInterval(cargar, 15000);
    window.addEventListener('focus', cargar);
    return () => { control.abort(); window.clearInterval(intervalo); window.removeEventListener('focus', cargar); };
  }, [plazaId, fecha]);
  function elegir({ inicio, fin }: Franja) {
    const a = pared(inicio), b = pared(fin);
    alElegir?.(a, b, instantesMadrid(a).findIndex(d => +d === inicio), instantesMadrid(b).findIndex(d => +d === fin));
  }
  return <fieldset disabled={disabled} className="form-group">
    <legend>{propietario ? 'Franjas reservadas' : 'Franjas disponibles'}</legend>
    <label htmlFor="dia-reserva">Elige un día</label>
    <input id="dia-reserva" type="date" min={propietario ? undefined : hoy} value={fecha} onChange={e => { setFecha(e.target.value); alCambiarDia?.(); }} />
    {fecha && (resultado?.fecha !== fecha ? <p role="status">Consultando disponibilidad…</p> :
      resultado.error ? <p role="alert">{resultado.error}</p> : resultado.franjas.length === 0 ? <p>{propietario ? 'Sin reservas este día.' : 'Sin franjas disponibles este día.'}</p> :
      propietario ? <ul>{resultado.franjas.map(f => <li key={f.inicio}>
        {pared(f.inicio).slice(11)} – {pared(f.fin).startsWith(fecha) ? pared(f.fin).slice(11) : '24:00'}
        {' · '}<strong>Reservada</strong>{f.estado === 'PENDIENTE' ? ' (pendiente de respuesta)' : ' (confirmada)'}
      </li>)}</ul> :
      <><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>{resultado.franjas.map(f =>
        <button type="button" key={f.inicio} className="btn btn-secondary btn-sm" onClick={() => elegir(f)}>
          {pared(f.inicio).slice(11)} – {pared(f.fin).startsWith(fecha) ? pared(f.fin).slice(11) : '24:00'}
        </button>)}</div><small>Selecciona una franja y ajusta la hora de entrada y salida si lo necesitas.</small></>)}
  </fieldset>;
}
