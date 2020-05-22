const axios = require('axios').default;
const Auth = require('./auth');

const resourceServer = axios.create({
    baseURL: 'http://localhost:9002/api',
    timeout: 5000
});

resourceServer.interceptors.request.use((config) =>{
    if (config.token)
        config.headers['Authorization'] = `Bearer ${config.token}`;
    return config;
});

resourceServer.interceptors.response.use((response) => (response),
    (error) => {
        const { config, response } = error;

        // Return any error which is not due to authentication back to the calling service
        if (response.status !== 401) {
            return Promise.reject(error);
        }

        // Don't refresh access tokens on access denied errors, for example
        if (response.data.error !== 'invalid_grant') {
            return Promise.reject(error);
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
