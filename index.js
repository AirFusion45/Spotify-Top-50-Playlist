/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
// require('dotenv').config({ path: '.env' })
var express = require('express'); // Express web server framework
var axios = require('axios'); // "Request" library
// var FormData = require('form-data');
var cors = require('cors');
var qs = require('qs');
var cookieParser = require('cookie-parser');
const { ObjectId } = require('mongodb');
const fs = require('fs').promises
const MongoClient = require('mongodb').MongoClient
const database = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })
// const auth = require('./auth.json')


var client_id = 'd650f5c65de24114a7e99a283bf9e002'; // Your client id
var client_secret = process.env.SPOTIFYSECRET; // Your secret
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
    var scope = 'playlist-modify-public playlist-modify-private user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        qs.stringify({
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

    console.log(code)
    console.log(state)
    console.log(storedState)

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            qs.stringify({
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


        // var callbackData = new FormData()
        // callbackData.append('code', code, {contentType: 'application/x-www-form-urlencoded'})
        // callbackData.append('grant_type', 'authorization_code')
        // callbackData.append('redirect_uri', redirect_uri)

        var callbackData = qs.stringify({
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirect_uri
        })

        var callbackConfig = {
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: callbackData
        }

        axios(callbackConfig)
            .then(async function (response) {
                console.log(response.data);
                var access_token = response.data.access_token,
                    refresh_token = response.data.refresh_token;
                var writeData = response.data
                writeData.exp = new Date().getTime() + (response.data.expires_in * 1000)
                database.connect(async (err, dbClient) => {
                    if (err) console.error(err)
                    const collection = dbClient.db('spotifytop50DB').collection('auth')
                    await collection.updateOne({ token_type: "Bearer" }, { $set: writeData })
                    database.close()
                })
                // await fs.writeFile('auth.json', JSON.stringify(response.data))

                // var options = {
                //     url: 'https://api.spotify.com/v1/me',
                //     headers: { 'Authorization': 'Bearer ' + access_token },
                //     json: true
                // };

                // var apiAccessConfig = {
                //     method: 'get',
                //     url: 'https://api.spotify.com/v1/me',
                //     headers: {
                //         'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                //         'Content-Type': 'application/x-www-form-urlencoded'
                //     }
                // }
                // axios(apiAccessConfig)
                //     .then(function (response) {
                //         console.log(JSON.stringify(response.data));
                //     })
                //     .catch(function (error) {
                //         // console.log(error);
                //     });
                // // use the access token to access the Spotify Web API
                // // request.get(options, function (error, response, body) {
                // //     console.log(body);
                // // });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    qs.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            })
            .catch(function (error) {
                console.log(error)
                res.redirect('/#' +
                    qs.stringify({
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

// app.get('/refresh_token', function (req, res) {
function refreshToken(refresh_token) {
    // requesting access token from refresh token
    // var refresh_token = req.query.refresh_token;

    // var refreshData = new FormData();
    // refreshData.append('grant_type', 'refresh_token')
    // refreshData.append('refresh_token', refresh_token)

    var refreshData = qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    })

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
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: refreshData
    };

    axios(config)
        .then(async function (response) {
            console.log(JSON.stringify(response.data));
            var writeData = response.data
            writeData.exp = new Date().getTime() + (response.data.expires_in * 1000)
            // await fs.writeFile('auth.json', JSON.stringify(response.data))
            database.connect(async (err, dbClient) => {
                if (err) console.error(err)
                const collection = dbClient.db('spotifytop50DB').collection('auth')
                await collection.updateOne({ token_type: "Bearer" }, { $set: writeData })
                database.close()
            })
            // res.send({
            //     'access_token': response.data.access_token
            // })
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

}

app.get('/update', (err, res) => {
    database.connect(async (err, dbClient) => {
        var collectionFind = await dbClient.db('spotifytop50DB').collection('auth').find({ token_type: "Bearer" }).toArray()
        collectionFind = collectionFind[0]
        // todo check if token has expired, if yes, make request to /refresh_token
        if (collectionFind.exp < Date.now()) { // token has expired
            // make request to /refresh_token
            // axios.get('http://localhost:8080/refresh_token', {
            //     params: {
            //         refresh_token: auth.refresh_token
            //     }
            // }).then(function (response) {
            //     exec()
            // }).catch(function (error) {

            // })
            refreshToken(collectionFind.refresh_token)
        } else {
            exec()
        }

        function exec() {
            var getTop50 = {
                method: 'get',
                url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0',
                headers: {
                    'Authorization': `Bearer ${collectionFind.access_token}`
                }
            }
            axios(getTop50).then(async function (top50response) {
                // console.log(JSON.stringify(response.data));
                // check uri file and call https://developer.spotify.com/console/delete-playlist-tracks/ to delete all tracks in playlist
                // var uri = require('./uris.json')
                var uriCollectionFind = await dbClient.db('spotifytop50DB').collection('uris').find({ _id:ObjectId(process.env.URIDOCID) }).toArray()
                uriCollectionFind = uriCollectionFind[0].arr
                if (uriCollectionFind !== '') { // uris exist, delete all tracks in playlist
                    console.log('deleting all tracks in playlist')
                    // assemble uri array
                    var rawPayload = {
                        "tracks": []
                    }
                    console.log(uriCollectionFind.length)
                    for (var i = 0; i < uriCollectionFind.length; i++) {
                        rawPayload.tracks.push({ "uri": uriCollectionFind[i] })
                    }
                    console.log(rawPayload)
                    // console.log(JSON.stringify(rawPayload))
                    var deleteOldList = {
                        method: 'delete',
                        url: `https://api.spotify.com/v1/playlists/${process.env.PLAYLISTID}/tracks`, // regex the playlist id out later
                        headers: {
                            'Authorization': `Bearer ${collectionFind.access_token}`
                        },
                        data: JSON.stringify(rawPayload)
                    }
                    var deleteOldListResponse = await axios(deleteOldList)
                    console.log(JSON.stringify(deleteOldListResponse.data))
                }
                // write to uris to file, for deletion later on
                var uriArr = top50response.data.items.map(item => item.uri)
                const collectionURI = dbClient.db('spotifytop50DB').collection('uris')
                // await collectionURI.insertOne({ token_type: "Bearer" }, { $set: writeData })
                await collectionURI.insertOne({ arr: uriArr })
                // await fs.writeFile('uris.json', JSON.stringify(top50response.data.items.map(item => item.uri)))
                // uri = require('./uris.json')
                // https://developer.spotify.com/console/put-playlist-tracks/ - call this with the playlist id from the share link...
                var addToList = {
                    method: 'put',
                    url: `https://api.spotify.com/v1/playlists/${process.env.PLAYLISTID}/tracks?uris=${uriArr.join(',')}`, // regex the playlist id out later
                    headers: {
                        'Authorization': `Bearer ${collectionFind.access_token}`
                    }
                }
                var addToListResponse = await axios(addToList)
                console.log(JSON.stringify(addToListResponse.data));
                res.sendStatus(200)
            }).catch(function (error) {
                console.log(error);
            });
        }
    })
})
app.listen(8080, () => {
    console.log(`Listening at http://localhost:${8080}`)
})