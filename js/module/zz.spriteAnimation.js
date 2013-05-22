/** -*- coding: utf-8 -*-
 * zz.spriteAnimation.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.8
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
        /**
         * スプライトの枚数
         */
        spriteCount: {
            get: function() {
                return this.numChildren;
            }
        },
        loadComplete: function(spr) {
            var self = this;
            function comp() {
                ++self.loadCount;
                if (self.loadCount === self.numChildren) {
                    self.spritesLoaded = true;
                    if (self.autoPlay) {
                        self.gotoAndPlay(self.currentFrame);
                    } else {
                        var first = self.getChildAt(0);
                        self.setSpriteSize(first);
                    }
                    self.spriteLoaded = true;
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
            this.loadCount = 0;
            var len = images.length;
            for (var i = 0; i < len; i++) {
                var path = this.prefix + images[i] + this.suffix;
                var spr = new zz.Sprite(path);
                spr.visible = false;
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
                        var c = this.getChildAt(i);
                        this.setSpriteSize(c);
                        c.visible = true;
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
            function setFrame() {
                this.removeEventListener(SpriteEvent.LOAD_SPRITES, setFrame);
                var frame = this.spritesIndices[index];
                if (!frame) {
                    throw new zz.ZZError("invalid index.");
                }
                this.setFrame(frame);
            }
            if (this.spritesIndices) {
                setFrame.call(this);
            } else {
                this.addEventListener(SpriteEvent.LOAD_SPRITES, setFrame);
            }
        },
        setSpriteSize: function(sprite) {
            if (sprite) {
                zz.MovieClip.prototype.setSize.call(this, sprite.width, sprite.height);
            }
        },
        /**
         * スプライトの切り替え間隔を指定する
         */
        setAnimationInterval: function(intervalFrame) {
            if (intervalFrame) {
                if (intervalFrame instanceof Array) {
                    this.intervalFrames = [];
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
            var anim = {};
            this.spritesIndices = [];
            var timeLine = 1;
            var interval = 1;
            for (var i = 0, len = this.spriteCount; i < len; i++) {
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
        this.selectedSprites = null;
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
            this.addChild(spr);
        },
        spriteCount: {
            get: function() {
                return this.chipCount;
            }
        },
        _getAnimationData: function() {
            var _anim = {};
            var _timeLine = 1;
            var spr = this.getChildAt(0);
            var w_cnt = spr.width / this.chipWidth << 0;
            var h_cnt = spr.height / this.chipHeight << 0;
            var index = 0;
            for (var i = 0; i < h_cnt; i++) {
                for (var j = 0; j < w_cnt; j++) {
                    if (this.selectedSprites === null || index in this.selectedSprites) {
                        _anim[_timeLine] = {
                            tx: j * this.chipWidth,
                            ty: i * this.chipHeight,
                            tw: this.chipWidth,
                            th: this.chipHeight,
                            stop: true
                        };
                        ++_timeLine;
                    }
                    ++index;
                }
            }
            spr.setAnimation(_anim);
            return SpriteAnimation.prototype._getAnimationData.call(this);
        },
        _changeSprite: function(index) {
            return function() {
                this.getChildAt(0).setFrame(index + 1);
            };
        },
        /**
         * @param {Array of Int} selectSprites zero origin
         */
        selectSprites: function(selectSprites) {
            this.selectedSprites = {};
            for (var i = 0, len = selectSprites.length; i < len; i++) {
                this.selectedSprites[selectSprites[i]] = 1;
            }
        },
        setSpriteSize: function(sprite) {
            if (sprite) {
                zz.MovieClip.prototype.setSize.call(this, this.chipWidth, this.chipHeight);
            }
        }
    });

    return zz.modularize({
        local: {
            setImagePath: setImagePath
        },
        global: {
            SpriteEvent: SpriteEvent,
            SpriteAnimation: SpriteAnimation,
            SpriteSheetAnimation: SpriteSheetAnimation
        }
    });
};
