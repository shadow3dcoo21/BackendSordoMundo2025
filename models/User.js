const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'estudiante',  // Asignar un rol por defecto
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  sex: {
    type: String,
    enum: ['M', 'F', 'Otro'],
    required: true,
  },
  email: {
    type: String,
    unique: true,  // El correo electrónico debe ser único si se proporciona
    match: [/\S+@\S+\.\S+/, 'Por favor ingrese un correo válido'],
  },
});

module.exports = mongoose.model('User', userSchema);
