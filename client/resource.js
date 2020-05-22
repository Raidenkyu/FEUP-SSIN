const axios = require('axios').default;
const Auth = require('./auth');

const resourceServer = axios.create({
    baseURL: 'http://localhost:9002',
    timeout: 5000
});

resourceServer.interceptors.request.use((config) =>{
    if (config.token)
        config.headers['Authorization'] = `Bearer ${config.token}`;
    return config;
});

resourceServer.interceptors.response.use((response) => (response),
    (error) => {
        // Return any error which is not due to authentication back to the calling service
        if (error.response.status !== 401) {
            return new Promise((_resolve, reject) => {
                reject(error);
            });
        }

        // Try request again with new token
        return Auth.refreshAccessToken()
            .then((res) => {

                const config = error.config;

                if (res.data.access_token) {
                    //Set new access token
                    console.log(config);
                }

                return new Promise((resolve, reject) => {
                    axios.request(config).then((response) => {
                        resolve(response);
                    }).catch((error) => {
                        reject(error);
                    });
                });

            })
            .catch((error) => {
                Promise.reject(error);
            });
    },
);

module.exports = resourceServer;