/** -*- coding: utf-8 -*-
 * zz.spriteAnimation.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.spriteAnimation = new function() {
    // スプライト画像のロード完了時に発行されるイベント
    var EVENT_LOAD_SPRITES = "__load_sprites__";

    // 画像のパス。共通のURLやパスはこれを設定すると省略できる。
    var _imagesPath = "";

    function setImagesPath(path) {
        _imagesPath = path;
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
            this.prefix = _imagesPath + prefix;
            this.suffix = suffix;
        },
        loadComplete: function(spr) {
            var self = this;
            function comp() {
                ++self.loadCount;
                if (self.loadCount === self.sprites.length) {
                    self.spritesLoaded = true;
                    if (self.autoPlay) {
                        self.gotoAndPlay(1);
                    }
                    self.dispatchEvent(EVENT_LOAD_SPRITES);
                }
                spr.removeEventListener(zz.Event.COMPLETE, comp);
            }
            return comp;
        },
        /**
         * 複数の絵からアニメーションを作る
         */
        loadImages: function(images) {
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
                this.setSpriteAnimation();
            }
        },
        changeSprite: function(index) {
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
        setSpriteByIndex: function(index) {
            var frame = index * this.intervalFrame + 1;
            console.log(frame);
            this.setFrame(frame);
        },
        /**
         * スプライトの切り替え間隔を指定する
         */
        setSpriteAnimation: function(intervalFrame) {
            if (intervalFrame) {
                this.intervalFrame = intervalFrame;
            } else {
                this.intervalFrame = 1;
            }
            var anim = new Object();
            var timeLine = 1;
            for (var i = 0, len = this.numChildren; i < len; i++) {
                if (i !== 0) {
                    timeLine += this.intervalFrame;
                }
                anim[timeLine] = {
                    event: this.changeSprite(i)
                };
            }
            var func = anim[timeLine].event;
            // 関数呼んでるのは途中で切り替えても動作するようにしたい為。
            anim[timeLine].event = function() {
                func.call(this);
                if (!this.loop) {
                    this.stop();
                }
            };
            this.setAnimation(anim);
        },
        /**
         * 一枚のスプライトシートから切り分けてアニメーションを作る
         * 未実装
         */
        loadSpriteSheet: function(sheet) {
            throw new Error("Not implemented error.");
        }
    });


    return zz.modularize(
        {
            setImagesPath: setImagesPath
        },
        {
            EVENT_LOAD_SPRITES: EVENT_LOAD_SPRITES,
            SpriteAnimation: SpriteAnimation
        }
    );
};
