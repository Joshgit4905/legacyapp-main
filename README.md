# Task Manager - Modern Edition

Sistema de gestión de tareas modernizado con Python (FastAPI), MongoDB y frontend minimalista con Tailwind CSS.

## 🚀 Características

- **Backend Moderno**: Python con FastAPI y MongoDB
- **Autenticación JWT**: Sistema seguro de autenticación con tokens
- **Frontend Minimalista**: Diseño moderno con Tailwind CSS y paleta de 3 colores
- **Animaciones Apple-style**: Transiciones suaves y animaciones de entrada
- **API RESTful**: Arquitectura moderna y escalable
- **Responsive Design**: Funciona en todos los dispositivos

## 📋 Requisitos Previos

- Python 3.8 o superior
- MongoDB (local o MongoDB Atlas)
- Navegador web moderno

## 🛠️ Instalación

### 1. Instalar MongoDB

**Opción A: MongoDB Local (Windows)**
1. Descarga MongoDB Community Server desde [mongodb.com](https://www.mongodb.com/try/download/community)
2. Instala y ejecuta MongoDB
3. El servidor estará disponible en `mongodb://localhost:27017`

**Opción B: MongoDB Atlas (Cloud - Recomendado)**
1. Crea una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén tu connection string
4. Actualiza `MONGODB_URI` en el archivo `.env`

### 2. Configurar Backend

```bash
# Navegar a la carpeta del proyecto
cd c:\Users\jrc49\Desktop\legacyapp-main

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
cd backend
pip install -r requirements.txt

# Crear archivo .env (copiar desde .env.example)
copy .env.example .env

# Editar .env con tus configuraciones (opcional)
# notepad .env
```

### 3. Ejecutar la Aplicación

```bash
# Desde la carpeta backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **API**: http://localhost:8000/api

## 👤 Usuarios por Defecto

El sistema se inicializa automáticamente con estos usuarios:

- **Admin**: `admin` / `admin`
- **User1**: `user1` / `user1`
- **User2**: `user2` / `user2`

## 🎨 Diseño

### Paleta de Colores (3 colores)
- **Primary**: #0F172A (Slate 900 - Navy oscuro)
- **Secondary**: #F8FAFC (Slate 50 - Blanco)
- **Accent**: #3B82F6 (Blue 500 - Azul vibrante)

### Animaciones
- **Login**: Fade in + Scale
- **Dashboard**: Staggered slide-up
- **Cards**: Hover lift effect
- **Buttons**: Scale + shadow on hover

## 📁 Estructura del Proyecto

```
legacyapp-main/
├── backend/
│   ├── main.py              # Aplicación FastAPI principal
│   ├── config.py            # Configuración
│   ├── database.py          # Conexión MongoDB
│   ├── models.py            # Modelos Pydantic
│   ├── auth.py              # Autenticación JWT
│   ├── requirements.txt     # Dependencias Python
│   ├── .env.example         # Template de variables de entorno
│   └── routes/
│       ├── tasks.py         # Endpoints de tareas
│       ├── projects.py      # Endpoints de proyectos
│       ├── comments.py      # Endpoints de comentarios
│       ├── history.py       # Endpoints de historial
│       ├── notifications.py # Endpoints de notificaciones
│       └── users.py         # Endpoints de usuarios
├── index.html               # Frontend moderno
├── app.js                   # JavaScript con API integration
├── styles.css               # Estilos personalizados
└── README.md                # Este archivo
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario

### Tareas
- `GET /api/tasks` - Listar tareas
- `POST /api/tasks` - Crear tarea
- `GET /api/tasks/{id}` - Obtener tarea
- `PUT /api/tasks/{id}` - Actualizar tarea
- `DELETE /api/tasks/{id}` - Eliminar tarea

### Proyectos
- `GET /api/projects` - Listar proyectos
- `POST /api/projects` - Crear proyecto
- `PUT /api/projects/{id}` - Actualizar proyecto
- `DELETE /api/projects/{id}` - Eliminar proyecto

### Otros
- `GET /api/comments/{task_id}` - Comentarios de tarea
- `GET /api/history/{task_id}` - Historial de tarea
- `GET /api/notifications` - Notificaciones del usuario
- `GET /api/users` - Lista de usuarios

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT con tokens
- CORS configurado
- Validación de datos con Pydantic

## 🚀 Producción

Para desplegar en producción:

1. **Backend**: Usar Heroku, Railway, o Render
2. **Database**: MongoDB Atlas (cloud)
3. **Variables de entorno**: Configurar en el servicio de hosting
4. **CORS**: Actualizar orígenes permitidos en `config.py`

## 📝 Notas

- Los datos se almacenan en MongoDB (no localStorage)
- Las contraseñas están hasheadas de forma segura
- El token JWT expira en 24 horas por defecto
- La aplicación usa async/await para mejor rendimiento

## 🐛 Troubleshooting

**Error de conexión a MongoDB:**
- Verifica que MongoDB esté ejecutándose
- Revisa el `MONGODB_URI` en el archivo `.env`

**Error 401 Unauthorized:**
- El token JWT expiró, vuelve a iniciar sesión

**CORS Error:**
- Actualiza `CORS_ORIGINS` en `config.py` o `.env`

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
