import express from 'express'; // Express web server framework
import request from 'request'; // "Request" library
//import path, { dirname } from 'path';
//import url, { fileURLToPath } from 'url';
// import cors from 'cors';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

//const __filename = fileURLToPath(import.meta.url);
//let __dirname = dirname(__filename);

var client_id = '4335a95bb28a41f88cc5048fcc64347d'; // Your client id
var client_secret = 'e5c418a143684cb29fc5c8d0c7efe616'; // Your secret
var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var scopes = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state';

var app = express();

/**
* Generates a random string containing numbers and letters
* @param  {number} length The length of the string
* @return {string} The generated string
*/
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.get('/callback', (req, res) => {
 
   // your application requests refresh and access tokens
   // after checking the state parameter
  var {code} = req.query || null;
  var {state} = req.query || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
 
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
 
    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        var {access_token} = body;
        res.redirect(`http://localhost:5173/home/?access_token=${access_token}`);
      } else {
        res.redirect('http://localhost:5173/invalid');
      }
    });
  }
});

app.get('/api/login', (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const baseUrl = 'https://accounts.spotify.com/authorize';
  const queryParams = {
    'response_type': 'code',
      'client_id': client_id,
      'scope': scopes,
      'redirect_uri': redirect_uri,
      'state': state,
  };
  const url = new URL(baseUrl);

  // Add query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  res.redirect(url);
});
 

app.get('/api/availableDevices', (req, res) => {
  var {access_token} = req.query;
  var authOptions = {
    url: `https://api.spotify.com/v1/me/player/devices`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  request.get(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200)
      res.status(200).send(response.body.devices);
    else
      console.log(response.statusCode);
  })
})

app.get('/api/getArtist/:artist', (req, res) => {
  // requesting access token from refresh token
  const {access_token} = req.query;
  const {artist} = req.params;
  var authOptions = {
    url: `https://api.spotify.com/v1/search?q=artist:${artist}&type=artist`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
 
  request.get(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let artistResp = [];
      for (let i = 0; i < response.body.artists.items.length; i++) {
        if (response.body.artists.items[i].images[0]?.url != undefined)
          artistResp.push(response.body.artists.items[i]);
      }
      res.send(artistResp);
    }
    else{
      console.log(`Failed to retrieve information about the artist ${artist}`);
      console.log(error);
    }
  });
});

app.put('/api/track/:trackId/play', (req, res) => {
  const {access_token} = req.body;
  const {selectedDeviceId} = req.body;
  const {trackId} = req.params;
  var authOptions = {
    url: 'https://api.spotify.com/v1/me/player/play' + (selectedDeviceId ? `/?device_id=${selectedDeviceId}` : ''),
    headers: { 'Authorization': 'Bearer ' + access_token },
    body: {'uris': [`spotify:track:${trackId}`]},
    json: true
  };
  request.put(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 204) {
      res.status(200).send({'errors': false, 'msg': ''});
    }
    else {
      console.log(`Failed to play track`);
      res.status(200).send({'errors': true, 'msg': body.error.message});
    }
  });
});

app.put('/api/track/:trackId/pause', (req, res) => {
  const {access_token} = req.body;
  const {selectedDeviceId} = req.body;
  var authOptions = {
    url: 'https://api.spotify.com/v1/me/player/pause' + (selectedDeviceId ? `/?device_id=${selectedDeviceId}` : ''),
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  request.put(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 204) {
      res.status(200).send(true);
    }
    else {
      console.log(`Failed to pause track`);
      console.log(body);
    }
  });
});


app.get('/api/artists/album/:albumId/tracks', (req, res) => {
  const {access_token} = req.query;
  const {albumId} = req.params;
  var authOptions = {
    url: `https://api.spotify.com/v1/albums/${albumId}/tracks`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.send({
        'albumId': albumId,
        'tracks': response.body.items
      })
    }
    else{
      console.log(`Failed to fetch album tracks from album ${albumId}`);
      console.log(error)
    }
  });
});

app.get('/api/artists/:artistId/albums', (req, res) => {
 
  // requesting access token from refresh token
  const {access_token} = req.query;
  const {artistId} = req.params;
  var authOptions = {
    url: `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
 
  request.get(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.send({
        'artistId': artistId,
        'albums': response.body.items
      });
    }
    else
      console.log(error);
  });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});