# Encargo — App privada de itinerarios de viaje (móvil + web)

> Este documento es la transcripción íntegra del encargo original dado por el usuario, guardada como fuente de verdad del proyecto. No se reinterpreta ni se recorta: si algo cambia, se actualiza aquí y se anota la decisión en `docs/PLAN.md`.

## 0. Rol, objetivo y forma de trabajar

Actuar como un equipo senior completo: product manager, diseñador UX/UI, ingeniero mobile y web, ingeniero backend, experto en seguridad y QA. Construir desde cero una app de itinerarios de viaje lo más completa posible. Debe ser bonita, elegante, interactiva, fácil de usar, segura y fluida.

**Idiomas**: conversación siempre en español. La app, íntegramente en inglés (textos, botones, mensajes).

### Requisitos fundamentales (no negociables)

- **Varios viajes**: sección "My trips" para crear, ver, editar, archivar, borrar, exportar e importar viajes.
- Itinerario día a día perfectamente organizado y fácil de consultar, también sin conexión.
- **Importación automática de reservas**:
  - El usuario sube capturas, fotos o PDFs de reservas (vuelos, hoteles, trenes, buses, restaurantes, entradas).
  - La app extrae correctamente los datos de interés (nº de vuelo, horas, localizador, dirección, QR…) y los organiza sola.
  - No se manejan documentos personales sensibles (pasaportes, DNI): solo reservas.
  - Tipos de reserva bien diferenciados (hotel, restaurante, tren, vuelo, transporte…) con categorías por defecto, sugerencias automáticas y personalización.
- Mapamundi 3D interactivo en cada viaje, con zoom desde el globo hasta nivel de calle y los puntos unidos en el orden del itinerario.
- Gastos con presupuesto y gráficas, incluidos gastos compartidos.
- Organización clara de lo hecho, lo pendiente y lo planificado.
- **Multiusuario privado**: solo para el usuario y un círculo cerrado de personas. Varias personas comparten un viaje desde sus móviles, sincronizado en tiempo real a través de un servidor con base de datos desplegado en la nube.
- **Móvil y ordenador**: la misma app debe funcionar en iPhone, Android y en el navegador del ordenador, con los mismos datos.
- Bonita, elegante, interactiva y muy fácil de usar, con una paleta clásica de azul marino y azules sobrios (sección 12). Una función que no sea fácil y agradable de usar no está terminada.
- **Coste cero**: todo con servicios gratuitos. No se paga nada: ni cuenta de Apple Developer, ni Google Play, ni APIs de pago. Analizar para cada servicio si la opción gratuita merece la pena, sus límites y qué pasa si se superan (sección 2).
- Segura, fluida y lista para instalar y probar en iPhone y Android sin publicarla en las tiendas.

### Forma de trabajar (obligatorio)

1. Guardar este encargo completo en el repositorio como `docs/REQUISITOS.md` (este archivo). Crear también un `CLAUDE.md` con las reglas clave del proyecto (stack, convenciones, seguridad, coste cero, cómo ejecutar tests), para que el contexto no se pierda entre sesiones.
2. Hacer las preguntas de la sección 14 (y las que se consideren necesarias) antes de diseñar nada. No asumir decisiones importantes sin consultar.
3. Diseñar un plan completo (sección 13) en `docs/PLAN.md` y esperar aprobación antes de programar.
4. Usar Git de forma ordenada:
   - Commits pequeños y descriptivos por cada paso.
   - Una rama por fase, que se fusiona a `main` solo cuando la fase está probada.
   - Etiquetas de versión al cerrar cada fase, para poder volver atrás siempre.
5. Desarrollar por fases. Al terminar cada fase:
   - Ejecutar los tests.
   - Hacer una revisión independiente del código (si es posible, con un subagente que no haya escrito ese código) buscando bugs, problemas de seguridad, rendimiento, usabilidad y código duplicado, y corregir lo que se encuentre.
   - Dar un resumen breve, instrucciones para probar esa fase en el móvil y propuestas de mejora.
   - Esperar el visto bueno antes de seguir.
6. Durante el desarrollo, si hay una decisión relevante con varias opciones razonables, preguntar. Para detalles menores, decidir y explicarlo en una línea.
7. Proponer mejoras por iniciativa propia (funciones, estética, UX, rendimiento, seguridad) siempre que surjan.
8. Al final, entregar la guía de lanzamiento y pruebas (sección 15) y verificar la lista de requisitos (sección 16).

## 1. Contexto: cómo es un itinerario real

En `docs/ejemplo_itinerario.pdf` (y su transcripción en `docs/ejemplo_itinerario_transcripcion.md`) hay un itinerario real (en español): Madrid → Roma → Florencia (+ excursión a Pisa) → Venecia → Milán → Madrid, del 28/08/2024 al 03/09/2024. Se usa como referencia del tipo de información que la app debe manejar y como datos de prueba (seed). Contiene:

