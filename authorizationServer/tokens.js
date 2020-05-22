const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKEY = fs.readFileSync('keys/private.pem', 'utf8');
const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const accessTokenOptions = {
    expiresIn: "1h",
    algorithm: "RS256",
};

const refreshTokenOptions = {
    algorithm: "RS256",
};

const verifyOptions = {
    algorithms: ["RS256"],
}

const tokens = new Map();

/**
 * Generate an access/refresh token pair for an authorization grant
 */
function generate({ client_id, user_id, scope }) {
    const payload = { client_id, user_id, scope };
    const token = jwt.sign(payload, privateKEY, accessTokenOptions)
    const refreshToken = jwt.sign(payload, privateKEY, refreshTokenOptions);
    tokens.set(refresh, token);
    return { token, refreshToken };
}

/**
 * Verify an access token
 */
function verify(token) {
    return jwt.verify(token, publicKEY, verifyOptions);
}

/**
 * Refresh an access token
 */
function refresh(refreshToken) {
    if (tokens[refreshToken]) {
        return jwt.verify((err, payload) => {
            if (err) {
                return res.status(401).json({
                    error: 'invalid_token',
                    error_message: 'Invalid access token',
                });
            }
            else {
                const token = jwt.sign(payload, privateKEY, accessTokenOptions);
                tokens.set(refreshToken, token);
                return {
                    access_token: token,
                };
            }
        });
    }

    return res.status(404).json({
        error: 'invalid_refresh_token',
        error_message: 'Refresh Token is not valid',
    });
}

module.exports = Object.freeze({
    generate, verify, refresh
});
