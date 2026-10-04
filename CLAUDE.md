# CLAUDE.md — TripIt (app privada de itinerarios de viaje)

Contexto persistente del proyecto para que no se pierda entre sesiones. El encargo completo está en [docs/REQUISITOS.md](docs/REQUISITOS.md); el plan de fases en `docs/PLAN.md` (pendiente de aprobación). Datos de prueba (seed) en [docs/ejemplo_itinerario_transcripcion.md](docs/ejemplo_itinerario_transcripcion.md) y `docs/ejemplo_itinerario.pdf`.

## Idioma

- Conversación con el usuario: **siempre en español**.
- Interfaz de la app, código, comentarios, nombres de commits y de ramas: **siempre en inglés**.

## Regla de coste cero (no negociable)

Todo el stack debe funcionar en planes gratuitos, sin tarjeta de crédito cuando sea posible. Antes de añadir cualquier servicio nuevo: comprobar sus límites actuales, si pide tarjeta, y qué pasa al superarlos. Si no hay opción gratuita razonable, preguntar al usuario antes de usarlo — nunca asumir un gasto.

## Stack (a confirmar/ajustar en docs/PLAN.md)

- **App**: Expo (React Native) + TypeScript estricto + Expo Router. Un solo código para iOS, Android y web (react-native-web).
- **Servidor**: Supabase (plan gratuito, región UE/Frankfurt) — Postgres + RLS, Auth, Storage, Realtime, Edge Functions.
- **Mapas**: MapLibre + teselas gratuitas sin clave (p. ej. OpenFreeMap), globo 3D.
- **Estado/datos**: TanStack Query. Animaciones: Reanimated + Gesture Handler. Listas: FlashList. Imágenes: expo-image.
- **Offline-first**: base local con sincronización bidireccional (elección concreta y justificación en `docs/PLAN.md`).
- **CI**: GitHub Actions (lint, tipos, tests, build).
- **Errores**: Sentry (plan gratuito).

## Supabase

- Esquema completo en `supabase/migrations/*.sql`, versionado — nunca se edita el esquema a mano desde el dashboard en producción, siempre vía una migración nueva (`npx supabase migration new <nombre>`).
- El cierre del registro abierto (sección 10 del encargo) se hace con un **Auth Hook `before_user_created`** (`public.check_allowed_email`, registrado en `supabase/config.toml`) que rechaza el alta si el email no está en `allowed_emails` — no es solo una política RLS, es lo que de verdad bloquea el registro. **Sin verificar aún contra un proyecto real** (no había Docker disponible al escribirlo): la primera vez que haya un proyecto Supabase enlazado, probar explícitamente que registrarse con un email no invitado falla, antes de confiar en esta puerta.
- Para enlazar un proyecto real: `npx supabase link --project-ref <ref>` y `npx supabase db push` aplica todas las migraciones desde cero.
- Primer administrador: no hay asistente todavía (llega con el panel de administrador, Fase 5). Hasta entonces, tras el primer login, promocionar a mano una vez vía SQL: `update public.profiles set is_admin = true where email = '...';`.

## CI / GitHub Actions

