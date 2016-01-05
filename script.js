var page = 0;

// Make Image Request
function doRequest() {
  var request = new XMLHttpRequest();
  var search = document.getElementById('search').value.trim();
  var url = window.location.href + "search/" + search;

  if(search.length > 0) {
    if (page > 0) {
      url += '/' + page;
    }

    request.open('GET', url, true);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        document.getElementById('results').innerHTML = data.reduce(function (acc, curr) {
          return acc + `<a class="imglink" href="${curr.url}" target="_blank">` +
            `<img title="${curr.snippet}" src="${curr.thumbnail}"></a>`;
        }, "");
        console.log("Got Request");
      } else {
        document.getElementById('results').innerHTML = "An Error Occurred";
      }
    };

    request.onerror = function () {
      document.getElementById('results').innerHTML = "An Error Occurred";
    };
    request.send();
  } else {
    document.getElementById('results').innerHTML = "No Search Term Provided";
  }
}

/*
 * Button Handlers
 */

document.getElementById('clearBtn').addEventListener('click', function(e) {
  e.preventDefault();
  page = 0;
  document.getElementById('results').innerHTML = "";
  document.getElementById('search').value = "";
});

document.getElementById('recentBtn').addEventListener('click', function(e) {
  e.preventDefault();
  var request = new XMLHttpRequest();
  var url = window.location.href + "recent/";

  request.open('GET', url, true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      var output = data.reduce(function(acc, curr){
        return acc + ``;
      }, "");
      console.log("Got Recent Request");
    } else {
      document.getElementById('results').innerHTML = "An Error Occurred";
    }

    document.getElementById('results').innerHTML =
      '<table class="table table-striped"><thead><tr><th>Search</th><th>Page</th><th>Date</th></tr></thead>' +
      '<tbody>' + output + '</tbody>' +
      '</table>';
  };

  request.onerror = function() {
    document.getElementById('results').innerHTML = "An Error Occurred";
  };
  request.send();
});

document.getElementById('searchBtn').addEventListener('click', function(e) {
  e.preventDefault();
  doRequest();
});

document.getElementById('prev').addEventListener('click', function(e) {
  e.preventDefault();
  if(page > 0) {
    page--;
    doRequest();
  }
});

document.getElementById('next').addEventListener('click', function(e) {
  e.preventDefault();
  page++;
  doRequest();
});