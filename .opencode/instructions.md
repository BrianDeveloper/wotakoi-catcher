# Instrucciones del proyecto

## Principio de rediseño de UI

Cuando se solicite un rediseño de UI, **no te limites a modificar variables de
color CSS**. Debes:

- Reestructurar el HTML/CSS (`flex`/`grid`) y la maquetación.
- Modificar la jerarquía de componentes (extraer/renombrar componentes).
- Agregar sombras, profundidad, biseles y relieve.
- Reorganizar el layout de los elementos (orden, proporciones, marcos).

## Convenciones del repositorio

- React 19 + Tailwind CSS v4 (`@import "tailwindcss"`) + Framer Motion.
- TypeScript estricto, sin `any` explícito.
- Mantener cada archivo componente por debajo de ~250 líneas; si crece,
  extraer a subcomponentes.
- Centralizar constantes/tokens en `src/constants/` y tipos en `src/types/`.