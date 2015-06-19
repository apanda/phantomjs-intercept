(function() {
    var sys = require('system');
    function executeExternalEvents(ext, done) {
        var page = require('webpage').create();
        page.viewportSize = {
            width: 1920,
            height: 1080
        };
        var extIdx = 0;

        var trace = new Array();
        var ancestor = new Object();
        var eventToId = new Object();
        var idToEvent = new Object();

        var events = new Array();
        var eventRunning = false;
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
        var finishedLoadingCookie="global";

        function shuffle(array) {
          var currentIndex = array.length, temporaryValue, randomIndex ;
        
          // While there remain elements to shuffle...
          while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
          }
        
          return array;
        }

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

        page.onConsoleMessage = function (str) {
            console.log("CONSOLE>>>> " + str);
        };


        page.onError = function(err) {
            console.log('ERROR ERROR ERROR');
            console.log(err);
            var cookie = prepareEvent({"status": "Crash", "msg": err, "isError": true});
            console.log("Pushing " + cookie);
            trace.push(cookie);
            error = err;
            errorStopped = true;
        };

        function initEventInfo() {
            var cookie = prepareEvent("loading");
            eventRunning = cookie;
            console.log("Pushing " + cookie);
            trace.push(cookie);
        }

        function finishedLoadingInfo() {
            var cookie = prepareEvent("finishedLoading");
            console.log("Pushing " + cookie);
            trace.push(cookie);
            finishedLoadingCookie=cookie;
        }

        function prepareEvent(info) {
            console.log('Prepare info called for ' + JSON.stringify(info));
            var infoAsString = JSON.stringify(info);
            if (!eventToId[infoAsString]) {
                cookie = allocCookie();
                eventToId[infoAsString] = cookie;
                idToEvent[cookie] = infoAsString;
                if (eventRunning) {
                    ancestor[cookie] = eventRunning;
                } else {
                    ancestor[cookie] = finishedLoadingCookie;
                }
                return cookie;
            } else {
                //console.log("Already exists");
                return eventToId[JSON.stringify(info)];
            }
        };

        function prepareExtEvent(info) {
            var infoAsString = JSON.stringify(info);
            cookie = allocCookie();
            eventToId[infoAsString] = cookie;
            idToEvent[cookie] = infoAsString;
            return cookie;
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
                // We want to dispatch this without setting runningEvent, this is all happening during
                // load when things are quite confused.
                var cookie = prepareEvent(response);
                obj.deliverData(cookie);
              } else {
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
                console.log('Resource Data Available error ' + err.message);
            }
        };

        function recordNoDispatch(info, obj) {
            var cookie = prepareEvent(info);
            eventCounts[info["EventID"]||info] = (eventCounts[info["EventID"]||info] || 0) + 1;
            events.push({'info':info, 'cookie': cookie, 'obj':obj});
        }
        function recordEvent(info, obj) {
            recordNoDispatch(info, obj);
            if (!eventRunning) {
                restartDispatch();
            }
        }

        page.onResourceReadyRead = function(response, obj) {
            try {
              if (!hasFinishedLoading) {
                // We want to dispatch this without setting runningEvent, this is all happening during
                // load when things are quite confused.
                var cookie = prepareEvent(response);
                obj.deliverReadyRead("initLoad");
              } else {
                  obj.fire = obj.deliverReadyRead;
                  recordEvent(response, obj);
              }
              hasReadyReadOnce = true; 
            } catch(err) {
                console.log('Resource Ready Read error ' + err.message);
            }
        };

        page.onTimerSet = function(info, timer) {
            try {
                recordEvent(info, timer);
            } catch(err) {
                console.log('OnTimer error ' + err.message);
            }
        };

        page.onPendingEvent = function(info, evt) {
            try {
                recordEvent(info, evt);
            }catch(err) {
                console.log('Pending error ' + err.message);
            }
        };

        function runNextExternalEvent() {
            var next = ext.shift();
            var addedOne = (next === "wait");
            while (next && next != "wait") {
                var info = next.toString();
                var nfunc = next;
                extIdx++;
                console.log("Next " + next);
                var cookie = recordNoDispatch({'EventID': 'ext'+extIdx, 'desc': info, 'isExternal': true}, {'fire': function(c) {console.log("Next " + nfunc);nfunc(page, c);}});
                addedOne = true;
                next = ext.shift();
            }
            return addedOne;
            //if (next) {
            //} else {
                //
            //}
        };

        function dispatchInternal(evt) {
            eventRunning = evt["cookie"];
            // Record next run
            console.log("Pushing " + eventRunning + "  " + JSON.stringify(evt));
            trace.push(eventRunning);
            waitQuiesce = eventCounts[evt["info"]["EventID"]||evt["info"]] || 0;
            evt['obj'].fire(eventRunning);
        }

        function restartDispatch() {
            events = shuffle(events);
            var next = events.shift();
            if (next) {
                dispatchInternal(next);
            } else {
                quiesced = true;
                // Notoriously, PostMessages can show up much later.
                eventRunning = false;
                if (runNextExternalEvent()) {
                    restartDispatch();
                } else {
                    done(false, {"trace": trace, "ancestors": ancestor, "eventToID": eventToId, "idToEvent": idToEvent});
                }
            }
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
                    console.log("Not quiesced should wait " + waitQuiesce + " turns");
                    //return;
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
                    done(error, {"trace": trace, "ancestors": ancestor, "eventToID": eventToId, "idToEvent": idToEvent});
                    return;
                }
                restartDispatch();
            } catch(err) {
                console.log('onQuiesced error ' + err.message);
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
            finishedLoadingInfo();
            hasFinishedLoading = true;
            page.onQuiesced(eventRunning);
        }

        initEventInfo();
        runNextExternalEvent();
        var url = sys.args[1] || 'file:///scratch/apanda/phantomjs-intercept/ptest/file.html';
        if (url.indexOf("://") == -1) {
            url = "file://" + url;
        }
        console.log('Will open URL ' + url);
        page.open(url, function() {
                });
    }

    var externalEventsToPlay = [
        //function (page, cookie) {page.renderCookie(cookie, "fun.png");},
        //function (page, cookie) {page.renderCookie(cookie, "fun.png");},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['principal'].value = '50000';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document.getElementById('pro').click()}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['deposit'].value = '500';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['admin'].value = '200';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['interest'].value = '5';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['initiation'].value = '1000';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['years'].value = '10';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document['loandata']['balloon'].value = '1';}, [], cookie);},
        //function (page, cookie) {page.evaluate(function() {document.getElementById('pro').click()}, [], cookie);}
        //"skip",
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Left']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Up']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Down']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Left']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Up']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Down']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Left']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Up']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Down']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Left']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Up']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Down']);},
        //function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['Right']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['w']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['a']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['s']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['d']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['s']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['a']);},
        function (page, cookie) {page.sendEventCookie(cookie, 'keypress', page.event.key['w']);},
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
                    function (err, rest) {
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

    function gatherTrace (trace) {
        try {
            executeExternalEvents(trace.slice(), function (err, obj) {
                console.log("Information is " + JSON.stringify(obj));
                var file = require('fs').write("trace.json", 'data = ' + JSON.stringify(obj));
                phantom.exit();
            });
        } catch (err) {
            console.log("Gather error");
        }
    }
    console.log("Original trace is ");
    console.log('\t'+ externalEventsToPlay.map(function(x) {return x.toString();}).join('\n\t'));
    gatherTrace(externalEventsToPlay);
})();