- **Vuelos**: FR9685 Madrid → Roma Fiumicino (17:40–20:05) y FR9149 Milán Malpensa → Madrid (19:05–21:25). Incluye duración y hora recomendada de llegada al aeropuerto.
- **Hoteles**: Viennese Due (Roma), Holiday Rooms (Florencia), Hotel Falier (Venecia) y Hotel Gambara (Milán). Cada uno tiene dirección, fechas, enlace de reserva y notas (p. ej. "check-in online por llegada tardía").
- **Trenes y traslados**:
  - Trenes Roma → Florencia (18:15), Florencia → Venecia (09:39) y Venecia → Milán (15:57).
  - Malpensa Express Milano Cadorna → Malpensa T1, con PNR, QR, clase, precio y ventana de validez.
  - Bus Terravision desde el aeropuerto, con terminal, nº de parada y precio.
  - Transporte local: líneas de bus y metro con dirección, paradas, duración, precio y horarios de servicio. Incluye alternativas según la hora ("si vamos tarde, bus H o 64").
- **Plan día a día**: pasos ordenados con hora aproximada, visitas y entradas con hora (Coliseo 09:00). También restaurantes con alternativas y "plan B si vamos mal de tiempo".
- Listas de sitios para comer por ciudad y consejos prácticos ("el agua es potable → cantimploras").
- Mapas y rutas entre puntos.

Aunque la interfaz sea en inglés, la app debe leer correctamente documentos en cualquier idioma (español, italiano, inglés…).

El PDF tiene además errores humanos típicos que la app debe ayudar a detectar. Se usan como casos de prueba de la validación:

- "Cardona" en vez de "Cadorna" (estación de Milán).
- "Venecia 01/08/2024" y "Milán 02/08/2024" en los encabezados de sección, cuando en realidad son fechas de septiembre.

## 2. Stack técnico y coste cero

**Regla general**: todo debe ser gratuito. Para cada servicio, comprobar los límites vigentes del plan gratuito, si son suficientes para un círculo pequeño de personas, si piden tarjeta de crédito y qué pasa si se superan. Preferir servicios sin tarjeta. Si alguna función no tiene una opción gratuita razonable, se debe avisar y proponer alternativas o descartarla con el usuario.

Propuesta inicial a verificar y justificar cambios si procede:

- **App**: Expo (React Native) + TypeScript estricto + Expo Router. Un solo código para iOS, Android y web (react-native-web).
- **Servidor**: Supabase, plan gratuito (Postgres con Row Level Security, Auth, Storage, Realtime, Edge Functions).
  - Comprobar límites de base de datos, almacenamiento y usuarios.
  - Los proyectos gratuitos se pausan tras un periodo de inactividad: solucionarlo, por ejemplo con una tarea programada gratuita en GitHub Actions que lo mantenga activo.
  - Comprimir las imágenes antes de subirlas para no llenar el almacenamiento.
- **Lectura de reservas sin coste**: analizar y proponer la mejor combinación gratuita (sección 4). Por ejemplo:
  - Lectura de códigos de barras y QR (las tarjetas de embarque usan el estándar IATA BCBP, que contiene vuelo, localizador, asiento, etc.).
  - OCR en el propio dispositivo (p. ej. ML Kit / Apple Vision, gratis y sin conexión).
  - Extracción de texto directa de los PDFs.
  - Analizadores específicos para los proveedores más comunes (Ryanair, Booking, Trenitalia, Italo, Trenord…).
  - Y solo si merece la pena, un modelo de IA con plan gratuito. En ese caso, analizar sus límites, su fiabilidad y su política de privacidad (algunos planes gratuitos usan los datos para entrenar), explicarlo y preguntar antes de usarlo.
- **Offline-first**: base de datos local con sincronización bidireccional (recomendar una que funcione también en web).
- **Mapas**: MapLibre con teselas gratuitas sin clave (p. ej. OpenFreeMap). Comprobar que soporta globo 3D en móvil y web, y si no, proponer la mejor alternativa gratuita.
- **Otros servicios gratuitos**:
  - Geocodificación: Nominatim o Photon, respetando su política de uso (caché y límite de peticiones).
  - Tipos de cambio: Frankfurter, con datos del Banco Central Europeo.
  - Notificaciones push: Expo Push.
  - Errores: plan gratuito de Sentry.
  - CI: GitHub Actions.
  - Estado y datos: TanStack Query. Animaciones: Reanimated + Gesture Handler. Listas: FlashList. Imágenes: expo-image. Gráficas: una librería fluida y compatible con web (a recomendar).
- **Builds y distribución gratuitas**: ver sección 12 ("Distribución sin coste"). Plan gratuito de EAS (Build y Update) y/o builds en GitHub Actions, según lo que mejor encaje.

## 3. My trips (gestión de varios itinerarios)

La sección "My trips" es la pantalla principal. El usuario puede tener todos los viajes que quiera.

### Listado

- Cada viaje es una tarjeta visual con:
  - Foto de portada, nombre, destinos, fechas, nº de días y estado.
  - Cuenta atrás si el viaje es próximo.
  - Mini resumen: vuelos, hoteles, tareas pendientes, gasto frente a presupuesto y participantes.
- Los viajes se agrupan en: Ongoing, Upcoming, Drafts/ideas, Past y Archived.
- Búsqueda, filtros (año, país, estado), orden (fecha, nombre, recientes) y opción de fijar favoritos.
- Si hay un viaje en curso, aparece destacado al abrir la app y lleva directo a "Now / Next".

### Crear un viaje (asistente paso a paso, sencillo y bonito)

