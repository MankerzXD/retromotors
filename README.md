# RetroMotors Auctioneers International

> **Plataforma web oficial para la catalogación, peritaje técnico y subasta en tiempo real de automóviles clásicos, deportivos históricos y piezas de colección.**

---

## 🏎️ Características Principales

- **Catálogo de Subastas en Vivo**: Fichas completas de vehículos con peritaje de originalidad mecánica (Matching Numbers), procedencia histórica y certificación FIVA.
- **Relojes de Cuenta Regresiva en Tiempo Real**: Temporizadores interactivos segundo a segundo en catálogo y fichas de detalle.
- **Sistema Anti-Snipe**: Extensión automática de tiempo (+2 minutos) ante pujas de último segundo para evitar especulación.
- **Sistema de Pujas Interactivo**: Incrementos mínimos con un solo clic, confirmación notarial simulada y registro en vivo de postores.
- **Subida de Fotografías con Almacenamiento Local**: Drag & drop de fotos desde cualquier dispositivo con compresión automática vía HTML5 Canvas para optimización y persistencia en `LocalStorage`.
- **Gestión de Cuentas y Publicación**: Registro y autenticación de usuarios postores en el navegador.
- **Buscador y Filtros por Época**: Búsqueda instantánea en tiempo real por modelo, marca o especificaciones.
- **Diseño Ultra Responsivo y Accesible**: Cumplimiento de estándares de usabilidad, tipografía premium y contraste óptimo en móviles, tablets y escritorios.

---

## 🛠️ Tecnologías

- **HTML5 Semántico**: Estructura limpia y accesible.
- **Vanilla CSS3**: Sistema de diseño con variables CSS, animaciones fluidas y layout responsive adaptativo sin frameworks externos.
- **Vanilla JavaScript (ES6+)**: Lógica desacoplada, enrutador por hash SPA (`#inicio`, `#catalogo`, `#garantia`, `#blog`, `#contacto`), estado global y persistencia en `LocalStorage`.

---

## 🚀 Instalación y Uso Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MankerzXD/retromotors.git
   ```
2. Abrir `index.html` en cualquier navegador web moderno o servir con un servidor local:
   ```bash
   npx serve .
   # o bien: python -m http.server 5500
   ```
3. Acceder a `http://localhost:5500`.
