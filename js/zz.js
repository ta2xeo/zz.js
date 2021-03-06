/** -*- coding: utf-8 -*-
 * zz.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.4.2
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

var zz = new function() {

    if (!window.performance) {
        window.performance = {};
    }
    performance.now =
        performance.now ||
        performance.mozNow ||
        performance.webkitNow ||
        performance.msNow ||
        performance.oNow ||
        function() {
            return new Date().getTime();
        };

    window.requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        (function() {
            var prev = performance.now();
            return function(callback) {
                var now = prev = performance.now();
                var elapsed = now - prev;
                var delay = Math.max(1, 1000 / 60 - elapsed << 0);
                return setTimeout(callback, delay);
            };
        }());

    if (typeof Function.prototype.bind !== "function") {
        Function.prototype.bind = function(bind) {
            var self = this;
            return function() {
                var args = Array.prototype.slice.call(arguments);
                return self.apply(bind || null, args);
            };
        };
    }

    var INTERRUPT_ON_ERROR = false;

    var DEFAULT_FRAMERATE = 30;

    var DEFAULT_RETRY_COUNT = 3;

    var ENV = (function() {
        var ua = navigator.userAgent;

        var engine = (function() {
            if (ua.indexOf("WebKit") != -1) {
                return "Webkit";
            } else if (ua.indexOf("Gecko") != -1) {
                return "Gecko";
            } else {
                return "NoSupport";
            }
        })();

        var devices = [
            {
                pattern: /\((iPhone|iPad|iPod); .*CPU .*OS ([0-9]_[0-9])/,
                os: "iOS",
                model: function(match) {
                    return match[1];
                },
                version: function(match) {
                    return parseFloat(match[2].replace("_", "."));
                }
            },
            {
                pattern: /Android (\d+\.\d+)[^;]*; ?([a-z]{2}-[a-z]{2}|);? ?(\S+) /,
                os: "Android",
                model: function(match) {
                    return match[3];
                },
                version: function(match) {
                    return parseFloat(match[1]);
                }
            },
            {
                pattern: /Mozilla\/5.0 \(Windows NT/,
                os: "Windows",
                model: function(match) {
                    return "Windows";
                },
                version: function(match) {
                    return 1;
                }
            },
            {
                pattern: /Mozilla\/5.0 \((Macintosh); Intel Mac OS X (\d+[_.]\d+)/,
                os: "Mac OS X",
                model: function(match) {
                    return match[1];
                },
                version: function(match) {
                    return parseFloat(match[2].replace("_", "."));
                }
            }
        ];
        var div = document.createElement("div");
        div.setAttribute("ontouchstart", "return");

        var prefix = {
            Webkit: "webkit",
            Gecko: "Moz",
            NoSupport: ""
        }[engine];
        var transforms = ["transform", prefix + "Transform"];
        var css_transform;
        for (var i = 0, len = transforms.length; i < len; i++) {
            if (transforms[i] in div.style) {
                css_transform = transforms[i];
                break;
            }
        }

        var env = {
            USER_AGENT: ua,
            RENDERING_ENGINE: engine,
            VENDOR_PREFIX: prefix,
            OS: "Unknown",
            MODEL: "Unknown",
            VERSION: 0,
            TOUCH_ENABLED: typeof div.ontouchstart === "function",
            CSS_TRANSFORM: css_transform
        };

        for (i = 0, len = devices.length; i < len; i++) {
            var device = devices[i];
            var match = ua.match(device.pattern);
            if (match) {
                env.OS = device.os;
                env.MODEL = device.model(match);
                env.VERSION = device.version(match);
                return env;
            }
        }
        return env;
    })();

    var ANDROID = ENV.OS == "Android";
    var PREFIX = ENV.VENDOR_PREFIX;
    var ReferencePoint = {
        TOP: 1,
        BOTTOM: 2,
        MIDDLE: 3,
        LEFT: 4,
        RIGHT: 8,
        CENTER: 12,
        LEFT_TOP: 5,
        LEFT_MIDDLE: 7,
        LEFT_BOTTOM: 6,
        CENTER_TOP: 13,
        CENTER_MIDDLE: 15,
        CENTER_BOTTOM: 14,
        RIGHT_TOP: 9,
        RIGHT_MIDDLE: 11,
        RIGHT_BOTTOM: 10
    };

    /**
     * @param {Object} superClass
     * @param {Object} properties
     */
    function createClass(superClass, properties) {
        for (var property in properties) {
            if (properties.hasOwnProperty(property)) {
                if (typeof properties[property] == "function") {
                    properties[property] = {
                        writable: true,
                        enumerable: true,
                        value: properties[property]
                    };
                }
            }
        }
        return Object.create(superClass.prototype, properties);
    }

    /**
     * ZZError
     * 例外クラス
     */
    function ZZError() {
        Error.apply(this, arguments);
        this.name = "ZZError";
        this.message = arguments[0] || "";
        console.error(this.message);
    }
    ZZError.prototype = createClass(Error, {});

    /**
     * Event
     */
    var Event = new function() {
        /**
         * event type
         */
        var define = {
            ENTER_FRAME: "__zz_enter_frame__",
            COMPLETE: "__zz_complete__"
        };

        /**
         * @param {String} eventName
         */
        function Event(eventName) {
            this.name = eventName;
            this.x = 0;
            this.y = 0;
        }

        for (var key in define) {
            Event[key] = define[key];
        }

        return Event;
    };

    /**
     * TouchEvent
     */
    var TouchEvent = new function() {
        if (ENV.TOUCH_ENABLED) {
            return {
                TOUCH_DOWN: "touchstart",
                TOUCH_MOVE: "touchmove",
                TOUCH_UP: "touchend",
                TOUCH_OUT: "touchcancel"
            };
        } else {
            return {
                TOUCH_DOWN: "mousedown",
                TOUCH_MOVE: "mousemove",
                TOUCH_UP: "mouseup",
                TOUCH_OUT: "mouseout"
            };
        }
    };

    /**
     * FullScreen Mode
     */
    var StageDisplayState = {
        NORMAL: "normal",
        FULL_SCREEN: "fullscreen"
    };

    /**
     * @class EventDispatcher
     * @return {Function} _EventDispatcher
     */
    var EventDispatcher = new function() {
        /**
         * @constructor
         */
        function EventDispatcher() {
            this.eventContainer = {};
        }
        EventDispatcher.prototype = {
            /**
             * @param {String} eventName
             * @param {Function} listener
             */
            addEventListener: function(eventName, listener) {
                if (!this.eventContainer[eventName]) {
                    this.eventContainer[eventName] = [];
                }
                this.removeEventListener(eventName, listener);
                this.eventContainer[eventName].push(listener);
            },
            /**
             * @param {String} eventName
             * @param {Function} listener
             */
            removeEventListener: function(eventName, listener) {
                if (!this.eventContainer[eventName]) {
                    return;
                }
                var len = this.eventContainer[eventName].length;
                for (var i = 0; i < len; i++) {
                    if (listener == this.eventContainer[eventName][i]) {
                        this.eventContainer[eventName].splice(i, 1);
                        if (this.eventContainer[eventName].length === 0) {
                            delete this.eventContainer[eventName];
                        }
                        return;
                    }
                }
            },
            cleanEventListener: function(eventName) {
                function clear(eventName) {
                    var len = this.eventContainer[eventName].length;
                    for (var i = 0; i < len; i++) {
                        var listener = this.eventContainer[eventName][i];
                        this.removeEventListener(eventName, listener);
                    }
                }
                if (eventName) {
                    clear.call(this, eventName);
                } else {
                    for (var key in this.eventContainer) {
                        clear.call(this, key);
                    }
                }
            },
            /**
             * @param {String|Event} event
             */
            dispatchEvent: function(event) {
                if (!event) {
                    throw new ZZError("event is invalid.");
                }
                var eventName;
                var obj;
                var result = false;
                if (typeof(event) == "string") {
                    eventName = event;
                    obj = {};
                    obj.name = eventName;
                } else {
                    eventName = event.name;
                    obj = event;
                }
                obj.target = this;
                if (!this.eventContainer[eventName]) {
                    return result;
                }

                var copy = this.eventContainer[eventName].slice(0);
                for (var i = 0, len = copy.length; i < len; i++) {
                    result |= copy[i].call(this, obj);
                }
                copy = null;
                return result;
            }
        };
        return EventDispatcher;
    };

    /**
     * DisplayObject
     * @extends EventDispatcher
     */
    var DisplayObject = new function() {
        /**
         * @constructor
         */
        function DisplayObject() {
            _zz.EventDispatcher.apply(this);
            if (!this.element) {
                this.element = document.createElement("div");
            }
            this.style = this.element.style;
            this.style.position = "absolute";
            this.style.display = "none";
            this.style[PREFIX + "TapHighlightColor"] = "rgba(0,0,0,0)";
            this.style[PREFIX + "TouchCallout"] = "none";
            this.style[PREFIX + "UserSelect"] = "none";
            if (ENV.OS !== "Android" || ENV.VERSION >= 4.1) {
                this.style[PREFIX + "BackfaceVisibility"] = "hidden";
            }
            this.name = "";
            this.parent = null;
            this.x = 0;
            this.y = 0;
            this._width = 0;
            this._height = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            this.rotation = 0;
            this.alpha = 1;
            this.visible = true;
            this.inversion = false;
            this.referencePoint = ReferencePoint.LEFT | ReferencePoint.TOP;
            this._dirty = false;
            this.enabled = true;
            this._removed = false;
            this._deleted = false;
            this._execution = false;
        }

        function dispatch(event) {
            var rect = this.element.getBoundingClientRect();
            var e = new Event(event.type);
            e.ctrlKey = event.ctrlKey;
            e.altKey = event.altKey;
            e.shiftKey = event.shiftKey;
            if (ENV.TOUCH_ENABLED) {
                if (event.touches.length) {
                    e.x = event.touches[0].clientX - rect.left << 0;
                    e.globalX = e.x + this.x;
                    e.y = event.touches[0].clientY - rect.top << 0;
                    e.globalY = e.y + this.y;
                }
            } else {
                e.x = event.clientX - rect.left << 0;
                e.globalX = e.x + this.x;
                e.y = event.clientY - rect.top << 0;
                e.globalY = e.y + this.y;
            }
            var stop = this.dispatchEvent(e);
            if (stop) {
                event.preventDefault();
                event.stopPropagation();
            }
        }

        var css_transform = ENV.CSS_TRANSFORM;
        DisplayObject.prototype = createClass(EventDispatcher, {
            transform: function() {
                this.style[css_transform] = [
                    "translate(" + this._x + "px," + this._y + "px)",
                    "rotate(" + this.rotation + "deg)",
                    "scale(" + (this.inversion ? -this.scaleX : this.scaleX) + "," + this.scaleY + ")"
                ].join(" ");
            },
            setPosition: function(x, y) {
                this.x = x;
                this.y = y;
            },
            setSize: function(width, height) {
                this.width = width;
                this.height = height;
            },
            setRect: function(x, y, width, height) {
                this.setPosition(x, y);
                this.setSize(width, height);
            },
            addEventListener: function(eventName, listener) {
                _zz.EventDispatcher.prototype.addEventListener.apply(this, arguments);
                if (eventName == Event.ENTER_FRAME) {
                    this._execute();
                }
                for (var key in TouchEvent) {
                    var name = TouchEvent[key];
                    if (eventName !== name) {
                        continue;
                    }
                    if (!this.element["on" + name]) {
                        this.element["on" + name] = function(event) {
                            if (this.enabled) {
                                dispatch.call(this, event);
                            }
                        }.bind(this);
                    }
                }

            },
            removeEventListener: function(eventName, listener) {
                _zz.EventDispatcher.prototype.removeEventListener.apply(this, arguments);
                for (var key in TouchEvent) {
                    var name = TouchEvent[key];
                    if (eventName !== name) {
                        continue;
                    }
                    if (!(name in this.eventContainer)) {
                        this.element["on" + name] = null;
                    }
                }
            },
            dispatchEvent: function(event) {
                if (!this._deleted) {
                    return _zz.EventDispatcher.prototype.dispatchEvent.apply(this, arguments);
                }
            },
            _execute: function() {
                this._execution = true;
                if (this.parent && !this.parent._execution) {
                    this.parent._execute();
                }
            },
            onEnterFrame: function() {
                this.dispatchEvent(Event.ENTER_FRAME);
                if (this._deleted) {
                    return;
                }
                if (this._dirty) {
                    this.transform();
                    this._dirty = false;
                }
                this._execution = false;
                if (Event.ENTER_FRAME in this.eventContainer) {
                    this._execute();
                }
            },
            globalToLocal: function(globalX, globalY) {
                throw new ZZError("Not implemented error.");
            },
            localToGlobal: function(localX, localY) {
                var x = localX, y = localY;
                if (!x) {
                    x = this.x;
                }
                if (!y) {
                    y = this.y;
                }
                console.log(x, y);
                return {
                    x: x,
                    y: y
                };
            },
            render: function() {
            },
            _dirty: {
                get: function() {
                    return this.__dirty;
                },
                set: function(dirty) {
                    if (dirty && !this._execution) {
                        this._execute();
                    }
                    this.__dirty = dirty;
                }
            },
            name: {
                get: function() {
                    return this._name;
                },
                set: function(name) {
                    if (this.parent) {
                        if (this._name in this.parent.nameMap) {
                            this.parent.nameMap[this._name] = null;
                        }
                        if (name in this.parent.nameMap) {
                            throw new ZZError("duplicate key error. " + name + " is already defined.");
                        }
                        if (name) {
                            this.parent.nameMap[name] = this;
                        }
                    }
                    this._name = name;
                }
            },
            root: {
                get: function() {
                    var current = this;
                    var parent = this.parent;
                    while (parent) {
                        current = parent;
                        parent = parent.parent;
                    }
                    return current;
                }
            },
            x: {
                get: function() {
                    return this._x;
                },
                set: function(x) {
                    this._x = x;
                    this._dirty = true;
                }
            },
            y: {
                get: function() {
                    return this._y;
                },
                set: function(y) {
                    this._y = y;
                    this._dirty = true;
                }
            },
            width: {
                get: function() {
                    return this._width;
                },
                set: function(width) {
                    this._width = width;
                    this.style.width = width + "px";
                    this.referencePoint = this._reference;
                }
            },
            height: {
                get: function() {
                    return this._height;
                },
                set: function(height) {
                    this._height = height;
                    this.style.height = height + "px";
                    this.referencePoint = this._reference;
                }
            },
            scaleX: {
                get: function() {
                    return this._scaleX;
                },
                set: function(scale) {
                    this._scaleX = scale;
                    this._dirty = true;
                }
            },
            scaleY: {
                get: function() {
                    return this._scaleY;
                },
                set: function(scale) {
                    this._scaleY = scale;
                    this._dirty = true;
                }
            },
            scale: {
                get: function() {
                    return this._scaleX;
                },
                set: function(scale) {
                    this._scaleX = scale;
                    this._scaleY = scale;
                    this._dirty = true;
                }
            },
            rotation: {
                get: function() {
                    return this._rotation;
                },
                set: function(rotation) {
                    this._rotation = rotation;
                    this._dirty = true;
                }
            },
            alpha: {
                get: function() {
                    return this._alpha;
                },
                set: function(alpha) {
                    this.style.opacity = this._alpha = alpha;
                }
            },
            visible: {
                get: function() {
                    return this._visible;
                },
                set: function(visible) {
                    if (visible == this._visible) {
                        return;
                    }
                    this._visible = visible;
                    var self = this;
                    function display() {
                        if (self._visible) {
                            self.style.display = "block";
                        } else {
                            self.style.display = "none";
                        }
                        self.removeEventListener(Event.ENTER_FRAME, display);
                    }
                    this.addEventListener(Event.ENTER_FRAME, display);
                }
            },
            backgroundColor: {
                get: function() {
                    return this.style.backgroundColor;
                },
                set: function(color) {
                    this.style.backgroundColor = color;
                }
            },
            inversion: {
                get: function() {
                    return this._inversion;
                },
                set: function(invert) {
                    this._inversion = invert;
                    this.referencePoint = this.referencePoint;
                    this._dirty = true;
                }
            },
            referencePoint: {
                get: function() {
                    return this._reference;
                },
                set: function(point) {
                    this._reference = point;
                    if ((point & ReferencePoint.CENTER) == ReferencePoint.CENTER) {
                        this.referenceX = 50;
                        this.style.left = -(this.width / 2 << 0) + "px";
                    } else if ((point & ReferencePoint.RIGHT) == ReferencePoint.RIGHT) {
                        if (this.inversion) {
                            this.referenceX = 0;
                            this.style.left = "0px";
                        } else {
                            this.referenceX = 100;
                            this.style.left = -this.width + "px";
                        }
                    } else {
                        if (this.inversion) {
                            this.referenceX = 100;
                            this.style.left = -this.width + "px";
                        } else {
                            this.referenceX = 0;
                            this.style.left = "0px";
                        }
                    }
                    if ((point & ReferencePoint.MIDDLE) == ReferencePoint.MIDDLE || point == ReferencePoint.CENTER) {
                        this.referenceY = 50;
                        this.style.top = -(this.height / 2 << 0) + "px";
                    } else if ((point & ReferencePoint.BOTTOM) == ReferencePoint.BOTTOM) {
                        this.referenceY = 100;
                        this.style.top = -this.height + "px";
                    } else {
                        this.referenceY = 0;
                        this.style.top = "0px";
                    }
                    this.style[PREFIX + "TransformOrigin"] = this.referenceX + "% " + this.referenceY + "%";
                    this._dirty = true;
                }
            },
            removeSelf: function() {
                this._removed = true;
                if (this.parent) {
                    this.parent.element.removeChild(this.element);
                    this.parent.children.splice(this.parent.getChildIndex(this), 1);
                    this.parent = null;
                }
            },
            discard: function() {
                this.removeSelf();
                this._deleted = true;
                for (var eventName in TouchEvent) {
                    this.element["on" + TouchEvent[eventName]] = null;
                }
                this.element = null;
                this.cleanEventListener();
                this.style = null;
            }
        });
        return DisplayObject;
    };

    /**
     * DisplayObjectContainer
     * @extends DisplayObject
     */
    var DisplayObjectContainer = new function() {
        /**
         * @constructor
         */
        function DisplayObjectContainer() {
            _zz.DisplayObject.apply(this);
            this.children = [];
            this.nameMap = {};
        }
        DisplayObjectContainer.prototype = createClass(DisplayObject, {
            /**
             * @param {DisplayObject} child
             */
            addChild: function(child) {
                this.addChildAt(child, this.numChildren);
            },
            /**
             * @param {DisplayObject} child
             * @param {Int} index
             */
            addChildAt: function(child, index) {
                if (child instanceof _zz.DisplayObject === false) {
                    throw new ZZError(Object.prototype.toString(child) + " is not DisplayObject.");
                }
                if (child.parent) {
                    throw new ZZError(Object.prototype.toString(child) + " is already child.");
                }
                child._removed = false;
                child.parent = this;
                if (index < this.numChildren) {
                    this.element.insertBefore(child.element, this.children[index].element);
                } else {
                    this.element.appendChild(child.element);
                }
                this.children.splice(index, 0, child);
                child.transform();
                if (child.name) {
                    if (child.name in this.nameMap) {
                        throw new ZZError("duplicate key error. " + child.name + " is already defined.");
                    }
                    this.nameMap[child.name] = child;
                }
                this._execute();
            },
            /**
             * @param {DisplayObject}
             */
            removeChild: function(child) {
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i] == child) {
                        this.removeChildAt(i);
                        break;
                    }
                }
            },
            /**
             * @param {Int} index
             */
            removeChildAt: function(index) {
                var child = this.getChildAt(index);
                if (child) {
                    child.removeSelf();
                }
            },
            /**
             * @param {Int} index
             */
            getChildAt: function(index) {
                return this.children[index];
            },
            /**
             * @param {String} name
             */
            getChildByName: function(name) {
                if (name in this.nameMap) {
                    return this.nameMap[name];
                }
                return null;
            },
            /**
             * @param {DisplayObject} child
             */
            getChildIndex: function(child) {
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i] == child) {
                        return i;
                    }
                }
                throw new ZZError("child is not contained.");
            },
            /**
             * @param {DisplayObject} child
             * @param {Int} index
             */
            setChildIndex: function(child, index) {
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (i != index && this.children[i] == child && index < len) {
                        if (index < i) {
                            this.element.insertBefore(child.element, this.children[index].element);
                        } else {
                            this.element.insertBefore(child.element, this.children[index].element.nextSibling);
                        }
                        this.children.splice(i, 1);
                        this.children.splice(index, 0, child);
                        break;
                    }
                }
            },
            /**
             * @param {DisplayObject} child1
             * @param {DisplayObject} child2
             */
            swapChildren: function(child1, child2) {
                var index1 = -1;
                var index2 = -1;
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i] == child1) {
                        index1 = i;
                    } else if (this.children[i] == child2) {
                        index2 = i;
                    }
                }
                if (index1 >= 0 && index2 >= 0) {
                    this.children.splice(index1, 1, child2);
                    this.children.splice(index2, 1, child1);
                    // swap element
                    var child1_next = child1.element.nextSibling;
                    var child2_next = child2.element.nextSibling;
                    if (child1_next === null) {
                        this.element.insertBefore(child1.element, child2_next);
                        this.element.insertBefore(child2.element, child1_next);
                    } else {
                        this.element.insertBefore(child2.element, child1_next);
                        this.element.insertBefore(child1.element, child2_next);
                    }
                }
            },
            render: function() {
                if (this.visible) {
                    _zz.DisplayObject.prototype.render.call(this);
                    for (var i = 0, len = this.numChildren; i < len; i++) {
                        if (this.children[i]) {
                            this.children[i].render();
                        }
                    }
                }
            },
            onEnterFrame: function() {
                if (!this._execution) {
                    return;
                }
                _zz.DisplayObject.prototype.onEnterFrame.apply(this);

                // This container is already deleted.
                if (this._deleted) {
                    return;
                }

                var copy = this.children.slice(0);
                for (var i = 0, len = copy.length; i < len; i++) {
                    var c = copy[i];
                    if (!c._removed && c._execution) {
                        c.onEnterFrame();
                    }
                }
                copy = null;
            },
            numChildren: {
                get: function() {
                    return this.children.length;
                }
            },
            discard: function() {
                while (this.numChildren > 0) {
                    this.getChildAt(0).discard();
                }
                _zz.DisplayObject.prototype.discard.call(this);
                this.children = null;
                this.nameMap = null;
            }
        });
        return DisplayObjectContainer;
    };

    /**
     * Stage
     * @extends DisplayObjectContainer
     */
    var Stage = new function() {
        var executing = false;

        /**
         * @param {String} stageId
         */
        function Stage(stageId) {
            var root = document.getElementById(stageId);
            if (!root) {
                root = document.createElement("div");
                root.id = stageId;
                root.style.width = window.innerWidth + "px";
                root.style.height = window.innerHeight + "px";
                document.body.appendChild(root);
            }
            this.element = root;
            _zz.DisplayObjectContainer.apply(this);
            this.frameRate = DEFAULT_FRAMERATE;
            this.x = 0;
            this.y = 0;
            this.parent = null;
            this.style = root.style;
            this.style.position = "relative";
            this.style.overflow = "hidden";
            this._width = parseInt(this.style.width, 10);
            this._height = parseInt(this.style.height, 10);
            this.handle = null;
            this.start();
            // this.renderLoop();
        }
        Stage.prototype = createClass(DisplayObjectContainer, {
            onEnterFrame: function() {
                executing = true;
                var prev = performance.now();
                _zz.DisplayObjectContainer.prototype.onEnterFrame.call(this);
                var elapsed = performance.now() - prev;
                var wait = Math.max(1, 1000 / this.frameRate - elapsed << 0);
                if (!this._pause && this._execution) {
                    this.setOnEnterFrame(wait);
                } else {
                    this.handle = null;
                }
                executing = false;
            },
            setOnEnterFrame: function(waitTime) {
                var self = this;
                this.handle = setTimeout(function() {
                    self.onEnterFrame();
                }, waitTime);
            },
            _execute: function() {
                _zz.DisplayObjectContainer.prototype._execute.call(this);
                if (!executing && !this.running && !this._pause) {
                    var wait = Math.max(1, 1000 / this.frameRate << 0);
                    this.setOnEnterFrame(wait);
                }
            },
            renderLoop: function() {
                var self = this;
                self.render();
                requestAnimationFrame(function() {
                    self.renderLoop();
                });
            },
            start: function() {
                this._pause = false;
                if (!this.running) {
                    this.onEnterFrame();
                }
            },
            pause: function() {
                this._pause = true;
                if (this.handle) {
                    clearTimeout(this.handle);
                    this.handle = null;
                }
            },
            running: {
                get: function() {
                    return this.handle !== null;
                }
            },
            removeSelf: function() {
                this.element.parentNode.removeChild(this.element);
                _zz.DisplayObjectContainer.prototype.removeSelf.call(this);
            },
            discard: function() {
                this.pause();
                _zz.DisplayObjectContainer.prototype.discard.call(this);
            },
            displayState: {
                set: function(state) {
                    var prefix = PREFIX.toLowerCase();
                    switch (state) {
                    case StageDisplayState.FULL_SCREEN:
                        if (typeof document[prefix + "CancelFullScreen"] != "undefined") {
                            if (this.displayState != StageDisplayState.FULL_SCREEN) {
                                if (this.element[prefix + "RequestFullScreen"]) {
                                    this.element[prefix + "RequestFullScreen"]();
                                }
                            }
                        }
                        break;
                    case StageDisplayState.NORMAL:
                        if (document[prefix + "CancelFullScreen"]) {
                            document[prefix + "CancelFullScreen"]();
                        }
                        break;
                    default:
                        break;
                    }
                },
                get: function() {
                    var prefix = PREFIX.toLowerCase();
                    if (prefix == "webkit" && document.webkitIsFullScreen ||
                        document.fullScreen || document[prefix + "FullScreen"]) {
                        return StageDisplayState.FULL_SCREEN;
                    }
                    return StageDisplayState.NORMAL;
                }
            }
        });
        return Stage;
    };

    /**
     * Sprite
     * @extends DisplayObjectContainer
     */
    var Sprite = new function() {
        /**
         * @constructor
         */
        function Sprite(src, x, y) {
            _zz.DisplayObjectContainer.apply(this);
            if (arguments.length > 0) {
                this.loadImage(src);
            }
            if (x != undefined && y != undefined) {
                this.setPosition(x, y);
            }
            this.tx = 0;
            this.ty = 0;
            this.tw = this._clearWidth = this.width;
            this.th = this._clearHeight = this.height;
            this.loaded = false;
            this.imageData = null;
            this._originalImageData = null;
            this._brightness = 0;
            this._red = 100;
            this._green = 100;
            this._blue = 100;
            this._canvasDirty = true;
            this._canvasResizeDirty = false;

            this.addEventListener(Sprite.RENDER, function() {
                if (this.loaded) {
                    // this.context.clearRect(0, 0, this._clearWidth, this._clearHeight);
                    // this._clearWidth = this.width;
                    // this._clearHeight = this.height;

                    this.canvas.width = this.canvas.width;  // above similar

                    if (this.imageData) {
                        this.context.putImageData(this.imageData, 0, 0);
                    } else {
                        this.context.drawImage(this.img, this.tx, this.ty, this.tw, this.th, 0, 0, this.width, this.height);
                    }
                }
            });

            this.addEventListener(Event.COMPLETE, function() {
                this.tw = this._clearWidth = this.img.width;
                this.th = this._clearHeight = this.img.height;
                this.referencePoint = this._reference;
                this.loaded = true;
                this._canvasDirty = true;
            });
        }

        Sprite.RENDER = "__zz_sprite_render__";

        Sprite.prototype = createClass(DisplayObjectContainer, {
            discard: function() {
                if (this.canvas) {
                    this.element.removeChild(this.canvas);
                }
                this.canvas = null;
                this.context = null;
                this.img = null;
                this.imageData = null;
                this._originalImageData = null;
                _zz.DisplayObjectContainer.prototype.discard.call(this);
            },
            onEnterFrame: function() {
                _zz.DisplayObjectContainer.prototype.onEnterFrame.call(this);
                if (this._canvasResizeDirty) {
                    this.resetCanvas();
                }
                if (this._canvasDirty) {
                    this.dispatchEvent(Sprite.RENDER);
                    this._canvasDirty = false;
                }
            },
            resetCanvas: function() {
                if (this.canvas) {
                    this.element.removeChild(this.canvas);
                }
                this.canvas = document.createElement("canvas");
                this.element.insertBefore(this.canvas, this.element.firstChild);
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                this.context = this.canvas.getContext("2d");
                this._canvasResizeDirty = false;
            },
            tx: {
                get: function() {
                    return this._tx;
                },
                set: function(tx) {
                    this._canvasDirty = true;
                    this._tx = tx;
                }
            },
            ty: {
                get: function() {
                    return this._ty;
                },
                set: function(ty) {
                    this._canvasDirty = true;
                    this._ty = ty;
                }
            },
            tw: {
                get: function() {
                    return this._tw;
                },
                set: function(tw) {
                    this._canvasDirty = true;
                    if (tw > this._clearWidth) {
                        this._clearWidth = tw;
                    }
                    this.width = this._tw = tw;
                }
            },
            th: {
                get: function() {
                    return this._th;
                },
                set: function(th) {
                    this._canvasDirty = true;
                    if (th > this._clearHeight) {
                        this._clearHeight = th;
                    }
                    this.height = this._th = th;
                }
            },
            width: {
                get: function() {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    return _super.get.call(this);
                },
                set: function(width) {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    if (this.canvas && width !== this.canvas.width) {
                        this._canvasResizeDirty = true;
                    }
                    _super.set.call(this, width);
                }
            },
            height: {
                get: function() {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "height");
                    return _super.get.call(this);
                },
                set: function(height) {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "height");
                    if (this.canvas && height !== this.canvas.height) {
                        this._canvasResizeDirty = true;
                    }
                    _super.set.call(this, height);
                }
            },
            _canvasResizeDirty: {
                get: function() {
                    return this.__canvasResizeDirty;
                },
                set: function(dirty) {
                    if (dirty) {
                        this._canvasDirty = true;
                    }
                    this.__canvasResizeDirty = dirty;
                }
            },
            _canvasDirty: {
                get: function() {
                    return this.__canvasDirty;
                },
                set: function(dirty) {
                    if (dirty && !this._execution) {
                        this._execute();
                    }
                    this.__canvasDirty = dirty;
                }
            },
            /**
             * @param {Int} tx
             * @param {Int} ty
             * @param {Int} tw
             * @param {Int} th
             */
            trimming: function(tx, ty, tw, th) {
                function trim() {
                    this.removeEventListener(Event.COMPLETE, trim);
                    if (tx < 0) {
                        tx = 0;
                    } else if (this.loaded && tx > this.img.width) {
                        tx = this.img.width;
                    }

                    this.tx = tx;
                    if (ty < 0) {
                        ty = 0;
                    } else if (this.loaded && ty > this.img.height) {
                        ty = this.img.height;
                    }
                    this.ty = ty;

                    if (tw <= 0) {
                        tw = 1;
                    } else if (tw > this.img.width) {
                        tw = this.img.width;
                    }
                    this.tw = tw;

                    if (th <= 0) {
                        th = 1;
                    } else if (th > this.img.height) {
                        th = this.img.height;
                    }
                    this.th = th;
                    this.referencePoint = this._reference;
                }
                if (this.loaded) {
                    trim.call(this);
                } else {
                    this.addEventListener(Event.COMPLETE, trim);
                }
            },
            loadImage: function(src) {
                this.loaded = false;
                if (!this.canvas) {
                    this.resetCanvas();
                }
                var self = this;
                this.img = _zz.loadImage(src, function(event) {
                    self.dispatchEvent(new Event(Event.COMPLETE));
                });
            },
            /**
             * @param {Sprite} self
             */
            setImageData: function() {
                if (this.loaded) {
                    this.getImageData();
                } else {
                    var self = this;
                    var setImage = function() {
                        self.getImageData();
                        self.removeEventListener(Event.COMPLETE, setImage);
                    };
                    this.addEventListener(Event.COMPLETE, setImage);
                }
            },
            brightness: {
                get: function() {
                    return this._brightness;
                },
                /**
                 * @param {Int} brightness -100~100(default:0)
                 */
                set: function(brightness) {
                    if (this._brightness == brightness) {
                        return;
                    }
                    this._brightness = brightness;
                    if (ANDROID) {
                        return;
                    } else {
                        this.setImageData();
                        // not implemented
                        //this.style[PREFIX + "Filter"] = "brightness(" + brightness + "%)";
                    }
                }
            },
            red: {
                get: function() {
                    return this._red;
                },
                /**
                 * @param {Int} red 0~100(default:100)
                 */
                set: function(red) {
                    if (this._red == red) {
                        return;
                    }
                    this._red = red;
                    if (ANDROID) {
                        return;
                    }
                    this.setImageData();
                }
            },
            green: {
                get: function() {
                    return this._green;
                },
                /**
                 * @param {Int} green 0~100(default:100)
                 */
                set: function(green) {
                    if (this._green == green) {
                        return;
                    }
                    this._green = green;
                    if (ANDROID) {
                        return;
                    }
                    this.setImageData();
                }
            },
            blue: {
                get: function() {
                    return this._blue;
                },
                /**
                 * @param {Int} blue 0~100(default:100)
                 */
                set: function(blue) {
                    if (this._blue == blue) {
                        return;
                    }
                    this._blue = blue;
                    if (ANDROID) {
                        return;
                    }
                    this.setImageData();
                }
            },
            getImageData: function() {
                if (this._originalImageData === null) {
                    this.context.clearRect(0, 0, this._width, this._height);
                    this.context.drawImage(this.img, this.tx, this.ty, this.tw, this.th, 0, 0, this._width, this._height);
                    this._originalImageData = this.context.getImageData(0, 0, this._width, this._height);
                }
                var input = this._originalImageData.data;
                this.imageData = this.context.createImageData(this._width, this._height);
                var output = this.imageData.data;
                var w = this.imageData.width;
                var h = this.imageData.height;
                for (var y = 0; y < h; y++) {
                    for (var x = 0; x < w; x++) {
                        var ptr = (y * w + x) * 4;
                        if (input[ptr + 3] === 0) {
                            continue;
                        }
                        output[ptr + 0] = input[ptr + 0] * this._red / 100 + this._brightness * 255 / 100;
                        output[ptr + 1] = input[ptr + 1] * this._green / 100 + this._brightness * 255 / 100;
                        output[ptr + 2] = input[ptr + 2] * this._blue / 100 + this._brightness * 255 / 100;
                        output[ptr + 3] = input[ptr + 3];
                    }
                }
                this._canvasDirty = true;
            }
        });
        return Sprite;
    };

    /**
     * MovieClip
     */
    var MovieClip = new function() {
        /**
         * @constructor
         */
        function MovieClip(src, x, y) {
            _zz.Sprite.apply(this, arguments);
            this.currentFrame = 1;
            this.frames = [undefined];
            this.playing = true;
            this.currentLabel = "";
            this._mcDirty = true;
        }
        MovieClip.prototype = createClass(Sprite, {
            /**
             * フレームの総数
             */
            totalFrames: {
                get: function() {
                    return this.frames.length - 1;
                }
            },
            /**
             * @param {Object} data
             */
            setAnimation: function(data) {
                this.frames = [undefined];
                var tweenIndices = [];
                var sortedFrames = Object.keys(data).sort(function(a, b) {
                    a = parseInt(a, 10);
                    b = parseInt(b, 10);
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                });
                for (var i = 0, len = sortedFrames.length; i < len; i++) {
                    var frame = parseInt(sortedFrames[i], 10);
                    var d = data[frame];
                    this.frames[frame] = d;
                    if ("tween" in d) {
                        tweenIndices.push(frame);
                    }
                }

                function interpolate(startFrame, property) {
                    var val = this.frames[startFrame][property];
                    for (var i = 0, len = sortedFrames.length; i < len; i++) {
                        var f = parseInt(sortedFrames[i], 10);
                        if (f <= startFrame) {
                            continue;
                        }
                        if (this.frames[f][property] !== undefined) {
                            var size = f - startFrame;
                            var step = (this.frames[f][property] - val) / size;
                            for (var frame = startFrame + 1, endFrame = frame + size; frame < endFrame - 1; frame++) {
                                if (!this.frames[frame]) {
                                    this.frames[frame] = {};
                                }
                                var v = val + (frame - startFrame) * step;
                                if (property in {x: 1, y: 1, rotation: 1}) {
                                    v = v << 0;
                                }
                                this.frames[frame][property] = v;
                            }
                            break;
                        }
                    }
                }

                for (i = 0, len = tweenIndices.length; i < len; i++) {
                    var start = this.frames[tweenIndices[i]];
                    var tween = start["tween"];
                    for (var property in start) {
                        if (tween !== true && tween.indexOf(property) === -1 || typeof start[property] !== "number") {
                            continue;
                        }
                        interpolate.call(this, tweenIndices[i], property);
                    }
                }
            },
            _mcDirty: {
                get: function() {
                    return this.__mcDirty;
                },
                set: function(dirty) {
                    if (dirty && !this._execution) {
                        this._execute();
                    }
                    this.__mcDirty = dirty;
                }
            },
            play: function() {
                ++this.currentFrame;
                if (this.currentFrame >= this.frames.length) {
                    this.currentFrame = 1;
                }
                this.playing = true;
                this._mcDirty = true;
            },
            stop: function() {
                this.playing = false;
                this._mcDirty = true;
            },
            setFrame: function(frame) {
                if (typeof(frame) == "string") {
                    for (var i in this.frames) {
                        var label = this.frames[i] && this.frames[i]["label"];
                        if (label == frame) {
                            this.currentFrame = i;
                            break;
                        }
                    }
                } else {
                    this.currentFrame = frame;
                }
                this._mcDirty = true;
            },
            gotoAndPlay: function(frame) {
                this.playing = true;
                this.setFrame(frame);
                this.applyFrame(this.currentFrame);
                this.transform();
            },
            gotoAndStop: function(frame) {
                this.playing = false;
                this.setFrame(frame);
                this.applyFrame(this.currentFrame);
                this.transform();
            },
            applyFrame: function(frame) {
                var property = this.frames[frame];
                if (property != undefined && this._mcDirty) {
                    var event = null;
                    for (var key in property) {
                        switch (key) {
                        case "stop":
                            this.playing = false;
                            break;
                        case "gotoAndPlay":
                            this.gotoAndPlay(property[key]);
                            break;
                        case "gotoAndStop":
                            this.gotoAndStop(property[key]);
                            break;
                        case "label":
                            this.currentLabel = property[key];
                            break;
                        case "event":
                            event = property[key];
                            break;
                        default:
                            this[key] = property[key];
                            break;
                        }
                    }
                    if (event) {
                        if (typeof event == "function") {
                            event.call(this);
                        } else {
                            this.dispatchEvent(event);
                        }
                    }
                    this._mcDirty = false;
                }
            },
            onEnterFrame: function() {
                this.applyFrame(this.currentFrame);
                _zz.Sprite.prototype.onEnterFrame.call(this);
                if (this.playing) {
                    ++this.currentFrame;
                    if (this.currentFrame >= this.frames.length) {
                        this.currentFrame = 1;
                    }
                    this._mcDirty = true;
                }
            }
        });
        return MovieClip;
    };

    var TextFormatAlign = {
        CENTER: "center",
        JUSTIFY: "justify",
        LEFT: "left",
        RIGHT: "right"
    };

    /**
     * TextFormat
     */
    var TextFormat = new function() {
        function TextFormat() {
            this.font = "";
            this.bold = false;
            this.italic = false;
            this.size = null;
            this.color = "";
            this.leading = null;
            this.align = null;
        }
        return TextFormat;
    };

    var TextFieldAutoSize = {
        CENTER: "center",
        LEFT: "left",
        NONE: "none",
        RIGHT: "right"
    };

    /**
     * TextField
     * @extends DisplayObject
     */
    var TextField = new function() {
        /**
         * create element to get text size.
         */
        var ruler;
        window.addEventListener("load", function(e) {
            ruler = document.createElement("span");
            ruler.style.visibility = "hidden";
            ruler.style.position = "absolute";
            ruler.style.whiteSpace = "nowrap";
            ruler.style.left = "0px";
            ruler.style.top = "-50px";
            document.body.appendChild(ruler);
        });

        /**
         * @constructor
         */
        function TextField(text) {
            _zz.DisplayObject.apply(this);
            this.text = text || "";
            this.style.visibility = "hidden";
            this.style.display = "block";
            this.visible = true;
            this.wordWrap = false;
            this.autoSize = TextFieldAutoSize.NONE;
        }
        TextField.prototype = createClass(DisplayObject, {
            wordWrap: {
                get: function() {
                    return this.style.whiteSpace == "normal";
                },
                set: function(wrap) {
                    ruler.style.whiteSpace = wrap ? "normal" : "nowrap";
                    this.style.whiteSpace = ruler.style.whiteSpace;
                }
            },
            autoSize: {
                get: function() {
                    return this._autoSize;
                },
                set: function(value) {
                    this._autoSize = value;
                    switch (value) {
                    case TextFieldAutoSize.CENTER:
                        this.style.textAlign = ruler.style.textAlign = TextFormatAlign.CENTER;
                        break;
                    case TextFieldAutoSize.LEFT:
                        this.style.textAlign = ruler.style.textAlign = TextFormatAlign.LEFT;
                        break;
                    case TextFieldAutoSize.NONE:
                        this.style.textAlign = ruler.style.textAlign = TextFormatAlign.LEFT;
                        break;
                    case TextFieldAutoSize.RIGHT:
                        this.style.textAlign = ruler.style.textAlign = TextFormatAlign.RIGHT;
                        break;
                    default:
                        throw new ZZError(value + "is invalid argument.");
                        break;
                    }
                    this.text = this.text;
                }
            },
            defaultTextFormat: {
                get: function() {
                    return this._defaultTextFormat;
                },
                set: function(fmt) {
                    this._defaultTextFormat = fmt;
                    if (fmt.align) {
                        this.style.textAlign = fmt.align;
                    }
                    this.style.fontFamily = fmt.font;
                    this.style.fontWeight = fmt.bold ? "bold" : "normal";
                    this.style.fontStyle = fmt.italic ? "italic" : "normal";
                    this.style.fontSize = fmt.size ? fmt.size + "px" : "";
                    this.style.lineHeight = fmt.size ? (fmt.size + (fmt.leading || 0) * 2) + "px" : "";
                    this.style.color = fmt.color;
                    this.text = this.text;
                }
            },
            width: {
                get: function() {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    return _super.get.call(this);
                },
                set: function(width) {
                    if (this.autoSize !== TextFieldAutoSize.NONE && this.wordWrap) {
                        ruler.style.width = width + "px";
                    } else {
                        ruler.style.width = "";
                    }
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    _super.set.call(this, width);
                }
            },
            text: {
                get: function() {
                    return this.element.innerHTML;
                },
                set: function(text) {
                    if (this.autoSize === TextFieldAutoSize.NONE) {
                        this.element.innerHTML = ruler.innerHTML = text;
                    } else {
                        var s = ruler.style;
                        s.fontFamily = this.style.fontFamily;
                        s.fontWeight = this.style.fontWeight;
                        s.fontStyle = this.style.fontStyle;
                        s.fontSize = this.style.fontSize;
                        s.lineHeight = this.style.lineHeight;
                        ruler.innerHTML = text;
                        this.setSize(ruler.scrollWidth, ruler.scrollHeight);
                        this.element.innerHTML = text;
                    }
                }
            },
            textColor: {
                get: function() {
                    return this.style.color;
                },
                set: function(color) {
                    this.style.color = color;
                }
            },
            visible: {
                get: function() {
                    return this._visible;
                },
                set: function(visible) {
                    this._visible = visible;
                    var self = this;
                    function display() {
                        if (self._visible) {
                            self.style.visibility = "visible";
                        } else {
                            self.style.visibility = "hidden";
                        }
                        self.removeEventListener(Event.ENTER_FRAME, display);
                    }
                    this.addEventListener(Event.ENTER_FRAME, display);
                }
            }
        });
        return TextField;
    };

    var registration = {
        ENV: ENV,
        ZZError: ZZError,
        Event: Event,
        TouchEvent: TouchEvent,
        ReferencePoint: ReferencePoint,
        StageDisplayState: StageDisplayState,
        EventDispatcher: EventDispatcher,
        DisplayObject: DisplayObject,
        DisplayObjectContainer: DisplayObjectContainer,
        Stage: Stage,
        Sprite: Sprite,
        MovieClip: MovieClip,
        TextFormatAlign: TextFormatAlign,
        TextFormat: TextFormat,
        TextFieldAutoSize: TextFieldAutoSize,
        TextField: TextField
    };

    var _zz = {
        globalize: function() {
            for (var key in registration) {
                window[key] = registration[key];
            }
        },
        createClass: createClass,
        /**
         * preload image files.
         * @param {String[]} assets
         * @param {Function} complete
         * @param {Function} callback
         */
        preload: function(assets, complete, callback) {
            if (!(assets instanceof Array)) {
                throw new ZZError("assets must be array.");
            }
            var assetsCount = assets.length;
            function checkLoad() {
                --assetsCount;
                if (typeof callback == "function") {
                    var len = assets.length;
                    var loaded = len - assetsCount;
                    var percent = loaded * 100 / len;
                    callback(percent, loaded, len);
                }
                if (assetsCount === 0) {
                    if (typeof complete == "function") {
                        complete();
                    }
                }
            }
            var resources = [];
            for (var i = 0; i < assetsCount; ++i) {
                resources.push(_zz.load(assets[i], checkLoad));
            }
            return resources;
        },
        loadImage: function(src, callback) {
            if (!src) {
                new ZZError("Image path is undefined.");
            }
            var img = new Image();
            img.src = src;
            var retryLimit = DEFAULT_RETRY_COUNT;
            var retryCount = 0;

            img.onerror = function(event) {
                if (retryCount < retryLimit) {
                    var delay = retryCount * 1000 || 500;
                    ++retryCount;
                    setTimeout(function() {
                        img.src = src;
                    }, delay);
                } else {
                    if (INTERRUPT_ON_ERROR) {
                        throw new ZZError('Could not load image files: ' + src);
                    } else if (typeof callback == "function") {
                        callback(event);
                    }
                }
            };

            img.onload = function(event) {
                if (typeof callback == "function") {
                    callback(event);
                }
            };
            return img;
        },
        loadJS: function(src, callback) {
            if (!src) {
                throw new ZZError("JS path is undefined.");
            }
            var head = document.getElementsByTagName("head")[0];
            var retry = DEFAULT_RETRY_COUNT;

            (function load() {
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = src;
                script.onerror = function() {
                    if (retry--) {
                        load();
                    } else {
                        throw new ZZError('Could not load script files: ' + src);
                    }
                };
                script.onload = function() {
                    if (typeof callback == "function") {
                        callback();
                    }
                };
                head.appendChild(script);
            })();
        },
        load: function(src, callback) {
            if (src.match(/\.\w+$/)) {
                var ext = RegExp.lastMatch.slice(1).toLowerCase();
                switch (ext) {
                case "gif":
                case "jpg":
                case "png":
                    return _zz.loadImage(src, callback);
                    break;
                case "js":
                    return _zz.loadJS(src, callback);
                    break;
                default:
                    throw new ZZError("can not load. " + src + " is unsupported file type.");
                    break;
                }
            }
            return null;
        },
        modularize: function(properties) {
            var merged = {};
            for (var scope in properties) {
                var props = properties[scope];
                for (var name in props) {
                    if (name in merged) {
                        throw new ZZError("[" + name + "] is duplicate entry.");
                    }
                    if (scope == "global") {
                        _zz[name] = registration[name] = props[name];
                    }
                    merged[name] = props[name];
                }
            }
            return merged;
        },
        /**
         * The data object converts to get parameters.
         */
        joinQuery: function(url, data) {
            var params = [];
            for (var key in data) {
                params.push(key + "=" + encodeURIComponent(data[key]));
            }
            if (params.length === 0) {
                return url;
            }
            var query = params.join("&");
            if (url.indexOf("?") != -1) {
                url += "&" + query;
            } else {
                url += "?" + query;
            }
            return url;
        },
        /**
         * jump by GET.
         */
        location: function(url, data) {
            window.location.href = _zz.joinQuery(url, data);
        },
        /**
         * submit form
         * @param {String} method default is POST
         * The data of arguments is hash object.
         * @example
         * var data = {
         *     "text": "sample",
         *     "id": 1,
         * };
         * same below.
         * <form method="POST" action=[url]>
         *   <input type="hidden" value="sample" name="text" />
         *   <input type="hidden" value="1" name="id" />
         * </form>
         */
        submitForm: function(url, method, data) {
            var form = document.createElement('form');
            document.body.appendChild(form);
            for (var key in data) {
                var input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', key);
                input.setAttribute('value', data[key]);
                form.appendChild(input);
            }
            form.setAttribute('action', url);
            form.setAttribute('method', method);
            form.submit();
        },
        submitFormByPOST: function(url, data) {
            submitForm(url, "POST", data);
        },
        submitFormByGET: function(url, data) {
            submitForm(url, "GET", data);
        }
    };

    for (var property in registration) {
        _zz[property] = registration[property];
    }
    return _zz;
};