- Desde cero: nombre, fechas, ciudades en orden con sus fechas, participantes, moneda, presupuesto y portada (propia o sugerida según el destino).
- Desde documentos: subir reservas o un itinerario (PDF o capturas) para generar el viaje.
- Desde una plantilla o duplicando un viaje anterior, con opción de mover todas las fechas automáticamente.
- Desde un archivo exportado (ver "Exportar e importar").
- Se puede guardar como borrador y completarlo después.

### Ver un viaje

Secciones: Overview · Itinerary · Bookings · Documents · Map · Expenses · Tasks/Packing · Notes · People. El Overview incluye:

- El mapamundi (sección 7) y la cuenta atrás.
- Las próximas reservas, el progreso y los avisos de validación.

### Editar un viaje

- Se puede editar cualquier dato, con guardado automático, historial de cambios y deshacer.
- Si cambian las fechas del viaje o de una ciudad, la app ofrece reajustar los días automáticamente y avisa de lo que queda fuera de rango (hoteles, vuelos, entradas).

### Borrar un viaje

- Confirmación clara de lo que se borra (documentos, gastos, fotos).
- Papelera de 30 días para recuperarlo, y la alternativa de archivar en lugar de borrar.
- En viajes compartidos, solo el propietario puede borrar para todos. Los demás solo pueden salir del viaje.
- El borrado definitivo elimina también los archivos del servidor, sin dejar datos huérfanos.

### Exportar e importar

- Exportar un viaje completo a un archivo con toda su información:
  - Un archivo propio (p. ej. JSON con los documentos incluidos) que se puede volver a importar en la app, como copia de seguridad o para pasárselo a otra persona.
  - Un PDF bonito y legible del itinerario.
  - Un calendario `.ics` con los eventos.
  - Un CSV de los gastos.
- Importar ese archivo crea el viaje de nuevo, comprobando antes que el archivo es válido y seguro.

## 4. Importación automática de reservas (función estrella)

- **Formas de subir documentos**: capturas, fotos o PDFs desde la galería, la cámara o los archivos, o desde el menú "Compartir" del sistema cuando la plataforma lo permita. En web, también arrastrando el archivo.
- **Tipos de documento**: tarjetas de embarque, confirmaciones de vuelo, billetes de tren y bus, reservas de hotel y restaurante, entradas, coches de alquiler e itinerarios completos. No se admiten documentos de identidad.
- **Qué debe hacer la app**:
  - Detectar el tipo de documento y su categoría (sección 5).
  - Extraer correctamente los campos de interés: nº de vuelo o tren, compañía, origen y destino (con códigos IATA), terminal, puerta, asiento, coche, clase, fecha y hora con zona horaria, localizador/PNR, pasajero, hotel, dirección, check-in/out, precio y moneda, y QR o código de barras.
  - Usar la combinación gratuita de técnicas de la sección 2. Diseñar la cadena de extracción para que sea lo más precisa posible y explicarla antes de implementarla.
  - **Pantalla de revisión antes de guardar**: campos editables, nivel de confianza y campos dudosos resaltados. La app debe ser fiable: mejor preguntar que guardar un dato incorrecto.
  - **Colocación automática**: cada elemento se coloca en el día y hora correctos del itinerario, enlazado a su documento original. También crea su gasto y las tareas o recordatorios asociados (p. ej. check-in online).
  - **Itinerario completo**: al importar un PDF como el de ejemplo, se genera el viaje estructurado (ciudades, días, pasos, transportes, restaurantes y consejos). Si para esto hace falta un modelo de IA, aplicar la regla de coste cero y privacidad de la sección 2.
  - **Duplicados**: detectar reservas repetidas y proponer fusionarlas.
  - **Seguridad**: si se usa un modelo de IA, el contenido de los documentos se trata siempre como datos, nunca como instrucciones (protección contra prompt injection).
- **Calidad**:
  - Crear un conjunto de documentos de prueba (reservas reales de ejemplo, en varios idiomas) y medir la precisión de la extracción.
  - Informar de los resultados en cada fase.

## 5. Tipos de reservas: bien diferenciados y personalizables

Cada tipo debe distinguirse de un vistazo en toda la app: itinerario, reservas, documentos, mapa, gastos y notificaciones. Usar el mismo icono, color y estilo de tarjeta en todas partes.

**Categorías por defecto** (cada una con icono, color, diseño de tarjeta y campos propios). Los colores deben ser sobrios y armonizar con la paleta azul marino (sección 12), diferenciándose sobre todo por icono, forma y tono:

- ✈️ **Flight**: tarjeta con aspecto de billete de avión (aerolínea, nº de vuelo, aeropuertos, terminal, puerta, asiento, equipaje, localizador, tarjeta de embarque).
- 🚆 **Train**: tarjeta con aspecto de billete de tren (compañía, nº de tren, estaciones, coche, asiento, clase, PNR, QR).
- 🚌 **Bus / transfer**: compañía, línea, parada (p. ej. "Terminal 3, stop 14") y precio.
- 🚇 **Local transport**: metro, bus urbano, tranvía, vaporetto o taxi, con línea, dirección, paradas y alternativas.
- 🚗 **Car rental** · ⛴️ **Boat / ferry**.
- 🏨 **Accommodation**: check-in/out, dirección, nº de reserva, contacto y noches. Se muestra como una franja que abarca todas las noches.
- 🍽️ **Restaurant**: hora, nº de personas, nº de reserva, teléfono y tipo de cocina. Se distingue reservado de sugerencia sin reserva.
- 🎟️ **Ticket / activity / tour**: hora, punto de encuentro y QR (Coliseo 09:00, excursión a Murano y Burano).
- 📍 **Sightseeing** · 🛍️ **Shopping** · 🎉 **Leisure** · 📝 **Note** · ✅ **Task**.

