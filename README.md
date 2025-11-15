# Sistema AVM – Backend

Backend del sistema AVM desarrollado con [NestJS](https://nestjs.com), TypeScript y MySQL.  
Expone APIs para la gestión de usuarios, beneficiarios, proyectos, beneficios y reportes.

---

## Tecnologías principales

- Node.js (NestJS 11) + TypeScript
- MySQL + TypeORM
- Autenticación con JWT (`@nestjs/jwt`)
- Manejo de archivos Excel con `exceljs`

---

## Requisitos previos

- Node.js 20+ y `npm`
- Servidor MySQL accesible (local o remoto)
- Opcional: Docker y Docker Compose

---

## Instalación

Clonar el repositorio y descargar dependencias:

```bash
git clone <URL_DEL_REPO>
cd sistema-avm-backend
npm install
```

> En entornos CI/CD se recomienda `npm ci`.

---

## Configuración (.env)

La aplicación usa variables de entorno para conectarse a la base de datos y firmar los JWT.  
Crear un archivo `.env` en la raíz del proyecto con, al menos:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=clave
DB_DATABASE=sistema_avm

JWT_SECRET=cambia-este-valor

# Puerto HTTP del backend (opcional, por defecto 3000)
PORT=3000
```

Notas:
- El esquema de la base de datos debe existir previamente (TypeORM está configurado con `synchronize: false`).
- Asegúrate de usar un `JWT_SECRET` seguro en producción.

---

## Compilar y ejecutar el proyecto

### Desarrollo

```bash
# Levantar la app en modo desarrollo (watch)
npm run start:dev
```

La API quedará disponible en `http://localhost:3000` (o el puerto definido en `PORT`).

### Compilar (build) y producción

```bash
# Compilar TypeScript a JavaScript (carpeta dist/)
npm run build

# Ejecutar la versión compilada
npm run start:prod
```

> `start:prod` asume que la carpeta `dist` ya fue generada con `npm run build`.

---

## Uso con Docker

Este repositorio incluye un `Dockerfile` listo para producción.

### Construir la imagen

```bash
docker build -t sistema-avm-backend .
```

### Ejecutar el contenedor

Usando el archivo `.env` de la raíz:

```bash
docker run --env-file .env -p 3000:3000 sistema-avm-backend
```

Si quieres usar otro puerto externo:

```bash
docker run --env-file .env -p 8080:3000 sistema-avm-backend
```

---

## Scripts disponibles

Desde `package.json`:

- `npm run start` – Ejecuta la app en modo desarrollo simple.
- `npm run start:dev` – Desarrollo con recarga automática (watch).
- `npm run build` – Compila el proyecto a `dist/`.
- `npm run start:prod` – Ejecuta `node dist/main`.
- `npm run lint` – Linter con ESLint.
- `npm run format` – Formatea código con Prettier.

---

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e
npm run test:e2e

# Cobertura de código
npm run test:cov
```

---

## Estructura básica del proyecto

Algunas carpetas importantes en `src/`:

- `auth/` – Autenticación y guardas JWT.
- `users/` – Gestión de usuarios.
- `beneficiarios/` – Gestión de beneficiarios.
- `proyectos/` – Gestión de proyectos, actividades y asistencias.
- `beneficios/` – Gestión de beneficios y entregas.
- `reporting/` – Vistas y entidades para reportes.
- `entities/` – Entidades TypeORM compartidas.

---

## Licencia

Este proyecto es **UNLICENSED** (ver `package.json`). Ajusta la licencia según las necesidades de tu organización.
