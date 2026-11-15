# Configuración de datos de la aplicación

Ejecuta `001_app_settings.sql`, `002_media_ratings.sql` y `003_watching_status.sql` en el SQL Editor del proyecto Supabase.

`003_watching_status.sql` normaliza el `CHECK` de `media_items.status` para admitir el estado `WATCHING`: el flujo pasa a ser `PENDING` (en cola) → `IN_MACHINE` (en máquina) → `WATCHING` (viendo / próxima a ver) → `WATCHED` (vista). `WATCHING` se asigna al sacar la obra de la máquina y `WATCHED` se marca a mano al terminar de verla; solo las obras `WATCHED` se pueden calificar y aparecen en el historial y el ranking.

`002_media_ratings.sql` crea las calificaciones por obra y la vista `media_watch_stats`, que concentra el promedio y la cantidad de votos de los títulos vistos. Las calificaciones se pueden leer, crear y editar desde el backend; el borrado se produce en cascada al eliminar un título.

Después configura `SUPABASE_SERVICE_ROLE_KEY` solo en el entorno del backend. Esta clave nunca debe incluirse en el frontend ni es necesaria para el worker de Discord. La tabla `app_settings` activa RLS sin políticas para que los clientes públicos no puedan leer ni modificar plantillas administrativas ni el cursor de sincronización.

La aplicación usa `app_settings` para persistir las plantillas de notificación y el avance de lectura del canal. El backend usa la clave de servicio para esas operaciones.
