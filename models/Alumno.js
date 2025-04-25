// models/Alumno.js

const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
nombres: {
    type: String,
    required: true
},
apellidos: {
    type: String,
    required: true
},
sexo: {
    type: String,
    enum: ['Masculino', 'Femenino', 'Otro'],  // Puedes definir opciones para el campo Sexo
    required: true
}
});

const Alumno = mongoose.model('Alumno', alumnoSchema);

module.exports = Alumno;
