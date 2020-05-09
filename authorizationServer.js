const express = require("express");
const bodyParser = require('body-parser');
const cons = require('consolidate');
const __ = require('underscore');
const cors = require('cors');
__.string = require('underscore.string');

const router = require('./files/authorizationServer/routes');

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

app.use('/', express.static('files/authorizationServer'));

app.use(router);

const server = app.listen(9001, 'localhost', function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});
 
