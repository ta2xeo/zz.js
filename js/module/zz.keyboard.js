/** -*- coding: utf-8 -*-
 * zz.keyboard.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 * イベントリスナのhookはstageに対して行う必要があります。
 */
"use strict";

zz.keyboard = new function() {

    /**
     * イベントリスナー用
     */
    var KeyboardEvent = new function() {
        /**
         * event type
         */
        var define = {
            KEY_DOWN: "__key_down__",
            KEY_UP: "__key_up__"
        };

        /**
         * @param {String} eventName
         */
        var _KeyboardEvent = function(event) {
            var e = {
                keyLocation: event.location,
                keyCode: event.keyCode,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey
            };
            return e;
        };

        for (var key in define) {
            _KeyboardEvent[key] = define[key];
        }

        return _KeyboardEvent;
    };

    var Keyboard = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    };

    var _Stage = zz.Stage;
    function KeyEventStage() {
        _Stage.apply(this, arguments);
        var self = this;
        document.onkeydown = function(event) {
            var e = new KeyboardEvent(event);
            e.name = KeyboardEvent.KEY_DOWN;
            var stop = self.dispatchEvent(e);
            if (stop) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
        document.onkeyup = function(event) {
            var e = new KeyboardEvent(event);
            e.name = KeyboardEvent.KEY_UP;
            var stop = self.dispatchEvent(e);
            if (stop) {
                event.preventDefault();
                event.stopPropagation();
            }
        };
    }
    KeyEventStage.prototype = _Stage.prototype;

    return zz.modularize({
        global: {
            Stage: KeyEventStage,
            Keyboard: Keyboard,
            KeyboardEvent: KeyboardEvent
        }
    });
};
