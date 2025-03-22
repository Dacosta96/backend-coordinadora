const camelcaseKeys = require('@lafourche/camelcase-keys');
const { v4: uuidv4 } = require('uuid');
const { validateAddress } = require('../utils/google-util');
const { sendEmailTemplateHtml } = require('../utils/aws-util');

class ShipmentsService {
    constructor() {
        console.log('ShipmentsService constructor');
    }

    async createShipment(db, shipmentData) {
        try {
            const { userId, weight, dimensions, productType, destinationAddress } = shipmentData;

            // validar si la dirección de destino es válida
            const responseAddress = await validateAddress(destinationAddress);

            if (!responseAddress?.isValid) {
                const error = new Error('Invalid destination address');
                error.status = 400;
                throw error;
            }

            const googleMapsAddress = responseAddress?.data?.result?.address || {};

            // generar id de envío
            const trackingId = this.generateTrackingNumber();
            console.log('trackingId:', trackingId);

            const [result] = await db.query(
                `INSERT INTO shipments (tracking_id, user_id, weight, dimensions, product_type, destination_address, google_map_address)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    trackingId,
                    userId,
                    weight,
                    dimensions,
                    productType,
                    JSON.stringify(destinationAddress),
                    JSON.stringify(googleMapsAddress),
                ]
            );

            const inserted = await this.findShipmentById(db, result.insertId);

            // enviar notificación por correo electrónico
            const responseEmail = await sendEmailTemplateHtml({
                to: 'acostaedwin1@gmail.com',
                subject: 'Nuevo envío creado',
                templateName: 'shipment-created.ejs',
                params: {
                    userId,
                    weight,
                    dimensions,
                    productType,
                    destination: googleMapsAddress?.formattedAddress,
                    status: inserted?.currentStatus,
                    trackingId,
                },
            });
            console.log('responseEmail:', responseEmail);

            return inserted;
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

    generateTrackingNumber() {
        const uuid = uuidv4().replace(/-/g, ''); // NO guiones
        const shortId = uuid.substring(0, 8).toUpperCase(); // SOLO 8 caracteres
        return `COORD_${shortId}`;
        // return shortId;
    }
}

module.exports = ShipmentsService;
