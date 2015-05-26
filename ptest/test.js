var page = require('webpage').create();
page.onResourceRequested = function(request, obj) {
      console.log('Resource Request ' + response['url']);
};
page.onResourceReceived = function(response) {
      console.log('Ready Read ' + response['url']);
};
page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished ' + response['url']);
};
page.onResourceDataAvailable = function(response, obj) {
      console.log('Resource data is now available for ' + response['url'] + ' asking to deliver ' + response['status']);
      obj.deliverData();
};
page.open('https://news.ycombinator.com/', function (status) {
        console.log('Page loaded ' + status);
        phantom.exit();
});
