// polyfill touch functionality on browsers that have pointer functionality (that piece of trash internet explorer)
// this thing is mostly just a hack on handjs, but does the reverse
// cameron henlin, cam.henlin@gmail.com

// jslint directive
/*jslint browser: true, unparam: true, nomen: true*/
/*global HTMLBodyElement, HTMLDivElement, HTMLImageElement, HTMLUListElement, HTMLAnchorElement, HTMLLIElement, HTMLTableElement, HTMLSpanElement, HTMLCanvasElement, SVGElement*/

(function () {
    // We should start using 'use strict' as soon as we can get rid of the implied globals.
    // 'use strict';

    var userAgent = navigator.userAgent,
        supportedEventsNames = ["touchstart", "touchmove", "touchend", "touchcancel", "touchleave"],
    // commented out because not used
    // upperCaseEventsNames = ["TouchStart", "TouchMove", "TouchEnd", "TouchCancel", "TouchLeave"],
        previousTargets = {},
        currentTouchesWrapper; // holds an object that keeps track of where the screen is being touched.

    // a constructor for an object that wraps a W3C compliant TouchList.
    function TouchListWrapper() {
        var touchList = []; // an array of W3C compliant Touch objects.

        // constructor for W3C compliant touch object
        // http://www.w3.org/TR/touch-events/
        function Touch(identifier, target, screenX, screenY, clientX, clientY, pageX, pageY) {
            this.identifier = identifier;
            this.target = target;
            this.screenX = screenX;
            this.screenY = screenY;
            this.clientX = clientX;
            this.clientY = clientY;
            this.pageX = pageX;
            this.pageY = pageY;
        }

        // If this is a new touch, add it to the TouchList.
        // If this is an existing touch, update it in the TouchList.
        function addUpdateTouch(touch) {
            var i;
            for (i = 0; i < touchList.length; i += 1) {
                if (touchList[i].identifier === touch.identifier) {
                    touchList[i] = touch;
                    return;
                }
            }
            // If we finished the loop, then this is a new touch.
            touchList.push(touch);
        }

        function removeTouch(identifier) {
            var i;
            for (i = 0; i < touchList.length; i += 1) {
                if (touchList[i].identifier === identifier) {
                    touchList.splice(i, 1);
                }
            }
        }

        // Return true if the current TouchList object contains a touch at the specified clientX, clientY.
        // Returns false otherwise.
        function containsTouchAt(clientX, clientY) {
            var i;

            for (i = 0; i < touchList.length; i += 1) {
                if (touchList[i].clientX === clientX && touchList[i].clientY === clientY) {
                    return true;
                }
            }

            return false;
        }

        // touchList is the actual W3C compliant TouchList object being emulated.
        this.touchList = touchList;

        this.Touch = Touch;
        this.addUpdateTouch = addUpdateTouch;
        this.removeTouch = removeTouch;
        this.containsTouchAt = containsTouchAt;
    }

    // polyfill custom event
    function CustomEvent(event, params) {
        var evt;
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    function checkPreventDefault(node) {
        while (node && !node.handJobjs_forcePreventDefault) {
            node = node.parentNode;
        }
        return !!node || window.handJobjs_forcePreventDefault;
    }

    // Touch events
    function generateTouchClonedEvent(sourceEvent, newName, canBubble, target, relatedTarget) {
        var evObj;

        // console.log("generating touch cloned");
        function touchHandler(event) {
            var eventType,
                touch,
                touchEvent;

            // console.log("touch!");            

            eventType = "";
            if (event.type === "pointerdown") {
                eventType = "touchstart";
            } else if (event.type === "pointermove") {
                eventType = "touchmove";
            }

            touch = new currentTouchesWrapper.Touch(event.pointerId, event.target, event.screenX, event.screenY, event.clientX, event.clientY, event.pageX, event.pageY);
            currentTouchesWrapper.addUpdateTouch(touch);

            event.type = eventType;
            touchEvent = new CustomEvent(eventType, { bubbles: true, cancelable: true });
            touchEvent.touches = currentTouchesWrapper.touchList;
            touchEvent.type = eventType;

            // Awesomely, I figured out how to keep track of the touches in the "Touches" TouchList using an array.
            // TODO: Do the same thing for the changedTouches and targetTouches properties of the TouchEvent.

            // The other members of the TouchEvent are altKey, metaKey, ctrlKey, and shiftKey

            return touchEvent;
        }

        function touchChangedHandler(event) {
            var eventType,
                touch,
                touchEvent;

            // console.log("touchchanged!");
            event.changedTouches = [];
            event.changedTouches.length = 1;
            event.changedTouches[0] = event;
            event.changedTouches[0].identifier = event.pointerId;

            if (event.type === "pointerup") {
                eventType = "touchend";
            } else if (event.type === "pointercancel") {
                eventType = "touchcancel";
            } else if (event.type === "pointerleave") {
                eventType = "touchleave";
            }

            touch = new currentTouchesWrapper.Touch(event.pointerId, event.target, event.screenX, event.screenY, event.clientX, event.clientY, event.pageX, event.pageY);
            currentTouchesWrapper.removeTouch(touch.identifier);

            event.type = eventType;
            touchEvent = new CustomEvent(eventType, { bubbles: true, cancelable: true });
            touchEvent.touches = currentTouchesWrapper.touchList;
            touchEvent.type = eventType;

            return touchEvent;
        }

        if (sourceEvent.type === "pointerdown" || sourceEvent.type === "pointermove") {
            evObj = touchHandler(sourceEvent);
        } else {
            evObj = touchChangedHandler(sourceEvent);
        }

        // PreventDefault
        evObj.preventDefault = function () {
            if (sourceEvent.preventDefault !== undefined) {
                sourceEvent.preventDefault();
            }
        };

        // Fire event
        // console.log("dispatching!");
        sourceEvent.target.dispatchEvent(evObj);
    }

    function generateTouchEventProxy(name, touchPoint, target, eventObject, canBubble, relatedTarget) {
        generateTouchClonedEvent(touchPoint, name, canBubble, target, relatedTarget);
    }

    function registerOrUnregisterEvent(item, name, func, enable) {
        // console.log("registerOrUnregisterEvent");
        if (item.__handJobjsRegisteredEvents === undefined) {
            item.__handJobjsRegisteredEvents = [];
        }

        if (enable) {
            if (item.__handJobjsRegisteredEvents[name] !== undefined) {
                item.__handJobjsRegisteredEvents[name] += 1;
                return;
            }

            item.__handJobjsRegisteredEvents[name] = 1;
            // console.log("adding event " + name);
            item.addEventListener(name, func, false);
        } else {

            if (item.__handJobjsRegisteredEvents.indexOf(name) !== -1) {
                item.__handJobjsRegisteredEvents[name] -= 1;

                if (item.__handJobjsRegisteredEvents[name] !== 0) {
                    return;
                }
            }
            // console.log("removing event");
            item.removeEventListener(name, func);
            item.__handJobjsRegisteredEvents[name] = 0;
        }
    }

    function setTouchAware(item, eventName, enable) {
        var eventGenerator,
            targetEvent;

        function nameGenerator(name) {
            return name;
        } // easier than doing this right and replacing all the references

        // console.log("setTouchAware " + enable + " " +eventName);
        // Leaving tokens
        if (!item.__handJobjsGlobalRegisteredEvents) {
            item.__handJobjsGlobalRegisteredEvents = [];
        }
        if (enable) {
            if (item.__handJobjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handJobjsGlobalRegisteredEvents[eventName] += 1;
                return;
            }
            item.__handJobjsGlobalRegisteredEvents[eventName] = 1;

            // console.log(item.__handJobjsGlobalRegisteredEvents[eventName]);
        } else {
            if (item.__handJobjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handJobjsGlobalRegisteredEvents[eventName] -= 1;
                if (item.__handJobjsGlobalRegisteredEvents[eventName] < 0) {
                    item.__handJobjsGlobalRegisteredEvents[eventName] = 0;
                }
            }
        }

        eventGenerator = generateTouchClonedEvent;

        //switch (eventName) {
        //    case "touchenter":
        //      // console.log("touchenter");
        //      break;
        //    case "touchleave":
        //      // console.log("touchleave");
        targetEvent = nameGenerator(eventName);

        if (item['on' + targetEvent.toLowerCase()] !== undefined) {
            registerOrUnregisterEvent(item, targetEvent, function (evt) { eventGenerator(evt, eventName); }, enable);
        }
        //        break;
        //}
    }

    // Intercept addEventListener calls by changing the prototype
    function interceptAddEventListener(root) {
        var current = root.prototype ? root.prototype.addEventListener : root.addEventListener;

        function customAddEventListener(name, func, capture) {
            // console.log("customAddEventListener");
            // console.log(name);

            if (supportedEventsNames.indexOf(name) !== -1) {
                // console.log("setting touch aware...");
                setTouchAware(this, name, true);
            }
            current.call(this, name, func, capture);
        }

        // console.log("intercepting add event listener!");
        // console.log(root);        

        if (root.prototype) {
            root.prototype.addEventListener = customAddEventListener;
        } else {
            root.addEventListener = customAddEventListener;
        }
    }

    function handleOtherEvent(eventObject, name) {
        // console.log("handle other event");
        if (eventObject.preventManipulation) {
            eventObject.preventManipulation();
        }

        // TODO: JSLint found that touchPoint here is an implied global!
        generateTouchClonedEvent(touchPoint, name);
    }

    function removeTouchAware(item, eventName) {
        // If item is already touch aware, do nothing
        if (item.ontouchdown !== undefined) {
            return;
        }

        // Chrome, Firefox
        if (item.ontouchstart !== undefined) {
            switch (eventName.toLowerCase()) {
                case "touchstart":
                    item.removeEventListener("pointerdown", function (evt) { handleOtherEvent(evt, eventName); });
                    break;
                case "touchmove":
                    item.removeEventListener("pointermove", function (evt) { handleOtherEvent(evt, eventName); });
                    break;
                case "touchend":
                    item.removeEventListener("pointerup", function (evt) { handleOtherEvent(evt, eventName); });
                    break;
                case "touchcancel":
                    item.removeEventListener("pointercancel", function (evt) { handleOtherEvent(evt, eventName); });
                    break;
            }
        }
    }

    // Intercept removeEventListener calls by changing the prototype
    function interceptRemoveEventListener(root) {
        var current = root.prototype ? root.prototype.removeEventListener : root.removeEventListener;

        function customRemoveEventListener(name, func, capture) {
            // Branch when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) !== -1) {
                removeTouchAware(this, name);
            }

            current.call(this, name, func, capture);
        }

        if (root.prototype) {
            root.prototype.removeEventListener = customRemoveEventListener;
        } else {
            root.removeEventListener = customRemoveEventListener;
        }
    }

    // commented out because it isn't used
    //    function getPrefixEventName(prefix, eventName) {
    //        var upperCaseIndex = supportedEventsNames.indexOf(eventName),
    //            newEventName = prefix + upperCaseEventsNames[upperCaseIndex];

    //        return newEventName;
    //    }

    function checkEventRegistration(node, eventName) {
        // console.log("checkEventRegistration");
        return node.__handJobjsGlobalRegisteredEvents && node.__handJobjsGlobalRegisteredEvents[eventName];
    }

    function findEventRegisteredNode(node, eventName) {
        // console.log("findEventRegisteredNode");
        while (node && !checkEventRegistration(node, eventName)) {
            node = node.parentNode;
        }
        if (node) {
            return node;
        }
        if (checkEventRegistration(window, eventName)) {
            return window;
        }
    }

    function generateTouchEventProxyIfRegistered(eventName, touchPoint, target, eventObject, canBubble, relatedTarget) { // Check if user registered this event        
        // console.log("generateTouchEventProxyIfRegistered");
        if (findEventRegisteredNode(target, eventName)) {
            generateTouchEventProxy(eventName, touchPoint, target, eventObject, canBubble, relatedTarget);
        }
    }

    function getDomUpperHierarchy(node) {
        var nodes = [];
        if (node) {
            nodes.unshift(node);
            while (node.parentNode) {
                nodes.unshift(node.parentNode);
                node = node.parentNode;
            }
        }
        return nodes;
    }

    function getFirstCommonNode(node1, node2) {
        var parents1 = getDomUpperHierarchy(node1),
            parents2 = getDomUpperHierarchy(node2),
            lastmatch = null;

        while (parents1.length > 0 && parents1[0] === parents2.shift()) {
            lastmatch = parents1.shift();
        }
        return lastmatch;
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerEnter(currentTarget, relatedTarget, generateProxy) {
        // console.log("dispatchPointerEnter");
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget),
            node = currentTarget,
            nodelist = [];

        while (node && node !== commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "touchenter")) {
                //check if any parent node has pointerenter
                nodelist.push(node);
            }
            node = node.parentNode;
        }
        while (nodelist.length > 0) {
            generateProxy(nodelist.pop());
        }
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerLeave(currentTarget, relatedTarget, generateProxy) {
        // console.log("dispatchPointerLeave");
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget),
            node = currentTarget;
        while (node && node !== commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "touchleave")) {
                //check if any parent node has pointerleave
                generateProxy(node);
            }
            node = node.parentNode;
        }
    }

    // Handling events on window to prevent unwanted super-bubbling
    // All mouse events are affected by touch fallback
    // commented out because unused
    //    function applySimpleEventTunnels(nameGenerator, eventGenerator) {
    //        // console.log("applySimpleEventTunnels");
    //        ["touchstart", "touchmove", "touchend", "touchmove", "touchleave"].forEach(function (eventName) {
    //            window.addEventListener(nameGenerator(eventName), function (evt) {
    //                if (!touching && findEventRegisteredNode(evt.target, eventName)) {
    //                    eventGenerator(evt, eventName, true);
    //                }
    //            });
    //        });
    //        if (window['on' + nameGenerator("touchenter").toLowerCase()] === undefined) {
    //            window.addEventListener(nameGenerator("touchmove"), function (evt) {
    //                var foundNode = findEventRegisteredNode(evt.target, "touchenter");
    //                if (touching) {
    //                    return;
    //                }

    //                if (!foundNode || foundNode === window) {
    //                    return;
    //                }
    //                if (!foundNode.contains(evt.relatedTarget)) {
    //                    dispatchPointerEnter(foundNode, evt.relatedTarget, function (targetNode) {
    //                        eventGenerator(evt, "touchenter", false, targetNode, evt.relatedTarget);
    //                    });
    //                }
    //            });
    //        }
    //        if (window['on' + nameGenerator("touchleave").toLowerCase()] === undefined) {
    //            window.addEventListener(nameGenerator("touchleave"), function (evt) {
    //                var foundNode = findEventRegisteredNode(evt.target, "touchleave");

    //                if (touching) {
    //                    return;
    //                }

    //                if (!foundNode || foundNode === window) {
    //                    return;
    //                }
    //                if (!foundNode.contains(evt.relatedTarget)) {
    //                    dispatchPointerLeave(foundNode, evt.relatedTarget, function (targetNode) {
    //                        eventGenerator(evt, "touchleave", false, targetNode, evt.relatedTarget);
    //                    });
    //                }
    //            });
    //        }
    //    }

    CustomEvent.prototype = window.Event.prototype;

    if (typeof (window.ontouchstart) === "object") {
        return;
    }

    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i) || userAgent.match(/Android/i) || (userAgent.match(/MSIE/i) && !userAgent.match(/Touch/i))) {
        return;
    }

    // Add CSS to disable MS IE default scrolling functionality.
    (function () {
        var css = 'html { -ms-touch-action: none; }',
            head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    } ());

    currentTouchesWrapper = new TouchListWrapper();

    window.CustomEvent = CustomEvent;

    // Hooks
    interceptAddEventListener(window);
    interceptAddEventListener(window.HTMLElement || window.Element);
    interceptAddEventListener(document);
    interceptAddEventListener(HTMLBodyElement);
    interceptAddEventListener(HTMLDivElement);
    interceptAddEventListener(HTMLImageElement);
    interceptAddEventListener(HTMLUListElement);
    interceptAddEventListener(HTMLAnchorElement);
    interceptAddEventListener(HTMLLIElement);
    interceptAddEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptAddEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptAddEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptAddEventListener(SVGElement);
    }

    interceptRemoveEventListener(window);
    interceptRemoveEventListener(window.HTMLElement || window.Element);
    interceptRemoveEventListener(document);
    interceptRemoveEventListener(HTMLBodyElement);
    interceptRemoveEventListener(HTMLDivElement);
    interceptRemoveEventListener(HTMLImageElement);
    interceptRemoveEventListener(HTMLUListElement);
    interceptRemoveEventListener(HTMLAnchorElement);
    interceptRemoveEventListener(HTMLLIElement);
    interceptRemoveEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptRemoveEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptRemoveEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptRemoveEventListener(SVGElement);
    }

    (function () {
        if (typeof (window.ontouchstart) === "object") {
            return;
        }
        // Handling move on window to detect pointerleave/out/over
        if (typeof (window.ontouchstart) === "undefined") {
            window.addEventListener('pointerdown', function (eventObject) {
                // console.log("pointerdownfired");
                var touchPoint = eventObject;

                if (eventObject.pointerType === 'mouse') {
                    return;
                }

                previousTargets[touchPoint.identifier] = touchPoint.target;
                generateTouchEventProxyIfRegistered("touchenter", touchPoint, touchPoint.target, eventObject, true);

                //pointerenter should not be bubbled
                dispatchPointerEnter(touchPoint.target, null, function (targetNode) {
                    generateTouchEventProxy("touchenter", touchPoint, targetNode, eventObject, false);
                });

                generateTouchEventProxyIfRegistered("touchstart", touchPoint, touchPoint.target, eventObject, true);

            });

            window.addEventListener('pointerup', function (eventObject) {
                var touchPoint = eventObject,
                    currentTarget = previousTargets[touchPoint.identifier];

                // console.log("pointer up fired");

                if (eventObject.pointerType === 'mouse') {
                    return;
                }

                generateTouchEventProxyIfRegistered("touchend", touchPoint, currentTarget, eventObject, true);
                generateTouchEventProxyIfRegistered("touchleave", touchPoint, currentTarget, eventObject, true);

                //pointerleave should not be bubbled
                dispatchPointerLeave(currentTarget, null, function (targetNode) {
                    generateTouchEventProxy("touchleave", touchPoint, targetNode, eventObject, false);
                });

            });

            window.addEventListener('pointermove', function (eventObject) {
                var touchPoint = eventObject,
                    currentTarget = previousTargets[touchPoint.identifier];

                console.log("pointer move fired");

                if (eventObject.pointerType === 'mouse') {
                    return;
                }

                // pointermove fires over and over when a touch-point stays stationary.
                // This is at odds with the other browsers that implement the W3C standard touch events
                // which fire touchmove only when the touch-point actual moves.
                // Therefore, return without doing anything if the pointermove event fired for a touch
                // that hasn't moved.
                if (currentTouchesWrapper.containsTouchAt(eventObject.clientX, eventObject.clientY)) {
                    return;
                }

                // If force preventDefault
                if (currentTarget && checkPreventDefault(currentTarget) === true) {
                    eventObject.preventDefault();
                }

                generateTouchEventProxyIfRegistered("touchmove", touchPoint, currentTarget, eventObject, true);
            });
        }
    } ());
} ());
