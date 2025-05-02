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
    console.log('aqui entra normal : ',roleFromUrl);

    // Verificar si el usuario existe y está activo
    const user = await User.findOne({ username, status: 'active' }).populate('profileRef');
    if (!user) {
      return res.status(404).json(console.log('problemas '),{ 
        message: 'Usuario no encontrado o cuenta inactiva' 
        
      });
    }

    // Validaciones específicas por rol
    switch(user.role) {
      case 'estudiante':
        console.log('rol alumno entro normal');
        // Solo requiere username
        if (!username) {
          return res.status(400).json({ message: 'El nombre de usuario es obligatorio' });
        }
        if (roleFromUrl !== 'estudiante') {
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
  let newUser;
  let newPerson;

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

// Función para listar usuarios con sus perfiles
const getUsers = async (req, res) => {
  try {
    // 1. Verificar si el usuario tiene permisos (opcional, dependiendo de tus requerimientos)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ message: "No autorizado" });
    // }

    // 2. Obtener todos los usuarios con sus perfiles asociados usando populate
    const users = await User.find({})
      .select('-password') // Excluir la contraseña
      .populate({
        path: 'profileRef',
        select: '-userRef -_id -createdAt -updatedAt -__v' // Excluir campos innecesarios
      })
      .lean(); // Convertir a objeto JavaScript simple

    // 3. Formatear la respuesta combinando datos de User y Person
    const formattedUsers = users.map(user => {
      const { profileRef, ...userData } = user;
      return {
        ...userData,
        ...profileRef
      };
    });

    return res.status(200).json({
      message: "Usuarios obtenidos exitosamente",
      count: formattedUsers.length,
      users: formattedUsers
    });

  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};

// Controlador para obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID tenga un formato correcto
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    // Buscar usuario con populate
    const user = await User.findById(id)
      .select('-password')
      .populate({
        path: 'profileRef',
        select: '-userRef -_id -createdAt -updatedAt -__v'
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Combinar datos del usuario y su perfil
    const formattedUser = {
      ...user,
      ...user.profileRef
    };
    delete formattedUser.profileRef;

    return res.status(200).json({
      message: "Usuario obtenido exitosamente",
      user: formattedUser
    });

  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  let userData = {};
  let personData = {};

  try {
    // 1. Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // 2. Buscar usuario con su perfil
    const existingUser = await User.findById(id)
      .populate('profileRef')
      .lean();
      
    if (!existingUser || !existingUser.profileRef) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 3. Separar datos de User y Person
    const { username, password, ...rest } = req.body;
    
    // Datos para User
    if (username) userData.username = username;
    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    // Datos para Person
    personData = rest;
    const role = existingUser.role;

    // 4. Validaciones de unicidad
    if (username) {
      const userExists = await User.findOne({ username, _id: { $ne: id } });
      if (userExists) return res.status(400).json({ message: "Nombre de usuario en uso" });
    }

    if (personData.email) {
      const emailExists = await Person.findOne({ 
        email: personData.email, 
        _id: { $ne: existingUser.profileRef._id } 
      });
      if (emailExists) return res.status(400).json({ message: "Email ya registrado" });
    }

    if (personData.dni) {
      const dniExists = await Person.findOne({ 
        dni: personData.dni, 
        _id: { $ne: existingUser.profileRef._id } 
      });
      if (dniExists) return res.status(400).json({ message: "DNI ya registrado" });
    }

    // 5. Validaciones por rol
    if (role === 'estudiante' && personData.grade !== undefined && !personData.grade) {
      return res.status(400).json({ message: "Grado es requerido para estudiantes" });
    }
    
    if (role === 'profesor' && personData.specialty !== undefined && !personData.specialty) {
      return res.status(400).json({ message: "Especialidad es requerida para profesores" });
    }
    
    if (role === 'externo' && personData.institution !== undefined && !personData.institution) {
      return res.status(400).json({ message: "Institución es requerida para externos" });
    }

    // 6. Actualizar documentos
    const updateOperations = [];
    
    if (Object.keys(userData).length > 0) {
      updateOperations.push(
        User.findByIdAndUpdate(id, { $set: userData }, { new: true })
      );
    }
    
    if (Object.keys(personData).length > 0) {
      updateOperations.push(
        Person.findByIdAndUpdate(
          existingUser.profileRef._id,
          { $set: personData },
          { new: true }
        )
      );
    }

    const [updatedUser, updatedPerson] = await Promise.all(updateOperations);

    // 7. Obtener y formatear respuesta
    const finalUser = await User.findById(id)
      .select('-password')
      .populate({
        path: 'profileRef',
        select: '-userRef -_id -createdAt -updatedAt -__v'
      })
      .lean();

    const formattedUser = {
      ...finalUser,
      ...finalUser.profileRef
    };
    delete formattedUser.profileRef;

    return res.status(200).json({
      message: "Usuario actualizado exitosamente",
      user: formattedUser
    });

  } catch (error) {
    console.error("Error en actualización:", error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    // 2. Buscar usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 3. Eliminar perfil primero
    const deletedPerson = await Person.findOneAndDelete({ userRef: id });
    
    // 4. Eliminar usuario
    const deletedUser = await User.findByIdAndDelete(id);

    // 5. Verificar eliminación completa
    if (!deletedPerson || !deletedUser) {
      // Rollback manual si falló alguna eliminación
      if (deletedPerson && !deletedUser) {
        await Person.create({ _id: deletedPerson._id, ...deletedPerson.toObject() });
      }
      return res.status(500).json({ message: "Error al eliminar los registros" });
    }

    return res.status(200).json({
      message: "Usuario y perfil eliminados exitosamente",
      deletedUserId: id
    });

  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};
//Reset password
const changePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  try {
    // 1. Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    // 2. Buscar usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 3. Validar campos obligatorios
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    // 4. Validar coincidencia de nuevas contraseñas
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Las nuevas contraseñas no coinciden" });
    }

    // 5. Validar contraseña anterior
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Contraseña actual incorrecta" });
    }

    // 6. Validar fortaleza de nueva contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "La nueva contraseña debe contener:",
        requirements: {
          minLength: 8,
          uppercase: true,
          lowercase: true,
          number: true,
          specialChar: true
        }
      });
    }

    // 7. Hashear y actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // 8. Opcional: Invalidate tokens anteriores si usas JWT

    return res.status(200).json({
      message: "Contraseña actualizada exitosamente",
      userId: user._id,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({
      message: "Error en el servidor",
      error: error.message
    });
  }
};

module.exports = { 
  changePassword ,
  deleteUser,
  updateUser,
  getUserById,
  getUsers,
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