/* eslint-disable no-undef */
const request = require('supertest');
const express = require('express');
const usersRouter = require('../controllers/users.controller');

// Mock de los helpers externos
jest.mock('../utils/google-util', () => ({
    validateAddress: jest.fn(() =>
        Promise.resolve({
            success: true,
            message: 'Address validated',
        })
    ),
}));

jest.mock('../utils/clerk-util', () => ({
    createClerkUser: jest.fn(() =>
        Promise.resolve({
            status: true,
            data: { id: 'clerk_test_id' },
        })
    ),
}));

// Mock de db.query
const mockDb = {
    query: jest.fn(),
};

// Express app con middleware de mock db
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.app.locals.db = mockDb;
    next();
});
app.use('/users', usersRouter);

describe('Users Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /users/ping debe retornar status 200 y mensaje', async () => {
        const res = await request(app).get('/users/ping');

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            message: 'pong',
            response: {
                success: true,
                message: 'Address validated',
            },
        });
    });

    test('GET /users/:id debe retornar un usuario por ID', async () => {
        const fakeUser = { id: 1, name: 'Test User', email: 'test@example.com' };
        mockDb.query.mockResolvedValueOnce([[fakeUser]]);

        const res = await request(app).get('/users/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeUser);
    });

    test('POST /users debe crear un usuario', async () => {
        const newUser = {
            name: 'Juan',
            email: 'juan@example.com',
            password: 'Test2023*-',
            role: 'user',
        };

        // Email not found (count = 0)
        mockDb.query.mockResolvedValueOnce([[{ count: 0 }]]);
        // INSERT
        mockDb.query.mockResolvedValueOnce([{ insertId: 10 }]);
        // SELECT nuevo usuario creado
        mockDb.query.mockResolvedValueOnce([
            [
                {
                    id: 10,
                    name: 'Juan',
                    email: 'juan@example.com',
                    role: 'user',
                    clerk_id: 'clerk_test_id',
                },
            ],
        ]);

        const res = await request(app).post('/users').send(newUser);

        // console.log('res.statusCode:', res.statusCode);
        // console.log('res.body:', res.body);

        expect(res.statusCode).toBe(201);
        expect(res.body).toMatchObject({
            id: 10,
            name: 'Juan',
            email: 'juan@example.com',
            role: 'user',
        });
    });

    test('POST /users debe fallar si falta el campo "name"', async () => {
        const invalidUser = {
            email: 'juan@example.com',
            password: 'Test2023*-',
            role: 'user',
        };

        const res = await request(app).post('/users').send(invalidUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/name/i);
    });

    test('POST /users debe fallar si el email no es válido', async () => {
        const invalidUser = {
            name: 'Juan',
            email: 'correo-no-valido',
            password: 'Test2023*-',
            role: 'user',
        };

        const res = await request(app).post('/users').send(invalidUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/email/i);
    });

    test('POST /users debe fallar si el password es débil', async () => {
        const invalidUser = {
            name: 'Juan',
            email: 'juan@example.com',
            password: '12345678',
            role: 'user',
        };

        const res = await request(app).post('/users').send(invalidUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/password/i);
    });

    test('POST /users debe fallar si el rol no es válido', async () => {
        const invalidUser = {
            name: 'Juan',
            email: 'juan@example.com',
            password: 'Test2023*-',
            role: 'superadmin',
        };

        const res = await request(app).post('/users').send(invalidUser);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/role/i);
    });
});