- `.github/workflows/ci.yml`: typecheck, lint, format check, tests y export web en cada push/PR a `main`.
- `.github/workflows/supabase-keepalive.yml`: ping programado cada 3 días para evitar la pausa por inactividad del plan gratuito. **Necesita los secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY`** en el repositorio (Settings → Secrets and variables → Actions) una vez exista el proyecto — hasta entonces el workflow existe pero no se ejecuta (solo `schedule`/`workflow_dispatch`, no bloquea el CI normal).
- Pendiente (cuando haya proyecto Supabase real): workflow de copia de seguridad periódica de BD + Storage a un destino privado (sección 12 del encargo) — no se ha escrito a ciegas sin un proyecto contra el que probarlo.

## Configuración por variable de entorno

Por petición explícita del usuario, cualquier dato que pueda cambiar en el futuro (especialmente el nombre de la app) vive en variables de entorno, **no hardcodeado**:

- `EXPO_PUBLIC_APP_NAME` — nombre de la app mostrado en la UI (valor por defecto: `TripIt`). Se usa `EXPO_PUBLIC_` porque Expo solo expone al cliente las variables con ese prefijo; nunca poner secretos ahí.
- `EXPO_PUBLIC_DEFAULT_CURRENCY` — moneda principal por defecto (valor por defecto: `EUR`), cambiable por el usuario en ajustes sin tocar código.
- Secretos de servidor (claves de Supabase service role, tokens de terceros, etc.) van **solo** en el entorno del servidor (Supabase Edge Functions / GitHub Actions secrets), nunca en `EXPO_PUBLIC_*` ni en el repositorio.
- `.env.example` se mantiene en el repo con todas las claves documentadas y valores de ejemplo; `.env` real está en `.gitignore`.

## Convenciones

- TypeScript estricto (`strict: true`), ESLint + Prettier.
- Validación con Zod tanto en cliente como en servidor (Edge Functions).
- Row Level Security en todas las tablas de Supabase; sin excepciones. Tests automáticos de permisos (owner/editor/viewer) en cada fase que toque el esquema.
- Sin datos personales ni documentos de identidad: la app solo gestiona reservas de viaje, nunca pasaportes/DNI.
- Sin comentarios explicativos de "qué hace" el código (los nombres ya lo dicen); solo comentarios para decisiones no obvias (zonas horarias, límites de APIs gratuitas, workarounds).

## Arquitectura modular y configuración centralizada (petición explícita del usuario)

Dos reglas transversales, por encima de cualquier otra conveniencia: **todo lo personalizable vive en un solo sitio** y **el código está repartido en módulos pequeños y claros**, nunca en archivos monolíticos. El objetivo es que cualquier cambio futuro (recolorear la app, añadir una categoría, cambiar un límite) se haga en un único lugar evidente, y que cualquier archivo se entienda sin tener que leerse medio proyecto.

- **Tema y diseño centralizados** en `src/theme/` (tokens de color de las tres paletas, tipografía, espaciado, radios). Ningún componente usa un hex o un tamaño "a mano": todo pasa por `src/theme/tokens.ts`. Cambiar de paleta (Atlas Blue → otra) debe ser editar un único archivo.
- **Categorías de reserva centralizadas** en `src/features/bookings/categories.ts` (icono, color, campos por categoría — sección 5 del encargo): es la única fuente de verdad que lee tanto el itinerario como el mapa, los gastos y las notificaciones.
- **Configuración/flags centralizados** en `src/config/` (lectura de `EXPO_PUBLIC_*`, feature flags, constantes de negocio como el círculo máximo de usuarios). Nada de `process.env` disperso por el código.
- **Estructura de carpetas por dominio**, no por tipo de archivo:
  ```
  src/
    app/            # rutas de Expo Router (pantallas, lo más fino posible)
    features/       # un folder por dominio: trips/ itinerary/ bookings/ expenses/ map/ people/ tasks/
      <feature>/
        components/
        hooks/
        api.ts      # llamadas a Supabase de ese dominio
        types.ts
    theme/          # tokens centralizados (color, tipografía, espaciado)
    config/         # env vars, feature flags, constantes centralizadas
    lib/            # utilidades transversales (fechas, zonas horarias, dinero)
    components/     # solo componentes de UI genéricos sin lógica de dominio (Button, Card, Sheet...)
  ```
- Las pantallas en `app/` son finas: orquestan componentes de `features/`, no contienen lógica de negocio.
- Antes de añadir una tercera repetición del mismo valor o lógica, extraerla a `theme/`, `config/` o `lib/` según corresponda.

## Git

- Commits pequeños y descriptivos.
- Una rama por fase (`fase-1-cimientos`, `fase-2-viajes`, …), fusionada a `main` solo cuando la fase está probada y revisada.
- Tag de versión semántica al cerrar cada fase (`v0.1.0`, `v0.2.0`, …) para poder volver atrás.
- Nunca `--no-verify`, nunca force-push a `main` sin confirmación explícita.

## Requisito de Node y cómo ejecutar todo

Este proyecto necesita **Node ≥ 22.13** (lo exige la CLI de Expo/Metro actual). El sistema de esta máquina solo tenía Node 18, así que hay un Node 22 local descargado en `.tools/node20/` (gitignored, no es parte del repo, solo una herramienta local). Para trabajar en el proyecto:

```bash
export PATH="$(pwd)/.tools/node20/bin:$PATH"   # si el Node del sistema es < 22.13
npm install
npm run typecheck   # tsc --noEmit
npm run lint         # expo lint (eslint-config-expo + prettier)
npm run format:check # prettier --check .
npm run web          # expo start --web
npm run android       # expo start --android
npm run ios           # expo start --ios
```

Si la máquina donde se continúe el desarrollo ya tiene Node ≥ 22.13 instalado de forma nativa, el `export PATH` de arriba no hace falta.

*(Pendiente de Fase 2 en adelante: `npm test` para unitarios (Jest), E2E con Playwright (web) y Maestro/Detox (móvil) — se añaden en cuanto haya lógica de negocio que testear.)*

## Escala objetivo

Círculo cerrado de uso real: ≤ 10 personas. El modelo de datos y las políticas RLS deben diseñarse para escalar sin reescritura (no asumir hardcoded límites de usuarios), aunque no se optimice prematuramente para miles de usuarios.

## Flujo de trabajo por fases

Cada fase, al cerrarse, debe: pasar tests, tener una revisión de código independiente (bugs, seguridad, rendimiento, usabilidad, duplicación), e incluir un resumen breve + instrucciones de prueba en el móvil + propuestas de mejora, esperando el visto bueno del usuario antes de continuar. Detalle completo en `docs/REQUISITOS.md` sección 0.
