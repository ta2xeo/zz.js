/** -*- coding: utf-8 -*-
 * zz.util.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.util = new function() {
    /**
     * このクラスに含まれる全オブジェクトのENTER_FRAMEイベントを抑制する。
     * runを呼ぶと動きだす。インスタンス生成が完了してから動かしたい時などに使う。
     * @extends zz.MovieClip
     * @constructor
     */
    function LazyMC() {
        zz.MovieClip.apply(this);
        this._running = false;
    }
    LazyMC.prototype = zz.createClass(zz.MovieClip, {
        _execute: function() {
            if (this._running) {
                zz.MovieClip.prototype._execute.apply(this);
            } else {
                this._execution = false;
            }
        },
        run: function() {
            this._running = true;
            function exec(parent) {
                parent._execute();
                if (!(parent instanceof zz.DisplayObjectContainer)) {
                    return;
                }
                for (var i = 0, len = parent.numChildren; i < len; i++) {
                    var child = parent.getChildAt(i);
                    exec(child);
                }
            }
            exec(this);
        },
        suspend: function() {
            this._running = false;
        }
    });


    /**
     * 対象のStageのFPSを表示する
     * @extends zz.DisplayObjectContainer
     */
    function FPS(stage) {
        zz.DisplayObjectContainer.apply(this);
        var cnt = 0;
        var before = 0;
        var after = 0;
        this.fps = 0;
        function measure() {
            ++cnt;
            var d = new Date();
            after = d.getSeconds();
            if (before != after) {
                before = after;
                this.fps = cnt;
                cnt = 0;
            }
        }
        this.addEventListener(Event.ENTER_FRAME, measure);
        stage.addChild(this);
    }
    FPS.prototype = zz.createClass(zz.DisplayObjectContainer, {
        console: function(intervalSec) {
            intervalSec = intervalSec || 1;
            var self = this;
            function output() {
                console.log("FPS:", self.fps);
                setTimeout(output, intervalSec * 1000);
            }
            output();
        },
        text: function(x, y) {
            x = x || 0;
            y = y || 0;
            var text = new zz.TextField();
            text.setPosition(x, y);
            text.style.textShadow = "-1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000";
            var fmt = new zz.TextFormat();
            fmt.bold = true;
            fmt.size = 16;
            fmt.color = "#fff";
            text.defaultTextFormat = fmt;
            this.addChild(text);
            this.addEventListener(Event.ENTER_FRAME, function() {
                text.text = this.fps;
            });
        }

    });


    /**
     * 画像をまとめてロードする場合に使う。
     * zz.preloadを高機能にした感じ。
     */
    var Loader = new function() {
        var MAX_PARALLELS = 6;

        /**
         * @constructor
         */
        function Loader() {
            this.progress = 0;
            this.queues = [];
            this.parallels = MAX_PARALLELS;  // 並列ダウンロード最大数
            this.stored = {};  // 重複読み込み防止。queueに追加した時点で登録される。
            this.progress = null;
        }
        Loader.prototype = zz.createClass(Object, {
            addQueue: function(assets) {
                if (this.queues.length === 0) {
                    this.queues.push([]);
                }
                var index = this.queues.length - 1;
                var queue = this.queues[index];
                function set(queue, asset) {
                    if (!asset) {
                        return;
                    }
                    if (!(asset in this.stored)) {
                        this.stored[asset] = 1;
                        queue.push(asset);
                    }
                }
                if (assets instanceof Array) {
                    for (var i = 0, len = assets.length; i < len; i++) {
                        set.call(this, this.queues[index], assets[i]);
                    }
                } else {
                    set.call(this, this.queues[index], assets);
                }
            },
            nextQueue: function(assets) {
                this.queues.push([]);
                if (assets) {
                    this.addQueue(assets);
                }
            },
            /**
             * 画像ダウンロード開始
             * 先頭のキューセットのみ
             * @param {Function} complete
             */
            download: function(complete) {
                var loadedCnt = 0;
                var queue = this.queues.shift();
                var limit = this.parallels;
                var func = this.progress;

                if (!queue || queue.length === 0) {
                    if (typeof func == "function") {
                        func(100, 0, 0);
                    }
                    if (typeof complete == "function") {
                        complete();
                    }
                    return;
                }
                var queueCnt = queue.length;

                function loaded() {
                    ++loadedCnt;
                    var percent = loadedCnt * 100 / queueCnt;
                    if (percent <= 100) {
                        if (typeof func == "function") {
                            func(percent, loadedCnt, queueCnt);
                        }
                    }
                    if (percent >= 100) {
                        if (percent === 100 && typeof complete == "function") {
                            complete();
                        }
                        return;
                    }
                    var src = queue.shift();
                    if (src) {
                        zz.loadImage(src, loaded);
                    }
                }
                for (var i = 0; i < limit; i++) {
                    var src = queue.shift();
                    if (src) {
                        zz.loadImage(src, loaded);
                    } else {
                        break;
                    }
                }
            },
            /**
             * 進捗度表示(デフォルト)
             */
            showDefaultProgress: function() {
                var stage = new zz.Stage("__zz_loader_default_progress__");
                stage.setSize(200, 200);
                stage.style.position = "absolute";
                var fmt = new zz.TextFormat();
                fmt.color = "#ddd";
                fmt.size = 40;
                fmt.font = "sans-serif";
                fmt.bold = true;
                var text = new zz.TextField("0%");
                text.setPosition(120, 10);
                text.referencePoint = zz.ReferencePoint.RIGHT_TOP;
                text.defaultTextFormat = fmt;
                stage.addChild(text);
                var self = this;
                function defaultProgress(percent, cnt, maxCnt) {
                    percent = Math.floor(percent);
                    text.text = percent + '%';
                    if (percent === 100) {
                        self.progress = null;
                        stage.removeSelf();
                    }
                }
                this.progress = defaultProgress;
            },
            showDefaultLoadingIcon: function(color) {
                var stage = new zz.Stage("__zz_loader_default_loading_icon__");
                var W = 140;
                var H = 140;
                stage.referencePoint = zz.ReferencePoint.CENTER;
                stage.style.position = "absolute";
                stage.setPosition(stage.width / 2, stage.height / 2);
                stage.setSize(W, H);
                var cnt = 0;
                stage.addEventListener(Event.ENTER_FRAME, function() {
                    ++cnt;
                    if (cnt > 2) {
                        stage.rotation += 45;
                        cnt = 0;
                    }
                });
                for (var i = 0; i < 6; i++) {
                    var con = new zz.DisplayObjectContainer();
                    con.setSize(W / 2, H / 2);
                    con.setPosition(W / 2, H / 2);
                    con.referencePoint = zz.ReferencePoint.CENTER_BOTTOM;
                    con.rotation = i * 45;
                    con.alpha = 1 - i * 0.15;
                    var obj = new zz.DisplayObject();
                    obj.setSize(10, 30);
                    obj.style.borderRadius = "10px";
                    obj.referencePoint = zz.ReferencePoint.CENTER;
                    obj.setPosition(W / 4, H / 4);
                    obj.backgroundColor = color || "#fff";
                    con.addChild(obj);
                    stage.addChild(con);
                }
                var self = this;
                function removeIcon(percent, cnt, maxCnt) {
                    percent = Math.floor(percent);
                    if (percent === 100) {
                        self.progress = null;
                        stage.removeSelf();
                    }
                }
                this.progress = removeIcon;
            }
        });
        return Loader;
    };

    /**
     * オブジェクトのvalue値を一次元配列に変換する。
     * オブジェクトのみで配列は適用されない。再帰的な処理になっている。
     */
    function objectValueToList(object) {
        var list = [];
        (function append(o) {
            for (var k in o) {
                var src = o[k];
                if (src instanceof Object) {
                    append(src);
                } else {
                    list.push(src);
                }
            }
        })(object);
        return list;
    }

    return zz.modularize({
        local: {
            objectValueToList: objectValueToList
        },
        global: {
            LazyMC: LazyMC,
            FPS: FPS,
            Loader: Loader
        }
    });
};
