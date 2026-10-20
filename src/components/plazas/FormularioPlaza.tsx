import React, { useState, useCallback, useRef } from 'react';
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
import {
  buscarDireccion,
  consultarCodigoPostal,
  type CandidatoGeocodificacion,
} from '../../services/geocodificacion.service';
import { MapaUbicacion, type CoordenadasMapa } from './MapaUbicacion';

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

  // ─── Datos básicos ────────────────────────────────────────
  const [titulo, setTitulo] = useState<string>(plazaAEditar?.titulo || '');
  const [descripcion, setDescripcion] = useState<string>(
    plazaAEditar?.descripcion || '',
  );
  const [precioHora, setPrecioHora] = useState<string>(
    plazaAEditar?.precioHora != null ? String(plazaAEditar.precioHora) : '',
  );

  // ─── Dirección ───────────────────────────────────────────
  const [calle, setCalle] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [codigoPostal, setCodigoPostal] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [poblacion, setPoblacion] = useState<string>(plazaAEditar?.poblacion || '');
  const [provincia, setProvincia] = useState<string>('');
  const [modificarDireccion, setModificarDireccion] = useState<boolean>(false);

  // Control de concurrencia y cancelación de peticiones de código postal (anti race condition)
  const peticionCPIdRef = useRef<number>(0);
  const abortCtrlCPRef = useRef<AbortController | null>(null);
  const ciudadModificadaManualmenteRef = useRef<boolean>(false);
  const poblacionModificadaManualmenteRef = useRef<boolean>(false);
  const provinciaModificadaManualmenteRef = useRef<boolean>(false);

  // ─── Geocodificación y mapa ───────────────────────────────
  /**
   * Coordenadas seleccionadas actualmente para la plaza.
   * En edición sin modificar dirección, se inicializan con las de la plaza.
   */
  const [coordenadasMapa, setCoordenadasMapa] = useState<CoordenadasMapa | null>(
    esEdicion && plazaAEditar
      ? { latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud }
      : null,
  );

  /** true = el usuario ha confirmado explícitamente la ubicación del marcador */
  const [ubicacionConfirmada, setUbicacionConfirmada] = useState<boolean>(
    esEdicion && !modificarDireccion,
  );

  const [candidatos, setCandidatos] = useState<CandidatoGeocodificacion[]>([]);
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<string | null>(null);
  const [buscandoGeo, setBuscandoGeo] = useState<boolean>(false);
  const [errorGeo, setErrorGeo] = useState<string | null>(null);
  const [mensajeGeoExito, setMensajeGeoExito] = useState<string | null>(null);
  const [mostrarCandidatos, setMostrarCandidatos] = useState<boolean>(false);

  // ─── Autocompletado de código postal ─────────────────────
  const [buscandoCP, setBuscandoCP] = useState<boolean>(false);
  const [errorCP, setErrorCP] = useState<string | null>(null);
  const [mensajeCPExito, setMensajeCPExito] = useState<string | null>(null);
  const [poblacionesDisponibles, setPoblacionesDisponibles] = useState<string[]>([]);

  // Referencia para evitar búsquedas automáticas repetidas de la misma dirección al perder foco
  const ultimaDireccionBuscadaRef = useRef<string>('');

  // ─── Dimensiones ──────────────────────────────────────────
  const [largo, setLargo] = useState<string>(
    plazaAEditar?.largo != null ? String(plazaAEditar.largo) : '',
  );
  const [ancho, setAncho] = useState<string>(
    plazaAEditar?.ancho != null ? String(plazaAEditar.ancho) : '',
  );

  // ─── Características ──────────────────────────────────────
  const [entradaDificil, setEntradaDificil] = useState<boolean>(
    Boolean(plazaAEditar?.entradaDificil),
  );
  const [dificultadesEntrada, setDificultadesEntrada] = useState<DificultadEntrada[]>(
    plazaAEditar?.dificultadesEntrada ? [...plazaAEditar.dificultadesEntrada] : [],
  );
  const [descripcionEntrada, setDescripcionEntrada] = useState<string>(
    plazaAEditar?.descripcionEntrada || '',
  );
  const [tieneCamaras, setTieneCamaras] = useState<boolean>(
    Boolean(plazaAEditar?.tieneCamaras),
  );
  const [disponible, setDisponible] = useState<boolean>(
    plazaAEditar?.disponible !== undefined ? plazaAEditar.disponible : true,
  );

  // ─── Estado general ───────────────────────────────────────
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // ─── Helpers ─────────────────────────────────────────────
  const validarNumeroPositivoObligatorio = (
    valorStr: string,
    nombreCampo: string,
  ): { valido: boolean; numero?: number; errorMsg?: string } => {
    const valorLimpio = valorStr.trim().replace(',', '.');
    if (!valorLimpio) {
      return { valido: false, errorMsg: `${nombreCampo} es obligatorio.` };
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

  /** Invalida la confirmación cuando el usuario modifica cualquier campo de dirección. */
  const invalidarConfirmacion = useCallback(() => {
    setUbicacionConfirmada(false);
    setCandidatos([]);
    setMostrarCandidatos(false);
    setCandidatoSeleccionado(null);
    setErrorGeo(null);
    setMensajeGeoExito(null);
  }, []);

  const handleCambioCalle = (v: string) => { setCalle(v); invalidarConfirmacion(); };
  const handleCambioNumero = (v: string) => { setNumero(v); invalidarConfirmacion(); };
  const handleCambioCiudad = (v: string) => {
    setCiudad(v);
    ciudadModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };
  const handleCambioPoblacion = (v: string) => {
    setPoblacion(v);
    poblacionModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };
  const handleCambioProvincia = (v: string) => {
    setProvincia(v);
    provinciaModificadaManualmenteRef.current = true;
    invalidarConfirmacion();
  };

  /**
   * Autocompletado automático al introducir 5 dígitos de código postal.
   * Evita condiciones de carrera: si el usuario cambia el CP mientras hay una petición en curso,
   * la respuesta desfasada nunca sobrescribe los datos nuevos ni ediciones manuales.
   */
  const ejecutarAutocompletadoCP = async (cp: string) => {
    // Abortar petición en vuelo anterior si existe
    if (abortCtrlCPRef.current) {
      abortCtrlCPRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortCtrlCPRef.current = abortCtrl;
    const idActual = ++peticionCPIdRef.current;

    try {
      setBuscandoCP(true);
      setErrorCP(null);
      setMensajeCPExito(null);
      setPoblacionesDisponibles([]);

      const res = await consultarCodigoPostal(cp, abortCtrl.signal);

      // Si se lanzó una petición posterior mientras esta respondía, descartar
      if (idActual !== peticionCPIdRef.current) {
        return;
      }

      // Requisito 1: Autocompletar provincia y municipio (respetando si el usuario editó manualmente)
      if (res.provincia && !provinciaModificadaManualmenteRef.current) {
        setProvincia(res.provincia);
      }
      if (res.municipio && !ciudadModificadaManualmenteRef.current) {
        setCiudad(res.municipio);
      }

      // Requisito 2, 3, 4, 5: Autocompletar población/localidad sin sustituir el municipio
      if (res.poblaciones && res.poblaciones.length > 1) {
        setPoblacionesDisponibles(res.poblaciones);
        // Si hay varias localidades, sugerimos la principal pero permitimos selector
        if (!poblacionModificadaManualmenteRef.current) {
          const sugerida = res.poblacionSugerida || res.poblaciones[0];
          setPoblacion(sugerida);
        }
        setMensajeCPExito(
          `CP ${cp} (${res.provincia}): Municipio "${res.municipio}". Se encontraron ${res.poblaciones.length} localidades. Selecciona la correcta o edítala libremente.`,
        );
      } else {
        setPoblacionesDisponibles([]);
        // Si coincide municipio y población, ambos campos tienen ese valor
        if (!poblacionModificadaManualmenteRef.current) {
          const sugerida = res.poblacionSugerida || res.municipio;
          setPoblacion(sugerida);
        }
        setMensajeCPExito(
          `Localidad completada: ${res.poblacionSugerida || res.municipio} (Municipio de ${res.municipio}, ${res.provincia}).`,
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (idActual !== peticionCPIdRef.current) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Código postal no encontrado.';
      setErrorCP(`${msg} Puedes introducir el municipio, población y provincia manualmente.`);
    } finally {
      if (idActual === peticionCPIdRef.current) {
        setBuscandoCP(false);
      }
    }
  };

  const handleCambioCP = (v: string) => {
    setCodigoPostal(v);
    // Cambiar el código postal después de haber confirmado una ubicación requiere re-confirmación
    invalidarConfirmacion();
    setErrorCP(null);
    setMensajeCPExito(null);
    setPoblacionesDisponibles([]);

    // Abortar y desfasar inmediatamente cualquier petición en vuelo anterior si el usuario altera el CP
    if (abortCtrlCPRef.current) {
      abortCtrlCPRef.current.abort();
    }
    peticionCPIdRef.current++;

    const cpLimpio = v.trim();
    if (cpLimpio.length === 5 && /^\d{5}$/.test(cpLimpio)) {
      ciudadModificadaManualmenteRef.current = false;
      poblacionModificadaManualmenteRef.current = false;
      provinciaModificadaManualmenteRef.current = false;
      ejecutarAutocompletadoCP(cpLimpio);
    } else {
      setBuscandoCP(false);
    }
  };

  const handleModificarDireccionChange = (checked: boolean) => {
    setModificarDireccion(checked);
    if (checked) {
      // Al modificar la dirección, conservamos las coordenadas previas en el mapa para no perder la referencia
      if (plazaAEditar) {
        setCoordenadasMapa({ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud });
      }
      setUbicacionConfirmada(false);
      setCandidatos([]);
      setMostrarCandidatos(false);
      setCandidatoSeleccionado(null);
      setErrorGeo(null);
      setMensajeGeoExito(null);
      setErrorCP(null);
      setMensajeCPExito(null);
      setPoblacionesDisponibles([]);
      ultimaDireccionBuscadaRef.current = '';
    } else {
      // Restaura las coordenadas originales de la plaza
      if (plazaAEditar) {
        setCoordenadasMapa({ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud });
        setUbicacionConfirmada(true);
      }
    }
  };

  // ─── Geocodificación ─────────────────────────────────────
  const ejecutarBusquedaDireccion = async (direccionActual: {
    calle: string;
    numero?: string;
    codigoPostal?: string;
    ciudad?: string;
    poblacion?: string;
    provincia?: string;
  }) => {
    setErrorGeo(null);
    setMensajeGeoExito(null);
    setCandidatos([]);
    setMostrarCandidatos(false);
    setUbicacionConfirmada(false);
    setCandidatoSeleccionado(null);

    if (!direccionActual.calle.trim()) {
      setErrorGeo('Introduce al menos la calle para localizar la plaza.');
      return;
    }

    const claveBusqueda = `${direccionActual.calle.trim()}|${direccionActual.numero?.trim() || ''}|${direccionActual.codigoPostal?.trim() || ''}|${direccionActual.ciudad?.trim() || ''}|${direccionActual.poblacion?.trim() || ''}|${direccionActual.provincia?.trim() || ''}`;
    ultimaDireccionBuscadaRef.current = claveBusqueda;

    try {
      setBuscandoGeo(true);
      const resultados = await buscarDireccion({
        calle: direccionActual.calle.trim(),
        numero: direccionActual.numero?.trim() || undefined,
        codigoPostal: direccionActual.codigoPostal?.trim() || undefined,
        ciudad: direccionActual.ciudad?.trim() || undefined,
        poblacion: direccionActual.poblacion?.trim() || undefined,
        provincia: direccionActual.provincia?.trim() || undefined,
      });

      if (resultados.length === 0) {
        setErrorGeo(
          'CartoCiudad no encontró la dirección exacta. Puedes situar el marcador manualmente en el mapa sobre la entrada del garaje.',
        );
        // Si no había coordenadas, colocamos el mapa en el centro de España
        setCoordenadasMapa((prev) => prev ?? { latitud: 40.416775, longitud: -3.70379 });
      } else if (resultados.length === 1) {
        const unico = resultados[0];
        setCoordenadasMapa({ latitud: unico.latitud, longitud: unico.longitud });
        setCandidatoSeleccionado(unico.id);
        setMensajeGeoExito(
          `Dirección localizada: "${unico.direccionCompleta}". Revisa el punto en el mapa y confírmalo.`,
        );
      } else {
        setCandidatos(resultados);
        setMostrarCandidatos(true);
        const primero = resultados[0];
        setCoordenadasMapa({ latitud: primero.latitud, longitud: primero.longitud });
        setCandidatoSeleccionado(primero.id);
        setMensajeGeoExito(
          `Se han encontrado ${resultados.length} coincidencias. Selecciona la correcta en la lista y confirma la ubicación.`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servicio de geocodificación.';
      setErrorGeo(`${msg} Puedes situar el marcador manualmente en el mapa.`);
      setCoordenadasMapa((prev) => prev ?? { latitud: 40.416775, longitud: -3.70379 });
    } finally {
      setBuscandoGeo(false);
    }
  };

  /** Búsqueda manual pulsando el botón */
  const handleBuscarUbicacion = () => {
    ejecutarBusquedaDireccion({
      calle,
      numero: numero.trim() || undefined,
      codigoPostal: codigoPostal.trim() || undefined,
      ciudad: ciudad.trim() || undefined,
      poblacion: poblacion.trim() || undefined,
      provincia: provincia.trim() || undefined,
    });
  };

  /** Búsqueda automática al perder el foco si los campos obligatorios están completos */
  const handleBlurCampoDireccion = () => {
    if (
      calle.trim() &&
      numero.trim() &&
      codigoPostal.trim() &&
      ciudad.trim() &&
      !buscandoGeo
    ) {
      const claveActual = `${calle.trim()}|${numero.trim()}|${codigoPostal.trim()}|${ciudad.trim()}|${poblacion.trim()}|${provincia.trim()}`;
      if (claveActual !== ultimaDireccionBuscadaRef.current) {
        handleBuscarUbicacion();
      }
    }
  };

  const seleccionarCandidato = (candidato: CandidatoGeocodificacion) => {
    setCoordenadasMapa({ latitud: candidato.latitud, longitud: candidato.longitud });
    setCandidatoSeleccionado(candidato.id);
    setUbicacionConfirmada(false);
    setMensajeGeoExito(
      `Seleccionado: "${candidato.direccionCompleta}". Pulsa "Confirmar ubicación" para fijarla.`,
    );
  };

  const handleCambioMapa = (coords: CoordenadasMapa) => {
    setCoordenadasMapa(coords);
    setCandidatoSeleccionado(null);
    setUbicacionConfirmada(false);
    setErrorGeo(null);
    setMensajeGeoExito(
      'Ubicación ajustada manualmente en el mapa. Pulsa "Confirmar ubicación" para fijar la entrada del garaje.',
    );
  };

  const handleConfirmarUbicacion = () => {
    if (!coordenadasMapa) return;
    setUbicacionConfirmada(true);
    setMostrarCandidatos(false);
    setMensajeGeoExito('Ubicación confirmada correctamente.');
    setErrorGeo(null);
  };

  // ─── Submit ──────────────────────────────────────────────
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
        // fallback
      }
    }

    if (!idUsuario) {
      setError('Debes iniciar sesión para poder publicar o modificar una plaza.');
      return;
    }

    // Validación básica
    const tituloTrim = titulo.trim();
    const descripcionTrim = descripcion.trim();

    if (!tituloTrim) { setError('El título de la plaza es obligatorio.'); return; }
    if (!descripcionTrim) { setError('La descripción de la plaza es obligatoria.'); return; }

    const valPrecio = validarNumeroPositivoObligatorio(precioHora, 'El precio por hora');
    if (!valPrecio.valido) { setError(valPrecio.errorMsg || 'Precio inválido.'); return; }

    const valLargo = validarNumeroPositivoObligatorio(largo, 'El largo');
    if (!valLargo.valido) { setError(valLargo.errorMsg || 'Largo inválido.'); return; }

    const valAncho = validarNumeroPositivoObligatorio(ancho, 'El ancho');
    if (!valAncho.valido) { setError(valAncho.errorMsg || 'Ancho inválido.'); return; }

    // Validación de dirección y ubicación
    const debeValidarDireccion = !esEdicion || modificarDireccion;
    if (debeValidarDireccion) {
      if (!calle.trim()) { setError('La calle de la plaza es obligatoria.'); return; }
      if (!numero.trim()) { setError('El portal de la plaza es obligatorio (o indica s/n).'); return; }
      if (!codigoPostal.trim()) { setError('El código postal es obligatorio.'); return; }
      if (!ciudad.trim()) { setError('El municipio o ciudad es obligatorio.'); return; }
      if (!poblacion.trim()) { setError('La población o localidad es obligatoria.'); return; }

      // Obligatorio confirmar ubicación en mapa
      if (!ubicacionConfirmada || !coordenadasMapa) {
        setError(
          'Debes localizar la plaza y confirmar su ubicación en el mapa antes de publicarla.',
        );
        return;
      }
    }

    // Validación de dificultades
    if (entradaDificil) {
      if (dificultadesEntrada.length === 0) {
        setError('Debes seleccionar al menos una dificultad de entrada o desmarcar la casilla.');
        return;
      }
      if (dificultadesEntrada.includes('OTRA') && !descripcionEntrada.trim()) {
        setError('Has seleccionado "Otra dificultad". Debes describirla en el campo correspondiente.');
        return;
      }
    }

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
            poblacion: poblacion.trim() || undefined,
            provincia: provincia.trim() || undefined,
            ...(coordenadasMapa && {
              latitud: coordenadasMapa.latitud,
              longitud: coordenadasMapa.longitud,
            }),
          }),
        };

        await actualizarPlaza(plazaAEditar.id, dtoActualizar);
        const mensaje = `Plaza "${tituloTrim}" actualizada con éxito.`;
        setExito(mensaje);
        if (onExito) onExito(mensaje);
        else if (onPlazaCreada) onPlazaCreada();
      } else {
        const dtoCrear: CrearPlazaDto = {
          titulo: tituloTrim,
          descripcion: descripcionTrim,
          calle: calle.trim(),
          numero: numero.trim(),
          codigoPostal: codigoPostal.trim(),
          ciudad: ciudad.trim(),
          poblacion: poblacion.trim() || undefined,
          provincia: provincia.trim() || undefined,
          latitud: coordenadasMapa!.latitud,
          longitud: coordenadasMapa!.longitud,
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

        // Limpiar formulario
        setTitulo(''); setDescripcion(''); setCalle(''); setNumero('');
        setCodigoPostal(''); setCiudad(''); setPoblacion(''); setProvincia(''); setPrecioHora('');
        setLargo(''); setAncho(''); setEntradaDificil(false);
        setDificultadesEntrada([]); setDescripcionEntrada(''); setTieneCamaras(false);
        setDisponible(true); setCoordenadasMapa(null); setUbicacionConfirmada(false);
        setCandidatos([]); setMostrarCandidatos(false); setErrorGeo(null);
        setMensajeGeoExito(null);
        ultimaDireccionBuscadaRef.current = '';

        if (onExito) onExito(mensaje);
        else if (onPlazaCreada) onPlazaCreada();
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ha ocurrido un error inesperado al procesar la plaza.');
    } finally {
      setCargando(false);
    }
  };

  const debeVerDireccion = !esEdicion || modificarDireccion;

  return (
    <form onSubmit={handleSubmit} className="plaza-form">
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

      {/* ── Sección 1: Datos básicos ── */}
      <div className="form-seccion">
        <h3 className="form-seccion-titulo">Datos de la plaza</h3>

        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="plaza-titulo">
              Título de la plaza <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-titulo"
              type="text"
              placeholder="Ej. Amplia plaza en garaje céntrico"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={cargando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="plaza-precio-hora">
              Precio por hora (€) <span className="campo-requerido">*</span>
            </label>
            <input
              id="plaza-precio-hora"
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

      {/* ── Sección 2: Ubicación ── */}
      <div className="form-seccion" style={{ marginTop: 'var(--spacing-md)' }}>
        <h3 className="form-seccion-titulo">Ubicación de la plaza</h3>

        {/* Dirección actual en modo edición */}
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

        {/* Checkbox "Modificar dirección" en edición */}
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
                onChange={(e) => handleModificarDireccionChange(e.target.checked)}
                disabled={cargando}
              />
              <span>Modificar la dirección de la plaza</span>
            </label>
          </div>
        )}

        {/* Campos de dirección (creación siempre, edición solo si modificarDireccion) */}
        {debeVerDireccion && (
          <>
            <p className="form-hint" style={{ marginBottom: 'var(--spacing-sm)' }}>
              Introduce la dirección postal para localizarla automáticamente con CartoCiudad o
              sitúa el marcador directamente en el mapa sobre la entrada del garaje.
            </p>

            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="plaza-calle">
                  Calle <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-calle"
                  type="text"
                  placeholder="Ej. Gran Vía, Calle Uría, Calle Mayor..."
                  value={calle}
                  onChange={(e) => handleCambioCalle(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
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
                  onChange={(e) => handleCambioNumero(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
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
                  maxLength={5}
                  value={codigoPostal}
                  onChange={(e) => handleCambioCP(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                <span className="form-hint">
                  Introduce 5 dígitos para autocompletar municipio y provincia
                </span>
                {buscandoCP && (
                  <span className="form-hint" style={{ color: 'var(--color-primary)' }}>
                    ⏳ Consultando código postal...
                  </span>
                )}
                {errorCP && !buscandoCP && (
                  <span className="form-hint" style={{ color: 'var(--color-danger)' }}>
                    ⚠️ {errorCP}
                  </span>
                )}
                {mensajeCPExito && !errorCP && !buscandoCP && (
                  <span className="form-hint" style={{ color: '#16a34a' }}>
                    ✔ {mensajeCPExito}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="plaza-ciudad">
                  Municipio / Ciudad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-ciudad"
                  type="text"
                  placeholder="Ej. Madrid, Cangas de Onís, Jávea..."
                  value={ciudad}
                  onChange={(e) => handleCambioCiudad(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                <span className="form-hint">Municipio oficial (autocompletado por CP)</span>
              </div>

              <div className="form-group">
                <label htmlFor="plaza-poblacion">
                  Población / Localidad <span className="campo-requerido">*</span>
                </label>
                <input
                  id="plaza-poblacion"
                  type="text"
                  placeholder="Ej. Madrid, Biamón, Aduanas de Mar..."
                  value={poblacion}
                  onChange={(e) => handleCambioPoblacion(e.target.value)}
                  onBlur={handleBlurCampoDireccion}
                  disabled={cargando}
                  required
                />
                {poblacionesDisponibles.length > 1 && (
                  <div style={{ marginTop: '0.35rem' }}>
                    <label
                      htmlFor="plaza-selector-poblacion"
                      className="form-hint"
                      style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}
                    >
                      Seleccionar localidad asociada al CP:
                    </label>
                    <select
                      id="plaza-selector-poblacion"
                      value={poblacionesDisponibles.includes(poblacion) ? poblacion : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setPoblacion(e.target.value);
                          poblacionModificadaManualmenteRef.current = true;
                          invalidarConfirmacion();
                        }
                      }}
                      disabled={cargando || buscandoCP}
                      style={{ width: '100%', fontSize: 'var(--font-size-sm)' }}
                    >
                      <option value="">-- Seleccionar de la lista ({poblacionesDisponibles.length} localidades) --</option>
                      {poblacionesDisponibles.map((pob) => (
                        <option key={pob} value={pob}>
                          {pob}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="form-hint">Núcleo urbano, pedanía o localidad</span>
              </div>

              <div className="form-group">
                <label htmlFor="plaza-provincia">
                  Provincia{' '}
                  <span className="form-hint" style={{ fontWeight: 'normal' }}>
                    (opcional)
                  </span>
                </label>
                <input
                  id="plaza-provincia"
                  type="text"
                  placeholder="Ej. Madrid, Asturias, Alicante..."
                  value={provincia}
                  onChange={(e) => handleCambioProvincia(e.target.value)}
                  disabled={cargando}
                />
              </div>
            </div>

            {/* Botón de búsqueda explícita */}
            <div className="plaza-geo-acciones">
              <button
                id="plaza-buscar-ubicacion"
                type="button"
                className="btn btn-secondary"
                onClick={handleBuscarUbicacion}
                disabled={buscandoGeo || cargando || !calle.trim()}
              >
                {buscandoGeo ? '⏳ Buscando con CartoCiudad...' : '🔍 Localizar en el mapa'}
              </button>
            </div>

            {/* Feedback durante la búsqueda */}
            {buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-info"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ⏳ Localizando dirección con el servicio oficial CartoCiudad (IGN)...
              </div>
            )}

            {/* Aviso o error de geocodificación */}
            {errorGeo && !buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-aviso"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ⚠️ {errorGeo}
              </div>
            )}

            {/* Mensaje de éxito de geocodificación o ajuste */}
            {mensajeGeoExito && !errorGeo && !buscandoGeo && (
              <div
                className="mensaje-alerta mensaje-exito"
                role="status"
                style={{ marginTop: 'var(--spacing-sm)' }}
              >
                ✅ {mensajeGeoExito}
              </div>
            )}

            {/* Lista de candidatos múltiples si CartoCiudad devuelve varios */}
            {mostrarCandidatos && candidatos.length > 1 && (
              <div style={{ marginTop: 'var(--spacing-sm)' }}>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--spacing-xs)',
                  }}
                >
                  Se encontraron {candidatos.length} coincidencias. Selecciona la correcta:
                </p>
                <ul className="plaza-candidatos-lista">
                  {candidatos.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`plaza-candidato-btn${candidatoSeleccionado === c.id ? ' seleccionado' : ''}`}
                        onClick={() => seleccionarCandidato(c)}
                      >
                        {c.direccionCompleta}
                        <span className="plaza-candidato-fuente">({c.fuente})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* ── Mapa interactivo para creación o edición de dirección ── */}
        {debeVerDireccion && (
          <div className="plaza-mapa-seccion">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xs)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span className="plaza-mapa-label">
                Ubicación de la plaza en el mapa
              </span>
              <div
                className={`plaza-ubicacion-estado ${
                  ubicacionConfirmada
                    ? 'confirmada'
                    : coordenadasMapa
                      ? 'pendiente'
                      : 'sin-ubicacion'
                }`}
              >
                {ubicacionConfirmada
                  ? '✔ Ubicación confirmada'
                  : coordenadasMapa
                    ? '⏳ Pendiente de confirmar'
                    : '📍 Sin ubicación'}
              </div>
            </div>

            <p className="plaza-mapa-hint">
              {coordenadasMapa
                ? 'Puedes hacer clic en el mapa o arrastrar el marcador para afinar la ubicación exacta de la entrada del garaje.'
                : 'Introduce la dirección arriba para localizarla, o haz clic directamente en el mapa para situar el marcador.'}
            </p>

            <MapaUbicacion
              coordenadas={coordenadasMapa}
              onChange={handleCambioMapa}
              interactivo={true}
              altura="340px"
            />

            {/* Coordenadas actuales */}
            {coordenadasMapa && (
              <div className="plaza-coords-display">
                <span>Lat: {coordenadasMapa.latitud}</span>
                <span>Lon: {coordenadasMapa.longitud}</span>
              </div>
            )}

            {/* Botón Confirmar ubicación */}
            {coordenadasMapa && !ubicacionConfirmada && (
              <div className="plaza-geo-acciones" style={{ marginTop: 'var(--spacing-sm)' }}>
                <button
                  id="plaza-confirmar-ubicacion"
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmarUbicacion}
                >
                  ✅ Confirmar ubicación en el mapa
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mapa de solo lectura para edición sin modificar dirección ── */}
        {esEdicion && !modificarDireccion && plazaAEditar && (
          <div className="plaza-mapa-seccion">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              <span className="plaza-mapa-label">Ubicación registrada</span>
              <div className="plaza-ubicacion-estado confirmada">
                ✔ Ubicación conservada
              </div>
            </div>
            <MapaUbicacion
              coordenadas={{ latitud: plazaAEditar.latitud, longitud: plazaAEditar.longitud }}
              onChange={() => {}}
              interactivo={false}
              altura="260px"
            />
            <div className="plaza-coords-display">
              <span>Lat: {plazaAEditar.latitud}</span>
              <span>Lon: {plazaAEditar.longitud}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sección 3: Dimensiones ── */}
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

      {/* ── Sección 4: Características ── */}
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
                  e.target.value = '';
                }}
                disabled={cargando}
              >
                <option value="" disabled>
                  -- Selecciona una dificultad para añadirla --
                </option>
                {DIFICULTADES_ENTRADA_OPCIONES.map((opcion) => {
                  const yaSeleccionada = dificultadesEntrada.includes(opcion.id);
                  return (
                    <option key={opcion.id} value={opcion.id} disabled={yaSeleccionada}>
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
              <div
                className="plaza-chips-seleccionadas-bloque"
                style={{ marginTop: 'var(--spacing-xs)' }}
              >
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
