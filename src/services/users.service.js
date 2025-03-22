class UsersService {
    constructor() {
        console.log('UsersService constructor');
    }

    async ping(db) {
        try {
            const [rows] = await db.query('SELECT * FROM users;');
            console.log('rows:', rows);
        } catch (err) {
            console.log('err:', err?.message);
        }

        return {
            message: 'pong',
        };
    }
}

module.exports = UsersService;
