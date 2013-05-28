/** -*- coding: utf-8 -*-
 * zz.transitions.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.transitions = new function() {

    /**
     * TERMS OF USE - EASING EQUATIONS
     *
     * Open source under the BSD License.
     *
     * Copyright © 2001 Robert Penner
     * All rights reserved.
     *
     * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
     *
     *   * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
     *   * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
     *   * Neither the name of the author nor the names of contributors may be used to endorse or promote products derived from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     *
     * @param {Number} t Specifies time.
     * @param {Number} b Specifies the initial position of a component.
     * @param {Number} c Specifies the total change in position of the component.
     * @param {Number} d Specifies the duration of the effect, in milliseconds.
     * @param {Number} a Specifies the amplitude of the sine wave.
     * @param {Number} p Specifies the period of the sine wave.
     * @return {Number} Number corresponding to the position of the component.
     */
    var easing = {
        Back: {
            easeIn: function(t, b, c, d, s)
            {
                if (!s)
                    s = 1.70158;

                return c * (t /= d) * t * ((s + 1) * t - s) + b;
            },
            easeOut: function(t, b, c, d, s)
            {
                if (!s)
                    s = 1.70158;

                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            },
            easeInOut: function(t, b, c, d, s)
            {
                if (!s)
                    s = 1.70158; 

                if ((t /= d / 2) < 1)
                    return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;

                return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
            }
        },
        Bounce: {
            easeOut: function(t, b, c, d)
            {
                if ((t /= d) < (1 / 2.75))
                    return c * (7.5625 * t * t) + b;

                else if (t < (2 / 2.75))
                    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;

                else if (t < (2.5 / 2.75))
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;

                else
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
            },
            easeIn: function(t, b, c, d)
            {
                return c - Bounce.easeOut(d - t, 0, c, d) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if (t < d/2)
                    return Bounce.easeIn(t * 2, 0, c, d) * 0.5 + b;
                else
                    return Bounce.easeOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
            }
        },
        Circular: {
            easeIn: function(t, b, c, d)
            {
                return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
            },
            easeOut: function(t, b, c, d)
            {
                return c * Math.sqrt(1 - (t = t/d - 1) * t) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if ((t /= d / 2) < 1)
                    return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;

                return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
            }
        },
        Cubic: {
            easeIn: function(t, b, c, d)
            {
                return c * (t /= d) * t * t + b;
            },
            easeOut: function(t, b, c, d)
            {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t + b;

                return c / 2 * ((t -= 2) * t * t + 2) + b;
            }
        },
        Elastic: {
            easeIn: function(t, b, c, d, a, p)
            {
                if (t === 0)
                    return b;

                if ((t /= d) === 1)
                    return b + c;

                if (!p)
                    p = d * 0.3;

                var s;
                if (!a || a < Math.abs(c))
                {
                    a = c;
                    s = p / 4;
                }
                else
                {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }

                return -(a * Math.pow(2, 10 * (t -= 1)) *
                         Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            },
            easeOut: function(t, b, c, d, a, p)
            {
                if (t === 0)
                    return b;

                if ((t /= d) === 1)
                    return b + c;

                if (!p)
                    p = d * 0.3;

                var s;
                if (!a || a < Math.abs(c))
                {
                    a = c;
                    s = p / 4;
                }
                else
                {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }

                return a * Math.pow(2, -10 * t) *
                    Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
            },
            easeInOut: function(t, b, c, d, a, p)
            {
                if (t === 0)
                    return b;

                if ((t /= d / 2) === 2)
                    return b + c;

                if (!p)
                    p = d * (0.3 * 1.5);

                var s;
                if (!a || a < Math.abs(c))
                {
                    a = c;
                    s = p / 4;
                }
                else
                {
                    s = p / (2 * Math.PI) * Math.asin(c / a);
                }

                if (t < 1)
                {
                    return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) *
                                   Math.sin((t * d - s) * (2 * Math.PI) /p)) + b;
                }

                return a * Math.pow(2, -10 * (t -= 1)) *
                    Math.sin((t * d - s) * (2 * Math.PI) / p ) * 0.5 + c + b;
            }
        },
        Exponential: {
            easeIn: function(t, b, c, d)
            {
                return t === 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
            },
            easeOut: function(t, b, c, d)
            {
                return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if (t === 0)
                    return b;

                if (t === d)
                    return b + c;

                if ((t /= d / 2) < 1)
                    return c / 2 * Math.pow(2, 10 * (t - 1)) + b;

                --t;
                return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
            }
        },
        Linear: {
            easeNone: function(t, b, c, d)
            {
                return c * t / d + b;
            },
            easeIn: function(t, b, c, d)
            {
                return c * t / d + b;
            },
            easeOut: function(t, b, c, d)
            {
                return c * t / d + b;
            },
            easeInOut: function(t, b, c, d)
            {
                return c * t / d + b;
            }
        },
        Quadratic: {
            easeIn: function(t, b, c, d)
            {
                return c * (t /= d) * t + b;
            },
            easeOut: function(t, b, c, d)
            {
                return -c * (t /= d) * (t - 2) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t + b;

                --t;
                return -c / 2 * ((t) * (t - 2) - 1) + b;
            }
        },
        Quartic: {
            easeIn: function(t, b, c, d)
            {
                return c * (t /= d) * t * t * t + b;
            },
            easeOut: function(t, b, c, d)
            {
                return -c * ((t = t / d - 1) * t * t * t - 1) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t * t + b;

                return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
            }
        },
        Quintic: {
            easeIn: function(t, b, c, d)
            {
                return c * (t /= d) * t * t * t * t + b;
            },
            easeOut: function(t, b, c, d)
            {
                return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                if ((t /= d / 2) < 1)
                    return c / 2 * t * t * t * t * t + b;

                return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
            }
        },
        Sine: {
            easeIn: function(t, b, c, d)
            {
                return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
            },
            easeOut: function(t, b, c, d)
            {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            },
            easeInOut: function(t, b, c, d)
            {
                return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
            }
        }
    };

    var TweenEvent = new function() {
        function TweenEvent(type, time, position, bubbles, cancelable) {
            zz.Event.call(this, type);
            this.time = time;
            this.position = position;
            this.bubbles = bubbles || false;
            this.cancelable = cancelable || false;
        }
        TweenEvent.prototype = zz.createClass(zz.Event, {});

        var define = {
            MOTION_CHANGE: "__zz.transitions.TweenEvent.MOTION_CHANGE__",
            MOTION_FINISH: "__zz.transitions.TweenEvent.MOTION_FINISH__",
            MOTION_LOOP: "__zz.transitions.TweenEvent.MOTION_LOOP__",
            MOTION_RESUME: "__zz.transitions.TweenEvent.MOTION_RESUME__",
            MOTION_START: "__zz.transitions.TweenEvent.MOTION_START__",
            MOTION_STOP: "__zz.transitions.TweenEvent.MOTION_STOP__"
        };

        for (var key in define) {
            TweenEvent[key] = define[key];
        }

        return TweenEvent;
    };

    var Tween = new function() {
        /**
         * Tween
         * @constructor
         * @param {DisplayObject} obj
         * @param {String} prop
         * @param {Function} func
         * @param {Number} begin
         * @param {Number} finish
         * @param {Number} duration
         * @param {Boolean} useSeconds
         */
        function Tween(obj, prop, func, begin, finish, duration, useSeconds) {
            zz.EventDispatcher.apply(this, arguments);
            this.obj = obj;
            this.prop = prop || "";
            this.func = func;
            this.begin = begin;
            this.finish = finish;
            this.useSeconds = useSeconds || false;
            this.duration = this.useSeconds ? duration * 1000 : duration;
            this.isPlaying = false;
            this.looping = false;
            this.time = 0;
            this._easingFunc = null;
        }
        Tween.prototype = zz.createClass(zz.EventDispatcher, {
            start: function() {
                if (this.isPlaying) {
                    return;
                }
                this.time = 0;
                this._start = this.useSeconds ? performance.now() : 0;
                this._reset = false;

                this._setEasing();
            },
            _dispatch: function(motionType) {
                var e = new TweenEvent(motionType, this.time, this.position);
                this.dispatchEvent(e);
            },
            _setEasing: function() {
                this._easingFunc = this._easing();
                this.obj.addEventListener(zz.Event.ENTER_FRAME, this._easingFunc);
            },
            _easing: function() {
                if (this._easingFunc) {
                    this.obj.removeEventListener(zz.Event.ENTER_FRAME, this._easingFunc);
                }
                this.isPlaying = true;
                var self = this;

                function setVal(val) {
                    if (self.obj[self.prop] !== undefined) {
                        self.obj[self.prop] = val;
                    }
                }

                function easing() {
                    if (self.time === 0) {
                        self._dispatch(TweenEvent.MOTION_START);
                    }
                    self.time = self.useSeconds ? performance.now() - self._start : self.time + 1;
                    var v = self.func(self.time, self.begin, self.finish - self.begin, self.duration);
                    if (self.time < self.duration) {
                        setVal(v);
                    } else {
                        if (self.reset) {
                            self.reset = false;
                            setVal(self.begin);
                            self.time = 0;
                            self._start = self.useSeconds ? performance.now() : 0;
                            self._dispatch(TweenEvent.MOTION_LOOP);
                        } else {
                            setVal(self.finish);
                            if (!self.looping) {
                                this.removeEventListener(zz.Event.ENTER_FRAME, easing);
                                self.isPlaying = false;
                            } else {
                                self.reset = true;
                            }
                            self._dispatch(TweenEvent.MOTION_FINISH);
                        }
                    }
                    self._dispatch(TweenEvent.MOTION_CHANGE);
                }
                return easing;
            },
            stop: function() {
                this.isPlaying = false;
                if (this._easingFunc) {
                    this._dispatch(TweenEvent.MOTION_STOP);
                    this.obj.removeEventListener(zz.Event.ENTER_FRAME, this._easingFunc);
                }
            },
            resume: function() {
                if (this.isPlaying) {
                    return;
                }
                this._dispatch(TweenEvent.MOTION_RESUME);
                this._start = this.useSeconds ? performance.now() - this.time : this.time;
                this._setEasing();
            },
            position: {
                get: function() {
                    return this.obj[this.prop];
                },
                set: function(value) {
                    this.obj[this.prop] = value;
                }
            }
        });
        return Tween;
    };

    return zz.modularize({
        local: {
            easing: easing
        },
        global: {
            Back: easing.Back,
            Bounce: easing.Bounce,
            Circular: easing.Circular,
            Cubic: easing.Cubic,
            Elastic: easing.Elastic,
            Exponential: easing.Exponential,
            Linear: easing.Linear,
            Quadratic: easing.Quadratic,
            Quartic: easing.Quartic,
            Quintic: easing.Quintic,
            Sine: easing.Sine,
            TweenEvent: TweenEvent,
            Tween: Tween
        }
    });
};