**Estado de cada reserva**, visible como etiqueta: Idea · To book · Booked · Paid · Cancelled.

### Sugerencias automáticas

- La app asigna la categoría y la subcategoría al importar.
- Al escribir a mano, la app sugiere la categoría ("Trattoria" → Restaurant).

### Personalización

- Cambiar el color y el icono de cualquier categoría, con paletas predefinidas dentro del estilo clásico y botón para restaurar los valores por defecto.
- Crear categorías y subcategorías propias (p. ej. "Ice cream", "Viewpoints") con sus propios campos, partiendo de plantillas sugeridas.
- Ocultar o reordenar categorías. Los ajustes se aplican a todos los viajes, con opción de cambiarlos en uno concreto.
- Contraste comprobado en modo claro y oscuro, y apto para daltonismo: el icono y la forma siempre acompañan al color.

### Visualización

- Filtros por categoría y estado ("trains only", "to book") en el itinerario, el mapa y los documentos.
- Leyenda de colores siempre accesible.
- Vista "Bookings" agrupada por tipo, con contadores (2 vuelos, 4 hoteles, 4 trenes…) y lo que falta por reservar.
- Las mismas categorías se usan en los gastos y sus gráficas.

## 6. Itinerario día a día y documentos de reserva

### Itinerario

- Línea de tiempo por día con las tarjetas de la sección 5. Cada paso muestra:
  - Hora (exacta o aproximada), lugar, dirección, notas, coste, enlaces y adjuntos.
  - Botón "Directions", que abre Google Maps o Apple Maps.
  - Transporte local con alternativas (plan A/B, "if we're late").
- Reordenar arrastrando y marcar pasos como hechos, con gestos de deslizar.
- Vista "Now / Next": qué toca ahora mismo, lo siguiente y cuánto falta.
- Zonas horarias bien gestionadas: las horas se muestran en la hora local del lugar, con la hora de casa como opción.

### Documentos de reserva

- Todos los billetes y reservas de cada viaje juntos, organizados por tipo y disponibles sin conexión.
- QR y códigos de barras a pantalla completa con brillo máximo para el control.

## 7. Mapamundi interactivo del viaje

En el Overview de cada viaje habrá un globo terráqueo 3D de tamaño medio, dentro de una tarjeta. Con un toque se amplía a pantalla completa.

### Comportamiento

- Al abrirlo: giro suave de entrada y encuadre automático de todas las ciudades del viaje.
- Países del viaje resaltados en el azul del viaje. Ciudades con marcador y nombre.
- Ruta entre ciudades:
  - Líneas unidas en el orden del itinerario (Madrid → Roma → Florencia → Pisa → Florencia → Venecia → Milán → Madrid), con flechas o animación que indique el sentido.
  - A escala mundial, arcos geodésicos (el camino más corto sobre el globo).
  - Estilo distinto por transporte: avión en arco discontinuo, tren en línea continua, bus o coche con otro estilo, cada uno con su icono.
- Zoom continuo con gestos (pellizcar, doble toque, girar, inclinar) desde el globo entero hasta el zoom máximo de calle, con edificios 3D si el proveedor lo permite.
- Niveles de detalle según el zoom:
  - **Mundo**: países, ciudades y ruta entre ciudades.
  - **País**: ciudades con sus noches y fechas.
  - **Ciudad**: los puntos que se van a visitar (hotel, monumentos, restaurantes, estaciones), con icono por categoría y numerados en el orden del itinerario, unidos por líneas en ese orden. Cada día tiene su tono de azul y hay un filtro por día.
  - **Calle**: detalle completo de cada punto.
- Interacción:
  - Al tocar un país o una ciudad, la cámara "vuela" hacia él.
  - Al tocar un punto, se abre su ficha (hora, notas, "Directions", enlace al paso del itinerario).
  - Botones rápidos: ver todo el viaje, ir a hoy, mi ubicación y selector de día.
  - Los puntos visitados se ven atenuados o con un check, y el siguiente punto aparece resaltado.
- Otros detalles:
  - Clustering de marcadores cercanos.
  - Interruptor "straight lines / real route".
  - Modo claro y oscuro, y uso sin conexión con las zonas del viaje descargadas, si es posible gratis.

### Requisitos técnicos

- Proveedor: MapLibre con teselas gratuitas (sección 2). Confirmar el soporte de globo en móvil y web, o proponer una alternativa gratuita.
- Coordenadas: se obtienen por geocodificación automática al importar. El usuario puede corregirlas arrastrando el marcador.
- Países: los polígonos vienen de un GeoJSON ligero incluido en la app.
- Rendimiento: 60 fps con cientos de puntos. Usar capas nativas (símbolos y líneas GeoJSON), no un componente por marcador.
- Mapa global del usuario: un mapa de todos sus viajes con "countries and cities visited".

