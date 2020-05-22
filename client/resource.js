const axios = require('axios').default;
const Auth = require('./auth');

const {RESOURCE_HOST, RESOURCE_PORT} = process.env;

const resourceServer = axios.create({
    baseURL: `http://${RESOURCE_HOST}:${RESOURCE_PORT}/api`,
    timeout: 5000
});

resourceServer.interceptors.request.use((config) =>{
    if (config.token)
        config.headers['Authorization'] = `Bearer ${config.token}`;
    return config;
});

resourceServer.interceptors.response.use((response) => (response),
    (err) => {
        const { config, response } = err;

        // Return any error which is not due to authentication back to the calling service
        if (response.status !== 401) {
            return Promise.reject(err);
        }

        const {error, error_message} = err.response.data;
        console.info('Resource request error:');
        console.info(error + ': ' + error_message);

        // Don't refresh access tokens on access denied errors, for example
        if (error !== 'invalid_grant' && error !== 'invalid_token') {
            return Promise.reject(err);
        }

        const session = config.session;
        const { refresh_token } = session;

        // Try request again with new token
        return Auth.refreshAccessToken(refresh_token, session).then((_) => {
            return resourceServer.request(config);
        }).catch((error) => {
            Promise.reject(error);
        });
    },
);

module.exports = resourceServer;
