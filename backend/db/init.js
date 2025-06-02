const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function initDB() {
  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos.');

    // Primera consulta: Crear la tabla 'users'
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ Tabla "users" creada o ya existente.');

    // Segunda consulta: Crear la tabla 'favorites'
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        city VARCHAR(100) NOT NULL,
        UNIQUE(user_id, city)
      );
    `);
    console.log('✅ Tabla "favorites" creada o ya existente.');

    console.log('✨ Todas las tablas necesarias han sido creadas exitosamente.');

  } catch (err) {
    console.error('❌ Error al crear tablas:', err.message);

  } finally {
    if (client) { 
      await client.end();
      console.log('🔌 Conexión a la base de datos cerrada.');
    }
  }
}

initDB();