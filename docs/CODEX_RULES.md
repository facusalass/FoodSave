# Reglas del Proyecto para Futuras Fases

## Separación

- Mantener `frontend` y `backend` separados.
- No colocar lógica de backend en el frontend.
- No colocar componentes visuales o estilos mobile en el backend.
- Los datos mockeados principales deben vivir en el backend mientras no haya base de datos.

## Frontend

- Usar React Native, Expo, TypeScript y Expo Router.
- Mantener textos visibles en español.
- Respetar la identidad visual de Figma: naranja `#FF6B35`, verde `#14B8A6`, fondo claro y tarjetas limpias.
- Reutilizar componentes antes de duplicar UI.
- La navegación protegida debe depender de sesión y rol.

## Backend

- Usar Node.js, TypeScript y Express salvo decisión explícita nueva.
- Mantener estructura por capas: rutas, controladores, servicios, datos, tipos y middlewares.
- Preparar interfaces para reemplazar mocks por base de datos sin reescribir el frontend.
- No agregar pagos, JWT real, base de datos, almacenamiento externo o geolocalización sin aprobación previa.

## Documentación

- Actualizar `docs/PROJECT_CONTEXT.md` cuando cambien alcance, endpoints, estados, decisiones visuales o credenciales mock.
- Actualizar este archivo si se agregan reglas técnicas nuevas.

## Calidad

- Mantener TypeScript estricto.
- Correr typecheck de frontend y backend antes de cerrar una fase.
- Preferir dependencias necesarias y livianas.
