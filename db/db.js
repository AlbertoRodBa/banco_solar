const { Pool } = require('pg');

const config = {
  host: process.env.HOST,
  user: process.env.USERDB,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
};

const pool = new Pool(config);

const getUsuarios = async () => {
  const text = "SELECT * FROM usuarios";
  const response = await pool.query(text);
  return response.rows;
}

const setUsuario = async (payload) => {
  const text = "INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *";
  const values = [payload.nombre, payload.balance];
  const result = await pool.query(text, values);
  return result.rows[0];
}

const updateUsuario = async (payload) => {
  const text = "UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *";
  const values = [payload.nombre, payload.balance, payload.id];
  const result = await pool.query(text, values);
  return result.rows[0];
}

const deleteUsuario = async (payload) => {
  const text = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
  const values = [payload.id];
  const result = await pool.query(text, values);
  return result.rows[0];
}

const insertarTransferencia = async (payload) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");



    // Verificar si el emisor es un nombre y obtener el ID
    let idEmisor = payload.emisor;
    if (isNaN(idEmisor)) {
      const idEmisorQuery = "SELECT id FROM usuarios WHERE nombre = $1";
      const emisorValues = [payload.emisor];
      const emisorResult = await client.query(idEmisorQuery, emisorValues);
      if (emisorResult.rows.length === 0) {
        throw new Error("Emisor no encontrado");
      }
      idEmisor = emisorResult.rows[0].id;
    }

    console.log("ID del emisor:", idEmisor); 

    // Verificar si el receptor es un nombre y obtener el ID
    let idReceptor = payload.receptor;
    if (isNaN(idReceptor)) {
      const idReceptorQuery = "SELECT id FROM usuarios WHERE nombre = $1";
      const receptorValues = [payload.receptor];
      const receptorResult = await client.query(idReceptorQuery, receptorValues);
      if (receptorResult.rows.length === 0) {
        throw new Error("Receptor no encontrado");
      }
      idReceptor = receptorResult.rows[0].id;
    }

    console.log("ID receptor:", idReceptor); 


    // Descontar balance Emisor
    const descontar = "UPDATE usuarios SET balance = balance - $1 WHERE id = $2";
    const valuesDescontar = [payload.monto, idEmisor];
    await client.query(descontar, valuesDescontar);

    // Aumentar balance Receptor
    const aumentar = "UPDATE usuarios SET balance = balance + $1 WHERE id = $2";
    const valuesAumentar = [payload.monto, idReceptor];
    await client.query(aumentar, valuesAumentar);

    // Insertar transferencia
    const insertar = "INSERT INTO transferencias(emisor, receptor, monto, fecha) VALUES($1, $2, $3, $4) RETURNING *";
    const insertarValues = [idEmisor, idReceptor, payload.monto, new Date()];
    const result = await client.query(insertar, insertarValues);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en la transferencia:", error);
    throw error;
  } finally {
    client.release();
    console.log("Terminó la transacción");
  }
}

const getTransferencias = async () => {
  const text = `
    SELECT t.id, e.nombre as emisor, r.nombre as receptor, t.monto, t.fecha 
    FROM transferencias t 
    INNER JOIN usuarios e ON t.emisor = e.id 
    INNER JOIN usuarios r ON t.receptor = r.id 
    ORDER BY t.fecha
  `;
  const response = await pool.query(text);
  return response.rows;
}

module.exports = { getUsuarios, setUsuario, updateUsuario, deleteUsuario, insertarTransferencia, getTransferencias };
