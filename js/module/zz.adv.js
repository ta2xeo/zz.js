/** -*- coding: utf-8 -*-
 * zz.adv.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.3
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 * 
 * htmlparser.jsが必要です。
 * http://ejohn.org/blog/pure-javascript-html-parser/
 */
"use strict";

zz.adv = new function() {
    var DEFAULT_TEXT_COLOR = "#ffffff";
    var DEFAULT_BG_COLOR = "#000000";
    var DEFAULT_BG_ALPHA = 0.75;
    var DEFAULT_TEXT_WAIT = 50;
    var DEFAULT_BG_RADIUS = 15;
    var DEFAULT_TEXT_OFFSET_X = 20;
    var DEFAULT_TEXT_OFFSET_Y = 10;
    var DEFAULT_TEXT_LINE_HEIGHT = "170%";
    var DEFAULT_NAME_PLATE_BORDER = "5px ridge #0f00f0";

    /**
     * 入力待ち状態を知らせるアイコン
     * @constructor
     */
    function DefaultReadyIcon() {
        zz.MovieClip.apply(this);
        var triangle = new zz.TextField();
        triangle.text = "▼";
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
        this.textWait = DEFAULT_TEXT_WAIT;  // milli seconds.

        this.text = new zz.TextField();
        this.text.textColor = DEFAULT_TEXT_COLOR;
        this.text.style.lineHeight = DEFAULT_TEXT_LINE_HEIGHT;
        var offsetX = DEFAULT_TEXT_OFFSET_X;
        var offsetY = DEFAULT_TEXT_OFFSET_Y;
        this.text.style.padding = [
            offsetY + "px",  // ↑
            offsetX + "px",  // ← →
            0 + "px"         // ↓
        ].join(" ");
        this.setTexts(new Array());
        this.readyIcon = new DefaultReadyIcon();
        this.readyIcon.referencePoint = zz.ReferencePoint.BOTTOM | zz.ReferencePoint.RIGHT;
        this.readyIcon.setPosition(this.width - 10, this.height - 10);
        this.addChild(this.text);
        this.addChild(this.readyIcon);
        this.ready = true;
        this.current = null;

        var self = this;
        this._typewriter = function() {
            var wait = self.textWait / self.root.frameRate;
            ++self.count;
            if (self.count > wait) {
                self.count = 0;
                ++self.character;
                self.text.text = self.current[self.character - 1];
                if (!self.current[self.character]) {
                    self.ready = true;
                    self.removeEventListener(Event.ENTER_FRAME, self._typewriter);
                }
            }
        };
    }
    TextArea.STATUS = {
        START: 1,
        READING: 2,
        END: 3
    };
    TextArea.prototype = zz.createClass(zz.DisplayObjectContainer, {
        setTexts: function(htmlArray) {
            this.index = -1;
            this.htmls = htmlArray;
        },
        erase: function() {
            this.text.text = "";
        },
        next: function() {
            ++this.index;
            var current = this.htmls[this.index];

            function parse(html) {
                var chars = new Array();
                var tags = new Object();
                var ruby = {
                    marks: new Object(),
                    rt: false,
                    rp: false,
                    inside: function() {
                        return this.rt || this.rp;
                    }
                };

                function appendTag(tag) {
                    var len = chars.length;
                    if (len in tags === false) {
                        tags[len] = new Array();
                    }
                    tags[len].push(tag);
                }

                function appendStartTag(tag, attrs, unary) {
                    var startTag = {
                        tag: tag,
                        attrs: attrs,
                        unary: unary,
                        start: true,
                        createTag: function() {
                            var set = ["<", tag];
                            for (var i = 0, len = attrs.length; i < len; i++) {
                                set.push(" " + attrs[i].name + "=" + attrs[i].value);
                            }
                            set.push(unary ? "/>" : ">");
                            return set.join("");
                        }
                    };
                    appendTag(startTag);
                    if (tag == "rt") {
                        ruby.rt = true;
                    }
                    if (tag == "rp") {
                        ruby.rp = true;
                    }
                }
                function appendEndTag(tag) {
                    var endTag = {
                        tag: tag,
                        end: true,
                        createTag: function() {
                            return "</" + tag + ">";
                        }
                    };
                    appendTag(endTag);
                    if (tag == "rt") {
                        ruby.rt = false;
                    }
                    if (tag == "rp") {
                        ruby.rp = false;
                    }
                }

                HTMLParser(html, {
                    start: function(tag, attrs, unary) {
                        appendStartTag(tag, attrs, unary);
                    },
                    end: function(tag) {
                        appendEndTag(tag);
                    },
                    chars: function(text) {
                        for (var i = 0, len = text.length; i < len; i++) {
                            if (ruby.inside()) {
                                ruby.marks[chars.length] = true;
                            }
                            chars.push(text[i]);
                        }
                    },
                    comment: function(text) {
                    }
                });
                var htmlArray = new Array();

                for (var i = 0, len = chars.length; i < len; i++) {
                    var text = chars.slice(0, i + 1);
                    var stack = new Array();
                    var used = new Object();
                    for (var index in tags) {
                        var tag = tags[index].map(function(tag) {
                            if (index <= i) {
                                if (!tag.unary) {
                                    if (tag.start) {
                                        if (tag.tag in used === false) {
                                            used[tag.tag] = 0;
                                        }
                                        ++used[tag.tag];
                                    } else if (tag.end) {
                                        --used[tag.tag];
                                    }
                                }
                                return tag.createTag();
                            } else if (!tag.unary) {
                                if (tag.end && used[tag.tag] > 0) {
                                    --used[tag.tag];
                                    return tag.createTag();
                                }
                            }
                            return "";
                        });
                        stack.unshift({
                            index: index,
                            tag: tag.join("")
                        });
                    }
                    for (var j = 0, stackLen = stack.length; j < stackLen; j++) {
                        var idx = stack[j].index;
                        if (idx > i + 1) {
                            idx = i + 1;
                        }
                        text.splice(idx, 0, stack[j].tag);
                    }
                    if (i + 1 in ruby.marks === false) {
                        htmlArray.push(text.join(""));
                    }
                }
                return htmlArray || null;
            }
            this.current = parse(current);
        },
        forward: function() {
            if (this.ready && this.textWait !== 0) {
                this.character = 1;
                this.count = 0;
                this.text.text = this.current[this.character - 1];
                this.addEventListener(Event.ENTER_FRAME, this._typewriter);
                this.ready = false;
            } else {
                this.removeEventListener(Event.ENTER_FRAME, this._typewriter);
                this.text.text = this.current[this.current.length - 1];
                this.ready = true;
            }
        },
        read: function() {
            var status = TextArea.STATUS.READING;
            if (this.ready) {
                this.next();
                status = TextArea.STATUS.START;
            }
            if (!this.htmls[this.index]) {
                status = TextArea.STATUS.END;
            } else {
                this.forward();
            }
            return status;
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
                        this.readyIcon.gotoAndPlay(1);
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
     * 画像の表示周り
     */
    function Image(info) {
        var image = info.mc || new zz.Sprite(info.path);
        image.referencePoint = zz.ReferencePoint.CENTER;
        image.x = info.x || 0;
        image.y = info.y || 0;
        if (info.active !== undefined && !info.active) {
            image.brightness = -20;
        }
        return image;
    }

    /**
     * 規定のフォーマットのObjectを渡すことでADV風に進行させる
     * @constructor
     * @param {TextArea} textArea
     * @param {NamePlate} namePlate
     */
    function ADVController(textArea, namePlate) {
        zz.DisplayObjectContainer.call(this);
        this.imageContainer = new zz.DisplayObjectContainer();
        this.imageContainer.referencePoint = zz.ReferencePoint.BOTTOM | zz.ReferencePoint.CENTER;
        this.textArea = textArea;
        this.namePlate = namePlate;
        this.addChild(this.imageContainer);
        this.addChild(textArea);
        this.addChild(namePlate);
    }
    ADVController.prototype = zz.createClass(zz.DisplayObjectContainer, {
        /**
         * @param {Object} data
         * [
         *     {
         *         name: "foo",
         *         text: "I'm from Gotemba.",
         *         image: {
         *             path: "/image/bar.png",
         *             x: 50,
         *             y: 100,
         *         }
         *     }
         * ]
         * @param {Function} callback 全てのテキストが読み終わった時に呼ばれる
         */
        setData: function(data, callback) {
            this.names = new Array();
            this.images = new Array();
            var texts = new Array();
            for (var i = 0, len = data.length; i < len; i++) {
                this.names.push(data[i].name);
                texts.push(data[i].text);
                this.images.push(data[i].image);
            }
            this.textArea.setTexts(texts);
            this.end = callback;
        },
        /**
         * @param {Function} callback 画像のロードが完了すると呼ばれる
         */
        preloadImages: function(callback) {
            var images = this.images.filter(function(image) {
                if (image && image.path) {
                    return true;
                }
            }).map(function(image) {
                return image.path;
            });
            zz.preload(images, callback);
        },
        read: function() {
            var status = this.textArea.read();
            if (status === TextArea.STATUS.END) {
                if (typeof this.end == "function") {
                    this.end();
                }
            } else if (status === TextArea.STATUS.START) {
                var name = this.names[this.textArea.index];
                if (name) {
                    this.namePlate.name = name;
                }
                var currentImage = this.images[this.textArea.index];
                for (var i = 0, len = this.imageContainer.numChildren; i < len; i++) {
                    var child = this.imageContainer.getChildAt(i);
                    child.removeSelf();
                }
                if (currentImage) {
                    if (currentImage instanceof Array === false) {
                        currentImage = [currentImage];
                    }
                    for (i = 0, len = currentImage.length; i < len; i++) {
                        var image = currentImage[i];
                        this.imageContainer.addChild(new Image(image));
                    }
                }
            }
        },
        erase: function() {
            this.namePlate.name = "";
            this.textArea.erase();
        },
        setUIPosition: function(namePlatePos, textAreaPos, imageContainerPos) {
            this.namePlate.setPosition(namePlatePos[0], namePlatePos[1]);
            this.textArea.setPosition(textAreaPos[0], textAreaPos[1]);
            this.imageContainer.setPosition(imageContainerPos[0], imageContainerPos[1]);
        }
    });

    return zz.modularize(null, {
        TextArea: TextArea,
        NamePlate: NamePlate,
        ADVController: ADVController
    });
};
