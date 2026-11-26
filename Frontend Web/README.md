# React + Vite

## Conexión del frontend con la API

Configura `VITE_API_URL` con la URL pública del backend (por ejemplo, `https://mi-api.up.railway.app`). No incluyas credenciales de la base de datos. En local, el valor predeterminado es `http://localhost:3000`.

En Cloudflare Pages, agrega `VITE_API_URL` como variable de entorno de compilación y vuelve a desplegar el sitio tras cambiarla. El valor puede ser el dominio del backend con o sin el sufijo `/api`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
