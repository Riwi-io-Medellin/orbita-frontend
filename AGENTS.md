# AGENTS.md — Órbita Frontend

## Propósito

Este repositorio es la interfaz web de Órbita, el punto de entrada único al ecosistema de aplicaciones de Riwi. Permite:

- iniciar sesión con una cuenta local de Órbita, Moodle o Microsoft, según los proveedores habilitados por el backend;
- continuar un handoff SSO iniciado por otra aplicación;
- mostrar a cada persona únicamente las aplicaciones que tiene autorizadas;
- registrar la apertura de aplicaciones para auditoría;
- administrar usuarios, aplicaciones SSO, roles y auditoría cuando la sesión pertenece a un platform admin.

El frontend no es proveedor de identidad ni frontera de autorización. La sesión, los permisos y todos los controles reales viven en el backend. La SPA representa ese estado y ofrece una experiencia clara y consistente.

## Stack técnico

- React 19 con TypeScript estricto.
- Vite 8 como dev server y bundler.
- React Router 8 con `BrowserRouter`.
- CSS Modules por componente y variables globales en `src/styles/tokens.css`.
- Phosphor Icons (`@phosphor-icons/react`) como librería de iconos; usar normalmente `weight="bold"`.
- Context API y hooks de React para sesión y estado local.
- `fetch` centralizado en `src/services/apiConfig.ts`.
- pnpm como único package manager; conservar `pnpm-lock.yaml`.

No hay test runner configurado actualmente. El mínimo obligatorio es lint + build; las funcionalidades críticas deberían incorporar pruebas cuando se adopte una herramienta de testing.

## Arquitectura

Es una SPA modular por capacidades:

```text
src/
├── components/              primitives visuales compartidos
├── layouts/                 shells de autenticación y dashboard
├── routes/                  composición y guards de navegación
├── services/                infraestructura HTTP compartida
├── styles/tokens.css        design tokens globales
├── types/                   contratos transversales
└── modules/
    ├── auth/                contexto, login local/Moodle/Microsoft y callback
    ├── dashboard/           launcher, auditoría y configuración
    ├── apps/                registro SSO, roles y miembros
    ├── users/               administración de cuentas y permisos
    └── not-found/           estado 404
```

Responsabilidades esperadas:

- `pages`: componen la pantalla y coordinan casos de uso; no deben contener detalles repetidos del transporte HTTP.
- `components`: piezas visuales o interactivas enfocadas y reutilizables.
- `services`: contrato con el backend, serialización, errores y tipos de respuesta.
- `context`/`hooks`: estado transversal de sesión; no almacenar estado de cada feature allí.
- CSS Module: estilos propios del componente. Los valores compartidos deben venir de tokens.

No llamar `fetch` directamente desde páginas nuevas. Extender un service de la feature y pasar por `apiFetch`, que añade `credentials: "include"` y centraliza la reacción a sesiones vencidas.

## Rutas y permisos

- `/auth`: login local y botón de Microsoft. También recibe `continue=sso` y errores recuperables.
- `/auth/moodle`: login y recuperación de contraseña delegados a Moodle, preservando `continue=sso`.
- `/auth/callback`: aterrizaje del OAuth de Microsoft.
- `/apps`: catálogo autorizado y destino normal después del login.
- `/settings`: configuración de usuario/plataforma disponible según su implementación.
- `/users`: administración de usuarios y asignación de roles.
- `/admin/registry`: registro de clientes SSO, redirect URIs, roles y miembros.
- `/audit`: curaduría/auditoría de accesos y eventos.

`ProtectedRoute` protege el shell autenticado y `AdminRoute` mejora la UX ocultando rutas administrativas. Ambos son guards de navegación, no seguridad. No asumir nunca que ocultar un botón reemplaza el `403` del backend.

## Flujo de autenticación

- Todas las peticiones usan la cookie HTTP-only de Órbita mediante `credentials: "include"`.
- `GET /auth/providers` determina qué opciones de Moodle, Microsoft y login local se muestran; no renderizar ni habilitar proveedores que el backend marque como no disponibles.
- El frontend nunca lee, persiste ni transmite manualmente el JWT.
- `AuthProvider` consulta `/auth/me`, conserva el perfil en memoria y limpia la sesión local ante un `401` de una ruta protegida.
- El login por contraseña usa `POST /auth/login`, refresca el perfil y navega a `/apps` o reanuda SSO.
- Microsoft comienza con una navegación completa a `GET /auth/login`; el backend completa OAuth y regresa al callback.
- Si se llegó desde una aplicación cliente, `continue=sso` termina en `/auth/resume` para que el backend devuelva el navegador a esa aplicación.
- El logout es `POST /auth/logout`; después se limpia el contexto.

