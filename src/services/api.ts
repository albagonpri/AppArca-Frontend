export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function manejarRespuesta<T>(respuesta: Response): Promise<T> {
  if (!respuesta.ok) {
    let mensajeError = `Error en la petición (${respuesta.status} ${respuesta.statusText})`;
    try {
      const errorJson = await respuesta.json();
      if (errorJson) {
        if (Array.isArray(errorJson.message)) {
          mensajeError = errorJson.message.join('. ');
        } else if (typeof errorJson.message === 'string') {
          mensajeError = errorJson.message;
        } else if (errorJson.error) {
          mensajeError = errorJson.error;
        }
      }
    } catch {
      // Si la respuesta no es JSON, mantenemos el mensaje de estado HTTP
    }
    throw new Error(mensajeError);
  }

  // Manejo de respuestas vacías (p.ej. status 204)
  if (respuesta.status === 204) {
    return {} as T;
  }

  return respuesta.json();
}
