const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

const router = require('./routes');
const Clients = require('./clients');

const privateKEY = fs.readFileSync('keys/private.pem', 'utf8');
const publicKEY = fs.readFileSync('keys/public.pem', 'utf8');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(cors());
app.use(session({
    secret: "cwfow131241dfeg",
    resave: false,
    saveUninitialized: true,
}));

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './authorizationServer/public');
app.set('json spaces', 4);

// authorization server information
const authServer = Object.freeze({
    publicKey: publicKEY,
    privateKey: privateKEY,
	authorizationEndpoint: 'http://localhost:9001/authorize',
    tokenEndpoint: 'http://localhost:9001/token',
    loginEndpoint: 'http://localhost:9001/login',
});

app.get('/', function(_req, res) {
    const clients = Clients.getAll();

	res.render('index', {clients, authServer});
});

app.use('/', express.static('./authorizationServer/public', {
    extensions: ['html', 'htm'],
}));

app.use('/', router);

const server = app.listen(9001, 'localhost', function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});
