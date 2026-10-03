# AURAPAY — Simulador de préstamos personales

Proyecto final del curso de JavaScript. Es un simulador web que cubre el circuito completo de una solicitud de préstamo personal.

**Probalo online:** https://eripoll77.github.io/AuraPay/

## Cómo funciona

1. **Simulá**: elegí el monto con el slider y la cantidad de cuotas. Los planes disponibles dependen del monto.
2. **Tus datos**: completá el formulario (con validación en pantalla). Se guarda automáticamente como borrador.
3. **Confirmá**: revisá el resumen, se controla que la cuota no supere el 40% de tus ingresos, y confirmá el envío.
4. **Mis solicitudes**: historial con total en revisión. Podés cancelar, eliminar o vaciar el historial.

## Cálculo del préstamo

Todos los planes usan una **TNA del 120%** (TEA 213,8%), definida en `data/planes.json`. La cuota se calcula con el **sistema francés** (cuota fija), con una tasa mensual de TNA ÷ 12 = 10%:

```
cuota = monto × tasaMensual ÷ (1 − (1 + tasaMensual)^−cuotas)
```

## Cómo ejecutarlo

Los datos se cargan con `fetch` desde archivos `.json`, así que el proyecto **tiene que abrirse desde un servidor local**. Si abrís `index.html` con doble clic (`file://`), el navegador bloquea la carga de los datos.

- **VS Code**: instalá la extensión *Live Server*, hacé clic derecho en `index.html` y elegí **Open with Live Server**.
- **GitHub Pages**: también funciona publicado, sin configuración adicional.

## Estructura

```
├── index.html
├── assets/img/        → favicon e ilustraciones
├── css/style.css      → estilos propios
├── data/
│   ├── planes.json    → planes de cuotas, tasas y montos permitidos
│   └── motivos.json   → motivos del préstamo
└── js/
    ├── simulador.js   → lógica de negocio (cálculos y validaciones)
    ├── storage.js     → persistencia en localStorage
    └── app.js         → interfaz, DOM y eventos
```

## Tecnologías

- HTML, CSS y JavaScript sin frameworks
- `fetch` con `async/await`, `try/catch/finally` y opción de reintentar si falla la carga
- `localStorage`: guardar borrador y solicitudes, modificar el estado de una solicitud, borrar y vaciar el historial
- [SweetAlert2](https://sweetalert2.github.io/) para confirmaciones y notificaciones (sin `alert`, `confirm` ni `prompt`)
