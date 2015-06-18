(function() {
    var sys = require('system');
    function executeExternalEvents(ext, done) {
        var page = require('webpage').create();
        page.viewportSize = {
            width: 1920,
            height: 1080
        };

        var recordOrder = new Array();
        var ancestor = new Object();
        var eventToId = new Object();
        var idToEvent = new Object();

        var events = new Array();
        var eventRunning = 'cookie0';
        var eventCount = 1;
        var hasFinishedLoading = false;
        var waitingForResources = false; 
        var quiesced = false;
        var waitQuiesce = 1;
        var resourcesRequested = Object();
        var playedKeys = 0;
        var eventCounts = Object();
        var errorStopped = false;
        var error = null;

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

        page.onError = function(err) {
            //console.log('ERROR ERROR ERROR');
            console.log(err);
            // Error detected, stop replay
            error = err;
            errorStopped = true;
        };

        function prepareEvent(info) {
            //console.log('Prepare info called for ' + JSON.stringify(info));
            var infoAsString = JSON.stringify(info);
            if (!eventToId[infoAsString]) {
                cookie = allocCookie();
                eventToId[infoAsString] = cookie;
                idToEvent[cookie] = infoAsString;
                ancestor[cookie] = eventRunning;
                return cookie;
            } else {
                //console.log("Already exists");
                return eventToId[JSON.stringify(info)];
            }

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
                var cookie = prepareEvent(response);
                //console.log('Loading resource ' + response['url']);
                obj.deliverData("initLoad");
              } else {
                  //console.log("Recording data avail " + response['url']);
                  obj.fire = obj.deliverData;
                  var cookie = prepareEvent(response);
                  events.push({'info': response, 'cookie': cookie, 'obj': obj});
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
                var cookie = prepareEvent(response);
                //console.log('Resource loaded ' + response['url']);
                obj.deliverReadyRead("initLoad");
              } else {
                  //console.log("Recording ready read " + response['url']);
                  obj.fire = obj.deliverReadyRead;
                  var cookie = prepareEvent(response);
                  events.push({'info':response, 'cookie': cookie, 'obj':obj});
              }
              hasReadyReadOnce = true; 
            } catch(err) {
                console.log('Dispatch error ' + err.message);
            }
        };

        page.onTimerSet = function(info, timer) {
            //if (eventRunning) {
            try {
                //console.log("Recording timer being set");
                var cookie = prepareEvent(info);
                eventCounts[info["EventID"]] = (eventCounts[info["EventID"]] || 0) + 1;
                evt = {'info': info, 'cookie': cookie, 'obj': timer};
                if (eventRunning) {
                    var ret = events.push(evt);
                    //console.log("Done recording Length is now " + ret);
                } else {
                    dispatchInternal(evt);
                }
            } catch(err) {
                console.log('Dispatch error ' + err.message);
            }
        };

        page.onPendingEvent = function(info, evt) {
            //console.log("Event");
            try {
            //if (eventRunning) {
              //console.log("Nothing is running, so running this ");
              eventCounts[info["EventID"]] = (eventCounts[info["EventID"]] || 0) + 1;
              //console.log('Recording event ' + JSON.stringify(info));
              var cookie = prepareEvent(info);
              var evt = {'info': info, 'cookie': cookie, 'obj': evt};
              if (eventRunning) {
                  var ret = events.push(evt);
                  //console.log("Length is now " + ret);
              } else {
                  dispatchInternal(evt);
              }
            }catch(err) {
                console.log('Pending error ' + err.message);
            }
        };

        page.onConsoleMessage = function (str) {
            console.log("CONSOLE>>>> " + str);
        };

        function clickLink(link) {
            var link = document.getElementById("link");
            link.click();
        }

        function fillFormField(form, field, value) {

            var node = document[form][field];
            node.value = value;
        }

        var runNextExternalEvent = function() {
            var next = ext.shift();
            if (next) {
                eventRunning = allocCookie();
                next(page, eventRunning);
            } else {
                //console.log('Nothing to do');
                //console.log('Should not see any message after ' + eventRunning);
                done();
                //phantom.exit();
            }
        };

        function dispatchInternal(evt) {
            eventRunning = evt["cookie"];
            waitQuiesce = eventCounts[evt["info"]["EventID"]] || 0;
            //console.log('Dispatching ' + JSON.stringify(evt['info']) + ' with cookie ' + eventRunning + ' expecting to fire ' + waitQuiesce);
            evt['obj'].fire(eventRunning);
        }

        page.onQuiesced = function(cookie) {
            try {
                if (eventRunning && cookie !== eventRunning) {
                    // Just let it go
                    return;
                }
                waitQuiesce -= 1;
                // Not yet done, continue waiting.
                if (waitQuiesce > 0) {
                    return;
                }
                var waiting = Object.keys(resourcesRequested);
                if (waiting.length != 0) {
                    waitingForResources = true;
                    //console.log("Resource requests have not completed yet, waiting on " + waiting);
                    return;
                } else {
                    waitingForResources = false;
                }
                if (errorStopped) {
                    //console.log("Killing because of error");
                    done(error);
                    return;
                }
                //console.trace();
                //console.log('Quiesced ' + cookie);
                //console.log('Pending (' + events.length + ') ' + JSON.stringify(events));
                var next = events.shift();
                //console.log('Next ' + JSON.stringify(next));
                if (next) {
                    dispatchInternal(next);
                } else {
                    //console.log("Everything is quiesced");
                    quiesced = true;
                    // Notoriously, PostMessages can show up much later.
                    eventRunning = false;
                    runNextExternalEvent();
                }
            } catch(err) {
                console.log('Dispatch error ' + err.message);
            }
        }

        page.onLoadFinished = function() {
            var waiting = Object.keys(resourcesRequested);
            //console.log('Reported page load finished');
            if (waiting.length != 0) {
                waitingForResources = true;
                //console.log("Resource requests have not completed yet, waiting on " + waiting);
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
                });
    }

    var externalEventsToPlay = [
        //function (page, cookie) {page.evaluate(function() {document['loandata']['principal'].value = '50000';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document.getElementById('pro').click()}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        function (page, cookie) {page.evaluate(function() {document.getElementById('pro').click()}, [], cookie);}
    ]

    function recurseMin(trace, idx) {
        try {
            idx = idx | 0;
            if (trace.length <= idx) {
                console.log("Done minimizing");
                console.log(trace.map(function(x) {return x.toString();}).join('\n'));
                phantom.exit();
                return;
            }
            // Assumes trace has error already
            ntrac = trace.slice(0, idx).concat(trace.slice(idx + 1));
            executeExternalEvents(ntrac.slice(),
                    function (err) {
                        console.log("For trace ");
                        console.log('\t'+ ntrac.map(function(x) {return x.toString();}).join('\n\t'));
                        console.log("Error was " + err);
                        if (err) {
                            // Removing the element didn't matter, great
                            console.log("Removing  " + trace[idx].toString() + " still triggers error");
                            recurseMin(ntrac, 0);
                        } else {
                            console.log("No error on removing " + trace[idx].toString());
                            recurseMin(trace, idx + 1);
                        }
            });
        } catch (err) {
            console.log("Minimization error");
        }
    }
    console.log("Original trace is ");
    console.log('\t'+ externalEventsToPlay.map(function(x) {return x.toString();}).join('\n\t'));
    recurseMin(externalEventsToPlay, 0);
})();
