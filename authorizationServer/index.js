const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const cons = require('consolidate');
const __ = require('underscore');
const cors = require('cors');
__.string = require('underscore.string');

const router = require('./routes');
const clients = require('./clients');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(session({secret:"cwfow131241dfeg",resave:false,saveUninitialized:true}));

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './authorizationServer/public');
app.set('json spaces', 4);

// authorization server information
const authServer = {
	authorizationEndpoint: 'http://localhost:9001/authorize',
	tokenEndpoint: 'http://localhost:9001/token'
};

const codes = {};

const requests = {};

app.use('/', express.static('./authorizationServer/public'));

app.use(router);

const server = app.listen(9001, 'localhost', function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('OAuth Authorization Server is listening at http://%s:%s', host, port);
});
