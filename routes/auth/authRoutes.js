const express = require('express');
const authController = require('../../controllers/auth/authController');

const router = express.Router();
//login
router.post('/login/alumno', authController.loginUser);  // Login de alumno
router.post('/login/profesor', authController.loginUser);  // Login de alumno
router.post('/login/externo', authController.loginUser);  // Login de alumno
//register
router.post('/register/alumno', authController.registerUser);  // Registro de alumno
router.post('/register/profesor', authController.registerUser);  // Registro de alumno
router.post('/register/externo', authController.registerUser);  // Registro de alumno
//reset password
router.post('/resetpassword/id:', (req, res) => {
    res.json({ message: 'Reset password alumno' });
});
module.exports = router;
