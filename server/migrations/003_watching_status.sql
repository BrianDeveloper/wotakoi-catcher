-- Añade el estado WATCHING (Viendo / próxima a ver) al flujo de títulos:
-- PENDING -> IN_MACHINE -> WATCHING -> WATCHED
-- WATCHING se asigna al salir de la máquina; WATCHED se marca a mano al terminar
-- de verla y solo entonces la obra se puede calificar.

alter table public.media_items
  drop constraint if exists media_items_status_check;

alter table public.media_items
  add constraint media_items_status_check
  check (status in ('PENDING', 'IN_MACHINE', 'WATCHING', 'WATCHED'));

notify pgrst, 'reload schema';
