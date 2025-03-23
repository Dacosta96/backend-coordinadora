const camelcaseKeys = require('@lafourche/camelcase-keys');
const { v4: uuidv4 } = require('uuid');

class HistoryService {
    constructor() {
        console.log('HistoryService constructor');
    }

    async findAllHistories(db) {
        try {
            const [rows] = await db.query('SELECT * FROM shipment_status_history');
            return camelcaseKeys(rows, { deep: true });
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async createHistory(db, historyData) {
        try {
            // eslint-disable-next-line camelcase
            const { shipment_id, status } = historyData;
            console.log('shipmentId:', shipment_id);
            console.log('status:', status);

            // Insertar en la base de datos (sin tracking_id)
            const [result] = await db.query(
                `INSERT INTO shipment_status_history (shipment_id, status) 
                 VALUES (?, ?)`, // NOW() para la fecha de creación
                // eslint-disable-next-line camelcase
                [shipment_id, status]
            );

            // Obtener el historial recién insertado
            const inserted = await this.findHistoryById(db, result.insertId);

            return {
                success: true,
                statusCode: 201, // Created
                message: 'History created successfully',
                shipment: inserted,
            };
        } catch (err) {
            console.error('Error en createShipment History:', err.message);

            return {
                success: false,
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            };
        }
    }

    async findHistoryById(db, id) {
        try {
            const [rows] = await db.query('SELECT * FROM shipment_status_history WHERE id = ?', [id]);
            return rows[0];
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    generateTrackingNumber() {
        const uuid = uuidv4().replace(/-/g, ''); // NO guiones
        const shortId = uuid.substring(0, 8).toUpperCase(); // SOLO 8 caracteres
        return `COORD_${shortId}`;
        // return shortId;
    }
}

module.exports = HistoryService;
