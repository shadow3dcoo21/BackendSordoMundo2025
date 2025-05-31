//Nuevos cambios en el servidor
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const http = require('http');


//
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db/db');
const fs = require('fs-extra'); 
const Presentar = require('./models/Presentar');
const { uploadFile } = require('./util/s3');  // Asegúrate de usar la ruta correcta


// Rutas
const authRoutes = require('./routes/auth/authRoutes');
const userRoutes = require('./routes/user/userRoutes');
const contentRoutes = require('./routes/content/contentRoutes');

// Configuración de CORS
const corsOptions = require('./config/cors/cors');

// Inicializar la aplicación
const app = express();

// --- Configuración base ---
dotenv.config(); // Cargar variables de entorno desde el archivo .env

// --- Conexión a la base de datos ---
connectDB(); // Conectar a MongoDB


// --- Crear servidor HTTP ---
const server = http.createServer(app);

// --- Configuración WebSocket ---
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://sordomundo.pro'],
    methods: ['GET', 'POST'],
    credentials: true
  },

  transports: ['websocket']
});

// --- Autenticación WebSocket ---
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Token requerido');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Autenticación fallida'));
  }
});
// --- Manejo de conexiones ---
io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.user.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.user.id}`);
  });
});

// --- Middlewares globales ---
app.use(cors(corsOptions)); // Habilitar CORS con opciones
app.options('*', cors(corsOptions)); // Manejar preflight requests
app.use(express.json()); // Parsear cuerpos JSON
app.use(express.urlencoded({ extended: true })); // Parsear datos URL-encoded
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos

// Middleware para añadir headers CORS adicionales (opcional, ya está incluido en corsOptions)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});


// --- Rutas principales ---
app.get('/', (req, res) => {
  res.status(200).send('Bienvenido a la API');
});

// Rutas específicas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);


// Servir directorios adicionales
app.use('/datos', express.static(path.join(__dirname, 'Datos/Bloque')));

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Algo salió mal',
    message: err.message,
  });
});


// --- Iniciar el servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = { io };






