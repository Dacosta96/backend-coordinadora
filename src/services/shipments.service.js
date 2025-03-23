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

            // Validar la dirección con Google
            const responseAddress = await validateAddress(destinationAddress);
            console.log('responseAddress:', responseAddress);

            if (!responseAddress?.status || !responseAddress?.isValid) {
                return {
                    success: false,
                    statusCode: 400, // Bad Request
                    message: 'Invalid destination address. Please provide a valid address.',
                };
            }

            const googleMapsAddress = responseAddress?.data?.result?.address || {};
            console.log('googleMapsAddress:', googleMapsAddress);

            // Generar ID de envío
            const trackingId = this.generateTrackingNumber();
            console.log('trackingId:', trackingId);

            // Insertar en la base de datos
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

            // Obtener el envío recién insertado
            const inserted = await this.findShipmentById(db, result.insertId);

            // Enviar notificación por correo electrónico
            const responseEmail = await sendEmailTemplateHtml({
                to: 'diego.ac9614@gmail.com',
                subject: 'Nuevo envío creado',
                templateName: 'shipment-created.ejs',
                params: {
                    userId,
                    weight,
                    dimensions,
                    productType,
                    destination: googleMapsAddress?.formattedAddress || 'Dirección no disponible',
                    status: inserted?.currentStatus || 'Pendiente',
                    trackingId,
                },
            });

            console.log('responseEmail:', responseEmail);

            return {
                success: true,
                statusCode: 201, // Created
                message: 'Shipment created successfully',
                shipment: inserted,
            };
        } catch (err) {
            console.error('Error en createShipment:', err.message);

            return {
                success: false,
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            };
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

    async findShipment(db, { id, userId }) {
        try {
            let query = 'SELECT * FROM shipments WHERE 1=1';
            const params = [];

            if (id) {
                query += ' AND id = ?';
                params.push(id);
            }
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }

            const [rows] = await db.query(query, params);
            return rows;
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findShipmentByUserId(db, userId) {
        try {
            const [rows] = await db.query('SELECT * FROM shipments WHERE user_id = ?', [userId]);
            return rows;
        } catch (err) {
            console.log('Error:', err?.message);
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

    async findShipmentById(db, id) {
        try {
            const [rows] = await db.query('SELECT * FROM shipments WHERE id = ?', [id]);
            return rows[0];
        } catch (err) {
            console.log('err:', err?.message);
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

    async markShipmentAsDelivered(db, id) {
        try {
            const shipment = await this.findShipmentById(db, id);
            if (!shipment) {
                const error = new Error(`Shipment with ID ${id} not found.`);
                error.status = 404;
                throw error;
            }
            if (shipment?.current_status === 'IN_TRANSIT') {
                await db.query(
                    `UPDATE shipments
                     SET current_status = ?
                     WHERE id = ?`,
                    ['DELIVERED', id]
                );
                return await this.findShipmentById(db, id);
            }
            const error = new Error(`Shipment with ID ${id} is not in transit.`);
            error.status = 400;
            throw error;
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findShipmentByIdDetails(db, id) {
        try {
            console.log('consultando shipment con detalles:', id);
            // fake timeout to simulate slow response
            await new Promise((resolve) => setTimeout(resolve, 5000));

            const shipment = await this.findShipmentById(db, id);
            if (!shipment) {
                const error = new Error(`Shipment with ID ${id} not found.`);
                error.status = 404;
                throw error;
            }
            const [rows] = await db.query('SELECT * FROM shipment_status_history WHERE shipment_id = ?', [id]);
            shipment.shipmentStatusHistory = camelcaseKeys(rows, { deep: true });

            const [rows2] = await db.query('SELECT * FROM shipment_metrics WHERE shipment_id = ?', [id]);
            shipment.shipmentMetrics = camelcaseKeys(rows2, { deep: true });

            return shipment;
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }
}

module.exports = ShipmentsService;
