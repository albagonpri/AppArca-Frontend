import React from 'react';
import type { Plaza } from '../../models/plaza.model';
import { BotonFavorito } from './BotonFavorito';
import { obtenerUrlFoto } from '../../services/plazas.service';

interface Props {
  plaza: Plaza;
  onVer: (id: number) => void;
  onEditar?: (plaza: Plaza) => void;
  onEliminar?: (plaza: Plaza) => void;
  onReservar?: (plaza: Plaza) => void;
}

export const TarjetaPlaza: React.FC<Props> = ({
  plaza,
  onVer,
  onEditar,
  onEliminar,
  onReservar,
}) => {
  const precioFormateado = plaza.precioHora
    ? plaza.precioHora.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0,00';

  const largoFormateado = plaza.largo
    ? String(plaza.largo).replace('.', ',')
    : '0';

  const anchoFormateado = plaza.ancho
    ? String(plaza.ancho).replace('.', ',')
    : '0';

  const tieneFotos = Boolean(plaza.fotos && plaza.fotos.length > 0);
  const primeraFotoUrl = tieneFotos && plaza.fotos ? obtenerUrlFoto(plaza.fotos[0].url) : null;

  return (
    <article className="plaza-card">
      {/* Cabecera visual de foto de la plaza si existe */}
      {tieneFotos && primeraFotoUrl ? (
        <div className="plaza-card-portada" onClick={() => onVer(plaza.id)} style={{ cursor: 'pointer' }}>
          <img
            src={primeraFotoUrl}
            alt={plaza.titulo}
            className="plaza-card-imagen-portada"
            loading="lazy"
          />
          <div className="plaza-card-fav-wrapper">
            <BotonFavorito plazaId={plaza.id} tamano="sm" />
          </div>
          {plaza.fotos && plaza.fotos.length > 1 && (
            <span className="plaza-card-fotos-conteo">
              📷 {plaza.fotos.length}
            </span>
          )}
        </div>
      ) : null}

      <div className="plaza-card-header">
        <div className="plaza-info-principal">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <h3 className="plaza-card-titulo" onClick={() => onVer(plaza.id)} style={{ cursor: 'pointer' }}>
              {plaza.titulo}
            </h3>
            {!tieneFotos && (
              <div style={{ flexShrink: 0 }}>
                <BotonFavorito plazaId={plaza.id} tamano="sm" />
              </div>
            )}
          </div>
          <p className="plaza-card-direccion">{plaza.direccion}</p>
        </div>
        <span
          className={`badge ${plaza.disponible ? 'badge-success' : 'badge-danger'}`}
        >
          {plaza.disponible ? 'Disponible' : 'No disponible'}
        </span>
      </div>

      <div className="plaza-card-body">
        <div className="plaza-precio-tag">
          {precioFormateado} €/hora
        </div>

        <div className="plaza-dimensiones-bloque">
          <span className="plaza-dimension-texto">
            Dimensiones: {largoFormateado} × {anchoFormateado} m
          </span>
        </div>

        <div className="plaza-caracteristicas-lista">
          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">¿Está cubierta?:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.estaCubierta ? 'Sí' : 'No'}
            </span>
          </div>

          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">Cargador eléctrico:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.tieneCargadorElectrico ? 'Sí' : 'No'}
            </span>
          </div>

          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">Cámaras de seguridad:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.tieneCamaras ? 'Sí' : 'No'}
            </span>
          </div>

          <div className="plaza-caracteristica-fila">
            <span className="plaza-caracteristica-etiqueta">Entrada difícil:</span>
            <span className="plaza-caracteristica-valor">
              {plaza.entradaDificil ? 'Sí' : 'No'}
            </span>
          </div>

          {plaza.entradaDificil && (
            <div
              className="plaza-dificultad-alerta"
              title="Esta plaza presenta dificultades de acceso. Consulta el detalle para ver las características."
            >
              ⚠️ {plaza.dificultadesEntrada && plaza.dificultadesEntrada.length > 1
                ? `${plaza.dificultadesEntrada.length} dificultades de acceso`
                : "Acceso con dificultad"}
            </div>
          )}
        </div>
      </div>

      <div className="plaza-card-acciones">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onVer(plaza.id)}
        >
          Ver
        </button>
        {onReservar && plaza.disponible && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onReservar(plaza)}
          >
            Reservar
          </button>
        )}
        {onEditar && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onEditar(plaza)}
          >
            Editar
          </button>
        )}
        {onEliminar && (
          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => onEliminar(plaza)}
          >
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
};
