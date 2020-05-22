require('dotenv').config().parsed;
const {RESOURCE_HOST, RESOURCE_PORT} = process.env;

const express = require("express");
const cons = require('consolidate');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const router = require('./routes');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));
app.use(cors());

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './protectedResource/public');
app.set('json spaces', 4);

app.use('/', express.static('./protectedResource/public'));

app.use('/api', router);

const server = app.listen(RESOURCE_PORT, RESOURCE_HOST, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.log('OAuth Resource Server is listening at http://%s:%s', host, port);
});
