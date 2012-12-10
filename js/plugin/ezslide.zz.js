/** -*- coding: utf-8 -*-
 * ezslide.zz.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.2
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";
var ezslide = new function() {
    /**
     * @param {String} id
     * @param {String[]} imageUrls
     */
    function setSlideImages(id, imageUrls, _interval, _easing, _elapsedTime) {
        var interval = 3000;
        if (_interval) {
            interval = _interval;
        }
        var easing = "ease-out";
        if (_easing) {
            easing = _easing;
        }
        var elapsedTime = 0.5;
        if (_elapsedTime) {
            elapsedTime = _elapsedTime;
        }

        var root = new zz.Stage(id);
        var width = root.width;
        var height = root.height;
        var container = new zz.DisplayObjectContainer();
        root.addChild(container);
        for (var i = 0, len = imageUrls.length; i < len; i++) {
            var img = new zz.Sprite(imageUrls[i]);
            container.addChild(img);
        }
        var index = 0;
        var size = container.numChildren;
        var handle = null;

        function stopTransition() {
            container.style[zz.ENV.VENDER_PREFIX + "TransitionDuration"] = null;
            container.style[zz.ENV.VENDER_PREFIX + "TransitionTimingFunction"] = null;
        }

        function startTransition() {
            container.style[zz.ENV.VENDER_PREFIX + "TransitionDuration"] = elapsedTime + "s";
            container.style[zz.ENV.VENDER_PREFIX + "TransitionTimingFunction"] = easing;
        }

        function setPosition() {
            stopTransition();
            root.removeEventListener(zz.Event.ENTER_FRAME, setPosition);
            if (index < 0) {
                index = size - 1;
            } else if (index >= size) {
                index = 0;
            }
            var preIdx = index - 1;
            if (preIdx < 0) {
                preIdx = size - 1;
            }
            var prev = container.getChildAt(preIdx);
            var nextIdx = index + 1;
            if (nextIdx >= size) {
                nextIdx = 0;
            }
            var next = container.getChildAt(nextIdx);
            var current = container.getChildAt(index);
            for (var i = 0; i < size; i++) {
                var obj = container.getChildAt(i);
                if (prev === obj) {
                    obj.visible = true;
                    obj.x = -width;
                } else if (next === obj) {
                    obj.visible = true;
                    obj.x = width;
                } else if (current === obj) {
                    obj.visible = true;
                    obj.x = 0;
                } else {
                    obj.visible = false;
                }
            }
            container.x = 0;
            if (handle === null) {
                handle = setTimeout(slideShow, interval);
            }
        }
        container.element.addEventListener(zz.ENV.VENDER_PREFIX + "TransitionEnd", setPosition);

        setPosition();
        var touch = false;
        var startX = 0;
        var startY = 0;
        var baseX = 0;
        var lock = false;
        var check = false;
        var stackX;
        root.addEventListener(zz.TouchEvent.TOUCH_DOWN, function(event) {
            setPosition();
            stopSlideShow();
            baseX = container.x;
            startX = event.x;
            startY = event.y;
            touch = true;
            check = false;
            stackX = new Array();
            return false;
        });
        root.addEventListener(zz.TouchEvent.TOUCH_MOVE, function(event) {
            if (check && !lock) {
                return false;
            }
            if (touch) {
                var move = event.x - startX;
                if (!check) {
                    check = true;
                    lock = Math.abs(event.y - startY) < Math.abs(move);
                    if (!lock) {
                        return false;
                    }
                }
                if (stackX.length > 3) {
                    stackX.shift();
                }
                stackX.push(container.x);
                container.x = baseX + move;
                if (event.y < 0 || event.y > height) {
                    touchRelease(event);
                }
                return true;
            }
            return false;
        });

        function touchRelease(event) {
            stopSlideShow();
            touch = false;
            lock = false;
            if (Math.abs(container.x) <= 2) {
                root.addEventListener(zz.Event.ENTER_FRAME, setPosition);
                return true;
            }
            var threshold = 20;
            var flick = Math.abs(stackX[0] - container.x);
            if (container.x > 0 && (flick > threshold || container.x > width / 2)) {
                --index;
                container.x = width;
            } else if (container.x < 0 && (flick > threshold || container.x < -width / 2)) {
                ++index;
                container.x = -width;
            } else {
                container.x = 0;
            }
            startTransition();
        }
        root.addEventListener(zz.TouchEvent.TOUCH_UP, touchRelease);
        root.addEventListener(zz.TouchEvent.TOUCH_OUT, touchRelease);

        function slideShow() {
            ++index;
            startTransition();
            container.x = -width;
            stopSlideShow();
        }

        function stopSlideShow() {
            if (handle) {
                clearTimeout(handle);
                handle = null;
            }
        }
    }

    return {
        setSlideImages: setSlideImages,
    }
}
