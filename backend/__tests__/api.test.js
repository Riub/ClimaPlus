const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../index'); // Importa la aplicación Express
require('dotenv').config({ path: './.env.test' });

// ====================================================================
// --- 1. MOCKING DEL MÓDULO 'pg' PARA LA APLICACIÓN (index.js) ---
// Esto intercepta cualquier 'require('pg')' dentro de tu index.js.
// Tu aplicación usará este pool mockeado para sus operaciones de DB.
jest.mock('pg', () => {
  // Creamos un mock para el Pool con métodos 'query', 'connect', 'end'
  const mockPoolInstance = {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve()), // Simula que la conexión siempre es exitosa
    end: jest.fn(() => Promise.resolve()), // Simula que el cierre siempre es exitoso
  };
  // Devolvemos una función que simula el constructor Pool, y que al ser llamada
  // devuelve nuestra instancia mockeada.
  return { Pool: jest.fn(() => mockPoolInstance) };
});

// Importa el axios mockeado (ya lo tienes, solo para claridad)
const axios = require('axios'); // Ya está mockeado por jest.mock('axios');

// ====================================================================
// --- 2. GESTIÓN DE BASES DE DATOS REALES PARA LAS PRUEBAS (POOL REAL) ---
// Este es un pool REAL de pg.Pool, usado *solo por este archivo de test*
// para configurar y limpiar la base de datos de prueba *real* en beforeAll.
// Tu aplicación (index.js) NO usará este pool; usará el pool mockeado de arriba.
const ActualPg = jest.requireActual('pg'); // Importa la versión REAL de 'pg'
const realTestPool = new ActualPg.Pool({
  connectionString: process.env.DATABASE_URL_TEST || 'postgres://climaplus:climaplus123@localhost:5432/climaplus'
});

// ====================================================================
// Variables para pruebas de usuario y credenciales
let testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};
let testUserId;
let hashedPassword; // Se generará en beforeAll

// ====================================================================
// --- HOOKS DE SETUP/TEARDOWN ---

