# Plan — TripIt (app privada de itinerarios de viaje)

> Estado: **Fases 1 y 2 cerradas, Fase 6 iniciada (2026-10-05)**. Paleta **Atlas Umber** (marrones, repintada 2026-10-05 sobre la Atlas Blue original), tipografía (Fraunces + Work Sans + IBM Plex Mono) y navegación (pestañas abajo en móvil / barra lateral en web) confirmadas. La Fase 2 se amplió bastante más allá de su alcance original — ver su entrada abajo — adelantando trozos de las Fases 3 y 6. Las secciones de coste cero y priorización de funciones se completaron con mi conocimiento actual en lugar de con una verificación web en vivo; están marcadas con ⚠️ allí donde convenga reconfirmar el dato exacto contra la documentación oficial en el momento de implementar esa pieza.
>
> ⚠️ **Pivote del 2026-10-05 — modelo local-first**: durante la Fase 1 se renegoció el requisito de sincronización continua por cuenta (ver nota al principio de `docs/REQUISITOS.md`). Las secciones 3 y 4 de aquí abajo, y las Fases 2 y 5, están actualizadas para reflejarlo. El resto del documento (Fases 1, 3, 4, 6, 7, 8) sigue vigente tal cual.

## 1. Resumen de decisiones

| Decisión | Elegido | Alternativas consideradas | Por qué |
|---|---|---|---|
| Framework app | Expo (React Native) + Expo Router + TypeScript estricto | Flutter, apps nativas separadas, Next.js + Capacitor | Un solo código para iOS/Android/web real (no solo responsive), ecosistema maduro, EAS gratuito para builds, buen soporte de `react-native-web`. |
| Backend | Supabase (Postgres + RLS + Auth + Storage + Realtime + Edge Functions) | Firebase, PocketBase autoalojado, backend propio en Render/Fly.io | Postgres relacional encaja mejor con el modelo de datos (viajes, reservas, gastos con relaciones fuertes) que Firestore; RLS da control de permisos a nivel de fila sin lógica de servidor extra; todo-en-uno gratuito. |
| Mapas | MapLibre GL + teselas vectoriales gratuitas sin API key (OpenFreeMap u otro proveedor equivalente, a confirmar con la investigación de límites) | Mapbox GL (de pago a partir de cierto uso), Google Maps SDK (de pago, requiere tarjeta) | Librería open-source sin coste, con soporte de globo 3D en `maplibre-gl-js` ≥ v3, y sin necesidad de tarjeta de crédito. |
| App privada vs pública | Acceso solo por invitación/allowlist, sin registro abierto | Registro abierto con aprobación manual | El encargo es explícito: círculo cerrado, panel de administrador. |
| Nombre de la app | `TripIt` por defecto, configurable vía `EXPO_PUBLIC_APP_NAME` | Nombre fijo en código | Pedido explícito del usuario; además `TripIt` coincide con una app comercial existente (SAP Concur) — sin problema legal al ser privada y no publicada en tiendas, pero queda fácil de cambiar si se desea. |
| Moneda por defecto | EUR, cambiable por el usuario en ajustes y por viaje | Fijar una sola moneda | Pedido explícito; además varios viajes pueden tener monedas distintas. |
| Distribución iPhone | PWA instalada desde Safari como base; nativo vía sideloading (SideStore/AltStore) como extra opcional | Solo nativo, solo PWA | El usuario no tiene Mac; la PWA no depende de macOS ni de refrescar cada 7 días. Se detalla en sección 8 y se confirmará alcance tras la investigación de límites. |
| Base local offline-first | SQLite (`expo-sqlite`) en móvil + IndexedDB en web — ver fila de abajo, pasa de ser "caché offline de Supabase" a ser **la fuente de verdad principal** | WatermelonDB (su soporte web es limitado/experimental, descartado), RxDB con plugin de replicación a Supabase, PowerSync | Elección técnica (SQLite/IndexedDB) se mantiene tras el pivote local-first; lo que cambia es su rol — ya no es un outbox temporal hacia Supabase, es donde vive el viaje siempre, salvo que se comparta. |
| **Modelo de datos multiusuario (pivote 2026-10-05)** | **Local-first**: cada viaje vive en el dispositivo por defecto, con ID generado en el cliente, sin necesitar cuenta. Compartir es un acto explícito — código QR + código corto temporal (caduca a los 3 min) — no sincronización continua por defecto. El login por magic link (Fase 1) queda construido pero sin usarse hasta que haga falta. | Cuenta + Supabase Realtime desde el primer viaje para todo el mundo (plan original de la sección 10 del encargo) | Decisión explícita del usuario. Motivada en parte por la fricción real del límite de envío de emails del plan gratuito de Supabase sin SMTP propio, y en parte por preferencia de producto ("cada móvil tiene sus viajes"). Renegocia el requisito marcado no-negociable en `docs/REQUISITOS.md` sección 0/10 — ver la anotación ahí. Abre preguntas de diseño aún sin resolver, detalladas en la Fase 5 más abajo. |
| Funciones extra (sección 11) incluidas en v1 | Ver Fase 7 — orden: validación del itinerario · recordatorios inteligentes · prepare offline + conversor de moneda/propinas · añadir lugares pegando un enlace · tiempo por ciudad/día | Asistente conversacional, estado de vuelo en tiempo real, widgets, álbum de fotos compartido — pospuestas a después de la v1 | Se prioriza lo que reduce errores reales del itinerario (la propia validación de fechas/nombres que pide el encargo) y fricción del día a día del viaje, sobre funciones vistosas pero menos críticas; ver razonamiento completo en Fase 7. |