## 8. Gastos, presupuesto y gráficas

- Registro rápido (2 toques): importe, moneda, categoría, fecha, ciudad, método de pago, quién pagó, nota y foto del ticket.
- Rellenado automático:
  - Escanear tickets con OCR para completar el gasto.
  - Las reservas importadas generan su gasto automáticamente.
- Multimoneda: conversión automática a la moneda principal con el tipo de cambio del día del gasto, que queda guardado.
- Presupuesto total, por categoría, por ciudad y por día, con avisos al acercarse al límite y una previsión del gasto final según el ritmo actual.
- Gráficas interactivas y animadas, en los tonos de la paleta:
  - Por categoría (donut), por día (barras) y acumulado frente a presupuesto (línea).
  - Por ciudad y por persona.
  - Resumen de gasto medio diario y de lo que queda por día.
- Gastos compartidos: quién debe a quién, con liquidación con el mínimo de pagos.
- Previsto frente a real: reservas por pagar frente a gastos reales.
- Exportación a CSV y al PDF del viaje.

## 9. Organización: lo hecho, lo pendiente y lo planificado

- **To do**: tareas con fecha límite, recordatorio y responsable.
  - Ejemplos: reservar entradas, check-in online, seguro, cambio de moneda, descargar mapas.
  - La app sugiere tareas a partir del itinerario ("You have a Colosseum entry at 09:00 — did you buy the ticket?").
- **Planned**: el itinerario futuro, el día de hoy y "Now / Next".
- **Done**: pasos completados, lugares visitados y gastos.
  - Al final de cada día, la app propone marcar lo hecho y lo saltado.
  - Lo que no se hizo se puede mover a otro día.
- **Progreso del viaje**: % de tareas completadas, días recorridos, lugares visitados frente a planificados, km, ciudades y gasto frente a presupuesto.
- Checklist de equipaje con plantillas (ciudad, playa, nieve…) adaptadas al destino, la duración y el tiempo previsto.
- Antes, durante y después del viaje:
  - Antes: planificación y cuenta atrás.
  - Durante: modo viaje simplificado (lo que toca ahora, billetes y QR, registrar gasto, cómo llegar y el tiempo).
  - Después: resumen tipo "Wrapped" con estadísticas, mapa recorrido y fotos, diario por día, y la opción de reutilizar el viaje como plantilla.

## 10. Multiusuario privado: compartir viajes entre móviles

La app es privada: solo la usarán el usuario y un círculo cerrado de personas (familia y amigos).

### Acceso cerrado

- Sin registro abierto: solo se entra con una invitación válida o con un email de una lista de permitidos que el administrador gestiona.
- Panel de administrador (solo para el dueño del proyecto) para invitar al círculo, ver usuarios, desactivar o eliminar cuentas y vigilar el uso de los límites gratuitos (almacenamiento, base de datos, peticiones).

### Compartir un viaje

- Formas de invitar: enlace, código corto, código QR o elegir a alguien del círculo.
- Invitaciones: caducan, son de un solo uso y se pueden revocar.
- Roles por viaje:
  - **Owner**: todo, incluido borrar el viaje y gestionar participantes.
  - **Editor**: añade y modifica itinerario, reservas, gastos, documentos y tareas.
  - **Viewer**: solo ve.
- Notas personales por participante que el resto no ve.

### Sincronización

- Los cambios de cualquier participante aparecen en los demás móviles y en la web en tiempo real.
- Sin conexión todo sigue funcionando: los cambios se guardan en local y se sincronizan al volver internet.
- Resolución de conflictos: diseñar una estrategia (p. ej. por campo, con aviso si dos personas editan lo mismo) y explicarla antes de implementarla.
- Documentos: los subidos se comparten con el viaje y se descargan para verlos offline.

### Colaboración

- Seguimiento de cambios: quién creó o modificó cada elemento, y un registro de actividad ("Ana added a €24 expense at Trattoria Zà Zà").
- Notificaciones de cambios importantes, configurables por persona (ver las limitaciones de iPhone en la sección 12).
- Participación: comentarios y reacciones en cada paso, votaciones (restaurante A o B, plan A o B) y tareas asignadas.
- Ubicación compartida opcional y temporal entre participantes.
- Compartir fuera del círculo: un enlace de solo lectura o el archivo exportado.

## 11. Más funciones (priorizar con el usuario cuáles van en la v1)

Incluir solo las que se puedan hacer gratis.

### Notificaciones y validación

- Recordatorios inteligentes: check-in online (24 h antes), "leave for the airport", "your train leaves in X min", check-in/out del hotel, recoger el equipaje, entradas con hora y tareas. Todos configurables y con zona horaria.
- Validación del itinerario, con sugerencia de corrección:
  - Noches de hotel que no cuadran o días sin alojamiento.
  - Fechas fuera del viaje y solapamientos.
  - Poco margen entre conexiones y nombres de estaciones mal escritos.
  - Lugares cerrados el día planificado.

### Durante el viaje

- Prepare offline: un botón descarga todo (documentos, mapas, itinerario) y un indicador muestra qué está disponible sin conexión.
- Desplazamientos: tiempo estimado al siguiente punto y aviso si no se llega a tiempo.
- Herramientas rápidas:
  - Conversor de moneda y calculadora de propinas.
  - Frases útiles del idioma local.
  - Botón de emergencia: número local, embajada, seguro y compartir ubicación.