Nunca introducir `localStorage` o `sessionStorage` para tokens. Nunca colocar secretos SSO en variables `VITE_*`: todo valor Vite es público en el bundle. No enviar contraseñas, identificadores de recuperación ni respuestas de autenticación a analytics, logs o trackers. Preferir assets de marca locales a imágenes remotas de páginas de login.

## Catálogo y modelo de permisos

El launcher consume `/applications/`; el backend ya devuelve solo aplicaciones autorizadas. Una tarjeta no debe intentar reinterpretar roles.

- Una aplicación `catalog` aparece por rol global o grant directo.
- Una aplicación `sso_role` aparece por un rol específico de esa app; al abrir su URL comienza el flujo SSO de su backend.
- El clic intenta registrar auditoría, pero un fallo del evento de auditoría no debe bloquear la navegación.
- Los roles globales y los roles SSO son conceptos distintos; la UI debe nombrarlos por separado.
- Asignar un rol SSO habilita tarjeta, autenticación y el rol entregado a la aplicación. La aplicación destino decide qué permite ese rol.

Las respuestas del backend y los errores se modelan en los services. Usar `parseApiError` para mostrar `detail` cuando exista y un mensaje humano como fallback.

## Identidad visual

La estética de Órbita es espacial, luminosa, suave y tecnológica; debe sentirse como un portal unificado, no como un panel empresarial genérico.

### Paleta

La fuente compartida es `src/styles/tokens.css`. La experiencia actual usa además una variante lavanda clara en los layouts:

- primario global: `#6D5DF6`; primario visual del shell: `#958FDD`;
- hover del shell: `#837DCC`;
- fondo claro: `#F1EFF7` / `#F5F3FC`;
- superficie: `#F7F6FC` / `#FFFFFF`;
- texto principal: `#171A45` / `#1E1B2E`;
- texto secundario: `#5F648D` / `#8B889C`;
- bordes: lavanda translúcido, normalmente `rgba(109, 104, 186, .25–.30)`;
- panel visual de tarjetas: gradiente `#B4AFE7` → `#8B84CE`;
- éxito `#22A06B`, advertencia `#E2A93B`, peligro `#E5484D`.

Preferir variables CSS antes que repetir hexadecimales. Los valores locales existentes expresan variaciones deliberadas del login o dashboard; al tocar una zona, no multiplicar tonos casi idénticos. Si una variante se reutiliza, promoverla a token.

### Lenguaje visual

- fondos orbitales y campos de estrellas desde `public/`, siempre como atmósfera y no como ruido que compita con el contenido;
- superficies translúcidas con blur moderado, borde claro y sombra lavanda: glassmorphism suave;
- el shell puede usar una superficie translúcida; dentro de una página, preferir contenido plano con separadores antes que tarjetas anidadas;
- radios amplios (14–30 px) y navegación tipo pill;
- jerarquía tipográfica limpia, mucho aire y textos cortos;
- iconos Phosphor redondeados y gruesos (`weight="bold"`), con tamaño consistente;
- animaciones breves y calmadas; respetar `prefers-reduced-motion`;
- foco visible, contraste legible y controles con estados hover, active, disabled y loading.

Las páginas de producto y administración usan `PageHeader`: título claro, una frase breve y, si existe, la acción principal. Evitar eyebrows decorativos, descripciones técnicas en la primera vista y bloques de configuración avanzada abiertos por defecto.

El catálogo usa tarjetas compactas e iguales: base cuadrada de aproximadamente 170–190 px que crece verticalmente al hover/focus para revelar título y descripción. En dispositivos sin hover, la información debe estar visible. Conservar la coherencia entre todas las tarjetas; un logo especial puede cambiar el contenido visual, no las dimensiones o la interacción.

No introducir una nueva librería de UI, iconos o estilos sin una necesidad clara. Reutilizar primero `Button`, `Card`, `Modal`, `Table`, `TextField`, `Select`, `Banner`, `ErrorMessage`, `EmptyState`, `PageLoader` y `Pagination`.

## UX y accesibilidad

