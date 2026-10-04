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

## Git

- Commits pequeños y descriptivos.
- Una rama por fase (`fase-1-cimientos`, `fase-2-viajes`, …), fusionada a `main` solo cuando la fase está probada y revisada.
- Tag de versión semántica al cerrar cada fase (`v0.1.0`, `v0.2.0`, …) para poder volver atrás.
- Nunca `--no-verify`, nunca force-push a `main` sin confirmación explícita.

## Cómo ejecutar tests

*(Se actualizará en cuanto exista tooling real en Fase 1. Previsto: `npm test` para unitarios (Jest/Vitest), `npm run test:e2e:web` con Playwright, Maestro/Detox para E2E móvil, `npm run typecheck` y `npm run lint` en CI.)*

## Escala objetivo

Círculo cerrado de uso real: ≤ 10 personas. El modelo de datos y las políticas RLS deben diseñarse para escalar sin reescritura (no asumir hardcoded límites de usuarios), aunque no se optimice prematuramente para miles de usuarios.

## Flujo de trabajo por fases

Cada fase, al cerrarse, debe: pasar tests, tener una revisión de código independiente (bugs, seguridad, rendimiento, usabilidad, duplicación), e incluir un resumen breve + instrucciones de prueba en el móvil + propuestas de mejora, esperando el visto bueno del usuario antes de continuar. Detalle completo en `docs/REQUISITOS.md` sección 0.
