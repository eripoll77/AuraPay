// Interfaz del simulador: carga de datos, navegación entre pasos e historial.

let planes = [];
let motivos = [];
let planSeleccionado = null;

const ORDEN_PASOS = ["simulacion", "datos", "resumen"];


const estadoCarga = document.querySelector("#estadoCarga");
const mensajeCarga = document.querySelector("#mensajeCarga");
const btnReintentar = document.querySelector("#btnReintentar");
const pasosIndicador = document.querySelectorAll("#pasosIndicador li");

const pasoSimulacion = document.querySelector("#pasoSimulacion");
const montoInput = document.querySelector("#monto");
const montoSeleccionado = document.querySelector("#montoSeleccionado");
const opcionesCuotas = document.querySelector("#opcionesCuotas");
const resumenMonto = document.querySelector("#resumenMonto");
const resumenCuotas = document.querySelector("#resumenCuotas");
const resumenIntereses = document.querySelector("#resumenIntereses");
const resumenTasa = document.querySelector("#resumenTasa");
const cuotaEstimada = document.querySelector("#cuotaEstimada");
const totalEstimado = document.querySelector("#totalEstimado");
const btnContinuar = document.querySelector("#btnContinuar");

const pasoDatos = document.querySelector("#pasoDatos");
const selectMotivo = document.querySelector("#motivo");

const pasoResumen = document.querySelector("#pasoResumen");
const detalleResumen = document.querySelector("#detalleResumen");
const capacidadPago = document.querySelector("#capacidadPago");
const btnConfirmar = document.querySelector("#btnConfirmar");

const listaSolicitudes = document.querySelector("#listaSolicitudes");
const sinSolicitudes = document.querySelector("#sinSolicitudes");
const cantidadEnRevision = document.querySelector("#cantidadEnRevision");
const totalEnRevision = document.querySelector("#totalEnRevision");
const btnVaciar = document.querySelector("#btnVaciar");

const panelesPorPaso = {
    simulacion: pasoSimulacion,
    datos: pasoDatos,
    resumen: pasoResumen
};

const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
});


// ---------- Carga de datos ----------

async function cargarDatos() {

    mostrarEstadoCarga("Cargando planes disponibles...", false);
    btnReintentar.disabled = true;

    try {

        const [respuestaPlanes, respuestaMotivos] = await Promise.all([
            fetch("./data/planes.json"),
            fetch("./data/motivos.json")
        ]);

        if (!respuestaPlanes.ok || !respuestaMotivos.ok) {
            throw new Error("No se pudieron cargar los datos del simulador");
        }

        planes = await respuestaPlanes.json();
        motivos = await respuestaMotivos.json();

        renderizarMotivos();
        estadoCarga.classList.add("oculto");
        restaurarBorrador();

    } catch (error) {

        mostrarEstadoCarga("No pudimos cargar los planes disponibles.", true);

        Swal.fire({
            icon: "error",
            title: "No pudimos cargar el simulador",
            text: "Revisá tu conexión e intentá nuevamente."
        });

    } finally {

        btnReintentar.disabled = false;

    }

}


function mostrarEstadoCarga(mensaje, mostrarReintentar) {

    mensajeCarga.textContent = mensaje;
    estadoCarga.classList.remove("oculto");
    btnReintentar.classList.toggle("oculto", !mostrarReintentar);

}


function renderizarMotivos() {

    motivos.forEach(({ id, nombre }) => {
        selectMotivo.append(new Option(nombre, id));
    });

}


function restaurarBorrador() {

    const borrador = obtenerBorrador();

    if (!borrador) {
        actualizarSimulador();
        mostrarPaso("simulacion");
        return;
    }

    const { monto, planId, datos, paso } = borrador;

    montoInput.value = monto || montoInput.defaultValue;
    planSeleccionado = planes.find(plan => plan.id === planId) || null;

    completarFormulario(datos || {});
    actualizarSimulador();

    const pasoRestaurado = planSeleccionado ? paso || "simulacion" : "simulacion";

    if (pasoRestaurado === "resumen") {
        renderizarResumen();
    }

    mostrarPaso(pasoRestaurado);

    toast.fire({
        icon: "info",
        title: "Recuperamos tu solicitud en curso"
    });

}


// ---------- Navegación entre pasos ----------

