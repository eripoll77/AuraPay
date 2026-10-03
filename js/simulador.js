// Lógica de negocio del simulador: cálculos y validaciones, sin acceso al DOM.

const PORCENTAJE_MAXIMO_INGRESOS = 0.4;
const MESES_POR_ANIO = 12;

// Sistema francés: cuota fija calculada sobre la tasa mensual (TNA / 12).
function calcularPrestamo(monto, plan) {

    const { tna, cuotas } = plan;

    const tasaMensual = tna / MESES_POR_ANIO;
    const cuota = monto * tasaMensual / (1 - Math.pow(1 + tasaMensual, -cuotas));
    const total = cuota * cuotas;
    const intereses = total - monto;

    return { total, intereses, cuota };

}


function calcularTea(tna) {

    return Math.pow(1 + tna / MESES_POR_ANIO, MESES_POR_ANIO) - 1;

}


function formatearPorcentaje(valor) {

    return `${(valor * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;

}


function describirTasa({ tna }) {

    return `TNA ${formatearPorcentaje(tna)} (TEA ${formatearPorcentaje(calcularTea(tna))})`;

}


function formatearMoneda(valor) {

    return valor.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });

}


function obtenerPlanesDisponibles(planes, monto) {

    return planes.filter(
        plan => monto >= plan.montoMinimo && monto <= plan.montoMaximo
    );

}


function evaluarCapacidadPago(cuota, ingresos) {

    const porcentajeIngresos = cuota / ingresos;

    return {
        porcentajeIngresos,
        esAprobable: porcentajeIngresos <= PORCENTAJE_MAXIMO_INGRESOS
    };

}


function validarDatosSolicitante(datos) {

    const { nombre, email, telefono, ingresos, motivo } = datos;

    const errores = {};

    if (nombre.trim().length < 3) {
        errores.nombre = "Ingresá tu nombre y apellido.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errores.email = "Ingresá un email válido.";
    }

    if (!/^\d{8,15}$/.test(telefono.replace(/[\s-]/g, ""))) {
        errores.telefono = "Ingresá entre 8 y 15 números.";
    }

    if (!(Number(ingresos) > 0)) {
        errores.ingresos = "Ingresá tus ingresos mensuales.";
    }

    if (!motivo) {
        errores.motivo = "Elegí un motivo.";
    }

    return errores;

}


function filtrarSolicitudesEnRevision(solicitudes) {

    return solicitudes.filter(solicitud => solicitud.estado === "En revisión");

}


function calcularTotalSolicitado(solicitudes) {

    return solicitudes.reduce(
        (acumulado, solicitud) => acumulado + solicitud.monto,
        0
    );

}


function generarNumeroSolicitud() {

    return `AP-${Date.now().toString().slice(-6)}`;

}
