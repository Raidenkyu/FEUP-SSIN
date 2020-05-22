const express = require("express");

const State = require('./state');
const Auth = require('./auth');
const ResourceServer = require('./resource');
const Operations = require('./operations');

const router = express.Router();

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

    if (!statePayload) {
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

// Relay for a redirection to the authorization server's /authorize endpoint,
// required because we need to generate a state server-side
router.get('/authorize', function (req, res) {
    const { scope = "read write delete" } = req.query;
    return Auth.requestAuthorization(res, scope);
});

router.post('/submit', function (req, res) {
    const { operation, word } = req.body;
    const { scope = "", access_token } = req.session;

    if (!operation) {
        return res.status(400).json({
            error: 'missing_operation',
            error_message: `Missing operation value`,
        });
    }

    const opScope = Operations.getScope(operation);
    const requiresWord = Operations.requiresWord(operation);

    if (!opScope) {
        return res.status(400).json({
            error: 'invalid_operation',
            error_message: `Invalid operation ${operation}`,
        });
    }

    if (requiresWord && !word) {
        return res.status(400).json({
            error: 'invalid_request',
            error_message: 'Operation requires word',
        });
    }

    // Redirect the user to the authorization page if we do not have permission
    // to access the resource with the requested operation
    if (!scope || !scope.includes(opScope)) {
        const allScopes = scope ? scope.split(/\s+/).filter(e => e) : [];
        allScopes.push(opScope);
        return Auth.requestAuthorization(res, allScopes,
            {action: {operation, word}});
    }

    const token = access_token;

    function relaySuccess(response) {
        return res.status(200).json(response.data);
    }

    function relayError(error) {
        return res.status(500).json({
            code: error.status,
            details: error.response.data
        });
    }

    switch (operation) {
        case "readall":
            return ResourceServer.get('/', { token })
                .then(relaySuccess).catch(relayError);
        case "read":
            return ResourceServer.get('/' + word, { token })
                .then(relaySuccess).catch(relayError);
        case "write":
            return ResourceServer.put('/' + word, undefined, { token })
                .then(relaySuccess).catch(relayError);
        case "delete":
            return ResourceServer.delete('/' + word, undefined, { token })
                .then(relaySuccess).catch(relayError);
        default:
            console.info("Invalid operation %s", operation);
            return res.sendStatus(500);
    }
});

module.exports = router;
