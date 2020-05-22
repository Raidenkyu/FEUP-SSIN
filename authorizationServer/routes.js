const express = require('express');
const url = require('url');

const clients = require('./clients');
const users = require('./users');
const authcodes = require('./codes');
const tokens = require('./tokens');

const extendURL = require('../utils/extendURL');

const router = express.Router();

// 4.1.1. Authorization request
router.get('/authorize', (req, res) => {
    // 4.1.1
    const {
        response_type,
        client_id,
        scope,
        state
    } = req.query;

    const { user } = req.session;
    const client = clients.get(client_id);

    // 4.1.2.1. The client is invalid so we don't have a redirect uri
    if (!client) {
        // TODO friendly html page response
        return res.status(400).json({
            error: 'invalid_client',
            message: 'Invalid client ' + client_id,
        });
    }

    const redirect_uri = new URL(client.redirect_uri);

    // 4.1.2.1. Check scope (invalid_scope)
    if (!clients.verifyScope(client_id, scope)) {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'invalid_scope',
            error_description: 'Scope not allowed for this client',
            ...(state && {state})
        }));
    }

    // 4.1.2.1. Check response type (unsupported_response_type)
    if (response_type !== 'code') {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'unsupported_response_type',
            error_description: 'Invalid response type (code required)',
            ...(state && {state}),
        }));
    }

    // if there is no signed in user, redirect the user's agent to the
    // interactive login page with this endpoint as the callback.
    if (!user) {
        return res.redirect(303, url.format({
            pathname: '/login',
            query: {
                callback: url.format({
                    pathname: '/authorize',
                    query: req.query
                })
            },
        }));
    }

    // Ask the user for authorization
    // TODO: csrf token
    return res.render('oauth_dialog', {
        client_id: client.client_id,
        scope: scope,
        state: state,
        // plus random useful information
        client_name: client.client_id, // idk...
    });
});

// Handle user authorization grant (oauth_dialog form submission)
// TODO: csrf token
router.post('/authorize', (req, res) => {
    const {
        client_id,
        scope,
        state,
        allow = true
    } = req.body;

    const { user } = req.session;
    const client = clients.get(client_id);

    // Check everything again...

    // 4.1.2.1. The client is invalid so we don't have a redirect uri
    if (!client) {
        // TODO friendly html page response
        return res.status(400).json({
            error: 'invalid_client',
            message: 'Invalid client ' + client_id,
        });
    }

    const redirect_uri = new URL(client.redirect_uri);

    // 4.1.2.1. Check scope (invalid_scope)
    if (!clients.verifyScope(client_id, scope)) {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'invalid_scope',
            error_description: 'Scope not allowed for this client',
            ...(state && {state})
        }));
    }

    // 4.1.2 Generate the auth code (bound to the user, client and scope)
    // We don't bind the code to the redirect uri because the redirect uri
    // is unique for each client (simplification)
    const code = authcodes.generate({
        user_id: user.user_id,
        client_id: client.client_id,
        scope: scope,
    })

    // 4.1.2.1. The user denied access (access_denied)
    if (!allow) {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'access_denied',
            error_description: 'User denied access to these scopes',
            ...(state && {state})
        }));
    // 4.1.2. The user authorized access
    } else {
        return res.redirect(303, extendURL(redirect_uri, {
             code,
             scope,
             ...(state && {state})
         }));
    }
});

router.post('/token', (req, res) => {
    const { grant_type } = req.body;

    if (grant_type === 'authorization_code')
        return middlewareAuthorizationCode(req, res);

    if (grant_type === 'refresh_token')
        return middlewareRefreshToken(req, res);

    const message = 'Only the authorization code flow is supported by this OAuth2 server';

    return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: message,
    })
});

// 4.1.3. Access token request
function middlewareAuthorizationCode(req, res) {
    // grant_type was checked
    // don't need redirect_uri because it is bound to the client
    const {
        client_id,
        client_secret,
        code,
    } = req.body;

    const client = clients.get(client_id);

    // 5.2. The client is invalid so we don't have a redirect uri
    if (!client || client_secret !== client.client_secret) {
        return res.status(400).json({
            error: 'invalid_client',
            error_description: 'Invalid client ' + client_id,
        });
    }

    const grant = authcodes.get(code);

    // 5.2. Invalid authorization code (invalid_grant)
    if (!grant) {
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code ' + client_id,
        });
    }

    const { token, refreshToken, expiresIn } = tokens.generate({
        client_id: grant.client_id,
        user_id: grant.user_id,
        scope: grant.scope,
    });

    return res.status(200).json({
        access_token: token,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: 'bearer',
        scope: grant.scope,
    })
}

function middlewareRefreshToken(req, res) {
    // grant_type was checked
    // don't need redirect_uri because it is bound to the client
    const {
        client_id,
        client_secret,
        refresh_token,
    } = req.body;

    const client = clients.get(client_id);

    // 5.2. The client is invalid so we don't have a redirect uri
    if (!client || client_secret !== client.client_secret) {
        return res.status(400).json({
            error: 'invalid_client',
            error_description: 'Invalid client ' + client_id,
        });
    }

    // TODO
}

router.post('/verify', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.status(400).json({
            error: 'missing_token',
            error_message: 'Missing access token',
        });
    }

    const payload = tokens.verify(token);

    if (!payload) {
        return res.status(400).json({
            error: 'invalid_token',
            error_message: 'Invalid or expired access token',
        });
    }

    return res.status(200).json({
        payload: payload,
    });
});

router.get('/login', (req, res) => {
    res.render('login', req.query);
});

router.post('/login', (req, res) => {
    const {
        username,
        password,
        callback,
    } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: 'invalid_request',
            error_message: 'Missing user credentials',
        });
    }

    const user = users.get(username);

    if (!user || user.password !== password) {
        return res.status(401).json({
            error: 'invalid_credentials',
            error_message: 'Invalid user credentials',
        });
    }

    req.session.user = user;

    if (callback) {
        res.redirect(callback);
    } else {
        res.status(200).json({ message: 'Login successful' });
    }
});

router.get('/introspection', (req, res) => {
    res.status(200).json({
        public_key: publicKEY,
    });
});

// Deprecated, move to /token with grant_type == refresh_token
router.post('/refresh', (req, res) => {
    const clientId = req.body.clientId || '';
    const clientSecret = req.body.clientSecret || '';
    const refreshToken = req.body.refreshToken || '';

    const payload = clients.filter(
        client => (client.client_id === clientId && client.client_secret === clientSecret)
    )[0];

    if ((payload != null) && (refreshToken != null) && (refreshToken in tokens)) {
        const token = jwt.sign(payload, privateKEY, signOptions)

        const response = {
            token: token,
        };

        tokens[refreshToken].token = token;
        res.status(200).json(response);
    }
    else if (payload == null) {
        res.status(404).json({
            message: "User not found",
        });
    }
    else {
        res.status(404).json({
            message: "Invalid refresh token",
        });
    }
});

module.exports = router;
