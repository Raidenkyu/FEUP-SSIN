const express = require("express");
const axios = require('axios').default;

const clients = require('../authorizationServer/clients');

const router = express.Router();

const client_id = clients.get('client').client_id;
const client_secret = clients.get('client').client_secret;

const authServer = axios.create({
    baseURL: 'http://localhost:9001',
    timeout: 5000
});

async function redeem(code) {
    return authServer.post('/token', {
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        code
    }).then(response => response.data);
}

// Access token, refresh token etc
const auth = {};

router.get('/callback', function (req, res) {
    const {
        error,
        error_description,
        code,
        state,
    } = req.query;

    if (error || !code) {
        // TODO: redirect to an error page or access denied page
        res.status(400).json({ error, error_description });
    }

    // redeem authorization code
    redeem(code).then(({access_token, refresh_token, scope, expires_in}) => {
        Object.assign(auth, {access_token, refresh_token, scope, expires_in});
    }).catch(({error, error_description}) => {
        console.info('Failed to redeem authorization code ' + code.substr(0, 10));
        console.info('Error: ' + error + ' | ' + error_description);
    }).finally(() => {
        res.redirect('/');
    });
});

router.get('/submit', function(req,res){
    let scope = req.query.scope;
    let word = req.query.resource;

    if(auth.scope){
        const resourceServer = axios.create({
            baseURL:'http://localhost:9002',
            timeout: 5000
        });
        
        resourceServer.interceptors.request.use((config) =>{
            if(auth.access_token)
                config.headers['Authorization'] = auth.access_token;
            return config;
        });

        if(auth.scope.includes(scope)){
            switch(scope){
                case "read":
                    resourceServer.get('/' + word);
                    break;
                case "write":
                    resourceServer.put('/' + word);
                    break;
                case "delete":
                    resourceServer.delete('/' + word);
                    break;
                default:
                    console.info("Illegal Scope name");
            }
        } 
        return;
    }
    
    res.redirect(`http://localhost:9001/authorize?response_type=code&client_id=${client_id}&scope=${scope}&state=`)

})
    module.exports = router;