- Tiempo previsto por ciudad y día (con una API gratuita, p. ej. Open-Meteo).
- Estado del vuelo en tiempo real, solo si existe una API gratuita fiable.

### Planificación

- Sugerencias: qué hacer en huecos libres, optimizar el orden de visitas por cercanía y avisar de entradas que conviene reservar con antelación.
- Añadir lugares pegando un enlace de Google Maps, Booking o TripAdvisor.
- Información por ciudad: mapas de metro y transporte guardados y consejos.
- Sincronización con el calendario del móvil.
- Asistente que responde preguntas sobre el viaje ("When does the train to Venice leave?"), solo si hay una opción gratuita que merezca la pena.

### Comodidad

- Widgets de pantalla de inicio donde sea posible gratis.
- Búsqueda global en toda la app.
- Álbum de fotos compartido del viaje, vigilando el límite de almacenamiento gratuito.

## 12. Diseño, rendimiento, seguridad, calidad, servidor y distribución

### Principios de diseño (prioridad máxima)

La app debe ser bonita, elegante, interactiva y fácil de usar. Aplicar estos principios en cada pantalla:

- **Bonita y elegante**:
  - Estética cuidada y coherente, con espacio en blanco generoso y jerarquía visual clara.
  - Pocos colores bien elegidos y tipografía de calidad.
  - Ningún elemento con aspecto "por defecto" o improvisado.
- **Interactiva**:
  - Todo responde al toque con animaciones suaves y feedback háptico.
  - Gestos naturales: deslizar, arrastrar, pellizcar y mantener pulsado.
  - Transiciones que ayudan a entender de dónde viene y a dónde va cada pantalla.
  - Elementos vivos: cuenta atrás, globo 3D, gráficas que se animan al aparecer.
- **Fácil de usar**:
  - Las acciones frecuentes en máximo 2–3 toques: ver el próximo billete, añadir un gasto, ver qué toca ahora.
  - Se entiende sin instrucciones, con textos claros y cercanos y valores por defecto inteligentes.
  - Nunca se pierden datos y siempre se puede deshacer.
  - Usable con una mano y con prisas (en una estación o en el control del aeropuerto).
- **Comprobación**: en cada fase, revisar cada pantalla con estos principios y proponer mejoras de diseño y usabilidad. Incluir en `docs/VERIFICACION.md` una revisión de usabilidad de los flujos principales.

### Paleta de colores y estética

- Paleta clásica: azul marino como color principal, combinado con otros azules sobrios, elegantes y robustos (azul acero, azul pizarra, azul grisáceo, azul claro apagado) y neutros cálidos o fríos (blanco roto, grises).
- Como mucho un acento discreto para avisos y acciones importantes.
- Aplicada de forma coherente en botones, gráficas, mapa y categorías.
- Proponer 2–3 variantes de paleta con sus códigos de color y una vista previa, y dejar que el usuario elija.
- Modo claro y oscuro: ambos con la misma elegancia (en oscuro, base azul marino profundo en lugar de negro puro).
- Tipografía: clásica y elegante, muy legible (p. ej. una serif refinada para títulos y una sans-serif limpia para el texto). Proponer opciones.
- Visuales:
  - Portadas grandes con degradados en tonos azules.
  - Tarjetas con desenfoque sutil, esquinas redondeadas y sombras suaves.
  - Billetes de vuelo y tren con aspecto real.
  - Mapa con estilo personalizado acorde a la paleta.
- Navegación: barra inferior con un máximo de 5 secciones y un botón "+" central para añadir rápido (gasto, documento, paso, nota). En web y pantallas grandes, una barra lateral con más espacio para planificar.
- Animación y estados:
  - Transiciones compartidas (la tarjeta del viaje se expande al abrirlo), skeletons de carga y feedback háptico.
  - Estados vacíos y celebraciones con ilustraciones o Lottie, en el estilo de la paleta.
  - Primer uso: onboarding corto y bonito.
- Accesibilidad: texto dinámico, contraste y lector de pantalla.
- Idioma: interfaz solo en inglés, con fechas y monedas en formato claro. Arquitectura preparada (i18n) por si en el futuro se añade otro idioma.
- **Antes de programar las pantallas**: mostrar la navegación, las paletas, las tipografías y el diseño de las pantallas clave, y esperar el visto bueno.

### Rendimiento y fluidez

- Objetivos: 60 fps en scroll, animaciones y mapa, y arranque en menos de 2 s en un móvil de gama media.
- Técnicas:
  - FlashList, imágenes en caché y comprimidas, y carga progresiva.
  - Precarga del viaje en curso.
  - Actualizaciones optimistas con reintentos.
  - Subidas en segundo plano con reanudación.
  - Control del tamaño de la app.
- Medición: medir con herramientas reales y dar un informe en cada fase.

### Seguridad y privacidad

- Autenticación: email (enlace mágico o código), solo con invitación, y otros métodos gratuitos si encajan. Tokens en almacenamiento seguro.
- Permisos de datos:
  - Row Level Security en todas las tablas: cada persona solo ve los viajes en los que participa, y un Viewer no puede modificar nada aunque manipule la app.
  - Tests automáticos de todos los permisos.
