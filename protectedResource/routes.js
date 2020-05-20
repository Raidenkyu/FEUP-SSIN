const express = require("express");
const jwt = require('jsonwebtoken');
const fs = require('fs');

const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const verifyOptions = {
    algorithms: ["HS512"],
};

function verify(token, callback) {
    jwt.verify(token, publicKEY, verifyOptions, callback);
}

const scoped = (scope) => function (req, res, next) {
    const token = req.get('Authorization');

    if (!token) {
        return res.status(401).json({
            error: 'missing_token',
            error_message: 'Missing authorization header',
        });
    }

    verify(token, (err, payload) => {
        if (err || !payload.scope) {
            return res.status(401).json({
                error: 'invalid_token',
                error_message: 'Invalid access token',
            });
        }

        if (!payload.scope.split(/\s+/.includes(scope))) {
            return res.status(401).json({
                error: 'invalid_scope',
                error_message: 'Invalid scope',
            });
        }

        req.authorization = payload;
        next();
    });
}

const router = express.Router();

// Verify whether word exists
router.get('/exists/:word', scoped('read'), function(req, res) {
    const { word } = req.params;
    return res.sendStatus(words.has(word) ? 204 : 404);
});

router.get('/', scoped('read'), function(req, res) {
    return res.status(200).json(Array.from(words));
})

router.get('/:word', scoped('read'), function(req, res) {
    const { word } = req.params;
    return res.sendStatus(501);
});

router.put('/:word', scoped('write'), function(req, res) {
    const { word } = req.params;
    words.add(word);
    return res.sendStatus(204);
});

router.post('/:word', scoped('write'), function(req, res) {
    const { word } = req.params;
    words.add(word);
    return res.sendStatus(204);
})

router.delete('/:word', scoped('delete'), function(req, res) {
    const { word } = req.params;
    words.delete(word);
    return res.sendStatus(204);
});

module.exports = router;
