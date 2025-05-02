const express = require('express');
const authController = require('../../controllers/auth/authController');
const authMiddleware = require('../../middlewares/authMiddleware');
const router = express.Router();
//login
router.post('/login/estudiante', authController.loginUser);  // Login de alumno
router.post('/login/profesor', authController.loginUser);  // Login de alumno
router.post('/login/externo', authController.loginUser);  // Login de alumno
//register
router.post('/register/estudiante',authMiddleware, authController.registerUser);  // Registro de alumno
router.post('/register/profesor', authController.registerUser);  // Registro de alumno
router.post('/register/externo', authController.registerUser);  // Registro de alumno

// Ruta protegida con authMiddleware (ejemplo) obtener usuarios
router.get('/users', authMiddleware, authController.getUsers);
router.get('/users/:id', authMiddleware, authController.getUserById); // Obtener usuario por ID
router.put('/users/:id', authMiddleware, authController.updateUser); // Actualizar usuario por ID
router.delete('/users/:id', authMiddleware, authController.deleteUser); // Eliminar usuario por ID
//reset password
router.put('/users/:id/password', authMiddleware,authController.changePassword);

module.exports = router;
