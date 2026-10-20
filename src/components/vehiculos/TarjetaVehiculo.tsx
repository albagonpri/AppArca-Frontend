import React from "react";
import type { Vehiculo } from "../../models/vehiculo.model";
import { obtenerTextoPropulsion } from "../../models/vehiculo.model";
import { EtiquetaAmbientalBadge } from "./EtiquetaAmbientalBadge";

interface Props {
  vehiculo: Vehiculo;
  onEditar: (vehiculo: Vehiculo) => void;
  onEliminar: (vehiculo: Vehiculo) => void;
}

export const TarjetaVehiculo: React.FC<Props> = ({ vehiculo, onEditar, onEliminar }) => {
  const tieneDimensiones =
    vehiculo.longitud != null || vehiculo.anchura != null || vehiculo.altura != null;

  const marcaOModelo = [vehiculo.marca, vehiculo.modelo]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <article className="vehiculo-card">
      <div className="vehiculo-card-header">
        <div className="vehiculo-info-principal">
          {marcaOModelo ? (
            <>
              <h3 className="vehiculo-titulo">
                {marcaOModelo}
                {vehiculo.anyo && <span className="vehiculo-anyo-tag"> ({vehiculo.anyo})</span>}
              </h3>
              <span className="vehiculo-matricula" title="Matrícula">
                {vehiculo.matricula}
              </span>
            </>
          ) : (
            <h3 className="vehiculo-titulo">
              <span className="vehiculo-matricula" title="Matrícula">
                {vehiculo.matricula}
              </span>
            </h3>
          )}
        </div>
        <div className="vehiculo-etiqueta-seccion">
          <EtiquetaAmbientalBadge etiqueta={vehiculo.etiquetaAmbiental} />
        </div>
      </div>

      <div className="vehiculo-card-body">
        {vehiculo.version && (
          <div className="vehiculo-version-info" title="Versión o motorización">
            <span className="version-label">Versión:</span> {vehiculo.version}
          </div>
        )}

        <div className="vehiculo-badges-row">
          {vehiculo.tipoPropulsion && (
            <span className="badge-tecnico badge-propulsion">
              {obtenerTextoPropulsion(vehiculo.tipoPropulsion)}
            </span>
          )}
          {vehiculo.esEnchufable && (
            <span className="badge-tecnico badge-enchufable">
              ⚡ Enchufable
            </span>
          )}
        </div>

        {tieneDimensiones && (
          <div className="vehiculo-dimensiones-bloque">
            <span className="vehiculo-subtitulo-campo">Dimensiones:</span>
            <div className="vehiculo-dimensiones-grid">
              {vehiculo.longitud != null && (
                <div className="vehiculo-dimension-item">
                  <span className="dimension-label">Longitud</span>
                  <span className="dimension-valor">{vehiculo.longitud} m</span>
                </div>
              )}
              {vehiculo.anchura != null && (
                <div className="vehiculo-dimension-item">
                  <span className="dimension-label">Anchura</span>
                  <span className="dimension-valor">{vehiculo.anchura} m</span>
                </div>
              )}
              {vehiculo.altura != null && (
                <div className="vehiculo-dimension-item">
                  <span className="dimension-label">Altura</span>
                  <span className="dimension-valor">{vehiculo.altura} m</span>
                </div>
              )}
            </div>
          </div>
        )}

        {vehiculo.suspensionBaja && (
          <div className="vehiculo-suspension-aviso">
            <span className="suspension-icono" aria-hidden="true">⚠️</span>
            <span>Suspensión baja</span>
          </div>
        )}
      </div>

      <div className="vehiculo-card-acciones">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onEditar(vehiculo)}
        >
          Editar
        </button>
        <button
          type="button"
          className="btn btn-danger-outline btn-sm"
          onClick={() => onEliminar(vehiculo)}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
};
