var page = require('webpage').create();
page.onResourceRequested = function(request) {
      console.log('Request ' + JSON.stringify(request, undefined, 4));
};
page.onResourceReceived = function(response) {
      console.log('Ready Read ' + JSON.stringify(response, undefined, 4));
};
page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished' + JSON.stringify(response, undefined, 4));
};
page.onResourceDataAvailable = function(response, obj) {
      console.log('Resource data is now available' + JSON.stringify(response, undefined, 4));
};
page.open('https://news.ycombinator.com/', function (status) {
        console.log('Page loaded ' + status);
        phantom.exit();
});
