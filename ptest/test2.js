var page = require('webpage').create();
page.onResourceRequested = function(request) {
    console.log('Request ' + request['url']);
};
page.onResourceReceived = function(response) {
    console.log('Received ' + request['url']);
};
page.open("http://usesthis.com/");