- Archivos:
  - Storage privado con URLs firmadas de corta duración.
  - Se eliminan los metadatos EXIF (ubicación) de las imágenes.
  - Límites de tamaño y tipo de archivo, y validación de los archivos importados.
- Servidor:
  - Secretos solo en el servidor, nunca en el código de la app ni en el repositorio.
  - Validación con Zod en cliente y servidor.
  - Rate limiting en las funciones del servidor.
- Datos locales: protegidos, con bloqueo opcional de la app por biometría.
- RGPD: política de privacidad sencilla para el círculo, exportar los datos del usuario y borrar su cuenta.
- Higiene: sin datos personales en los logs, y revisión de dependencias.

### Depuración y calidad

- Código: TypeScript estricto, ESLint y Prettier, y una estructura de carpetas clara y documentada.
- Tests:
  - Unitarios: fechas, zonas horarias, validación, extracción de reservas, monedas, reparto de gastos, exportación e importación, y orden de rutas.
  - De integración del backend.
  - E2E de los flujos principales con Maestro o Detox, y Playwright para la web.
  - Prueba completa con el ejemplo: importar el PDF debe generar correctamente el viaje Italia y detectar sus errores.
- CI con GitHub Actions: lint, tipos, tests y build en cada cambio.
- Errores:
  - Sentry (plan gratuito) con mapas de código fuente y sin datos personales.
  - Error boundaries, y mensajes claros con botón de reintentar: nunca pantallas en blanco.
- Pantalla de diagnóstico oculta (solo para el administrador): estado de la sincronización, cambios pendientes, versión, último error, uso de los límites gratuitos, forzar sincronización y limpiar caché.
- Gestión de versiones: feature flags, changelog, versionado semántico y pantalla "What's new" en la app.

### Servidor y base de datos

- Supabase plan gratuito, en región de la UE (p. ej. Frankfurt), si sus límites lo permiten (sección 2).
- Migraciones: todo el esquema (tablas, índices, RLS, funciones, triggers, buckets) como migraciones versionadas, para recrear el servidor desde cero con un comando.
- Entornos: desarrollo y producción. Si el plan gratuito limita el número de proyectos, proponer la mejor solución (p. ej. desarrollo en local con la CLI de Supabase).
- Copias de seguridad gratuitas: el plan gratuito no incluye copias automáticas fiables. Crear una tarea programada gratuita (p. ej. GitHub Actions) que haga copias periódicas de la base de datos y los archivos a un lugar privado, y documentar cómo restaurarlas.
- Vigilancia: un aviso al acercarse a cualquier límite gratuito.

### Distribución sin coste (sin tiendas y sin cuenta de Apple Developer)

Analizar a fondo y proponer la mejor combinación gratuita, explicando ventajas, límites y la experiencia real de cada persona del círculo. Opciones a valorar:

- **Web / PWA** (recomendada como base):
  - La misma app publicada gratis (p. ej. GitHub Pages o Cloudflare Pages) y usable en el ordenador.
  - En iPhone se instala desde Safari en la pantalla de inicio, sin cuenta de pago ni caducidad.
  - Comprobar qué funciona bien así en iOS: modo offline, almacenamiento, notificaciones web push (requieren instalar la app en la pantalla de inicio), cámara, globo 3D, etc.
- **Android**: APK gratuito generado con el plan gratuito de EAS o con GitHub Actions y publicado en GitHub Releases. Se instala directamente y se actualiza con EAS Update o con avisos de nueva versión dentro de la app.
- **iPhone nativo gratis** (opcional, para quien lo quiera):
  - Generar el IPA con GitHub Actions (runner de macOS) o EAS, e instalarlo con SideStore, AltStore o Sideloadly usando un Apple ID gratuito.
  - Limitaciones claras: la app caduca cada 7 días y hay que refrescarla, máximo 3 apps instaladas así, hay que activar el modo desarrollador, y algunas funciones no están disponibles con cuenta gratuita (p. ej. notificaciones push nativas, extensiones y widgets).
  - Recomendar si merece la pena frente a la PWA.
- Diseñar la app para que todas las funciones esenciales funcionen en la PWA, y que lo exclusivo de nativo sea un extra.
- Dejar todo preparado por si algún día se publica en las tiendas.

## 13. El plan que se debe diseñar (`docs/PLAN.md`)

Después de las respuestas del usuario, diseñar un plan completo y detallado con:

- Resumen de decisiones: lo acordado y las alternativas descartadas, con su porqué.
- Análisis de coste cero: cada servicio gratuito elegido, sus límites, si piden tarjeta, si merece la pena y qué pasa al superarlos.
- Arquitectura: diagrama de app (móvil y web), base local, sincronización, Supabase, extracción de reservas, mapas, notificaciones, copias de seguridad y distribución.
- Modelo de datos completo: tablas, relaciones, índices, políticas RLS y estrategia de sincronización y conflictos.
- Mapa de pantallas y navegación (móvil y web), y descripción de las pantallas clave.
- Fases de desarrollo con su orden lógico. Para cada fase indicar:
  - Objetivo.
  - Funcionalidades incluidas.
  - Criterios de aceptación comprobables.
  - Tests.
  - Riesgos.
  - Qué se podrá probar en el móvil y en el ordenador al terminarla.
