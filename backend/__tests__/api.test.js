const request = require('supertest');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: './.env.test' });

jest.mock('pg', () => {

  const mockPoolInstance = {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve()), 
    end: jest.fn(() => Promise.resolve()), 
  };
 
  return { Pool: jest.fn(() => mockPoolInstance) };
});

const app = require('../index');

jest.mock('axios', () => ({
  get: jest.fn(), 
  post: jest.fn(), 
})); 
const axios = require('axios'); 


const ActualPg = jest.requireActual('pg'); 
const realTestPool = new ActualPg.Pool({
  connectionString: process.env.DATABASE_URL_TEST || 'postgres://climaplus:climaplus123@localhost:5432/climaplus'
});

let testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};
let testUserId;
let hashedPassword; 

beforeAll(async () => {
  console.log('Entorno de pruebas: Iniciando preparación de base de datos REAL.');
  try {
    await realTestPool.query('DROP TABLE IF EXISTS favorites;');
    await realTestPool.query('DROP TABLE IF EXISTS users CASCADE;'); 
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
    if (realTestPool) {
      await realTestPool.end();
      console.log('Conexión del realTestPool CERRADA después de beforeAll.');
    }
  }
});


beforeEach(() => {

  const { Pool: MockedPoolConstructor } = require('pg');
  const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value; 
  mockPoolInstance.query.mockReset();

  if (mockPoolInstance) {
    mockPoolInstance.query.mockClear();
    mockPoolInstance.connect.mockClear();
    mockPoolInstance.end.mockClear();
  }
});


afterAll(async () => {

  console.log('Limpieza final de mocks y confirmación de cierre de recursos de test.');
}, 30000);


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
     
      axios.get.mockRejectedValueOnce(new Error('City parameter missing'));
      const res = await request(app).get('/api/weather');
      expect(res.statusCode).toEqual(500);
    
    });
  });

  // --- Tests para /api/register ---
  describe('POST /api/register', () => {
    beforeEach(() => {
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
        rows: [{ id: 2, ...newUser, password_hash: 'hashedhash' }] 
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

      const { Pool: MockedPoolConstructor } = require('pg');
      const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;

      // Asegura que el mock esté limpio
      mockPoolInstance.query.mockReset();

      mockPoolInstance.query
        // Simula que el correo aún no existe
        .mockResolvedValueOnce({ rows: [] })
        // Luego falla el INSERT por clave duplicada
        .mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }));

      const res = await request(app).post('/api/register').send(existingUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('El email ya está registrado');
      expect(mockPoolInstance.query).toHaveBeenCalledTimes(2);
      expect(mockPoolInstance.query.mock.calls[1][0]).toMatch(/INSERT INTO users/i);
    });
  });

describe('POST /api/login', () => {
  const { Pool: MockedPoolConstructor } = require('pg');
  const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;

    it('should login a valid user successfully', async () => {
    const { Pool: MockedPoolConstructor } = require('pg');
    const mockPoolInstance = MockedPoolConstructor.mock.results[0]?.value;

    // Asegura que el mock esté limpio
    mockPoolInstance.query.mockReset();

    const hashed = await bcrypt.hash(testUser.password, 10);

    mockPoolInstance.query.mockResolvedValueOnce({
      rows: [{
        id: testUserId,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        email: testUser.email,
        password_hash: hashed
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
    mockPoolInstance.query.mockResolvedValueOnce({
      rows: [{
        id: testUserId,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        email: testUser.email,
        password_hash: await bcrypt.hash('this_is_a_different_hash_from_wrongpassword', 10)
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