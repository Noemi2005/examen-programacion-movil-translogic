# TRANSLOGIC S.A. - Sistema Inteligente de Gestión de Flotas, Servicios y Facturación
> **Examen Práctico de Programación Móvil - Examen Parcial I**  
> **Nivel:** Intermedio | **Modalidad:** Individual | **Puntaje:** 3,00 puntos

---

## 1. Arquitectura de la Solución (3 Capas)

La solución está construida bajo una estricta arquitectura cliente-servidor desacoplada:

```
[ Frontend Móvil (Vite + React + TypeScript + Tailwind CSS) ]
                           │
                 (JSON REST / Bearer JWT)
                           ▼
[ Backend API REST (NestJS 10 + TypeScript + TypeORM + Jest) ]
                           │
                (Transacciones ACID / SQL)
                           ▼
        [ Base de Datos Relacional (PostgreSQL / pgAdmin) ]
```

---

## 2. Estructura del Repositorio y Ramas de Git

El proyecto sigue una estrategia basada en **Git Flow**:
* **`main`**: Rama principal de entrega y producción.
* **`dev`**: Rama integradora de desarrollo continuo.
* **`feature/...`**: Ramas de características específicas:
  * `feature/req-01-backend-database`: Modelado de datos, TypeORM, entidades y seeders reproducibles.
  * `feature/req-02-03-vehiculos-servicios`: Tarifas polimórficas, validaciones de carga/batería, control de solapamiento de horarios, auditoría y control de concurrencia.
  * `feature/req-06-08-frontend-mobile`: Interfaz móvil responsiva, cotizador de tarifas en vivo, liquidación simulada, generación de PDF y dashboard con gráficos.

---

## 3. Modelo de Datos y Entidades

1. **`usuarios`**: Administrador y Operador con contraseñas encriptadas mediante `bcrypt`.
2. **`clientes`**: RUC/Identificación, Razón social, correo y teléfono.
3. **`vehiculos`**: Placa única, marca, modelo, año, capacidad en kg, kilometraje, tipo y estado.
4. **`camiones_carga`**: Relación 1 a 1 con Vehículo (Consumo L/100km, precio diésel, número de ejes, costo mantenimiento/km).
5. **`furgonetas_electricas`**: Relación 1 a 1 con Vehículo (Capacidad batería kWh, consumo kWh/100km, costo kWh, autonomía nominal, porcentaje batería).
6. **`servicios_transporte`**: Origen, destino, distancia, peso, horario `[horaInicio, horaFinEstimada]`, recarga planificada, tarifa calculada y costo operativo.
7. **`historial_estados`**: Auditoría de cada transición de estado (`PROGRAMADO`, `EN_EJECUCION`, `COMPLETADO`, `CANCELADO`) registrando fecha y usuario responsable.
8. **`facturas`**: Facturación atómica de servicios completados con subtotal, recargos, descuentos e impuesto IVA 15%.
9. **`detalles_factura`**: Detalle 1 a 1 por servicio facturado para prevenir doble facturación.

---

## 4. Reglas de Negocio Implementadas

### A. Tarifas Polimórficas (Req-02)
* **Camión de carga**:
  $$\text{Costo Combustible} = (\text{distancia} / 100) \times \text{consumoLitros100Km} \times \text{precioLitro}$$
  $$\text{Costo Operativo} = \text{Costo Combustible} + (\text{distancia} \times \text{costoMantenimientoKm})$$
  $$\text{Tarifa Base} = \text{Costo Operativo} \times 1.35$$
  *Si el peso de la carga supera el 80% de la capacidad autorizada, se añade un **8% de recargo** a la tarifa base.*

* **Furgoneta eléctrica**:
  $$\text{Costo Energético} = (\text{distancia} / 100) \times \text{consumoKWh100Km} \times \text{costoKWh}$$
  $$\text{Tarifa Base} = (\text{Costo Energético} + 18) \times 1.30$$
  *Si la distancia supera el 80% de la autonomía nominal, se añade un **10% de recargo** a la tarifa base.*
  *Se rechaza el inicio si no hay energía suficiente para la distancia, salvo que se registre recarga planificada.*

### B. Control de Concurrencia y Horarios (Req-03)
* **Solapamiento horaria**: Se valida en base de datos que un vehículo no tenga otro servicio activo o programado en el intervalo $[\text{horaInicio}, \text{horaFinEstimada}]$ en la misma fecha.
* **Concurrencia**: Al asignar un vehículo, se ejecuta un bloqueo pesimista en base de datos (`pessimistic_write`) para serializar transacciones concurrentes de múltiples operadores.
* **Kilometraje**: Se actualiza exactamente una vez en la base de datos al pasar el servicio al estado `COMPLETADO`.

