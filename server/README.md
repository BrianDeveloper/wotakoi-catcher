# Procesos de Wotakoi-Catcher

## Desarrollo local

1. Copia `.env.example` a `.env` y completa las credenciales necesarias.
2. Ejecuta `npm run dev` para iniciar la API y la interfaz.
3. En otra terminal, ejecuta `npm run dev:bot` para iniciar el bot de Discord.

El bot y el servidor web son procesos independientes. Cerrar la interfaz o reiniciar la API no detiene `/sugerir` mientras el proceso del bot siga activo.

## Despliegue

Despliega la API con `npm run server` y el bot como un worker persistente separado con `npm run bot`. Configura reinicio automático del worker y entrega a cada proceso sus variables desde `server/.env.example`. El bot requiere `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `SUPABASE_URL` y `SUPABASE_ANON_KEY`; la API necesita además `SUPABASE_SERVICE_ROLE_KEY` para los ajustes y el cursor del canal.

No uses la clave de servicio de Supabase en Vite ni en variables `VITE_*`. Antes de desplegar, ejecuta el SQL de `migrations/001_app_settings.sql`.

GitHub Pages solo publica archivos estáticos y no puede ejecutar `npm run bot`, mantener el Gateway de Discord conectado ni ejecutar la API. Puedes alojar el frontend ahí, pero el worker/API deben estar en un servicio de backend con procesos persistentes.

En el proveedor de hosting crea un servicio **Worker/Background Worker** desde este repositorio con:

- **Comando de build:** `npm ci`
- **Comando de inicio:** `npm run bot`
- **Directorio de trabajo:** raíz del repositorio
- **Reinicio:** automático ante salida o error
- **Variables:** `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TMDB_API_KEY`

El worker valida sus variables obligatorias y falla al iniciar si faltan, para que el proveedor pueda reportarlo y reiniciarlo. discord.js vuelve a conectar el Gateway tras cortes de red. Mantén además desplegada la API (`npm run server`) para la interfaz y la sincronización de sugerencias.

## Sincronización de sugerencias

El backend consulta `DISCORD_CHANNEL_ID` con páginas de hasta `DISCORD_LIMIT` mensajes. `DISCORD_SYNC_MAX_PAGES` limita las páginas procesadas por ciclo; el cursor persistido permite continuar en ciclos posteriores sin releer el canal desde el principio. Si `media_items` se vacía después de una sincronización previa, el siguiente ciclo reinicia automáticamente el cursor para volver a importar el canal. Si queda historial por leer, la interfaz lo indica; pulsa Sincronizar otra vez hasta que informe que el historial está completo. Se acepta una sugerencia por línea, con viñetas, numeración, citas Markdown y enlaces Markdown.

## Personalización de avisos

En los controles administrativos de la aplicación, introduce `ADMIN_SECRET_KEY` para conectar. Las plantillas aceptan `{title}`, `{category}`, `{suggested_by}` y `{synopsis}`. Usa vista previa y envío de prueba antes de guardar. Las menciones de Discord están desactivadas en los webhooks.

## Idioma de metadatos TMDB

Las búsquedas y la consulta de detalles solicitan `es-MX`. Cuando TMDB no tiene una traducción mexicana, la integración conserva el título localizado devuelto por la búsqueda y, en último caso, el título original disponible; las sinopsis no cambian a inglés.
