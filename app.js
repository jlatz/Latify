var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var url = require('url');
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '4335a95bb28a41f88cc5048fcc64347d'; // Your client id
var client_secret = 'e5c418a143684cb29fc5c8d0c7efe616'; // Your secret 
var global_access_token = '';
 
var app = express();
 
app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());
 
app.get('/login', (req, res) => {
  // your application requests authorization
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  };
 
  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      global_access_token = body.access_token;
      res.send(global_access_token);
    }
  });
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
      console.log('ACCESS REFRESH TOKEN');
      console.log(access_token);
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/getArtist/:artist', (req, res) => {
  const access_token = global_access_token;
  console.log(req.params);
  const {artist} = req.params;
  var authOptions = {
    url: `https://api.spotify.com/v1/search?q=artist:${artist}&type=artist`,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
 
  request.get(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(response.body);
    }
    else {
      console.log(error);
    }
  });
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});