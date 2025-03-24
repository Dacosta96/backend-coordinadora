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

            const emaulUser = await this.findUserById(db, userId);

            // Enviar notificación por correo electrónico
            const responseEmail = await sendEmailTemplateHtml({
                to: emaulUser.email || '',
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

    async updateShipmentState(db, id, state) {
        console.log('updateShipmentState:', id, state);
        try {
            const [result] = await db.query(`UPDATE shipments SET current_status = ? WHERE id = ?`, [state, id]);

            if (result.affectedRows === 0) {
                const error = new Error(`Shipment with ID ${id} not found.`);
                error.status = 404;
                throw error;
            }

            // Obtener los datos del envío actualizado
            const updatedShipment = await this.findShipmentById(db, id);
            // Si el estado es IN_TRANSIT, enviar notificación por correo
            if (state === 'IN_TRANSIT') {
                console.log('Enviando correo de notificación de envío en tránsito...');
                const emailUser = await this.findUserById(db, updatedShipment.user_id);

                const responseEmail = await sendEmailTemplateHtml({
                    to: emailUser.email || '',
                    subject: 'Tu envio está en tránsito',
                    templateName: 'shipment-transit.ejs',
                    params: {
                        userId: updatedShipment.userId,
                        weight: updatedShipment.weight,
                        dimensions: updatedShipment.dimensions,
                        productType: updatedShipment.productType,
                        destination: updatedShipment.google_map_address?.formattedAddress || 'Dirección no disponible',
                        status: updatedShipment.current_status || 'Pendiente',
                        trackingId: updatedShipment.tracking_id,
                    },
                });

                console.log('Correo enviado:', responseEmail);
            }

            return updatedShipment;
        } catch (err) {
            console.error('Error updating shipment state:', err?.message);
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

            if (shipment.current_status === 'IN_TRANSIT') {
                await db.query(
                    `UPDATE shipments
                     SET current_status = ?
                     WHERE id = ?`,
                    ['DELIVERED', id]
                );

                const updatedShipment = await this.findShipmentById(db, id);
                console.log('updatedShipment:', updatedShipment);
                // Enviar notificación por correo si estaba en tránsito
                console.log('Enviando correo de notificación de entrega...');
                const emailUser = await this.findUserById(db, updatedShipment.user_id);

                const responseEmail = await sendEmailTemplateHtml({
                    to: emailUser.email || '',
                    subject: 'Tu envío ha sido entregado',
                    templateName: 'shipment-delivered.ejs',
                    params: {
                        userId: updatedShipment.userId,
                        weight: updatedShipment.weight,
                        dimensions: updatedShipment.dimensions,
                        productType: updatedShipment.productType,
                        destination: updatedShipment.google_map_address?.formattedAddress || 'Dirección no disponible',
                        status: updatedShipment.current_status || 'Pendiente',
                        trackingId: updatedShipment.tracking_id,
                    },
                });

                console.log('Correo de entrega enviado:', responseEmail);
                return updatedShipment;
            }

            const error = new Error(`Shipment with ID ${id} is not in transit.`);
            error.status = 400;
            throw error;
        } catch (err) {
            console.log('Error:', err?.message);
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

    async findWaitingShipments(db) {
        try {
            const [rows] = await db.query(
                `
                SELECT s.*, u.email 
                FROM shipments s
                JOIN users u ON user_id = u.id
                WHERE s.current_status = ?`,
                ['WAITING']
            );
            return camelcaseKeys(rows, { deep: true });
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findInTransitShipments(db) {
        try {
            const [rows] = await db.query(
                `
                SELECT s.*, u.email 
                FROM shipments s
                JOIN users u ON user_id = u.id
                WHERE s.current_status = ?`,
                ['IN_TRANSIT']
            );
            return camelcaseKeys(rows, { deep: true });
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async findAllRoutes(db) {
        try {
            const [rows] = await db.query('SELECT * FROM routes');
            return camelcaseKeys(rows, { deep: true });
        } catch (err) {
            console.log('err:', err?.message);
            throw err;
        }
    }

    async createAssignment(db, assignmentData) {
        try {
            const { shipmentId, routeId } = assignmentData;

            if (!shipmentId || !routeId) {
                return {
                    success: false,
                    statusCode: 400,
                    message: 'Both shipmentId and routeId are required.',
                };
            }

            // Insertar en la base de datos
            const [result] = await db.query(`INSERT INTO route_assignments (shipment_id, route_id) VALUES (?, ?)`, [
                shipmentId,
                routeId,
            ]);

            return {
                success: true,
                statusCode: 201,
                message: 'Route assignment created successfully',
                assignment: { id: result.insertId, shipmentId, routeId },
            };
        } catch (err) {
            console.error('Error in createAssignment:', err.message);

            return {
                success: false,
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            };
        }
    }

    async getShipmentIndicators(db) {
        try {
            // Obtener total de registros
            const [[{ totalShipments }]] = await db.query('SELECT COUNT(*) AS totalShipments FROM shipments');

            // Contar los registros por estado
            const [statusRows] = await db.query(`
                SELECT current_status, COUNT(*) AS count
                FROM shipments
                GROUP BY current_status
            `);
            const statusCounts = statusRows.reduce((acc, row) => {
                acc[row.current_status] = row.count;
                return acc;
            }, {});

            // Sumar el peso total
            const [[{ totalWeight }]] = await db.query('SELECT COALESCE(SUM(weight), 0) AS totalWeight FROM shipments');

            return {
                success: true,
                statusCode: 200,
                data: {
                    totalShipments,
                    statusCounts,
                    totalWeight,
                },
            };
        } catch (err) {
            console.error('Error en getShipmentIndicators:', err.message);
            return {
                success: false,
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            };
        }
    }

    async getDailyShipmentCounts(db) {
        try {
            const [dailyShipments] = await db.query(`
                SELECT DATE(created_at) AS shipmentDate, COUNT(*) AS totalShipments
                FROM shipments
                GROUP BY shipmentDate
                ORDER BY shipmentDate DESC
            `);

            return {
                success: true,
                statusCode: 200,
                data: dailyShipments,
            };
        } catch (err) {
            console.error('Error en getDailyShipmentCounts:', err.message);
            return {
                success: false,
                statusCode: 500,
                message: 'Internal server error. Please try again later.',
            };
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
}

module.exports = ShipmentsService;
