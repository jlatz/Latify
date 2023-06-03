var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var path = require('path');
var url = require('url');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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

app.use(express.static(__dirname + '/public/html'))
  .use(cors())
  .use(cookieParser());

// load jquery file
app.use('/home/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
// load bootstrap css and js files
app.use('/home/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/home/css', express.static(path.join(__dirname, 'public', 'css')));

app.use('/home/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));
//load bootstrap-icon file
app.use('/home/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap-icons', 'font')));
// load popperjs file
app.use('/home/js', express.static(path.join(__dirname, 'node_modules', '@popperjs', 'core', 'dist', 'umd')));


app.get('/login', (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  res.redirect(url.format({
    pathname: 'https://accounts.spotify.com/authorize',
    query: {
      'response_type': 'code',
      'client_id': client_id,
      'scope': scopes,
      'redirect_uri': redirect_uri,
      'state': state
    }
  }));
});
 
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
        var {access_token} = body,
          {refresh_token} = body;
				res.redirect(`/home/?access_token=${access_token}`);
      } else {
        res.sendFile(__dirname + '/public/html/invalid.html');
      }
    });
  }
});
 
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/public/html/home.html');
});

app.get('/invalid', (_, res) => {
	res.sendFile(__dirname + '/public/html/invalid.html');
});

app.get('/refresh_token', (req, res) => {
 
  // requesting access token from refresh token
  var {refresh_token} = req.query;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };
 
  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      var {access_token} = body;
      res.send({
        'access_token': access_token
      });
    }
    else{
      console.log('Failed to login using authorization token.');
      console.log(error);
    }
  });
});

app.get('/availableDevices', (req, res) => {
  var {access_token} = req.query;
  var authOptions = {
    url: `https://api.spotify.com/v1/me/player/devices`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  request.get(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.status(200).send(response.body.devices);
    }
    else
      console.log(response.statusCode);
  })
})

app.get('/getArtist/:artist', (req, res) => {
 
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
      artistResp = []
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

app.put('/track/:trackId/play', (req, res) => {
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
      res.status(200).send(true);
    }
    else {
      console.log(`Failed to play track`);
      console.log(body);
    }
  });
});

app.put('/track/:trackId/pause', (req, res) => {
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


app.get('/artists/album/:albumId/tracks', (req, res) => {
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

app.get('/artists/:artistId/albums', (req, res) => {
 
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