'use strict';
var server = require('express');
var app = server();
var fs = require('fs');
var path = require('path');
var request = require('request');
require('dotenv').config({silent: true});

// Connect to database
var mongoose = require('mongoose');
var mongoURL = process.env.MONGOLAB_URI || "mongodb://localhost:27017/image-search";

mongoose.connect(mongoURL);
mongoose.connection.on('error', function(err) {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
  }
);

// Load model
var recent = require('./schema/recent.js');

// Setup Port
var port = process.env.PORT || 3500;

// Server
app.listen(port, function () {
  console.log("Listening on port: " + port);
});


/* ---------------------- Routes --------------------------- */

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

app.get('/recent', function(req, res) {
  recent.find({}).sort({date: -1}).select("term date -_id page").exec(function(err, docs){
    if(err) {
      console.log("Recent Fetch Error:", err)
      res.status(400).json({ error: err });
    } else {
      res.json(docs);
    }
  });
});

app.get('/search/:searchstring/:page?', function (req, res) {
  let query = req.params.searchstring.split(' ').join('+');
  let page = (typeof req.params.page !== 'undefined') ? parseInt(req.params.page) : 0;
  let offset =  page * 10;

  // Check cache for recent hits
  recent.find({
      term: query,
      page: page,
      date: { $gt: (Date.now() - (60 * 60 * 24 * 1000)  ) } // Within the last day
    })
    .sort({date: -1}) // Sort Descending
    .exec(function(err, docs) {
    if(!err) {
      if(docs.length > 0) {
        console.log("Cache Hit: ", query, "  Page:", page);
        res.json(docs[0].cache);
      } else {
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

            // Store results
            recent.create({
              term: query,
              page: page,
              date: Date.now(),
              cache: newData
            }, function(err, doc){
              if(err) {
                console.log('Error Writing Cache:', err);
              } else {
                console.log('Wrote Cache: ', query, ' Page:', page);
              }
            });

            // Return response
            res.json(newData);
          } else {
            console.log("Search Error: ", error);
            res.status(400).json({ error: error });
          }

        });
      }
    } else {
      console.log("Cache Search Error:", err);
    }
  });


});
