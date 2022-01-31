/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var axios = require('axios'); // "Request" library
var FormData = require('form-data');
var cors = require('cors');
var querystring = require('qs');
var cookieParser = require('cookie-parser');

var client_id = 'd650f5c65de24114a7e99a283bf9e002'; // Your client id
var client_secret = '3d691a8ff8ce4a2c8a991d33e9af9f81'; // Your secret
var redirect_uri = 'http://localhost:8080/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', function (req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        // var authOptions = {
        //     url: 'https://accounts.spotify.com/api/token',
        //     form: {
        //         code: code,
        //         redirect_uri: redirect_uri,
        //         grant_type: 'authorization_code'
        //     },
        //     headers: {
        //         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        //     },
        //     json: true
        // };

        var callbackData = new FormData()
        callbackData.append('code', code, {contentType: 'application/x-www-form-urlencoded'})
        callbackData.append('grant_type', 'authorization_code')
        callbackData.append('redirect_uri', redirect_uri)

        var callbackConfig = {
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                // ...callbackData.getHeaders()
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            params: callbackData
        }

        axios(callbackConfig)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
                var access_token = response.body.access_token,
                    refresh_token = response.body.refresh_token;

                // var options = {
                //     url: 'https://api.spotify.com/v1/me',
                //     headers: { 'Authorization': 'Bearer ' + access_token },
                //     json: true
                // };
                // var apiAccessConfig = {
                //     method: 'get',
                //     url: 'https://api.spotify.com/v1/me',
                //     headers: {
                //         'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
                //     }
                // }
                // axios(apiAccessConfig)
                //     .then(function (response) {
                //         console.log(JSON.stringify(response.data));
                //     })
                //     .catch(function (error) {
                //         console.log(error);
                //     });
                // // use the access token to access the Spotify Web API
                // // request.get(options, function (error, response, body) {
                // //     console.log(body);
                // // });

                // // we can also pass the token to the browser to make requests from there
                // res.redirect('/#' +
                //     querystring.stringify({
                //         access_token: access_token,
                //         refresh_token: refresh_token
                //     }));
            })
            .catch(function (error) {
                console.log(error)
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            });
        // request.post(authOptions, function (error, response, body) {
        // if (!error && response.statusCode === 200) {

        // var access_token = body.access_token,
        //     refresh_token = body.refresh_token;

        // var options = {
        //     url: 'https://api.spotify.com/v1/me',
        //     headers: { 'Authorization': 'Bearer ' + access_token },
        //     json: true
        // };

        // // use the access token to access the Spotify Web API
        // request.get(options, function (error, response, body) {
        //     console.log(body);
        // });

        // // we can also pass the token to the browser to make requests from there
        // res.redirect('/#' +
        //     querystring.stringify({
        //         access_token: access_token,
        //         refresh_token: refresh_token
        //     }));
        // } else {
        // res.redirect('/#' +
        //     querystring.stringify({
        //         error: 'invalid_token'
        //     }));
        // }
        // });
    }
});

app.get('/refresh_token', function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var refreshData = new FormData();
    refreshData.append('grant_type', 'refresh_token')
    refreshData.append('refresh_token', refresh_token)

    // var authOptions = {
    //     method: 'post',
    //     url: 'https://accounts.spotify.com/api/token',
    //     headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    //     form: {
    //         grant_type: 'refresh_token',
    //         refresh_token: refresh_token
    //     },
    //     json: true
    // };

    var config = {
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            ...refreshData.getHeaders()
        },
        params: refreshData
    };

    axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.send({
                'access_token': response.body.access_token
            })
        })
        .catch(function (error) {
            console.log(error);
        });

    // request.post(authOptions, function (error, response, body) {
    //     if (!error && response.statusCode === 200) {
    //         var access_token = body.access_token;
    //         res.send({
    //             'access_token': access_token
    //         });
    //     }
    // });

});

app.listen(8080, () => {
    console.log(`Listening at http://localhost:${8080}`)
})