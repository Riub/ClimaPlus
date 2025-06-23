const request = require('supertest');
const app = require('../index'); 
const { Pool } = require('pg'); 
const bcrypt = require('bcryptjs'); 
require('dotenv').config({ path: './.env.test' }); 

// Configuración de la base de datos de prueba

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TEST || 'postgres://climaplus:climaplus123@localhost:5432/climaplus_test'
});

// Mockear axios para evitar llamadas reales a la API de OpenWeatherMap
// Esto asegura que tus tests sean rápidos y no dependan de una conexión externa
jest.mock('axios');
const axios = require('axios');

// Variables para pruebas de usuario
let testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};
let hashedPassword; // Para almacenar el hash de la contraseña de prueba

// --- Antes de todas las pruebas ---
beforeAll(async () => {
  // Conectarse y asegurar que la base de datos de prueba esté limpia
  // Si usas un Docker Compose para pruebas, asegúrate de que esté configurado para un DB_URL_TEST distinto.
  try {
    await pool.connect();
    // Limpiar tablas antes de ejecutar las pruebas para asegurar un estado limpio
    await pool.query('DROP TABLE IF EXISTS favorites;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;'); // CASCADE para eliminar favoritos si dependen de users

    // Recrear las tablas (similar a tu init.js, pero para la DB de prueba)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        city VARCHAR(100) NOT NULL,
        UNIQUE(user_id, city)
      );
    `);
    console.log('Base de datos de prueba reiniciada y tablas creadas.');

    // Opcional: Insertar un usuario de prueba directamente si necesitas un usuario pre-existente
    hashedPassword = await bcrypt.hash(testUser.password, 10);
    await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [testUser.firstName, testUser.lastName, testUser.email, hashedPassword]
    );

  } catch (error) {
    console.error('Error al preparar la base de datos de prueba:', error);
    process.exit(1); // Salir si la DB de prueba no se puede preparar
  }
});

// --- Después de todas las pruebas ---
afterAll(async () => {
  // Limpiar tablas nuevamente o simplemente cerrar la conexión
  // Dependiendo de tu estrategia de limpieza post-test
  try {
    // Si quieres borrar todo después, puedes volver a DROP TABLE
    await pool.query('DROP TABLE IF EXISTS favorites;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    await pool.end(); // Cerrar la conexión al pool de DB
    console.log('Conexión a la base de datos de prueba cerrada y tablas eliminadas.');
  } catch (error) {
    console.error('Error al limpiar la base de datos de prueba:', error);
  }
});

// --- Descripción de las pruebas ---
describe('Backend API Endpoints', () => {

  // --- Tests para /api/weather ---
  describe('GET /api/weather', () => {
    it('should return weather data for a valid city', async () => {
      // Mockear la respuesta de axios para la llamada externa a OpenWeatherMap
      axios.get.mockResolvedValueOnce({
        data: {
          name: 'London',
          main: { temp: 15 },
          weather: [{ description: 'cloudy' }]
        }
      });

      const res = await request(app).get('/api/weather?city=London');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'London');
      expect(res.body.main).toHaveProperty('temp', 15);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('London') // Verifica que se llamó con 'London'
      );
    });

    it('should return 500 if OpenWeatherMap API call fails', async () => {
      // Mockear que axios lanza un error
      axios.get.mockRejectedValueOnce(new Error('API error'));

      const res = await request(app).get('/api/weather?city=InvalidCity');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Error al obtener el clima' });
    });

    it('should return 500 if city query parameter is missing', async () => {
      // Nota: Tu lógica actual no maneja explícitamente la falta de 'city'
      // Si el API_KEY no es válido o falta, también puede devolver 500.
      // Esta prueba podría fallar si OpenWeatherMap devuelve 400 en lugar de que tu backend lo detecte.
      const res = await request(app).get('/api/weather'); // Sin parámetro 'city'
      expect(res.statusCode).toEqual(500); // Depende de cómo OpenWeatherMap o Axios manejen la URL incompleta
    });
  });

  // --- Tests para /api/register ---
  describe('POST /api/register', () => {
    // Limpiar tabla de usuarios antes de cada test de registro para evitar conflictos de email UNIQUE
    beforeEach(async () => {
      await pool.query('DELETE FROM users WHERE email LIKE \'test_register_%\'');
    });

    it('should register a new user successfully', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: 'test_register_new@example.com',
        password: 'securepassword'
      };
      const res = await request(app).post('/api/register').send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toEqual(newUser.email);

      // Verificar que el usuario fue insertado en la DB
      const dbUser = await pool.query('SELECT email FROM users WHERE email = $1', [newUser.email]);
      expect(dbUser.rows.length).toBe(1);
      expect(dbUser.rows[0].email).toEqual(newUser.email);
    });

    it('should return 400 if fields are missing', async () => {
      const incompleteUser = { firstName: 'Incomplete', email: 'test@example.com' }; // Falta lastName y password
      const res = await request(app).post('/api/register').send(incompleteUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Todos los campos son requeridos');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidEmailUser = { ...testUser, email: 'invalid-email' };
      const res = await request(app).post('/api/register').send(invalidEmailUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Formato de email inválido');
    });

    it('should return 400 for password less than 6 characters', async () => {
      const shortPasswordUser = { ...testUser, email: 'shortpass@example.com', password: 'short' };
      const res = await request(app).post('/api/register').send(shortPasswordUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('La contraseña debe tener al menos 6 caracteres');
    });

    it('should return 409 if email already registered', async () => {
      // Primero, registramos un usuario de prueba (ya lo hicimos en beforeAll, pero podemos hacerlo aquí para claridad)
      const existingUser = {
        firstName: 'Existing',
        lastName: 'User',
        email: 'test_register_existing@example.com',
        password: 'existingpassword'
      };
      await request(app).post('/api/register').send(existingUser); // Primer registro

      // Intentar registrar el mismo email de nuevo
      const res = await request(app).post('/api/register').send(existingUser);
      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('El email ya está registrado');
    });
  });

  // --- Tests para /api/login ---
  describe('POST /api/login', () => {
    // Asegurarse de que el usuario de prueba esté en la DB antes de las pruebas de login
    // El usuario 'test@example.com' se inserta en beforeAll.
    it('should login a valid user successfully', async () => {
      const res = await request(app).post('/api/login').send({
        email: testUser.email,
        password: testUser.password
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('userId');
      expect(res.body.email).toEqual(testUser.email);
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app).post('/api/login').send({
        email: testUser.email,
        password: 'wrongpassword'
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ error: 'Credenciales inválidas' });
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      const res = await request(app).post('/api/login').send({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ error: 'Credenciales inválidas' });
    });
  });
});