- Propuesta orientativa (ajustable):
  - Fase 1 — Cimientos: proyecto, Git, sistema de diseño (paleta azul marino), servidor desplegado, autenticación por invitación, RLS, CI, copias de seguridad, y primera versión instalable (PWA + APK).
  - Fase 2 — Viajes e itinerario: My trips (crear/ver/editar/borrar/exportar/importar), itinerario día a día, categorías de reservas, modo offline y sincronización.
  - Fase 3 — Importación de reservas: cadena de extracción gratuita, revisión, documentos y validación.
  - Fase 4 — Mapamundi: globo 3D, rutas y zoom por niveles.
  - Fase 5 — Multiusuario: invitaciones, roles, tiempo real, actividad y notificaciones.
  - Fase 6 — Gastos y organización: gastos, presupuesto, gráficas, tareas, equipaje y progreso.
  - Fase 7 — Extras y pulido: funciones extra priorizadas, animaciones, rendimiento y accesibilidad.
  - Fase 8 — Lanzamiento privado: versiones finales, distribución al círculo y guía final.
- Riesgos y cómo mitigarlos (especialmente los límites gratuitos y las limitaciones de iPhone).
- Lista de cuentas gratuitas a crear, y en qué momento.

## 14. Preguntas iniciales (respondidas antes de empezar)

1. ¿Nombre de la app? → **TripIt** (configurable vía variable de entorno `APP_NAME`, ver `CLAUDE.md`).
2. ¿Cuántas personas, aproximadamente, la usarán, y cuántas tienen iPhone y cuántas Android? → No más de 10 en el círculo cercano, pero la arquitectura debe escalar fácilmente en el futuro.
3. ¿Mac disponible? → No hay Mac; el objetivo final de instalación es iPhone. Se usará la vía PWA como base (sin necesidad de Mac) y, si se quiere nativo en el futuro, GitHub Actions con runner macOS.
4. ¿Cómo invitar a la gente? → Enlace de invitación, código QR y código corto (varias opciones).
5. ¿Moneda principal por defecto? → EUR, configurable por el usuario.
6. ¿Qué funciones extra de la sección 11 en la v1? → Decidido en `docs/PLAN.md` a partir de la investigación de apps de itinerarios existentes.
7. ¿Cuenta de GitHub? → Sí, ya existe.
8. ¿Nivel técnico? → Avanzado (desarrollador/a con experiencia de ingeniería).

## 15. Entrega final: guía de lanzamiento y pruebas (`docs/LANZAMIENTO.md`)

Al terminar, se debe escribir una guía paso a paso, muy clara y pensada para alguien sin mucha experiencia, y explicarla también en el chat. Debe incluir:

- Requisitos previos: qué instalar en el ordenador (Node, Git, EAS CLI, Supabase CLI…) y qué cuentas gratuitas crear (GitHub, Expo, Supabase, Sentry…), para qué sirve cada una y sus límites.
- Poner en marcha el servidor: crear el proyecto Supabase, aplicar migraciones, configurar secretos, desplegar las funciones, activar las copias de seguridad y la tarea que evita la pausa, crear el usuario administrador y comprobar que todo funciona.
- Ejecutar la app en desarrollo:
  - En el navegador del ordenador.
  - En el móvil Android y en el iPhone, viendo los cambios en directo.
  - En simuladores.
- Cargar los datos de prueba: el viaje Italia del PDF de ejemplo, para probar todo con datos reales.
- Checklist de pruebas manuales paso a paso que cubra todas las funciones:
  - Crear, editar, borrar, exportar e importar viajes.
  - Importar capturas de reservas y el PDF.
  - Categorías y reservas.
  - Mapamundi y zoom.
  - Gastos y gráficas.
  - Tareas.
  - Modo sin conexión (modo avión).
  - Invitar a otra persona y comprobar la sincronización entre dos móviles y la web.
  - Roles y permisos.
  - Notificaciones.
- Publicar y distribuir gratis al círculo:
  - Web/PWA: cómo publicarla y cómo instalarla en iPhone desde Safari y en el ordenador.
  - Android: cómo generar el APK, publicarlo en GitHub Releases e instalarlo.
  - iPhone nativo (si se elige): paso a paso con SideStore/AltStore y cómo refrescar cada 7 días.
- Cómo actualizar la app después (cambios sin reinstalar y cuándo hace falta una versión nueva).
- Instrucciones para la familia/amigos, listas para enviarles: cómo instalar la app en su móvil, aceptar la invitación y empezar.
- Mantenimiento: copias de seguridad y cómo restaurarlas, cómo ver errores en Sentry, cómo vigilar los límites gratuitos, y cómo añadir o quitar personas.
- Solución de problemas frecuentes.
- Si algún día se quiere publicar en App Store y Google Play: qué faltaría y cuánto costaría.

## 16. Lista de verificación final

Antes de dar el proyecto por terminado, crear `docs/VERIFICACION.md`. Debe ser una tabla con cada requisito de este encargo, su estado (hecho / parcial / pendiente / descartado de acuerdo con el usuario), dónde está implementado y cómo se ha probado. Incluir la revisión de usabilidad y la confirmación de que todo funciona con coste cero. No dar nada por terminado sin comprobarlo.
