const jwt = require('jsonwebtoken');  // Mejor usar jsonwebtoken para verificar la firma
const User = require('../models/User');  // Si necesitas acceder al usuario en la base de datos

const authMiddleware = (req, res, next) => {
  // Obtener el token del encabezado 'Authorization' (formato 'Bearer <token>')
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  try {
    // Verificar y decodificar el token (esto también valida la firma y la expiración)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Guardar la información del usuario en req.user (puedes añadir más datos si es necesario)
    req.user = decoded;

    // Continuar con la siguiente función en la ruta
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Token no válido o expirado' });
  }
};

module.exports = authMiddleware;  // Exportación del middleware
