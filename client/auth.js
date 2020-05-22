const axios = require('axios').default;
const extendURL = require('../utils/extendURL');

const State = require('./state');
const Clients = require('../authorizationServer/clients');

const client_id = Clients.get('client').client_id;
const client_secret = Clients.get('client').client_secret;

const {AUTH_HOST, AUTH_PORT} = process.env;

const authorizeURL = `http://${AUTH_HOST}:${AUTH_PORT}/authorize`;

const authServer = axios.create({
    baseURL: `http://${AUTH_HOST}:${AUTH_PORT}`,
    timeout: 5000
});

function redeemCode(code, session) {
    return authServer.post('/token', {
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        code
    }).then(response => response.data).then((data) => {
        const {access_token, refresh_token, scope, expires_in} = data;
        session.access_token = access_token;
        session.refresh_token = refresh_token;
        session.scope = scope;
        session.expires_in = expires_in;
        return data;
    }).catch((err) => {
        if (!err.response) return Promise.reject(err);
        const {error, error_description} = err.response.data;
        console.info('Failed to redeem authorization code ' + code.substr(0, 10));
        console.info('Error: ' + error + ' | ' + error_description);
        return Promise.reject({error, error_description});
    });
}

function requestAuthorization(res, scope, action) {
    return res.redirect(extendURL(authorizeURL, {
        response_type: 'code',
        client_id,
        scope,
        state: State.build({action}),
    }));
}

function refreshAccessToken(refresh_token, session) {
    return authServer.post('/token', {
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token,
    }).then(response => response.data).then((data) => {
        const {access_token, refresh_token, scope, expires_in} = data;
        session.access_token = access_token;
        session.refresh_token = refresh_token;
        session.scope = scope;
        session.expires_in = expires_in;
        return data;
    }).catch((err) => {
        if (!err.response) return Promise.reject(err);
        const {error, error_description} = err.response.data;
        console.info('Failed to redeem authorization code ' + code.substr(0, 10));
        console.info('Error: ' + error + ' | ' + error_description);
        return Promise.reject({error, error_description});
    });
}

module.exports = Object.freeze({
    redeemCode,
    requestAuthorization,
    refreshAccessToken,
});
