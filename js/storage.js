// Persistencia en localStorage: borrador de la solicitud en curso e historial de solicitudes.

const CLAVE_BORRADOR = "aurapay-borrador";
const CLAVE_SOLICITUDES = "aurapay-solicitudes";


function leerStorage(clave, valorPorDefecto) {

    try {
        return JSON.parse(localStorage.getItem(clave)) || valorPorDefecto;
    } catch (error) {
        return valorPorDefecto;
    }

}


function escribirStorage(clave, valor) {

    localStorage.setItem(clave, JSON.stringify(valor));

}


// Borrador: se guarda y se modifica a medida que el usuario avanza.

function obtenerBorrador() {

    return leerStorage(CLAVE_BORRADOR, null);

}


function actualizarBorrador(cambios) {

    const borradorActual = obtenerBorrador() || {};

    escribirStorage(CLAVE_BORRADOR, { ...borradorActual, ...cambios });

}


function borrarBorrador() {

    localStorage.removeItem(CLAVE_BORRADOR);

}


// Historial de solicitudes confirmadas.

function obtenerSolicitudes() {

    return leerStorage(CLAVE_SOLICITUDES, []);

}


function guardarSolicitud(solicitud) {

    escribirStorage(CLAVE_SOLICITUDES, [solicitud, ...obtenerSolicitudes()]);

}


function modificarEstadoSolicitud(numero, nuevoEstado) {

    const solicitudesActualizadas = obtenerSolicitudes().map(
        solicitud => solicitud.numero === numero
            ? { ...solicitud, estado: nuevoEstado }
            : solicitud
    );

    escribirStorage(CLAVE_SOLICITUDES, solicitudesActualizadas);

}


function eliminarSolicitud(numero) {

    const solicitudesRestantes = obtenerSolicitudes().filter(
        solicitud => solicitud.numero !== numero
    );

    escribirStorage(CLAVE_SOLICITUDES, solicitudesRestantes);

}


function vaciarSolicitudes() {

    localStorage.removeItem(CLAVE_SOLICITUDES);

}