- Toda operación remota debe tener loading, error y estado vacío cuando aplique.
- Los botones dentro de formularios deben declarar `type`.
- Mantener navegación por teclado, `focus-visible`, labels, nombres accesibles y `aria-*` correctos.
- Un icono decorativo lleva `aria-hidden`; una imagen informativa necesita `alt` útil.
- Modales, menús y overlays deben cerrarse de forma predecible, restaurar foco cuando corresponda y responder a Escape.
- Evitar saltos de layout y pantallas bloqueadas indefinidamente.
- Diseñar primero para el layout fluido existente; verificar al menos desktop y móvil.
- Los mensajes deben estar en español claro, explicar qué pasó y, cuando sea posible, cómo recuperarse.

## SOLID es obligatorio

Aplicar SOLID en componentes y servicios:

- **S — Single Responsibility:** una página coordina; un service conversa con la API; un componente representa una pieza; un hook encapsula comportamiento reutilizable. Dividir componentes que mezclen demasiados flujos independientes.
- **O — Open/Closed:** extender mediante props, composición, mapas de configuración y componentes enfocados. Evitar `switch` o condicionales de negocio replicados por toda la UI.
- **L — Liskov Substitution:** variantes de componentes deben respetar el mismo contrato de interacción, accesibilidad y estados. Una variante visual no puede romper eventos, foco o semántica.
- **I — Interface Segregation:** props y tipos pequeños; no pasar objetos gigantes si el componente usa tres campos. Separar contratos de lectura, creación y actualización cuando difieran.
- **D — Dependency Inversion:** las vistas dependen de servicios/hook de la feature, no de URLs o detalles de `fetch`. La infraestructura compartida se conecta en `apiConfig` y `env`.

SOLID no justifica abstracciones prematuras. Extraer una pieza cuando haya una responsabilidad, contrato o variación real.

## Convenciones de implementación

- TypeScript estricto; evitar `any`, casts innecesarios y non-null assertions salvo invariantes evidentes.
- Usar imports de tipo (`import type`) cuando corresponda.
- Componentes funcionales y hooks; no efectos para valores que puedan derivarse durante render.
- Cancelar o ignorar respuestas asíncronas después del unmount cuando una pantalla pueda cambiar durante la petición.
- Mantener el estado en el nivel más cercano que lo necesite.
- Preservar la organización por feature; no crear carpetas genéricas que mezclen dominios.
- Codificar segmentos dinámicos de URL y no concatenar entrada sin validar.
- No duplicar interfaces del backend en varios archivos; elegir un contrato dueño dentro de la feature.
- No editar `dist/` ni `node_modules/`.
- No versionar `.env`; documentar variables públicas en `.env.example`.

## Cómo trabajar

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`VITE_API_URL` debe apuntar a la base `/api` del backend. No añadir fallbacks silenciosos a producción; una configuración ausente debe ser detectable.

Verificación mínima antes de entregar:

```bash
pnpm lint
pnpm build
```

Además, recorrer manualmente el flujo afectado:

- login local, Moodle y Microsoft si se tocó auth, incluyendo proveedores deshabilitados y `continue=sso`;
- sesión expirada y respuestas `401`/`403`;
- launcher con cero, una y varias aplicaciones;
- navegación por teclado y viewport móvil;
- estados loading/error/empty;
- para administración, usuario activo/inactivo, rol global, rol SSO y aplicación deshabilitada.

## Documentación viva obligatoria

La documentación forma parte de la definición de terminado. Después de cualquier cambio de lógica, rutas, contrato consumido, estado visible, seguridad, configuración, dependencia o lenguaje visual, actualizar en el mismo cambio:

- `README.md` y `.env.example` cuando cambien instalación o configuración;
- este `AGENTS.md` y el `AGENTS.md` raíz cuando cambie el contexto estable o una regla;
- los contratos del backend cuando cambie una petición, respuesta, código de estado o flujo SSO;
- pruebas o, mientras no exista runner, el checklist manual verificable del flujo afectado.

No cerrar una tarea con documentación o ejemplos conocidos como obsoletos. Si un documento no cambia, debe ser porque fue revisado y continúa siendo correcto.

## Regla de entrega

Antes de editar, revisar `git status` y preservar cambios locales ajenos. No reformatear archivos no relacionados. El handoff debe decir qué cambió, qué rutas o contratos consume, qué decisiones visuales tomó, cómo se verificó y qué falta. Si una decisión afecta seguridad o el contrato SSO, coordinarla con el backend en el mismo trabajo.
