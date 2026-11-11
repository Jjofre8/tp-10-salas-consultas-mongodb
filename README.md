
# TP 10 - Consultas de reservas paso a paso

**Módulo 3 - Desarrollo Back-end con Node.js**  
**UNCA - Universidad Nacional de Catamarca**

**Proyecto:** `tp-10-salas-consultas-mongodb`

## 1. Introducción

Este trabajo práctico continúa el desarrollo realizado en el TP09, incorporando consultas avanzadas al listado de reservas almacenadas en MongoDB Atlas.

Se implementan cuatro funcionalidades:

- Filtrado opcional por sala.
- Ordenamiento por estudiante o cantidad de personas.
- Paginación con límites definidos.
- Selección de los campos necesarios para la respuesta.

Se conserva el CRUD completo, las vistas HTML con EJS, el formulario de creación, los detalles individuales y el endpoint `/estado`.

Las consultas no modifican documentos ni incorporan nuevos modelos.

## 2. Tecnologías utilizadas

- Node.js con soporte para `--env-file`.
- Express 5.
- MongoDB Atlas Free.
- Mongoose 9.
- EJS.
- express-ejs-layouts.
- Morgan.
- ESLint.
- Prettier.
- Postman.

Las versiones concretas de las dependencias se encuentran en `package.json` y `package-lock.json`.

El proyecto utiliza CommonJS.

## 3. Configuración de MongoDB Atlas

Se utiliza MongoDB Atlas Free con la siguiente configuración:

| Elemento | Valor |
| --- | --- |
| Base de datos | `reservas_salas_u10` |
| Colección | `reservas` |
| Puerto local | `3000` |
| Variable de conexión | `MONGODB_URI` |

La base del TP10 es independiente de las utilizadas en las entregas anteriores.

Se conserva la configuración DNS autorizada desde la unidad 7.

### Variables de entorno

Crear un archivo `.env` a partir de `.env.example`.

```dotenv
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u10?retryWrites=true&w=majority
```

Los valores `USUARIO`, `CLAVE` y `HOST` deben reemplazarse por los correspondientes a MongoDB Atlas.

El archivo `.env` contiene información privada y no debe publicarse.

## 4. Instalación y ejecución

Clonar el repositorio:

```bash
git clone https://github.com/Jjofre8/tp-10-salas-consultas-mongodb.git
```

Ingresar al proyecto:

```bash
cd tp-10-salas-consultas-mongodb
```

Instalar las dependencias:

```powershell
npm.cmd ci
```

Verificar formato y calidad:

```powershell
npm.cmd run check
```

Comprobar la conexión con MongoDB Atlas:

```powershell
node --env-file=.env scripts/comprobar-conexion.js
```

Iniciar el servidor:

```powershell
node --env-file=.env src/index.js
```

La aplicación utiliza la dirección:

`http://localhost:3000`

## 5. Organización del proyecto