function mostrarPaso(pasoActual) {

    const indicePasoActual = ORDEN_PASOS.indexOf(pasoActual);

    Object.entries(panelesPorPaso).forEach(([paso, panel]) => {
        panel.classList.toggle("oculto", paso !== pasoActual);
    });

    pasosIndicador.forEach(indicador => {
        const indicePaso = ORDEN_PASOS.indexOf(indicador.dataset.paso);
        indicador.classList.toggle("activo", indicePaso === indicePasoActual);
        indicador.classList.toggle("completado", indicePaso < indicePasoActual);
    });

    if (obtenerBorrador()) {
        actualizarBorrador({ paso: pasoActual });
    }

}


// ---------- Paso 1: simulación ----------

function actualizarSimulador() {

    const monto = Number(montoInput.value);

    montoSeleccionado.textContent = formatearMoneda(monto);
    resumenMonto.textContent = formatearMoneda(monto);

    const planesDisponibles = obtenerPlanesDisponibles(planes, monto);

    const planSigueDisponible = planSeleccionado && planesDisponibles.some(
        plan => plan.id === planSeleccionado.id
    );

    if (!planSigueDisponible) {
        planSeleccionado = planesDisponibles[0] || null;
    }

    renderizarCuotas(planesDisponibles);
    actualizarResultado();

}


function renderizarCuotas(planesDisponibles) {

    opcionesCuotas.innerHTML = "";

    planesDisponibles.forEach(plan => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = planSeleccionado && planSeleccionado.id === plan.id
            ? "btn-cuota activo"
            : "btn-cuota";
        boton.dataset.id = plan.id;
        boton.textContent = plan.cuotas;

        boton.addEventListener("click", () => {
            planSeleccionado = plan;
            actualizarBotonesCuotas();
            actualizarResultado();
        });

        opcionesCuotas.appendChild(boton);

    });

}


function actualizarBotonesCuotas() {

    document.querySelectorAll(".btn-cuota").forEach(boton => {
        boton.classList.toggle(
            "activo",
            Number(boton.dataset.id) === planSeleccionado.id
        );
    });

}


function actualizarResultado() {

    if (!planSeleccionado) {
        resumenCuotas.textContent = "-";
        resumenIntereses.textContent = "$0";
        resumenTasa.textContent = "-";
        cuotaEstimada.textContent = "$0";
        totalEstimado.textContent = "$0";
        return;
    }

    const { total, intereses, cuota } = calcularPrestamo(
        Number(montoInput.value),
        planSeleccionado
    );

    resumenCuotas.textContent = planSeleccionado.cuotas;
    resumenIntereses.textContent = formatearMoneda(intereses);
    resumenTasa.textContent = describirTasa(planSeleccionado);
    cuotaEstimada.textContent = formatearMoneda(cuota);
    totalEstimado.textContent = formatearMoneda(total);

}


function continuarSolicitud() {

    if (!planSeleccionado) {
        Swal.fire({
            icon: "warning",
            title: "Seleccioná un plan",
            text: "Elegí una cantidad de cuotas para continuar."
        });
        return;
    }

    actualizarBorrador({
        monto: Number(montoInput.value),
        planId: planSeleccionado.id
    });

    mostrarPaso("datos");
    pasoDatos.elements.nombre.focus();

}


// ---------- Paso 2: datos del solicitante ----------

function obtenerDatosFormulario() {

    return Object.fromEntries(new FormData(pasoDatos));

}


function completarFormulario(datos) {

    Object.entries(datos).forEach(([campo, valor]) => {
        const elementoCampo = pasoDatos.elements[campo];
        if (elementoCampo) {
            elementoCampo.value = valor;
        }
    });

}


function mostrarErrores(errores) {

    document.querySelectorAll("[data-error]").forEach(mensajeError => {
        const campo = mensajeError.dataset.error;
        mensajeError.textContent = errores[campo] || "";
        pasoDatos.elements[campo].classList.toggle("invalido", Boolean(errores[campo]));
    });

}


