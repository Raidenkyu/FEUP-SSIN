const express = require("express");
const cons = require('consolidate');
const bodyParser = require('body-parser');
const __ = require('underscore');
const cors = require('cors');
const axios = require('axios').default;

const app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for bearer tokens)
app.use(cors());

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './public');
app.set('json spaces', 4);

app.use('/', express.static('./public'));

const words = new Set(["antonio", "bruno", "joao"]);

/**
 * Access to authorization server
 */
const authServer = axios.create({
    baseURL: 'http://localhost:9001',
    timeout: 10000,
});

const scoped = (scope) => function (req, res, next) {
    const token = req.get('Authorization');

    if (!token) return res.status(401).json({
        message: 'Missing authorization header'
    });

    authServer.get('/introspect', {
        data: { token }
    }).then((response) => {
        const {valid, scopes} = response.data;

        if (!valid) return res.status(401).json({
            message: 'Invalid access token'
        });

        if (!scopes.includes(scope)) return res.status(401).json({
            message: 'Permission not granted'
        });

        req.scopes = scopes;
        next();
    }).catch((reason) => {
        console.info('Auth server introspect error: ' + reason);
        return res.status(401).json({
            message: 'Unexpected error validating access token'
        });
    });
}

/**
 * Actual word routes
 */
const WordsRouter = express.Router();

// Verify whether word exists
WordsRouter.get('/exists/:word', scoped('read'), function(req, res) {
    const { word } = req.params;
    return res.sendStatus(words.has(word) ? 204 : 404);
});

WordsRouter.get('/', scoped('read'), function(req, res) {
    return res.status(200).json(Array.from(words));
})

WordsRouter.get('/:word', scoped('read'), function(req, res) {
    const { word } = req.params;
    return res.sendStatus(501);
});

WordsRouter.put('/:word', scoped('write'), function(req, res) {
    const { word } = req.params;
    words.add(word);
    return res.sendStatus(204);
});

WordsRouter.post('/:word', scoped('write'), function(req, res) {
    const { word } = req.params;
    words.add(word);
    return res.sendStatus(204);
})

WordsRouter.delete('/:word', scoped('delete'), function(req, res) {
    const { word } = req.params;
    words.delete(word);
    return res.sendStatus(204);
});

app.use('/api', WordsRouter);

const server = app.listen(9002, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('OAuth Resource Server is listening at http://%s:%s', host, port);
});