// --- Before All (antes de todas las pruebas) ---
beforeAll(async () => {
  console.log('Entorno de pruebas: Iniciando preparación de base de datos REAL.');
  try {
    // Conectar al pool REAL para manipular la base de datos de prueba
    await realTestPool.connect();

    // Limpiar tablas existentes para asegurar un estado limpio
    await realTestPool.query('DROP TABLE IF EXISTS favorites;');
    await realTestPool.query('DROP TABLE IF EXISTS users CASCADE;'); // CASCADE para eliminar dependencias

    // Recrear las tablas necesarias para las pruebas
    await realTestPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    await realTestPool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        city VARCHAR(100) NOT NULL,
        UNIQUE(user_id, city)
      );
    `);
    console.log('Base de datos de prueba REAL reiniciada y tablas creadas.');

    // Insertar un usuario de prueba directamente en la DB REAL
    hashedPassword = await bcrypt.hash(testUser.password, 10);
    const result = await realTestPool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testUser.firstName, testUser.lastName, testUser.email, hashedPassword]
    );
    testUserId = result.rows[0].id;
    console.log(`Usuario de prueba REAL '${testUser.email}' insertado con ID: ${testUserId}`);

  } catch (error) {
    console.error('❌ Error al preparar la base de datos de prueba (beforeAll):', error);
    process.exit(1);
  } finally {
    // Siempre cierra la conexión del pool REAL después de la preparación
    if (realTestPool) {
      await realTestPool.end();
      console.log('Conexión del realTestPool CERRADA después de beforeAll.');
    }
  }
});

// --- Before Each (antes de cada prueba individual) ---
beforeEach(() => {
  // Limpiar el historial de llamadas a las funciones mockeadas
  // Esto asegura que cada test se ejecute en un estado de mock "limpio"
  const { Pool: MockedPoolConstructor } = require('pg');
  const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value; // Obtiene la instancia del mock

  if (mockPoolInstance) {
    mockPoolInstance.query.mockClear();
    mockPoolInstance.connect.mockClear();
    mockPoolInstance.end.mockClear();
  }
});

// --- After All (después de todas las pruebas) ---
afterAll(async () => {
  // En este punto, el realTestPool ya debería estar cerrado desde beforeAll.
  // No hay un pool de app real que cerrar, ya que está mockeado.
  console.log('Limpieza final de mocks y confirmación de cierre de recursos de test.');

  // Puedes añadir un pequeño sleep si Jest sigue quejándose de open handles,
  // pero lo ideal es que no queden operaciones pendientes del mock.
  // await new Promise(resolve => setTimeout(resolve, 100));

}, 30000); // Aumenta el timeout si sigue dando problemas

// ====================================================================
// --- DESCRIPCIÓN DE LAS PRUEBAS ---

describe('Backend API Endpoints', () => {

  // --- Tests para /api/weather ---
  describe('GET /api/weather', () => {
    it('should return weather data for a valid city', async () => {
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
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('London'));
    });

    it('should return 500 if OpenWeatherMap API call fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('API error'));
      const res = await request(app).get('/api/weather?city=InvalidCity');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Error al obtener el clima' });
    });

    it('should return 500 if city query parameter is missing', async () => {
      // Mockea una respuesta de error para simular el fallo de la API externa sin un `city`
      axios.get.mockRejectedValueOnce(new Error('City parameter missing'));
      const res = await request(app).get('/api/weather');
      expect(res.statusCode).toEqual(500);
      // Puedes ser más específico si tu backend devuelve un mensaje de error diferente en este caso
    });
  });

  // --- Tests para /api/register ---
  describe('POST /api/register', () => {
    // En este beforeEach, NO necesitas limpiar la DB real.
    // Solo limpiar los mocks si es necesario para el test específico.
    beforeEach(() => {
        // mockPoolInstance.query.mockClear(); ya lo hace el beforeEach global.
    });

    it('should register a new user successfully', async () => {
      const newUser = {
        firstName: 'New',
        lastName: 'User',
        email: 'test_register_new@example.com',
        password: 'securepassword'
      };

      // Controla la respuesta de `pool.query` de la aplicación Express
      const { Pool: MockedPoolConstructor } = require('pg');
      const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;
      mockPoolInstance.query.mockResolvedValueOnce({
        rows: [{ id: 2, ...newUser, password_hash: 'hashedhash' }] // Simula el RETURN de la inserción
      });

      const res = await request(app).post('/api/register').send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', 2);
      expect(res.body.user.email).toEqual(newUser.email);
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(1);
      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.any(Array)
      );
    });

    it('should return 400 if fields are missing', async () => {
      const incompleteUser = { firstName: 'Incomplete', email: 'test@example.com' };
      const res = await request(app).post('/api/register').send(incompleteUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Todos los campos son requeridos');
      // Asegurarse de que NO haya llamadas a la DB si falla la validación temprana
      const { Pool: MockedPoolConstructor } = require('pg');
      expect(MockedPoolConstructor.mock.results[0]?.value?.query).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidEmailUser = { ...testUser, email: 'invalid-email' };
      const res = await request(app).post('/api/register').send(invalidEmailUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Formato de email inválido');
      const { Pool: MockedPoolConstructor } = require('pg');
      expect(MockedPoolConstructor.mock.results[0]?.value?.query).not.toHaveBeenCalled();
    });

    it('should return 400 for password less than 6 characters', async () => {
      const shortPasswordUser = { ...testUser, email: 'shortpass@example.com', password: 'short' };
      const res = await request(app).post('/api/register').send(shortPasswordUser);
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('La contraseña debe tener al menos 6 caracteres');
      const { Pool: MockedPoolConstructor } = require('pg');
      expect(MockedPoolConstructor.mock.results[0]?.value?.query).not.toHaveBeenCalled();
    });

    it('should return 409 if email already registered', async () => {
      const existingUser = {
        firstName: 'Existing',
        lastName: 'User',
        email: 'test_register_existing@example.com',
        password: 'existingpassword'
      };

      // Mockear la consulta para simular que un usuario ya existe
      const { Pool: MockedPoolConstructor } = require('pg');
      const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;
      // Primero, la consulta SELECT del login falla
      mockPoolInstance.query.mockResolvedValueOnce({ rows: [{ id: 1, email: existingUser.email, password_hash: 'some_hash' }] });
      // Luego, la consulta INSERT falla con el código de error de duplicado
      const uniqueConstraintError = new Error('duplicate key value violates unique constraint "users_email_key"');
      uniqueConstraintError.code = '23505';
      mockPoolInstance.query.mockRejectedValueOnce(uniqueConstraintError);


      // Simula el escenario donde el email ya está en la DB
      const res = await request(app).post('/api/register').send(existingUser);
      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('El email ya está registrado');
      // Verificamos que se llamó una vez al pool.query (para la inserción)
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(1);
    });
  });

  // --- Tests para /api/login ---
  describe('POST /api/login', () => {
    const { Pool: MockedPoolConstructor } = require('pg');
    const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;

    it('should login a valid user successfully', async () => {
      // Mockear la respuesta de la DB para la consulta SELECT del usuario
      mockPoolInstance.query.mockResolvedValueOnce({
        rows: [{
          id: testUserId,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          email: testUser.email,
          password_hash: hashedPassword // Usar el hash generado en beforeAll
        }]
      });

      const res = await request(app).post('/api/login').send({
        email: testUser.email,
        password: testUser.password
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('userId', testUserId);
      expect(res.body.email).toEqual(testUser.email);
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(1);
      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [testUser.email]
      );
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      // Mockear que la consulta de usuario devuelve un usuario válido
      mockPoolInstance.query.mockResolvedValueOnce({
        rows: [{
          id: testUserId,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          email: testUser.email,
          password_hash: await bcrypt.hash('different_password', 10) // Contraseña que no coincidirá
        }]
      });

      const res = await request(app).post('/api/login').send({
        email: testUser.email,
        password: 'wrongpassword'
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ error: 'Credenciales inválidas' });
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(1);
    });

    it('should return 401 for invalid credentials (non-existent email)', async () => {
      // Mockear que la consulta de usuario no devuelve ninguna fila
      mockPoolInstance.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post('/api/login').send({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ error: 'Credenciales inválidas' });
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(1);
    });
  });
});