import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Vaults (e2e)', () => {
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

    const username = `vault_test_${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, password: 'test123456' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /api/vault', () => {
    it('should add item to vault', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/vault')
        .set(authHeader())
        .send({
          contentUrl: 'https://example.com/sub',
          tags: 'work,proxy',
          expiryDate: '2027-01-01T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.contentUrl).toBe('https://example.com/sub');
      expect(res.body.data.tags).toBe('work,proxy');
      expect(res.body.data.expiryDate).toBeDefined();
    });

    it('should reject invalid URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/vault')
        .set(authHeader())
        .send({ contentUrl: 'not-a-url' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vault', () => {
    it('should list vault items', async () => {
      const res = await request(app.getHttpServer()).get('/api/vault').set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/vault/:id', () => {
    it('should get vault item by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/vault')
        .set(authHeader())
        .send({ contentUrl: 'https://example.com/detail' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/vault/${id}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.contentUrl).toBe('https://example.com/detail');
    });
  });

  describe('PUT /api/vault/:id', () => {
    it('should update tags and expiryDate', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/vault')
        .set(authHeader())
        .send({ contentUrl: 'https://example.com/update' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/vault/${id}`)
        .set(authHeader())
        .send({ tags: 'updated', expiryDate: '2028-06-01T00:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body.data.tags).toBe('updated');
    });
  });

  describe('DELETE /api/vault/:id', () => {
    it('should remove vault item', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/vault')
        .set(authHeader())
        .send({ contentUrl: 'https://example.com/delete' });

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/vault/${id}`)
        .set(authHeader())
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/vault/${id}`)
        .set(authHeader())
        .expect(404);
    });
  });
});
