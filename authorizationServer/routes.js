const express = require('express');
const url = require('url');

const Clients = require('./clients');
const Users = require('./users');
const Authcodes = require('./codes');
const Tokens = require('./tokens');

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
    const client = Clients.get(client_id);

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
    if (!Clients.verifyScope(client_id, scope)) {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'invalid_scope',
            error_description: `Scope not allowed for this client: ${scope}`,
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
    const client = Clients.get(client_id);

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
    if (!Clients.verifyScope(client_id, scope)) {
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'invalid_scope',
            error_description: `Scope not allowed for this client: '${scope}'`,
            ...(state && {state})
        }));
    }

    // 4.1.2 Generate the auth code (bound to the user, client and scope)
    // We don't bind the code to the redirect uri because the redirect uri
    // is unique for each client (simplification)
    const code = Authcodes.generate({
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

    const client = Clients.get(client_id);

    // 5.2. The client is invalid so we don't have a redirect uri
    if (!client || client_secret !== client.client_secret) {
        return res.status(400).json({
            error: 'invalid_client',
            error_description: 'Invalid client ' + client_id,
        });
    }

    const grant = Authcodes.get(code);

    // 5.2. Invalid authorization code (invalid_grant)
    if (!grant) {
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code ' + client_id,
        });
    }

    const payload = {
        client_id: grant.client_id,
        user_id: grant.user_id,
        scope: grant.scope,
    };

    const { token, refreshToken, expiresIn, scope } = Tokens.generate(payload);

    return res.status(200).json({
        access_token: token,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: 'bearer',
        scope: scope,
    });
}

function middlewareRefreshToken(req, res) {
    // grant_type was checked
    // don't need redirect_uri because it is bound to the client
    const {
        client_id,
        client_secret,
        refresh_token,
    } = req.body;

    const client = Clients.get(client_id);

    // 5.2. The client is invalid so we don't have a redirect uri
    if (!client || client_secret !== client.client_secret) {
        return res.status(400).json({
            error: 'invalid_client',
            error_description: 'Invalid client ' + client_id,
        });
    }

    try {
        // refreshToken is the new one
        const { token, refreshToken, expiresIn, scope } = Tokens.refresh(refresh_token);

        return res.status(200).json({
            access_token: token,
            refresh_token: refreshToken,
            expires_in: expiresIn,
            token_type: 'bearer',
            scope: scope,
        });
    } catch (err) {
        return res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid or expired refresh token',
        });
    }
}

router.post('/verify', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.status(400).json({
            error: 'missing_token',
            error_message: 'Missing access token',
        });
    }

    const payload = Tokens.verify(token);

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

    const user = Users.get(username);

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

module.exports = router;