async function revisarSolicitud(evento) {

    evento.preventDefault();

    const datos = obtenerDatosFormulario();
    const errores = validarDatosSolicitante(datos);
    const camposConError = Object.keys(errores);

    mostrarErrores(errores);

    if (camposConError.length > 0) {
        pasoDatos.elements[camposConError[0]].focus();
        return;
    }

    const { cuota } = calcularPrestamo(Number(montoInput.value), planSeleccionado);
    const { porcentajeIngresos, esAprobable } = evaluarCapacidadPago(cuota, Number(datos.ingresos));

    if (!esAprobable) {

        const { isConfirmed } = await Swal.fire({
            icon: "warning",
            title: "La cuota supera tu capacidad de pago",
            html: `La cuota representaría el <b>${Math.round(porcentajeIngresos * 100)}%</b> de tus ingresos.
                   El máximo permitido es ${PORCENTAJE_MAXIMO_INGRESOS * 100}%.
                   Probá con más cuotas o un monto menor.`,
            showCancelButton: true,
            confirmButtonText: "Ajustar simulación",
            cancelButtonText: "Corregir ingresos"
        });

        if (isConfirmed) {
            mostrarPaso("simulacion");
        }

        return;

    }

    renderizarResumen();
    mostrarPaso("resumen");

}


// ---------- Paso 3: resumen y confirmación ----------

function renderizarResumen() {

    const datos = obtenerDatosFormulario();
    const monto = Number(montoInput.value);
    const { total, intereses, cuota } = calcularPrestamo(monto, planSeleccionado);
    const { porcentajeIngresos } = evaluarCapacidadPago(cuota, Number(datos.ingresos));
    const motivoElegido = motivos.find(motivo => motivo.id === Number(datos.motivo));

    const filasResumen = [
        ["Solicitante", datos.nombre],
        ["Email", datos.email],
        ["Teléfono", datos.telefono],
        ["Motivo", motivoElegido ? motivoElegido.nombre : "-"],
        ["Monto solicitado", formatearMoneda(monto)],
        ["Plan", `${planSeleccionado.cuotas} cuotas`],
        ["Cuota mensual", formatearMoneda(cuota)],
        ["Intereses", formatearMoneda(intereses)],
        ["Tasa", describirTasa(planSeleccionado)],
        ["Total a devolver", formatearMoneda(total)]
    ];

    detalleResumen.replaceChildren(
        ...filasResumen.map(([etiqueta, valor]) => crearFilaResumen(etiqueta, valor))
    );

    capacidadPago.textContent =
        `La cuota representa el ${Math.round(porcentajeIngresos * 100)}% de tus ingresos mensuales.`;

}


function crearFilaResumen(etiqueta, valor) {

    const fila = document.createElement("div");
    const termino = document.createElement("dt");
    const definicion = document.createElement("dd");

    termino.textContent = etiqueta;
    definicion.textContent = valor;
    fila.append(termino, definicion);

    return fila;

}


async function confirmarSolicitud() {

    const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: "¿Confirmás el envío?",
        text: "Vamos a registrar tu solicitud para su evaluación.",
        showCancelButton: true,
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "Revisar de nuevo"
    });

    if (!isConfirmed) {
        return;
    }

    const { nombre, email, telefono, motivo } = obtenerDatosFormulario();
    const monto = Number(montoInput.value);
    const { total, cuota } = calcularPrestamo(monto, planSeleccionado);
    const motivoElegido = motivos.find(motivoActual => motivoActual.id === Number(motivo));

    const solicitud = {
        numero: generarNumeroSolicitud(),
        fecha: new Date().toISOString(),
        nombre,
        email,
        telefono,
        motivo: motivoElegido.nombre,
        monto,
        cuotas: planSeleccionado.cuotas,
        cuota,
        total,
        estado: "En revisión"
    };

    guardarSolicitud(solicitud);
    borrarBorrador();
    reiniciarSimulador();
    renderizarSolicitudes();

    await Swal.fire({
        icon: "success",
        title: "¡Solicitud enviada!",
        html: `Tu número de solicitud es <b>${solicitud.numero}</b>.<br>
               Te vamos a contactar por email para continuar.`,
        confirmButtonText: "Ver mis solicitudes"
    });

    document.querySelector("#solicitudes").scrollIntoView({ behavior: "smooth" });

}


function reiniciarSimulador() {

    pasoDatos.reset();
    mostrarErrores({});
    montoInput.value = montoInput.defaultValue;
    planSeleccionado = null;
    actualizarSimulador();
    mostrarPaso("simulacion");

}


// ---------- Historial de solicitudes ----------

