// Configuración de CORS más robusta
const corsOptions = {
    origin: function (origin, callback) {
      const whitelist = [
        'https://sordomundo.pro',
        'https://www.sordomundo.pro',
        'https://sordomundo.vercel.app', 
        'http://sordomundo.pro',
        'https://localhost:3000',
        'http://localhost:3000',
      ];
  
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };

  module.exports = corsOptions;