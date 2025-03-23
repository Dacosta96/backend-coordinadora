const { createClerkUser } = require('../utils/clerk-util');
const { validateAddress } = require('../utils/google-util');

class UsersService {
    async ping(db) {
        // test email
        // const response = await createClerkUser({
        // sendEmail({});
        const response = await validateAddress({
            regionCode: 'CO',
            locality: 'Cajica',
            administrativeArea: 'Cundinamarca',
            addressLines: ['Carrera 6 #6b-58 Sur'],
        });
        return {
            message: 'pong',
            response,
        };
    }

    async findUserByEmail(db, email) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0] || null;
        } catch (err) {
            console.log('Error al buscar usuario por email:', err?.message);
            throw err;
        }
    }

    async findUserById(db, id) {
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
            return rows[0];
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async create(db, userData) {
        try {
            const { name, email, role, password } = userData;

            // Step 1: Validate unique email
            const [rows] = await db.query('SELECT COUNT(id) as count FROM users WHERE email = ?', [email]);
            if (rows[0].count > 0) {
                throw new Error('Email already exists');
            }

            // Step 2: Create user in Clerk
            const clerUserResponse = await createClerkUser({
                email,
                name,
                role,
                password,
            });
            if (!clerUserResponse?.status) {
                throw new Error(`Error creating user in Clerk: ${clerUserResponse?.message}`);
            }

            const clerUser = clerUserResponse.data;
            console.log('clerUser:', clerUser);

            // Step 3: Save to the database
            const [result] = await db.query('INSERT INTO users (name, email, role, clerk_id) VALUES (?, ?, ? ,?)', [
                name,
                email,
                role,
                clerUser.id,
            ]);

            const userSaved = await this.findUserById(db, result.insertId);

            return userSaved;
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }
}

module.exports = UsersService;
