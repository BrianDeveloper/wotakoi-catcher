# Procesos de Wotakoi-Catcher

## Desarrollo local

1. Copia `server/.env.example` a `server/.env` y completa las credenciales.
2. Ejecuta `npm run dev` para iniciar la API y la interfaz.
3. Configura el endpoint de interacciones de Discord como `http://localhost:4000/api/discord/interactions` solo si usas un túnel HTTPS público para pruebas locales.

`/sugerir` funciona mediante interacciones HTTP; no necesita una conexión Gateway ni un proceso de bot separado.

## Configuración de Discord

1. En Discord Developer Portal, abre la aplicación y copia **Public Key** de **General Information** a `DISCORD_PUBLIC_KEY`.
2. Configura `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` y `DISCORD_GUILD_ID` en `server/.env`.
3. Con la API accesible, configura **Interactions Endpoint URL** como `https://TU-DOMINIO/api/discord/interactions`. Discord valida la URL enviando un `PING`; el backend verifica la firma Ed25519 y responde `PONG`.
4. Registra el comando del servidor una vez desde el proyecto: `npm run register:discord`.

El endpoint valida la firma con el cuerpo HTTP original y rechaza solicitudes con firma inválida o timestamp vencido. `/sugerir` confirma la interacción de inmediato y completa la respuesta después de guardar la obra. No compartas `DISCORD_TOKEN` ni la clave de servicio de Supabase.

## Despliegue y costos

El modo HTTP elimina la necesidad de pagar por un **worker persistente del Gateway**, pero Discord todavía necesita una URL HTTPS pública que ejecute este backend. Puedes desplegar la API en un servicio web o adaptar el endpoint a una plataforma de funciones; el costo y los límites dependen del proveedor. GitHub Pages por sí solo no puede recibir ni procesar interacciones.

Configura las variables del backend desde `server/.env.example`. Para atender `/sugerir`, el backend necesita `DISCORD_PUBLIC_KEY`, `DISCORD_CLIENT_ID`, `SUPABASE_URL` y `SUPABASE_ANON_KEY`. También requiere `DISCORD_TOKEN`, `DISCORD_GUILD_ID` y `DISCORD_CLIENT_ID` para registrar el comando y sincronizar el canal de sugerencias. La API administrativa necesita además `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_SECRET_KEY`; no pongas secretos en Vite ni en variables `VITE_*`.

Antes de desplegar, ejecuta el SQL de `migrations/001_app_settings.sql`. Mantén la API disponible en el proveedor elegido; los planes gratuitos pueden suspender servicios o tener límites y no garantizan disponibilidad 24/7.

## Sincronización de sugerencias

El backend consulta `DISCORD_CHANNEL_ID` con páginas de hasta `DISCORD_LIMIT` mensajes. `DISCORD_SYNC_MAX_PAGES` limita las páginas procesadas por ciclo; el cursor persistido permite continuar en ciclos posteriores sin releer el canal desde el principio. Si `media_items` se vacía después de una sincronización previa, el siguiente ciclo reinicia automáticamente el cursor para volver a importar el canal. Si queda historial por leer, la interfaz lo indica; pulsa Sincronizar otra vez hasta que informe que el historial está completo. Se acepta una sugerencia por línea, con viñetas, numeración, citas Markdown y enlaces Markdown.

## Personalización de avisos

En los controles administrativos de la aplicación, introduce `ADMIN_SECRET_KEY` para conectar. Las plantillas aceptan `{title}`, `{category}`, `{suggested_by}` y `{synopsis}`. Usa vista previa y envío de prueba antes de guardar. Las menciones de Discord están desactivadas en los webhooks.

## Administración de la biblioteca

Desde la biblioteca, la administración conectada puede eliminar títulos. El borrado es permanente e incluye el registro del historial. El botón **Sortear máquinas** vuelve a seleccionar aleatoriamente hasta 30 títulos activos por categoría; el resto queda `PENDING` y los títulos `WATCHED` con su historial no se modifican.

En cada título, selecciona una categoría y pulsa **↻** para guardarla y volver a consultar en TMDB el título localizado, póster y sinopsis. Si TMDB no encuentra una coincidencia confiable, se conserva el título y sus metadatos actuales, pero se aplica la categoría seleccionada. El estado y el historial no cambian.

Al buscar en TMDB, un alias de una sola palabra entre paréntesis al final se omite de la búsqueda y se usa el título principal para evitar que esa palabra fuerce una coincidencia incorrecta. Los años como `(2017)` y subtítulos de varias palabras como `(Live Action)` se conservan.

Las sugerencias agregadas con `/sugerir` se guardan directamente en `media_items`, no en el canal de sugerencias. Vaciar `media_items` elimina también esas filas; sincronizar el canal solo puede recuperar sugerencias que estén publicadas allí.

## Idioma de metadatos TMDB

Las búsquedas y la consulta de detalles solicitan `es-MX`. Cuando TMDB no tiene una traducción mexicana, la integración conserva el título localizado devuelto por la búsqueda y, en último caso, el título original disponible; las sinopsis no cambian a inglés.
