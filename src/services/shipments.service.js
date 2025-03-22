class ShipmentsService {
    constructor() {
        console.log('ShipmentsService constructor');
    }

    async example(db) {
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

module.exports = ShipmentsService;
