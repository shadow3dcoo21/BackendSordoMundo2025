const express = require('express');
const authMiddleware = require('../../middlewares/authMiddleware');
const Presentar = require('../../models/Presentar');
const Juego = require('../../models/Juego');
const GameModel = require('../../models/Games/GamesModels');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { deleteFile } = require('../../util/cloudflareDelete');
const { uploadFile } = require('../../util/s3');
const mongoose = require('mongoose');

// ✅ Usar la instancia global en lugar de importar
// const { io } = require('../../server'); ❌ Removido para evitar importación circular

// Asegura que la carpeta 'temp' exista
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Definimos el almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
console.log("hola", typeof authMiddleware);

const router = express.Router();

// ✅ Función helper para obtener io
const getIO = () => {
  if (global.io) {
    return global.io;
  }
  console.warn('⚠️ Socket.io no está disponible globalmente');
  return null;
};

// Endpoint GET para obtener palabras
router.get('/words', authMiddleware, async (req, res) => {
  try {
    const presentaciones = await Presentar.find();
    res.json(presentaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los datos de presentación' });
  }
});

// Endpoint POST para crear nueva entrada
router.post('/CreateWords', authMiddleware, upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'video0', maxCount: 1 },
  { name: 'video1', maxCount: 1 },
  { name: 'video2', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const titulos = [
      { titulo: req.body['titulos[0].titulo'] },
      { titulo: req.body['titulos[1].titulo'] },
      { titulo: req.body['titulos[2].titulo'] }
    ];
    
    const videoFiles = [
      req.files['video0']?.[0],
      req.files['video1']?.[0],
      req.files['video2']?.[0]
    ];

    if (!req.files?.imagen) {
      return res.status(400).json({ error: 'La imagen principal es requerida' });
    }

    // Subir imagen principal
    const imagenFile = req.files.imagen[0];
    const imagenExtension = path.extname(imagenFile.originalname);
    const imagenNombre = `${nombre.replace(/\s+/g, '_')}_imagen${imagenExtension}`;
    const imagenUrl = await uploadFile(
      imagenNombre,
      imagenFile.buffer,
      `image/${imagenExtension.substring(1)}`
    );

    // Subir videos y construir titulos
    const titulosConVideos = await Promise.all(
      titulos.map(async (titulo, index) => {
        const videoFile = videoFiles[index];
        if (!videoFile) {
          throw new Error(`Video ${index + 1} es requerido`);
        }

        const videoExtension = path.extname(videoFile.originalname);
        const videoNombre = `${nombre.replace(/\s+/g, '_')}_video${index + 1}${videoExtension}`;
        const videoUrl = await uploadFile(
          videoNombre,
          videoFile.buffer,
          `video/${videoExtension.substring(1)}`
        );

        return {
          titulo: titulo.titulo,
          video: videoUrl
        };
      })
    );

    // Crear nuevo documento en MongoDB
    const nuevaPresentacion = new Presentar({
      imagen: imagenUrl,
      nombre,
      titulos: titulosConVideos
    });

    await nuevaPresentacion.save();

    // ✅ MEJORADO: Emitir evento WebSocket con verificación
    const io = getIO();
    if (io) {
      const socketData = {
        action: 'create',
        data: nuevaPresentacion.toObject(),
        timestamp: new Date().toISOString(),
        message: `Nueva palabra "${nombre}" agregada`,
        user: req.user?.id || 'unknown'
      };

      // Emitir a todos los clientes conectados
      io.emit('new_word', socketData);
      
      // También emitir a la sala específica
      io.to('words_updates').emit('word_created', socketData);

      console.log(`📡 WebSocket: Emitido evento 'new_word' para: ${nombre}`);
      console.log(`👥 Clientes conectados: ${io.engine.clientsCount}`);
      console.log(`🏠 Salas activas: ${Array.from(io.sockets.adapter.rooms.keys())}`);

      res.status(201).json({
        message: 'Elemento creado exitosamente',
        data: nuevaPresentacion,
        socketEmitted: true,
        connectedClients: io.engine.clientsCount,
        activeRooms: Array.from(io.sockets.adapter.rooms.keys())
      });
    } else {
      console.warn('⚠️ Socket.io no disponible, elemento creado sin notificación WebSocket');
      res.status(201).json({
        message: 'Elemento creado exitosamente (sin WebSocket)',
        data: nuevaPresentacion,
        socketEmitted: false
      });
    }

  } catch (error) {
    console.error('Error:', error);
    
    // ✅ Emitir error también por WebSocket si está disponible
    const io = getIO();
    if (io) {
      io.emit('word_error', {
        action: 'create_error',
        error: error.message,
        timestamp: new Date().toISOString(),
        user: req.user?.id || 'unknown'
      });
    }

    res.status(500).json({
      error: 'Error al crear el elemento',
      detalle: error.message
    });
  }
});