## 2. Análisis de coste cero

> ⚠️ Esta tabla refleja mi conocimiento actual de cada plan gratuito, no una verificación web en vivo (se canceló la investigación automática a tu petición). Antes de depender en firme de un límite concreto en producción, conviene confirmarlo contra la documentación oficial del servicio — lo marco explícitamente donde más puede haber cambiado.

| Servicio | Para qué | Límites del plan gratuito (orientativos) | ¿Pide tarjeta? | Qué pasa al superarlo | Mitigación |
|---|---|---|---|---|---|
| **Supabase** | Postgres, Auth, Storage, Realtime, Edge Functions | ~500 MB de base de datos, ~1 GB de almacenamiento de archivos, ~5 GB de transferencia/mes, decenas de miles de usuarios de Auth (muy por encima de un círculo de 10-15 personas), límite de conexiones Realtime concurrentes (no crítico a esta escala), 2 proyectos gratuitos por organización. Los proyectos gratuitos se **pausan tras ~1 semana sin actividad**. | No | Por debajo de los límites de BD/Storage, Supabase bloquea escritura hasta liberar espacio (no cobra automáticamente en el plan Free, que no tiene facturación activada salvo que se pase a un plan de pago explícitamente). Si se pausa por inactividad, hay que "despertarlo" manualmente desde el panel. | Tarea programada en GitHub Actions que haga una petición ligera periódica (keep-alive); comprimir imágenes antes de subir; vigilar uso desde la pantalla de diagnóstico (Fase 1). |
| **Expo EAS Build/Update** | Compilar APK/IPA, actualizaciones OTA | Nº de builds/mes limitado en el plan gratuito (históricamente unas pocas decenas, con cola compartida de menor prioridad que los planes de pago); EAS Update free tier tiene un límite generoso de usuarios activos mensuales de OTA. | No para el plan gratuito | Se bloquean nuevos builds hasta el siguiente ciclo mensual o hay que esperar en cola | Compilar con menos frecuencia (al cerrar cada fase, no en cada commit); usar builds de desarrollo locales (`expo run:android`/`expo prebuild`) para iterar sin consumir cuota; considerar GitHub Actions con runner propio como alternativa a EAS Build si el límite resulta ajustado. |
| **GitHub Actions** | CI, keep-alive, backups, builds | Minutos **ilimitados en repos públicos**; en repos privados, cuota mensual gratuita limitada (unos miles de minutos) con multiplicador según el runner: Linux consume la cuota a 1x, macOS a un múltiplo mucho mayor (≈10x) — relevante solo si se usa un runner macOS para compilar IPA. | No | Se bloquean workflows hasta el siguiente ciclo o hasta añadir método de pago | Repo público si el contenido lo permite (gratis e ilimitado); si el repo debe ser privado, minimizar el uso de runners macOS (solo cuando se compile IPA, no en cada CI run). |
| **Sentry** | Captura de errores | Plan gratuito con tope mensual de eventos de error (del orden de unos pocos miles/mes) y retención limitada; un solo proyecto/usuario en el nivel más básico. | No | Deja de ingerir eventos nuevos hasta el siguiente ciclo | Filtrar ruido (no reportar errores esperados/de red), usar muestreo si el volumen se acerca al límite — a esta escala de usuarios (≤15) es muy improbable agotarlo. |
| **GitHub Pages / Cloudflare Pages** | Hosting de la web/PWA | Ambos gratuitos para sitios estáticos de este tamaño; límites de banda ancha muy altos (soft limits del orden de 100 GB/mes en GitHub Pages; Cloudflare Pages sin límite de banda publicado). | No | Advertencia o throttling en casos extremos, no facturación | Cualquiera de los dos sirve de sobra; Cloudflare Pages añade despliegues más rápidos y previews por PR. |
| **MapLibre GL JS** | Librería de mapas | Open source (licencia BSD), sin límites de uso porque corre en el cliente, no es un servicio de pago por petición. | No | N/A | N/A |
| **Proveedor de teselas gratuitas (OpenFreeMap u otro)** | Mapa base | Pensado para uso gratuito e ilimitado (sin API key); recomienda autoalojar las teselas para cargas de producción altas, lo cual no aplica a un círculo de 10-15 personas. | No | N/A a este volumen | Si en el futuro el volumen crece, se puede autoalojar el servidor de teselas (también gratuito, solo consume cómputo propio). |
| **Nominatim** | Geocodificación al importar reservas | Política de uso pública: máx. ~1 petición/segundo, requiere identificarse con un User-Agent, no permite geocodificación masiva. | No | Bloqueo temporal de IP si se abusa | Cachear resultados por dirección (no re-geocodificar lo ya resuelto), limitar peticiones en servidor (Edge Function), respetar 1 req/s. |
| **Photon** (alternativa/complemento a Nominatim) | Geocodificación | Sin límite estricto publicado, pero se espera uso razonable ("fair use"). | No | Posible throttling bajo abuso | Mismo criterio de caché que Nominatim. |
| **Frankfurter** | Tipos de cambio (BCE) | Gratuito, sin API key, sin límite de uso publicado relevante a este volumen. | No | N/A | N/A |
| **Expo Push Notifications** | Notificaciones push | Gratuito, con límites de ráfaga por segundo (no de volumen mensual) muy por encima de las necesidades de 10-15 usuarios. | No | Rate limiting temporal en ráfagas muy grandes | Agrupar notificaciones cuando tenga sentido (no es un problema real a esta escala). |
| **SideStore / AltStore (opcional, solo si se activa iPhone nativo)** | Sideloading sin Apple Developer de pago | Apple ID gratuito: certificado válido **7 días** (hay que refrescar la app, SideStore puede automatizarlo en la misma red WiFi), **máximo 3 apps** activas a la vez con un mismo Apple ID gratuito, requiere activar el modo desarrollador en el iPhone. | No (solo un Apple ID gratuito) | La app deja de abrir hasta refrescarla | Confirmado como "extra opcional" en el plan — la PWA cubre las funciones esenciales sin esta limitación. |

