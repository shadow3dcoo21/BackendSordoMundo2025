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
const { uploadFile } = require('./util/s3');

// Configuración de CORS
const corsOptions = require('./config/cors/cors');

// Inicializar la aplicación
const app = express();

// --- Configuración base ---
dotenv.config();

// --- Conexión a la base de datos ---
connectDB();

// --- Crear servidor HTTP ---
const server = http.createServer(app);

// --- Configuración WebSocket ---
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://localhost:3000',  // ✅ Agregado para consistencia
      'https://sordomundo.pro',
      'https://www.sordomundo.pro',
      'https://sordomundo.vercel.app',
      'http://sordomundo.pro'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true // ✅ Compatibilidad adicional
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
    console.log('Error de autenticación WebSocket:', error.message);
    next(new Error('Autenticación fallida'));
  }
});

// --- Manejo de conexiones ---
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.user.id} - Socket ID: ${socket.id}`);
  
  // ✅ Auto-unir a la sala principal
  socket.join('words_updates');
  console.log(`Usuario ${socket.user.id} automáticamente unido a words_updates`);
  
  socket.on('join_words_room', () => {
    socket.join('words_updates');
    console.log(`Usuario ${socket.user.id} se unió manualmente a la sala de words`);
    socket.emit('joined_room', { room: 'words_updates', success: true });
  });

  socket.on('ping', (callback) => {
    console.log(`Ping recibido de ${socket.user.id}`);
    if (callback) callback('pong');
  });

  // ✅ Evento de prueba
  socket.on('test_connection', (data, callback) => {
    console.log(`Test recibido de ${socket.user.id}:`, data);
    const response = {
      message: 'Conexión WebSocket funcionando correctamente',
      timestamp: new Date().toISOString(),
      clientData: data
    };
    if (callback) callback(response);
    socket.emit('test_response', response);
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Usuario desconectado: ${socket.user.id} - Razón: ${reason}`);
  });

  socket.on('error', (error) => {
    console.log(`Error en socket ${socket.user.id}:`, error);
  });
});

// --- Middlewares globales ---
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Middleware simplificado para headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://sordomundo.pro',
    'https://www.sordomundo.pro',
    'https://sordomundo.vercel.app',
    'http://sordomundo.pro'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// --- Rutas principales ---
app.get('/', (req, res) => {
  res.status(200).send('Bienvenido a la API');
});

// ✅ Endpoint mejorado para probar WebSocket
app.get('/api/test-socket', (req, res) => {
  const connectedClients = io.engine.clientsCount;
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  
  res.json({
    message: 'Socket.io está funcionando',
    connectedClients,
    rooms,
    timestamp: new Date().toISOString(),
    transport: 'WebSocket available'
  });
});

// ✅ Hacer io disponible globalmente ANTES de importar rutas
global.io = io;

// ✅ Importar rutas DESPUÉS de crear io
const authRoutes = require('./routes/auth/authRoutes');
const userRoutes = require('./routes/user/userRoutes');
const contentRoutes = require('./routes/content/contentRoutes');

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

// Usar server.listen() en lugar de app.listen()
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`📡 WebSocket disponible no no disponible en ws://localhost:${PORT}`);
  console.log(`🌐 CORS configurado para dominios permitidos`);
});

// ✅ Exportar io para uso externo
module.exports = { app, server, io };