const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint del clima
app.get('/api/weather', async (req, res) => {
  const city = req.query.city;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el clima' });
  }
});

// Endpoint de registro (actualizado)
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // 1. Validación de campos
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Todos los campos son requeridos"
    });
  }

  // 2. Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Formato de email inválido"
    });
  }

  // 3. Validar fortaleza de contraseña
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "La contraseña debe tener al menos 6 caracteres"
    });
  }

  try {
    // 4. Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Registrar usuario en PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email, hashedPassword]
    );

    // 6. Respuesta exitosa
    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: "Usuario registrado exitosamente"
    });

  } catch (err) {
    // 7. Manejo específico de errores
    console.error('Código de error recibido:', err.code);
    if (err.code === '23505') {
      res.status(409).json({
        success: false,
        error: "El email ya está registrado"
      });
    } else {
      console.error("Error en registro:", err);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor"
      });
    }
  }
});

// Endpoint de login (actualizado)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return res.status(401).json({ error: "Credenciales inválidas" });

    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid) return res.status(401).json({ error: "Credenciales inválidas" });

    res.json({
      userId: user.rows[0].id,
      firstName: user.rows[0].first_name,
      lastName: user.rows[0].last_name,
      email: user.rows[0].email
    });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// --- Modificación clave aquí ---
// Iniciar servidor solo si el módulo no es requerido por otro archivo (ej. un test)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

// GET Favoritos
app.get('/api/favorites', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID es requerido' });
  }

  try {
    const result = await pool.query(
      `SELECT city FROM favorites WHERE user_id = $1 
       ORDER BY id DESC`, // Ordenar por ID descendente (más recientes primero)
      [userId]
    );
    res.json(result.rows.map(item => item.city));
  } catch (err) {
    console.error('Error en GET /api/favorites:', err);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
});

// POST Favoritos
app.post('/api/favorites', async (req, res) => {
  const { userId, city } = req.body;

  if (!userId || !city) {
    return res.status(400).json({ error: 'User ID y ciudad son requeridos' });
  }

  try {
    // Verificar si el usuario existe
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Insertar con ON CONFLICT DO NOTHING (evita errores de duplicados)
    await pool.query(
      `INSERT INTO favorites (user_id, city) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, city) DO NOTHING`,
      [userId, city]
    );
    
    res.status(201).json({ message: 'Ciudad agregada a favoritos' });
  } catch (err) {
    console.error('Error en POST /api/favorites:', err);
    res.status(500).json({ error: 'Error al guardar favorito' });
  }
});

// DELETE Favoritos
app.delete('/api/favorites', async (req, res) => {
  const { userId, city } = req.body;

  if (!userId || !city) {
    return res.status(400).json({ error: 'User ID y ciudad son requeridos' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM favorites 
       WHERE user_id = $1 AND city = $2 
       RETURNING *`,
      [userId, city]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorito no encontrado' });
    }

    res.status(200).json({ message: 'Ciudad eliminada de favoritos' });
  } catch (err) {
    console.error('Error en DELETE /api/favorites:', err);
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
});


// Exporta la instancia de la aplicación Express
module.exports = app;