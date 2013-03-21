/** -*- coding: utf-8 -*-
 * zz.adv.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.4
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
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
     * プレーンテキストのパーサー
     * デフォルトはこれが設定されている
     */
    function plainTextParser(text) {
        var chars = [];
        for (var i = 0, len = text.length; i < len; i++) {
            chars.push(text.substr(0, i + 1));
        }
        return chars;
    }

    /**
     * HTML形式のテキストに対応したパーサー
     * ルビにも対応。ただしブラウザに依存。
     * これを使用する場合htmlparser.jsが必要です。
     * 予め読み込んで下さい。
     * http://ejohn.org/blog/pure-javascript-html-parser/
     */
    function htmlParser(html) {
        var chars = [];
        var tags = {};
        var ruby = {
            marks: {},
            rt: false,
            rp: false,
            inside: function() {
                return this.rt || this.rp;
            }
        };

        function appendTag(tag) {
            var len = chars.length;
            if (len in tags === false) {
                tags[len] = [];
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
        var htmlArray = [];

        for (var i = 0, len = chars.length; i < len; i++) {
            var text = chars.slice(0, i + 1);
            var stack = [];
            var used = {};
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
        return htmlArray;
    }

    /**
     * Typewriter用イベント
     * @extends zz.Event
     */
    function TypewriterEvent(eventName, characters) {
        zz.Event.call(this, eventName);
        this.characters = characters || 0;
    }
    var state = {
        STAND_BY: "__typewriter_event_stand_by__",
        START: "__typewriter_event_start__",
        READING: "__typewriter_event_reading__",
        END: "__typewriter_event_end__"
    };
    for (var key in state) {
        TypewriterEvent[key] = state[key];
    }
    TypewriterEvent.prototype = zz.createClass(zz.Event, {
    });

    /**
     * タイプライターのように一文字ずつ表示する機能を持たせたクラス
     */
    var Typewriter = new function() {
        /**
         * @constructor
         * @extends zz.TextField
         */
        function Typewriter(textArray) {
            zz.TextField.call(this);
            this.textWait = DEFAULT_TEXT_WAIT;  // milli seconds.
            this.setText(textArray || []);
            this.parser = plainTextParser;
        }
        Typewriter.prototype = zz.createClass(zz.TextField, {
            /**
             * @param {Array} textArray 表示する文字列の配列
             */
            setText: function(textArray) {
                if (typeof textArray == "string") {
                    this._textArray = [textArray];
                } else if (textArray instanceof Array) {
                    this._textArray = textArray;
                } else {
                    throw new zz.ZZError("textArray is invalid arg.");
                }
                this.ready = true;
            },
            /**
             * 文字列表示
             */
            _print: function() {
                var idx = this._index >= this.current.length ? this.current.length - 1 : this._index;
                this.text = this.current[idx];
                this.dispatchEvent(new TypewriterEvent(TypewriterEvent.TYPING, idx + 1));
            },
            /**
             * 表示開始時に呼ばれる
             */
            _start: function() {
                this.ready = false;
                this._count = 0;
                this._index = 0;
                this._print();
                this.addEventListener(zz.Event.ENTER_FRAME, this._sequence);
            },
            /**
             * 表示完了時に呼ばれる
             */
            _end: function() {
                this.ready = true;
                if (this._textArray.length === 0) {
                    this.dispatchEvent(new TypewriterEvent(TypewriterEvent.END));
                } else {
                    this.dispatchEvent(new TypewriterEvent(TypewriterEvent.STAND_BY));
                }
                this.removeEventListener(Event.ENTER_FRAME, this._sequence);
            },
            /**
             * called by enter frame event
             */
            _sequence: function() {
                var wait = this.textWait * this.root.frameRate / 1000;
                var step = wait === 0 ? this.current.length : 1 / wait << 0;
                if (step < 1) {
                    step = 1;
                }
                ++this._count;
                if (this._count > wait) {
                    this._index += step;
                    this._print();
                    this._count = 0;
                    if (!this.current[this._index]) {
                        this._end();
                    }
                }
            },
            /**
             * 次の文字列へ
             */
            next: function() {
                var current = this._textArray.shift();
                this.current = this.parser(current);
            },
            /**
             * 一気に全部表示
             */
            flash: function() {
                this.text = this.current[this.current.length - 1];
                this._end();
            },
            /**
             * 一文字ずつ表示
             */
            typing: function() {
                if (this._textArray.length !== 0) {
                    this.next();
                    this.dispatchEvent(new TypewriterEvent(TypewriterEvent.START));
                    this._start();
                } else {
                    this.dispatchEvent(new TypewriterEvent(TypewriterEvent.END));
                }
            },
            /**
             * ADV風の表示機能。
             * 待機状態に実行されれば一文字ずつの表示を開始。
             * 表示途中なら全部表示。
             */
            read: function() {
                if (this.ready) {
                    this.typing();
                } else {
                    this.flash();
                }
            }
        });
        return Typewriter;
    };

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

        this.text = new Typewriter();
        this.text.autoResize = false;
        this.text.setSize(width - offsetX, height);
        this.text.textColor = DEFAULT_TEXT_COLOR;
        this.text.style.lineHeight = DEFAULT_TEXT_LINE_HEIGHT;
        var offsetX = DEFAULT_TEXT_OFFSET_X;
        var offsetY = DEFAULT_TEXT_OFFSET_Y;
        this.text.style.padding = [
            offsetY + "px",  // ↑
            offsetX + "px",  // ← →
            0 + "px"         // ↓
        ].join(" ");
        this.setText([]);
        this.readyIcon = new DefaultReadyIcon();
        this.readyIcon.referencePoint = zz.ReferencePoint.BOTTOM | zz.ReferencePoint.RIGHT;
        this.readyIcon.setPosition(this.width - 10, this.height - 10);
        this.addChild(this.text);
        this.addChild(this.readyIcon);
    }

    TextArea.prototype = zz.createClass(zz.DisplayObjectContainer, {
        setText: function(textArray) {
            this.text.setText(textArray);
        },
        setParser: function(parser) {
            this.text.parser = parser;
        },
        erase: function() {
            this.text.text = "";
        },
        read: function() {
            this.text.read();
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
        this._nameText = new zz.TextField();
        this._nameText.referencePoint = zz.ReferencePoint.CENTER;
        this._nameText.setPosition(this.width / 2, this.height / 2);
        this._nameText.textColor = DEFAULT_TEXT_COLOR;
        this.defaultNameColor = this.nameColor;
        this.addChild(this._nameText);
        this.nameColors = {};
    }
    NamePlate.prototype = zz.createClass(zz.Sprite, {
        who: {
            get: function() {
                return this._nameText.text;
            },
            set: function(name) {
                this._nameText.text = name;
                if (name in this.nameColors) {
                    this.nameColor = this.nameColors[name];
                } else {
                    this.nameColor = this.defaultNameColor;
                }
            }
        },
        nameColor: {
            get: function() {
                return this._nameText.textColor;
            },
            set: function(color) {
                this._nameText.textColor = color;
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

        // イベント登録
        var self = this;
        this.textArea.text.addEventListener(TypewriterEvent.END, function() {
            if (typeof self.end == "function") {
                self.end();
            }
        });

        this.textArea.text.addEventListener(TypewriterEvent.START, function() {
            var name = self.names.shift();
            if (name) {
                self.namePlate.who = name;
            }
            var currentImage = self.images.shift();
            for (var i = 0, len = self.imageContainer.numChildren; i < len; i++) {
                var child = self.imageContainer.getChildAt(i);
                child.removeSelf();
            }
            if (currentImage) {
                if (currentImage instanceof Array === false) {
                    currentImage = [currentImage];
                }
                for (i = 0, len = currentImage.length; i < len; i++) {
                    var image = currentImage[i];
                    self.imageContainer.addChild(new Image(image));
                }
            }
        });
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
            this.names = [];
            this.images = [];
            var texts = [];
            for (var i = 0, len = data.length; i < len; i++) {
                this.names.push(data[i].name);
                texts.push(data[i].text);
                this.images.push(data[i].image);
            }
            this.textArea.setText(texts);
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
            this.textArea.read();
        },
        erase: function() {
            this.namePlate.who = "";
            this.textArea.erase();
        },
        setUIPosition: function(namePlatePos, textAreaPos, imageContainerPos) {
            this.namePlate.setPosition(namePlatePos[0], namePlatePos[1]);
            this.textArea.setPosition(textAreaPos[0], textAreaPos[1]);
            this.imageContainer.setPosition(imageContainerPos[0], imageContainerPos[1]);
        }
    });

    return zz.modularize(
        {
            plainTextParser: plainTextParser,
            htmlParser: htmlParser
        },
        {
            TypewriterEvent: TypewriterEvent,
            Typewriter: Typewriter,
            TextArea: TextArea,
            NamePlate: NamePlate,
            ADVController: ADVController
        }
    );
};
