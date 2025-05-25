# 🌤️ ClimaPlus - Aplicación del Clima

Aplicación para consultar el clima en tiempo real.  
**Frontend**: React | **Backend**: Node.js | **Despliegue**: Docker Compose.

![Docker](https://img.shields.io/badge/Docker-✓-blue?logo=docker)
![React](https://img.shields.io/badge/React-✓-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-✓-339933?logo=node.js)

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos
- [Docker](https://docs.docker.com/get-docker/)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Riub/ClimaPlus.git
cd ClimaPlus
```
### 2. 🐳 Iniciar el Proyecto con Docker
```bash
docker compose up --build
```
Una vez finalizada la construcción de los contenedores, los siguientes servicios estarán disponibles:

🌐 Frontend (React): http://localhost:3000

🌦️ Backend (API Node.js): http://localhost:3001/api/weather?city=Bogota

🔁 Puedes cambiar el nombre de la ciudad en el parámetro city para consultar el clima de diferentes lugares.
