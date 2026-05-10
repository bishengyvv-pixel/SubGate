import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    username: `e2e_test_${Date.now()}`,
    password: 'test123456',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: testUser.username, password: testUser.password });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(201);
      expect(res.body.message).toBe('ok');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.username).toBe(testUser.username);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate username', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: testUser.username, password: 'other123' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject short password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: `shortpwd_${Date.now()}`, password: '12' });

      expect(res.status).toBe(400);
    });

    it('should reject short username', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'valid123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'somepassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      accessToken = res.body.data.accessToken;
    });

    it('should return profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(testUser.username);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should reject without token', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/profile');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/password', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      accessToken = res.body.data.accessToken;
    });

    it('should change password', async () => {
      await request(app.getHttpServer())
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: testUser.password, newPassword: 'newpass456' })
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'newpass456' })
        .expect(200);
    });

    it('should reject wrong old password', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ oldPassword: 'wrongold', newPassword: 'irrelevant' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Old password');
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should delete account', async () => {
      const username = `delete_me_${Date.now()}`;
      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username, password: 'password123' });

      const token = reg.body.data.accessToken;
      expect(token).toBeDefined();

      await request(app.getHttpServer())
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username, password: 'password123' })
        .expect(401);
    });
  });
});
