const express = require('express');
const authController = require('../../controllers/auth/authController');
const authMiddleware = require('../../middlewares/authMiddleware');
const router = express.Router();
//login
router.post('/login/estudiante', authController.loginUser);  // Login de alumno
router.post('/login/profesor', authController.loginUser);  // Login de alumno
router.post('/login/externo', authController.loginUser);  // Login de alumno
router.post('/login/admin', authController.loginUser);  // Login de alumno
//register
/*
router.post('/register/estudiante',authMiddleware, authController.registerUser);  // Registro de alumno
router.post('/register/profesor', authMiddleware,authController.registerUser);  // Registro de alumno
router.post('/register/externo', authController.registerUser);  // Registro de alumno
*/
router.post('/register/estudiante', authMiddleware, authController.validateRegistrationPermissions, authController.registerUser);
router.post('/register/profesor', authMiddleware, authController.validateRegistrationPermissions, authController.registerUser);
router.post('/register/externo', authMiddleware, authController.validateRegistrationPermissions, authController.registerUser);
router.post('/register/admin', authMiddleware, authController.validateRegistrationPermissions, authController.registerUser);
// Ruta opcional para consultar permisos
router.get('/permissions', authMiddleware, authController.getUserPermissions);

/*
// Ruta protegida con authMiddleware (ejemplo) obtener usuarios
router.get('/users', authMiddleware, authController.getUsers);
router.get('/users/:id', authMiddleware, authController.getUserById); // Obtener usuario por ID
router.put('/users/:id', authMiddleware, authController.updateUser); // Actualizar usuario por ID
router.delete('/users/:id', authMiddleware, authController.deleteUser); // Eliminar usuario por ID
//reset password
router.put('/users/:id/password', authMiddleware,authController.changePassword);
*/

//nEWS
// Rutas para listado (solo profesor y admin)
router.get('/users', authMiddleware, authController.validateListAccess, authController.getUsers);
// Rutas para perfil propio (todos los roles)
router.get('/profile/me', authMiddleware, authController.getMyProfile);
// Rutas para acceso a usuario específico
router.get('/users/:id', authMiddleware, authController.validateUserAccess, authController.getUserById);
// Rutas para modificación
router.put('/users/:id', authMiddleware, authController.validateModificationAccess, authController.updateUser);
router.delete('/users/:id', authMiddleware, authController.validateModificationAccess, authController.deleteUser);
router.patch('/users/:id/password', authMiddleware, authController.validateModificationAccess, authController.changePassword);

module.exports = router;