```text
tp-10-salas-consultas-mongodb/
├── src/
│   ├── config/
│   │   ├── base-datos.js
│   │   └── entorno.js
│   ├── controladores/
│   │   ├── reservas.js
│   │   └── reservas-api.js
│   ├── middleware/
│   │   ├── reservas.js
│   │   └── solicitudes.js
│   ├── modelos/
│   │   └── reserva.js
│   ├── rutas/
│   │   ├── reservas.js
│   │   └── reservas-api.js
│   ├── servicios/
│   │   └── reservas.js
│   ├── app.js
│   └── index.js
├── scripts/
│   ├── comprobar-conexion.js
│   ├── crear-reserva.js
│   └── listar-reservas.js
├── views/
├── public/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

La aplicación mantiene la separación por capas.

Las rutas reciben solicitudes HTTP, los controladores procesan los parámetros y las respuestas, y el servicio realiza las operaciones sobre MongoDB mediante Mongoose.

## 6. Modelo de reservas

Cada reserva contiene los siguientes campos:

| Campo | Tipo | Validación |
| --- | --- | --- |
| estudiante | String | Obligatorio |
| email | String | Obligatorio, contiene @ |
| sala | String | Sala permitida |
| fecha | String | Obligatorio |
| turno | String | Mañana, Tarde o Noche |
| personas | Number | Entero entre 1 y 6 |
| estado | String | pendiente o confirmada |

El estado predeterminado de una reserva nueva es `pendiente`.

MongoDB genera automáticamente el identificador `_id`, que se representa como `id` en las respuestas públicas.

No se exponen `_id` ni `__v` directamente.

## 7. Consultas implementadas

### 7.1. Filtro por sala

La API permite filtrar reservas mediante el parámetro `sala`.

Ejemplo:

```http
GET /api/reservas?sala=Sala%20Norte
```

El filtro aplica igualdad exacta después de eliminar espacios al principio y al final.

Si no se proporciona `sala`, se consideran todas las reservas.

Una sala sin coincidencias devuelve una respuesta 200 con `datos` vacío.

No se implementa búsqueda aproximada.

### 7.2. Ordenamiento

El parámetro `orden` admite tres valores:

| Valor | Comportamiento |
| --- | --- |
| estudiante | Orden alfabético ascendente |
| personas-asc | Cantidad ascendente |
| personas-desc | Cantidad descendente |

El valor predeterminado es `estudiante`.

Ejemplo:

```http
GET /api/reservas?orden=personas-asc
```

El servicio utiliza `_id` ascendente como criterio de desempate.

No se permite que el cliente envíe campos arbitrarios para ordenar.

### 7.3. Paginación

La API utiliza dos parámetros:

- `pagina`: entero entre 1 y 1000.
- `limite`: entero entre 1 y 20.

Valores predeterminados:

```text
pagina = 1
limite = 2
```

Ejemplo:

```http
GET /api/reservas?pagina=2&limite=2
```

El desplazamiento se calcula mediante:

```javascript
const salto = (pagina - 1) * limite;
```

MongoDB aplica `sort`, `skip` y `limit` para obtener los documentos correspondientes.

El total se calcula con `countDocuments(filtro)`.

La cantidad de páginas se obtiene con:

```javascript
Math.ceil(total / limite)
```

Si se solicita una página sin resultados, se devuelve 200 con un arreglo vacío. No se modifica automáticamente el número solicitado.

### 7.4. Selección de campos

Las consultas utilizan `select` para obtener:

```javascript
.select("estudiante email sala fecha turno personas estado")
```

Mongoose conserva `_id` para construir el identificador público.

Esta selección no elimina información de la base ni permite que el cliente solicite campos arbitrarios.

El parámetro `select` no está permitido.

## 8. Contrato final de la API

### Listado de reservas

```http
GET /api/reservas
```

Devuelve un objeto con cinco propiedades:

```json
{
  "datos": [],
  "pagina": 1,
  "limite": 2,
  "total": 0,
  "paginas": 0
}
```

Cada elemento de `datos` contiene:

- id
- estudiante
- email
- sala
- fecha
- turno
- personas
- estado

### Métodos disponibles

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | /api/reservas | Listado paginado |
| GET | /api/reservas/:id | Reserva individual |
| POST | /api/reservas | Creación |
| PUT | /api/reservas/:id | Reemplazo completo |
| PATCH | /api/reservas/:id | Actualización parcial |
| DELETE | /api/reservas/:id | Eliminación física |

Se mantienen los contratos del TP09 para las operaciones individuales.

POST devuelve 201 y el encabezado `Location`.

PUT reemplaza los siete campos editables.

PATCH permite modificar únicamente `personas` y `estado`.

DELETE devuelve 204 cuando elimina correctamente una reserva.

## 9. Datos de prueba

Se preparan seis reservas ficticias para las pruebas del TP10.

Todas utilizan:

```text
fecha: 2026-10-28
turno: Mañana
estado: pendiente
```

| Estudiante | Email | Sala | Personas |
| --- | --- | --- | --- |
| Ana Ejemplo | <ana@example.com> | Sala Norte | 2 |
| Bruno Ejemplo | <bruno@example.com> | Sala Norte | 1 |
| Carla Ejemplo | <carla@example.com> | Sala Norte | 2 |
| Diego Ejemplo | <diego@example.com> | Sala Norte | 3 |
| Elena Ejemplo | <elena@example.com> | Sala Sur | 1 |
| Fabian Ejemplo | <fabian@example.com> | Sala Multimedia | 4 |

Las reservas se crean mediante solicitudes POST individuales en Postman.

No se utilizan datos personales reales ni cargas automáticas al iniciar el servidor.

## 10. Pruebas en Postman

Colección sugerida: `TP 10 - Reservas`.

URL principal:

```text
http://localhost:3000/api/reservas
```

Para GET se utiliza `Body: none`.

Para POST, PUT y PATCH se utiliza `Body: raw - JSON`.

### Consultas válidas

| Consulta | Resultado esperado |
| --- | --- |
| Sin parámetros | 2 reservas, total 6, páginas 3 |
| sala=Sala Norte | Total 4 |
| orden=personas-asc | Orden ascendente |
| orden=personas-desc | Orden descendente |
| pagina=1&limite=2 | Primera página |
| pagina=2&limite=2 | Segunda página |
| Sala Norte, página 3 | Datos vacíos, total 4 |
| Sala inexistente | Datos vacíos, total 0 |

Los totales indicados corresponden a las seis reservas iniciales sin escrituras adicionales.

### Consultas inválidas

| Consulta | Código esperado |
| --- | --- |
| pagina=0 | 400 |
| pagina=1.5 | 400 |
| limite=21 | 400 |
| pagina repetida | 400 |
| sala vacía | 400 |
| sala repetida | 400 |
| orden=otro | 400 |
| select=email | 400 |

Los parámetros desconocidos y repetidos se rechazan.

Los errores de consulta no modifican documentos en MongoDB.

### Ejemplo de consulta combinada

```http
GET /api/reservas?sala=Sala%20Norte&orden=personas-asc&pagina=1&limite=2
```

Con los datos iniciales:

- Estado HTTP 200.
- Dos reservas.
- Total de coincidencias: 4.
- Total de páginas: 2.
- Orden ascendente por personas.

Al cambiar a `pagina=2`, aparecen las otras dos reservas de Sala Norte.

Los resultados se mantienen estables mientras no se realicen escrituras.

## 11. Continuidad del TP09

Las siguientes funcionalidades se conservan:

| Ruta | Funcionalidad |
| --- | --- |
| / | Página de inicio |
| /reservas | Listado HTML |
| /reservas/nueva | Formulario |
| /reservas/:id | Detalle HTML |
| POST /reservas | Creación desde formulario |
| /estado | Estado del servidor |
| /css/estilos.css | Estilos |

El formulario válido mantiene la redirección 302.

Un formulario inválido devuelve 400 y conserva los valores ingresados.

El listado HTML utiliza `listar`, sin paginación.

El endpoint `/estado` utiliza `contar`, por lo que informa la cantidad global de reservas.

La consulta API utiliza `consultar`, independientemente del listado HTML.

## 12. Relaciones entre salas y reservas

Si se incorporara información propia de las salas, tendría sentido separar los datos que describen una sala de aquellos que describen cada reserva.

Una sala podría tener nombre, ubicación, capacidad máxima, equipamiento y disponibilidad. En cambio, una reserva contiene estudiante, correo electrónico, fecha, turno, cantidad de personas y estado.

Una alternativa sería utilizar una referencia desde cada reserva hacia el documento de su sala. Esto evitaría repetir información y facilitaría actualizar las características de una sala sin modificar todas sus reservas.

También podría considerarse el uso de datos embebidos cuando resulte útil conservar información específica de la sala al momento de reservar, por ejemplo, una descripción histórica o condiciones particulares.

La elección depende de cómo se consulten y actualicen los datos. Para este trabajo se conserva únicamente el modelo de reservas existente, sin implementar relaciones ni `populate`.

## 13. Calidad y verificaciones

El proyecto utiliza Prettier y ESLint.

Para aplicar formato:

```powershell
npx.cmd prettier --write src scripts
```

Para comprobar el proyecto:

```powershell
npm.cmd run check
```

Durante el desarrollo del TP10 se verificó que las comprobaciones de formato y ESLint finalizaran sin errores.

También se comprobó la respuesta paginada de Sala Norte, página 2, con dos reservas, total 4 y páginas 2.

Las restantes pruebas funcionales deben respaldarse con sus resultados registrados.

## 14. Seguridad

El archivo `.env` no debe incluirse en GitHub.

Se conservan las variables de ejemplo mediante `.env.example`.

No se publican:

- Contraseñas.
- URI privadas de MongoDB Atlas.
- Carpeta `node_modules`.
- Datos personales reales.

El proyecto no incorpora autenticación ni autorización, ya que estas funcionalidades no forman parte de la consigna.

La aplicación está destinada a fines académicos y ejecución local.

## 15. Evidencias de funcionamiento

Para documentar la entrega se deben conservar las respuestas de Postman o capturas correspondientes a:

1. Creación de reservas mediante POST.
2. Consulta individual mediante GET.
3. Filtro por sala.
4. Orden ascendente y descendente.
5. Primera y segunda página.
6. Página sin resultados.
7. Parámetros inválidos con código 400.
8. Reemplazo mediante PUT.
9. Actualización mediante PATCH.
10. Eliminación mediante DELETE.
11. Continuidad de las vistas HTML.
12. Funcionamiento de `/estado`.

Las capturas deben mostrar el método, la URL, el estado HTTP y la respuesta.

Los resultados de las pruebas deben coincidir con los documentos efectivamente almacenados.

## 16. Entrega

El proyecto se entrega mediante un repositorio individual de GitHub:

`tp-10-salas-consultas-mongodb`

Debe contener:

- Código fuente.
- Vistas y estilos.
- Scripts.
- Archivos de configuración.
- `package.json`.
- `package-lock.json`.
- `.env.example`.
- `.gitignore`.
- README.
- Evidencias o colección exportada de Postman.

No se incluyen archivos privados, credenciales ni dependencias instaladas.

La entrega conserva el trabajo anterior e incorpora las consultas requeridas por la Unidad 10.
