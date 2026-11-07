# Configuración de datos de la aplicación

Ejecuta `001_app_settings.sql` en el SQL Editor del proyecto Supabase.

Después configura `SUPABASE_SERVICE_ROLE_KEY` solo en el entorno del backend. Esta clave nunca debe incluirse en el frontend ni es necesaria para el worker de Discord. La tabla activa RLS sin políticas para que los clientes públicos no puedan leer ni modificar plantillas administrativas ni el cursor de sincronización.

La aplicación usa `app_settings` para persistir las plantillas de notificación y el avance de lectura del canal. El backend usa la clave de servicio para esas operaciones.
