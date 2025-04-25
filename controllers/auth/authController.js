/*const jwt = require('jsonwebtoken');

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

*/





const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/Users/User');
const Person = require('../../models/Person/Person');


// Función para loguearse (para 4 roles: alumno, profesor, externo y admin)
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Extraer el rol desde la URL
    const roleFromUrl = req.originalUrl.split('/').pop();

    // Verificar si el usuario existe y está activo
    const user = await User.findOne({ username, status: 'active' }).populate('profileRef');
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado o cuenta inactiva' 
      });
    }

    // Validaciones específicas por rol
    switch(user.role) {
      case 'alumno':
        // Solo requiere username
        if (!username) {
          return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
        }
        if (roleFromUrl !== 'alumno') {
          return res.status(400).json({ message: 'Ruta de login incorrecta para este rol' });
        }
        break;

      case 'profesor':
        // Requiere username y password
        if (!username || !password) {
          return res.status(400).json({ message: 'Usuario y contraseña son obligatorios para profesores' });
        }
        if (roleFromUrl !== 'profesor') {
          return res.status(400).json({ message: 'Ruta de login incorrecta para este rol' });
        }
        const matchProf = await bcrypt.compare(password, user.password);
        if (!matchProf) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        break;

      case 'externo':
        // Requiere username y password
        if (!username || !password) {
          return res.status(400).json({ message: 'Usuario y contraseña son obligatorios para externos' });
        }
        if (roleFromUrl !== 'externo') {
          return res.status(400).json({ message: 'Ruta de login incorrecta para este rol' });
        }
        const matchExt = await bcrypt.compare(password, user.password);
        if (!matchExt) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        break;

      case 'admin':
        // Requiere username y password (con validación extra)
        if (!username || !password) {
          return res.status(400).json({ message: 'Usuario y contraseña son obligatorios para administradores' });
        }
        if (roleFromUrl !== 'admin') {
          return res.status(400).json({ message: 'Ruta de login incorrecta para este rol' });
        }
        const matchAdmin = await bcrypt.compare(password, user.password);
        if (!matchAdmin) {
          return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        // Validación adicional para admin si es necesaria
        if (!user.isAdmin) {
          return res.status(403).json({ message: 'No tiene privilegios de administrador' });
        }
        break;

      default:
        return res.status(400).json({ message: 'Rol de usuario no válido' });
    }

    // Crear el payload para el JWT
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      status: user.status,
      ...(user.profileRef && {
        profileInfo: {
          firstName: user.profileRef.firstName,
          lastName: user.profileRef.lastName,
          email: user.profileRef.email,
          // Agregar más campos según sea necesario
        }
      })
    };

    // Crear el token JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // Enviar respuesta exitosa
    return res.json({ 
      token,
      user: {
        id: user._id,
        role: user.role,
        username: user.username,
        ...(user.profileRef && {
          firstName: user.profileRef.firstName,
          lastName: user.profileRef.lastName
        })
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Función para registrar un nuevo usuario
const registerUser = async (req, res) => {
  const { username, password, firstName, lastName, sex, email, dni, age, phone, grade, specialty, institution } = req.body;

  try {
    // 1. Validar campos obligatorios
    if (!username || !password || !firstName || !lastName || !sex || !email || !dni || !age || !phone) {
      return res.status(400).json({ message: "Todos los campos personales son obligatorios" });
    }

    // 2. Validar campos por rol (ejemplo para estudiante)
    const role = req.originalUrl.includes('alumno') ? 'estudiante' : 
                 req.originalUrl.includes('profesor') ? 'profesor' : 
                 req.originalUrl.includes('externo') ? 'externo' : null;

    if (!role) return res.status(400).json({ message: "Ruta de registro no válida" });

    if (role === 'estudiante' && !grade) {
      return res.status(400).json({ message: "El campo 'grado' es obligatorio para estudiantes" });
    }
    if (role === 'profesor' && !specialty) {
      return res.status(400).json({ message: "El campo 'especialidad' es obligatorio para profesores" });
    }
    if (role === 'externo' && !institution) {
      return res.status(400).json({ message: "El campo 'institución' es obligatorio para externos" });
    }

    // 3. Verificar si el usuario, email o DNI ya existen
    const [userExists, emailExists, dniExists] = await Promise.all([
      User.findOne({ username }),
      Person.findOne({ email }),
      Person.findOne({ dni })
    ]);

    if (userExists) return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
    if (emailExists) return res.status(400).json({ message: "El correo electrónico ya está registrado" });
    if (dniExists) return res.status(400).json({ message: "El DNI ya está registrado" });

    // 4. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Crear el usuario (sin transacción)
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      status: "active"
    });

    // 6. Crear el perfil asociado (Person)
    const newPerson = await Person.create({
      firstName,
      lastName,
      sex,
      email,
      dni,
      age,
      phone,
      grade: role === 'estudiante' ? grade : undefined,
      specialty: role === 'profesor' ? specialty : undefined,
      institution: role === 'externo' ? institution : undefined,
      associatedRole: role,
      userRef: newUser._id,
      status: "active"
    });

    // 7. Actualizar la referencia en User
    newUser.profileRef = newPerson._id;
    await newUser.save();

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: newUser._id,
      personId: newPerson._id,
      role: newUser.role
    });

  } catch (error) {
    console.error("Error en registro:", error);

    // 8. Si algo falla, eliminar registros creados (rollback manual)
    if (newUser) await User.deleteOne({ _id: newUser._id });
    if (newPerson) await Person.deleteOne({ _id: newPerson._id });

    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};


