var page = require('webpage').create();

page.onResourceRequested = function(request, obj) {
    console.log('Request ' + request['url']);
};
page.onResourceReceived = function(response) {
    console.log('Received ' + request['url']);
};
page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished ' + response['url']);
};
page.onResourceDataAvailable = function(response, obj) {
      console.log('Resource data available ' + response['url']);
      obj.deliverData();
};
//page.open('http://usesthis.com/', function (status) {
        //console.log('Page loaded ' + status);
        //phantom.exit();
//});
page.open('https://news.ycombinator.com/', function (status) {
        console.log('Page loaded ' + status);
        phantom.exit();
});
