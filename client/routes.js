const express = require("express");
const axios = require('axios').default;

const State = require('./state');
const Auth = require('./auth');
const Operations = require('./operations');

const router = express.Router();

const resourceServer = axios.create({
    baseURL: 'http://localhost:9002',
    timeout: 5000
});

resourceServer.interceptors.request.use((config) =>{
    if (config.token)
        config.headers['Authorization'] = `Bearer ${config.token}`;
    return config;
});

router.get('/callback', function (req, res) {
    const {
        error,
        error_description,
        code,
        state,
    } = req.query;

    if (error || !code) {
        // TODO: redirect to an error page or access denied page
        return res.status(400).json({ error, error_description });
    }

    const statePayload = State.parse(state);

    if (!statePayload || !statePayload.action) {
        return res.status(400).json({
            error: 'invalid_state',
            error_message: 'Returned state is invalid',
        });
    }

    const { action } = statePayload;

    return Auth.redeemCode(code, req.session).finally(() => {
        // TODO use action
        res.redirect('/');
    });
});

router.post('/submit', function (req, res) {
    const { operation, word } = req.query;
    const { scope, access_token } = req.session;

    const opScope = Operations.getScope(operation);

    if (!opScope) {
        return res.status(400).json({
            error: 'invalid_operation',
            error_message: `Invalid operation ${operation}`,
        });
    }

    // Redirect the user to the authorization page if we do not have permission
    // to access the resource with the requested operation
    if (!scope || !scope.includes(opScope)) {
        const allScopes = [...scope.split(/\s+/), opScope].join(' ');
        return requestAuthorization(res, allScopes);
    }

    const token = access_token;

    switch (operation) {
        case "readall":
            return resourceServer.get('/', { token })
                .then((response) => response.data).then((data) => {
                    res.status(200).json(data);
                });
        case "read":
            return resourceServer.get('/' + word, { token })
                .then((response) => response.data).then((data) => {
                    res.status(200).json(data);
                });
        case "write":
            return resourceServer.put('/' + word, undefined, { token })
                .then((response) => response.data).then((data) => {
                    res.status(200).json(data);
                });
        case "delete":
            return resourceServer.delete('/' + word, undefined, { token })
                .then((response) => response.data).then((data) => {
                    res.status(200).json(data);
                });
        default:
            console.info("Invalid operation %s", operation);
            return res.sendStatus(500);
    }
});

module.exports = router;
