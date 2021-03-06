/** -*- coding: utf-8 -*-
 * zz.transitions.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.5
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
            this.func = func || easing.Linear.easeNone;
            this.begin = begin;
            this.finish = finish;
            this.useSeconds = useSeconds || false;
            this.duration = this.useSeconds ? duration * 1000 : duration;
            this.isPlaying = false;
            this.looping = false;
            this.time = 0;
            this._easingFunc = null;
            this._isYoyo = false;
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
            _setVal: function(val) {
                if (this.prop in this.obj) {
                    this.obj[this.prop] = val;
                }
            },
            _easing: function() {
                if (this._easingFunc) {
                    this.obj.removeEventListener(zz.Event.ENTER_FRAME, this._easingFunc);
                }
                this.isPlaying = true;
                return this.nextFrame.bind(this);
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
            },
            _moveFrame: function(fowardFunc) {
                if (this.time === 0) {
                    this._dispatch(TweenEvent.MOTION_START);
                    this._setVal(this._isYoyo ? this.finish : this.begin);
                }
                fowardFunc();
                var time = this._isYoyo ? this.duration - this.time : this.time;
                var v = this.func(time, this.begin, this.finish - this.begin, this.duration);
                if (this.time < this.duration) {
                    this._setVal(v);
                } else {
                    if (this.reset) {
                        this.reset = false;
                        this._setVal(this._isYoyo ? this.finish : this.begin);
                        this.time = 0;
                        this._start = this.useSeconds ? performance.now() : 0;
                        this._dispatch(TweenEvent.MOTION_LOOP);
                    } else {
                        this._setVal(this._isYoyo ? this.begin : this.finish);
                        if (!this.looping) {
                            this.obj.removeEventListener(zz.Event.ENTER_FRAME, this._easingFunc);
                            this.isPlaying = false;
                        } else {
                            this.reset = true;
                        }
                        this._dispatch(TweenEvent.MOTION_FINISH);
                    }
                }
                this._dispatch(TweenEvent.MOTION_CHANGE);
            },
            /**
             * 次のフレームへ進める。
             */
            nextFrame: function() {
                function next() {
                    this.time = this.useSeconds ? performance.now() - this._start : this.time + 1;
                }
                this._moveFrame(next.bind(this));
            },
            /**
             * 前のフレームに戻す。
             */
            prevFrame: function() {
                function prev() {
                    this.time = this.useSeconds ? performance.now() + this._start : this.time - 1;
                }
                this._moveFrame(prev.bind(this));
            },
            /**
             * 最後まで早送りします。
             */
            fforward: function() {
                var enable = true;

                function stop() {
                    this.removeEventListener(TweenEvent.MOTION_FINISH, stop);
                    enable = false;
                }

                this.addEventListener(TweenEvent.MOTION_FINISH, stop);

                while (enable) {
                    this.nextFrame();
                }
            },
            /**
             * 逆再生。
             */
            yoyo: function() {
                this._isYoyo ^= true;
                this._setEasing();
                this.time = 0;
            }
        });
        return Tween;
    };


    /**
     * tweenをまとめて指定できる
     * @param {DisplayObject} obj 動かしたいDisplayObject
     * @param {Object} animation
     * プロパティをキーにしたオブジェクトを渡す
     *
     * 例)
     * var d = {
     *   x: {
     *     frame: 30,   // 30フレームかけて移動
     *     begin: 100,  // 開始座標(省略可)
     *     end: 500,    // 停止座標
     *     easing: Bounce.easeIn,  // 省略可(デフォルトはLinear)
     *     loop: true   // デフォルトはfalse
     *   },
     *   y: {
     *     time: 3,  // 3秒かけて移動
     *     end: 600,
     *     easing: Elastic.easeOut
     *   }
     * };
     */
    function tweenObject(obj, animation) {
        var tweens = [];
        for (var prop in animation) {
            if (animation[prop] === undefined) {
                continue;
            }
            var info = animation[prop];
            var isSeconds = "time" in info;
            var time = isSeconds ? info.time : info.frame;
            if (info.begin === undefined) {
                info.begin = obj[prop];
            }
            var tw = new Tween(obj, prop, info.easing, info.begin, info.end, time || 0, isSeconds);
            tweens.push(tw);
            if (info.loop) {
                tw.looping = true;
            }
            tw.start();
        }
        return tweens;
    }


    /**
     * アニメーション制御をメソッドチェーンで指定できるクラス
     *
     * 例)
     * var obj = new MovieClip("image.png");
     * var tw = new TweeChain(obj);
     * tw.fadeIn(48, Linear.easeIn).move(300, 200, 72, Bounce.easeIn).fadeOut(24, Linear.easeOut);
     */
    var TweenChain = new function() {
        var TWEEN_END = "__zz.transitions.TweenChain.TWEEN_END__";
        var TWEEN_NEXT = "__zz.transitions.TweenChain.TWEEN_NEXT__";

        function TweenChain(obj) {
            zz.EventDispatcher.call(this);
            this.obj = obj;
            this.queue = [];
            this._loop = [];
            this._multi = false;
            this._tweens = [];
            var taskCount = 0;
            var doneCount = 0;
            this.addEventListener(TWEEN_END, function() {
                ++doneCount;
                if (doneCount === taskCount) {
                    this.queue.shift();
                    doneCount = 0;
                    this.dispatchEvent(TWEEN_NEXT);
                    this._tweens = [];
                }
            });
            this.addEventListener(TWEEN_NEXT, function() {
                function execNextQueue() {
                    var func = this.queue[0];
                    if (func instanceof Array) {
                        taskCount = func.length;
                        for (var i = 0; i < taskCount; i++) {
                            func[i]();
                        }
                    } else {
                        taskCount = 1;
                        func();
                    }
                }
                if (this.queue.length > 0) {
                    execNextQueue.call(this);
                } else {
                    if (this._loop.length > 0) {
                        this.queue = Array.apply(null, this._loop);  // shallow copy
                        execNextQueue.call(this);
                    }
                }
            });
        }
        TweenChain.prototype = zz.createClass(zz.EventDispatcher, {
            /**
             * これ経由で関数繋げること
             */
            addQueue: function(func) {
                var self = this;

                function start() {
                    this.removeEventListener(zz.Event.ENTER_FRAME, start);
                    self.dispatchEvent(TWEEN_NEXT);
                }

                if (this.queue.length === 0) {
                    this.obj.addEventListener(zz.Event.ENTER_FRAME, start);
                }

                if (this._multi) {
                    var last = this.queue[this.queue.length - 1];
                    last.push(func);
                    this._multi = false;
                } else {
                    this.queue.push(func);
                }

                return this;
            },
            /**
             * tweenObjectを実行する
             * @params {Object} params tweenObjectのanimation
             */
            tween: function(params) {
                return this.addQueue(function() {
                    var tws = tweenObject(this.obj, params);
                    this._tweens.push(tws);
                    var len = tws.length;
                    var finished = 0;
                    var chain = this;
                    function finish() {
                        return function count() {
                            ++finished;
                            this.removeEventListener(TweenEvent.MOTION_FINISH, count);
                            if (finished === len) {
                                chain.dispatchEvent(TWEEN_END);
                            }
                        };
                    }
                    for (var i = 0; i < len; i++) {
                        var tw = tws[i];
                        tw.addEventListener(TweenEvent.MOTION_FINISH, finish());
                    }
                }.bind(this));
            },
            /**
             * 指定したフレーム数スキップする。
             * .and()は省略可能。
             */
            skip: function(frame) {
                this.and();
                return this.addQueue(function() {
                    var len = this._tweens.length;
                    for (var i = 0; i < len; i++) {
                        var tw = this._tweens[i];
                        for (var j = 0, size = tw.length; j < size; j++) {
                            for (var k = 0; k < frame; k++) {
                                tw[j].nextFrame();
                            }
                        }
                    }
                    this.dispatchEvent(TWEEN_END);
                }.bind(this));
            },
            /**
             * 同じフレーム数で複数のトゥイーンを一括指定したいときに使う
             * @param {Object} params
             * {
             *   x: 30,
             *   y: 50
             * }
             * @param {Int} frame フレーム数
             * @param {Function} easing イージング関数
             */
            packTween: function(params, frame, easing) {
                var convert = {};
                for (var prop in params) {
                    convert[prop] = {
                        end: params[prop],
                        frame: frame,
                        easing: easing
                    };
                }
                return this.tween(convert);
            },
            /**
             * 渡した関数を実行する
             * 実行と同時に次のイベント呼ぶ
             */
            exec: function(func) {
                function execute() {
                    func();
                    this.dispatchEvent(TWEEN_END);
                }
                return this.addQueue(execute.bind(this));
            },
            /**
             * 指定したフレーム数待機する
             * @params {Int} frame 待機させたいフレーム数
             */
            wait: function(frame) {
                return this.addQueue(function() {
                    var cnt = 0;
                    var count = function() {
                        ++cnt;
                        if (cnt >= frame) {
                            this.dispatchEvent(TWEEN_END);
                            this.obj.removeEventListener(zz.Event.ENTER_FRAME, count);
                        }
                    }.bind(this);
                    this.obj.addEventListener(zz.Event.ENTER_FRAME, count);
                }.bind(this));
            },
            /**
             * .and()で繋げると続けて実行出来る。
             * 例)
             * // 360度回転しつつx:300に移動する
             * obj.tween.moveX(300, 30).and().rotate(360, 30);
             */
            and: function() {
                this._multi = true;
                var last = this.queue.pop();
                if (!(last instanceof Array)) {
                    last = [last];
                }
                this.queue.push(last);
                return this;
            },
            move: function(x, y, frame, easing) {
                return this.tween({
                    x: {
                        end: x,
                        frame: frame,
                        easing: easing
                    },
                    y: {
                        end: y,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            moveX: function(end, frame, easing) {
                return this.tween({
                    x: {
                        end: end,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            moveY: function(end, frame, easing) {
                return this.tween({
                    y: {
                        end: end,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            fadeIn: function(frame, easing) {
                return this.tween({
                    alpha: {
                        begin: 0,
                        end: 1,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            fadeOut: function(frame, easing) {
                return this.tween({
                    alpha: {
                        begin: 1,
                        end: 0,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            rotate: function(rotation, frame, easing) {
                return this.tween({
                    rotation: {
                        end: rotation,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            scale: function(scale, frame, easing) {
                return this.tween({
                    scale: {
                        end: scale,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            scaleX: function(scale, frame, easing) {
                return this.tween({
                    scaleX: {
                        end: scale,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            scaleY: function(scale, frame, easing) {
                return this.tween({
                    scaleY: {
                        end: scale,
                        frame: frame,
                        easing: easing
                    }
                });
            },
            show: function() {
                return this.addQueue(function() {
                    this.obj.visible = true;
                    this.dispatchEvent(TWEEN_END);
                }.bind(this));
            },
            hide: function() {
                return this.addQueue(function() {
                    this.obj.visible = false;
                    this.dispatchEvent(TWEEN_END);
                }.bind(this));
            },
            loop: function() {
                this._loop = Array.apply(null, this.queue);  // shallow copy
                return this;
            },
            remove: function() {
                return this.addQueue(function() {
                    this.obj.removeSelf();
                }.bind(this));
            }
        });
        return TweenChain;
    };


    /**
     * TweenChainを予め内包したMovieClip
     *
     * 例)
     * var obj = new TweenMC("image.png");
     * obj.tween.fadeIn(48, Linear.easeIn).move(300, 200, 72, Bounce.easeIn).fadeOut(24, Linear.easeOut);
     */
    var TweenMC = new function() {
        function TweenMC() {
            zz.MovieClip.apply(this, arguments);
            this.tween = new TweenChain(this);
        }
        TweenMC.prototype = zz.createClass(zz.MovieClip, {});

        return TweenMC;
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
            Tween: Tween,
            tweenObject: tweenObject,
            TweenChain: TweenChain,
            TweenMC: TweenMC
        }
    });
};
