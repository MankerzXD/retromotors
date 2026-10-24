/**
 * Base de Datos Centralizada - Subastas de Autos Clásicos
 * RetroMotors Auctioneers International
 * Plataforma Oficial de Subastas & Peritaje Histórico
 */

const APP_DATA = {
    // Configuración institucional de la casa de subastas
    institution: {
        name: "RetroMotors Auctioneers International",
        tagline: "Casa de Subastas de Vehículos Clásicos & Colección Histórica",
        registry: "Peritaje y Fianza Certificada FIVA",
        year: "2026",
        headquarters: "Buenos Aires / Salón de Custodia Recoleta"
    },

    // Equipo y Roles Especializados de la Plataforma
    teamMembers: [
        { name: "Sánchez, Lucas", role: "Director Técnico & Arquitectura CMS", task: "Gestión general de la infraestructura web, catálogo, seguridad y permisos." },
        { name: "García, Martín", role: "Jefe de Curaduría & Peritaje Técnico", task: "Verificación de Matching Numbers, peritaje de chasis e informes mecánicos." },
        { name: "Pérez, Camila", role: "Directora de Diseño & Experiencia (UX/UI)", task: "Diseño minimalista premium, consistencia estética y recorrido de puja en vivo." },
        { name: "Fernández, Julián", role: "Especialista en Posicionamiento SEO", task: "Optimización de metatítulos, marcado Schema.org y visibilidad en buscadores." },
        { name: "Morales, Sofía", role: "Auditora de Accesibilidad Web (WCAG 2.1)", task: "Cumplimiento estricto de accesibilidad AA, navegación por teclado y contraste." },
        { name: "Alvarez, Nicolás", role: "Responsable de Analítica & Integraciones", task: "Métricas de postores, sistema de alertas de catálogo y analítica transaccional." },
        { name: "Romero, Valentina", role: "Control de Calidad (QA) & Soporte", task: "Pruebas responsive en dispositivos, verificación de formularios y validaciones." }
    ],

    // Catálogo de vehículos clásicos para subasta
    vehicles: [
        {
            id: "ford-mustang-fastback-1967",
            title: "Ford Mustang Fastback GT 390",
            year: 1967,
            category: "muscle-cars",
            categoryName: "Muscle Cars Americanos",
            era: "1960s",
            origin: "Estados Unidos",
            image: "./img/mustang-1967.jpg",
            startingBid: 48000,
            currentBid: 56500,
            bidsCount: 14,
            minIncrement: 500,
            endsInHours: 18,
            status: "active",
            featured: true,
            originalityRating: "9.8 / 10 (Matching Numbers)",
            vin: "7R02S142998",
            mileage: "42,300 millas",
            engine: "V8 390ci (6.4L) Big Block - 320 CV",
            transmission: "Manual de 4 velocidades Toploader",
            exteriorColor: "Highland Green Metallic",
            interiorColor: "Cuero Negro original",
            shortDesc: "Icónica silueta Fastback con motor 390 Big Block original de fábrica. Restauración de chapa y pintura de concurso en 2021 preservando interior original.",
            fullDescription: "Presentamos una oportunidad única para coleccionistas: un auténtico Ford Mustang Fastback GT de 1967 terminado en el legendario Highland Green. Esta unidad cuenta con su tren motriz original 'Matching Numbers', carburador Holley de 4 bocas y paquete de suspensión reforzada GT. Inspeccionado rigurosamente por nuestro equipo técnico con peritaje físico de chasis y motor verificado ante escribano.",
            history: "Comprado originalmente en San Francisco, California, permaneció con su primer propietario hasta 1999 en garaje climatizado. Importado y conservado con certificación histórica FIVA. Se entrega con carpetas de servicio histórico, manual original del propietario y tarjeta de garantía 'Marti Report' que certifica su configuración de salida de planta.",
            shippingDetails: "Disponible para retiro en nuestro salón de guarda en Buenos Aires o despacho en camión cerrado asegurado a todo el país y países limítrofes.",
            bidsHistory: [
                { bidder: "Juan P. (Coleccionista Bs.As.)", amount: 56500, time: "Hace 23 minutos" },
                { bidder: "Ricardo M. (Córdoba)", amount: 55000, time: "Hace 2 horas" },
                { bidder: "Esteban G. (Rosario)", amount: 53500, time: "Hace 5 horas" },
                { bidder: "Carlos V. (Mendoza)", amount: 50000, time: "Ayer" }
            ],
            seo: {
                title: "Subasta Ford Mustang Fastback 1967 GT 390 | RetroMotors",
                description: "Subasta online de Ford Mustang Fastback 1967 Highland Green original. Ficha técnica, peritaje certificado y pujas en vivo garantizadas."
            }
        },
        {
            id: "chevrolet-corvette-stingray-1963",
            title: "Chevrolet Corvette Stingray 'Split-Window' Coupe",
            year: 1963,
            category: "muscle-cars",
            categoryName: "Muscle Cars Americanos",
            era: "1960s",
            origin: "Estados Unidos",
            image: "./img/corvette-1963.jpg",
            startingBid: 95000,
            currentBid: 112000,
            bidsCount: 21,
            minIncrement: 1000,
            endsInHours: 6,
            status: "ending-soon",
            featured: true,
            originalityRating: "9.9 / 10 (Pieza de Museo)",
            vin: "30837S108920",
            mileage: "28,750 millas reales",
            engine: "327ci L84 V8 Fuel-Injected (Ramjet) - 360 CV",
            transmission: "Manual Borg-Warner T-10 de 4 marchas",
            exteriorColor: "Silver Blue Metallic",
            interiorColor: "Azul medianoche original",
            shortDesc: "El Santo Grial de los Corvettes: edición única de 1963 con la emblemática luneta trasera dividida (Split Window) y motor Fuel Injection de inyección mecánica.",
            fullDescription: "Diseñado por Bill Mitchell y Larry Shinoda, el Corvette 'Split-Window' de 1963 es una de las piezas automotrices más codiciadas a nivel global. Esta unidad conserva su sistema de inyección mecánica Rochester Ramjet original, frenos asistidos y llantas estilo turbina con tuerca central simulada. Un ejemplar que ha obtenido múltiples condecoraciones en eventos de elegancia.",
            history: "Propiedad de un ex piloto de carreras aficionado de Ohio durante 34 años. Guardado sin modificaciones mecánicas. Posee el certificado de autenticidad NCRS (National Corvette Restorers Society) con puntaje de 98.4 puntos.",
            shippingDetails: "Inspección técnica completa aprobada. Incluye transferencia inmediata de dominio y seguro de transporte con cobertura total.",
            bidsHistory: [
                { bidder: "Alberto S. (Montevideo)", amount: 112000, time: "Hace 10 minutos" },
                { bidder: "Matías K. (CABA)", amount: 110000, time: "Hace 45 minutos" },
                { bidder: "Ignacio D. (Santa Fe)", amount: 105000, time: "Hace 3 horas" }
            ],
            seo: {
                title: "Subasta Chevrolet Corvette 1963 Split-Window Coupe | RetroMotors",
                description: "Subasta oficial del legendario Chevrolet Corvette 1963 Split-Window Coupe. Motor L84 Fuel Injection. Certificado NCRS y garantía de procedencia."
            }
        },
        {
            id: "porsche-911-carrera-rs-1973",
            title: "Porsche 911 Carrera RS 2.7 Touring",
            year: 1973,
            category: "deportivos-europeos",
            categoryName: "Deportivos Europeos",
            era: "1970s",
            origin: "Alemania",
            image: "./img/porsche-1973.jpg",
            startingBid: 140000,
            currentBid: 168000,
            bidsCount: 29,
            minIncrement: 1000,
            endsInHours: 24,
            status: "active",
            featured: true,
            originalityRating: "9.7 / 10 (Restaurado en Stuttgart)",
            vin: "9113600984",
            mileage: "54,100 km",
            engine: "Boxer 6 cilindros 2.7L MFI (Inyección mecánica Bosch) - 210 CV",
            transmission: "Manual de 5 marchas Type 915",
            exteriorColor: "Grand Prix White con gráficos Carrera rojos",
            interiorColor: "Recaro deportivos en pana negra y cuero",
            shortDesc: "El deportivo de homologación más aclamado de Porsche. Alerón clásico de 'cola de pato' (Entenbürzel) y llantas Fuchs originales.",
            fullDescription: "Construido para homologar el modelo en el Grupo 4 de competición de la FIA, el Carrera RS 2.7 es el estándar de oro del 911 clásico. Chasis aligerado, dirección sumamente precisa y respuesta inmediata de acelerador gracias a la bomba mecánica de inyección Bosch Kugelfischer.",
            history: "Entregado nuevo en Frankfurt, Alemania en mayo de 1973. Restauración documentada paso a paso realizada por especialistas certificados de la marca en 2018. Mantiene sus paneles originales y sellos de chapa de fábrica.",
            shippingDetails: "Vehículo con pasaporte técnico internacional FIA. Traslado directo puerta a puerta en transporte especial para vehículos de colección.",
            bidsHistory: [
                { bidder: "Guillermo T. (Bariloche)", amount: 168000, time: "Hace 1 hora" },
                { bidder: "Pablo B. (Santiago de Chile)", amount: 165000, time: "Hace 4 horas" },
                { bidder: "Fernando L. (CABA)", amount: 160000, time: "Hace 9 horas" }
            ],
            seo: {
                title: "Porsche 911 Carrera RS 2.7 1973 en Subasta | RetroMotors",
                description: "Subasta exclusiva de Porsche 911 Carrera RS 2.7 de 1973. Cola de pato original, inyección mecánica y ficha técnica completa verificada."
            }
        },
        {
            id: "dodge-charger-rt-1969",
            title: "Dodge Charger R/T 440 Magnum",
            year: 1969,
            category: "muscle-cars",
            categoryName: "Muscle Cars Americanos",
            era: "1960s",
            origin: "Estados Unidos",
            image: "./img/charger-1969.jpg",
            startingBid: 52000,
            currentBid: 61500,
            bidsCount: 16,
            minIncrement: 500,
            endsInHours: 42,
            status: "active",
            featured: false,
            originalityRating: "9.5 / 10 (Restauración completa)",
            vin: "XS29L9B284102",
            mileage: "61,200 millas",
            engine: "V8 440ci (7.2L) Magnum 4-bbl - 375 CV",
            transmission: "Automática TorqueFlite 727 Heavy Duty",
            exteriorColor: "Pitch Black brillante con franja trasera blanca R/T",
            interiorColor: "Vinilo negro de alta resistencia",
            shortDesc: "Pura potencia americana: parrilla con ópticas ocultas, motor 440 Magnum de 7.2 litros y escape doble de acero inoxidable con sonido inconfundible.",
            fullDescription: "El Charger R/T de 1969 encarna la era dorada de los muscle cars. Parrilla frontal dividida única para el año 1969, luces traseras horizontales y diferencial Sure-Grip trasero. Esta unidad ha recibido una reconstrucción mecánica total en banco de pruebas con 385 CV medidos al embrague.",
            history: "Originario de Texas, libre de corrosión gracias al clima seco. Dos dueños verificables desde nuevo. Se incluye la factura de compra original del concesionario Chrysler-Plymouth.",
            shippingDetails: "Listo para entrega inmediata. Documentación al día con verificación policial e informe de dominio libre de gravámenes.",
            bidsHistory: [
                { bidder: "Federico R. (Mar del Plata)", amount: 61500, time: "Hace 3 horas" },
                { bidder: "Mauro S. (Tucumán)", amount: 60000, time: "Hace 8 horas" }
            ],
            seo: {
                title: "Subasta Dodge Charger R/T 1969 440 Magnum | RetroMotors",
                description: "Oportunidad de subasta: Dodge Charger R/T 1969 con motor 440ci Magnum. Estado sobresaliente y verificación de autenticidad."
            }
        },
        {
            id: "mercedes-benz-300-sl-1955",
            title: "Mercedes-Benz 300 SL 'Gullwing' Coupe",
            year: 1955,
            category: "gran-turismo",
            categoryName: "Gran Turismo & Leyendas",
            era: "1950s",
            origin: "Alemania",
            image: "./img/mercedes-1955.jpg",
            startingBid: 280000,
            currentBid: 325000,
            bidsCount: 35,
            minIncrement: 2500,
            endsInHours: 4,
            status: "ending-soon",
            featured: true,
            originalityRating: "10 / 10 (Certificado por Mercedes-Benz Classic)",
            vin: "1980405500128",
            mileage: "36,800 km certificados",
            engine: "6 cilindros en línea 3.0L M198 con inyección directa Bosch - 215 CV",
            transmission: "Manual de 4 velocidades sincronizadas",
            exteriorColor: "Silberpfeil (Plata flecha plateada)",
            interiorColor: "Cuero rojo rosado de época",
            shortDesc: "Las legendarias 'Alas de Gaviota'. El primer automóvil de producción con inyección directa de combustible y chasis tubular espacial.",
            fullDescription: "Considerado unánimemente el vehículo deportivo del siglo XX. Este 300 SL Gullwing posee su carrocería de acero con capot, puertas y baúl de aluminio. Mantiene su juego de maletas de cuero originales a medida en la parte trasera y el volante abatible característico para facilitar el acceso.",
            history: "Vendido nuevo por Max Hoffman en Nueva York en 1955. Formó parte de prestigiosas colecciones privadas en Ginebra y Buenos Aires. Posee el 'Certificate of Origin' emitido por el archivo histórico de Mercedes-Benz en Stuttgart.",
            shippingDetails: "Inspección de alta seguridad. Entrega personalizada con servicio de protocolo y asesoramiento técnico de conservación.",
            bidsHistory: [
                { bidder: "Gonzalo H. (Colección Privada CABA)", amount: 325000, time: "Hace 15 minutos" },
                { bidder: "Eduardo M. (San Pablo)", amount: 320000, time: "Hace 1 hora" },
                { bidder: "Horacio F. (Punta del Este)", amount: 310000, time: "Hace 3 horas" }
            ],
            seo: {
                title: "Subasta Mercedes-Benz 300 SL Gullwing 1955 | RetroMotors",
                description: "Subasta del icónico Mercedes-Benz 300 SL Alas de Gaviota de 1955. Certificado por Mercedes-Benz Classic Center. Estado inmaculado."
            }
        },
        {
            id: "alfa-romeo-giulia-sprint-gta-1965",
            title: "Alfa Romeo Giulia Sprint GTA 1600 Corsa",
            year: 1965,
            category: "deportivos-europeos",
            categoryName: "Deportivos Europeos",
            era: "1960s",
            origin: "Italia",
            image: "./img/alfaromeo-1965.jpg",
            startingBid: 78000,
            currentBid: 89000,
            bidsCount: 18,
            minIncrement: 500,
            endsInHours: 30,
            status: "active",
            featured: false,
            originalityRating: "9.6 / 10 (Autodelta Auténtico)",
            vin: "AR613840",
            mileage: "31,400 km",
            engine: "4 cilindros Bialbero 1570cc Twin Spark (Doble encendido) - 170 CV",
            transmission: "Manual de 5 marchas aligerada",
            exteriorColor: "Rosso Alfa con adhesivos Quadrifoglio",
            interiorColor: "Butacas de competición época en tela y cuero",
            shortDesc: "Carrocería aligerada en aleación Peraluman 25 (GTA = Gran Turismo Alleggerita) preparada por Autodelta. Campéon del ETCC.",
            fullDescription: "El Giulia GTA fue el arma definitiva de Alfa Romeo para dominar los circuitos europeos en los 60. Ventanillas de plexiglás, llantas de magnesio Campagnolo y culata de doble encendido Twin Spark con dos bujías por cilindro. Conducción analógica y pureza mecánica insuperable.",
            history: "Participó en competencias de clubes históricos en Monza y Mugello con registro en el 'Libro d'Oro' de Alfa Romeo. Homologación FIA de época y mantenimiento riguroso.",
            shippingDetails: "Custodia en cochera técnica especializada. Documentación de importación temporaria y definitiva en regla.",
            bidsHistory: [
                { bidder: "Emiliano Z. (Córdoba)", amount: 89000, time: "Hace 50 minutos" },
                { bidder: "Lautaro F. (CABA)", amount: 87000, time: "Hace 4 horas" }
            ],
            seo: {
                title: "Subasta Alfa Romeo Giulia Sprint GTA 1965 | RetroMotors",
                description: "Subasta online Alfa Romeo Giulia Sprint GTA 1965 Corsa Autodelta original. Ficha técnica, historial y peritaje disponible."
            }
        }
    ],

    // Categorías del catálogo
    categories: [
        { id: "all", name: "Todos los Clásicos", count: 6 },
        { id: "muscle-cars", name: "Muscle Cars Americanos", count: 3 },
        { id: "deportivos-europeos", name: "Deportivos Europeos", count: 2 },
        { id: "gran-turismo", name: "Gran Turismo & Leyendas", count: 1 }
    ],

    // Artículos de Blog / Guías de compra
    blogPosts: [
        {
            id: "guia-verificacion-chasis-matching-numbers",
            title: "Guía Técnica: Cómo verificar el número de chasis y 'Matching Numbers' en autos clásicos",
            date: "20 de Octubre de 2026",
            author: "García, Martín (Curaduría Técnica)",
            readTime: "4 min de lectura",
            summary: "Aprende qué significa que un auto clásico mantenga sus números coincidentes de motor, caja y chasis, y cómo corroborarlo con los registros de fábrica antes de pujar.",
            content: `
                <p>En el coleccionismo automotriz de alto nivel, el término <strong>"Matching Numbers"</strong> es el factor determinante entre un clásico promedio y una joya de inversión. Significa que los componentes mecánicos primarios (bloque de motor, transmisión y tren trasero) son exactamente aquellos con los que el vehículo salió ensamblado de la línea de producción.</p>
                <h3>1. Dónde ubicar los estampados de chasis (VIN)</h3>
                <p>En modelos de los años 60 y 70, la placa VIN suele estar ubicada en el parante del conductor o bajo el parabrisas. Sin embargo, los peritos profesionales siempre verifican el <em>número oculto de seguridad</em> estampado en el cortafuegos o en el larguero del chasis.</p>
                <h3>2. Decodificación de códigos de fundición (Casting Numbers)</h3>
                <p>El bloque del motor contiene un código alfanumérico en relieve que indica el día, mes y año de fundición. Esta fecha debe preceder a la fecha de ensamblado del automóvil por un lapso lógico de 2 a 8 semanas.</p>
                <h3>3. Los informes de registro histórico</h3>
                <p>En RetroMotors, cada lote publicado cuenta con su documentación contrastada con registros oficiales como Marti Reports para Ford, certificados NCRS para Corvettes o certificados de nacimiento expedidos por el museo de la marca.</p>
            `,
            tag: "Guía Técnica"
        },
        {
            id: "regimen-legal-transferencia-autos-historicos",
            title: "Trámites y Transferencia: Marco regulatorio para vehículos históricos de colección",
            date: "14 de Octubre de 2026",
            author: "Sánchez, Lucas (Dirección Técnica)",
            readTime: "3 min de lectura",
            summary: "Conoce los requisitos registrales, peritajes policiales y exenciones impositivas vigentes para patentamiento y transferencia de vehículos con más de 30 años.",
            content: `
                <p>Adquirir un auto clásico en subasta implica comprender su estatus legal. Un vehículo que supera los 30 años de antigüedad califica en la mayoría de las jurisdicciones para el régimen especial de autos históricos o de colección.</p>
                <h3>Pasos para la transferencia segura:</h3>
                <ul>
                    <li><strong>Informe de Dominio Histórico:</strong> Permite certificar que no pesan embargos, inhibiciones ni prendas sobre la unidad.</li>
                    <li><strong>Verificación Física Formulario 12:</strong> Peritos verificadores constatan que la numeración estampada en motor y chasis no posea adulteraciones ni regrabados antirreglamentarios.</li>
                    <li><strong>Cédula de Vehículo Clásico / Histórico:</strong> Permite la circulación en eventos deportivos, exhibiciones y traslados de mantenimiento con seguro especializado de flota de colección.</li>
                </ul>
            `,
            tag: "Trámites y Legal"
        },
        {
            id: "tendencias-revalorizacion-clasicos-2026",
            title: "Informe de Mercado: Las 5 siluetas que más se revalorizaron en subastas este ciclo",
            date: "05 de Octubre de 2026",
            author: "Alvarez, Nicolás (Analítica de Mercado)",
            readTime: "5 min de lectura",
            summary: "Análisis de volumen de transacciones y rentabilidad en subastas de vehículos de las décadas de 1950, 1960 y 1970 comparadas con el mercado tradicional.",
            content: `
                <p>El mercado de vehículos históricos ha demostrado una resiliencia notable como activo refugio y pasión tangible. Según los datos analizados durante el último ejercicio en la plataforma RetroMotors:</p>
                <p>Los coupés de los años 60 con configuración original de tres pedales (caja manual) mostraron un incremento interanual del <strong>14.2%</strong> en su valor promedio de adjudicación. En particular, los modelos con pedigrí deportivo como el <em>Porsche Carrera RS</em> y el <em>Corvette Split-Window</em> lideran las búsquedas con el mayor ratio de pujadores calificados por lote.</p>
            `,
            tag: "Mercado y Tendencias"
        }
    ],

    // Módulos de evidencia técnica y estándares para el CMS
    wcagAuditChecklist: [
        { code: "WCAG 1.1.1", name: "Contenido no textual (Textos ALT)", status: "Cumplido", description: "El 100% de las imágenes de vehículos y logos cuentan con texto alternativo contextual y preciso." },
        { code: "WCAG 1.4.3", name: "Contraste mínimo (4.5:1)", status: "Cumplido", description: "Todos los textos principales y secundarios superan el ratio 4.5:1 exigido en nivel AA." },
        { code: "WCAG 2.1.1", name: "Accesibilidad por teclado", status: "Cumplido", description: "Todos los elementos interactivos, botones de puja y modales son accesibles mediante tecla Tab y Enter." },
        { code: "WCAG 2.4.1", name: "Enlace de salto (Skip Link)", status: "Cumplido", description: "Incorpora enlace visible al recibir foco para saltar directamente al contenido principal." },
        { code: "WCAG 2.4.7", name: "Foco visible", status: "Cumplido", description: "Anillo de foco de alto contraste `:focus-visible` claramente identificable sin distorsionar la estética." },
        { code: "WCAG 3.3.2", name: "Etiquetas e instrucciones", status: "Cumplido", description: "Todos los campos de formulario y montos de puja cuentan con etiquetas `<label for>` asociadas." },
        { code: "WCAG 1.3.1", name: "Estructura semántica (H1-H3)", status: "Cumplido", description: "Jerarquía de encabezados coherente y única por cada vista activa de la aplicación." }
    ],

    // Métricas analíticas de la plataforma
    cmsAnalytics: {
        totalVisitors: 8420,
        activeBidders: 412,
        totalBidsPlaced: 133,
        conversionRate: "4.89%",
        avgAuctionDuration: "3.2 días",
        newsletterSubscribers: 685,
        satisfactionScore: "4.9 / 5"
    }
};

// Exportación global en el objeto window para compatibilidad garantizada
if (typeof window !== 'undefined') {
    window.APP_DATA = APP_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_DATA;
}
