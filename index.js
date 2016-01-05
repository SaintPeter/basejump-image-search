'use strict';
var server = require('express');
var app = server();
var fs = require('fs');
var path = require('path');
var request = require('request');
require('dotenv').load();

var mongoose = require('mongoose');
var mongoURL = process.env.MONGOLAB_URI || "mongodb://localhost:27017/image-search";

var port = process.env.PORT || 3500;

app.listen(port, function () {
  console.log("Listening on port: " + port);
});

app.get('/', function (req, res) {
  var fileName = path.join(__dirname, 'index.html');
  res.sendFile(fileName, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/script.js', function (req, res) {
  var fileName = path.join(__dirname, 'script.js');
  res.sendFile(fileName, function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
    else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/search/:searchstring/:page?', function (req, res) {
  let query = req.params.searchstring.split(' ').join('+');
  let offset = (typeof req.params.page !== 'undefined') ? parseInt(req.params.page) * 10 : 0;
  // lowRange is 1 based
  offset = offset > 0 ? offset + 1 : offset;
  var startAt = (offset > 0) ? "&start=" + offset : "";
  let searchUrl = `https://www.googleapis.com/customsearch/v1?searchType=image` +
    `${startAt}&num=10` +
    `&q=${query}` +
    `&cx=${process.env.SEARCH_ENGINE}&key=${process.env.API_KEY}`;

  console.log("query: ", query, "offset: ", offset);

  //let data = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample.json')));
  request(searchUrl,{json: true},function(error, response, data) {
    if(!error && response.statusCode == 200) {
      let newData = data.items.map(function (item) {
        return {
          url: item.link,
          snippet: item.snippet,
          thumbnail: item.image.thumbnailLink,
          context: item.image.contextLink
        };
      });
      res.json(newData);
    } else {
      console.log("Got error: ", error);
      res.status(400).json({ error: error });
    }

  });
});
