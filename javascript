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