// Función para cambiar estado (activar/desactivar)
const changeStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  try {
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    // Iniciar transacción para actualizar ambos estados
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Actualizar estado del User
      const user = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true, session }
      );

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Si es estudiante, actualizar también su estado
      if (user.studentRef) {
        await Student.findByIdAndUpdate(
          user.studentRef,
          { status },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return res.json({ 
        message: 'Estado actualizado correctamente',
        userId: user._id,
        newStatus: status
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { 
  loginUser, 
  registerUser,
  changeStatus
};




/*
// Función para registrar un nuevo usuario
const registerUser = async (req, res) => {
  // Extraer el rol de la URL
  // Extraer el rol de la URL de manera más robusta
  const urlParts = req.originalUrl.split('/');
  const registrationType = urlParts[urlParts.indexOf('register') + 1];

  const roleMap = {
    'alumno': 'estudiante',
    'profesor': 'profesor',
    'externo': 'externo'
  };
  
  const role = roleMap[registrationType];
  if (!role) {
    return res.status(400).json({ 
      message: 'Ruta de registro no válida',
      details: `Rutas válidas: /register/alumno, /register/profesor, /register/externo`,
      receivedPath: req.originalUrl
    });
  }

  const {
    username,
    password,
    firstName,
    lastName,
    sex,
    email,
    dni,
    age,
    phone,
    // Campos específicos
    grade,
    specialty,
    institution
  } = req.body;

  try {
    // Validar campos comunes obligatorios
    const commonFields = [firstName, lastName, sex, email, dni, age, phone];
    if (commonFields.some(field => !field)) {
      return res.status(400).json({ message: 'Todos los campos personales son obligatorios' });
    }

    // Validar campos específicos según rol
    if (role === 'estudiante' && !grade) {
      return res.status(400).json({ message: 'El campo grado es obligatorio para estudiantes' });
    }
    if (role === 'profesor' && !specialty) {
      return res.status(400).json({ message: 'El campo especialidad es obligatorio para profesores' });
    }
    if (role === 'externo' && !institution) {
      return res.status(400).json({ message: 'El campo institución es obligatorio para externos' });
    }

    // Verificar unicidad de username, email y dni
    const [existingUser, existingEmail, existingDni] = await Promise.all([
      User.findOne({ username }),
      Person.findOne({ email }),
      Person.findOne({ dni })
    ]);

    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }
    if (existingEmail) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }
    if (existingDni) {
      return res.status(400).json({ message: 'El DNI ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Iniciar transacción
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Crear usuario
      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        status: 'active'
      });

      const savedUser = await newUser.save({ session });

      // Crear perfil de persona
      const personData = {
        firstName,
        lastName,
        sex,
        email,
        dni,
        age,
        phone,
        associatedRole: role,
        userRef: savedUser._id,
        status: 'active'
      };

      // Añadir campo específico según rol
      if (role === 'estudiante') personData.grade = grade;
      if (role === 'profesor') personData.specialty = specialty;
      if (role === 'externo') personData.institution = institution;

      const newPerson = new Person(personData);
      const savedPerson = await newPerson.save({ session });

      // Actualizar referencia en User
      savedUser.profileRef = savedPerson._id;
      await savedUser.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: 'Usuario registrado exitosamente',
        userId: savedUser._id,
        personId: savedPerson._id,
        role: savedUser.role
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ 
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
*/