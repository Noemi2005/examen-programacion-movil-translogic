const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('translogic_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'Error en la petición';
      try {
        const errorData = await response.json();
        errorMessage = Array.isArray(errorData.error)
          ? errorData.error.join(', ')
          : errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Si es blob (como descarga de PDF)
    if (response.headers.get('content-type')?.includes('application/pdf')) {
      return response.blob() as unknown as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; usuario: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Clientes
  async getClientes() {
    return this.request<any[]>('/clientes');
  }

  async createCliente(data: any) {
    return this.request<any>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Vehículos
  async getVehiculos(search?: string, tipo?: string, estado?: string) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tipo) params.append('tipo', tipo);
    if (estado) params.append('estado', estado);
    return this.request<any[]>(`/vehiculos?${params.toString()}`);
  }

  async getVehiculo(id: string) {
    return this.request<any>(`/vehiculos/${id}`);
  }

  async createVehiculo(data: any) {
    return this.request<any>('/vehiculos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVehiculo(id: string, data: any) {
    return this.request<any>(`/vehiculos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getEficienciaVehiculo(id: string) {
    return this.request<any>(`/vehiculos/${id}/eficiencia`);
  }

  // Servicios
  async getServicios(page = 1, limit = 10, estado?: string, clienteId?: string, vehiculoId?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (estado) params.append('estado', estado);
    if (clienteId) params.append('clienteId', clienteId);
    if (vehiculoId) params.append('vehiculoId', vehiculoId);
    return this.request<any>(`/servicios?${params.toString()}`);
  }

  async simularTarifa(data: { vehiculoId: string; distanciaKm: number; pesoCargaKg: number; recargaPlanificada?: boolean }) {
    return this.request<any>('/servicios/simular-tarifa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createServicio(data: any) {
    return this.request<any>('/servicios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async asignarVehiculo(id: string, vehiculoId: string, recargaPlanificada?: boolean) {
    return this.request<any>(`/servicios/${id}/asignacion`, {
      method: 'PATCH',
      body: JSON.stringify({ vehiculoId, recargaPlanificada }),
    });
  }

  async actualizarEstadoServicio(id: string, nuevoEstado: string) {
    return this.request<any>(`/servicios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevoEstado }),
    });
  }

  // Facturas
  async getFacturas() {
    return this.request<any[]>('/facturas');
  }

  async getFactura(id: string) {
    return this.request<any>(`/facturas/${id}`);
  }

  async createFactura(data: { clienteId: string; serviciosIds: string[]; codigo?: string }) {
    return this.request<any>('/facturas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async descargarFacturaPdf(id: string) {
    const token = this.getToken();
    const response = await fetch(`${API_URL}/facturas/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('No se pudo descargar el comprobante');
    return response.blob();
  }

  // Dashboard y Reportes
  async getDashboardRentabilidad(mes?: string, anio?: string, tipoVehiculo?: string) {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    if (tipoVehiculo) params.append('tipoVehiculo', tipoVehiculo);
    return this.request<any>(`/reportes/rentabilidad?${params.toString()}`);
  }

  async getConsultaAvanzada(consultaKey: string, paramsObj?: Record<string, string>) {
    const params = new URLSearchParams(paramsObj);
    return this.request<any[]>(`/reportes/consultas/${consultaKey}?${params.toString()}`);
  }
}

export const api = new ApiClient();