// ✅ MEJORADO: Endpoint para probar emisión manual de WebSocket
router.post('/test-socket', authMiddleware, async (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.status(500).json({ 
        error: 'Socket.io no está disponible',
        socketAvailable: false
      });
    }

    const testData = {
      message: 'Prueba de WebSocket desde ContentRoutes',
      timestamp: new Date().toISOString(),
      user: req.user.id,
      endpoint: '/api/content/test-socket'
    };

    // Emitir a todos los clientes
    io.emit('test_event', testData);
    
    // Emitir también a la sala específica
    io.to('words_updates').emit('test_room_event', testData);

    console.log(`🧪 Test WebSocket enviado por usuario: ${req.user.id}`);

    res.json({
      message: 'Evento de prueba enviado exitosamente',
      data: testData,
      connectedClients: io.engine.clientsCount,
      activeRooms: Array.from(io.sockets.adapter.rooms.keys()),
      socketAvailable: true
    });
  } catch (error) {
    console.error('Error en test-socket:', error);
    res.status(500).json({ 
      error: error.message,
      socketAvailable: false
    });
  }
});

// ✅ NUEVO: Endpoint para verificar estado de WebSocket
router.get('/socket-status', authMiddleware, async (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.json({
        socketAvailable: false,
        message: 'Socket.io no está disponible'
      });
    }

    const rooms = Array.from(io.sockets.adapter.rooms.keys());
    const sockets = Array.from(io.sockets.sockets.keys());

    res.json({
      socketAvailable: true,
      connectedClients: io.engine.clientsCount,
      activeRooms: rooms,
      socketIds: sockets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      socketAvailable: false
    });
  }
});

module.exports = router;

