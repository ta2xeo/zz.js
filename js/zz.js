/** -*- coding: utf-8 -*-
 * zz.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.2.1
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
                var elapsed = performance.now() - prev;
                return setTimeout(callback, Math.max(1, 1000 / this.frameRate - elapsed << 0));
            };
        }());

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
                pattern: /Android (\d+\.\d+)\.\d+; ?([a-z]{2}-[a-z]{2}|);? ?(\S+) /,
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

        var env = {
            USER_AGENT: ua,
            RENDERING_ENGINE: engine,
            VENDOR_PREFIX: {
                Webkit: "webkit",
                Gecko: "Moz",
                NoSupport: ""
            }[engine],
            OS: "Unknown",
            MODEL: "Unknown",
            VERSION: 0,
            TOUCH_ENABLED: typeof div.ontouchstart === "function"
        };

        for (var i = 0, len = devices.length; i < len; i++) {
            var device = devices[i];
            var match = ua.match(device.pattern);
            if (match) {
                env.OS = device.os;
                env.MODEL = device.model(match);
                env.VERSION = device.version(match);
                return env;
            }
        }
        alert("Browser not supported.");
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
        CENTER: 12
    };

    /**
     * @param {Object} superClass
     * @param {Object} properties
     */
    var createClass = function(superClass, properties) {
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
    };

    /**
     * Event
     */
    var Event = new function() {
        /**
         * event type
         */
        var define = {
            ENTER_FRAME: "__enter_frame__",
            COMPLETE: "__complete__"
        };

        /**
         * @param {String} eventName
         */
        var _Event = function(eventName) {
            this.name = eventName;
            this.x = 0;
            this.y = 0;
        };

        for (var key in define) {
            _Event[key] = define[key];
        }

        return _Event;
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
        var _EventDispatcher = function() {
            this.eventContainer = new Object();
        };
        _EventDispatcher.prototype = {
            /**
             * @param {String} eventName
             * @param {Function} listener
             */
            addEventListener: function(eventName, listener) {
                if (!this.eventContainer[eventName]) {
                    this.eventContainer[eventName] = new Array();
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
                        // console.log(eventName);
                        this.eventContainer[eventName].splice(i, 1);
                        return;
                    }
                }
            },
            cleanEventListener: function(eventName) {
                if (eventName) {
                    delete this.eventContainer[eventName];
                } else {
                    this.eventContainer = {};
                }
            },
            /**
             * @param {String|Event} event
             */
            dispatchEvent: function(event) {
                var eventName;
                var obj;
                var result = false;
                if (typeof(event) == "string") {
                    eventName = event;
                    obj = new Object();
                    obj.name = eventName;
                } else {
                    eventName = event.name;
                    obj = event;
                }
                obj.target = this;
                if (!this.eventContainer[eventName]) {
                    return result;
                }
                var len = this.eventContainer[eventName].length;
                for (var i = 0; i < len ; i++) {
                    if (this.eventContainer[eventName][i] == undefined) {
                        result |= this.eventContainer[eventName].splice(i, 1);
                    } else {
                        result |= this.eventContainer[eventName][i].call(this, obj);
                    }
                }
                return result;
            }
        };
        return _EventDispatcher;
    };

    /**
     * DisplayObject
     * @extends EventDispatcher
     */
    var DisplayObject = new function() {
        /**
         * @constructor
         */
        var _DisplayObject = function() {
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
            this.style.textAlign = "left";
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
            this.referencePoint = ReferencePoint.LEFT | ReferencePoint.TOP;
            this._dirty = false;
            this.enabled = true;
            var self = this;

            for (var eventName in TouchEvent) {
                this.element["on" + TouchEvent[eventName]] = function(event) {
                    if (self.enabled) {
                        dispatch(event, self);
                    }
                };
            }
        };

        function dispatch(event, self) {
            var rect = self.element.getBoundingClientRect();
            var e = new Event(event.type);
            if (ENV.TOUCH_ENABLED) {
                if (event.touches.length) {
                    e.x = event.touches[0].clientX - rect.left << 0;
                    e.globalX = e.x + self.x;
                    e.y = event.touches[0].clientY - rect.top << 0;
                    e.globalY = e.y + self.y;
                }
            } else {
                e.x = event.clientX - rect.left << 0;
                e.globalX = e.x + self.x;
                e.y = event.clientY - rect.top << 0;
                e.globalY = e.y + self.y;
            }
            var stop = self.dispatchEvent(e);
            if (stop) {
                event.preventDefault();
                event.stopPropagation();
            }
        }

        _DisplayObject.prototype = createClass(EventDispatcher, {
            transform: function() {
                this.style[PREFIX + "Transform"] = [
                    "translate(" + this._x + "px," + this._y + "px)",
                    "rotate(" + this.rotation + "deg)",
                    "scale(" + this.scaleX + "," + this.scaleY + ")"
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
            onEnterFrame: function() {
                this.dispatchEvent(Event.ENTER_FRAME);
                if (this._dirty) {
                    this.transform();
                    this._dirty = false;
                }
            },
            globalToLocal: function(globalX, globalY) {
                throw new Error("Not implemented error.");
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
                            throw new Error("duplicate key error. " + name + " is already defined.");
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
                        this.referenceX = 100;
                        this.style.left = -this.width + "px";
                    } else {
                        this.referenceX = 0;
                        this.style.left = "0px";
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
                this.parent.removeChild(this);
            }
        });
        return _DisplayObject;
    };

    /**
     * DisplayObjectContainer
     * @extends DisplayObject
     */
    var DisplayObjectContainer = new function() {
        /**
         * @constructor
         */
        var _DisplayObjectContainer = function() {
            _zz.DisplayObject.apply(this);
            this.children = new Array();
            this.nameMap = new Object();
        };
        _DisplayObjectContainer.prototype = createClass(DisplayObject, {
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
                child.parent = this;
                if (index < this.numChildren) {
                    this.element.insertBefore(child.element, this.children[index].element);
                } else {
                    this.element.appendChild(child.element);
                }
                this.children.splice(index, 0, child);
                _zz.DisplayObject.prototype.transform.call(child);
                if (child.name) {
                    if (child.name in this.nameMap) {
                        throw new Error("duplicate key error. " + child.name + " is already defined.");
                    }
                    this.nameMap[child.name] = child;
                }
            },
            /**
             * @param {DisplayObject}
             */
            removeChild: function(child) {
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i] == child) {
                        child.cleanEventListener();
                        this.element.removeChild(child.element);
                        delete this.children[i];
                        break;
                    }
                }
                if (this.children.length === 0) {
                    this.children = [];
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
                throw new Error("child is not contained.");
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
                _zz.DisplayObject.prototype.render.call(this);
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i]) {
                        this.children[i].render();
                    }
                }
            },
            onEnterFrame: function() {
                _zz.DisplayObject.prototype.onEnterFrame.apply(this);
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (this.children[i]) {
                        this.children[i].onEnterFrame();
                    }
                }
                var children = this.children;
                function packChildren(index) {
                    if (index < children.length) {
                        if (!children[index]) {
                            children.splice(index, 1);
                        }
                        ++index;
                        packChildren(index);
                    }
                }
                packChildren(0);
            },
            numChildren: {
                get: function() {
                    return this.children.length;
                }
            }
        });
        return _DisplayObjectContainer;
    };

    /**
     * Stage
     * @extends DisplayObjectContainer
     */
    var Stage = new function() {
        /**
         * @param {String} stageId
         */
        var _Stage = function(stageId) {
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
            this.renderLoop();
        };
        _Stage.prototype = createClass(DisplayObjectContainer, {
            onEnterFrame: function() {
                var prev = performance.now();
                _zz.DisplayObjectContainer.prototype.onEnterFrame.call(this);
                var elapsed = performance.now() - prev;
                var wait = Math.max(1, 1000 / this.frameRate - elapsed << 0);
                var self = this;
                if (!this._pause) {
                    this.handle = setTimeout(function() {
                        self.onEnterFrame();
                    }, wait);
                } else {
                    this.handle = null;
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
            end: function() {
                document.body.removeChild(this.element);
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
        return _Stage;
    };

    /**
     * Sprite
     * @extends DisplayObjectContainer
     */
    var Sprite = new function() {
        /**
         * @constructor
         */
        var _Sprite = function(fileName, x, y) {
            this.canvas = document.createElement("canvas");
            _zz.DisplayObjectContainer.apply(this);
            this.canvas.style.position = "absolute";
            this.context = this.canvas.getContext("2d");
            this.element.appendChild(this.canvas);
            var self = this;
            if (fileName) {
                this.img = loadImage(fileName, function() {
                    self.width = self.img.width;
                    self.height = self.img.height;
                    self.canvas.width = self._width;
                    self.canvas.height = self._height;
                    self.tw = self._clearWidth = self._width;
                    self.th = self._clearHeight = self._height;
                    self.referencePoint = self._reference;
                    self.trimming(self.tx, self.ty, self.tw, self.th);
                    self.loaded = true;
                    self.dispatchEvent(new Event(Event.COMPLETE));
                });
            } else {
                this.width = 0;
                this.height = 0;
                this.canvas.width = 0;
                this.canvas.height = 0;
            }
            if (x != undefined && y != undefined) {
                this.setPosition(x, y);
            }
            this.tx = 0;
            this.ty = 0;
            this.tw = this._clearWidth = this._width;
            this.th = this._clearHeight = this._height;
            this.loaded = false;
            this.imageData = null;
            this._originalImageData = null;
            this._brightness = 0;
            this._red = 100;
            this._green = 100;
            this._blue = 100;
            this._canvasDirty = true;
        };

        _Sprite.prototype = createClass(DisplayObjectContainer, {
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
                    this._width = this._tw = tw;
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
                    this._height = this._th = th;
                }
            },
            width: {
                get: function() {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    return _super.get.call(this);
                },
                set: function(width) {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "width");
                    _super.set.call(this, width);
                    this.canvas.width = width;
                }
            },
            height: {
                get: function() {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "height");
                    return _super.get.call(this);
                },
                set: function(height) {
                    var _super = Object.getOwnPropertyDescriptor(DisplayObject.prototype, "height");
                    _super.set.call(this, height);
                    this.canvas.height = height;
                }
            },
            /**
             * @param {Int} tx
             * @param {Int} ty
             * @param {Int} tw
             * @param {Int} th
             */
            trimming: function(tx, ty, tw, th) {
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
            render: function() {
                if (this.loaded) {
                    if (this._canvasDirty) {
                        this.context.clearRect(0, 0, this._clearWidth, this._clearHeight);
                        this._clearWidth = this._width;
                        this._clearHeight = this._height;
                        if (this.imageData) {
                            this.context.putImageData(this.imageData, 0, 0);
                        } else {
                            this.context.drawImage(this.img, this.tx, this.ty, this.tw, this.th, 0, 0, this._width, this._height);
                        }
                        this._canvasDirty = false;
                    }
                }
                _zz.DisplayObjectContainer.prototype.render.call(this);
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
        return _Sprite;
    };

    /**
     * MovieClip
     */
    var MovieClip = new function() {
        /**
         * @constructor
         */
        var _MovieClip = function(fileName, x, y) {
            _zz.Sprite.apply(this, arguments);
            this.currentFrame = 1;
            this.frames = [undefined];
            this.playing = true;
            this.currentLabel = "";
            this._mcDirty = true;
        };
        _MovieClip.prototype = createClass(Sprite, {
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
                var tweenIndexes = new Array();
                for (var time in data) {
                    if (!this.frames[time]) {
                        this.frames[time] = new Object();
                    }
                    var d = data[time];
                    for (var key in d) {
                        this.frames[time][key] = d[key];
                        if (key == "tween" && d[key]) {
                            tweenIndexes.push(time);
                        }
                    }
                }
                /**
                 * auto adjustment
                 * @param {Int} startIndex
                 */
                function supplement(startIndex) {
                    startIndex = parseInt(startIndex, 10);
                    var start = this.frames[startIndex];
                    var endIndex = startIndex;
                    for (var i = startIndex + 1, len = this.frames.length; i < len; i++) {
                        if (this.frames[i]) {
                            endIndex = i;
                            break;
                        }
                    }
                    if (startIndex != endIndex) {
                        var end = this.frames[endIndex];
                        var size = endIndex - startIndex;
                        for (var key in end) {
                            if (start[key] != undefined && typeof(start[key]) == "number") {
                                var val = (end[key] - start[key]) / size;
                                for (i = startIndex + 1; i < endIndex; i++) {
                                    if (!this.frames[i]) {
                                        this.frames[i] = new Object();
                                    }
                                    this.frames[i][key] = this.frames[i - 1][key] + val;
                                    //console.log(key, i, this.frames[i][key]);
                                }
                            }
                        }
                    }
                }
                for (var i = 0, len = tweenIndexes.length; i < len; i++) {
                    var index = tweenIndexes[i];
                    supplement.call(this, index);
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
                _zz.DisplayObjectContainer.prototype.onEnterFrame.call(this);
                if (this.playing) {
                    ++this.currentFrame;
                    if (this.currentFrame >= this.frames.length) {
                        this.currentFrame = 1;
                    }
                    this._mcDirty = true;
                }
            }
        });
        return _MovieClip;
    };

    /**
     * TextFormat
     */
    var TextFormat = new function() {
        var _TextFormat = function() {
            this.font = "";
            this.bold = false;
            this.italic = false;
            this.size = null;
            this.color = "";
        };
        return _TextFormat;
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
        var _TextField = function(text) {
            _zz.DisplayObject.apply(this);
            this.text = text || "";
            this.style.visibility = "hidden";
            this.style.display = "block";
            this.visible = true;
        };
        _TextField.prototype = createClass(DisplayObject, {
            defaultTextFormat: {
                get: function() {
                    return this._defaultTextFormat;
                },
                set: function(fmt) {
                    this._defaultTextFormat = fmt;
                    this.style.fontFamily = fmt.font;
                    this.style.fontWeight = fmt.bold ? "bold" : "normal";
                    this.style.fontStyle = fmt.italic ? "italic" : "normal";
                    this.style.fontSize = fmt.size ? fmt.size + "px" : "";
                    this.style.color = fmt.color;
                }
            },
            text: {
                get: function() {
                    return this.element.innerHTML;
                },
                set: function(text) {
                    var s = ruler.style;
                    s.fontFamily = this.style.fontFamily;
                    s.fontWeight = this.style.fontWeight;
                    s.fontStyle = this.style.fontStyle;
                    s.fontSize = this.style.fontSize;
                    this.element.innerHTML = ruler.innerHTML = text;
                    this.setSize(ruler.offsetWidth, ruler.offsetHeight);
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
        return _TextField;
    };

    function loadImage(src, callback) {
        var img = new Image();
        img.src = src;
        var retry = DEFAULT_RETRY_COUNT;

        img.onerror = function() {
            if (retry--) {
                img.src = src;
            } else {
                throw new Error('Could not load image files: ' + src);
            }
        };

        img.onload = function() {
            if (typeof callback == "function") {
                callback();
            }
        };
        return img;
    }

    function loadJS(src, callback) {
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
                    throw new Error('Could not load script files: ' + src);
                }
            };
            script.onload = function() {
                if (typeof callback == "function") {
                    callback();
                }
            };
            head.appendChild(script);
        })();
    }

    var registration = {
        ENV: ENV,
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
        TextFormat: TextFormat,
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
         * @param {Function} callback
         */
        preload: function(assets, callback) {
            if (!(assets instanceof Array)) {
                throw new Error("assets must be array.");
            }
            var assetsCount = assets.length;
            function checkLoad() {
                --assetsCount;
                if (assetsCount === 0) {
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
            for (var i = 0; i < assetsCount; ++i) {
                _zz.load(assets[i], checkLoad);
            }
        },
        load: function(src, callback) {
            if (src.match(/\.\w+$/)) {
                var ext = RegExp.lastMatch.slice(1).toLowerCase();
                switch (ext) {
                case "gif":
                case "jpg":
                case "png":
                    loadImage(src, callback);
                    break;
                case "js":
                    loadJS(src, callback);
                    break;
                default:
                    break;
                }
            }
        },
        modularize: function(local, global) {
            var merge = new Object();
            for (var key in local) {
                merge[key] = local[key];
            }
            for (key in global) {
                _zz[key] = registration[key] = merge[key] = global[key];
            }
            return merge;
        }
    };

    for (var property in registration) {
        _zz[property] = registration[property];
    }
    return _zz;
};
