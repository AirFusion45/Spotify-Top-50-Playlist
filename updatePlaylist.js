const axios = require('axios')
const fs = require('fs').promises

const auth = require('./auth.json')

// todo check if token has expired, if yes, make request to /refresh_token
var getTop50 = {
    method: 'get',
    url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0',
    headers: {
        'Authorization': `Bearer ${auth.access_token}`
    }
}
axios(getTop50).then(function (response) {
    console.log(JSON.stringify(response.data));
    // write to uris to file, for deletion later on
    // check uri file and call https://developer.spotify.com/console/delete-playlist-tracks/ to delete all tracks in playlist
    // https://developer.spotify.com/console/put-playlist-tracks/ - call this with the playlist id from the share link...
}).catch(function (error) {
    console.log(error);
});