**Conclusión**: el stack propuesto es viable en coste cero para un círculo de hasta ~10-15 personas sin necesidad de tarjeta de crédito en ningún servicio. El único límite que requiere mitigación activa desde el primer día es la **pausa de Supabase por inactividad**, ya contemplada en la Fase 1.

## 3. Arquitectura

> ⚠️ Reescrita 2026-10-05 tras el pivote local-first. El diagrama y los dos flujos de abajo sustituyen la versión original (que trataba Supabase como fuente de verdad permanente desde el primer viaje).

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cliente (Expo / React Native)               │
│  iOS (PWA / sideload)   Android (APK)   Web (react-native-web)   │
│                                                                   │
│  UI (Expo Router) ─ TanStack Query ─ Store local (SQLite/IndexedDB)│
│        │                                   │  ← FUENTE DE VERDAD  │
│        │                                   │   (IDs generados     │
│        │                                   │    en el cliente)    │
│  Cadena de extracción local        Sesión de compartir (Fase 5,   │
│  (QR/barcode, OCR on-device,       diseño pendiente): genera un   │
│   parsers de texto de PDF)         código corto + QR, con los     │
│                                     campos/categorías elegidos,    │
│                                     válido 3 minutos               │
└───────────────────────────────────────────┼──────────────────────┘
                                             │ solo al compartir un viaje
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          Supabase (UE, gratuito) — opcional, por viaje            │
│  Auth (magic link, allowlist — construido en Fase 1,              │
│    listo pero sin usarse por defecto)                             │
│  Postgres + RLS: profiles/allowed_emails (ya aplicado) +           │
│    tablas de sesión de compartir (a diseñar en Fase 5)            │
│  Storage, Realtime — se activan solo si/cuando se decida que un   │
│    viaje compartido necesita seguir actualizándose en vivo        │
└─────────────────────────────────────────────────────────────────┘
          │                        │                     │
          ▼                        ▼                     ▼
   GitHub Actions           Sentry (errores)      APIs gratuitas externas:
   - CI (lint/test/build)                          Nominatim/Photon (geocoding)
   - Keep-alive Supabase                           Frankfurter (tipos de cambio)
   - Backups periódicos                            Open-Meteo (tiempo)
   - Build APK / IPA                                Expo Push (notificaciones)
   - Deploy web (GitHub Pages — ya desplegado)
