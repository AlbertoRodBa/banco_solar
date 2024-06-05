const express = require('express');
const { getUsuarios, setUsuario, updateUsuario, deleteUsuario, insertarTransferencia, getTransferencias } = require('./db/db');
const app = express();

app.listen(3000, () => console.log("La aplicación está escuchando en el puerto 3000"));
app.use(express.json()); 

app.get("/", (req, res) => { 
   res.sendFile(__dirname + "/index.html");
});


// GET usuarios
app.get('/usuarios', async (req, res) => {
  try {
      const usuarios = await getUsuarios();
      res.send(usuarios);
  } catch (error) {
      res.statusCode = 500;
      res.json({ error: 'Algo salió mal, inténtelo más tarde' });
  }
});

// POST usuario
app.post("/usuario", async (req, res) => {
  const payload = req.body;

  try {
    const nuevoUsuario = await setUsuario(payload);
    res.statusCode = 201;
    res.json(nuevoUsuario);
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: "Algo ha salido mal, inténtelo más tarde" });
  }
});

// PUT usuario
app.put("/usuario", async (req, res) => {
  const { id } = req.query;
  const payload = req.body;
  payload.id = id;

  try {
    const usuarioActualizado = await updateUsuario(payload);
    res.statusCode = 200;
    res.json(usuarioActualizado);
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: "Algo ha salido mal, inténtelo más tarde" });
  }
});

// DELETE usuario
app.delete("/usuario", async (req, res) => {
  const { id } = req.query;

  try {
    await deleteUsuario({ id });
    res.statusCode = 204;
    res.send(); // Estado 204 para indicar que se ha eliminado el usuario
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: 'Ocurrió un error al intentar eliminar el usuario.' });
  }
});



// POST transferencia
app.post("/transferencia", async (req, res) => {
  const payload = req.body;

  try {
      const transferencia = await insertarTransferencia(payload);
      res.json(transferencia);
  } catch (error) {
      res.statusCode = 500;
      res.json({ error: 'Ocurrió un error al intentar realizar la transferencia.' });
  }
});

// GET transferencias
app.get("/transferencias", async (req, res) => {
  try {
    const transferencias = await getTransferencias();
    res.json(transferencias);
  } catch (error) {
    res.statusCode = 500;
    res.json({ error: 'Ocurrió un error en la base de datos.' });
  }
});
