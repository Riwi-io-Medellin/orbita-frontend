# Órbita — frontend

Punto de entrada único al ecosistema Riwi: inicia sesión con los proveedores habilitados por el backend (Moodle, Microsoft o fallback local), muestra las aplicaciones autorizadas y ofrece administración de usuarios, clientes SSO, roles y auditoría a platform admins. Es una SPA React 19 + TypeScript + Vite; usa la cookie HTTP-only del backend y nunca maneja tokens en JavaScript.

Consulta `AGENTS.md` para arquitectura, rutas, seguridad, identidad visual y reglas de contribución. Los contratos HTTP y SSO viven en el repositorio `orbita-backend`.

## Setup

```bash
pnpm install
cp .env.example .env   # set VITE_API_URL to your backend
pnpm dev
```

## Scripts

- `pnpm dev` — Vite dev server
- `pnpm build` — type-check (`tsc -b`) then production build
- `pnpm lint` — ESLint over the whole repo
- `pnpm preview` — preview the production build locally

No test runner is configured yet.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base `/api` del backend para auth, catálogo y administración | none — required |
| `VITE_APP_NAME` | Document title | `Órbita` |

## Rutas principales

- `/auth`: selección de método y login local.
- `/auth/moodle`: login/recuperación delegados a Moodle.
- `/auth/callback`: resultado del OAuth de Microsoft.
- `/apps`: launcher autorizado.
- `/users`, `/admin/registry`, `/audit`: administración protegida para platform admins.

Las cuentas locales creadas por un admin reciben una contraseña temporal y son enviadas a Configuración para reemplazarla en su primer acceso. Las cuentas Moodle y Microsoft gestionan sus credenciales en el proveedor externo.

Las tarjetas del launcher usan assets de marca locales; Match muestra `public/match-logo.svg`.

La interfaz comparte un encabezado de página, separadores ligeros y una única superficie principal por vista. La configuración técnica de una app se mantiene como contenido progresivo para priorizar roles y accesos cotidianos.

La UI debe consultar `/auth/providers` y mostrar únicamente métodos habilitados. Los guards del frontend mejoran la UX; los permisos reales siempre los aplica el backend.
