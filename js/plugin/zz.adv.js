/** -*- coding: utf-8 -*-
 * zz.adv.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.adv = new function() {
    var DEFAULT_TEXT_COLOR = "#ffffff";
    var DEFAULT_BG_COLOR = "#000000";
    var DEFAULT_BG_ALPHA = 0.6;
    var DEFAULT_TEXT_WAIT = 50;
    var DEFAULT_BG_RADIUS = 15;
    var DEFAULT_TEXT_OFFSET_X = 20;
    var DEFAULT_TEXT_OFFSET_Y = 10;
    var DEFAULT_NAME_PLATE_BORDER = "5px ridge #0f00f0";

    /**
     * 入力待ち状態を知らせるアイコン
     * @constructor
     */
    function DefaultReadyIcon() {
        zz.MovieClip.apply(this);
        var triangle = new zz.TextField("▼");
        triangle.textColor = DEFAULT_TEXT_COLOR;
        this.addChild(triangle);
        this.width = 30;
        this.height = 30;
        this.setAnimation({
            1: {alpha: 0, tween: true},
            15: {alpha: 1, tween: true},
            30: {alpha: 0, tween: true}
        });
    }
    DefaultReadyIcon.prototype = zz.createClass(zz.MovieClip, {});

    /**
     * テキストエリア全体のオブジェクト
     * @constructor
     * @extends DisplayObjectContainer
     */
    function TextArea(width, height, radius) {
        zz.DisplayObjectContainer.apply(this);
        this.backgroundColor = DEFAULT_BG_COLOR;
        this.alpha = DEFAULT_BG_ALPHA;
        this.setSize(width, height);
        this.style.borderRadius = (radius || DEFAULT_BG_RADIUS) + "px";
        this.index = -1;  // start index.
        this.textWait = DEFAULT_TEXT_WAIT;  // milli seconds.

        this.text = new zz.TextField();
        this.text.textColor = DEFAULT_TEXT_COLOR;
        var offsetX = DEFAULT_TEXT_OFFSET_X;
        var offsetY = DEFAULT_TEXT_OFFSET_Y;
        this.text.style.padding = [offsetY + "px",
                                   offsetX + "px",
                                   0 + "px"].join(" ");
        this.setTexts(new Array());
        this.readyIcon = new DefaultReadyIcon();
        this.readyIcon.referencePoint = zz.ReferencePoint.BOTTOM | zz.ReferencePoint.RIGHT;
        this.readyIcon.setPosition(this.width - 10, this.height - 10);
        this.addChild(this.text);
        this.addChild(this.readyIcon);
        this.ready = true;

        var self = this;
        this._typewriter = function() {
            var wait = self.textWait / self.root.frameRate;
            ++self.count;
            if (self.count > wait) {
                self.count = 0;
                ++self.character;
                self.text.text = self.current.substr(0, self.character);
                if (self.character == self.current.length) {
                    self.ready = true;
                    self.removeEventListener(Event.ENTER_FRAME, self._typewriter);
                }
            }
        };
    }
    TextArea.prototype = zz.createClass(zz.DisplayObjectContainer, {
        setTexts: function(textArray) {
            this.index = -1;
            this.texts = textArray;
        },
        erase: function() {
            this.text.text = "";
        },
        current: {
            get: function() {
                var current = this.texts[this.index];
                return current || null;
            }
        },
        next: function() {
            ++this.index;
            var current = this.texts[this.index];
            return current || null;
        },
        forward: function() {
            if (this.ready && this.textWait !== 0) {
                this.character = 1;
                this.count = 0;
                this.text.text = this.current.substr(0, this.character);
                this.addEventListener(Event.ENTER_FRAME, this._typewriter);
                this.ready = false;
            } else {
                this.removeEventListener(Event.ENTER_FRAME, this._typewriter);
                this.text.text = this.current;
                this.ready = true;
            }
        },
        read: function() {
            var end = false;
            if (this.ready) {
                this.next();
            }
            if (this.current === null) {
                end = true;
            } else {
                this.forward();
            }
            return end;
        },
        ready: {
            get: function() {
                return this._ready;
            },
            set: function(flag) {
                this._ready = flag;
                if (this.readyIcon) {
                    this.readyIcon.visible = this._ready;
                    if (this._ready) {
                        this.readyIcon.play();
                    } else {
                        this.readyIcon.stop();
                    }
                }
            }
        }
    });

    /**
     * 名前欄
     * @constructor
     */
    function NamePlate(width, height, radius) {
        zz.Sprite.apply(this);
        this.setSize(width, height);
        this.backgroundColor = DEFAULT_BG_COLOR;
        this.style.borderRadius = (radius || DEFAULT_BG_RADIUS) + "px";
        this.style.border = DEFAULT_NAME_PLATE_BORDER;
        this._name = new zz.TextField();
        this._name.referencePoint = zz.ReferencePoint.CENTER;
        this._name.setPosition(this.width / 2, this.height / 2);
        this._name.textColor = DEFAULT_TEXT_COLOR;
        this.defaultNameColor = this.nameColor;
        this.addChild(this._name);
        this.nameColors = new Object();
    }
    NamePlate.prototype = zz.createClass(zz.Sprite, {
        name: {
            get: function() {
                return this._name.text;
            },
            set: function(name) {
                this._name.text = name;
                if (name in this.nameColors) {
                    this.nameColor = this.nameColors[name];
                } else {
                    this.nameColor = this.defaultNameColor;
                }
            }
        },
        nameColor: {
            get: function() {
                return this._name.textColor;
            },
            set: function(color) {
                this._name.textColor = color;
            }
        }
    });

    /**
     * 規定のフォーマットのObjectを渡すことでテキストを読ませる
     * @constructor
     * @param {TextArea} textArea
     * @param {NamePlate} namePlate
     */
    function ADVController(textArea, namePlate) {
        this.textArea = textArea;
        this.namePlate = namePlate;
    }
    ADVController.prototype = zz.createClass(Object, {
        /**
         * @param {Object} data
         * [
         *     {
         *         name: "foo",
         *         text: "I'm from Gotemba."
         *     }
         * ]
         */
        setData: function(data, callback) {
            this.names = new Array();
            var texts = new Array();
            for (var i = 0, len = data.length; i < len; i++) {
                this.names.push(data[i].name);
                texts.push(data[i].text);
            }
            this.textArea.setTexts(texts);
            this.end = callback;
        },
        read: function() {
            if (this.textArea.read()) {
                if (typeof this.end === "function") {
                    this.end();
                }
            } else {
                var name = this.names[this.textArea.index];
                if (name) {
                    this.namePlate.name = name;
                }
            }
        },
        erase: function() {
            this.namePlate.name = "";
            this.textArea.erase();
        }
    });

    return {
        TextArea: TextArea,
        NamePlate: NamePlate,
        ADVController: ADVController
    };
};
