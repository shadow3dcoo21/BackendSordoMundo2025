const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware');

console.log(typeof authMiddleware);  // Debe imprimir 'function' si está importado correctamente

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
    res.json({
      message: 'Perfil del usuario',
      user: req.user,  // Aquí deberías tener los datos del usuario extraídos del token
      
    });
  });

module.exports = router;