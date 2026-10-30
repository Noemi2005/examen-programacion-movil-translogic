// Utilitario centralizado de alertas con SweetAlert2 importado en index.html

declare global {
  interface Window {
    Swal?: any;
  }
}

const getSwal = () => {
  if (typeof window !== 'undefined' && window.Swal) {
    return window.Swal;
  }
  return null;
};

// Configuración base de estilos corporativos de Translogic S.A.
const swalOptions = {
  customClass: {
    popup: 'rounded-none border-2 border-[#13235B] shadow-[8px_8px_0_#13235B]',
    confirmButton: 'btn bg-[#13235B] hover:bg-[#0D1A4A] text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-none',
    cancelButton: 'btn bg-[#D5DAE6] hover:bg-[#8D9AC0] text-[#13235B] text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-none ml-2',
    title: 'font-display font-black text-xl text-[#13235B] uppercase tracking-wide',
    htmlContainer: 'font-sans text-xs text-[#5B6480] leading-relaxed',
  },
  buttonsStyling: false,
};

export const alerts = {
  // Alerta de Éxito
  showSuccess: async (title: string, text?: string) => {
    const swal = getSwal();
    if (swal) {
      return swal.fire({
        ...swalOptions,
        icon: 'success',
        iconColor: '#1E9E5A',
        title,
        text,
        confirmButtonText: 'ENTENDIDO',
      });
    } else {
      alert(`${title}\n${text || ''}`);
    }
  },

  // Alerta de Error
  showError: async (title: string, text?: string) => {
    const swal = getSwal();
    if (swal) {
      return swal.fire({
        ...swalOptions,
        icon: 'error',
        iconColor: '#C62828',
        title,
        text,
        confirmButtonText: 'CORREGIR',
      });
    } else {
      alert(`ERROR: ${title}\n${text || ''}`);
    }
  },

  // Alerta de Advertencia
  showWarning: async (title: string, text?: string) => {
    const swal = getSwal();
    if (swal) {
      return swal.fire({
        ...swalOptions,
        icon: 'warning',
        iconColor: '#F5A623',
        title,
        text,
        confirmButtonText: 'CONTINUAR',
      });
    } else {
      alert(`ADVERTENCIA: ${title}\n${text || ''}`);
    }
  },

  // Cuadro de Confirmación (Pregunta Sí/No)
  showConfirm: async (title: string, text: string, confirmText = 'SÍ, CONFIRMAR'): Promise<boolean> => {
    const swal = getSwal();
    if (swal) {
      const result = await swal.fire({
        ...swalOptions,
        icon: 'question',
        iconColor: '#F5A623',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'CANCELAR',
        reverseButtons: true,
      });
      return Boolean(result.isConfirmed);
    } else {
      return window.confirm(`${title}\n${text}`);
    }
  },

  // Notificación tipo Toast (esquina superior derecha)
  showToast: (title: string, icon: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const swal = getSwal();
    if (swal) {
      const Toast = swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-none border-2 border-[#13235B] shadow-md font-sans text-xs bg-white',
        },
      });
      Toast.fire({
        icon,
        title,
      });
    } else {
      console.log(`[Toast] ${icon}: ${title}`);
    }
  },
};

