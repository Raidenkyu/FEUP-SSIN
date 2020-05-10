const express = require("express");
const bodyParser = require('body-parser');
const cons = require('consolidate');
const __ = require('underscore');
const cors = require('cors');
__.string = require('underscore.string');

const router = require('./files/authorizationServer/routes');
const clients = require('./files/authorizationServer/clients');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/authorizationServer');
app.set('json spaces', 4);

// authorization server information
const authServer = {
	authorizationEndpoint: 'http://localhost:9001/authorize',
	tokenEndpoint: 'http://localhost:9001/token'
};

const codes = {};

const requests = {};

app.get('/', function(req, res) {
	res.render('index', {clients: clients, authServer: authServer});
});

app.get('/authorize', function(req, res) {
  const client_id = req.query.client_id || '';
  const client_secret = req.query.client_secret || '';
  const scope = req.query.scope || '';
  const redirect_uris = req.query.redirect_uris || '';

  res.render('oauth_dialog', {client_id: client_id, client_secret, scope: scope, redirect_uris: redirect_uris});
});

app.use('/', express.static('files/authorizationServer'));

app.use(router);

const server = app.listen(9001, 'localhost', function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});
 
