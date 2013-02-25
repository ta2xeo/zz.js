/** -*- coding: utf-8 -*-
 * zz.spriteAnimation.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.5
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.spriteAnimation = new function() {
    // スプライト画像のロード完了時に発行されるイベント
    var SpriteEvent = {
        LOAD_SPRITES: "__load_sprites__",
        ANIMATION_END: "__animation_end__"
    };

    // 画像のパス。共通のURLやパスはこれを設定すると省略できる。
    var _imagePath = "";

    function setImagePath(path) {
        _imagePath = path;
    }

    /**
     * 複数枚の絵によるアニメーションを実現するクラス
     * @extends zz.MovieClip
     * @constructor
     */
    function SpriteAnimation() {
        zz.MovieClip.apply(this);
        this.setCommonPath("", "");
        this.spriteLoaded = false;
        this.stop();
        this.loop = true;
        this.autoPlay = true;
    }
    SpriteAnimation.prototype = zz.createClass(zz.MovieClip, {
        setCommonPath: function(prefix, suffix) {
            this.prefix = _imagePath + prefix;
            this.suffix = suffix;
        },
        loadComplete: function(spr) {
            var self = this;
            function comp() {
                ++self.loadCount;
                if (self.loadCount === self.sprites.length) {
                    self.spritesLoaded = true;
                    if (self.autoPlay) {
                        self.gotoAndPlay(self.currentFrame);
                    }
                    self.dispatchEvent(SpriteEvent.LOAD_SPRITES);
                }
                spr.removeEventListener(zz.Event.COMPLETE, comp);
            }
            return comp;
        },
        /**
         * 複数の絵からアニメーションを作る
         */
        loadAnimation: function(images) {
            if (!(images instanceof Array)) {
                images = Array.prototype.slice.call(arguments);
            }
            this.sprites = new Array();
            this.loadCount = 0;
            var len = images.length;
            for (var i = 0; i < len; i++) {
                var path = this.prefix + images[i] + this.suffix;
                var spr = new zz.Sprite(path);
                spr.visible = false;
                this.sprites.push(spr);
                spr.addEventListener(zz.Event.COMPLETE, this.loadComplete(spr));
                this.addChild(spr);
            }
            if (len > 0) {
                this.setAnimationInterval();
            }
        },
        _changeSprite: function(index) {
            return function() {
                for (var i = 0, len = this.numChildren; i < len; i++) {
                    if (index === i) {
                        this.getChildAt(i).visible = true;
                    } else {
                        this.getChildAt(i).visible = false;
                    }
                }
            };
        },
        /**
         * スプライトをindex番目に切り替える
         * @param {Int} index 0から始まる
         */
        setSpriteByIndex: function(index) {
            if (this.spritesIndices) {
                var frame = this.spritesIndices[index];
                if (!frame) {
                    throw new Error("invalid index.");
                }
                this.setFrame(frame);
            } else {
                throw new Error("sprites are not loaded yet.");
            }
        },
        /**
         * スプライトの切り替え間隔を指定する
         */
        setAnimationInterval: function(intervalFrame) {
            if (intervalFrame) {
                if (intervalFrame instanceof Array) {
                    this.intervalFrames = new Array();
                    var interval = 1;
                    for (var i = 0, len = intervalFrame.length; i < len; i++) {
                        interval = intervalFrame[i] || interval;
                        this.intervalFrames.push(interval);
                    }
                } else {
                    this.intervalFrames = [intervalFrame];
                }
            } else if (!this.intervalFrames) {
                this.intervalFrames = [1];
            }
            var anim = this._getAnimationData();
            var keys = Object.keys(anim);
            if (keys.length === 0) {
                return;
            }
            var lastInterval = this.intervalFrames[this.intervalFrames.length - 1];
            var tail = Math.max.apply(null, keys) + lastInterval - 1;
            // 関数呼んでるのはloopを途中で切り替えても動作するようにしたい為。
            var event = anim[tail] && anim[tail].event;
            anim[tail] = {
                event: function() {
                    if (typeof event == "function") {
                        event.call(this);
                    }
                    if (!this.loop) {
                        this.stop();
                    }
                    this.dispatchEvent(SpriteEvent.ANIMATION_END);
                }
            };
            this.setAnimation(anim);
        },
        _getAnimationData: function() {
            var anim = new Object();
            this.spritesIndices = new Array();
            var timeLine = 1;
            var interval = 1;
            for (var i = 0, len = this.numChildren; i < len; i++) {
                this.spritesIndices.push(timeLine);
                anim[timeLine] = {
                    event: this._changeSprite(i)
                };
                interval = this.intervalFrames[i] || interval;
                timeLine += interval;
            }
            return anim;
        }
    });

    /**
     * １枚の絵からアニメーションを生成するクラス
     * @extends SpriteAnimation
     * @constructor
     */
    function SpriteSheetAnimation() {
        SpriteAnimation.apply(this);
    }
    SpriteSheetAnimation.prototype = zz.createClass(SpriteAnimation, {
        /**
         * 一枚のスプライトシートから切り分けてアニメーションを作る
         * @param {String} sheet 画像パス
         * @param {Int} width 切り取る絵の横幅
         * @param {Int} height 切り取る絵の縦幅
         * @param {Int} count 何枚のアニメーションか
         */
        loadAnimation: function(sheet, width, height, count) {
            this.chipWidth = width;
            this.chipHeight = height;
            this.chipCount = count;
            var path = this.prefix + sheet + this.suffix;
            var spr = new zz.MovieClip(path);
            spr.visible = false;
            this.loadCount = 0;
            var self = this;
            spr.addEventListener(zz.Event.COMPLETE, function() {
                self.setAnimationInterval();
                self.loadComplete(spr)();
                spr.visible = true;
            });
            this.sprites = new Array();
            this.sprites.push(spr);
            this.addChild(spr);
        },
        _getAnimationData: function() {
            var anim = new Object();
            var timeLine = 1;

            var _anim = new Object();
            var _timeLine = 1;
            var spr = this.sprites[0];
            var w_cnt = spr.width / this.chipWidth;
            var h_cnt = spr.height / this.chipHeight;
            for (var i = 0; i < h_cnt; i++) {
                for (var j = 0; j < w_cnt; j++) {
                    _anim[_timeLine] = {
                        tx: j * this.chipWidth,
                        ty: i * this.chipHeight,
                        tw: this.chipWidth,
                        th: this.chipHeight,
                        stop: true
                    };
                    ++_timeLine;
                }
            }
            spr.setAnimation(_anim);

            var interval = 1;
            this.spritesIndices = new Array();
            for (i = 0; i < this.chipCount; i++) {
                this.spritesIndices.push(timeLine);
                anim[timeLine] = {
                    event: (function() {
                        var frame = i + 1;
                        return function() {
                            spr.setFrame(frame);
                        };
                    })()
                };
                interval = this.intervalFrames[i] || interval;
                timeLine += interval;
            }
            return anim;
        }
    });

    return zz.modularize(
        {
            setImagePath: setImagePath
        },
        {
            SpriteEvent: SpriteEvent,
            SpriteAnimation: SpriteAnimation,
            SpriteSheetAnimation: SpriteSheetAnimation
        }
    );
};
