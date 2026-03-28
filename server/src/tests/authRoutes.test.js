const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const mockUsers = [];
let mockNextId = 1;

const buildUserDoc = (user) => ({
  ...user,
  comparePassword: jest.fn(async (candidate) => candidate === user.password),
  toJSON() {
    const { password, ...rest } = this;
    return rest;
  },
});

jest.mock('../../src/models/User', () => {
  const findOne = jest.fn((query) => {
    const user = mockUsers.find((item) => item.email === query.email);
    const resolvedUser = user ? buildUserDoc(user) : null;
    return {
      select: jest.fn().mockResolvedValue(resolvedUser),
      then: (resolve) => Promise.resolve(resolvedUser).then(resolve),
      catch: (reject) => Promise.resolve(resolvedUser).catch(reject),
    };
  });

  const create = jest.fn(async (payload) => {
    if (!payload.name || !payload.email || !payload.password) {
      throw new Error('Missing required fields');
    }

    const user = {
      _id: String(mockNextId++),
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };
    mockUsers.push(user);
    return buildUserDoc(user);
  });

  const findById = jest.fn(async (id) => {
    const user = mockUsers.find((item) => item._id === String(id));
    return user ? buildUserDoc(user) : null;
  });

  return { findOne, create, findById };
});

const app = require('../../src/app');

describe('Auth Routes', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  let authToken;

  beforeEach(() => {
    mockUsers.length = 0;
    mockNextId = 1;
    authToken = undefined;
  });

  describe('POST /api/auth/register', () => {
    test('registers a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.password).toBeUndefined();

      authToken = res.body.token;
    });

    test('rejects duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'nopwd@example.com' });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    test('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      const registerRes = await request(app).post('/api/auth/register').send(testUser);
      authToken = registerRes.body.token;
    });

    test('returns user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
    });

    test('rejects request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('rejects invalid token', async () => {
      const invalidToken = jwt.sign({ id: '9999' }, process.env.JWT_SECRET);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(res.status).toBe(401);
    });
  });
});
