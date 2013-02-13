/** -*- coding: utf-8 -*-
 * zz.suspend.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";
zz.suspend = new function() {

    var enterFrameListenerCnt = 0;

    /**
     * override EventDispatcher
     */
    (function() {
        var _addEventListener = zz.EventDispatcher.prototype.addEventListener;
        zz.EventDispatcher.prototype.addEventListener = function(eventName, listener) {
            _addEventListener.call(this, eventName, listener);
            if (eventName == zz.Event.ENTER_FRAME) {
                var cnt = this.eventContainer[eventName].length;
                ++enterFrameListenerCnt;
            }
            var root = this.root;
            if (root instanceof zz.Stage) {
                this.root.start();
            }
        };

        zz.EventDispatcher.prototype.removeEventListener = function(eventName, listener) {
            if (!this.eventContainer[eventName]) {
                return;
            }
            var len = this.eventContainer[eventName].length;
            for (var i = 0; i < len; i++) {
                if (listener == this.eventContainer[eventName][i]) {
                    this.eventContainer[eventName].splice(i, 1);
                    if (eventName == zz.Event.ENTER_FRAME) {
                        --enterFrameListenerCnt;
                    }
                    return;
                }
            }
        };

        zz.EventDispatcher.prototype.cleanEventListener = function(eventName) {
            function decr(event, container) {
                if (event == zz.Event.ENTER_FRAME) {
                    enterFrameListenerCnt -= container[event].length;
                }
            }
            if (eventName) {
                decr(eventName, this.eventContainer);
                delete this.eventContainer[eventName];
            } else {
                for (var key in this.eventContainer) {
                    decr(key, this.eventContainer);
                }
                this.eventContainer = {};
            }
        };
    })();

    /**
     * override DisplayObject
     */
    (function() {
        Object.defineProperty(zz.DisplayObject.prototype, "_dirty", {
            get: function() {
                return this.__dirty;
            },
            set: function(bool) {
                this.__dirty = bool;
                if (bool) {
                    this.transform();
                }
            },
            configurable: true
        });
    })();

    /**
     * override DisplayObjectContainer
     */
    (function() {
        var _addChild = zz.DisplayObjectContainer.prototype.addChild;
        zz.DisplayObjectContainer.prototype.addChild = function(child) {
            _addChild.call(this, child);
            if (this.root.start) {
                this.root.start();
            }
        };

        var _addChildAt = zz.DisplayObjectContainer.prototype.addChildAt;
        zz.DisplayObjectContainer.prototype.addChildAt = function(child, index) {
            _addChildAt.call(this, child, index);
            if (this.root.start) {
                this.root.start();
            }
        };
    })();

    /**
     * override Stage
     */
    (function() {
        zz.Stage.prototype.onEnterFrame = function() {
            var prev = +new Date();
            zz.DisplayObjectContainer.prototype.onEnterFrame.call(this);
            this.render();
            var passage = +new Date() - prev;
            var wait = ~~(1000 / this.frameRate) - passage;
            if (wait < 1) {
                wait = 1;
            }
            if (enterFrameListenerCnt === 0) {
                this.pause();
            } else {
                var self = this;
                this.handle = setTimeout(function() {
                    self.onEnterFrame();
                }, wait);
            }
        };
    })();

    return zz.modularize();
};
