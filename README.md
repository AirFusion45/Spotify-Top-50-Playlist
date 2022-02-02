# Spotify-Top-50-Playlist
[![Nightly-minute-cron](https://github.com/AirFusion45/Spotify-Top-50-Playlist/actions/workflows/main.yml/badge.svg?branch=main&event=schedule)](https://github.com/AirFusion45/Spotify-Top-50-Playlist/actions/workflows/main.yml)

A quick helper function to update a Spotify Playlist with the private Top 50 tracks this month. Made using Express.js & the Spotify API.

## Build from Source
This project is not meant to be built from source or used as a production application. However, if you still would like to build from source:
1. Spin up MongoDB Atlas, 1 database, 2 collections in that db: auth & uris
2. Fill env with respective fields. Search `process.env`
3. Setup Spotify API secrets
4. Deploy on serverless!
5. Change GitHub Workflow to match deployment URL

## Running prebuilt
This is not meant to be run by anyone else. If you want to run it, please fork this and deploy your own version.

## Basic Usage
* `/login` - Brings up Spotify Oauth Page
* `/refresh_token` - Refreshes Spotify Token
* `/Update` - Updates playlist

## Features
Updates Spotify playlist with your top 50 songs every day @ 00:00 UTC

## Contributors

* *AirFusion45* - Original Author

## License 
This Project is licensed under MIT License - see the LICENSE.md file for more details. The main points of the MIT License are:
  
  * This code can be used commercially
  * This code can be modified
  * This code can be distributed
  * This code can be used for private use
  * This code has no Liability
  * This code has no Warranty
  * When using this code, credit must be given to the author

## Credits
* Thanks to https://github.com/JMPerez/spotify-web-api-js for helping me understand the Spotify API

## Contact Me
Feel free to contact me if you find bugs, license issues, missing credits, etc.

  * Please contact me here:
    * Email: jfang.cv.ca.us@gmail.com
    * Discord: AirFusion#1706

## Note/Notes 
N/A
