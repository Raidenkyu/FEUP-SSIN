const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const clients = require('./clients');
const tokens = require('./tokens');

var privateKEY = fs.readFileSync('files/keys/private.pem', 'utf8');
var publicKEY = fs.readFileSync('files/keys/private.pem', 'utf8');

var signOptions = {
    expiresIn: "1h",
    algorithm: "HS512",
};


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

router.get('/introspection', (req, res) => {
    res.json({
        publicKey: publicKEY,
    });
});

module.exports = router;