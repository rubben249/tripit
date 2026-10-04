# Plan — TripIt (app privada de itinerarios de viaje)

> Estado: **completo, listo para tu aprobación**. Las investigaciones automáticas previstas se cancelaron a petición tuya; las secciones de coste cero y priorización de funciones se han completado con mi conocimiento actual en lugar de con una verificación web en vivo. Están marcadas con ⚠️ allí donde convenga reconfirmar el dato exacto contra la documentación oficial en el momento de implementar esa pieza (los límites de planes gratuitos cambian con el tiempo).

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
| Base local offline-first | SQLite (`expo-sqlite`) en móvil + IndexedDB en web, con un "outbox" de mutaciones propio sobre TanStack Query (persistencia de caché + cola de cambios pendientes), sincronizando contra Supabase por polling incremental (`updated_at`) y Realtime para push en vivo | WatermelonDB (su soporte web es limitado/experimental, descartado), RxDB con plugin de replicación a Supabase (viable pero es una dependencia de terceros más pesada y menos madura para este caso), PowerSync (capa de sync gestionada, pero añade un servicio externo más cuyo plan gratuito no está verificado en vivo) | Con un volumen de datos por viaje pequeño (decenas de reservas, no miles), un outbox propio es más simple de razonar, no depende de la disponibilidad ni de los límites de un servicio de sincronización de terceros, y da control total sobre la resolución de conflictos por campo descrita en la sección 3. Si en la Fase 2 la complejidad resulta mayor de lo esperado, se reevalúa PowerSync como mejora. |
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

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cliente (Expo / React Native)               │
│  iOS (PWA / sideload)   Android (APK)   Web (react-native-web)   │
│                                                                   │
│  UI (Expo Router) ─ TanStack Query ─ Store local offline-first   │
│        │                                   │                     │
│        │                          Outbox de mutaciones           │
│        │                          (cola de cambios pendientes)   │
│        ▼                                   ▼                     │
│  Cadena de extracción local        Motor de sincronización       │
│  (QR/barcode, OCR on-device,             │                       │
│   parsers de texto de PDF)               │                       │
└───────────────────────────────────────────┼──────────────────────┘
                                             │ HTTPS / Realtime (WebSocket)
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase (UE, gratuito)                  │
│  Auth (magic link, allowlist)      Postgres + Row Level Security │
│  Storage (documentos, fotos,       Realtime (cambios en vivo)    │
│    URLs firmadas de corta vida)    Edge Functions (validación,   │
│  Scheduled: backups, keep-alive     parsing server-side, rate     │
│                                      limiting, export/import)    │
└─────────────────────────────────────────────────────────────────┘
          │                        │                     │
          ▼                        ▼                     ▼
   GitHub Actions           Sentry (errores)      APIs gratuitas externas:
   - CI (lint/test/build)                          Nominatim/Photon (geocoding)
   - Keep-alive Supabase                           Frankfurter (tipos de cambio)
   - Backups periódicos                            Open-Meteo (tiempo)
   - Build APK / IPA                                Expo Push (notificaciones)
   - Deploy web (GH Pages / Cloudflare Pages)
