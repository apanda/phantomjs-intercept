var page = require('webpage').create();

page.onResourceRequested = function(request, obj) {
    console.log('Request ' + request['url']);
};
page.onResourceReceived = function(response) {
    console.log('Received ' + request['url']);
};
page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished ' + response['url']);
      console.log('Receive finished ' + response['status']);
      console.log('Receive finished ' + response['statusText']);
};
page.onResourceDataAvailable = function(response, obj) {
      console.log('Resource data available ' + response['url']);
      obj.deliverData();
};
page.onResourceCanStart = function(response, obj) {
      console.log('Resource can start ' + response['url']);
      console.log('Telling WK resource can start ' + response['url']);
      obj.deliverReadyRead();
};
//page.open('https://news.ycombinator.com/', function (status) {
        //console.log('Page loaded ' + status);
        //phantom.exit();
//});
//page.open('http://josephfitzsimmons.com/writing-a-simple-seconds-countdown-timer-with-vanilla-javascript/');
page.open('file:///scratch/apanda/phantomjs-intercept/ptest/file.html', function() {
		page.render('file.png');
		});
