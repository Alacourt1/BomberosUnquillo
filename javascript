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
