const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  // Datos básicos (comunes a todos)
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  sex: {
    type: String,
    enum: ['M', 'F', 'Otro'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Por favor ingrese un correo válido']
  },
  dni: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 5,
    max: 120
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Campos específicos por rol
  grade: {
    type: String,
    required: function() { return this.associatedRole === 'estudiante'; },
    trim: true
  },
  specialty: {
    type: String,
    required: function() { return this.associatedRole === 'profesor'; },
    trim: true
  },
  institution: {
    type: String,
    required: function() { return this.associatedRole === 'externo'; },
    trim: true
  },
  
  // Relación y metadatos
  associatedRole: {
    type: String,
    enum: ['estudiante', 'profesor', 'externo'],
    required: true
  },
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true
  }
}, { timestamps: true });

// Índices para mejor performance
personSchema.index({ dni: 1 }, { unique: true });
personSchema.index({ email: 1 }, { unique: true });
personSchema.index({ userRef: 1 }, { unique: true });

module.exports = mongoose.model('Person', personSchema);