// Nueva ruta para obtener una presentación por nombre y aplicar un tipo específico de manipulación
router.get('/completar/:nombre/:tipo',authMiddleware, async (req, res) => {
  try {
    const { nombre, tipo } = req.params;
    const presentacion = await Presentar.findOne({ nombre });

    if (presentacion) {
      let resultado;
      let letrasEliminadas;
      switch (tipo) {
        case 'incompleto1':
          [resultado, letrasEliminadas] = removeFirstLetter(presentacion.nombre);
          
          break;
        case 'incompleto2':
          [resultado, letrasEliminadas] = removeTwoRandomLettersWithUnderscore(presentacion.nombre);
          break;
        case 'incompletoTotal':
          [resultado, letrasEliminadas] = replaceAllWithUnderscores(presentacion.nombre);
          break;
        case 'letrasSeparadas':
          resultado = presentacion.nombre.split('');
          break;
        default:
          return res.status(400).json({ message: 'Tipo no válido' });
      }
      res.json({ nombreOriginal: presentacion.nombre, nombreManipulado: resultado, letrasEliminadas });
    } else {
      res.status(404).json({ message: 'No se encontró la presentación con ese nombre' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la presentación' });
  }
});


router.post('/registrardatoscomletar',authMiddleware, async (req, res) => {
  try {
    const { alumno, hora, palabra, opciones } = req.body;

    // Intenta encontrar el juego del alumno por el ID del alumno y la palabra
    const juegoExistente = await Juego.findOne({ alumno, palabra });

    if (juegoExistente) {
      // Si existe, actualiza el array de opciones
      juegoExistente.opciones.push(...opciones); // Agrega las nuevas opciones
      await juegoExistente.save();
      return res.status(200).json(juegoExistente);
    } else {
      // Si no existe, crea uno nuevo
      const nuevoJuego = new Juego({ alumno, hora, palabra, opciones });
      await nuevoJuego.save();
      return res.status(201).json(nuevoJuego);
    }
  } catch (error) {
    console.error('Error al guardar el juego:', error);
    res.status(500).send('Error al guardar el juego');
  }
});

module.exports = router;
 

router.get('/obtenerdatoscompletos', authMiddleware, async (req, res) => {
  try {
    const juegos = await Juego.find()
      .populate({
        path: 'alumno', // Pobla el User asociado al Juego
        select: '-password', // Excluye la contraseña del User
        populate: {
          path: 'profileRef', // Pobla el Person asociado al User
          model: 'Person' // Asegura que usa el modelo correcto
        }
      })
      .exec();

    res.status(200).json(juegos);
  } catch (error) {
    console.error('Error al obtener los juegos:', error);
    res.status(500).send('Error al recuperar los datos');
  }
});

router.get('/obtenerdatoscompletos/alumno/:alumnoId', authMiddleware, async (req, res) => {
  try {
    const { alumnoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(alumnoId)) { // <-- Ahora funciona
      return res.status(400).send("ID de alumno inválido");
    }

    const juegos = await Juego.find({ alumno: alumnoId })
      .populate({
        path: 'alumno',
        select: '-password',
        populate: { path: 'profileRef', model: 'Person' }
      })
      .exec();

    if (juegos.length === 0) {
      return res.status(404).send("No se encontraron juegos para este alumno");
    }

    res.status(200).json(juegos);
  } catch (error) {
    console.error('Error al obtener juegos por alumno:', error);
    res.status(500).send("Error interno del servidor");
  }
});



router.get('/obtenerdatoscompletos/juego/:juegoId', authMiddleware, async (req, res) => {
  try {
    const { juegoId } = req.params;
    
    const juego = await Juego.findById(juegoId)
      .populate({
        path: 'alumno',
        select: '-password',
        populate: { path: 'profileRef' }
      });

    if (!juego) return res.status(404).send("Juego no encontrado");
    
    res.status(200).json(juego);
  } catch (error) {
    console.error('Error al obtener juego por ID:', error);
    res.status(500).send("Error interno del servidor");
  }
});



// Función para remover la primera letra y reemplazarla por _
function removeFirstLetter(str) {
  if (str.length <= 1) return ['_', str]; // Si la longitud es 1 o menos, devuelve un solo guion bajo

  const letraEliminada = str.charAt(0);
  const resultado = '_' + str.substring(1);
  return [resultado, letraEliminada];
}

// Función para remover dos letras aleatorias y reemplazarlas por _
function removeTwoRandomLettersWithUnderscore(str) {
  if (str.length <= 2) return [str.substring(1), '']; // Si la longitud es 2 o menos, solo remueve la primera letra

  let chars = str.split('');
  let indexesToRemove = [];

  while (indexesToRemove.length < 2) {
    let randomIndex = Math.floor(Math.random() * (chars.length - 1)) + 1; // Evita la primera letra
    if (!indexesToRemove.includes(randomIndex)) {
      indexesToRemove.push(randomIndex);
    }
  }

  indexesToRemove.sort((a, b) => b - a); // Ordena en orden descendente para no cambiar índices al remover

  let letrasEliminadas = [];
  for (let index of indexesToRemove) {
    const letraEliminada = chars[index];
    letrasEliminadas.push(letraEliminada);
    chars.splice(index, 1, '_'); // Reemplaza la letra eliminada por _
  }

  return [chars.join(''), letrasEliminadas];
}

// Función para reemplazar todas las letras con _
function replaceAllWithUnderscores(str) {
  const letrasEliminadas = str.split('').reverse(); // Guarda todas las letras en un array de manera invertida
  const resultado = '_'.repeat(str.length); // Reemplaza todas las letras por guiones bajos
  return [resultado, letrasEliminadas];
}
function validateMissingLetter(letrasEliminadas, missingLetter) {
  return !letrasEliminadas.includes(missingLetter);
}


// Actualizar una presentación específica
// Actualizar una presentación específica
router.put('/UpdateWords/:id', authMiddleware, upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'titulos[0].video', maxCount: 1 },
  { name: 'titulos[1].video', maxCount: 1 },
  { name: 'titulos[2].video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    // Extraer los títulos del body
    const titulos = [
      { titulo: req.body['titulos[0].titulo'] },
      { titulo: req.body['titulos[1].titulo'] },
      { titulo: req.body['titulos[2].titulo'] }
    ];
    
    const imagenFile = req.files['imagen'] ? req.files['imagen'][0] : null;
    
    // Extraer los archivos de video
    const videoFiles = [
      req.files['titulos[0].video'] ? req.files['titulos[0].video'][0] : null,
      req.files['titulos[1].video'] ? req.files['titulos[1].video'][0] : null,
      req.files['titulos[2].video'] ? req.files['titulos[2].video'][0] : null
    ];

    // Obtener la presentación actual
    const presentacion = await Presentar.findById(id);
    if (!presentacion) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    // === Actualizar imagen ===
    let imagenUrl = presentacion.imagen;
    if (imagenFile) {
      const extension = path.extname(imagenFile.originalname);
      const nombreArchivo = `${nombre.replace(/\s+/g, '_')}_imagen${extension}`;
      imagenUrl = await uploadFile(nombreArchivo, imagenFile.buffer, `image/${extension.substring(1)}`);
    }

    // === Actualizar videos ===
    const nuevosTitulos = await Promise.all(
      titulos.map(async (tituloObj, index) => {
        const videoFile = videoFiles[index];
        let videoUrl = presentacion.titulos[index] ? presentacion.titulos[index].video : '';

        if (videoFile) {
          const extension = path.extname(videoFile.originalname);
          const nombreArchivo = `${nombre.replace(/\s+/g, '_')}_video${index + 1}${extension}`;
          videoUrl = await uploadFile(nombreArchivo, videoFile.buffer, `video/${extension.substring(1)}`);
        }

        return {
          titulo: tituloObj.titulo,
          video: videoUrl
        };
      })
    );

    // === Guardar en MongoDB ===
    const actualizado = await Presentar.findByIdAndUpdate(
      id,
      {
        imagen: imagenUrl,
        nombre,
        titulos: nuevosTitulos
      },
      { new: true }
    );

    res.status(200).json({ message: 'Presentación actualizada', data: actualizado });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
});
module.exports = router;



/*
// Endpoint POST para crear nueva entrada
router.post('/CreateWords', authMiddleware, upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'video0', maxCount: 1 },
  { name: 'video1', maxCount: 1 },
  { name: 'video2', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nombre } = req.body;
    // Extraer los títulos del body (ESTA PARTE FALTABA)
    const titulos = [
      { titulo: req.body['titulos[0].titulo'] },
      { titulo: req.body['titulos[1].titulo'] },
      { titulo: req.body['titulos[2].titulo'] }
    ];
    // Extraer los títulos del body
    const videoFiles = [
      req.files['video0']?.[0], // ✅
      req.files['video1']?.[0], // ✅
      req.files['video2']?.[0]  // ✅
    ];
    
   
    // Verificar archivos requeridos
    if (!req.files?.imagen) {
      return res.status(400).json({ error: 'La imagen principal es requerida' });
    }

    // Subir imagen principal
    const imagenFile = req.files.imagen[0];
    const imagenExtension = path.extname(imagenFile.originalname);
    const imagenNombre = `${nombre.replace(/\s+/g, '_')}_imagen${imagenExtension}`;
    const imagenUrl = await uploadFile(
      imagenNombre,
      imagenFile.buffer,
      `image/${imagenExtension.substring(1)}`
    );

    // Subir videos y construir titulos
    const titulosConVideos = await Promise.all(
      titulos.map(async (titulo, index) => {
        const videoFile = videoFiles[index];
        if (!videoFile) {
          throw new Error(`Video ${index + 1} es requerido`);
        }

        const videoExtension = path.extname(videoFile.originalname);
        const videoNombre = `${nombre.replace(/\s+/g, '_')}_video${index + 1}${videoExtension}`;
        const videoUrl = await uploadFile(
          videoNombre,
          videoFile.buffer,
          `video/${videoExtension.substring(1)}`
        );

        return {
          titulo: titulo.titulo,
          video: videoUrl
        };
      })
    );

    // Crear nuevo documento en MongoDB
    const nuevaPresentacion = new Presentar({
      imagen: imagenUrl,
      nombre,
      titulos: titulosConVideos
    });

    await nuevaPresentacion.save();

    // Emitir evento WebSocket a todos los clientes
    io.emit('new_word', {
      action: 'create',
      data: nuevaPresentacion.toObject() // Convertir a objeto plano
    });

    res.status(201).json({
      message: 'Elemento creado exitosamente',
      data: nuevaPresentacion
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error al crear el elemento',
      detalle: error.message
    });
  }
});

module.exports = router;
*/ 




// Endpoint DELETE para eliminar una entrada
router.delete('/DeleteWords/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Buscar el documento en MongoDB
    const presentacion = await Presentar.findById(id);
    if (!presentacion) {
      return res.status(404).json({ error: 'Elemento no encontrado' });
    }

    // 2. Eliminar archivos de Cloudflare
    const archivosAEliminar = [
      presentacion.imagen,
      ...presentacion.titulos.map(t => t.video)
    ];

    // Función para extraer el nombre del archivo de la URL
    const extraerNombreArchivo = (url) => {
      const base = 'https://pub-2555519d15694f098bf1a74e67d4d0e1.r2.dev/';
      return url.replace(base, '');
    };

    // Eliminar todos los archivos relacionados
    await Promise.all(
      archivosAEliminar.map(async (url) => {
        if (url) {
          const nombreArchivo = extraerNombreArchivo(url);
          await deleteFile(nombreArchivo); // Asumiendo que tienes una función deleteFile
        }
      })
    );

    // 3. Eliminar el documento de MongoDB
    await Presentar.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Elemento eliminado exitosamente',
      data: {
        deletedId: id,
        deletedFiles: archivosAEliminar
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error al eliminar el elemento',
      detalle: error.message
    });
  }
});



