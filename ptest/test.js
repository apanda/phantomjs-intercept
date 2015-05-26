var page = require('webpage').create();
page.onResourceRequested = function(request) {
      console.log('Request ');
};
page.onResourceReceived = function(response) {
      console.log('Ready Read ');
};
page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished ');
};
page.onResourceDataAvailable = function(response, obj) {
      console.log('Resource data is now available for ' + response['url'] + ' asking to deliver ');
      //obj.deliverData();
};
page.open('https://eecs.berkeley.edu/', function (status) {
        console.log('Page loaded ' + status);
        phantom.exit();
});
