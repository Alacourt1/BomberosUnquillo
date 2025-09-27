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
