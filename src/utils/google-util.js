const axios = require('axios');

const googleApiKey = process.env.GOOGLE_ADDRESS_KEY;

// https://developers.google.com/maps/documentation/address-validation/requests-validate-address
const validateAddress = async (address) => {
    try {
        const endpoint = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${googleApiKey}`;
        const body = {
            address,
        };

        console.log('body:', body);

        const response = await axios.post(endpoint, body);
        const data = response.data;
        return {
            status: true,
            isValid: data.result?.verdict?.addressComplete,
            data,
        };
    } catch (err) {
        console.error('Error validation address:', err);
        return {
            status: false,
            message: err?.message,
        };
    }
};

module.exports = {
    validateAddress,
};
