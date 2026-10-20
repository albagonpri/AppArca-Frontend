import React, { useState } from 'react';
import type {
  Plaza,
  CrearPlazaDto,
  ActualizarPlazaDto,
  DificultadEntrada,
} from '../../models/plaza.model';
import {
  DIFICULTADES_ENTRADA_OPCIONES,
  DIFICULTADES_ENTRADA_ETIQUETAS,
} from '../../models/plaza.model';
import { crearPlaza, actualizarPlaza } from '../../services/plazas.service';
import {
  obtenerUsuarioSesion,
  obtenerPerfil,
  guardarUsuarioSesion,
} from '../../services/auth.service';

interface Props {
  plazaAEditar?: Plaza | null;
  onExito?: (mensaje: string) => void;
  onPlazaCreada?: () => void;
  onCancelar?: () => void;
}

export const FormularioPlaza: React.FC<Props> = ({
  plazaAEditar,
  onExito,
  onPlazaCreada,
  onCancelar,
}) => {
  const esEdicion = Boolean(plazaAEditar);

  // Datos básicos
  const [titulo, setTitulo] = useState<string>(plazaAEditar?.titulo || '');
  const [descripcion, setDescripcion] = useState<string>(
    plazaAEditar?.descripcion || '',
  );
  const [precioHora, setPrecioHora] = useState<string>(
    plazaAEditar?.precioHora != null ? String(plazaAEditar.precioHora) : '',
  );

  // Campos estructurados de dirección (nunca coordenadas)
  const [calle, setCalle] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [codigoPostal, setCodigoPostal] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [provincia, setProvincia] = useState<string>('');
  const [modificarDireccion, setModificarDireccion] = useState<boolean>(false);

  // Dimensiones
  const [largo, setLargo] = useState<string>(
    plazaAEditar?.largo != null ? String(plazaAEditar.largo) : '',
  );
  const [ancho, setAncho] = useState<string>(
    plazaAEditar?.ancho != null ? String(plazaAEditar.ancho) : '',
  );

  // Características
  const [entradaDificil, setEntradaDificil] = useState<boolean>(
    Boolean(plazaAEditar?.entradaDificil),
  );
  const [dificultadesEntrada, setDificultadesEntrada] = useState<DificultadEntrada[]>(
    plazaAEditar?.dificultadesEntrada ? [...plazaAEditar.dificultadesEntrada] : [],
  );
  const [descripcionEntrada, setDescripcionEntrada] = useState<string>(
    plazaAEditar?.descripcionEntrada || '',
  );

  const handleEntradaDificilChange = (checked: boolean) => {
    setEntradaDificil(checked);
    if (!checked) {
      setDificultadesEntrada([]);
      setDescripcionEntrada('');
    }
  };

  const handleSeleccionarDificultad = (valor: string) => {
    if (!valor) return;
    const dificultad = valor as DificultadEntrada;
    if (!dificultadesEntrada.includes(dificultad)) {
      setDificultadesEntrada((prev) => [...prev, dificultad]);
    }
  };

  const handleEliminarDificultad = (dificultadAEliminar: DificultadEntrada) => {
    setDificultadesEntrada((prev) =>
      prev.filter((item) => item !== dificultadAEliminar),
    );
    if (dificultadAEliminar === 'OTRA') {
      setDescripcionEntrada('');
    }
  };
  const [tieneCamaras, setTieneCamaras] = useState<boolean>(
    Boolean(plazaAEditar?.tieneCamaras),
  );
  const [disponible, setDisponible] = useState<boolean>(
    plazaAEditar?.disponible !== undefined ? plazaAEditar.disponible : true,
  );

  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const validarNumeroPositivoObligatorio = (
    valorStr: string,
    nombreCampo: string,
  ): { valido: boolean; numero?: number; errorMsg?: string } => {
    const valorLimpio = valorStr.trim().replace(',', '.');
    if (!valorLimpio) {
      return {
        valido: false,
        errorMsg: `${nombreCampo} es obligatorio.`,
      };
    }
    const num = parseFloat(valorLimpio);
    if (isNaN(num) || num <= 0) {
      return {
        valido: false,
        errorMsg: `${nombreCampo} debe ser un número positivo (por ejemplo, 5 o 2.4).`,
      };
    }
    return { valido: true, numero: num };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Validación de usuario activo
    let idUsuario = obtenerUsuarioSesion()?.id;
    if (!idUsuario) {
      try {
        const perfil = await obtenerPerfil();
        if (perfil?.id) {
          idUsuario = perfil.id;
          guardarUsuarioSesion(perfil);
        }
      } catch {
        // Fallback si la sesión no es válida
      }
    }

    if (!idUsuario) {
      setError('Debes iniciar sesión para poder publicar o modificar una plaza.');
      return;
    }

    // Validación de datos básicos
    const tituloTrim = titulo.trim();
    const descripcionTrim = descripcion.trim();

    if (!tituloTrim) {
      setError('El título de la plaza es obligatorio.');
      return;
    }

    if (!descripcionTrim) {
      setError('La descripción de la plaza es obligatoria.');
      return;
    }

    // Validación de precio por hora
    const valPrecio = validarNumeroPositivoObligatorio(
      precioHora,
      'El precio por hora',
    );
    if (!valPrecio.valido) {
      setError(valPrecio.errorMsg || 'Precio por hora inválido.');
      return;
    }

    // Validación de dimensiones físicas: largo y ancho
    const valLargo = validarNumeroPositivoObligatorio(largo, 'El largo');
    if (!valLargo.valido) {
      setError(valLargo.errorMsg || 'Largo inválido.');
      return;
    }

    const valAncho = validarNumeroPositivoObligatorio(ancho, 'El ancho');
    if (!valAncho.valido) {
      setError(valAncho.errorMsg || 'Ancho inválido.');
      return;
    }

    // Validación de dirección
    const debeValidarDireccion = !esEdicion || modificarDireccion;
    if (debeValidarDireccion) {
      if (!calle.trim()) {
        setError('La calle de la plaza es obligatoria.');
        return;
      }
      if (!numero.trim()) {
        setError('El portal de la plaza es obligatorio (o indica s/n).');
        return;
      }
      if (!codigoPostal.trim()) {
        setError('El código postal es obligatorio.');
        return;
      }
      if (!ciudad.trim()) {
        setError('El municipio o ciudad es obligatorio.');
        return;
      }
    }

    // Validación de dificultades de entrada
    if (entradaDificil) {
      if (dificultadesEntrada.length === 0) {
        setError(
          'Debes seleccionar al menos una dificultad de entrada o desmarcar la casilla.',
        );
        return;
      }
      if (dificultadesEntrada.includes('OTRA') && !descripcionEntrada.trim()) {
        setError(
          'Has seleccionado "Otra dificultad". Debes describirla en el campo correspondiente.',
        );
        return;
      }
    }

    // Procesamiento de entrada difícil y descripción
    const dificultadesFinales: DificultadEntrada[] = entradaDificil
      ? [...new Set(dificultadesEntrada)]
      : [];
    const descEntradaFinal =
      entradaDificil && dificultadesFinales.includes('OTRA')
        ? descripcionEntrada.trim() || null
        : null;

    try {
      setCargando(true);

      if (esEdicion && plazaAEditar) {
        const dtoActualizar: ActualizarPlazaDto = {
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          precioHora: valPrecio.numero!,
          largo: valLargo.numero!,
          ancho: valAncho.numero!,
          entradaDificil,
          dificultadesEntrada: dificultadesFinales,
          descripcionEntrada: descEntradaFinal,
          tieneCamaras,
          disponible,
          ...(modificarDireccion && {
            calle: calle.trim(),
            numero: numero.trim(),
            codigoPostal: codigoPostal.trim(),
            ciudad: ciudad.trim(),
            provincia: provincia.trim() || undefined,
          }),
        };

        await actualizarPlaza(plazaAEditar.id, dtoActualizar);
        const mensaje = `Plaza "${tituloTrim}" actualizada con éxito.`;
        setExito(mensaje);

        if (onExito) {
          onExito(mensaje);
        } else if (onPlazaCreada) {
          onPlazaCreada();
        }
      } else {
        const dtoCrear: CrearPlazaDto = {
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          calle: calle.trim(),
          numero: numero.trim(),
          codigoPostal: codigoPostal.trim(),
          ciudad: ciudad.trim(),
          provincia: provincia.trim() || undefined,
          precioHora: valPrecio.numero!,
          largo: valLargo.numero!,
          ancho: valAncho.numero!,
          entradaDificil,
          dificultadesEntrada: dificultadesFinales,
          descripcionEntrada: descEntradaFinal,
          tieneCamaras,
        };

        await crearPlaza(dtoCrear);
        const mensaje = `Plaza "${tituloTrim}" registrada con éxito.`;
        setExito(mensaje);

        // Limpiar formulario tras creación
        setTitulo('');
        setDescripcion('');
        setCalle('');
        setNumero('');
        setCodigoPostal('');
        setCiudad('');
        setProvincia('');
        setPrecioHora('');
        setLargo('');
        setAncho('');
        setEntradaDificil(false);
        setDificultadesEntrada([]);
        setDescripcionEntrada('');
        setTieneCamaras(false);
        setDisponible(true);

        if (onExito) {
          onExito(mensaje);
        } else if (onPlazaCreada) {
          onPlazaCreada();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al procesar la plaza.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="formulario" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="mensaje-alerta mensaje-error" role="alert">
          {error}
        </div>
      )}
      {exito && (
        <div className="mensaje-alerta mensaje-exito" role="status">
          {exito}
        </div>
      )}

      {/* Sección 1: Datos de la plaza */}
      <div className="form-seccion">
        <h3 className="form-seccion-titulo">Datos principales</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="plaza-titulo">
              Título de la plaza <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-titulo"
              type="text"
              placeholder="Ej. Plaza amplia cerca de la estación"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={cargando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plaza-precioHora">
              Precio por hora (€) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-precioHora"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 1.50"
              value={precioHora}
              onChange={(e) => setPrecioHora(e.target.value)}
              disabled={cargando}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
          <label htmlFor="plaza-descripcion">
            Descripción <span className="campo-requerido">*</span>
          </label>
          <textarea
            id="plaza-descripcion"
            rows={3}
            placeholder="Ej. Plaza cubierta, fácil maniobra, portón automático."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={cargando}
            required
          />
        </div>
      </div>

      {/* Sección 2: Ubicación de la plaza */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Ubicación de la plaza</h3>

        {esEdicion && plazaAEditar && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-surface, #f8f9fa)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Dirección actual registrada:
            </span>
            <strong
              style={{
                display: 'block',
                marginTop: '0.2rem',
                color: 'var(--color-text-main)',
              }}
            >
              📍 {plazaAEditar.direccion}
            </strong>
          </div>
        )}

        {esEdicion && (
          <div
            className="form-group form-group-checkbox"
            style={{ marginBottom: 'var(--spacing-sm)' }}
          >
            <label htmlFor="plaza-modificar-direccion" className="checkbox-label">
              <input
                id="plaza-modificar-direccion"
                type="checkbox"
                checked={modificarDireccion}
                onChange={(e) => setModificarDireccion(e.target.checked)}
                disabled={cargando}
              />
              <span>Modificar la dirección de la plaza</span>
            </label>
          </div>
        )}

        {(!esEdicion || modificarDireccion) && (
          <>
            <p className="form-hint" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Introduce la dirección exacta. El sistema localizará automáticamente la plaza en el mapa a nivel de portal.
            </p>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="plaza-calle">
                  Calle <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-calle"
                  type="text"
                  placeholder="Ej. Gran Vía, Avenida Diagonal..."
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-numero">
                  Portal <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-numero"
                  type="text"
                  placeholder="Ej. 28 o s/n"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-codigo-postal">
                  Código postal <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-codigo-postal"
                  type="text"
                  placeholder="Ej. 28013"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-ciudad">
                  Municipio / Ciudad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-ciudad"
                  type="text"
                  placeholder="Ej. Madrid, Oviedo, Barcelona..."
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  disabled={cargando}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plaza-provincia">
                  Provincia <span className="form-hint" style={{ fontWeight: 'normal' }}>(opcional)</span>
                </label>
                <input
                  id="plaza-provincia"
                  type="text"
                  placeholder="Ej. Madrid, Asturias, Barcelona..."
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  disabled={cargando}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sección 3: Dimensiones de la plaza */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Dimensiones</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="plaza-largo">
              Largo (m) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-largo"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 5.0"
              value={largo}
              onChange={(e) => setLargo(e.target.value)}
              disabled={cargando}
              required
            />
            <span className="form-hint">Largo de la plaza en metros</span>
          </div>

          <div className="form-group">
            <label htmlFor="plaza-ancho">
              Ancho (m) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-ancho"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 2.4"
              value={ancho}
              onChange={(e) => setAncho(e.target.value)}
              disabled={cargando}
              required
            />
            <span className="form-hint">Ancho de la plaza en metros</span>
          </div>
        </div>
      </div>

      {/* Sección 4: Características */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Características</h3>

        <div className="form-group form-group-checkbox">
          <label htmlFor="plaza-camaras" className="checkbox-label">
            <input
              id="plaza-camaras"
              type="checkbox"
              checked={tieneCamaras}
              onChange={(e) => setTieneCamaras(e.target.checked)}
              disabled={cargando}
            />
            <span>El parking dispone de cámaras de seguridad</span>
          </label>
        </div>

        <div
          className="form-group form-group-checkbox"
          style={{ marginTop: 'var(--spacing-xs)' }}
        >
          <label htmlFor="plaza-entrada-dificil" className="checkbox-label">
            <input
              id="plaza-entrada-dificil"
              type="checkbox"
              checked={entradaDificil}
              onChange={(e) => handleEntradaDificilChange(e.target.checked)}
              disabled={cargando}
            />
            <span>La entrada puede resultar difícil para algunos vehículos</span>
          </label>
        </div>

        {entradaDificil && (
          <div className="plaza-dificultades-bloque" style={{ marginTop: 'var(--spacing-sm)' }}>
            <div className="form-group">
              <label htmlFor="plaza-selector-dificultad">
                ¿Qué puede dificultar la entrada? <span className="campo-requerido">*</span>
              </label>
              <select
                id="plaza-selector-dificultad"
                value=""
                onChange={(e) => {
                  handleSeleccionarDificultad(e.target.value);
                  e.target.value = "";
                }}
                disabled={cargando}
              >
                <option value="" disabled>
                  -- Selecciona una dificultad para añadirla --
                </option>
                {DIFICULTADES_ENTRADA_OPCIONES.map((opcion) => {
                  const yaSeleccionada = dificultadesEntrada.includes(opcion.id);
                  return (
                    <option
                      key={opcion.id}
                      value={opcion.id}
                      disabled={yaSeleccionada}
                    >
                      {opcion.nombre} {yaSeleccionada ? '(Ya seleccionada)' : ''}
                    </option>
                  );
                })}
              </select>
              <span className="form-hint">
                Puedes seleccionar más de una opción si la entrada presenta varias dificultades.
              </span>
            </div>

            {dificultadesEntrada.length > 0 && (
              <div className="plaza-chips-seleccionadas-bloque" style={{ marginTop: 'var(--spacing-xs)' }}>
                <span className="plaza-chips-titulo">Seleccionadas:</span>
                <div className="plaza-chips-lista">
                  {dificultadesEntrada.map((id) => (
                    <span key={id} className="chip-dificultad">
                      <span>{DIFICULTADES_ENTRADA_ETIQUETAS[id]}</span>
                      <button
                        type="button"
                        className="chip-dificultad-eliminar"
                        onClick={() => handleEliminarDificultad(id)}
                        disabled={cargando}
                        aria-label={`Eliminar ${DIFICULTADES_ENTRADA_ETIQUETAS[id]}`}
                        title="Eliminar opción"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {dificultadesEntrada.includes('OTRA') && (
              <div className="form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
                <label htmlFor="plaza-descripcion-entrada">
                  Describe la dificultad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-descripcion-entrada"
                  type="text"
                  placeholder="Describe la dificultad no listada..."
                  maxLength={300}
                  value={descripcionEntrada}
                  onChange={(e) => setDescripcionEntrada(e.target.value)}
                  disabled={cargando}
                  required
                />
                <span className="form-hint">
                  Campo obligatorio para especificar la dificultad adicional (máx. 300 caracteres).
                </span>
              </div>
            )}
          </div>
        )}

        {esEdicion && (
          <div
            className="form-group form-group-checkbox"
            style={{ marginTop: 'var(--spacing-sm)' }}
          >
            <label htmlFor="plaza-disponible" className="checkbox-label">
              <input
                id="plaza-disponible"
                type="checkbox"
                checked={disponible}
                onChange={(e) => setDisponible(e.target.checked)}
                disabled={cargando}
              />
              <span>Plaza disponible para reservas</span>
            </label>
          </div>
        )}
      </div>

      <div className="btn-group" style={{ marginTop: 'var(--spacing-lg)' }}>
        <button type="submit" className="btn btn-primary" disabled={cargando}>
          {cargando
            ? 'Guardando...'
            : esEdicion
              ? 'Guardar cambios'
              : 'Publicar plaza'}
        </button>
        {onCancelar && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
