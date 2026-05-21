# SafeHome

SafeHome es una plataforma web y móvil para la gestión de conjuntos residenciales. El sistema permite centralizar procesos de administración, comunicación, vigilancia y atención de emergencias, facilitando la interacción entre residentes, administradores y personal de seguridad.

## Descripción general

El proyecto está dividido en tres partes principales:

- **Frontend web:** desarrollado en React, orientado a administradores y vigilantes.
- **Aplicación móvil:** desarrollada en React Native con Expo, orientada exclusivamente a residentes.
- **Backend:** desarrollado con Node.js y Express, conectado a Firebase/Firestore para la persistencia de datos.

## Funcionalidades principales

### Administración web

El rol administrador puede gestionar información clave del conjunto residencial, incluyendo:

- Comunicados.
- Reservas de zonas comunes.
- Residentes registrados.
- Manual de convivencia.
- Configuración de tarifas de vigilancia.
- Consulta de registros de vehículos, visitantes y correspondencia.

### Vigilancia web

El rol vigilante cuenta con herramientas para controlar y registrar la operación diaria del conjunto:

- Registro de ingreso y salida de vehículos.
- Registro de visitantes.
- Registro de correspondencia.
- Consulta de quejas enviadas por residentes.
- Atención de alertas del botón de pánico.
- Cambio de estado de emergencias a “En camino”.
- Reproducción de audios enviados por residentes durante una emergencia.

### Aplicación móvil para residentes

La app móvil está diseñada para residentes y permite:

- Consultar comunicados.
- Realizar reservas.
- Enviar mensajes o quejas.
- Consultar el manual de convivencia.
- Registrar visitantes.
- Actualizar datos personales.
- Activar el botón de pánico.
- Grabar y enviar un audio junto con la alerta de emergencia.
- Confirmar si la emergencia fue atendida o no atendida.

## Botón de pánico

SafeHome incluye un flujo de emergencia entre residente y vigilancia:

1. El residente activa el botón de pánico desde la aplicación móvil.
2. Antes de enviar la alerta, puede grabar un audio describiendo la situación.
3. El vigilante recibe una alerta visual y sonora en el panel web.
4. El vigilante puede marcar la alerta como “En camino”.
5. El residente confirma posteriormente si la emergencia fue atendida o no.
6. El sistema mantiene el historial de las activaciones.

## Tecnologías utilizadas

- React
- React Native
- Expo
- Node.js
- Express
- Firebase Admin SDK
- Firestore
- SweetAlert2
- Phosphor Icons

## Objetivo del proyecto

El objetivo de SafeHome es mejorar la seguridad, comunicación y organización dentro de conjuntos residenciales, ofreciendo una herramienta práctica para la gestión diaria y la atención rápida de emergencias.
```

## Instalación y preparación del proyecto

Para ejecutar SafeHome correctamente es necesario iniciar por separado el backend, el frontend web y, si se desea probar la versión móvil, la aplicación desarrollada en React Native con Expo.

### Requisitos previos

Antes de instalar el proyecto se debe contar con las siguientes herramientas:

- Node.js instalado.
- npm instalado.
- Expo Go instalado en el celular, en caso de probar la aplicación móvil.
- Acceso a la configuración de Firebase usada por el backend.
- Conexión a internet para instalar las dependencias.

## Backend

El backend está desarrollado con Node.js y Express. Es el encargado de exponer la API del sistema y conectarse con Firebase/Firestore.

Para prepararlo, entra a la carpeta del backend:



# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
