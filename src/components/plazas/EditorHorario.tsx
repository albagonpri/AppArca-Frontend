import { useRef, useState } from "react";
import { BandaHoraria, Mes, Semana } from "./CalendarioHorario";
import type { Franja, Horario, TipoDisponibilidad } from "../../models/horario";

import { dias, horarioCompleto, horaTexto } from "../../models/horario";
const minutos = (valor: string) =>
  valor ? Number(valor.slice(0, 2)) * 60 + Number(valor.slice(3)) : -1;

function Franjas({
  grupo,
  cambiar,
  nombre,
}: {
  grupo: Franja[];
  cambiar: (g: Franja[]) => void;
  nombre: string;
}) {
  function modificar(i: number, parte: Partial<Franja>) {
    cambiar(grupo.map((f, j) => (j === i ? { ...f, ...parte } : f)));
  }
  return (
    <div>
      {grupo.map((f, i) => (
        <div className="horario-franja" key={i}>
          <label>
            Desde{" "}
            <input
              type="time"
              aria-label={nombre + " inicio " + (i + 1)}
              value={horaTexto(f.inicio)}
              onChange={(e) =>
                modificar(i, { inicio: minutos(e.target.value) })
              }
            />
          </label>
          <label>
            Hasta{" "}
            <input
              type="time"
              aria-label={nombre + " fin " + (i + 1)}
              value={horaTexto(f.fin === 1440 ? 0 : f.fin)}
              onChange={(e) => {
                const m = minutos(e.target.value);
                modificar(i, { fin: m === 0 ? 1440 : m });
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => cambiar(grupo.filter((_, j) => j !== i))}
          >
            Eliminar franja
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => cambiar([...grupo, { inicio: -1, fin: -1 }])}
      >
        Añadir franja
      </button>
    </div>
  );
}

export function EditorHorario({
  tipo,
  seleccionar,
  horario,
  cambiar,
  disabled,
}: {
  tipo: TipoDisponibilidad | null;
  seleccionar: (tipo: TipoDisponibilidad) => void;
  horario: Horario;
  cambiar: (h: Horario) => void;
  disabled: boolean;
}) {
  const puntual = tipo === "PUNTUAL";
  const [diaActivo, setDiaActivo] = useState(0);
  const [indiceFecha, setIndiceFecha] = useState(0);
  const edicionDia = useRef<HTMLDivElement>(null);
  const fechaActiva = Math.min(
    indiceFecha,
    Math.max(0, horario.excepciones.length - 1),
  );
  function abrirDia(i: number, franja?: number) {
    setDiaActivo(i);
    if (franja !== undefined)
      requestAnimationFrame(() => {
        edicionDia.current
          ?.querySelectorAll<HTMLInputElement>("input[type=time]")
          [franja * 2]?.focus();
      });
  }
  function abrirFecha(fecha: string) {
    const existente = horario.excepciones.findIndex((e) => e.fecha === fecha);
    if (existente >= 0) {
      setIndiceFecha(existente);
      return;
    }
    const borrador = horario.excepciones.findIndex((e) => !e.fecha);
    if (borrador >= 0) {
      excepcion(borrador, { fecha });
      setIndiceFecha(borrador);
      return;
    }
    setIndiceFecha(horario.excepciones.length);
    cambiar({
      ...horario,
      excepciones: [
        ...horario.excepciones,
        {
          fecha,
          modo: "ofrecer",
          franjas: [{ inicio: 540, fin: 840 }],
        },
      ],
    });
  }
  function elegir(nuevo: TipoDisponibilidad) {
    if (tipo === nuevo) return;
    if (
      tipo &&
      !window.confirm(
        "Al cambiar de modalidad se descartará el horario que has configurado. ¿Quieres continuar?",
      )
    )
      return;
    setDiaActivo(0);
    setIndiceFecha(0);
    seleccionar(nuevo);
    cambiar(
      nuevo === "HABITUAL"
        ? horarioCompleto()
        : {
            semana: dias.map(() => []),
            excepciones: [
              {
                fecha: "",
                modo: "ofrecer",
                franjas: [{ inicio: 540, fin: 840 }],
              },
            ],
          },
    );
  }
  function dia(i: number, grupo: Franja[]) {
    cambiar({
      ...horario,
      semana: horario.semana.map((g, j) => (j === i ? grupo : g)),
    });
  }
  function excepcion(
    i: number,
    parte: Partial<Horario["excepciones"][number]>,
  ) {
    cambiar({
      ...horario,
      excepciones: horario.excepciones.map((e, j) =>
        j === i ? { ...e, ...parte } : e,
      ),
    });
  }
  return (
    <section className="form-seccion horario-editor">
      <h3 className="form-seccion-titulo">Disponibilidad</h3>
      <fieldset disabled={disabled} className="modalidades">
        <legend>Tipo de disponibilidad</legend>
        <div className="modalidades-opciones">
          {(["HABITUAL", "PUNTUAL"] as const).map((opcion) => (
            <label key={opcion} className="modalidad">
              <input
                type="radio"
                name="tipoDisponibilidad"
                checked={tipo === opcion}
                onChange={() => elegir(opcion)}
              />
              <span>
                <strong>
                  Disponibilidad{" "}
                  {opcion === "HABITUAL" ? "habitual" : "puntual"}
                </strong>
                <small>
                  {opcion === "HABITUAL"
                    ? "Establece los días y horarios en los que tu plaza estará disponible habitualmente"
                    : "Selecciona las fechas y horarios concretos en los que quieres ofrecer tu plaza"}
                </small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {tipo === "HABITUAL" && (
        <fieldset disabled={disabled}>
          <legend>Horario semanal · hora peninsular</legend>
          <p className="form-hint">
            Las franjas se repiten cada semana. Una hora de fin de 00:00 indica
            el final del día. Pulsa un hueco para añadir una franja o un bloque
            para editarla.
          </p>
          <Semana
            semana={horario.semana}
            activo={diaActivo}
            elegir={abrirDia}
            insertar={(i, f) => {
              dia(i, [...horario.semana[i], f]);
              abrirDia(i, horario.semana[i].length);
            }}
          />
          {dias.map(
            (nombre, i) =>
              i === diaActivo && (
                <div ref={edicionDia} key={nombre} className="horario-dia">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!horario.semana[i].length}
                      onChange={(e) =>
                        dia(
                          i,
                          e.target.checked ? [{ inicio: 480, fin: 1200 }] : [],
                        )
                      }
                    />{" "}
                    {nombre}
                  </label>
                  {!!horario.semana[i].length && (
                    <Franjas
                      nombre={nombre}
                      grupo={horario.semana[i]}
                      cambiar={(g) => dia(i, g)}
                    />
                  )}
                </div>
              ),
          )}
        </fieldset>
      )}
      {tipo && (
        <fieldset disabled={disabled}>
          <legend>
            {puntual
              ? "Fechas disponibles · hora peninsular"
              : "Excepciones por fecha"}
          </legend>
          {puntual && (
            <p className="form-hint">
              Cada fecha se ofrece una sola vez. Una hora de fin de 00:00 indica
              el final del día.
            </p>
          )}
          {puntual && (
            <Mes
              key={
                horario.excepciones[fechaActiva]?.fecha.slice(0, 7) || "actual"
              }
              fechas={horario.excepciones}
              seleccionada={horario.excepciones[fechaActiva]?.fecha || ""}
              elegir={abrirFecha}
            />
          )}
          {horario.excepciones.map(
            (e, i) =>
              (!puntual || i === fechaActiva) && (
                <div key={i} className="horario-dia">
                  <label>
                    Fecha{" "}
                    <input
                      type="date"
                      value={e.fecha}
                      onChange={(ev) =>
                        excepcion(i, { fecha: ev.target.value })
                      }
                    />
                  </label>
                  {!puntual && (
                    <select
                      aria-label="Tipo de excepción"
                      value={e.modo}
                      onChange={(ev) =>
                        excepcion(i, { modo: ev.target.value as typeof e.modo })
                      }
                    >
                      <option value="bloquear">Bloquear disponibilidad</option>
                      <option value="ofrecer">Sustituir horario del día</option>
                    </select>
                  )}
                  {!puntual && !e.franjas.length && (
                    <p>Día completo sin disponibilidad</p>
                  )}
                  <p className="form-hint">
                    {e.modo === "bloquear"
                      ? "Horario bloqueado"
                      : "Horario disponible"}{" "}
                    · 00:00–24:00
                  </p>
                  <BandaHoraria
                    bloqueada={e.modo === "bloquear"}
                    franjas={
                      e.modo === "bloquear" && !e.franjas.length
                        ? [{ inicio: 0, fin: 1440 }]
                        : e.franjas
                    }
                  />
                  <Franjas
                    nombre={e.fecha}
                    grupo={e.franjas}
                    cambiar={(franjas) => excepcion(i, { franjas })}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      cambiar({
                        ...horario,
                        excepciones: horario.excepciones.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  >
                    {puntual ? "Eliminar fecha" : "Eliminar excepción"}
                  </button>
                </div>
              ),
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (puntual) {
                abrirFecha("");
                return;
              }
              cambiar({
                ...horario,
                excepciones: [
                  ...horario.excepciones,
                  {
                    fecha: "",
                    modo: "bloquear",
                    franjas: [],
                  },
                ],
              });
            }}
          >
            {puntual ? "Añadir otra fecha" : "Añadir excepción"}
          </button>
        </fieldset>
      )}
    </section>
  );
}