### C. Facturación Atómica y Comprobante PDF Simulado (Req-04)
* Solo se pueden facturar servicios en estado `COMPLETADO` que no hayan sido facturados antes.
* **Recargo 6%** para servicios de más de 300 km.
* **Recargo 12%** para servicios realizados en día domingo.
* **Descuento del 5%** por cliente con 3 a 5 servicios completados en el mes; **Descuento del 10%** para 6 o más servicios.
* Emisión descargable de **Comprobante en PDF Simulado** (con leyenda legal obligatoria *"Sin validez tributaria ante el SRI"*).

---

## 5. Ocho Consultas Avanzadas en Base de Datos (Req-07)

Todas las consultas se ejecutan directamente en el motor PostgreSQL:
1. **Consulta 21**: Servicios cuyo costo operativo supera el promedio de servicios completados (`AVG` en subconsulta).
2. **Consulta 22**: Porcentaje de participación de cada vehículo en servicios completados (Cálculo proporcional sobre el total).
3. **Consulta 23**: Clientes con al menos 3 servicios completados en un período (`HAVING COUNT >= 3`).
4. **Consulta 24**: Vehículos sin servicios asignados durante un rango de fechas (`NOT EXISTS`).
5. **Consulta 25**: Cinco vehículos con mayor rentabilidad por ingresos, costos y margen (`ORDER BY utilidad DESC LIMIT 5`).
6. **Consulta 26**: Facturación mensual agrupada por tipo de vehículo y mes.
7. **Consulta 27**: Vehículos con eficiencia inferior al promedio de su categoría (mayor consumo).
8. **Consulta 28**: Clientes cuya facturación disminuyó más del 20% respecto al mes anterior (Función ventana analítica `LAG`).

---

## 6. Justificación Teórica de Seguridad (Req-09)

> ### ¿Por qué validar solo en el frontend no garantiza integridad?
> Validar datos únicamente en la capa cliente (frontend) es insuficiente y riesgoso por los siguientes motivos:
> 1. **Bypass de la interfaz de usuario**: Cualquier usuario o actor malicioso puede evadir los controles del navegador utilizando herramientas como Postman, cURL, extensiones de inspección HTTP o scripts automatizados, enviando datos manipulados directamente a la API REST.
> 2. **Integridad de datos y concurrencia**: Validaciones críticas como la prevención de horarios superpuestos, la verificación de saldo de batería, la capacidad física del vehículo o la no-duplicación de facturas requieren transacciones atómicas (`ACID`) y bloqueos a nivel de motor de base de datos que el frontend no puede garantizar.
> 3. **Consistencia de cálculos financieros**: Si el cálculo de tarifas o impuestos se ejecutara en el cliente, el importe a cobrar podría ser alterado antes de enviarlo. El servidor siempre debe recalcular y certificar todos los valores antes de persistir.

---

## 7. Instrucciones de Instalación y Ejecución

### Requisitos Previos:
* Node.js v18+ o v20+
* PostgreSQL v14+ y pgAdmin
* Git

### Paso 1: Configurar la Base de Datos en pgAdmin
1. Abre **pgAdmin** y conéctate a tu servidor local.
2. Crea una base de datos llamada: **`translogic_db`**.

### Paso 2: Configurar y Ejecutar el Backend (NestJS)
```bash
# Entrar a la carpeta del backend
cd backend

# Crear archivo de variables de entorno (ya configurado para PostgreSQL local)
cp .env.example .env

# Poblar la base de datos con datos de prueba reproducibles (Seed)
npm run seed

# Iniciar servidor en modo desarrollo
npm run start:dev
```
* **API REST:** `http://localhost:3000`
* **Documentación Swagger / OpenAPI:** `http://localhost:3000/api/docs`

### Paso 3: Ejecutar las Pruebas Automatizadas (Jest)
```bash
cd backend
npm test
```
*(Ejecuta las 8 pruebas automatizadas de tarifas, límites, horarios, facturación y seguridad).*

### Paso 4: Ejecutar el Frontend Móvil (Vite + React)
```bash
# En una terminal separada, entrar al frontend
cd frontend

# Iniciar servidor Vite
npm run dev
```
* **Aplicación Móvil Web:** `http://localhost:5173`

### Credenciales de Prueba Disponibles:
* **Administrador:** `admin@translogic.com` / `Admin123!`
* **Operador:** `operador@translogic.com` / `Operador123!`
*(Dispone de botones de acceso rápido con 1 solo clic en la pantalla de inicio).*
