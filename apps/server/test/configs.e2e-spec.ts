import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Configs (e2e)', () => {
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

    const username = `config_test_${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, password: 'test123456' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /api/configs', () => {
    it('should create a config', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/configs')
        .set(authHeader())
        .send({ templateName: 'Test Config', targetType: 'clash', customRules: '# test' });

      expect(res.status).toBe(201);
      expect(res.body.data.templateName).toBe('Test Config');
      expect(res.body.data.targetType).toBe('clash');
      expect(res.body.data.customRules).toBe('# test');
    });

    it('should reject invalid targetType', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/configs')
        .set(authHeader())
        .send({ templateName: 'Bad', targetType: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/configs', () => {
    it('should list configs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/configs')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/configs/:id', () => {
    it('should get config by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/configs')
        .set(authHeader())
        .send({ templateName: 'Detail', targetType: 'surge' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .get(`/api/configs/${id}`)
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data.targetType).toBe('surge');
    });
  });

  describe('PUT /api/configs/:id', () => {
    it('should update a config', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/configs')
        .set(authHeader())
        .send({ templateName: 'Update', targetType: 'clash' });

      const id = createRes.body.data.id;

      const res = await request(app.getHttpServer())
        .put(`/api/configs/${id}`)
        .set(authHeader())
        .send({ templateName: 'Updated', customRules: '# updated rules' });

      expect(res.status).toBe(200);
      expect(res.body.data.templateName).toBe('Updated');
      expect(res.body.data.customRules).toBe('# updated rules');
    });
  });

  describe('DELETE /api/configs/:id', () => {
    it('should delete a config', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/configs')
        .set(authHeader())
        .send({ templateName: 'Delete', targetType: 'stash' });

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/configs/${id}`)
        .set(authHeader())
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/configs/${id}`)
        .set(authHeader())
        .expect(404);
    });
  });
});
