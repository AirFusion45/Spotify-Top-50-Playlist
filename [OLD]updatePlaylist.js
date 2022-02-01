const axios = require('axios')
const fs = require('fs').promises

const auth = require('./auth.json')

// todo check if token has expired, if yes, make request to /refresh_token
if (auth.exp < Date.now()) { // token has expired
    // make request to /refresh_token
    axios.get('http://localhost:8080/refresh_token', {
        params: {
            refresh_token: auth.refresh_token
        }
    }).then(function (response) {
        exec()
    }).catch(function (error) {

    })
} else {
    exec()
}

function exec() {
    var getTop50 = {
        method: 'get',
        url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50&offset=0',
        headers: {
            'Authorization': `Bearer ${auth.access_token}`
        }
    }
    axios(getTop50).then(async function (top50response) {
        // console.log(JSON.stringify(response.data));
        // check uri file and call https://developer.spotify.com/console/delete-playlist-tracks/ to delete all tracks in playlist
        var uri = require('./uris.json')
        if (uri !== '') { // uris exist, delete all tracks in playlist
            console.log('deleting all tracks in playlist')
            // assemble uri array
            var rawPayload = {
                "tracks": []
            }
            console.log(uri.length)
            for (var i = 0; i < uri.length; i++) {
                rawPayload.tracks.push({"uri":uri[i]})
            }
            console.log(rawPayload)
            // console.log(JSON.stringify(rawPayload))
            var deleteOldList = {
                method: 'delete',
                url: 'https://api.spotify.com/v1/playlists/1CeGmJShZQiRkSscCeNtsy/tracks', // regex the playlist id out later
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`
                },
                data: JSON.stringify(rawPayload)
            }
            var deleteOldListResponse = await axios(deleteOldList)
            console.log(JSON.stringify(deleteOldListResponse.data))
        }
        // write to uris to file, for deletion later on
        await fs.writeFile('uris.json', JSON.stringify(top50response.data.items.map(item => item.uri)))
        uri = require('./uris.json')
        // https://developer.spotify.com/console/put-playlist-tracks/ - call this with the playlist id from the share link...
        var addToList = {
            method: 'put',
            url: `https://api.spotify.com/v1/playlists/1CeGmJShZQiRkSscCeNtsy/tracks?uris=${uri.join(',')}`, // regex the playlist id out later
            headers: {
                'Authorization': `Bearer ${auth.access_token}`
            }
        }
        var addToListResponse = await axios(addToList)
        console.log(JSON.stringify(addToListResponse.data));

    }).catch(function (error) {
        console.log(error);
    });
}