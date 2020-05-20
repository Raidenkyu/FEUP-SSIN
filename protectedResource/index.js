const express = require("express");
const cons = require('consolidate');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios').default;

const router = require('./routes');
const words = require('./words');

const app = express();

app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for bearer tokens)
app.use(cors());

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', './protectedResource/public');
app.set('json spaces', 4);

app.use('/', express.static('./protectedResource/public'));

app.use('/api', router);

const server = app.listen(9002, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('OAuth Resource Server is listening at http://%s:%s', host, port);
});