router.post('/CreateGame', authMiddleware, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description, iframe, difficulty, uploadedBy } = req.body;
    
    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({ error: 'El nombre del juego es requerido' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'La imagen de portada es requerida' });
    }

    // Subir imagen a Cloudflare
    const coverImageFile = req.file;
    const imageExtension = path.extname(coverImageFile.originalname);
    const imageName = `${name.replace(/\s+/g, '_')}_cover${imageExtension}`;
    const imageUrl = await uploadFile(
      imageName,
      coverImageFile.buffer,
      `image/${imageExtension.substring(1)}`
    );

    // Crear objeto del juego
    const newGame = new GameModel({
      name,
      description: description || '',
      coverImage: imageUrl,
      iframe: iframe || '',
      difficulty: difficulty || 'Medium',
      uploadedBy: uploadedBy ? JSON.parse(uploadedBy) : []
    });

    // Guardar en MongoDB
    await newGame.save();

    res.status(201).json({
      message: 'Juego creado exitosamente',
      data: newGame
    });

  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      error: 'Error al crear el juego',
      detalle: error.message
    });
  }
});


// Obtener todos los juegos con filtros
router.get('/games', async (req, res) => {
  try {
    const { difficulty, sort, fields, page = 1, limit = 10 } = req.query;
    
    // Construir query
    const query = {};
    if (difficulty) query.difficulty = difficulty;

    // Ejecutar consulta
    const result = await GameModel.find(query)
      .sort(sort ? sort.split(',').join(' ') : '-createdAt')
      .select(fields ? fields.split(',').join(' ') : '-__v')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Obtener total de documentos
    const total = await GameModel.countDocuments(query);

    res.status(200).json({
      success: true,
      count: result.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo juegos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los juegos',
      detalle: error.message
    });
  }
});



