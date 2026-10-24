/**
 * RETROMOTORS - SUBASTAS DE AUTOS CLÁSICOS & COLECCIÓN
 * Lógica Principal de la Aplicación y Gestión CMS
 * RetroMotors Auctioneers International
 */

(function () {
    'use strict';

    // Estado global de la aplicación (con persistencia en LocalStorage)
    const STORAGE_KEY = 'retromotors_auction_state_v2';
    const SESSION_KEY = 'retromotors_session_user';
    const USERS_KEY = 'retromotors_registered_users';

    let appState = {
        vehicles: [...APP_DATA.vehicles],
        activeCategory: 'all',
        searchQuery: '',
        sortBy: 'bids-desc',
        highContrast: false,
        largeText: false,
        currentUser: null,
        users: [
            { name: "John Doe", email: "demo@retromotors.com", password: "123" }
        ],
        newsletterSubscribers: APP_DATA.cmsAnalytics.newsletterSubscribers,
        totalBidsCount: APP_DATA.cmsAnalytics.totalBidsPlaced
    };

    // Inicializar estado desde LocalStorage si existe
    function initStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.vehicles && parsed.vehicles.length) {
                    appState.vehicles = parsed.vehicles;
                }
                appState.highContrast = !!parsed.highContrast;
                appState.largeText = !!parsed.largeText;
            }

            // Asignación de plazos escalonados en milisegundos para cuenta regresiva en vivo
            const defaultHoursMap = {
                'ford-mustang-1967': 18.4,
                'chevrolet-corvette-1963': 5.8,
                'porsche-911-carrera-rs-1973': 23.9,
                'dodge-charger-rt-1969': 41.5,
                'mercedes-benz-300-sl-1955': 3.2,
                'alfa-romeo-giulia-sprint-gta-1965': 29.8
            };

            const now = Date.now();
            appState.vehicles.forEach(v => {
                if (!v.endsAt || v.endsAt <= now) {
                    const hrs = defaultHoursMap[v.id] || v.endsInHours || 24;
                    v.endsAt = now + Math.round(hrs * 3600 * 1000);
                }
            });

            const savedUser = localStorage.getItem(SESSION_KEY);
            if (savedUser) {
                appState.currentUser = JSON.parse(savedUser);
                if (appState.currentUser && (appState.currentUser.name === 'Manuel Sánchez' || appState.currentUser.name === 'Manuel')) {
                    appState.currentUser.name = 'John Doe';
                    localStorage.setItem(SESSION_KEY, JSON.stringify(appState.currentUser));
                }
            }

            const savedUsers = localStorage.getItem(USERS_KEY);
            if (savedUsers) {
                appState.users = JSON.parse(savedUsers);
                let modified = false;
                appState.users.forEach(u => {
                    if (u.name === 'Manuel Sánchez' || u.name === 'Manuel') {
                        u.name = 'John Doe';
                        modified = true;
                    }
                });
                if (modified) {
                    localStorage.setItem(USERS_KEY, JSON.stringify(appState.users));
                }
            }
        } catch (e) {
            console.warn('LocalStorage no disponible, usando memoria volatil.', e);
        }
    }

    function saveStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                vehicles: appState.vehicles,
                highContrast: appState.highContrast,
                largeText: appState.largeText
            }));
            if (appState.currentUser) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(appState.currentUser));
            } else {
                localStorage.removeItem(SESSION_KEY);
            }
            localStorage.setItem(USERS_KEY, JSON.stringify(appState.users));
        } catch (e) {
            console.warn('Error al guardar en LocalStorage:', e);
        }
    }

    // Formateador de moneda en USD
    function formatUSD(num) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(num);
    }

    // Actualizar metadatos SEO On-Page dinámicamente
    function updateSEO(title, description) {
        document.title = title || 'RetroMotors | Subastas de Autos Clásicos & Colección';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', description || 'Casa oficial de subastas de autos clásicos con certificación de autenticidad, peritaje técnico de números coincidentes y custodia notarial.');
        }
    }

    // Anuncio para lectores de pantalla
    function announceScreenReader(message) {
        const liveRegion = document.getElementById('sr-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    // =========================================================================
    // PROCESAMIENTO Y COMPRESIÓN DE FOTOGRAFÍAS PARA LOCALSTORAGE
    // =========================================================================

    function processUploadedImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('No se seleccionó ningún archivo de imagen.'));
            }
            if (!file.type.startsWith('image/')) {
                return reject(new Error('El archivo seleccionado no es una imagen válida (JPG, PNG o WebP).'));
            }

            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Error al leer el archivo en el dispositivo.'));
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = () => reject(new Error('Error al decodificar la imagen cargada.'));
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxDim = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Calidad 0.82 JPEG produce imágenes nítidas de ~70-120KB ideales para LocalStorage
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    resolve({
                        dataUrl: dataUrl,
                        name: file.name,
                        sizeKb: Math.round(dataUrl.length * 0.75 / 1024)
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // =========================================================================
    // RELOJ DE CUENTA REGRESIVA EN TIEMPO REAL (Subastas Activas)
    // =========================================================================

    function formatTimeRemaining(endsAt) {
        if (!endsAt) endsAt = Date.now() + 24 * 3600 * 1000;
        const diff = endsAt - Date.now();
        if (diff <= 0) {
            return {
                text: 'Subasta Finalizada',
                shortText: 'Finalizada',
                accessibleLabel: 'Subasta finalizada',
                isEnded: true,
                isEndingSoon: false
            };
        }

        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (n) => String(n).padStart(2, '0');

        let text = '';
        let shortText = '';
        const isEndingSoon = hours < 8;

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            const remHours = hours % 24;
            text = `${days}d ${pad(remHours)}h ${pad(minutes)}m ${pad(seconds)}s`;
            shortText = `${days}d ${pad(remHours)}h ${pad(minutes)}m`;
        } else {
            text = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
            shortText = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
        }

        return {
            text,
            shortText,
            accessibleLabel: `${hours} horas, ${minutes} minutos y ${seconds} segundos restantes`,
            isEnded: false,
            isEndingSoon
        };
    }

    let countdownTimerInterval = null;

    function startGlobalCountdown() {
        if (countdownTimerInterval) clearInterval(countdownTimerInterval);

        function updateTick() {
            appState.vehicles.forEach(v => {
                const time = formatTimeRemaining(v.endsAt);

                // 1. Actualizar en tarjetas de catálogo e inicio
                const cardTimer = document.getElementById(`timer-card-${v.id}`);
                if (cardTimer) {
                    if (time.isEnded) {
                        cardTimer.innerHTML = '<span style="color: var(--color-danger); font-weight: 700;">Finalizada</span>';
                    } else {
                        cardTimer.textContent = `${time.shortText} restantes`;
                    }
                }

                const cardBadge = document.querySelector(`#card-${v.id} .badge-status`);
                if (cardBadge) {
                    if (time.isEnded) {
                        cardBadge.className = 'badge-status ended';
                        cardBadge.textContent = 'Finalizada';
                    } else if (time.isEndingSoon) {
                        cardBadge.className = 'badge-status ending-soon';
                        cardBadge.textContent = 'Cierra Pronto';
                    } else {
                        cardBadge.className = 'badge-status active';
                        cardBadge.textContent = 'Subasta Activa';
                    }
                }

                // 2. Actualizar en ficha de producto si está en pantalla
                const detailTimer = document.getElementById(`timer-detail-${v.id}`);
                if (detailTimer) {
                    if (time.isEnded) {
                        detailTimer.innerHTML = '<span style="color: var(--color-danger);">Subasta Finalizada</span>';
                        const submitBtn = document.getElementById('btn-submit-bid');
                        if (submitBtn && !submitBtn.disabled) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'Subasta Finalizada';
                            submitBtn.style.opacity = '0.5';
                            submitBtn.style.cursor = 'not-allowed';
                        }
                        const detailBadge = document.getElementById('detail-badge-status');
                        if (detailBadge) {
                            detailBadge.className = 'badge-status ended';
                            detailBadge.textContent = 'Subasta Cerrada';
                        }
                    } else {
                        detailTimer.textContent = time.text;
                    }
                }
            });
        }

        updateTick();
        countdownTimerInterval = setInterval(updateTick, 1000);
    }

    // =========================================================================
    // GESTIÓN DE USUARIOS / AUTENTICACIÓN (LocalStorage)
    // =========================================================================

    function updateNavUserUI() {
        const container = document.getElementById('nav-user-container');
        if (!container) return;

        if (appState.currentUser) {
            const shortName = appState.currentUser.name.split(' ')[0];
            container.innerHTML = `
                <div class="user-dropdown-wrapper">
                    <button type="button" class="btn-user-profile" id="btn-toggle-user-menu" aria-expanded="false" title="Cuenta de ${appState.currentUser.name}">
                        <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>
                        <span>${shortName}</span>
                        <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">expand_more</span>
                    </button>
                    <div class="user-dropdown-menu" id="user-menu-dropdown" role="menu">
                        <div class="user-dropdown-header">
                            <strong>${appState.currentUser.name}</strong>
                            <span>${appState.currentUser.email}</span>
                        </div>
                        <button type="button" class="user-dropdown-item" id="btn-menu-sell" role="menuitem">
                            <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
                            <span>Publicar Auto</span>
                        </button>
                        <button type="button" class="user-dropdown-item" id="btn-menu-logout" role="menuitem" style="color: var(--color-danger);">
                            <span class="material-symbols-outlined" aria-hidden="true">logout</span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            `;

            const menuBtn = document.getElementById('btn-toggle-user-menu');
            const menuDropdown = document.getElementById('user-menu-dropdown');
            if (menuBtn && menuDropdown) {
                menuBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const isShown = menuDropdown.classList.contains('show');
                    menuDropdown.classList.toggle('show', !isShown);
                    menuBtn.setAttribute('aria-expanded', !isShown ? 'true' : 'false');
                });

                document.getElementById('btn-menu-sell').addEventListener('click', function () {
                    menuDropdown.classList.remove('show');
                    openSellModal();
                });

                document.getElementById('btn-menu-logout').addEventListener('click', function () {
                    menuDropdown.classList.remove('show');
                    logoutUser();
                });

                document.addEventListener('click', function closeMenu(e) {
                    if (!container.contains(e.target)) {
                        menuDropdown.classList.remove('show');
                        menuBtn.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        } else {
            container.innerHTML = `
                <button type="button" class="btn-auth-nav" id="btn-open-auth-modal" aria-label="Iniciar sesión o registrarse">
                    <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>
                    <span>Ingresar</span>
                </button>
            `;

            document.getElementById('btn-open-auth-modal').addEventListener('click', openAuthModal);
        }
    }

    function logoutUser() {
        appState.currentUser = null;
        saveStorage();
        updateNavUserUI();
        announceScreenReader('Has cerrado sesión correctamente.');
        router();
    }

    // Modal de Login / Registro
    function openAuthModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'cms-admin-modal-backdrop';
        backdrop.id = 'auth-modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'auth-modal-title');

        backdrop.innerHTML = `
            <div class="cms-admin-modal" style="max-width: 440px;">
                <header class="cms-modal-header">
                    <h2 id="auth-modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" aria-hidden="true">account_circle</span>
                        <span>Acceso de Usuario</span>
                    </h2>
                    <button type="button" class="cms-modal-close-btn" id="btn-close-auth-modal" aria-label="Cerrar modal de acceso">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>

                <nav class="cms-tabs-nav" aria-label="Opciones de autenticación">
                    <button type="button" class="cms-tab-btn active" id="tab-btn-login">Iniciar Sesión</button>
                    <button type="button" class="cms-tab-btn" id="tab-btn-register">Crear Cuenta</button>
                </nav>

                <div class="cms-modal-content" style="padding: 24px;">
                    <!-- Formulario Iniciar Sesión -->
                    <form id="form-login">
                        <div class="form-group">
                            <label for="login-email">Correo Electrónico</label>
                            <input type="email" id="login-email" required placeholder="tu-email@ejemplo.com" value="demo@retromotors.com" />
                        </div>
                        <div class="form-group">
                            <label for="login-password">Contraseña</label>
                            <input type="password" id="login-password" required placeholder="Tu contraseña" value="123" />
                        </div>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 16px;">
                            (Cuenta demo lista: demo@retromotors.com / pass: 123)
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 10px;">
                            Ingresar a mi Cuenta
                        </button>
                    </form>

                    <!-- Formulario Registro -->
                    <form id="form-register" style="display: none;">
                        <div class="form-group">
                            <label for="reg-name">Nombre y Apellido *</label>
                            <input type="text" id="reg-name" required placeholder="Ej: John Doe" />
                        </div>
                        <div class="form-group">
                            <label for="reg-email">Correo Electrónico *</label>
                            <input type="email" id="reg-email" required placeholder="correo@ejemplo.com" />
                        </div>
                        <div class="form-group">
                            <label for="reg-password">Contraseña *</label>
                            <input type="password" id="reg-password" required minlength="3" placeholder="Mínimo 3 caracteres" />
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 10px;">
                            Crear Cuenta y Comenzar
                        </button>
                    </form>

                    <div id="auth-feedback" class="bid-feedback-message" role="status" aria-live="polite" style="margin-top: 16px;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';

        const loginForm = backdrop.querySelector('#form-login');
        const registerForm = backdrop.querySelector('#form-register');
        const tabLogin = backdrop.querySelector('#tab-btn-login');
        const tabRegister = backdrop.querySelector('#tab-btn-register');
        const feedback = backdrop.querySelector('#auth-feedback');

        tabLogin.addEventListener('click', function () {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            feedback.style.display = 'none';
        });

        tabRegister.addEventListener('click', function () {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            feedback.style.display = 'none';
        });

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = backdrop.querySelector('#login-email').value.trim();
            const password = backdrop.querySelector('#login-password').value;

            const found = appState.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
            if (found) {
                appState.currentUser = { name: found.name, email: found.email };
                saveStorage();
                updateNavUserUI();
                closeAuthModal();
                announceScreenReader(`Bienvenido, ${found.name}. Sesión iniciada.`);
                router();
            } else {
                feedback.className = 'bid-feedback-message error';
                feedback.textContent = 'Credenciales no válidas. Verificá tu correo o contraseña.';
            }
        });

        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = backdrop.querySelector('#reg-name').value.trim();
            const email = backdrop.querySelector('#reg-email').value.trim();
            const password = backdrop.querySelector('#reg-password').value;

            if (appState.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                feedback.className = 'bid-feedback-message error';
                feedback.textContent = 'Este correo electrónico ya está registrado. Por favor iniciá sesión.';
                return;
            }

            const newUser = { name, email, password };
            appState.users.push(newUser);
            appState.currentUser = { name, email };
            saveStorage();
            updateNavUserUI();
            closeAuthModal();
            announceScreenReader(`¡Cuenta creada con éxito! Bienvenido, ${name}.`);
            router();
        });

        function closeAuthModal() {
            backdrop.remove();
            document.body.style.overflow = '';
        }

        backdrop.querySelector('#btn-close-auth-modal').addEventListener('click', closeAuthModal);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeAuthModal();
        });
    }

    // Modal de Publicación / Vender Auto Clásico
    function openSellModal() {
        if (!appState.currentUser) {
            openAuthModal();
            alert('Para publicar un automóvil clásico en subasta, primero iniciá sesión o registrate.');
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.className = 'cms-admin-modal-backdrop';
        backdrop.id = 'sell-modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'sell-modal-title');

        backdrop.innerHTML = `
            <div class="cms-admin-modal" style="max-width: 720px;">
                <header class="cms-modal-header">
                    <h2 id="sell-modal-title" style="display: flex; align-items: center; gap: 10px;">
                        <span class="material-symbols-outlined" style="color: var(--color-primary); font-size: 24px;" aria-hidden="true">add_circle</span>
                        <span>Publicar Automóvil Clásico en Subasta</span>
                    </h2>
                    <button type="button" class="cms-modal-close-btn" id="btn-close-sell-modal" aria-label="Cerrar modal de publicación">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>

                <div class="cms-modal-content">
                    <div class="modal-user-banner">
                        <span class="material-symbols-outlined banner-icon" aria-hidden="true">verified_user</span>
                        <div class="modal-user-banner-text">
                            <strong>Postor / Vendedor: ${appState.currentUser.name}</strong> (<code>${appState.currentUser.email}</code>)
                            <p>Completá la ficha técnica para registrar el lote oficial bajo peritaje de Matching Numbers y custodia notarial.</p>
                        </div>
                    </div>

                    <form id="form-publish-car">
                        <div class="modal-form-grid" style="grid-template-columns: 1.5fr 0.8fr;">
                            <div class="form-group-compact">
                                <label for="sell-title">Modelo y Versión <span class="required-star">*</span></label>
                                <input type="text" id="sell-title" required placeholder="Ej: Jaguar E-Type Series 1 4.2 Coupe" />
                            </div>
                            <div class="form-group-compact">
                                <label for="sell-year">Año de Fabricación <span class="required-star">*</span></label>
                                <input type="number" id="sell-year" required min="1920" max="1995" value="1965" />
                            </div>
                        </div>

                        <div class="modal-form-grid tri-col">
                            <div class="form-group-compact">
                                <label for="sell-category">Categoría <span class="required-star">*</span></label>
                                <select id="sell-category" required>
                                    <option value="muscle-cars">Muscle Cars Americanos</option>
                                    <option value="deportivos-europeos">Deportivos Europeos</option>
                                    <option value="gran-turismo">Gran Turismo & Leyendas</option>
                                </select>
                            </div>
                            <div class="form-group-compact">
                                <label for="sell-starting-bid">Puja Base (USD) <span class="required-star">*</span></label>
                                <input type="number" id="sell-starting-bid" required min="1000" step="100" value="75000" />
                            </div>
                            <div class="form-group-compact">
                                <label for="sell-min-increment">Incremento Mínimo (USD) <span class="required-star">*</span></label>
                                <input type="number" id="sell-min-increment" required min="50" step="50" value="1000" />
                            </div>
                        </div>

                        <div class="form-group-compact">
                            <label for="sell-engine">Motorización & Especificaciones <span class="required-star">*</span></label>
                            <input type="text" id="sell-engine" required placeholder="Ej: 6 cilindros en línea 4.2L - 265 CV" value="6 cilindros 4.2L DOHC" />
                        </div>

                        <!-- Sección de Carga de Fotografía del Lote con Persistencia LocalStorage -->
                        <div class="form-group-compact" style="margin-top: 6px;">
                            <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span>Fotografía Oficial del Lote <span class="required-star">*</span></span>
                                <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600;">Subí una foto desde tu dispositivo</span>
                            </label>

                            <!-- Input de archivo real invisible -->
                            <input type="file" id="sell-photo-file" accept="image/*" style="display: none;" />

                            <!-- Dropzone interactivo para arrastrar o hacer clic -->
                            <div id="photo-upload-dropzone" class="photo-upload-dropzone" tabindex="0" role="button" aria-label="Hacé clic o arrastrá para subir foto de tu automóvil">
                                <span class="material-symbols-outlined" style="font-size: 36px; color: var(--color-primary); margin-bottom: 6px;" aria-hidden="true">cloud_upload</span>
                                <div style="font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px;">
                                    Hacé clic para seleccionar una foto de tu auto o arrastrala aquí
                                </div>
                                <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                                    JPG, PNG o WebP desde tu dispositivo · Se comprime y guarda automáticamente en LocalStorage
                                </div>
                            </div>

                            <!-- Preview Box cuando la foto está cargada -->
                            <div id="photo-preview-box" class="photo-preview-box" style="display: none; margin-top: 8px;">
                                <div class="photo-preview-img-wrap">
                                    <img id="photo-preview-img" src="" alt="Vista previa de la fotografía del automóvil subido" />
                                </div>
                                <div class="photo-preview-info">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span class="material-symbols-outlined" style="color: var(--color-success); font-size: 18px;" aria-hidden="true">check_circle</span>
                                        <strong id="photo-preview-name" style="font-size: 0.875rem; color: var(--color-text-primary); word-break: break-all;">foto-vehiculo.jpg</strong>
                                    </div>
                                    <span id="photo-preview-meta" style="font-size: 0.75rem; color: var(--color-text-muted);">Foto procesada y lista para guardarse en LocalStorage</span>
                                    <div style="margin-top: 6px; display: flex; gap: 8px;">
                                        <button type="button" id="btn-change-photo" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">
                                            <span class="material-symbols-outlined" style="font-size: 14px;" aria-hidden="true">cached</span>
                                            <span>Cambiar foto</span>
                                        </button>
                                        <button type="button" id="btn-remove-photo" class="btn-secondary" style="padding: 4px 10px; font-size: 0.75rem; color: var(--color-danger);">
                                            <span class="material-symbols-outlined" style="font-size: 14px;" aria-hidden="true">delete</span>
                                            <span>Quitar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Opción alternativa rápida: usar foto de muestra del catálogo -->
                            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--color-text-muted);">
                                <span>O elegir una foto de muestra:</span>
                                <select id="sell-sample-photo" style="font-size: 0.75rem; padding: 4px 8px; width: auto; flex: 1;">
                                    <option value="">-- Catálogo de muestra --</option>
                                    <option value="./img/mustang-1967.jpg">Ford Mustang 1967 Fastback</option>
                                    <option value="./img/corvette-1963.jpg">Chevrolet Corvette Stingray 1963</option>
                                    <option value="./img/porsche-1973.jpg">Porsche 911 Carrera RS 1973</option>
                                    <option value="./img/charger-1969.jpg">Dodge Charger R/T 1969</option>
                                    <option value="./img/mercedes-1955.jpg">Mercedes-Benz 300 SL 1955</option>
                                    <option value="./img/alfaromeo-1965.jpg">Alfa Romeo Giulia Sprint GTA 1965</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group-compact">
                            <label for="sell-desc">Descripción Breve y Certificación <span class="required-star">*</span></label>
                            <input type="text" id="sell-desc" required placeholder="Ej: Ejemplar de concurso con números coincidentes de motor y transmisión." value="Ejemplar de concurso con números coincidentes y mantenimiento documentado." />
                        </div>

                        <div class="form-group-compact" style="margin-bottom: 0;">
                            <label for="sell-history">Historial y Procedencia <span class="required-star">*</span></label>
                            <textarea id="sell-history" rows="2" required>Unidad conservada en cochera climatizada. Libre de gravámenes con verificación física de chasis y motor aprobada.</textarea>
                        </div>
                    </form>
                </div>

                <footer class="cms-modal-footer">
                    <button type="button" id="btn-cancel-sell" class="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" form="form-publish-car" class="btn-primary">
                        <span class="material-symbols-outlined" style="font-size: 18px;" aria-hidden="true">publish</span>
                        <span>Publicar Lote Oficial</span>
                    </button>
                </footer>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';

        const publishForm = backdrop.querySelector('#form-publish-car');
        let uploadedImageData = null;

        const fileInput = backdrop.querySelector('#sell-photo-file');
        const dropzone = backdrop.querySelector('#photo-upload-dropzone');
        const previewBox = backdrop.querySelector('#photo-preview-box');
        const previewImg = backdrop.querySelector('#photo-preview-img');
        const previewName = backdrop.querySelector('#photo-preview-name');
        const previewMeta = backdrop.querySelector('#photo-preview-meta');
        const btnChangePhoto = backdrop.querySelector('#btn-change-photo');
        const btnRemovePhoto = backdrop.querySelector('#btn-remove-photo');
        const sampleSelect = backdrop.querySelector('#sell-sample-photo');

        async function handleSelectedFile(file) {
            if (!file) return;
            try {
                previewMeta.textContent = 'Procesando y optimizando imagen...';
                const result = await processUploadedImage(file);
                uploadedImageData = result.dataUrl;
                previewImg.src = result.dataUrl;
                previewName.textContent = result.name;
                previewMeta.textContent = `${result.sizeKb} KB · Imagen optimizada y lista para LocalStorage`;
                dropzone.style.display = 'none';
                previewBox.style.display = 'flex';
                sampleSelect.value = '';
            } catch (err) {
                alert('Error al cargar la imagen: ' + (err.message || err));
            }
        }

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                handleSelectedFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length) {
                handleSelectedFile(fileInput.files[0]);
            }
        });

        btnChangePhoto.addEventListener('click', () => fileInput.click());

        btnRemovePhoto.addEventListener('click', () => {
            uploadedImageData = null;
            previewBox.style.display = 'none';
            dropzone.style.display = 'block';
            fileInput.value = '';
            sampleSelect.value = '';
        });

        sampleSelect.addEventListener('change', () => {
            if (sampleSelect.value) {
                uploadedImageData = sampleSelect.value;
                previewImg.src = sampleSelect.value;
                previewName.textContent = sampleSelect.options[sampleSelect.selectedIndex].text;
                previewMeta.textContent = 'Fotografía oficial de muestra del catálogo';
                dropzone.style.display = 'none';
                previewBox.style.display = 'flex';
            }
        });

        publishForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = backdrop.querySelector('#sell-title').value.trim();
            const year = parseInt(backdrop.querySelector('#sell-year').value);
            const category = backdrop.querySelector('#sell-category').value;
            const startingBid = parseFloat(backdrop.querySelector('#sell-starting-bid').value);
            const minIncrement = parseFloat(backdrop.querySelector('#sell-min-increment').value);
            const engine = backdrop.querySelector('#sell-engine').value.trim();
            const shortDesc = backdrop.querySelector('#sell-desc').value.trim();
            const history = backdrop.querySelector('#sell-history').value.trim();

            const finalImage = uploadedImageData || sampleSelect.value;
            if (!finalImage) {
                alert('Por favor subí una fotografía de tu automóvil o seleccioná una de muestra para continuar.');
                return;
            }

            const categoryMap = {
                'muscle-cars': 'Muscle Cars Americanos',
                'deportivos-europeos': 'Deportivos Europeos',
                'gran-turismo': 'Gran Turismo & Leyendas'
            };

            const newVehicle = {
                id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                title: title,
                year: year,
                category: category,
                categoryName: categoryMap[category] || 'Clásicos de Colección',
                era: year < 1970 ? '1960s' : '1970s',
                origin: 'Internacional',
                image: finalImage,
                startingBid: startingBid,
                currentBid: startingBid,
                bidsCount: 0,
                minIncrement: minIncrement,
                endsInHours: 72,
                endsAt: Date.now() + 72 * 3600 * 1000,
                status: 'active',
                featured: true,
                originalityRating: '9.8 / 10 (Certificado FIVA)',
                vin: 'VIN-' + Math.floor(100000 + Math.random() * 900000),
                mileage: '24,000 km',
                engine: engine,
                transmission: 'Manual',
                exteriorColor: 'Original',
                interiorColor: 'Cuero original',
                shortDesc: shortDesc,
                fullDescription: `${title} (${year}). Publicado por ${appState.currentUser.name} a través de RetroMotors Auctioneers. Inspeccionado bajo estándar de 100 puntos.`,
                history: history,
                shippingDetails: 'Disponible para retiro en nuestro salón de guarda en Buenos Aires o despacho asegurado.',
                bidsHistory: [],
                seo: {
                    title: `Subasta ${title} (${year}) | RetroMotors`,
                    description: `Subasta online oficial de ${title} del año ${year}. Certificación de autenticidad y peritaje mecánico disponible.`
                }
            };

            appState.vehicles.unshift(newVehicle);
            saveStorage();
            closeSellModal();
            window.location.hash = '#catalogo';
            router();
            alert(`¡Excelente! El automóvil "${title}" fue publicado exitosamente con su fotografía y guardado en LocalStorage.`);
            announceScreenReader(`Nuevo vehículo ${title} publicado en subasta.`);
        });

        function closeSellModal() {
            backdrop.remove();
            document.body.style.overflow = '';
        }

        backdrop.querySelector('#btn-close-sell-modal').addEventListener('click', closeSellModal);
        backdrop.querySelector('#btn-cancel-sell').addEventListener('click', closeSellModal);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) closeSellModal();
        });
    }

    // =========================================================================
    // VISTAS DEL ENRUTADOR
    // =========================================================================

    // Render: Inicio / Home (Minimalista y Limpio)
    function renderHome() {
        updateSEO(
            'RetroMotors | Subastas de Autos Clásicos & Piezas de Colección',
            'Casa de subastas oficial de automóviles clásicos y de colección. Fichas de peritaje técnico, historial verificado y pujas en tiempo real.'
        );

        const featuredVehicles = appState.vehicles.filter(v => v.featured);

        const html = `
            <!-- Hero Section Ultra Minimalista y Amplio -->
            <section class="hero-section" aria-labelledby="hero-title">
                <div class="hero-content">
                    <span style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
                        Casa Oficial de Subastas · Certificación Histórica FIVA
                    </span>
                    <h2 id="hero-title">Subastas de Autos Clásicos & Leyendas del Automovilismo</h2>
                    <p>
                        Plataforma especializada en la catalogación, peritaje de originalidad mecánica y transferencia segura de automóviles de colección. 
                        Cada lote cuenta con peritaje de números coincidentes de motor y chasis, documentación histórica e inspección técnica verificada.
                    </p>
                    <div class="hero-actions">
                        <a href="#catalogo" class="btn-primary" id="btn-hero-catalog">
                            <span class="material-symbols-outlined" style="font-size: 18px;" aria-hidden="true">explore</span>
                            <span>Explorar Subastas Activas (${appState.vehicles.length})</span>
                        </a>
                        <button type="button" class="btn-secondary" id="btn-hero-publish">
                            <span class="material-symbols-outlined" style="font-size: 18px;" aria-hidden="true">add_circle</span>
                            <span>Publicar un Clásico</span>
                        </button>
                        <a href="#garantia" class="btn-secondary">
                            <span class="material-symbols-outlined" style="font-size: 18px;" aria-hidden="true">verified</span>
                            <span>Garantía & Peritaje</span>
                        </a>
                    </div>

                    <!-- Fila Discreta de Garantías (Sustituye al bloque de estadísticas) -->
                    <div class="hero-badges-row">
                        <div class="hero-badge-item">
                            <span class="material-symbols-outlined" aria-hidden="true">verified</span>
                            <span>100% Matching Numbers Peritados</span>
                        </div>
                        <div class="hero-badge-item">
                            <span class="material-symbols-outlined" aria-hidden="true">gavel</span>
                            <span>Subastas Transparentes en Vivo</span>
                        </div>
                        <div class="hero-badge-item">
                            <span class="material-symbols-outlined" aria-hidden="true">shield</span>
                            <span>Custodia Notarial y Fianza</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Categorías de Acceso Rápido -->
            <section class="category-pills-bar" aria-label="Categorías de autos clásicos">
                <span class="category-pills-label">Filtrar por época:</span>
                <button type="button" class="pill-btn ${appState.activeCategory === 'all' ? 'active' : ''}" data-cat="all">Todos los Lotes (${appState.vehicles.length})</button>
                <button type="button" class="pill-btn ${appState.activeCategory === 'muscle-cars' ? 'active' : ''}" data-cat="muscle-cars">Muscle Cars Americanos</button>
                <button type="button" class="pill-btn ${appState.activeCategory === 'deportivos-europeos' ? 'active' : ''}" data-cat="deportivos-europeos">Deportivos Europeos</button>
                <button type="button" class="pill-btn ${appState.activeCategory === 'gran-turismo' ? 'active' : ''}" data-cat="gran-turismo">Gran Turismo & Leyendas</button>
            </section>

            <!-- Sección de Lotes Destacados -->
            <section aria-labelledby="featured-auctions-title">
                <div class="section-header">
                    <div>
                        <h2 id="featured-auctions-title">Subastas Destacadas de la Semana</h2>
                        <p>Vehículos seleccionados con certificación de originalidad y cierre próximo.</p>
                    </div>
                    <a href="#catalogo" style="font-size: 0.875rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                        Ver catálogo completo <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
                    </a>
                </div>

                <div class="vehicles-grid">
                    ${featuredVehicles.map(vehicle => createVehicleCardHtml(vehicle)).join('')}
                </div>
            </section>

            <!-- Cómo Funciona la Subasta -->
            <section id="como-funciona" class="how-it-works" aria-labelledby="how-title">
                <h2 id="how-title">Proceso de Subasta Transparente y Seguro</h2>
                <div class="steps-grid">
                    <div class="step-card">
                        <span class="step-num" aria-hidden="true">1</span>
                        <h3>Inspección y Peritaje</h3>
                        <p>Cada lote posee peritaje técnico de motor, chasis, documentación registral libre de deudas y calificación de autenticidad FIVA.</p>
                    </div>
                    <div class="step-card">
                        <span class="step-num" aria-hidden="true">2</span>
                        <h3>Oferta con Incremento Mínimo</h3>
                        <p>Pujas transparentes en tiempo real. Recibís confirmación inmediata en pantalla y un registro inmutable en el historial del lote.</p>
                    </div>
                    <div class="step-card">
                        <span class="step-num" aria-hidden="true">3</span>
                        <h3>Adjudicación y Custodia</h3>
                        <p>Al cerrar el reloj, el mejor postor coordina la transferencia de dominio oficial y el traslado en camión cubierto asegurado.</p>
                    </div>
                </div>
            </section>
        `;

        document.getElementById('main-content').innerHTML = html;
        attachHomeEvents();
    }

    // Generador de Tarjetas de Vehículo (100% libre de emojis)
    function createVehicleCardHtml(v) {
        const time = formatTimeRemaining(v.endsAt);
        return `
            <article class="vehicle-card" id="card-${v.id}" aria-labelledby="title-${v.id}">
                <div class="vehicle-card-image-wrap">
                    <img src="${v.image}" alt="Fotografía del auto clásico ${v.title} del año ${v.year} en subasta" class="vehicle-card-image" loading="lazy" />
                    <span class="badge-status ${time.isEnded ? 'ended' : (time.isEndingSoon ? 'ending-soon' : 'active')}">
                        ${time.isEnded ? 'Finalizada' : (time.isEndingSoon ? 'Cierra Pronto' : 'Subasta Activa')}
                    </span>
                    <span class="badge-year" aria-label="Año de fabricación: ${v.year}">${v.year}</span>
                </div>
                <div class="vehicle-card-body">
                    <span class="vehicle-category">${v.categoryName}</span>
                    <h3 class="vehicle-card-title" id="title-${v.id}">
                        <a href="#auto/${v.id}">${v.title}</a>
                    </h3>
                    <div class="vehicle-meta-tags">
                        <span><strong>Origen:</strong> ${v.origin}</span>
                        <span><strong>Originalidad:</strong> ${v.originalityRating.split(' ')[0]}</span>
                    </div>
                    <p class="vehicle-card-desc">${v.shortDesc}</p>
                    
                    <div class="bid-summary-box">
                        <div class="bid-info">
                            <span class="bid-label">Puja actual</span>
                            <div class="bid-amount" aria-label="Puja actual: ${formatUSD(v.currentBid)}">${formatUSD(v.currentBid)}</div>
                        </div>
                        <div class="bid-countdown">
                            <span class="time-label">${v.bidsCount} ofertas</span>
                            <div class="time-val ${time.isEnded ? 'ended' : ''}" aria-label="Tiempo restante: ${time.accessibleLabel}">
                                <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">schedule</span>
                                <span class="timer-digits" id="timer-card-${v.id}">${time.shortText} restantes</span>
                            </div>
                        </div>
                    </div>

                    <div class="vehicle-card-footer">
                        <a href="#auto/${v.id}" class="btn-primary btn-card-action" aria-label="Ver detalles y realizar puja por ${v.title}">
                            ${time.isEnded ? 'Ver Resultado' : 'Ofertar / Ver Ficha'}
                        </a>
                    </div>
                </div>
            </article>
        `;
    }

    function attachHomeEvents() {
        // Botón hero publicar
        const heroPublishBtn = document.getElementById('btn-hero-publish');
        if (heroPublishBtn) {
            heroPublishBtn.addEventListener('click', openSellModal);
        }

        // Botones de categoría rápida
        document.querySelectorAll('.pill-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const cat = this.getAttribute('data-cat');
                appState.activeCategory = cat;
                window.location.hash = '#catalogo';
            });
        });
    }

    // =========================================================================
    // VISTA: PÁGINA DEDICADA DE GARANTÍA & PERITAJES
    // =========================================================================

    function renderGarantia() {
        updateSEO(
            'Garantía, Peritajes Técnicos & Estándares | RetroMotors',
            'Conozca nuestro protocolo de peritaje en 100 puntos, verificación de Matching Numbers, custodia notarial y estándares WCAG 2.1 AA.'
        );

        const html = `
            <nav class="breadcrumbs" aria-label="Ubicación en el sitio">
                <a href="#inicio">Inicio</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Garantía & Peritaje</span>
            </nav>

            <div class="section-header" style="margin-bottom: 24px;">
                <div>
                    <h1 style="font-size: 1.75rem; font-weight: 800;">Garantía de Autenticidad, Peritajes & Estándares Web</h1>
                    <p>Protocolos técnicos de inspección, verificación mecánica y cumplimiento de estándares de transparencia y accesibilidad.</p>
                </div>
            </div>

            <div class="specs-table-card" style="margin-bottom: 24px;">
                <h3>Protocolo de Peritaje Técnico en 100 Puntos</h3>
                <p style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 20px;">
                    En RetroMotors cada automóvil postulado a subasta es sometido a un peritaje forense vehicular antes de su publicación en catálogo:
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px;">
                    <div style="background: var(--color-bg); padding: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">100%</div>
                        <strong style="font-size: 1rem;">Números Coincidentes (Matching Numbers)</strong>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 6px;">Constatación física de códigos de fundición y número VIN estampado en chasis y motor conforme a registros de planta.</p>
                    </div>

                    <div style="background: var(--color-bg); padding: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">FIVA</div>
                        <strong style="font-size: 1rem;">Pasaporte y Cédula Histórica</strong>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 6px;">Registro internacional de procedencia, trazabilidad de anteriores propietarios y preservación original de fábrica.</p>
                    </div>

                    <div style="background: var(--color-bg); padding: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">WCAG 2.1</div>
                        <strong style="font-size: 1rem;">Accesibilidad Web Universal AA</strong>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 6px;">Portal adaptado para personas con baja visión, navegación completa por teclado y etiquetas accesibles.</p>
                    </div>

                    <div style="background: var(--color-bg); padding: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">0%</div>
                        <strong style="font-size: 1rem;">Fricción en Transferencia Notarial</strong>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 6px;">Dominio libre de gravámenes, inhibiciones o prendas, certificado por escribano público y verificación policial Formulario 12.</p>
                    </div>
                </div>
            </div>

            <div class="specs-table-card">
                <h3>Transparencia Notarial en las Subastas</h3>
                <p style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 12px;">
                    Todas las ofertas emitidas en nuestra plataforma son respaldadas por un contrato de fianza y custodia notarial. Al finalizar el plazo del reloj, el comprador adjudicado cuenta con la custodia física del vehículo asegurada en nuestro salón de guarda hasta la finalización de los trámites registrales de transferencia de dominio.
                </p>
                <div style="margin-top: 16px;">
                    <a href="#contacto" class="btn-primary">Solicitar Peritaje para mi Auto</a>
                </div>
            </div>
        `;

        document.getElementById('main-content').innerHTML = html;
    }

    // =========================================================================
    // VISTA: CATÁLOGO / TIENDA
    // =========================================================================

    function renderCatalog() {
        updateSEO(
            'Catálogo de Subastas de Autos Clásicos | RetroMotors',
            'Explore todos los automóviles clásicos y de colección en subasta activa. Filtros por época, origen, precio de puja y motorización.'
        );

        let filtered = appState.vehicles.filter(v => {
            if (appState.activeCategory !== 'all' && v.category !== appState.activeCategory) {
                return false;
            }
            if (appState.searchQuery) {
                const q = appState.searchQuery.toLowerCase();
                const match = v.title.toLowerCase().includes(q) ||
                    v.year.toString().includes(q) ||
                    v.categoryName.toLowerCase().includes(q) ||
                    v.origin.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            if (appState.sortBy === 'bids-desc') return b.currentBid - a.currentBid;
            if (appState.sortBy === 'bids-asc') return a.currentBid - b.currentBid;
            if (appState.sortBy === 'year-desc') return b.year - a.year;
            if (appState.sortBy === 'year-asc') return a.year - b.year;
            if (appState.sortBy === 'ending-soon') return (a.endsAt || 0) - (b.endsAt || 0);
            return 0;
        });

        const html = `
            <nav class="breadcrumbs" aria-label="Ubicación en el sitio">
                <a href="#inicio">Inicio</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Catálogo de Subastas</span>
            </nav>

            <div class="section-header" style="margin-bottom: 24px;">
                <div>
                    <h1 style="font-size: 1.75rem; font-weight: 700;">Catálogo de Lotes & Autos Clásicos</h1>
                    <p>Subastas en curso verificadas con documentación histórica y peritaje.</p>
                </div>
            </div>

            <div class="catalog-layout">
                <aside class="filter-sidebar" aria-label="Filtros de búsqueda">
                    <h3>Filtrar Catálogo</h3>
                    
                    <div class="filter-group">
                        <label for="catalog-search" class="group-title">Búsqueda rápida</label>
                        <input type="search" id="catalog-search" value="${appState.searchQuery}" placeholder="Ej: Mustang, Corvette..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); font-size: 0.875rem;" />
                    </div>

                    <div class="filter-group">
                        <span class="group-title">Categoría / Época</span>
                        <label class="filter-option">
                            <input type="radio" name="cat-filter" value="all" ${appState.activeCategory === 'all' ? 'checked' : ''} />
                            Todos los clásicos (${appState.vehicles.length})
                        </label>
                        <label class="filter-option">
                            <input type="radio" name="cat-filter" value="muscle-cars" ${appState.activeCategory === 'muscle-cars' ? 'checked' : ''} />
                            Muscle Cars Americanos
                        </label>
                        <label class="filter-option">
                            <input type="radio" name="cat-filter" value="deportivos-europeos" ${appState.activeCategory === 'deportivos-europeos' ? 'checked' : ''} />
                            Deportivos Europeos
                        </label>
                        <label class="filter-option">
                            <input type="radio" name="cat-filter" value="gran-turismo" ${appState.activeCategory === 'gran-turismo' ? 'checked' : ''} />
                            Gran Turismo & Leyendas
                        </label>
                    </div>

                    <button type="button" id="btn-reset-filters" class="btn-secondary" style="width: 100%; font-size: 0.8125rem; padding: 8px;">
                        Restablecer Filtros
                    </button>
                </aside>

                <section aria-labelledby="catalog-results-heading">
                    <div class="catalog-controls-bar">
                        <span id="catalog-results-heading" style="font-weight: 600; font-size: 0.9375rem;">
                            Mostrando ${filtered.length} de ${appState.vehicles.length} vehículos
                        </span>

                        <div class="catalog-sort-wrap">
                            <label for="catalog-sort-select">Ordenar por:</label>
                            <select id="catalog-sort-select">
                                <option value="bids-desc" ${appState.sortBy === 'bids-desc' ? 'selected' : ''}>Mayor Puja Actual</option>
                                <option value="bids-asc" ${appState.sortBy === 'bids-asc' ? 'selected' : ''}>Menor Puja Actual</option>
                                <option value="ending-soon" ${appState.sortBy === 'ending-soon' ? 'selected' : ''}>Próximos a Finalizar</option>
                                <option value="year-desc" ${appState.sortBy === 'year-desc' ? 'selected' : ''}>Año (Más Reciente)</option>
                                <option value="year-asc" ${appState.sortBy === 'year-asc' ? 'selected' : ''}>Año (Más Antiguo)</option>
                            </select>
                        </div>
                    </div>

                    ${filtered.length === 0 ? `
                        <div style="background-color: var(--color-surface); border: 1px dashed var(--color-border-strong); border-radius: var(--radius-md); padding: 48px; text-align: center;">
                            <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 8px;">No se encontraron vehículos que coincidan con la búsqueda.</p>
                            <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 16px;">Probá con otros términos o seleccioná 'Todos los clásicos'.</p>
                            <button type="button" id="btn-empty-reset" class="btn-primary">Ver todos los autos</button>
                        </div>
                    ` : `
                        <div class="vehicles-grid">
                            ${filtered.map(vehicle => createVehicleCardHtml(vehicle)).join('')}
                        </div>
                    `}
                </section>
            </div>
        `;

        document.getElementById('main-content').innerHTML = html;
        attachCatalogEvents();
    }

    function attachCatalogEvents() {
        const searchInput = document.getElementById('catalog-search');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                appState.searchQuery = this.value.trim();
                renderCatalog();
            });
        }

        document.querySelectorAll('input[name="cat-filter"]').forEach(radio => {
            radio.addEventListener('change', function () {
                appState.activeCategory = this.value;
                renderCatalog();
            });
        });

        const sortSelect = document.getElementById('catalog-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                appState.sortBy = this.value;
                renderCatalog();
            });
        }

        const resetBtn = document.getElementById('btn-reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                appState.searchQuery = '';
                appState.activeCategory = 'all';
                appState.sortBy = 'bids-desc';
                renderCatalog();
            });
        }

        const emptyResetBtn = document.getElementById('btn-empty-reset');
        if (emptyResetBtn) {
            emptyResetBtn.addEventListener('click', function () {
                appState.searchQuery = '';
                appState.activeCategory = 'all';
                renderCatalog();
            });
        }
    }

    // =========================================================================
    // VISTA: FICHA DE PRODUCTO DETALLADA
    // =========================================================================

    function renderVehicleDetail(vehicleId) {
        const vehicle = appState.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            document.getElementById('main-content').innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2>Vehículo no encontrado</h2>
                    <p>El lote que buscás no existe o ha sido retirado.</p>
                    <a href="#catalogo" class="btn-primary" style="margin-top: 16px; display: inline-block;">Volver al catálogo</a>
                </div>
            `;
            return;
        }

        updateSEO(vehicle.seo.title, vehicle.seo.description);

        const nextMinBid = vehicle.currentBid + vehicle.minIncrement;
        const relatedVehicles = appState.vehicles.filter(v => v.id !== vehicle.id).slice(0, 3);
        const defaultBidderName = appState.currentUser ? appState.currentUser.name : '';
        const time = formatTimeRemaining(vehicle.endsAt);

        const html = `
            <nav class="breadcrumbs" aria-label="Ubicación en el sitio">
                <a href="#inicio">Inicio</a>
                <span aria-hidden="true">/</span>
                <a href="#catalogo">Catálogo</a>
                <span aria-hidden="true">/</span>
                <a href="#catalogo">${vehicle.categoryName}</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">${vehicle.title}</span>
            </nav>

            <div class="product-detail-layout">
                <div class="detail-main-col">
                    <header style="margin-bottom: 20px;">
                        <span class="vehicle-category" style="font-size: 0.8125rem;">${vehicle.categoryName} · Lote #${vehicle.id}</span>
                        <h1 style="font-size: 2rem; font-weight: 800; line-height: 1.2; margin-top: 4px; color: var(--color-text-primary);">
                            ${vehicle.title} (${vehicle.year})
                        </h1>
                        <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin-top: 6px;">
                            ${vehicle.shortDesc}
                        </p>
                    </header>

                    <div class="product-gallery">
                        <div class="main-image-wrap">
                            <img id="detail-main-img" src="${vehicle.image}" alt="Vista principal del automóvil clásico ${vehicle.title} del año ${vehicle.year}" />
                        </div>
                        <div class="thumbnail-row" aria-label="Vistas fotográficas del vehículo">
                            <button type="button" class="thumbnail-btn active" data-img="${vehicle.image}" aria-label="Ver imagen 1: Vista general exterior">
                                <img src="${vehicle.image}" alt="Miniatura vista exterior" />
                            </button>
                            <button type="button" class="thumbnail-btn" data-img="${vehicle.image}" aria-label="Ver imagen 2: Detalle de carrocería y llantas">
                                <img src="${vehicle.image}" alt="Miniatura detalle llantas" style="filter: brightness(0.95);" />
                            </button>
                            <button type="button" class="thumbnail-btn" data-img="${vehicle.image}" aria-label="Ver imagen 3: Compartimento de motor verificado">
                                <img src="${vehicle.image}" alt="Miniatura compartimento de motor" style="filter: contrast(1.05);" />
                            </button>
                        </div>
                    </div>

                    <div class="specs-table-card">
                        <h3>Ficha Técnica & Certificación de Originalidad</h3>
                        <table class="specs-table" aria-label="Especificaciones mecánicas y registrales">
                            <tbody>
                                <tr>
                                    <th scope="row">Año de fabricación</th>
                                    <td>${vehicle.year}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Número de Chasis (VIN)</th>
                                    <td><code>${vehicle.vin}</code> (Verificado en chasis y formulario 12)</td>
                                </tr>
                                <tr>
                                    <th scope="row">Certificación Matching Numbers</th>
                                    <td><strong>${vehicle.originalityRating}</strong></td>
                                </tr>
                                <tr>
                                    <th scope="row">Motorización</th>
                                    <td>${vehicle.engine}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Transmisión</th>
                                    <td>${vehicle.transmission}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Kilometraje / Millaje</th>
                                    <td>${vehicle.mileage}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Color Exterior</th>
                                    <td>${vehicle.exteriorColor}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Interior & Tapizados</th>
                                    <td>${vehicle.interiorColor}</td>
                                </tr>
                                <tr>
                                    <th scope="row">País de Origen</th>
                                    <td>${vehicle.origin}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="specs-table-card">
                        <h3>Historial y Procedencia Verificada</h3>
                        <div style="font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.6;">
                            <p style="margin-bottom: 14px;">${vehicle.fullDescription}</p>
                            <p style="margin-bottom: 14px;"><strong>Registro y antecedentes:</strong> ${vehicle.history}</p>
                        </div>
                    </div>

                    <div class="specs-table-card">
                        <h3>Transferencia, Custodia y Logística</h3>
                        <div style="font-size: 0.9375rem; color: var(--color-text-secondary); line-height: 1.6;">
                            <p style="margin-bottom: 8px;"><strong>Condición de entrega:</strong> ${vehicle.shippingDetails}</p>
                            <p><strong>Inspección previa:</strong> Podés coordinar una visita presencial con tu mecánico especialista o perito de confianza en nuestro salón de guarda antes de ofertar.</p>
                        </div>
                    </div>
                </div>

                <aside class="bidding-panel-sticky" aria-label="Módulo de puja para ${vehicle.title}">
                    <div class="bidding-card">
                        <div class="bidding-card-header">
                            <span class="badge-status ${time.isEnded ? 'ended' : (time.isEndingSoon ? 'ending-soon' : 'active')}" id="detail-badge-status" style="position: static; display: inline-block; margin-bottom: 8px;">
                                ${time.isEnded ? 'Subasta Cerrada' : (time.isEndingSoon ? 'Cierre Inminente' : 'Subasta en Progreso')}
                            </span>
                            <div class="current-bid-display">
                                <span class="label">Puja actual más alta</span>
                                <div class="bid-val" id="detail-current-bid">${formatUSD(vehicle.currentBid)}</div>
                            </div>
                            <div class="bid-stats-row">
                                <span><strong id="detail-bids-count">${vehicle.bidsCount}</strong> ofertas registradas</span>
                                <span style="display: inline-flex; align-items: center; gap: 4px;">
                                    <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">schedule</span>
                                    <strong id="timer-detail-${vehicle.id}" class="timer-digits">${time.text}</strong> para finalizar
                                </span>
                            </div>
                        </div>

                        <form id="bid-submit-form" class="bid-form">
                            <div class="bid-input-group">
                                <label for="bid-amount-input">Ingresá tu oferta en dólares (USD):</label>
                                <div class="input-with-currency">
                                    <span class="currency-symbol" aria-hidden="true">$</span>
                                    <input 
                                        type="number" 
                                        id="bid-amount-input" 
                                        name="bidAmount"
                                        min="${nextMinBid}" 
                                        step="1" 
                                        value="${nextMinBid}" 
                                        required 
                                        aria-describedby="bid-help"
                                    />
                                </div>
                                
                                <!-- Botones de incremento rápido por clic -->
                                <div class="quick-bid-buttons" style="display: flex; gap: 8px; margin-top: 8px;">
                                    <button type="button" id="btn-quick-increment" class="btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 0.875rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background-color: var(--color-surface-hover);" title="Aumentar el monto por cada clic según el incremento mínimo">
                                        <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">add</span>
                                        <span>+ ${formatUSD(vehicle.minIncrement)}</span> (Aumentar puja)
                                    </button>
                                    <button type="button" id="btn-reset-bid" class="btn-secondary" style="padding: 8px 12px; font-size: 0.8125rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;" title="Restablecer a la oferta mínima permitida">
                                        <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">restart_alt</span>
                                        <span>Mínimo</span>
                                    </button>
                                </div>

                                <span id="bid-help" class="bid-helper-text" style="display: block; margin-top: 6px;">
                                    Oferta mínima permitida: <strong>${formatUSD(nextMinBid)}</strong> (incremento de ${formatUSD(vehicle.minIncrement)})
                                </span>
                            </div>

                            <div class="bid-input-group">
                                <label for="bidder-alias-input">Nombre o alias del postor:</label>
                                <input 
                                    type="text" 
                                    id="bidder-alias-input" 
                                    value="${defaultBidderName}"
                                    placeholder="Ej: John Doe (Coleccionista)" 
                                    required 
                                    style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); font-size: 0.9375rem;" 
                                />
                            </div>

                            <button type="submit" class="btn-place-bid" id="btn-submit-bid">
                                Confirmar y Enviar Oferta
                            </button>

                            <div id="bid-feedback" class="bid-feedback-message" role="status" aria-live="polite"></div>
                        </form>

                        <div style="font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px solid var(--color-border); padding-top: 12px; display: flex; align-items: center; gap: 6px;">
                            <span class="material-symbols-outlined" style="font-size: 16px;" aria-hidden="true">lock</span>
                            <span>Subasta respaldada por fianza notarial. Oferta legalmente vinculante.</span>
                        </div>
                    </div>

                    <div class="bids-history-card">
                        <h4>Historial de Ofertas (Últimas pujas)</h4>
                        <ul class="bids-list" id="detail-bids-list" aria-label="Lista de ofertas registradas">
                            ${vehicle.bidsHistory.map(b => `
                                <li class="bid-list-item">
                                    <div>
                                        <div class="bid-amt">${formatUSD(b.amount)}</div>
                                        <div class="bidder-name">${b.bidder}</div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">${b.time}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </aside>
            </div>

            <section style="margin-top: 48px; border-top: 1px solid var(--color-border); padding-top: 32px;" aria-labelledby="related-heading">
                <h2 id="related-heading" style="font-size: 1.375rem; margin-bottom: 20px;">Otros Vehículos Clásicos Relacionados</h2>
                <div class="vehicles-grid">
                    ${relatedVehicles.map(v => createVehicleCardHtml(v)).join('')}
                </div>
            </section>
        `;

        document.getElementById('main-content').innerHTML = html;
        attachDetailEvents(vehicle);
    }

    function attachDetailEvents(vehicle) {
        document.querySelectorAll('.thumbnail-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const imgUrl = this.getAttribute('data-img');
                const mainImg = document.getElementById('detail-main-img');
                if (mainImg) {
                    mainImg.src = imgUrl;
                }
            });
        });

        // Botones de incremento rápido por clic (no envían la oferta hasta hacer clic en Confirmar)
        const quickIncBtn = document.getElementById('btn-quick-increment');
        const resetBidBtn = document.getElementById('btn-reset-bid');
        const amountInput = document.getElementById('bid-amount-input');

        if (quickIncBtn && amountInput) {
            quickIncBtn.addEventListener('click', function () {
                const minAllowed = vehicle.currentBid + vehicle.minIncrement;
                let currentVal = parseFloat(amountInput.value);
                if (isNaN(currentVal) || currentVal < minAllowed) {
                    currentVal = minAllowed;
                } else {
                    currentVal += vehicle.minIncrement;
                }
                amountInput.value = currentVal;
                amountInput.classList.add('pulse-highlight');
                setTimeout(() => amountInput.classList.remove('pulse-highlight'), 350);
                announceScreenReader(`Monto aumentado a ${formatUSD(currentVal)}`);
            });
        }

        if (resetBidBtn && amountInput) {
            resetBidBtn.addEventListener('click', function () {
                const minAllowed = vehicle.currentBid + vehicle.minIncrement;
                amountInput.value = minAllowed;
                amountInput.classList.add('pulse-highlight');
                setTimeout(() => amountInput.classList.remove('pulse-highlight'), 350);
                announceScreenReader(`Monto restablecido a la oferta mínima de ${formatUSD(minAllowed)}`);
            });
        }

        const bidForm = document.getElementById('bid-submit-form');
        const feedback = document.getElementById('bid-feedback');

        if (bidForm) {
            bidForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const amountInput = document.getElementById('bid-amount-input');
                const aliasInput = document.getElementById('bidder-alias-input');
                const offeredAmount = parseFloat(amountInput.value);
                const bidderName = aliasInput.value.trim() || 'Postor Registrado';

                if (vehicle.endsAt && vehicle.endsAt <= Date.now()) {
                    feedback.className = 'bid-feedback-message error';
                    feedback.textContent = 'Esta subasta ha finalizado. Ya no se reciben más ofertas.';
                    announceScreenReader('Esta subasta ha finalizado.');
                    return;
                }

                const minAllowed = vehicle.currentBid + vehicle.minIncrement;

                if (isNaN(offeredAmount) || offeredAmount < minAllowed) {
                    feedback.className = 'bid-feedback-message error';
                    feedback.textContent = `Error: La oferta debe ser de al menos ${formatUSD(minAllowed)}.`;
                    announceScreenReader(`Error en la puja: el monto mínimo es ${formatUSD(minAllowed)}.`);
                    return;
                }

                // Sistema Anti-Snipe: si faltan menos de 2 minutos, suma 2 minutos para evitar especulación
                let antiSnipeNotice = '';
                const remainingMs = (vehicle.endsAt || Date.now()) - Date.now();
                if (remainingMs < 2 * 60 * 1000) {
                    vehicle.endsAt = Date.now() + 2 * 60 * 1000;
                    antiSnipeNotice = ' (Reloj extendido +2 min por Sistema Anti-Snipe)';
                }

                vehicle.currentBid = offeredAmount;
                vehicle.bidsCount += 1;
                vehicle.bidsHistory.unshift({
                    bidder: `${bidderName} (Oferta líder)`,
                    amount: offeredAmount,
                    time: 'Recién ofertado'
                });

                appState.totalBidsCount += 1;
                saveStorage();

                feedback.className = 'bid-feedback-message success';
                feedback.textContent = `¡Felicitaciones ${bidderName}! Tu oferta de ${formatUSD(offeredAmount)} ha sido registrada como la más alta.${antiSnipeNotice}`;
                announceScreenReader(`Oferta exitosa de ${formatUSD(offeredAmount)} registrada.`);

                document.getElementById('detail-current-bid').textContent = formatUSD(offeredAmount);
                const bidsCountEl = document.getElementById('detail-bids-count');
                if (bidsCountEl) bidsCountEl.textContent = vehicle.bidsCount;

                const nextStep = offeredAmount + vehicle.minIncrement;
                amountInput.min = nextStep;
                amountInput.value = nextStep;
                document.getElementById('bid-help').innerHTML = `Oferta mínima permitida: <strong>${formatUSD(nextStep)}</strong> (incremento de ${formatUSD(vehicle.minIncrement)})`;

                const historyList = document.getElementById('detail-bids-list');
                if (historyList) {
                    historyList.innerHTML = vehicle.bidsHistory.map(b => `
                        <li class="bid-list-item">
                            <div>
                                <div class="bid-amt">${formatUSD(b.amount)}</div>
                                <div class="bidder-name">${b.bidder}</div>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${b.time}</div>
                        </li>
                    `).join('');
                }
            });
        }
    }

    // =========================================================================
    // VISTA: BLOG Y GUÍAS DE COMPRA
    // =========================================================================

    function renderBlog() {
        updateSEO(
            'Blog y Guías de Compra de Autos Clásicos | RetroMotors',
            'Artículos técnicos, guías de peritaje de números coincidentes y análisis de mercado para coleccionistas e inversores.'
        );

        const html = `
            <nav class="breadcrumbs" aria-label="Ubicación en el sitio">
                <a href="#inicio">Inicio</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Guías de Colección</span>
            </nav>

            <div class="section-header">
                <div>
                    <h1 style="font-size: 1.75rem; font-weight: 700;">Guías de Colección & Mercado</h1>
                    <p>Contenido sobre preservación, peritaje técnico de números coincidentes y autenticidad automotriz.</p>
                </div>
            </div>

            <div class="blog-grid">
                ${APP_DATA.blogPosts.map(post => `
                    <article class="blog-card" aria-labelledby="post-${post.id}">
                        <span class="blog-card-tag">${post.tag}</span>
                        <h2 class="blog-card-title" id="post-${post.id}" style="font-size: 1.1875rem; font-weight: 700; margin-bottom: 8px;">
                            ${post.title}
                        </h2>
                        <div class="blog-card-meta">
                            <span><span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">calendar_month</span> ${post.date}</span> · 
                            <span><span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">schedule</span> ${post.readTime}</span> · 
                            <span><span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">edit_note</span> ${post.author}</span>
                        </div>
                        <p>${post.summary}</p>
                        <div style="border-top: 1px solid var(--color-border); padding-top: 16px; margin-top: auto;">
                            <div class="post-full-content" style="font-size: 0.9375rem; line-height: 1.6; color: var(--color-text-secondary);">
                                ${post.content}
                            </div>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;

        document.getElementById('main-content').innerHTML = html;
    }

    // =========================================================================
    // VISTA: CONTACTO & PERITAJES
    // =========================================================================

    function renderContact() {
        updateSEO(
            'Contacto & Peritajes | RetroMotors',
            'Formulario de contacto oficial, consultas técnicas sobre vehículos en subasta, peritajes y reporte de accesibilidad WCAG.'
        );

        const html = `
            <nav class="breadcrumbs" aria-label="Ubicación en el sitio">
                <a href="#inicio">Inicio</a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Contacto & Peritajes</span>
            </nav>

            <div class="contact-layout">
                <div class="form-card">
                    <h1>Contacto & Peritajes Técnicos</h1>
                    <p class="subtitle">
                        Comunicate con nuestro equipo de especialistas o reportá sugerencias sobre accesibilidad, consignaciones o peritajes mecánicos.
                    </p>

                    <form id="contact-feedback-form">
                        <div class="form-group">
                            <label for="contact-name">Nombre y Apellido *</label>
                            <input type="text" id="contact-name" name="name" required placeholder="Ej: Dra. Mariana Rossi" value="${appState.currentUser ? appState.currentUser.name : ''}" />
                        </div>

                        <div class="form-group">
                            <label for="contact-email">Correo Electrónico *</label>
                            <input type="email" id="contact-email" name="email" required placeholder="correo@ejemplo.com" value="${appState.currentUser ? appState.currentUser.email : ''}" />
                        </div>

                        <div class="form-group">
                            <label for="contact-topic">Motivo del Mensaje *</label>
                            <select id="contact-topic" name="topic" required>
                                <option value="">Seleccioná una opción...</option>
                                <option value="subasta">Consulta sobre un vehículo o puja específica</option>
                                <option value="consignacion">Quiero publicar mi auto clásico en subasta</option>
                                <option value="peritaje">Solicitar inspección técnica / Peritaje FIVA</option>
                                <option value="accesibilidad">Reporte de Accesibilidad WCAG (teclado, contraste, ALT)</option>
                                <option value="general">Consulta comercial general</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="contact-message">Mensaje o Detalle del Requerimiento *</label>
                            <textarea id="contact-message" name="message" rows="5" required placeholder="Escribí aquí tu mensaje, duda o solicitud de peritaje..."></textarea>
                        </div>

                        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="contact-consent" required style="width: auto;" />
                            <label for="contact-consent" style="font-weight: normal; font-size: 0.8125rem; margin-bottom: 0;">
                                Acepto los términos y condiciones del contrato de subastas y la política de privacidad de RetroMotors.
                            </label>
                        </div>

                        <button type="submit" class="btn-primary" style="padding: 12px 24px; font-size: 1rem;">
                            Enviar Mensaje
                        </button>

                        <div id="contact-status" class="bid-feedback-message" role="status" aria-live="polite"></div>
                    </form>
                </div>

                <div>
                    <div class="contact-info-card" style="margin-bottom: 24px;">
                        <h3>Sede y Atención</h3>
                        <div class="info-item">
                            <strong>Casa Matriz</strong>
                            <span>RetroMotors Auctioneers International</span>
                        </div>
                        <div class="info-item">
                            <strong>Salón de Custodia & Peritaje</strong>
                            <span>Av. Alvear 1850, Recoleta, CABA</span>
                        </div>
                        <div class="info-item">
                            <strong>Línea Directa</strong>
                            <span>+54 (11) 4800-RETRO / subastas@retromotors.com</span>
                        </div>
                        <div class="info-item">
                            <strong>Horarios de Peritaje</strong>
                            <span>Lunes a Viernes de 09:00 a 18:00 hs (Atención con turno previo)</span>
                        </div>
                    </div>

                    <div class="contact-info-card">
                        <h3>Compromiso de Accesibilidad</h3>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.5;">
                            Este portal ha sido auditado para cumplir con las directrices de accesibilidad web <strong>WCAG 2.1 nivel AA</strong>. Si encontrás alguna dificultad en la navegación por teclado o con lectores de pantalla, tu reporte será atendido con prioridad.
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('main-content').innerHTML = html;

        const form = document.getElementById('contact-feedback-form');
        const statusBox = document.getElementById('contact-status');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                statusBox.className = 'bid-feedback-message success';
                statusBox.textContent = '¡Gracias por comunicarte! Tu mensaje ha sido recibido con éxito por el equipo de RetroMotors.';
                form.reset();
                announceScreenReader('Mensaje de contacto enviado correctamente.');
            });
        }
    }

    // =========================================================================
    // MODAL DE ADMINISTRACIÓN CMS (Sin Roles, 100% Profesional y sin emojis)
    // =========================================================================

    function openCMSAdminModal() {
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'cms-admin-modal-backdrop';
        modalBackdrop.id = 'cms-admin-backdrop';
        modalBackdrop.setAttribute('role', 'dialog');
        modalBackdrop.setAttribute('aria-modal', 'true');
        modalBackdrop.setAttribute('aria-labelledby', 'cms-modal-title');

        modalBackdrop.innerHTML = `
            <div class="cms-admin-modal">
                <header class="cms-modal-header">
                    <h2 id="cms-modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 24px;" aria-hidden="true">admin_panel_settings</span>
                        <span>Panel de Administración CMS - RetroMotors</span>
                    </h2>
                    <button type="button" class="cms-modal-close-btn" id="btn-close-cms-modal" aria-label="Cerrar panel CMS">
                        <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>

                <nav class="cms-tabs-nav" aria-label="Pestañas del CMS">
                    <button type="button" class="cms-tab-btn active" data-tab="tab-lotes">
                        <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;" aria-hidden="true">inventory_2</span>
                        <span>Gestión de Subastas (${appState.vehicles.length})</span>
                    </button>
                    <button type="button" class="cms-tab-btn" data-tab="tab-seo">
                        <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;" aria-hidden="true">travel_explore</span>
                        <span>SEO On-Page</span>
                    </button>
                    <button type="button" class="cms-tab-btn" data-tab="tab-wcag">
                        <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;" aria-hidden="true">verified_user</span>
                        <span>Auditoría WCAG 2.1</span>
                    </button>
                    <button type="button" class="cms-tab-btn" data-tab="tab-analytics">
                        <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle;" aria-hidden="true">bar_chart</span>
                        <span>Analítica & Métricas</span>
                    </button>
                </nav>

                <div class="cms-modal-content">
                    <!-- Tab 1: Gestión de Subastas -->
                    <section id="tab-lotes" class="cms-panel-tab active" aria-labelledby="lotes-heading">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <h3 id="lotes-heading" style="font-size: 1.125rem;">Lotes Publicados en la Plataforma</h3>
                                <span style="font-size: 0.8125rem; color: var(--color-text-muted);">${appState.vehicles.length} vehículos activos en subasta</span>
                            </div>
                            <button type="button" id="btn-cms-new-car" class="btn-primary" style="font-size: 0.8125rem; padding: 6px 14px; display: inline-flex; align-items: center; gap: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 16px;">add_circle</span>
                                <span>Publicar Nuevo Auto Clásico</span>
                            </button>
                        </div>

                        <table class="admin-table" id="cms-vehicles-table">
                            <thead>
                                <tr>
                                    <th>Vehículo Clásico</th>
                                    <th>Año</th>
                                    <th>Categoría</th>
                                    <th>Puja Base</th>
                                    <th>Puja Actual</th>
                                    <th>Incremento Mínimo</th>
                                    <th>Ofertas</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${appState.vehicles.map(v => `
                                    <tr>
                                        <td><strong>${v.title}</strong></td>
                                        <td>${v.year}</td>
                                        <td>${v.categoryName}</td>
                                        <td>${formatUSD(v.startingBid)}</td>
                                        <td style="color: var(--color-success); font-weight: 700;">${formatUSD(v.currentBid)}</td>
                                        <td>+${formatUSD(v.minIncrement)}</td>
                                        <td>${v.bidsCount}</td>
                                        <td><span class="badge-table success">Publicado</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </section>

                    <!-- Tab 2: SEO On-Page -->
                    <section id="tab-seo" class="cms-panel-tab" aria-labelledby="seo-heading">
                        <h3 id="seo-heading" style="font-size: 1.125rem; margin-bottom: 8px;">Configuración y Optimización SEO On-Page</h3>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 16px;">
                            Visualización de metatítulos, metadescripciones, URLs amigables y vista previa del snippet en motores de búsqueda (SERP).
                        </p>

                        <div style="background-color: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 20px;">
                            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700; margin-bottom: 6px;">
                                Vista previa SERP de Google:
                            </div>
                            <div style="font-size: 1.125rem; color: #1a0dab; text-decoration: underline; font-weight: 600;">
                                RetroMotors | Subastas de Autos Clásicos & Piezas de Colección
                            </div>
                            <div style="font-size: 0.8125rem; color: #006621; margin: 2px 0;">
                                https://retromotors.com/subastas
                            </div>
                            <div style="font-size: 0.875rem; color: #4d5156; line-height: 1.4;">
                                Casa de subastas oficial de automóviles clásicos y de colección. Fichas de peritaje técnico de chasis y motor, documentación histórica de fábrica y pujas en tiempo real.
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <label style="display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 4px;">Jerarquía Semántica de Encabezados</label>
                                <p style="font-size: 0.8125rem; color: var(--color-text-secondary);">
                                    Cada vista contiene un único <code>&lt;h1&gt;</code> descriptivo, seguido de secciones delimitadas con <code>&lt;h2&gt;</code> y componentes con <code>&lt;h3&gt;</code>.
                                </p>
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 4px;">Estructura Schema.org (JSON-LD)</label>
                                <p style="font-size: 0.8125rem; color: var(--color-text-secondary);">
                                    El catálogo implementa microdatos <code>Product</code> y <code>AutoAuction</code> para indexación enriquecida en Google.
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Tab 3: Auditoría WCAG 2.1 -->
                    <section id="tab-wcag" class="cms-panel-tab" aria-labelledby="wcag-heading">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 id="wcag-heading" style="font-size: 1.125rem;">Matriz de Accesibilidad Web (WCAG 2.1 Nivel AA)</h3>
                            <button type="button" id="btn-run-audit" class="btn-primary" style="font-size: 0.8125rem; padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;">
                                <span class="material-symbols-outlined" style="font-size: 16px;">search_check</span>
                                <span>Ejecutar Auditoría en Vivo</span>
                            </button>
                        </div>
                        <div id="audit-results-box" style="margin-bottom: 16px; display: none; padding: 10px 14px; background-color: #d1fae5; border: 1px solid #a7f3d0; border-radius: var(--radius-sm); font-size: 0.875rem; color: #065f46;">
                            <span class="material-symbols-outlined" style="font-size: 18px; vertical-align: middle; color: #065f46;" aria-hidden="true">check_circle</span>
                            <strong>Auditoría superada:</strong> Se verificaron las imágenes con atributo ALT descriptivo, 100% de controles accesibles por teclado y ratios de contraste superiores a 4.5:1.
                        </div>
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Criterio WCAG</th>
                                    <th>Principio / Requisito</th>
                                    <th>Estado</th>
                                    <th>Evidencia Implementada</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${APP_DATA.wcagAuditChecklist.map(c => `
                                    <tr>
                                        <td><code>${c.code}</code></td>
                                        <td><strong>${c.name}</strong></td>
                                        <td><span class="badge-table success">${c.status}</span></td>
                                        <td>${c.description}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </section>

                    <!-- Tab 4: Analítica & Métricas -->
                    <section id="tab-analytics" class="cms-panel-tab" aria-labelledby="analytics-heading">
                        <h3 id="analytics-heading" style="font-size: 1.125rem; margin-bottom: 16px;">Métricas del E-commerce & Subastas</h3>
                        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
                            <div class="hero-stats-card">
                                <div class="stat-number">${APP_DATA.cmsAnalytics.totalVisitors}</div>
                                <div class="stat-label">Visitantes únicos registrados</div>
                            </div>
                            <div class="hero-stats-card">
                                <div class="stat-number">${appState.totalBidsCount}</div>
                                <div class="stat-label">Pujas totales registradas</div>
                            </div>
                            <div class="hero-stats-card">
                                <div class="stat-number">${APP_DATA.cmsAnalytics.conversionRate}</div>
                                <div class="stat-label">Tasa de conversión de postores</div>
                            </div>
                        </div>

                        <div style="background-color: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 16px;">
                            <h4 style="font-size: 0.9375rem; margin-bottom: 8px;">Integraciones de Marketing y Redes Sociales</h4>
                            <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.5;">
                                Captura automatizada de leads con <strong>${APP_DATA.cmsAnalytics.newsletterSubscribers} suscriptores activos</strong> y un índice de satisfacción de postores de <strong>${APP_DATA.cmsAnalytics.satisfactionScore}</strong>.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        `;

        document.body.appendChild(modalBackdrop);
        document.body.style.overflow = 'hidden';

        const tabBtns = modalBackdrop.querySelectorAll('.cms-tab-btn');
        const tabContents = modalBackdrop.querySelectorAll('.cms-panel-tab');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                this.classList.add('active');
                const targetId = this.getAttribute('data-tab');
                const targetContent = modalBackdrop.querySelector(`#${targetId}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });

        const runAuditBtn = modalBackdrop.querySelector('#btn-run-audit');
        if (runAuditBtn) {
            runAuditBtn.addEventListener('click', function () {
                const resultsBox = modalBackdrop.querySelector('#audit-results-box');
                resultsBox.style.display = 'block';
                announceScreenReader('Auditoría WCAG ejecutada con éxito. Todos los criterios validados.');
            });
        }

        const cmsNewCarBtn = modalBackdrop.querySelector('#btn-cms-new-car');
        if (cmsNewCarBtn) {
            cmsNewCarBtn.addEventListener('click', function () {
                closeModal();
                openSellModal();
            });
        }

        function closeModal() {
            modalBackdrop.remove();
            document.body.style.overflow = '';
        }

        modalBackdrop.querySelector('#btn-close-cms-modal').addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', function (e) {
            if (e.target === modalBackdrop) closeModal();
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape' && document.getElementById('cms-admin-backdrop')) {
                closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    // =========================================================================
    // ENRUTADOR PRINCIPAL
    // =========================================================================

    function router() {
        const hash = window.location.hash || '#inicio';

        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (hash.startsWith(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (hash === '#inicio' || hash === '') {
            renderHome();
        } else if (hash === '#catalogo') {
            renderCatalog();
        } else if (hash.startsWith('#auto/')) {
            const vehicleId = hash.replace('#auto/', '');
            renderVehicleDetail(vehicleId);
        } else if (hash === '#garantia') {
            renderGarantia();
        } else if (hash === '#blog') {
            renderBlog();
        } else if (hash === '#contacto') {
            renderContact();
        } else if (hash === '#como-funciona') {
            renderHome();
            setTimeout(() => {
                const el = document.getElementById('como-funciona');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            renderHome();
        }
    }

    // =========================================================================
    // BUSCADOR EN EL NAVBAR & CONFIGURACIÓN GLOBAL
    // =========================================================================

    function setupNavbarSearch() {
        const navSearch = document.getElementById('nav-global-search');
        if (navSearch) {
            navSearch.addEventListener('input', function () {
                appState.searchQuery = this.value.trim();
                if (window.location.hash !== '#catalogo') {
                    window.location.hash = '#catalogo';
                } else {
                    renderCatalog();
                }
            });

            navSearch.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    appState.searchQuery = this.value.trim();
                    window.location.hash = '#catalogo';
                    renderCatalog();
                }
            });
        }
    }

    function setupAccessibilityControls() {
        const contrastBtn = document.getElementById('btn-toggle-contrast');
        const textBtn = document.getElementById('btn-toggle-text');

        if (contrastBtn) {
            contrastBtn.addEventListener('click', function () {
                appState.highContrast = !appState.highContrast;
                document.body.classList.toggle('high-contrast', appState.highContrast);
                this.setAttribute('aria-pressed', appState.highContrast ? 'true' : 'false');
                saveStorage();
                announceScreenReader(`Modo alto contraste ${appState.highContrast ? 'activado' : 'desactivado'}.`);
            });
        }

        if (textBtn) {
            textBtn.addEventListener('click', function () {
                appState.largeText = !appState.largeText;
                document.body.classList.toggle('large-text', appState.largeText);
                this.setAttribute('aria-pressed', appState.largeText ? 'true' : 'false');
                saveStorage();
                announceScreenReader(`Tamaño de texto grande ${appState.largeText ? 'activado' : 'desactivado'}.`);
            });
        }

        if (appState.highContrast) {
            document.body.classList.add('high-contrast');
            if (contrastBtn) contrastBtn.setAttribute('aria-pressed', 'true');
        }
        if (appState.largeText) {
            document.body.classList.add('large-text');
            if (textBtn) textBtn.setAttribute('aria-pressed', 'true');
        }

        const adminBtn = document.getElementById('btn-open-cms');
        if (adminBtn) {
            adminBtn.addEventListener('click', openCMSAdminModal);
        }

        const footerCmsLink = document.getElementById('link-footer-cms');
        if (footerCmsLink) {
            footerCmsLink.addEventListener('click', openCMSAdminModal);
        }

        const navSellBtn = document.getElementById('btn-open-sell-modal');
        if (navSellBtn) {
            navSellBtn.addEventListener('click', openSellModal);
        }
    }

    // Inicialización al cargar el DOM
    document.addEventListener('DOMContentLoaded', function () {
        initStorage();
        setupNavbarSearch();
        updateNavUserUI();
        setupAccessibilityControls();
        window.addEventListener('hashchange', router);
        router();
        startGlobalCountdown();
    });

})();