```

**Flujo de importación de reservas** (detalle completo se explicará y acordará antes de implementar la Fase 3):
1. Usuario sube imagen/PDF → se procesa primero **en el dispositivo** (gratis, sin límites de API): lectura de QR/código de barras (estándar IATA BCBP para tarjetas de embarque), OCR on-device (ML Kit en Android, Vision en iOS, fallback tesseract.js en web), extracción de texto nativo de PDFs.
2. Un conjunto de **parsers específicos** (reglas + expresiones regulares) interpreta formatos conocidos (Ryanair, Booking.com, Trenitalia, Italo, Trenord, billetes genéricos de tren/bus).
3. Si el resultado es insuficiente, se ofrece revisión manual asistida (campos editables) — nunca se guarda sin que el usuario confirme los campos de baja confianza.
4. Solo si se decide usar un modelo de IA gratuito como último recurso (a acordar contigo explícitamente, con análisis de privacidad primero), se usaría como *fallback* para itinerarios complejos como el PDF de ejemplo — el contenido del documento se trata siempre como datos, nunca como instrucciones.

**Sincronización y resolución de conflictos** (propuesta a validar contigo antes de implementar la Fase 2):
- Cada fila mutable tiene `updated_at` y `updated_by`. Cuando dos ediciones del mismo registro llegan offline, se aplica **last-write-wins por campo** (no por fila completa): se comparan los campos modificados y se conserva el valor más reciente de cada uno, no se pisa un registro entero por un solo campo cambiado.
- Si dos campos *distintos* del mismo registro cambiaron en paralelo, se combinan sin conflicto.
- Si el *mismo* campo cambió en ambos sitios, se conserva el más reciente y se dispara una entrada en `activity_log` visible como aviso ("Ana y Luis editaron la hora del Coliseo — se mantuvo el cambio de Luis, más reciente") con opción de deshacer.
- Los cambios se encolan en un "outbox" local cuando no hay conexión y se reproducen en orden al recuperar la red; Realtime de Supabase empuja los cambios de otros participantes en vivo cuando hay conexión.

## 4. Modelo de datos

🔶 Esquema completo propuesto — se refinará y se convertirá en migraciones SQL versionadas en la Fase 1, con políticas RLS exactas por tabla.

### Tablas principales

- **`profiles`** (1:1 con `auth.users`): `id`, `email`, `display_name`, `avatar_url`, `is_admin`, `created_at`.
- **`allowed_emails`**: allowlist de acceso cerrado — `email`, `invited_by`, `created_at`, `used_at`.
- **`trips`**: `id`, `owner_id`, `name`, `description`, `status` (`draft`/`upcoming`/`ongoing`/`past`/`archived`), `start_date`, `end_date`, `default_currency`, `cover_image_url`, `created_at`, `updated_at`, `deleted_at` (papelera de 30 días).
- **`trip_members`**: `trip_id`, `user_id`, `role` (`owner`/`editor`/`viewer`), `joined_at`, `personal_notes` (solo visibles para ese usuario).
- **`trip_invites`**: `id`, `trip_id`, `short_code`, `link_token`, `role`, `expires_at`, `single_use`, `used_at`, `revoked_at`, `created_by`.
- **`cities`**: `id`, `trip_id`, `name`, `country_code`, `lat`, `lng`, `arrival_date`, `departure_date`, `order_index`.
- **`itinerary_days`**: `id`, `trip_id`, `city_id`, `date`, `day_index`, `notes`.
- **`booking_categories`**: `id`, `trip_id` (null = categoría global del usuario), `key`, `label`, `icon`, `color`, `is_custom`, `sort_order`, `hidden`, `field_schema` (JSONB, define campos propios de categorías personalizadas).
- **`bookings`** (unifica pasos de itinerario y reservas — vuelos, trenes, hoteles, restaurantes, entradas, notas, tareas visibles en el itinerario): `id`, `trip_id`, `city_id`, `day_id`, `category_id`, `status` (`idea`/`to_book`/`booked`/`paid`/`cancelled`), `title`, `start_at` (timestamptz), `end_at`, `timezone`, `location_name`, `address`, `lat`, `lng`, `details` (JSONB — nº de vuelo, localizador, asiento, etc., validado con Zod según la categoría), `price`, `currency`, `notes`, `order_index`, `source_document_id`, `extraction_confidence`, `created_by`, `updated_by`, `created_at`, `updated_at`.
- **`documents`**: `id`, `trip_id`, `booking_id` (nullable), `storage_path`, `file_type`, `original_filename`, `uploaded_by`, `ocr_status`, `extracted_data` (JSONB bruto de la extracción, antes de revisión), `created_at`.
- **`expenses`**: `id`, `trip_id`, `booking_id` (nullable), `paid_by`, `amount`, `currency`, `amount_in_trip_currency`, `exchange_rate`, `exchange_rate_date`, `category_id`, `city_id`, `date`, `payment_method`, `note`, `receipt_document_id`, `created_by`, `created_at`.
- **`expense_splits`**: `id`, `expense_id`, `user_id`, `share_amount`, `settled`.
- **`tasks`**: `id`, `trip_id`, `title`, `due_date`, `reminder_at`, `assigned_to`, `status` (`pending`/`done`/`skipped`), `related_booking_id`, `created_by`.
- **`packing_items`**: `id`, `trip_id`, `user_id` (null = compartido), `label`, `category`, `checked`, `template_source`.
- **`activity_log`**: `id`, `trip_id`, `user_id`, `action_type`, `entity_type`, `entity_id`, `summary_text`, `created_at`.
- **`comments`**: `id`, `trip_id`, `entity_type`, `entity_id`, `user_id`, `body`, `created_at`.
- **`polls`** / **`poll_votes`**: votaciones tipo "restaurante A o B".
- **`notification_prefs`**: `user_id`, `trip_id`, `notification_type`, `enabled`.

### Índices clave

- `bookings(trip_id, day_id, order_index)` para renderizar el itinerario rápido.
- `expenses(trip_id, date)` y `expense_splits(expense_id)` para las gráficas.
- `trip_members(user_id)` y `trip_members(trip_id)` para las comprobaciones de RLS (ambos sentidos).
- `activity_log(trip_id, created_at desc)` para el feed de actividad.

### Políticas RLS (patrón general, se detalla por tabla en las migraciones)

- Toda tabla con `trip_id` exige `EXISTS (SELECT 1 FROM trip_members WHERE trip_id = x.trip_id AND user_id = auth.uid())` para `SELECT`.
- `INSERT`/`UPDATE` exigen además `role IN ('owner','editor')`.
- `DELETE` en `trips` exige `role = 'owner'`.
- `personal_notes` en `trip_members` solo es legible por su propio `user_id`.
- Tests automáticos (Fase 1 y repetidos en cada fase que toque el esquema): un `viewer` no puede escribir aunque llame directamente a la API; un usuario sin `trip_members` no ve nada del viaje.

## 5. Mapa de pantallas y navegación

**Móvil** — barra de pestañas inferior (máx. 5) + botón "+" central:
`My Trips` · `Map` (vista global de todos los viajes) · **+** (añadir rápido: gasto, documento, paso, nota) · `Now/Next` (solo visible con un viaje en curso) · `Profile/Settings`.

Dentro de un viaje: `Overview` · `Itinerary` · `Bookings` · `Documents` · `Map` · `Expenses` · `Tasks/Packing` · `Notes` · `People` (navegación secundaria tipo pestañas superiores o carrusel).

**Web / pantallas grandes** — barra lateral fija con las mismas secciones más espacio de trabajo para planificar (p. ej. itinerario y mapa lado a lado).

**Pantallas clave a enseñar antes de programar** (sección 12 del encargo): onboarding, listado de "My trips", asistente de creación de viaje, Overview de un viaje (con el globo), itinerario día a día, tarjeta de reserva por categoría (vuelo/tren/hotel), pantalla de revisión de importación, gastos con gráficas, pantalla de compartir/invitar.

## 6. Fases de desarrollo

### Fase 1 — Cimientos
- **Objetivo**: proyecto arrancado, desplegable y autenticado de extremo a extremo, aunque sin funcionalidad de viajes todavía.
- **Incluye**: scaffold Expo + TS estricto + Expo Router; sistema de diseño base (paleta azul marino, tipografías, componentes básicos) con las variantes de paleta para elegir; proyecto Supabase desplegado (UE) con migraciones versionadas desde cero; autenticación por invitación/allowlist; RLS mínima (solo `profiles`/`allowed_emails`); CI en GitHub Actions (lint, typecheck, test, build); tarea de keep-alive y primera tarea de backups; primera build instalable (PWA desplegada + APK en GitHub Releases).
- **Criterios de aceptación**: un usuario de la allowlist puede entrar con magic link; alguien fuera de la allowlist no puede; la web se despliega públicamente; el APK se instala en un Android real; CI está en verde.
- **Tests**: RLS de `profiles`/`allowed_emails`, flujo de login E2E (Playwright web).
- **Riesgos**: configurar correctamente RLS desde el principio (si se hace mal, hay que migrar datos después); límites de Supabase/EAS aún sin verificar en detalle (bloquea hasta tener la sección 2 cerrada).
- **Qué se podrá probar**: instalar la PWA en el iPhone desde Safari, instalar el APK en Android, entrar con el email invitado desde ambos y desde el navegador del ordenador.

### Fase 2 — Viajes e itinerario
- **Objetivo**: gestión completa de viajes y el itinerario día a día, funcionando offline.
- **Incluye**: "My trips" (crear/ver/editar/archivar/borrar con papelera de 30 días/exportar/importar JSON); asistente de creación paso a paso; itinerario con línea de tiempo por día, categorías de reserva por defecto (sin personalización todavía), vista "Now/Next"; modo offline con el motor de sincronización y resolución de conflictos de la sección 3.
- **Criterios de aceptación**: crear un viaje de principio a fin sin conexión y que sincronice al recuperar red; reordenar pasos del itinerario; exportar e importar el mismo viaje sin pérdida de datos.
- **Tests**: unitarios de fechas/zonas horarias, orden de rutas, exportación/importación; E2E de crear-editar-borrar un viaje.
- **Riesgos**: la tecnología de sincronización elegida (sección 1, pendiente de verificar límites) condiciona el resto de fases — es la decisión técnica más delicada del proyecto.
- **Qué se podrá probar**: crear el viaje "Italia" a mano con los datos del PDF de ejemplo, verlo en el móvil y en el navegador con los mismos datos, ponerse en modo avión y seguir editando.

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
- **Riesgos**: soporte real de globo 3D en web vs. móvil con teselas gratuitas — se confirma con la investigación en curso antes de empezar esta fase.
- **Qué se podrá probar**: abrir el globo del viaje Italia, hacer zoom hasta una calle de Roma, tocar un punto y ver su ficha.

### Fase 5 — Multiusuario
- **Objetivo**: compartir un viaje entre varios móviles en tiempo real.
- **Incluye**: invitaciones por enlace/QR/código corto, roles (owner/editor/viewer), sincronización en tiempo real vía Supabase Realtime, registro de actividad, notificaciones de cambios importantes, comentarios/reacciones/votaciones, ubicación compartida temporal opcional.
- **Criterios de aceptación**: dos móviles y la web editando el mismo viaje ven los cambios del otro en segundos; un viewer no puede editar nada aunque lo intente desde la API directamente.
- **Tests**: automatizados de permisos por rol (ya cubiertos parcialmente desde Fase 1, se completan aquí); prueba manual con dos dispositivos reales.
- **Riesgos**: límites de conexiones simultáneas de Realtime en el plan gratuito (a verificar) con el círculo de hasta ~10-15 personas.
- **Qué se podrá probar**: invitar a otra persona real, verla aparecer en el viaje, editar a la vez desde dos móviles y comprobar que no se pierde nada.

### Fase 6 — Gastos y organización
- **Objetivo**: control económico del viaje y seguimiento de lo hecho/pendiente.
- **Incluye**: registro rápido de gastos, multimoneda con Frankfurter, presupuesto con avisos, gráficas (donut/barras/línea), gastos compartidos con liquidación mínima de pagos, to-do con sugerencias desde el itinerario, checklist de equipaje con plantillas, progreso del viaje, resumen "Wrapped" al terminar.
- **Criterios de aceptación**: repartir un gasto entre 3 personas y que la liquidación final sea matemáticamente correcta con el mínimo de transacciones; gráficas se actualizan al añadir un gasto.
- **Tests**: unitarios de reparto de gastos y conversión de moneda (incluye casos límite de redondeo).
- **Riesgos**: ninguno mayor; es la fase más autocontenida.
- **Qué se podrá probar**: añadir gastos reales del viaje Italia desde varios móviles y ver la liquidación final.

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

*Próximos pasos: este plan está completo y a la espera de tu aprobación. Al aprobarlo, se crea la rama `fase-1-cimientos` y se empieza a programar. Antes de tocar pantallas, te enseño primero navegación, paletas de color y tipografías (sección 12 del encargo) para tu visto bueno, como pide el encargo.*
