const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');
const User = require('../../models/User');

// Función para loguearse
const loginUser = async (req, res) => {
    const { username, password } = req.body;
  
    try {

      // Extraer el rol desde la URL
      const roleFromUrl = req.originalUrl.split('/').pop(); // Esto tomará la última parte de la URL como rol (estudiante, externo, etc.)


      // Verificar si el usuario existe
      const user = await User.findOne({ username });
      const tiporol = roleFromUrl;
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }else{
        
      }
  
      // Si el rol es 'profesor' o 'externo', se valida la contraseña
      if (['profesor'].includes(user.role)) {
        if (!password) {
          return res.status(400).json({ message: 'La contraseña es obligatoria para este rol' });
        }
        
        // Verificar la contraseña
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        if (tiporol !== 'profesor'){
          return res.status(400).json({ message: 'Rol Incorrecto' });
        }
      } else if (user.role === 'estudiante' ) {
        // Si el rol es 'estudiante', no se valida la contraseña
        // Solo se valida el nombre de usuario
        if (!username) {
          return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
        }
        
      }else if (user.role === 'externo' ) {
        if (!username) {
          return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
        }
        if (tiporol !== 'externo'){
          return res.status(400).json({ message: 'Rol Incorrecto' });
        }
        // Si el rol es 'estudiante', no se valida la contraseña
        // Solo se valida el nombre de usuario
      }
  
      // Crear el payload para el JWT
      const payload = {
        _id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        sex: user.sex,
        email: user.email,
      };
  
      // Crear el token JWTT
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      console.log("token generado",token)
      // Enviar el token
      return res.json({ token });
  
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };


  
  // Función para registrar un nuevo usuario
const registerUser = async (req, res) => {
    const { role, firstName, lastName, sex, username, password, email } = req.body;
  
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
  
      // Validar los campos según el rol
      if (role === 'estudiante') {
        // Para rol estudiante, no es necesario email ni contraseña
        if (!firstName || !lastName || !sex || !username) {
          return res.status(400).json({ message: 'Los campos "firstName", "lastName", "sex", y "username" son obligatorios' });
        }
      } else if (role === 'profesor' || role === 'externo') {
        // Para profesor y externo, todos los campos son obligatorios
        if (!firstName || !lastName || !sex || !username || !password || !email) {
          return res.status(400).json({ message: 'Todos los campos son obligatorios para este rol' });
        }
  
        // Validar si el correo electrónico ya está en uso
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }
  
        // Hashear la contraseña antes de almacenarla
        const hashedPassword = await bcrypt.hash(password, 10);
        req.body.password = hashedPassword;
      }
  
      // Crear un nuevo usuario
      const newUser = new User({
        role,
        firstName,
        lastName,
        sex,
        username,
        password: req.body.password,
        email,
      });
  
      // Guardar el usuario en la base de datos
      await newUser.save();
  
      return res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      console.error('Error en registro:', error);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
  };



module.exports = { loginUser , registerUser };
