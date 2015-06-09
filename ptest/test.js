var page = require('webpage').create();
var events = new Array();
var eventRunning = false;
var eventCount = 0;

function allocCookie() {
    var cookie = "cookie"+eventCount;
    eventCount++;
    return cookie;
}

page.onResourceRequested = function(request, obj) {
    console.log('Request ' + request['url']);
};

page.onResourceReceived = function(response) {
    //console.log('Received ' + request['url']);
};

page.onResourceReceiveFinished = function(response) {
      console.log('Receive finished ' + response['url']);
      //console.log('Receive finished ' + response['status']);
      //console.log('Receive finished ' + response['statusText']);
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

page.onTimerSet = function(info, timer) {
    if (eventRunning) {
        console.log('Recording timer being set, interval ' + info['interval'] + ' single shot ' + info['singleShot']);
        events.push({'type': 'timer', 'obj': evt});
    } else {
        console.log('\n\n\n');
        eventRunning = allocCookie();
        console.log("Running timer callback with cookie " + eventRunning);
        timer.fire(eventRunning);
    }
};

page.onPendingEvent = function(info, evt) {
    if (eventRunning) {
        console.log('Recording event ' + JSON.stringify(info));
        events.push({'info': info, 'obj': evt});
    } else {
        console.log('\n\n\n');
        eventRunning = allocCookie();
        console.log("Running event " + JSON.stringify(info) + " with cookie " + eventRunning  + ' dispatching ');
        evt.fire(eventRunning);
    }
};

page.onQuiesced = function(cookie) {
    console.log('Quiesced ' + cookie);
    console.log('\n\n\n');
    console.log('Pending ' + JSON.stringify(events));
    var next = events.shift();
    console.log('Next ' + JSON.stringify(next));
    if (next) {
        eventRunning = allocCookie();
        console.log('Dispatching queued ' + JSON.stringify(next['info']) + ' with cookie ' + eventRunning);
        next['obj'].fire(eventRunning);
    } else {
        console.log("Everything is quiesced");
        eventRunning = false;
        console.log('Done');
    }
}

page.open('file:///scratch/apanda/phantomjs-intercept/ptest/file.html', function() {
		page.render('file.png');
		});
