const express = require('express');
const session = require('express-session');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const clients = require('./clients');
const users = require('./users');
const tokens = require('./tokens');
const url = require('url');

const privateKEY = fs.readFileSync('keys/private.pem', 'utf8');
const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const router = express.Router();

const signOptions = {
    expiresIn: "1h",
    algorithm: "HS512",
};

// https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
// https://www.oauth.com/playground/authorization-code.html
router.post('/new_token', (req, res) => {
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

router.get('/authorize', (req, res) => {
    const {
        response_type,
        client_id,
        state
    } = req.query;

    const { user } = req.session;

    const client = clients.get(client_id);
    if (!client) {
        // TODO friendly html page response
        return res.status(400).json({
            error: 'invalid_client',
            message: 'Invalid client ' + client_id,
        });
    }

    const redirect_uri = client.redirect_uri;
    const scope = client.scope;

    if (response_type !== 'code') {
        return res.redirect(303, redirect_uri + '?' + qs.stringify({
            error: 'unsupported_response_type',
            error_description: 'Invalid response type (code required)',
            ...(state && {state}),
        }));
    }

    // If there is no signed in user, redirect the user's agent to the
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

    return res.render('oauth_dialog');
});

router.post('/authorize', (req, res) => {
    // TODO
})

// https://tools.ietf.org/html/rfc6749#section-2.3
function middlewareAuthorizationCode(req, res) {
    const {
        client_id,
        client_secret,
        code,
    };
    // TODO
}

function middlewareRefreshToken(req, res) {
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
        return req.status(400).
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
