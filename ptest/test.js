(function() {
    var sys = require('system');
    var page = require('webpage').create();
    var events = new Array();
    var eventRunning = 'cookie0';
    var eventCount = 1;
    var hasFinishedLoading = false;
    var waitingForResources = false; 
    var quiesced = false;
    var resourcesRequested = Object();
    function allocCookie() {
        var cookie = "cookie"+eventCount;
        eventCount++;
        return cookie;
    }

    page.onResourceRequested = function(request, obj) {
        resourcesRequested[request['url']] = true;
    };

    page.onResourceReceived = function(response) {
    };

    page.onResourceReceiveFinished = function(response) {
        // Before loading has finished we fire data available
        // instantly, hence need to account for fact that a lot of
        // events are coming from page load.
        if (!hasFinishedLoading) {
            delete resourcesRequested[response['url']];
            if (waitingForResources) {
                var waiting = Object.keys(resourcesRequested);
                if (waiting.length === 0) {
                    if (!hasFinishedLoading) {
                        page.onLoadFinished();
                    } else {
                        page.onQuiesced(eventRunning);
                    }
                }
            }
        }
    };

    page.onResourceDataAvailable = function(response, obj) {
        try {
          if(!hasFinishedLoading) {
            console.log('Loading resource ' + response['url']);
            obj.deliverData("initLoad");
          } else {
              console.log("Recording data avail " + response['url']);
              obj.fire = obj.deliverData;
              events.push({'info': response, 'obj': obj});
              // In normal circumstances, we only record the fact that data is available, since
              // resourceReceive finished cannot fire until after we release this.
              delete resourcesRequested[response['url']];
              // Wait for things to finish
              if (waitingForResources) {
                  var waiting = Object.keys(resourcesRequested);
                  if (waiting.length === 0) {
                      if (!hasFinishedLoading) {
                          page.onLoadFinished();
                      } else {
                          page.onQuiesced(eventRunning);
                      }
                  }
              }
          }
        } catch(err) {
            console.log('Dispatch error ' + err.message);
        }
    };

    page.onResourceReadyRead = function(response, obj) {
          //console.log('Resource can start ' + response['url']);
          //console.log('Telling WK resource can start ' + response['url']);
        try {
          if (!hasFinishedLoading) {
            console.log('Resource loaded ' + response['url']);
            obj.deliverReadyRead("initLoad");
          } else {
              console.log("Recording ready read " + response['url']);
              obj.fire = obj.deliverReadyRead;
              events.push({'info':response, 'obj':obj});
          }
          hasReadyReadOnce = true; 
        } catch(err) {
            console.log('Dispatch error ' + err.message);
        }
    };

    page.onTimerSet = function(info, timer) {
        if (eventRunning) {
            try {
                console.log("Recording timer being set");
                var ret = events.push({'info': info, 'obj': timer});
                console.log("Done recording Length is now " + ret);
            } catch(err) {
                console.log('Dispatch error ' + err.message);
            }
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
            var ret = events.push({'info': info, 'obj': evt});
            console.log("Length is now " + ret);
        } else {
            console.log('\n\n\n');
            eventRunning = allocCookie();
            console.log("Running event " + JSON.stringify(info) + " with cookie " + eventRunning  + ' dispatching ');
            evt.fire(eventRunning);
        }
    };

    page.onQuiesced = function(cookie) {
        try {
            if (cookie !== eventRunning) {
                // Just let it go
                return;
            }

            var waiting = Object.keys(resourcesRequested);
            if (waiting.length != 0) {
                waitingForResources = true;
                console.log("Resource requests have not completed yet, waiting on " + waiting);
                return;
            } else {
                waitingForResources = false;
            }

            console.log('Quiesced ' + cookie);
            console.log('\n\n\n');
            console.log('Pending (' + events.length + ') ' + JSON.stringify(events));
            var next = events.shift();
            console.log('Next ' + JSON.stringify(next));
            if (next) {
                eventRunning = allocCookie();
                console.log('Dispatching queued ' + JSON.stringify(next['info']) + ' with cookie ' + eventRunning);
                next['obj'].fire(eventRunning);
            } else {
                console.log("Everything is quiesced");
                quiesced = true;
                console.log('Done\n\n\n');
                // Notoriously, PostMessages can show up much later.
                eventRunning = false;
                //
                //page.sendEvent('keypress', page.event.key['Left']);
            }
        } catch(err) {
            console.log('Dispatch error ' + err.message);
        }
    }

    page.onLoadFinished = function() {
        var waiting = Object.keys(resourcesRequested);
        console.log('Reported page load finished');
        if (waiting.length != 0) {
            waitingForResources = true;
            console.log("Resource requests have not completed yet, waiting on " + waiting);
            return;
        } else {
            waitingForResources = false;
        }
        hasFinishedLoading = true;
        page.onQuiesced(eventRunning);
    }

    var url = sys.args[1] || 'file:///scratch/apanda/phantomjs-intercept/ptest/file.html';
    if (url.indexOf("://") == -1) {
        url = "file://" + url;
    }
    console.log('Will open URL ' + url);
    page.open(url, function() {
            //page.sendEvent('keypress', page.event.key['Right']);
            page.render('file.png');
            });
})();
