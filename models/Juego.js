const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const juegoSchema = new Schema({
  alumno: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // Referencia al modelo Alumno
    required: true
  },
  palabra: {
    type: String,
    required: true  // Campo requerido que puede variar según el juego
  },
  opciones: [
    {
      opcion: {
        type: String,
        required: true  // Nombre de la opción (ej. "Primera palabra", "Segunda palabra")
      },
      hora: {
        type: String,
        required: true  // Se asegura que la hora esté dentro de opciones
      },
      intentos: {
        type: Number,
        required: true  // Número de intentos realizados
      },
      fallidos: {
        type: Number,
        required: true  // Número de intentos fallidos
      },
      letras: {
        type: [String],  // Cambiado a array de strings
        required: true  // Letras utilizadas, ahora se guardarán como un array
      }
    }
  ]
});

const Juego = mongoose.model('Juego', juegoSchema);

module.exports = Juego;
