const camelcaseKeys = require('@lafourche/camelcase-keys');

class ShipmentsService {
    constructor() {
        console.log('ShipmentsService constructor');
    }

    async createShipment(db, shipmentData) {
        try {
            const { userId, weight, dimensions, productType, destinationAddress } = shipmentData;
            const [result] = await db.query(
                'INSERT INTO shipments (user_id, weight, dimensions, product_type, destination_address) VALUES (?, ?, ?, ?, ?)',
                [userId, weight, dimensions, productType, destinationAddress]
            );
            return { id: result.insertId, ...shipmentData };
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findAllShipments(db) {
        try {
            const [rows] = await db.query('SELECT * FROM shipments');
            return camelcaseKeys(rows, { deep: true });
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findShipmentById(db, id) {
        try {
            const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [id]);
            return rows[0];
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async updateShipment(db, id, shipmentData) {
        try {
            const { weight, dimensions, productType, destinationAddress, currentStatus } = shipmentData;

            const [result] = await db.query(
                `UPDATE shipments
                 SET weight = ?, dimensions = ?, product_type = ?, destination_address = ?, current_status = ?
                 WHERE id = ?`,
                [weight, dimensions, productType, destinationAddress, currentStatus, id]
            );

            if (result.affectedRows === 0) {
                const error = new Error(`Shipment with ID ${id} not found.`);
                error.status = 404;
                throw error;
            }

            // Return the updated shipment
            return await this.findShipmentById(db, id);
        } catch (err) {
            console.error('Error updating shipment:', err?.message);
            throw err;
        }
    }

    async deleteShipment(db, id) {
        try {
            await db.query('DELETE FROM shipments WHERE id = ?', [id]);
            return { message: 'Shipment deleted successfully' };
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }
}

module.exports = ShipmentsService;
