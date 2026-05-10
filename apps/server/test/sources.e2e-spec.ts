import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Sources (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // register a user for testing
    const username = `source_test_${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, password: 'test123456' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /api/sources', () => {
    it('should create a source', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set(authHeader())
        .send({ name: 'Test Source', url: 'https://example.com/sub' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Test Source');
      expect(res.body.data.url).toBe('https://example.com/sub');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should reject invalid URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .set(authHeader())
        .send({ name: 'Bad', url: 'not-a-url' });

      expect(res.status).toBe(400);
    });

    it('should reject without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sources')
        .send({ name: 'Test', url: 'https://example.com' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/sources', () => {
    it('should list sources with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sources')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/sources/:id', () => {
    it('should get source by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/sources')
        .set(authHeader())
        .send({ name: 'Detail Test', url: 'https://example.com/detail' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/sources/${id}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
      expect(res.body.data.name).toBe('Detail Test');
    });

    it('should return 404 for non-existent source', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sources/00000000-0000-0000-0000-000000000000')
        .set(authHeader());

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/sources/:id', () => {
    it('should update a source', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/sources')
        .set(authHeader())
        .send({ name: 'Update Test', url: 'https://example.com/update' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/sources/${id}`)
        .set(authHeader())
        .send({ name: 'Updated Name', isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /api/sources/:id', () => {
    it('should delete a source', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/sources')
        .set(authHeader())
        .send({ name: 'Delete Test', url: 'https://example.com/delete' });

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/sources/${id}`)
        .set(authHeader())
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/sources/${id}`)
        .set(authHeader())
        .expect(404);
    });
  });
});