function renderizarSolicitudes() {

    const solicitudes = obtenerSolicitudes();
    const solicitudesEnRevision = filtrarSolicitudesEnRevision(solicitudes);
    const hayHistorial = solicitudes.length > 0;

    cantidadEnRevision.textContent = solicitudesEnRevision.length;
    totalEnRevision.textContent = formatearMoneda(calcularTotalSolicitado(solicitudesEnRevision));

    listaSolicitudes.replaceChildren(
        ...solicitudes.map(solicitud => crearTarjetaSolicitud(solicitud))
    );

    sinSolicitudes.classList.toggle("oculto", hayHistorial);
    btnVaciar.classList.toggle("oculto", !hayHistorial);

}


function crearTarjetaSolicitud(solicitud) {

    const { numero, fecha, nombre, motivo, monto, cuotas, cuota, estado } = solicitud;
    const estaEnRevision = estado === "En revisión";

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-solicitud";

    tarjeta.innerHTML = `
        <div class="tarjeta-encabezado">
            <strong class="tarjeta-numero"></strong>
            <span class="estado ${estaEnRevision ? "estado-revision" : "estado-cancelada"}"></span>
        </div>
        <p class="tarjeta-monto"></p>
        <p class="tarjeta-detalle"></p>
        <div class="tarjeta-acciones">
            ${estaEnRevision ? `<button type="button" class="btn-texto" data-accion="cancelar" data-numero="${numero}">Cancelar</button>` : ""}
            <button type="button" class="btn-texto peligro" data-accion="eliminar" data-numero="${numero}">Eliminar</button>
        </div>
    `;

    tarjeta.querySelector(".tarjeta-numero").textContent = numero;
    tarjeta.querySelector(".estado").textContent = estado;
    tarjeta.querySelector(".tarjeta-monto").textContent =
        `${formatearMoneda(monto)} en ${cuotas} cuotas de ${formatearMoneda(cuota)}`;
    tarjeta.querySelector(".tarjeta-detalle").textContent =
        `${motivo}, pedido por ${nombre} el ${new Date(fecha).toLocaleDateString("es-AR")}`;

    return tarjeta;

}


async function pedirConfirmacion(titulo, texto, textoBoton) {

    const { isConfirmed } = await Swal.fire({
        icon: "warning",
        title: titulo,
        text: texto,
        showCancelButton: true,
        confirmButtonText: textoBoton,
        cancelButtonText: "Volver",
        confirmButtonColor: "#d64545"
    });

    return isConfirmed;

}


async function gestionarAccionSolicitud(evento) {

    const boton = evento.target.closest("[data-accion]");

    if (!boton) {
        return;
    }

    const { accion, numero } = boton.dataset;

    if (accion === "cancelar") {

        const confirmado = await pedirConfirmacion(
            `¿Cancelar la solicitud ${numero}?`,
            "La solicitud dejará de estar en revisión.",
            "Sí, cancelar"
        );

        if (confirmado) {
            modificarEstadoSolicitud(numero, "Cancelada");
            toast.fire({ icon: "success", title: "Solicitud cancelada" });
        }

    }

    if (accion === "eliminar") {

        const confirmado = await pedirConfirmacion(
            `¿Eliminar la solicitud ${numero}?`,
            "Se borrará de tu historial.",
            "Sí, eliminar"
        );

        if (confirmado) {
            eliminarSolicitud(numero);
            toast.fire({ icon: "success", title: "Solicitud eliminada" });
        }

    }

    renderizarSolicitudes();

}


async function vaciarHistorial() {

    const confirmado = await pedirConfirmacion(
        "¿Vaciar todo el historial?",
        "Se eliminarán todas tus solicitudes guardadas.",
        "Sí, vaciar"
    );

    if (confirmado) {
        vaciarSolicitudes();
        renderizarSolicitudes();
        toast.fire({ icon: "success", title: "Historial vaciado" });
    }

}


// ---------- Eventos ----------

montoInput.addEventListener("input", actualizarSimulador);
btnContinuar.addEventListener("click", continuarSolicitud);
btnReintentar.addEventListener("click", cargarDatos);

pasoDatos.addEventListener("input", () => {
    actualizarBorrador({ datos: obtenerDatosFormulario() });
});

pasoDatos.addEventListener("submit", revisarSolicitud);
btnConfirmar.addEventListener("click", confirmarSolicitud);

document.querySelectorAll("[data-ir-a]").forEach(boton => {
    boton.addEventListener("click", () => mostrarPaso(boton.dataset.irA));
});

listaSolicitudes.addEventListener("click", gestionarAccionSolicitud);
btnVaciar.addEventListener("click", vaciarHistorial);


renderizarSolicitudes();
cargarDatos();