```

**Flujo de importación de reservas** (detalle completo se explicará y acordará antes de implementar la Fase 3; sin cambios por el pivote, solo que el resultado se guarda localmente en vez de en Supabase):
1. Usuario sube imagen/PDF → se procesa primero **en el dispositivo** (gratis, sin límites de API): lectura de QR/código de barras (estándar IATA BCBP para tarjetas de embarque), OCR on-device (ML Kit en Android, Vision en iOS, fallback tesseract.js en web), extracción de texto nativo de PDFs.
2. Un conjunto de **parsers específicos** (reglas + expresiones regulares) interpreta formatos conocidos (Ryanair, Booking.com, Trenitalia, Italo, Trenord, billetes genéricos de tren/bus).
3. Si el resultado es insuficiente, se ofrece revisión manual asistida (campos editables) — nunca se guarda sin que el usuario confirme los campos de baja confianza.
4. Solo si se decide usar un modelo de IA gratuito como último recurso (a acordar contigo explícitamente, con análisis de privacidad primero), se usaría como *fallback* para itinerarios complejos como el PDF de ejemplo — el contenido del documento se trata siempre como datos, nunca como instrucciones.

**Modelo local-first y compartir** (sustituye la antigua sección de "sincronización y resolución de conflictos" — aquella asumía que todo viaje sincronizaba en vivo contra Supabase desde el principio):
- Cada viaje se crea con un UUID generado **en el propio cliente** (no depende de que exista fila alguna en Supabase) y vive en SQLite (nativo) / IndexedDB (web) como única fuente de verdad, sin red de por medio.
- "Compartir" (Fase 5, diseño detallado pendiente) es un acto explícito, no sincronización continua por defecto: el dueño genera una sesión temporal (código corto + QR, caduca a los 3 minutos) y elige qué categorías de datos incluir, pudiendo excluir campos marcados como sensibles (p. ej. nº de vuelo) por defecto o a voluntad.
- **Preguntas de diseño todavía abiertas**, a resolver contigo al empezar la Fase 5 antes de construirlo:
  1. La copia que recibe el otro dispositivo, ¿queda como una instantánea independiente (como un export/import puntual), o el receptor puede quedarse "siguiendo" cambios futuros del original? Si es lo segundo, ese viaje concreto sí necesita un respaldo en Supabase aunque sea ligero.
  2. ¿Un código temporal sirve para un solo receptor o varios a la vez (p. ej. compartir con todo un grupo familiar de una vez)?
  3. Si el receptor edita su copia, ¿esos cambios pueden volver al dueño original, o son independientes a partir de ahí?
- El login por magic link y el Auth Hook de allowlist (Fase 1) quedan construidos y verificados, listos para el día que se decida ofrecer cuentas/sincronización continua — pero no forman parte del flujo principal de "compartir" tal como se pidió.

## 4. Modelo de datos

> ⚠️ Reescrita 2026-10-05. El esquema de abajo ahora se divide en **local** (vive en SQLite/IndexedDB, es la fuente de verdad de cada viaje) y **Supabase** (ya aplicado para `profiles`/`allowed_emails`; el resto se diseña en detalle en la Fase 5, junto con las preguntas abiertas de la sección 3).

### Tablas locales (SQLite / IndexedDB — fuente de verdad del viaje)

Mismo contenido que las tablas de viaje descritas más abajo (`trips`, `cities`, `itinerary_days`, `booking_categories`, `bookings`, `documents`, `expenses`, `expense_splits`, `tasks`, `packing_items`, `activity_log`, `comments`, `polls`/`poll_votes`), pero:
- **`id` se genera en el cliente** (UUID v4) en el momento de crear cada fila, no lo asigna un servidor.
- **No hay `trip_members` ni `trip_invites`** tal como estaban pensadas (persistentes, basadas en cuenta) — el control de quién ve el viaje es simplemente "está en mi dispositivo". La noción de "participantes" de un viaje (para repartir gastos, p. ej.) pasa a ser una lista de **nombres locales** que el dueño del viaje escribe a mano (`trip_participants`: `id`, `trip_id`, `display_name`), no usuarios con cuenta — así que `expense_splits.user_id` cambia a `expense_splits.participant_id` apuntando ahí.
- Export/import JSON (ya contemplado en el encargo, sección 3) es el mecanismo de respaldo y de traspaso manual completo de un viaje — independiente del mecanismo de "compartir parcial" por QR de la Fase 5.

### Tablas en Supabase

**Ya aplicadas (Fase 1):**
- **`profiles`** (1:1 con `auth.users`): `id`, `email`, `display_name`, `avatar_url`, `is_admin`, `created_at`.
- **`allowed_emails`**: allowlist de acceso cerrado — `email`, `invited_by`, `created_at`, `used_at`.

**Pendientes de diseñar en la Fase 5** (dependen de las respuestas a las preguntas abiertas de la sección 3): algo en la línea de una tabla `share_sessions` (`code` corto, `qr_payload`, `trip_snapshot` o `trip_id` según se resuelva la pregunta de instantánea-vs-en-vivo, `selected_categories`, `exclude_sensitive_fields`, `expires_at`, `created_at`) que el dispositivo receptor consulta con el código antes de que caduque a los 3 minutos. Las tablas de viaje completas (`trips`, `cities`, etc.) **solo** se replican a Supabase si las preguntas abiertas de la sección 3 se resuelven a favor de "seguir recibiendo cambios en vivo" — si se resuelven a favor de "instantánea", no hace falta tabla de viaje en Supabase en absoluto, solo la sesión temporal.

### Referencia: columnas de las tablas de viaje (aplican igual en local; en Supabase solo si la Fase 5 lo requiere)

- **`trips`**: `id`, `name`, `description`, `status` (`draft`/`upcoming`/`ongoing`/`past`/`archived`), `start_date`, `end_date`, `default_currency`, `cover_image_url`, `created_at`, `updated_at`, `deleted_at` (papelera de 30 días).
- **`trip_participants`**: `id`, `trip_id`, `display_name` — nombres locales para repartir gastos/tareas, sin cuenta asociada.
- **`cities`**: `id`, `trip_id`, `name`, `country_code`, `lat`, `lng`, `arrival_date`, `departure_date`, `order_index`.
- **`itinerary_days`**: `id`, `trip_id`, `city_id`, `date`, `day_index`, `notes`.
- **`booking_categories`**: `id`, `trip_id` (null = categoría global del usuario), `key`, `label`, `icon`, `color`, `is_custom`, `sort_order`, `hidden`, `field_schema` (JSONB, define campos propios de categorías personalizadas), `is_sensitive` (nuevo — marca categorías/campos excluidos por defecto al compartir, p. ej. localizador de vuelo).
- **`bookings`** (unifica pasos de itinerario y reservas — vuelos, trenes, hoteles, restaurantes, entradas, notas, tareas visibles en el itinerario): `id`, `trip_id`, `city_id`, `day_id`, `category_id`, `status` (`idea`/`to_book`/`booked`/`paid`/`cancelled`), `title`, `start_at` (timestamptz), `end_at`, `timezone`, `location_name`, `address`, `lat`, `lng`, `details` (JSONB — nº de vuelo, localizador, asiento, etc., validado con Zod según la categoría), `price`, `currency`, `notes`, `order_index`, `source_document_id`, `extraction_confidence`, `created_at`, `updated_at`.
- **`documents`**: `id`, `trip_id`, `booking_id` (nullable), `storage_path` (local: ruta en el sistema de archivos de la app), `file_type`, `original_filename`, `ocr_status`, `extracted_data` (JSONB bruto de la extracción, antes de revisión), `created_at`.
- **`expenses`**: `id`, `trip_id`, `booking_id` (nullable), `paid_by_participant_id`, `amount`, `currency`, `amount_in_trip_currency`, `exchange_rate`, `exchange_rate_date`, `category_id`, `city_id`, `date`, `payment_method`, `note`, `receipt_document_id`, `created_at`.
- **`expense_splits`**: `id`, `expense_id`, `participant_id` (antes `user_id` — ver `trip_participants` arriba), `share_amount`, `settled`.
- **`tasks`**: `id`, `trip_id`, `title`, `due_date`, `reminder_at`, `assigned_to_participant_id`, `status` (`pending`/`done`/`skipped`), `related_booking_id`.
- **`packing_items`**: `id`, `trip_id`, `participant_id` (null = compartido), `label`, `category`, `checked`, `template_source`.
- **`activity_log`**: `id`, `trip_id`, `action_type`, `entity_type`, `entity_id`, `summary_text`, `created_at` — mientras el viaje es solo local, es simplemente un historial local de "deshacer"; cobra su sentido original ("Ana añadió un gasto") si/cuando un viaje recibe cambios de otro dispositivo tras compartirse.
- **`comments`**: `id`, `trip_id`, `entity_type`, `entity_id`, `participant_id`, `body`, `created_at`.
- **`polls`** / **`poll_votes`**: votaciones tipo "restaurante A o B".

### Índices clave

- `bookings(trip_id, day_id, order_index)` para renderizar el itinerario rápido.
- `expenses(trip_id, date)` y `expense_splits(expense_id)` para las gráficas.
- `activity_log(trip_id, created_at desc)` para el feed de actividad.

### Políticas RLS

- **Local**: no aplica — no hay red de por medio, el control de acceso es "está en mi dispositivo".
- **Supabase** (`profiles`/`allowed_emails`, ya aplicadas en Fase 1): descritas en la migración inicial — ver `CLAUDE.md`. El patrón para las tablas de compartir de la Fase 5 (p. ej. `share_sessions`) se diseña con esa fase, probablemente mucho más simple que el antiguo esquema `trip_members`/roles (ya no hace falta un rol persistente por viaje, solo validar que el código temporal no ha caducado).

## 5. Mapa de pantallas y navegación

**Móvil** — barra de pestañas inferior (máx. 5) + botón "+" central:
`My Trips` · `Map` (vista global de todos los viajes) · **+** (añadir rápido: gasto, documento, paso, nota) · `Now/Next` (solo visible con un viaje en curso) · `Profile/Settings`.

Dentro de un viaje: `Overview` · `Itinerary` · `Bookings` · `Documents` · `Map` · `Expenses` · `Tasks/Packing` · `Notes` · `People` (navegación secundaria tipo pestañas superiores o carrusel).

**Web / pantallas grandes** — barra lateral fija con las mismas secciones más espacio de trabajo para planificar (p. ej. itinerario y mapa lado a lado).

**Pantallas clave a enseñar antes de programar** (sección 12 del encargo): onboarding, listado de "My trips", asistente de creación de viaje, Overview de un viaje (con el globo), itinerario día a día, tarjeta de reserva por categoría (vuelo/tren/hotel), pantalla de revisión de importación, gastos con gráficas, pantalla de compartir/invitar.

## 6. Fases de desarrollo

### Fase 1 — Cimientos ✅ cerrada (2026-10-05)
- **Objetivo**: proyecto arrancado, desplegable y autenticado de extremo a extremo, aunque sin funcionalidad de viajes todavía.
- **Incluye**: scaffold Expo + TS estricto + Expo Router con la estructura modular por dominio descrita en `CLAUDE.md` (`src/features/`, `src/theme/`, `src/config/`, `src/lib/`); sistema de diseño base con la paleta **Atlas Blue** aprobada centralizada en `src/theme/tokens.ts` y las tipografías (Fraunces, Work Sans, IBM Plex Mono) auto-alojadas; proyecto Supabase desplegado (UE) con migraciones versionadas desde cero; autenticación por invitación/allowlist; RLS mínima (solo `profiles`/`allowed_emails`); CI en GitHub Actions (lint, typecheck, test, build); tarea de keep-alive y primera tarea de backups; primera build instalable (PWA desplegada + APK en GitHub Releases).
- **Criterios de aceptación**: un usuario de la allowlist puede entrar con magic link; alguien fuera de la allowlist no puede; la web se despliega públicamente; el APK se instala en un Android real; CI está en verde.
- **Tests**: RLS de `profiles`/`allowed_emails`, flujo de login E2E (Playwright web).
- **Riesgos**: configurar correctamente RLS desde el principio (si se hace mal, hay que migrar datos después); límites de Supabase/EAS aún sin verificar en detalle (bloquea hasta tener la sección 2 cerrada).
- **Qué se podrá probar**: instalar la PWA en el iPhone desde Safari, instalar el APK en Android, entrar con el email invitado desde ambos y desde el navegador del ordenador.

### Fase 2 — Viajes e itinerario ✅ cerrada y ampliada (2026-10-05)
> ⚠️ Reescrita 2026-10-05 (pivote local-first): ya no depende de ninguna tecnología de sincronización ni de conexión a Supabase — eso se simplifica bastante respecto al plan original.
- **Objetivo**: gestión completa de viajes y el itinerario día a día, **local en el dispositivo**, sin cuenta ni conexión.
- **Incluye**: motor de almacenamiento local (SQLite nativo vía `expo-sqlite` / IndexedDB en web) con IDs generados en cliente; "My trips" (crear/ver/editar/archivar/borrar con papelera de 30 días); itinerario con resumen por día + detalle editable por día; categorías de reserva con campos propios por tipo (vuelos/trenes/bus/ferry con transportista y aeropuerto/estación+terminal de salida y llegada, alojamiento con dirección y check-in/out, estado idea/to-book/booked/paid/cancelled); lista de `trip_participants` (nombres locales, sin cuenta).
- **Ampliado más allá del alcance original de esta fase** (adelantado desde las Fases 3/6 porque encajaba de forma natural sobre lo ya construido, sin esperar a esas fases): pestaña **Reservations** (todas las reservas agrupadas por categoría, editables, el mismo registro que Itinerary — nunca contradictorios); pestaña **Notes** (notas libres con fotos adjuntas, con nombre, subidas desde la galería); pestaña **Expenses** (total gastado con desglose por categoría, gastos manuales no ligados a una reserva, conversor de divisas con selector real de monedas vía Frankfurter); cuenta atrás del viaje en "My trips" y en el Overview.
- **Criterios de aceptación**: crear un viaje completo sin tener conexión a internet en ningún momento del proceso (salvo el conversor de divisas, que necesita red); cerrar la app por completo y reabrirla sin perder nada; editar una reserva desde Reservations y verlo reflejado en Itinerary al instante.
- **Tests**: unitarios de fechas/zonas horarias, cuenta atrás, estado derivado del viaje.
- **Qué se podrá probar**: crear el viaje "Italia", añadir vuelos/hoteles con todos sus datos, verlos correlacionados en Itinerary y Reservations, apuntar notas con fotos, y seguir el gasto total.
- **Pendiente para más adelante, fuera de esta fase**: importación automática desde PDF/captura (Fase 3, sigue necesitando la conversación de diseño de la cadena de extracción antes de empezar) y reparto de gastos entre participantes (ahora parte de la Fase 6, ver abajo).

### Fase 3 — Importación de reservas
- **Objetivo**: la función estrella — subir el PDF/capturas y que el viaje se genere solo.
- **Incluye**: cadena de extracción (QR/barcode, OCR on-device, parsers de texto, parsers específicos por proveedor); pantalla de revisión con campos editables y nivel de confianza; colocación automática en el día/hora correctos; detección de duplicados; generación automática de gasto y tareas asociadas (p. ej. check-in online); validación del itinerario (fechas que no cuadran, nombres de estación mal escritos) usando el PDF de ejemplo como caso de prueba real, incluidos sus errores intencionados.
- **Criterios de aceptación**: importar `docs/ejemplo_itinerario.pdf` genera el viaje Italia estructurado (7 días, 4 hoteles, 2 vuelos, trenes, traslados) y señala los dos errores (Cardona/Cadorna, fechas de agosto/septiembre) para revisión.
- **Tests**: conjunto de documentos de prueba en varios idiomas con medición de precisión de extracción; unitarios de cada parser.
- **Riesgos**: precisión de OCR/parsers con documentos reales variados; esta fase se explicará en detalle (cadena exacta de extracción) antes de implementarse, como pide el encargo.
- **Qué se podrá probar**: subir el PDF real desde el móvil y ver cómo se genera el viaje, corrigiendo los campos dudosos.

### Fase 4 — Mapamundi
- **Objetivo**: el globo 3D interactivo por viaje y el mapa global del usuario.
- **Incluye**: MapLibre con globo 3D, encuadre automático, rutas entre ciudades (arcos geodésicos, estilos por tipo de transporte), niveles de detalle mundo/país/ciudad/calle, interacción (tocar para volar, ficha de punto), filtro por día, modo claro/oscuro del mapa.
- **Criterios de aceptación**: 60 fps con el recorrido completo de Italia (7 ciudades, ~30 puntos); zoom continuo sin tirones desde el globo hasta nivel de calle en un móvil de gama media.
- **Tests**: medición de fps real; prueba de geocodificación automática con corrección manual.
- **Riesgos**: soporte real de globo 3D en web vs. móvil con teselas gratuitas — se verifica con una prueba de concepto pequeña al empezar esta fase, antes de construir el resto sobre ella.
- **Nota de diseño (pedida explícitamente por el usuario)**: la interacción del mapa/globo debe sentirse **al estilo Apple Maps** — transiciones de vuelo ("fly-to") suaves al tocar un país/ciudad/punto, zoom continuo sin saltos, inercia natural en los gestos. Es el referente de fluidez a igualar con MapLibre, por encima de lo ya descrito en la sección 7 de `docs/REQUISITOS.md`.
- **Qué se podrá probar**: abrir el globo del viaje Italia, hacer zoom hasta una calle de Roma, tocar un punto y ver su ficha.

### Fase 5 — Compartir (QR + código temporal)
> ⚠️ Reescrita 2026-10-05 (pivote local-first). Sustituye por completo el antiguo diseño de "Multiusuario" basado en invitaciones persistentes + roles + Realtime. **Antes de implementar esta fase, hay que responder contigo las tres preguntas de diseño abiertas de la sección 3** (instantánea vs. en vivo, un receptor o varios, si los cambios del receptor vuelven al dueño) — determinan si hace falta algo de Supabase detrás o si es enteramente un traspaso de archivo disfrazado de QR.
- **Objetivo**: enviar una copia filtrada de un viaje a otro dispositivo del círculo, sin cuentas ni registro.
- **Incluye** (alcance exacto a cerrar al empezar la fase):
  - Generación de un código corto + QR desde el dispositivo que comparte, con caducidad de 3 minutos.
  - Pantalla de selección de qué compartir: por categoría, una a una o con botón "seleccionar todo".
  - Los campos/categorías marcados `is_sensitive` (p. ej. nº de vuelo, localizador) se excluyen por defecto, con opción de incluirlos a propósito.
  - Pantalla en el dispositivo receptor: escanear el QR o teclear el código, previsualizar lo que se va a recibir antes de aceptar.
  - Registro de actividad local (quién compartió qué y cuándo), sin necesitar que el receptor tenga cuenta.
- **Pospuesto de la sección original** (solo si las preguntas abiertas lo requieren): roles persistentes, comentarios/reacciones/votaciones en vivo, ubicación compartida — tienen sentido si se decide que un viaje compartido sigue "en vivo"; si se decide que es una instantánea puntual, se posponen indefinidamente o se descartan.
- **Criterios de aceptación**: compartir un viaje real por QR entre dos móviles del círculo y que el receptor vea exactamente las categorías elegidas, con los campos sensibles no incluidos ausentes de verdad (no solo ocultos en la UI); el código deja de funcionar pasados los 3 minutos.
- **Tests**: el código caduca de verdad a los 3 minutos; los campos excluidos no viajan en ningún payload (no es un filtro de pantalla, es una exclusión real en el origen); dos receptores distintos no pueden usar el mismo código si se diseña como "un solo uso" (a confirmar en las preguntas abiertas).
- **Riesgos**: es la fase con más decisiones de producto todavía sin cerrar de todo el plan — no empezar a programarla sin esas tres respuestas.
- **Qué se podrá probar**: compartir un viaje real entre dos móviles por QR y comprobar en el receptor que solo llegó lo elegido.

### Fase 6 — Gastos y organización 🚧 en marcha (2026-10-05)
- **Objetivo**: control económico del viaje y seguimiento de lo hecho/pendiente.
- **Corrección de alcance (2026-10-05)**: el primer corte de esta fase probó reparto de gastos entre participantes ("pagado por" + liquidación entre `trip_participants`) — **descartado explícitamente por el usuario**: la app no lleva cuentas de quién pagó qué, solo cuánto te has gastado tú. Se revirtió del todo (migración v5 elimina las tablas `expenses`/`expense_splits` que esa primera versión había creado). De paso se corrigió otra cosa: un gasto añadido desde la pestaña Expenses antes quedaba suelto, sin aparecer en Itinerary; ahora "añadir un gasto" crea directamente una reserva (`booking`) en un día concreto elegido al momento — así cualquier gasto, venga de una reserva o se añada a mano desde Expenses, se ve también en Itinerary (qué día fue) y en Reservations, con un único registro, nunca dos copias que puedan desincronizarse.
- **Incluye**: registro de gasto unificado con las reservas (✅), multimoneda con Frankfurter (✅ ya construido), presupuesto con avisos, gráficas (donut/barras/línea), tareas (✅, ver abajo), checklist de equipaje con plantillas, progreso del viaje, resumen "Wrapped" al terminar.
- **Tareas (✅ 2026-10-05, rama `fase-6-gastos-organizacion`)**: pestaña Tasks por viaje. Cada tarea es un booking con categoría `task` sin día/ciudad (como las Notes), con título, descripción libre, fotos adjuntas y estado pendiente/hecha guardado en `details.done` (no en `status`, que significa otra cosa para las reservas). Lista con casilla para marcar, pendientes arriba y hechas tachadas abajo, contador "N of M done"; detalle con editor, fotos y borrado con confirmación. **Sin asignación a personas** (descartado por el usuario: fue un error de diseño). Las notas y tareas ya no aparecen en Reservations, ni como categoría elegible en el formulario de reservas, ni en el contador de reservas del Overview.
- **Now, notas generales y You (✅ 2026-10-05, rama `fase-6-gastos-organizacion`)** — pedido explícito del usuario:
  - **Now**: para cada viaje en curso o que empieza en los próximos 7 días, una tarjeta con el día ("Day 2 of 4 · Rome"), lo siguiente con cuenta atrás, la línea del día (hecho / ahora / pendiente, reloj local) y las tareas pendientes marcables. Sin viajes cerca, el próximo viaje con su cuenta atrás.
  - **Notas generales**: notas que no pertenecen a ningún viaje (`bookings.trip_id` nulo, migración v6). Desde Now se ven las notas de los viajes en foco + las generales, cada una con una etiqueta discreta de dónde vive; al crear una desde Now hay que elegir destino (General o un viaje en foco). Dentro de un viaje, la nota es siempre de ese viaje.
  - **You**: "pasaporte" de viajero (viajes, países, ciudades, días fuera, gasto convertido a la moneda por defecto), preferencias (nombre, moneda por defecto, tema claro/oscuro/sistema — tabla `settings`, migración v7), copia de seguridad (descargar/restaurar archivo JSON; restaurar solo añade lo que falta) y papelera. Recibir un viaje compartido llega con la Fase 5.
- **Pendiente tras este corte**: presupuesto con avisos, gráficas, checklist de equipaje, resumen "Wrapped" — se abordan en una siguiente iteración de esta fase, a priorizar contigo.
- **Qué se podrá probar**: añadir un gasto desde la pestaña Expenses, elegir el día, y verlo aparecer tanto en Itinerary (ese día) como en Reservations. Crear tareas en la pestaña Tasks, añadirles descripción y fotos, marcarlas como hechas y borrarlas.

### Fase 7 — Extras y pulido
- **Objetivo**: funciones extra priorizadas de la sección 11 y pulido de diseño/rendimiento/accesibilidad en toda la app.
- **Orden de funciones extra para la v1** (de más a menos prioritaria, criterio: qué reduce más fricción real del día a día del viaje frente a qué es vistoso pero secundario):
  1. **Validación del itinerario** (fechas que no cuadran, solapamientos, poco margen entre conexiones, nombres de estación mal escritos) — coste de implementación bajo (reglas sobre datos que ya existen) y valor altísimo: es literalmente el caso de prueba del PDF de ejemplo (Cardona/Cadorna, fechas de agosto/septiembre).
  2. **Recordatorios inteligentes** (check-in online, salir hacia el aeropuerto, entradas con hora) — evita el motivo más común de perder un vuelo o una reserva; reutiliza los datos ya extraídos en la Fase 3.
  3. **Prepare offline + conversor de moneda/propinas** — valor muy alto durante el viaje (sin roaming), coste bajo porque el modo offline ya es la base de la Fase 2.
  4. **Añadir lugares pegando un enlace** (Google Maps/Booking/TripAdvisor) — reduce fricción de planificación manual, complementa pero no sustituye a la importación automática.
  5. **Tiempo previsto por ciudad y día** (Open-Meteo) — bajo coste, valor moderado, mejora el Overview sin dependencias complejas.
  - **Pospuesto después de la v1**: asistente conversacional (necesita evaluar con calma su coste/privacidad), estado de vuelo en tiempo real (depende de encontrar una API gratuita fiable, no garantizado), widgets de pantalla de inicio (Expo los soporta de forma limitada y son más frágiles de mantener), álbum de fotos compartido (presión extra sobre el límite de Storage gratuito de Supabase, mejor una vez se haya medido el uso real).
- **Incluye además**: animaciones y transiciones compartidas; medición de rendimiento real (60 fps, arranque < 2 s); accesibilidad (texto dinámico, contraste, lector de pantalla); pantalla de diagnóstico oculta; feature flags y "What's new".
- **Criterios de aceptación**: cada pantalla revisada contra los principios de diseño del encargo (`docs/VERIFICACION.md`).
- **Tests**: E2E completos de los flujos principales; auditoría de accesibilidad.
- **Riesgos**: alcance variable según lo que se priorice — se ajusta contigo al llegar a esta fase.
- **Qué se podrá probar**: toda la app pulida, de principio a fin.

### Fase 8 — Lanzamiento privado
- **Objetivo**: entregar la app instalada y documentada al círculo cercano.
- **Incluye**: versión final PWA + APK (+ IPA si se decide la vía nativa), guía de lanzamiento (`docs/LANZAMIENTO.md`), checklist de verificación (`docs/VERIFICACION.md`), instrucciones para familia/amigos.
- **Criterios de aceptación**: una persona ajena al desarrollo, siguiendo solo la guía, consigue instalar la app y unirse a un viaje.
- **Tests**: prueba de instalación completa con una persona real del círculo.
- **Qué se podrá probar**: todo el flujo de instalación y primer uso desde cero.

## 7. Riesgos generales y mitigación

- **Límites de planes gratuitos**: se verifican antes de construir cada pieza que dependa de ellos (sección 2, en curso); se añade vigilancia de uso desde la Fase 1 (pantalla de diagnóstico).
- **Pausa de Supabase por inactividad**: tarea programada de keep-alive desde la Fase 1.
- **Limitaciones de iPhone sin Mac**: la PWA cubre las funciones esenciales sin depender de macOS; lo nativo queda como extra opcional con sus limitaciones explicadas con claridad (caducidad de 7 días, máx. 3 apps).
- **Calidad de la extracción de reservas**: medición continua con un conjunto de documentos de prueba real, nunca se guarda un dato de baja confianza sin confirmación del usuario.
- **Elección de la tecnología de sincronización offline**: es la decisión técnica de mayor impacto — se cierra con una prueba de concepto pequeña antes de construir la Fase 2 completa sobre ella.

## 8. Cuentas gratuitas a crear (y cuándo)

| Cuenta | Para qué | Cuándo |
|---|---|---|
| GitHub | Repositorio, CI/CD, Releases, Pages | Ya existe |
| Supabase | Base de datos, Auth, Storage, Realtime, Edge Functions | Fase 1 |
| Expo (EAS) | Builds de APK/IPA y actualizaciones OTA | Fase 1 |
| Sentry | Seguimiento de errores | Fase 1 (o se retrasa a Fase 2 si no es bloqueante) |
| Cloudflare Pages o GitHub Pages | Hosting de la web/PWA | Fase 1 |
| Apple ID gratuito (sin Developer Program de pago) | Solo si se activa la vía nativa de iPhone (sideloading) | Fase 8, opcional |

---

*Próximos pasos: Fases 1 y 2 cerradas y verificadas en producción. Fase 6 (gastos y organización) en marcha en la rama `fase-6-gastos-organizacion`: gastos unificados con las reservas y lista de tareas hechos; quedan presupuesto con avisos, gráficas, checklist de equipaje y resumen "Wrapped". Siguen pendientes de tu respuesta las tres preguntas abiertas de la Fase 5 (sección 3) antes de poder empezarla; la Fase 3 (importación automática) sigue necesitando la conversación de diseño de la cadena de extracción antes de arrancar. Ninguna de las dos bloquea seguir avanzando la Fase 6.*