// Obtener un juego por ID
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'ID inválido' 
      });
    }

    const game = await GameModel.findById(id).lean();

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Juego no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: game
    });

  } catch (error) {
    console.error('Error obteniendo juego:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el juego',
      detalle: error.message
    });
  }
});



router.delete('/games/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de juego inválido'
      });
    }

    // Buscar y eliminar
    const deletedGame = await GameModel.findByIdAndDelete(id);

    if (!deletedGame) {
      return res.status(404).json({
        success: false,
        error: 'Juego no encontrado'
      });
    }

    // Opcional: Eliminar imagen de Cloudflare aquí si es necesario
    // await deleteFileFromCloudflare(deletedGame.coverImage);

    res.status(200).json({
      success: true,
      message: 'Juego eliminado exitosamente',
      data: deletedGame
    });

  } catch (error) {
    console.error('Error eliminando juego:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el juego',
      detalle: error.message
    });
  }
});


router.put('/games/:id', authMiddleware, upload.single('coverImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, iframe, difficulty, uploadedBy } = req.body;

    // Validar ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de juego inválido'
      });
    }

    // Buscar juego existente
    const existingGame = await GameModel.findById(id);
    if (!existingGame) {
      return res.status(404).json({
        success: false,
        error: 'Juego no encontrado'
      });
    }

    // Procesar nueva imagen si existe
    let imageUrl = existingGame.coverImage;
    if (req.file) {
      const coverImageFile = req.file;
      const imageExtension = path.extname(coverImageFile.originalname);
      const imageName = `${name.replace(/\s+/g, '_')}_cover${imageExtension}`;
      imageUrl = await uploadFile(
        imageName,
        coverImageFile.buffer,
        `image/${imageExtension.substring(1)}`
      );
    }

    // Crear objeto actualizado
    const updateData = {
      name: name || existingGame.name,
      description: description || existingGame.description,
      coverImage: imageUrl,
      iframe: iframe || existingGame.iframe,
      difficulty: difficulty || existingGame.difficulty,
      uploadedBy: uploadedBy ? JSON.parse(uploadedBy) : existingGame.uploadedBy
    };

    // Actualizar y devolver nuevo documento
    const updatedGame = await GameModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Juego actualizado exitosamente',
      data: updatedGame
    });

  } catch (error) {
    console.error('Error actualizando juego:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el juego',
      detalle: error.message
    });
  }
});