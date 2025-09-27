// Utilidades generales del sistema
const Utils = {
    // Formatear fecha a formato legible
    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES');
    },
    
    // Formatear hora
    formatTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Calcular diferencia en horas entre dos fechas
    calculateHoursDiff(start, end) {
        if (!start) return 0;
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        return (endDate - startDate) / (1000 * 60 * 60);
    },
    
    // Validar email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Generar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Mostrar u ocultar elemento
    toggleElement(id, show) {
        const element = document.getElementById(id);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    },
    
    // Limpiar formulario
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
};
// Manejo del almacenamiento local
const Storage = {
    // Claves para localStorage
    keys: {
        USERS: 'bomberos_usuarios',
        REGISTROS: 'bomberos_registros',
        NOTIFICACIONES: 'bomberos_notificaciones',
        CONFIG: 'bomberos_config',
        SESSION: 'bomberos_sesion'
    },
    
    // Datos por defecto
    defaultData: {
        usuarios: [
            { id: 1, legajo: "B001", nombre: "Juan Pérez", rango: "Bombero", usuario: "jperez", password: "clave123", email: "jperez@bomberos.com", activo: true, admin: false },
            { id: 2, legajo: "B002", nombre: "María García", rango: "Cabo", usuario: "mgarcia", password: "clave123", email: "mgarcia@bomberos.com", activo: true, admin: false },
            { id: 3, legajo: "ADMIN", nombre: "Administrador", rango: "Administrador", usuario: "admin", password: "1234", email: "admin@bomberos.com", activo: true, admin: true }
        ],
        actividades: [
            { id: 1, nombre: "Patrulla", tipo: "Convocatoria" },
            { id: 2, nombre: "Guardia", tipo: "Guardia" },
            { id: 3, nombre: "Entrenamiento", tipo: "Convocatoria" },
            { id: 4, nombre: "Mantenimiento", tipo: "Convocatoria" }
        ],
        config: {
            horasGuardiaRequeridas: 12,
            notificaciones: true
        }
    },
    
    // Cargar datos del localStorage
    loadData() {
        try {
            return {
                usuarios: this.loadItem(this.keys.USERS) || this.defaultData.usuarios,
                registros: this.loadItem(this.keys.REGISTROS) || [],
                notificaciones: this.loadItem(this.keys.NOTIFICACIONES) || [],
                config: this.loadItem(this.keys.CONFIG) || this.defaultData.config
            };
        } catch (error) {
            console.error('Error cargando datos:', error);
            return this.defaultData;
        }
    },
    
    // Guardar datos en localStorage
    saveData(data) {
        try {
            this.saveItem(this.keys.USERS, data.usuarios);
            this.saveItem(this.keys.REGISTROS, data.registros);
            this.saveItem(this.keys.NOTIFICACIONES, data.notificaciones);
            this.saveItem(this.keys.CONFIG, data.config);
            return true;
        } catch (error) {
            console.error('Error guardando datos:', error);
            return false;
        }
    },
    
    // Cargar item específico
    loadItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    // Guardar item específico
    saveItem(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Limpiar todos los datos
    clearAll() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
    },
    
    // Exportar datos para backup
    exportData() {
        const data = this.loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_bomberos_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    // Importar datos desde backup
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.saveData(data);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }
};
// Manejo de autenticación y sesiones
const Auth = {
    usuarioActual: null,
    
    // Inicializar sistema de autenticación
    init() {
        this.verificarSesion();
        this.inicializarEventos();
    },
    
    // Verificar si hay una sesión activa
    verificarSesion() {
        const sesion = Storage.loadItem(Storage.keys.SESSION);
        if (sesion) {
            const usuario = Storage.loadData().usuarios.find(u => u.id === sesion.id && u.activo);
            if (usuario) {
                this.usuarioActual = usuario;
                App.iniciarSistema();
            } else {
                this.cerrarSesion();
            }
        }
    },
    
    // Inicializar eventos de autenticación
    inicializarEventos() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.realizarLogin();
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.cerrarSesion();
        });
        
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            this.cerrarSesion();
        });
    },
    
    // Realizar login
    realizarLogin() {
        const usuarioInput = document.getElementById('login-user').value;
        const passwordInput = document.getElementById('login-password').value;
        
        const { usuarios } = Storage.loadData();
        const usuario = usuarios.find(u => 
            u.usuario === usuarioInput && u.password === passwordInput && u.activo
        );
        
        if (usuario) {
            this.usuarioActual = usuario;
            Storage.saveItem(Storage.keys.SESSION, { id: usuario.id, timestamp: new Date() });
            App.iniciarSistema();
            UI.mostrarAlerta('Login exitoso', 'success');
        } else {
            this.mostrarErrorLogin('Usuario o contraseña incorrectos');
        }
    },
    
    // Cerrar sesión
    cerrarSesion() {
        this.usuarioActual = null;
        Storage.saveItem(Storage.keys.SESSION, null);
        App.cerrarSesion();
    },
    
    // Mostrar error de login
    mostrarErrorLogin(mensaje) {
        const errorDiv = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        
        errorText.textContent = mensaje;
        errorDiv.classList.remove('hidden');
    },
    
    // Verificar permisos
    tienePermiso(accion) {
        if (!this.usuarioActual) return false;
        if (this.usuarioActual.admin) return true;
        
        const permisos = {
            'registrar_ingreso': true,
            'registrar_salida': true,
            'ver_historial': true,
            'gestionar_usuarios': false,
            'ver_todo_historial': false
        };
        
        return permisos[accion] || false;
    }
};
// Manejo de registros de ingreso y salida
const Registro = {
    // Inicializar módulo
    init() {
        this.inicializarEventos();
    },
    
    // Inicializar eventos de registro
    inicializarEventos() {
        document.getElementById('ingreso-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarIngreso();
        });
        
        document.getElementById('salida-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarSalida();
        });
    },
    
    // Registrar ingreso
    registrarIngreso() {
        const legajo = document.getElementById('legajo').value;
        const actividadId = parseInt(document.getElementById('actividad').value);
        const observaciones = document.getElementById('observaciones-ingreso').value;
        
        // Validaciones
        if (!this.validarRegistroIngreso(legajo, actividadId)) return;
        
        // Obtener datos actuales
        const data = Storage.loadData();
        const usuario = data.usuarios.find(u => u.legajo === legajo);
        
        // Crear nuevo registro
        const nuevoRegistro = {
            id: Utils.generateId(),
            usuario_id: usuario.id,
            actividad_id: actividadId,
            fecha_hora_ingreso: new Date(),
            fecha_hora_salida: null,
            observaciones: observaciones,
            registrado_por: Auth.usuarioActual.id
        };
        
        data.registros.push(nuevoRegistro);
        
        if (Storage.saveData(data)) {
            UI.mostrarAlerta('Ingreso registrado correctamente', 'success');
            Utils.clearForm('ingreso-form');
            
            // Restaurar legajo del usuario actual
            if (!Auth.usuarioActual.admin) {
                document.getElementById('legajo').value = Auth.usuarioActual.legajo;
            }
            
            // Actualizar dashboard
            Dashboard.actualizar();
        } else {
            UI.mostrarAlerta('Error al guardar el registro', 'error');
        }
    },
    
    // Registrar salida
    registrarSalida() {
        const legajo = document.getElementById('legajo-salida').value;
        const movilAsignado = document.getElementById('movil-asignado').value;
        const estadoMovil = document.getElementById('estado-movil').value;
        const observaciones = document.getElementById('observaciones').value;
        
        // Validaciones
        if (!this.validarRegistroSalida(legajo, movilAsignado, estadoMovil)) return;
        
        // Obtener datos actuales
        const data = Storage.loadData();
        const usuario = data.usuarios.find(u => u.legajo === legajo);
        const registroActivo = data.registros.find(r => 
            r.usuario_id === usuario.id && !r.fecha_hora_salida
        );
        
        if (!registroActivo) {
            UI.mostrarAlerta('No se encontró un registro activo para este usuario', 'error');
            return;
        }
        
        // Actualizar registro
        registroActivo.fecha_hora_salida = new Date();
        registroActivo.movil_asignado = movilAsignado;
        registroActivo.estado_movil = estadoMovil;
        registroActivo.observaciones_salida = observaciones;
        
        // Verificar guardia completa
        this.verificarGuardiaCompleta(registroActivo, usuario);
        
        if (Storage.saveData(data)) {
            UI.mostrarAlerta('Salida registrada correctamente', 'success');
            Utils.clearForm('salida-form');
            
            // Restaurar legajo del usuario actual
            if (!Auth.usuarioActual.admin) {
                document.getElementById('legajo-salida').value = Auth.usuarioActual.legajo;
            }
            
            // Actualizar dashboard
            Dashboard.actualizar();
        } else {
            UI.mostrarAlerta('Error al guardar el registro', 'error');
        }
    },
    
    // Validar registro de ingreso
    validarRegistroIngreso(legajo, actividadId) {
        if (!legajo) {
            UI.mostrarAlerta('Debe ingresar un legajo', 'error');
            return false;
        }
        
        if (!actividadId) {
            UI.mostrarAlerta('Debe seleccionar una actividad', 'error');
            return false;
        }
        
        // Validar permisos
        if (!Auth.usuarioActual.admin && legajo !== Auth.usuarioActual.legajo) {
            UI.mostrarAlerta('Solo puede registrar ingreso con su propio legajo', 'error');
            return false;
        }
        
        // Verificar si el usuario existe
        const data = Storage.loadData();
        const usuario = data.usuarios.find(u => u.legajo === legajo && u.activo);
        if (!usuario) {
            UI.mostrarAlerta('Legajo no encontrado o usuario inactivo', 'error');
            return false;
        }
        
        // Verificar que no tenga registro activo
        const registroActivo = data.registros.find(r => 
            r.usuario_id === usuario.id && !r.fecha_hora_salida
        );
        
        if (registroActivo) {
            UI.mostrarAlerta('El usuario ya tiene un registro de ingreso activo', 'error');
            return false;
        }
        
        return true;
    },
    
    // Validar registro de salida
    validarRegistroSalida(legajo, movilAsignado, estadoMovil) {
        if (!legajo) {
            UI.mostrarAlerta('Debe ingresar un legajo', 'error');
            return false;
        }
        
        if (!movilAsignado) {
            UI.mostrarAlerta('Debe seleccionar un móvil', 'error');
            return false;
        }
        
        if (!estadoMovil) {
            UI.mostrarAlerta('Debe seleccionar el estado del móvil', 'error');
            return false;
        }
        
        // Validar permisos
        if (!Auth.usuarioActual.admin && legajo !== Auth.usuarioActual.legajo) {
            UI.mostrarAlerta('Solo puede registrar salida con su propio legajo', 'error');
            return false;
        }
        
        // Verificar si el usuario existe
        const data = Storage.loadData();
        const usuario = data.usuarios.find(u => u.legajo === legajo && u.activo);
        if (!usuario) {
            UI.mostrarAlerta('Legajo no encontrado o usuario inactivo', 'error');
            return false;
        }
        
        return true;
    },
    
    // Verificar si la guardia fue completada
    verificarGuardiaCompleta(registro, usuario) {
        const data = Storage.loadData();
        const actividad = data.actividades.find(a => a.id === registro.actividad_id);
        
        if (actividad && actividad.nombre === "Guardia") {
            const horasTrabajadas = Utils.calculateHoursDiff(
                registro.fecha_hora_ingreso, 
                registro.fecha_hora_salida
            );
            
            const horasRequeridas = data.config.horasGuardiaRequeridas;
            
            if (horasTrabajadas < horasRequeridas) {
                // Agregar notificación
                data.notificaciones.push({
                    id: Utils.generateId(),
                    tipo: 'Guardia Incumplida',
                    mensaje: `El bombero ${usuario.nombre} no cumplió las ${horasRequeridas} horas de guardia. Horas trabajadas: ${horasTrabajadas.toFixed(2)}`,
                    usuario_id: usuario.id,
                    fecha: new Date(),
                    leida: false
                });
                
                Storage.saveData(data);
                
                // Actualizar contador de notificaciones si es admin
                if (Auth.usuarioActual.admin) {
                    Admin.actualizarNotificaciones();
                }
            }
        }
    }
};
// Manejo del dashboard y estadísticas
const Dashboard = {
    // Inicializar dashboard
    init() {
        this.inicializarEventos();
        this.actualizar();
    },
    
    // Inicializar eventos del dashboard
    inicializarEventos() {
        // Eventos específicos del dashboard
    },
    
    // Actualizar dashboard
    actualizar() {
        if (Auth.usuarioActual.admin) {
            this.actualizarDashboardAdmin();
        } else {
            this.actualizarDashboardBombero();
        }
    },
    
    // Actualizar dashboard del bombero
    actualizarDashboardBombero() {
        const data = Storage.loadData();
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        
        // Filtrar registros del usuario actual del mes
        const registrosUsuario = data.registros.filter(r => 
            r.usuario_id === Auth.usuarioActual.id && 
            new Date(r.fecha_hora_ingreso) >= inicioMes
        );
        
        // Calcular estadísticas
        const horasMes = registrosUsuario
            .filter(r => r.fecha_hora_salida)
            .reduce((total, r) => total + Utils.calculateHoursDiff(r.fecha_hora_ingreso, r.fecha_hora_salida), 0);
        
        const diasTrabajados = new Set(
            registrosUsuario.map(r => new Date(r.fecha_hora_ingreso).toDateString())
        ).size;
        
        const guardiasCompletadas = registrosUsuario.filter(r => 
            r.actividad_id === 2 && r.fecha_hora_salida
        ).length;
        
        // Actualizar UI
        document.getElementById('horas-mes').textContent = Math.round(horasMes);
        document.getElementById('dias-trabajados').textContent = diasTrabajados;
        document.getElementById('guardias-completadas').textContent = guardiasCompletadas;
        
        // Estado actual
        this.actualizarEstadoActual();
    },
    
    // Actualizar dashboard del admin
    actualizarDashboardAdmin() {
        const data = Storage.loadData();
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        
        // Estadísticas generales
        document.getElementById('admin-total-personal').textContent = 
            data.usuarios.filter(u => u.activo).length;
        
        document.getElementById('admin-personal-activo').textContent = 
            data.registros.filter(r => !r.fecha_hora_salida).length;
        
        document.getElementById('admin-alertas-pendientes').textContent = 
            data.notificaciones.filter(n => !n.leida).length;
        
        const horasTotales = data.registros
            .filter(r => new Date(r.fecha_hora_ingreso) >= inicioMes && r.fecha_hora_salida)
            .reduce((total, r) => total + Utils.calculateHoursDiff(r.fecha_hora_ingreso, r.fecha_hora_salida), 0);
        
        document.getElementById('admin-horas-totales').textContent = Math.round(horasTotales);
        
        // Actualizar tablas
        this.actualizarPersonalEnGuardia();
        this.actualizarActividadReciente();
    },
    
    // Actualizar estado actual del bombero
    actualizarEstadoActual() {
        const data = Storage.loadData();
        const registroActivo = data.registros.find(r => 
            r.usuario_id === Auth.usuarioActual.id && !r.fecha_hora_salida
        );
        
        const estadoActual = document.getElementById('estado-actual');
        if (registroActivo) {
            const actividad = data.actividades.find(a => a.id === registroActivo.actividad_id);
            const horas = Utils.calculateHoursDiff(registroActivo.fecha_hora_ingreso, new Date());
            
            estadoActual.innerHTML = `
                <p><i class="fas fa-check-circle" style="color: var(--success);"></i> 
                   Tienes una guardia activa de <strong>${actividad ? actividad.nombre : 'N/A'}</strong>.</p>
                <p>Horas transcurridas: <strong>${horas.toFixed(2)} horas</strong></p>
            `;
        } else {
            estadoActual.innerHTML = `
                <p><i class="fas fa-info-circle"></i> No tienes un registro de guardia activo.</p>
            `;
        }
    },
    
    // Actualizar tabla de personal en guardia (admin)
    actualizarPersonalEnGuardia() {
        const tbody = document.getElementById('admin-personal-guardia');
        if (!tbody) return;
        
        const data = Storage.loadData();
        const registrosActivos = data.registros.filter(r => !r.fecha_hora_salida);
        
        tbody.innerHTML = '';
        
        if (registrosActivos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay personal en guardia</td></tr>';
            return;
        }
        
        registrosActivos.forEach(registro => {
            const usuario = data.usuarios.find(u => u.id === registro.usuario_id);
            const actividad = data.actividades.find(a => a.id === registro.actividad_id);
            
            if (usuario && actividad) {
                const fila = document.createElement('tr');
                const horas = Utils.calculateHoursDiff(registro.fecha_hora_ingreso, new Date());
                
                fila.innerHTML = `
                    <td>${usuario.nombre}</td>
                    <td>${actividad.nombre}</td>
                    <td>${Utils.formatTime(registro.fecha_hora_ingreso)}</td>
                    <td>${horas.toFixed(2)}h</td>
                `;
                
                tbody.appendChild(fila);
            }
        });
    },
    
    // Actualizar tabla de actividad reciente (admin)
    actualizarActividadReciente() {
        const tbody = document.getElementById('admin-actividad-reciente');
        if (!tbody) return;
        
        const data = Storage.loadData();
        
        // Últimos 5 registros de salida
        const registrosRecientes = data.registros
            .filter(r => r.fecha_hora_salida)
            .sort((a, b) => new Date(b.fecha_hora_salida) - new Date(a.fecha_hora_salida))
            .slice(0, 5);
        
        tbody.innerHTML = '';
        
        if (registrosRecientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay actividad reciente</td></tr>';
            return;
        }
        
        registrosRecientes.forEach(registro => {
            const usuario = data.usuarios.find(u => u.id === registro.usuario_id);
            const actividad = data.actividades.find(a => a.id === registro.actividad_id);
            
            if (usuario && actividad) {
                const fila = document.createElement('tr');
                
                fila.innerHTML = `
                    <td>${usuario.nombre}</td>
                    <td>${actividad.nombre}</td>
                    <td>${Utils.formatTime(registro.fecha_hora_salida)}</td>
                `;
                
                tbody.appendChild(fila);
            }
        });
    }
};
// Manejo del panel de administración
const Admin = {
    // Inicializar panel de administración
    init() {
        this.inicializarEventos();
        this.actualizarNotificaciones();
    },
    
    // Inicializar eventos del admin
    inicializarEventos() {
        // Navegación de tabs
        document.querySelectorAll('#admin-system .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(6); // Remover "admin-"
                this.cambiarSeccion(target);
            });
        });
        
        // Botones de acción
        document.getElementById('admin-aplicar-filtros').addEventListener('click', () => {
            this.cargarHistoricoCompleto();
        });
        
        document.getElementById('admin-buscar-usuario').addEventListener('input', () => {
            this.cargarUsuarios();
        });
        
        // Inicializar filtros
        this.inicializarFiltros();
    },
    
    // Cambiar sección del admin
    cambiarSeccion(seccion) {
        // Actualizar navegación
        document.querySelectorAll('#admin-system .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#admin-${seccion}`) {
                link.classList.add('active');
            }
        });
        
        // Ocultar todas las secciones
        document.querySelectorAll('#admin-system .tab-content').forEach(sec => {
            sec.classList.add('hidden');
        });
        
        // Mostrar sección seleccionada
        const seccionElement = document.getElementById(`admin-${seccion}`);
        if (seccionElement) {
            seccionElement.classList.remove('hidden');
        }
        
        // Cargar datos específicos
        switch(seccion) {
            case 'personal':
                this.cargarUsuarios();
                break;
            case 'historico':
                this.cargarHistoricoCompleto();
                break;
            case 'alertas':
                this.cargarAlertas();
                break;
        }
    },
    
    // Actualizar contador de notificaciones
    actualizarNotificaciones() {
        const data = Storage.loadData();
        const alertasPendientes = data.notificaciones.filter(n => !n.leida).length;
        const notificationBadge = document.getElementById('admin-notification-count');
        
        notificationBadge.textContent = alertasPendientes;
        if (alertasPendientes > 0) {
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    },
    
    // Cargar usuarios en la tabla
    cargarUsuarios() {
        const tbody = document.getElementById('admin-personal-table');
        if (!tbody) return;
        
        const data = Storage.loadData();
        const busqueda = document.getElementById('admin-buscar-usuario').value.toLowerCase();
        
        let usuariosFiltrados = data.usuarios;
        
        if (busqueda) {
            usuariosFiltrados = data.usuarios.filter(u => 
                u.nombre.toLowerCase().includes(busqueda) || 
                u.legajo.toLowerCase().includes(busqueda)
            );
        }
        
        tbody.innerHTML = '';
        
        if (usuariosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron usuarios</td></tr>';
            return;
        }
        
        usuariosFiltrados.forEach(usuario => {
            const fila = document.createElement('tr');
            
            fila.innerHTML = `
                <td>${usuario.legajo}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.rango}</td>
                <td>${usuario.usuario}</td>
                <td>${usuario.activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'}</td>
                <td>
                    <button class="btn-outline btn-sm" onclick="Admin.editarUsuario(${usuario.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            
            tbody.appendChild(fila);
        });
    },
    
    // Cargar histórico completo
    cargarHistoricoCompleto() {
        const tbody = document.getElementById('admin-historico-table');
        if (!tbody) return;
        
        const data = Storage.loadData();
        
        // Aplicar filtros
        const filtroUsuario = document.getElementById('admin-filtro-usuario').value;
        const filtroFecha = document.getElementById('admin-filtro-fecha').value;
        const filtroActividad = document.getElementById('admin-filtro-actividad').value;
        
        let registrosFiltrados = [...data.registros];
        
        if (filtroUsuario) {
            registrosFiltrados = registrosFiltrados.filter(r => r.usuario_id === parseInt(filtroUsuario));
        }
        
        if (filtroFecha) {
            registrosFiltrados = registrosFiltrados.filter(r => {
                const fechaRegistro = new Date(r.fecha_hora_ingreso).toISOString().split('T')[0];
                return fechaRegistro === filtroFecha;
            });
        }
        
        if (filtroActividad) {
            registrosFiltrados = registrosFiltrados.filter(r => r.actividad_id === parseInt(filtroActividad));
        }
        
        // Ordenar por fecha (más recientes primero)
        registrosFiltrados.sort((a, b) => new Date(b.fecha_hora_ingreso) - new Date(a.fecha_hora_ingreso));
        
        tbody.innerHTML = '';
        
        if (registrosFiltrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros para mostrar</td></tr>';
            return;
        }
        
        // Llenar la tabla
        registrosFiltrados.forEach(registro => {
            const usuario = data.usuarios.find(u => u.id === registro.usuario_id);
            const actividad = data.actividades.find(a => a.id === registro.actividad_id);
            
            const fila = document.createElement('tr');
            
            const horasTrabajadas = registro.fecha_hora_salida ? 
                Utils.calculateHoursDiff(registro.fecha_hora_ingreso, registro.fecha_hora_salida) : 0;
            
            const estado = registro.fecha_hora_salida ? 
                (actividad && actividad.nombre === "Guardia" && horasTrabajadas < data.config.horasGuardiaRequeridas ? 
                 '<span class="badge badge-warning">Incompleta</span>' : 
                 '<span class="badge badge-success">Completada</span>') : 
                '<span class="badge badge-info">En curso</span>';
            
            fila.innerHTML = `
                <td>${Utils.formatDate(registro.fecha_hora_ingreso)}</td>
                <td>${usuario ? usuario.legajo : 'N/A'}</td>
                <td>${usuario ? usuario.nombre : 'N/A'}</td>
                <td>${actividad ? actividad.nombre : 'N/A'}</td>
                <td>${horasTrabajadas > 0 ? horasTrabajadas.toFixed(2) + 'h' : '-'}</td>
                <td>${estado}</td>
            `;
            
            tbody.appendChild(fila);
        });
    },
    
    // Cargar alertas
    cargarAlertas() {
        const tbody = document.getElementById('admin-alertas-table');
        if (!tbody) return;
        
        const data = Storage.loadData();
        
        // Ordenar notificaciones por fecha (más recientes primero)
        const notificacionesOrdenadas = [...data.notificaciones].sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha)
        );
        
        tbody.innerHTML = '';
        
        if (notificacionesOrdenadas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay alertas</td></tr>';
            return;
        }
        
        notificacionesOrdenadas.forEach(notificacion => {
            const usuario = data.usuarios.find(u => u.id === notificacion.usuario_id);
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${Utils.formatDate(notificacion.fecha)}</td>
                <td>${usuario ? usuario.nombre : 'N/A'}</td>
                <td><span class="badge badge-danger">${notificacion.tipo}</span></td>
                <td>${notificacion.mensaje}</td>
                <td>
                    ${!notificacion.leida ? 
                        `<button class="btn-success btn-sm" onclick="Admin.marcarAlertaLeida('${notificacion.id}')">
                            <i class="fas fa-check"></i> Marcar leída
                        </button>` : 
                        '<span class="badge badge-success">Leída</span>'
                    }
                </td>
            `;
            
            tbody.appendChild(fila);
        });
    },
    
    // Marcar alerta como leída
    marcarAlertaLeida(id) {
        const data = Storage.loadData();
        const notificacion = data.notificaciones.find(n => n.id === id);
        
        if (notificacion) {
            notificacion.leida = true;
            Storage.saveData(data);
            this.cargarAlertas();
            this.actualizarNotificaciones();
        }
    },
    
    // Inicializar filtros
    inicializarFiltros() {
        const select = document.getElementById('admin-filtro-usuario');
        if (!select) return;
        
        const data = Storage.loadData();
        
        select.innerHTML = '<option value="">Todos los usuarios</option>';
        
        data.usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = `${usuario.legajo} - ${usuario.nombre}`;
            select.appendChild(option);
        });
    },
    
    // Editar usuario (placeholder)
    editarUsuario(id) {
        alert(`Funcionalidad de editar usuario ${id} - En desarrollo`);
    }
};
// Aplicación principal - Coordina todos los módulos
const App = {
    // Inicializar la aplicación
    init() {
        // Inicializar módulos
        Auth.init();
        Registro.init();
        Dashboard.init();
        Admin.init();
        
        // Configurar autocompletado de legajos
        this.configurarAutocompletado();
        
        console.log('Sistema de Bomberos inicializado correctamente');
    },
    
    // Iniciar sistema después del login
    iniciarSistema() {
        // Ocultar pantalla de login
        Utils.toggleElement('login-screen', false);
        
        // Actualizar información del usuario en la UI
        this.actualizarInfoUsuario();
        
        // Mostrar sistema correspondiente
        if (Auth.usuarioActual.admin) {
            Utils.toggleElement('admin-system', true);
            Utils.toggleElement('main-system', false);
            Admin.cambiarSeccion('dashboard');
        } else {
            Utils.toggleElement('main-system', true);
            Utils.toggleElement('admin-system', false);
            UI.cambiarSeccionBombero('dashboard');
        }
        
        // Actualizar dashboard
        Dashboard.actualizar();
    },
    
    // Cerrar sesión
    cerrarSesion() {
        Utils.toggleElement('main-system', false);
        Utils.toggleElement('admin-system', false);
        Utils.toggleElement('login-screen', true);
        
        // Limpiar formularios
        Utils.clearForm('login-form');
        Utils.clearForm('ingreso-form');
        Utils.clearForm('salida-form');
        
        // Ocultar errores de login
        Utils.toggleElement('login-error', false);
    },
    
    // Actualizar información del usuario en la UI
    actualizarInfoUsuario() {
        if (Auth.usuarioActual) {
            document.getElementById('user-name').textContent = Auth.usuarioActual.nombre;
            document.getElementById('user-rank').textContent = Auth.usuarioActual.rango;
            
            // Actualizar también en admin si existe
            const adminUserName = document.getElementById('admin-user-name');
            if (adminUserName) {
                adminUserName.textContent = Auth.usuarioActual.nombre;
            }
        }
    },
    
    // Configurar autocompletado de legajos en formularios
    configurarAutocompletado() {
        // Rellenar automáticamente el legajo en los formularios para usuarios no admin
        if (Auth.usuarioActual && !Auth.usuarioActual.admin) {
            document.getElementById('legajo').value = Auth.usuarioActual.legajo;
            document.getElementById('legajo-salida').value = Auth.usuarioActual.legajo;
        }
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Objeto UI para manejar la interfaz (separa del código de negocio)
const UI = {
    // Mostrar alerta
    mostrarAlerta(mensaje, tipo, sistema = 'main') {
        let containerId = 'alert-container';
        if (sistema === 'admin') {
            containerId = 'admin-alert-container';
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${mensaje}
        `;
        
        container.appendChild(alertDiv);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    },
    
    // Cambiar sección del sistema bombero
    cambiarSeccionBombero(seccion) {
        // Actualizar navegación
        document.querySelectorAll('#main-system .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${seccion}`) {
                link.classList.add('active');
            }
        });
        
        // Ocultar todas las secciones
        document.querySelectorAll('#main-system .tab-content').forEach(sec => {
            sec.classList.add('hidden');
        });
        
        // Mostrar sección seleccionada
        const seccionElement = document.getElementById(seccion);
        if (seccionElement) {
            seccionElement.classList.remove('hidden');
        }
        
        // Cargar datos específicos de la sección
        if (seccion === 'historial') {
            this.cargarHistorialPersonal();
        }
    },
    
    // Cargar historial personal
    cargarHistorialPersonal() {
        const tbody = document.getElementById('historial-table-body');
        if (!tbody) return;
        
        const data = Storage.loadData();
        const filtroMes = document.getElementById('filtro-fecha-historial').value;
        
        let registrosUsuario = data.registros.filter(r => r.usuario_id === Auth.usuarioActual.id);
        
        // Aplicar filtro por mes
        if (filtroMes) {
            const [anio, mes] = filtroMes.split('-');
            registrosUsuario = registrosUsuario.filter(r => {
                const fecha = new Date(r.fecha_hora_ingreso);
                return fecha.getFullYear() === parseInt(anio) && 
                       fecha.getMonth() + 1 === parseInt(mes);
            });
        }
        
        // Ordenar por fecha (más recientes primero)
        registrosUsuario.sort((a, b) => new Date(b.fecha_hora_ingreso) - new Date(a.fecha_hora_ingreso));
        
        tbody.innerHTML = '';
        
        if (registrosUsuario.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros para mostrar</td></tr>';
            return;
        }
        
        registrosUsuario.forEach(registro => {
            const actividad = data.actividades.find(a => a.id === registro.actividad_id);
            
            const fila = document.createElement('tr');
            
            const fechaIngreso = new Date(registro.fecha_hora_ingreso);
            const fechaSalida = registro.fecha_hora_salida ? new Date(registro.fecha_hora_salida) : null;
            
            const horasTrabajadas = registro.fecha_hora_salida ? 
                Utils.calculateHoursDiff(registro.fecha_hora_ingreso, registro.fecha_hora_salida) : 0;
            
            const estado = registro.fecha_hora_salida ? 
                (actividad && actividad.nombre === "Guardia" && horasTrabajadas < data.config.horasGuardiaRequeridas ? 
                 '<span class="badge badge-warning">Incompleta</span>' : 
                 '<span class="badge badge-success">Completada</span>') : 
                '<span class="badge badge-info">En curso</span>';
            
            fila.innerHTML = `
                <td>${Utils.formatDate(registro.fecha_hora_ingreso)}</td>
                <td>${actividad ? actividad.nombre : 'N/A'}</td>
                <td>${Utils.formatTime(registro.fecha_hora_ingreso)}</td>
                <td>${fechaSalida ? Utils.formatTime(fechaSalida) : '-'}</td>
                <td>${horasTrabajadas > 0 ? horasTrabajadas.toFixed(2) + 'h' : '-'}</td>
                <td>${estado}</td>
            `;
            
            tbody.appendChild(fila);
        });
    }
};
