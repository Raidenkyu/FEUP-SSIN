const express = require('express');
const session = require('express-session');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const url = require('url');

const clients = require('./clients');
const users = require('./users');
const authcodes = require('./codes');

const privateKEY = fs.readFileSync('keys/private.pem', 'utf8');
const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const router = express.Router();

const signOptions = {
    expiresIn: "1h",
    algorithm: "HS512",
};

function extendURL(url, extraParams) {
    const params = new URLSearchParams(url.search);
    for (const [key, value] of Object.entries(extraParams))
        params.set(key, value);
    url.search = params;
    return url;
}

// https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
// https://www.oauth.com/playground/authorization-code.html
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

    if (!allow) {
        // 4.1.2.1. The user denied access
        return res.redirect(303, extendURL(redirect_uri, {
            error: 'access_denied',
            error_message: 'User denied access to these scopes',
            ...(state && {state})
        }));
    } else {
        // 4.1.2. The user authorized access
        return res.redirect(303, extendURL(redirect_uri, {
             code,
             ...(state && {state})
         }));
    }
})

// 4.1.3. Access token request
function middlewareAuthorizationCode(req, res) {
    // grant_type was checked
    const {
        client_id,
        client_secret,
        code,
    };
}

function middlewareRefreshToken(req, res) {
    // grant_type was checked
    const {
        refresh_token,
    };
    // TODO
}

router.post('/token', (req, res) => {
    const clientId = req.body.client_id || '';
    const clientSecret = req.body.client_secret || '';
    const scope = req.body.scope || '';
    const redirectURI = req.body.redirect_uris || '';

    let payload = clients.filter(
        client => (client.client_id == clientId)
    )[0];

    if (payload != null) {
        if (payload.client_secret != clientSecret) {
            res.status(400).json({
                message: 'Unauthorized: Invalid Client Secret',
            });
        }
    }
    else {
        payload = {
            client_id: clientId,
            client_secret: clientSecret,
            scope: scope,
            redirect_uris: [redirectURI],
        };

        clients.push(payload);
    }

    const token = jwt.sign(payload, privateKEY, signOptions)
    const refreshToken = jwt.sign(payload, privateKEY, { algorithm: "HS512" });

    const response = {
        token: token,
        refreshToken: refreshToken,
    };

    tokens[refreshToken] = response;

    res.redirect(`${redirectURI}?access_token=${token}&refresh_token=${refreshToken}&scope=${scope}`);

});

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

router.post('/verify', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token']
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, publicKEY, (err, decoded) => {
            if (err) {
                return res.status(401).json({ "message": 'Unauthorized access.' });
            }
            res.status(200).json({
                decoded: decoded,
            });
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).json({
            "message": 'Invalid Token.'
        });
    }
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return req.status(400)
    }
    const clientId = req.body.client_id || '';
    const clientSecret = req.body.client_secret || '';
    const scope = req.body.scope || '';
    const redirectURI = req.body.redirect_uris || '';

    let user = users.filter(
        user => (user.id == req.body.uname && user.password === req.body.psw)
    )[0];
    req.session.user = user;
    res.redirect(`http://localhost:9001/authorize?client_id=${clientId}&client_secret=${clientSecret}&scope=${scope}&redirect_uris=${redirectURI}`)
});

router.get('/introspection', (req, res) => {
    res.json({
        publicKey: publicKEY,
    });
});

module.exports = router;
