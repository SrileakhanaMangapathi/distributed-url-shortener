const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const mockUsers = [];
const mockUrls = [];
let mockNextUserId = 1;
let mockNextUrlId = 1;

const buildUserDoc = (user) => ({
  ...user,
  comparePassword: jest.fn(async (candidate) => candidate === user.password),
  toJSON() {
    const { password, ...rest } = this;
    return rest;
  },
});

const buildQuery = (value) => ({
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockResolvedValue(value),
});

jest.mock('../../src/models/User', () => ({
  findOne: jest.fn((query) => {
    const user = mockUsers.find((item) => item.email === query.email);
    const resolvedUser = user ? buildUserDoc(user) : null;
    return {
      select: jest.fn().mockResolvedValue(resolvedUser),
      then: (resolve) => Promise.resolve(resolvedUser).then(resolve),
      catch: (reject) => Promise.resolve(resolvedUser).catch(reject),
    };
  }),
  create: jest.fn(async (payload) => {
    const user = {
      _id: String(mockNextUserId++),
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };
    mockUsers.push(user);
    return buildUserDoc(user);
  }),
  findById: jest.fn(async (id) => {
    const user = mockUsers.find((item) => item._id === String(id));
    return user ? buildUserDoc(user) : null;
  }),
}));

jest.mock('../../src/models/Url', () => ({
  findOne: jest.fn(async (query) => {
    if (query.shortCode && typeof query.isActive === 'boolean') {
      return mockUrls.find((item) => item.shortCode === query.shortCode && item.isActive === query.isActive) || null;
    }

    if (query.shortCode) {
      return mockUrls.find((item) => item.shortCode === query.shortCode) || null;
    }

    return null;
  }),
  create: jest.fn(async (payload) => {
    const url = {
      _id: String(mockNextUrlId++),
      originalUrl: payload.originalUrl,
      shortCode: payload.shortCode,
      customAlias: payload.customAlias || null,
      expiresAt: payload.expiresAt || null,
      createdBy: payload.createdBy || null,
      clicks: 0,
      isActive: true,
      createdAt: new Date(),
      deleteOne: jest.fn(async () => {
        const index = mockUrls.findIndex((item) => item._id === url._id);
        if (index >= 0) mockUrls.splice(index, 1);
      }),
    };
    mockUrls.push(url);
    return url;
  }),
  find: jest.fn((query) => {
    const results = mockUrls.filter((item) => String(item.createdBy) === String(query.createdBy));
    return buildQuery(results);
  }),
  findById: jest.fn(async (id) => mockUrls.find((item) => item._id === String(id)) || null),
  findByIdAndUpdate: jest.fn((id, update) => ({
    exec: jest.fn(async () => {
      const url = mockUrls.find((item) => item._id === String(id));
      if (url && update.$inc?.clicks) url.clicks += update.$inc.clicks;
      return url || null;
    }),
  })),
  findOneAndUpdate: jest.fn((query, update) => ({
    exec: jest.fn(async () => {
      const url = mockUrls.find((item) => item.shortCode === query.shortCode);
      if (url && update.$inc?.clicks) url.clicks += update.$inc.clicks;
      return url || null;
    }),
  })),
}));

jest.mock('../../src/services/cacheService', () => {
  const cache = new Map();
  return {
    cacheGet: jest.fn(async (key) => cache.get(key) || null),
    cacheSet: jest.fn(async (key, value) => {
      cache.set(key, value);
    }),
    cacheDelete: jest.fn(async (key) => {
      cache.delete(key);
    }),
    urlCacheKey: jest.fn((shortCode) => `url:${shortCode}`),
  };
});

jest.mock('../../src/services/analyticsService', () => ({
  trackClick: jest.fn(),
}));

const app = require('../../src/app');

describe('URL Routes', () => {
  let authToken;
  let createdShortCode;

  beforeEach(async () => {
    mockUsers.length = 0;
    mockUrls.length = 0;
    mockNextUserId = 1;
    mockNextUrlId = 1;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'URL Test User',
        email: 'urltest@example.com',
        password: 'password123',
      });

    authToken = res.body.token;
    createdShortCode = undefined;
  });

  describe('POST /api/urls/shorten', () => {
    test('shortens a valid URL', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .send({ originalUrl: 'https://www.google.com' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toBeDefined();
      expect(res.body.data.shortUrl).toContain(res.body.data.shortCode);

      createdShortCode = res.body.data.shortCode;
    });

    test('shortens with auth token (links to user)', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ originalUrl: 'https://www.github.com' });

      expect(res.status).toBe(201);
      expect(res.body.data.shortCode).toBeDefined();
      expect(mockUrls[0].createdBy).toBe('1');
    });

    test('rejects invalid URL', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .send({ originalUrl: 'not-a-valid-url' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('rejects missing URL', async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .send({});

      expect(res.status).toBe(400);
    });

    test('accepts custom alias', async () => {
      const alias = 'testalias';
      const res = await request(app)
        .post('/api/urls/shorten')
        .send({ originalUrl: 'https://example.com', customAlias: alias });

      expect(res.status).toBe(201);
      expect(res.body.data.shortCode).toBe(alias);
    });
  });

  describe('GET /:shortCode', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/urls/shorten')
        .send({ originalUrl: 'https://www.google.com' });
      createdShortCode = res.body.data.shortCode;
    });

    test('redirects to original URL', async () => {
      const res = await request(app).get(`/${createdShortCode}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://www.google.com');
    });

    test('returns 404 for unknown short code', async () => {
      const res = await request(app).get('/nonexistentcode123');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/urls', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/urls/shorten')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ originalUrl: 'https://www.github.com' });
    });

    test('returns user URLs with auth token', async () => {
      const res = await request(app)
        .get('/api/urls')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    test('rejects without auth token', async () => {
      const res = await request(app).get('/api/urls');
      expect(res.status).toBe(401);
    });
  });
});
