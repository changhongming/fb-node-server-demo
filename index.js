const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const session = require('express-session');
require('dotenv').config();

const env = process.env;

app.use(session({
  secret: env.session_secret,
  cookie: { maxAge: 10 * 60 * 1000 },
  resave: true,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

app.get('/api/code', (req, res) => {
  let re;
  if (req.session.name)
    re = { statu: 'ok', name: req.session.name };
  else
    re = { statu: 'not login', url: `https://www.facebook.com/v3.2/dialog/oauth?client_id=${env.client_id}&redirect_uri=${env.callback_uri}` }
  res.send(re);
});

app.get('/api/user', (req, res) => {
  if (req.session.key)
    axios({
      method: 'get',
      url: `https://graph.facebook.com/v3.2/me?fields=id,name,email&access_token=${req.session.key}`
    })
      .then(response => {
        req.session.name = response.data.name;
        req.session.email = response.data.email;
        res.send(response.data)
      })
      .catch(err => {
        res.send(err)
      })
  else
    res.redirect('/')
});

app.get('/oauth/code', (req, res) => {
  console.log(env.client_id)
  res.redirect(`https://www.facebook.com/v3.2/dialog/oauth?client_id=${env.client_id}&redirect_uri=${env.callback_uri}`)
});

app.get('/oauth/redirect', (req, res) => {
  const code = req.query.code;
  axios({
    method: 'get',
    url: `https://graph.facebook.com/v3.2/oauth/access_token?client_id=${env.client_id}&redirect_uri=${env.callback_uri}&client_secret=${env.client_secret}&code=${code}`,
  }).then((response) => {
    // 取得token
    const userdata = response.data;
    req.session.key = userdata.access_token;
    res.redirect('/')
  })
    .catch(err => {
      console.log(err)
      return console.log(err);
    })
  console.log(req.query.code)
  console.log(res)

});


https.createServer({
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
  passphrase: env.passphrase
}, app)
  .listen(env.port, () => {
    console.log(`The server is running at https://127.0.0.1:${env.port}`);
  });
