
//////////////////////////////////////////////////////////////
// Funcion para ordenar y renombrar archivos elimina Webp
//////////////////////////////////////////////////////////////

// Función para procesar cada carpeta de palabras
const fs = require('fs').promises;
const path = require('path');

const procesarCarpeta = async (carpeta) => {
    try {
      const archivos = await fs.readdir(carpeta); // Leer los archivos de la carpeta
  
      for (const archivo of archivos) {
        const rutaArchivo = path.join(carpeta, archivo);
        const extension = path.extname(archivo).toLowerCase();
        const nombreBase = path.basename(archivo, extension);
        const nombreCarpeta = path.basename(carpeta);
  
        if (extension === '.gif') {
          // Caso 1: Gif con el mismo nombre de la carpeta
          if (nombreBase.toLowerCase() === nombreCarpeta.toLowerCase()) {
            const nuevoNombre = `${nombreCarpeta.charAt(0).toUpperCase()}${nombreCarpeta.slice(1).toLowerCase()}.gif`;
            const nuevaRuta = path.join(carpeta, nuevoNombre);
            if (rutaArchivo !== nuevaRuta) {
              await fs.rename(rutaArchivo, nuevaRuta);
              console.log(`Renombrado: ${rutaArchivo} -> ${nuevaRuta}`);
            }
          }
          // Caso 2: Gif llamado "deletreo"
          else if (nombreBase.toLowerCase() === 'deletreo') {
            const nuevoNombre = `deletreo${nombreCarpeta.toLowerCase()}.gif`;
            const nuevaRuta = path.join(carpeta, nuevoNombre);
            if (rutaArchivo !== nuevaRuta) {
              await fs.rename(rutaArchivo, nuevaRuta);
              console.log(`Renombrado: ${rutaArchivo} -> ${nuevaRuta}`);
            }
          }
        } else if (extension === '.png') {
          // Caso 3: PNG llamado "image"
          if (nombreBase.toLowerCase() === 'image') {
            const nuevoNombre = `image${nombreCarpeta.toLowerCase()}.png`;
            const nuevaRuta = path.join(carpeta, nuevoNombre);
            if (rutaArchivo !== nuevaRuta) {
              await fs.rename(rutaArchivo, nuevaRuta);
              console.log(`Renombrado: ${rutaArchivo} -> ${nuevaRuta}`);
            }
          }
        } else if (extension === '.webp') {
          // Caso 4: Eliminar archivos .webp
          await fs.unlink(rutaArchivo);
          console.log(`Eliminado archivo: ${rutaArchivo}`);
        }
      }
    } catch (error) {
      console.error(`Error procesando la carpeta ${carpeta}:`, error);
    }
  };
  
  // Función para recorrer todas las carpetas
  const procesarCarpetas = async (carpetaRaiz) => {
    try {
      const carpetas = await fs.readdir(carpetaRaiz); // Leer las carpetas (A-N)
  
      for (const letraCarpeta of carpetas) {
        const rutaLetra = path.join(carpetaRaiz, letraCarpeta);
        const subCarpetas = await fs.readdir(rutaLetra); // Leer las subcarpetas (palabras)
  
        for (const subCarpeta of subCarpetas) {
          const rutaSubCarpeta = path.join(rutaLetra, subCarpeta);
          await procesarCarpeta(rutaSubCarpeta); // Procesar cada carpeta de palabra
        }
      }
      console.log('Todas las carpetas han sido procesadas.');
    } catch (error) {
      console.error('Error procesando las carpetas:', error);
    }
  };
  
  // Conexión a MongoDB y ejecución del proceso
  const iniciarProceso = async () => {
    try {
      const carpetaRaiz = 'D:/Proyectos/SordoMundo/Datos/Palabras'; // Carpeta raíz donde están las letras A-N
  
      // Ejecutar el proceso de procesamiento de carpetas
      await procesarCarpetas(carpetaRaiz);
    } catch (error) {
      console.error('Error procesando los archivos:', error);
    }
  };
  
  // Ruta para iniciar el procesamiento de carpetas manualmente
  app.get('/procesar', async (req, res) => {
    await iniciarProceso();
    res.send('Procesamiento de carpetas completado.');
  });
  