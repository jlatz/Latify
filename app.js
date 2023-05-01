 var express = require('express'); // Express web server framework
 var request = require('request'); // "Request" library
 var url = require('url');
 var cors = require('cors');
 var querystring = require('querystring');
 var cookieParser = require('cookie-parser');
const { access } = require('fs');
 
 var client_id = '4335a95bb28a41f88cc5048fcc64347d'; // Your client id
 var client_secret = 'e5c418a143684cb29fc5c8d0c7efe616'; // Your secret
 var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
 var stateKey = 'spotify_auth_state';
 
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
 
 
 app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());
 
 app.get('/login', (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
 
  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect(url.format({
    pathname: 'https://accounts.spotify.com/authorize',
    query: {
      'response_type': 'code',
      'client_id': client_id,
      'scope': scope,
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
 
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var {access_token} = body,
          {refresh_token} = body;
				res.redirect(`/home/?access_token=${access_token}`);
      } else {
        res.sendFile(__dirname + '/public/invalid.html');
      }
    });
  }
});
 
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});

app.get('/invalid', (_, res) => {
	res.sendFile(__dirname + '/public/invalid.html');
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
 
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var {access_token} = body;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/getArtist/:artist', (req, res) => {
 
  // requesting access token from refresh token
  const {access_token} = req.query;
  const {artist} = req.params;
  var authOptions = {
    url: `https://api.spotify.com/v1/search?q=artist:${artist}&type=artist`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
 
  request.get(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      artistArr = []
      for (let i = 0; i < response.body.artists.items.length; i++) {
        if (response.body.artists.items[i].images[0]?.url != undefined)
          artistArr.push(response.body.artists.items[i].images[0]?.url);
      }
      res.send(artistArr);
    }
    else {
      console.log(error);
    }
  });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});