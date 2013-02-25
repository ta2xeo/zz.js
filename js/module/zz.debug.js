/** -*- coding: utf-8 -*-
 * zz.debug.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.4
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 * 読み込むだけで機能が有効になります。
 * 一緒にcss/debug.css, js/module/zz.keyboard.jsも読み込んで下さい。
 * 例）
 *   <link rel="stylesheet" type="text/css" href="./css/debug.css" />
 *   <script src="./js/module/zz.keyboard.js"></script>
 *   <script src="./js/module/zz.debug.js"></script>
 */
"use strict";

zz.debug = new function() {
    var RP = zz.ReferencePoint;
    var DebugEvent = {
        REDRAW: "__redraw__",
        UPDATE_TREE: "__update_tree__"
    };

    // 選択中のDisplayObject
    var selected = null;

    // プロパティの情報
    var properties = [
        {"property": "x", "title": "X", "type": inputNumber, "ratio": 1},
        {"property": "y", "title": "Y", "type": inputNumber, "ratio": 1},
        {"property": "width", "title": "W", "type": inputNumber, "ratio": 1},
        {"property": "height", "title": "H", "type": inputNumber, "ratio": 1},
        {"property": "rotation", "title": "回転", "type": inputNumber, "ratio": 1},
        {"property": "alpha", "title": "アルファ(％)", "type": inputNumber, "ratio": 100},
        {"property": "scaleX", "title": "X(％)", "type": inputNumber, "ratio": 100},
        {"property": "scaleY", "title": "Y(％)", "type": inputNumber, "ratio": 100},
        {"property": "visible", "title": "表示", "type": inputCheckbox},
        {"property": "referencePoint", "title": "参照位置", "type": referencePointList},
        {"property": "timeLine", "title": "MC(-/-)", "type": inputRange}
    ];

    /**
     * データのロード
     * 現状はlocalStorageを使ってるだけ
     * 無ければnullを返す
     */
    function loadData(key) {
        return window.localStorage.getItem(key) || null;
    }

    /**
     * データ保存
     * 現状はlocalStorageを使ってるだけ
     */
    function saveData(key, value) {
        window.localStorage.setItem(key, value);
    }

    /**
     * プロパティの更新
     */
    function updateProperty() {
        if (selected) {
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                var propertyName = property.property;
                var input = property.input;
                // MovieClipだけフレーム数表示
                if (propertyName == "timeLine") {
                    if (selected instanceof zz.MovieClip) {
                        property.element.style.display = "block";
                    } else {
                        property.element.style.display = "none";
                        continue;
                    }
                }
                if (document.activeElement != input && input.value !== selected[propertyName]) {
                    switch (property.type) {
                    case inputNumber:
                        input.value = selected[propertyName] * property.ratio;
                        break;
                    case inputCheckbox:
                        input.checked = selected[propertyName];
                        break;
                    case referencePointList:
                        for (var j = 0; j < input.options.length; j++) {
                            var pos = selected[propertyName] == RP.CENTER ? RP.CENTER | RP.MIDDLE : selected[propertyName];
                            if (input.options[j].value == pos) {
                                input.options[j].selected = true;
                            }
                        }
                        break;
                    case inputRange:
                        input.min = 1;
                        var max = selected.totalFrames;
                        input.max = max;
                        var title = property.title;
                        title.innerHTML = ["MC(",
                                           selected.currentFrame,
                                           "/",
                                           max,
                                           ")"].join("");
                        input.value = selected.currentFrame;
                        break;
                    default:
                        break;
                    }
                }
            }
        }
    }

    /**
     * 移動可能なウィンドウを作成する
     * @param {String} id 識別用IDでユニークでなければならない
     * @param {String} title ウィンドウのタイトルバーに表示される文字
     * @param {Object} defaults デフォルトのstyleをオブジェクト形式で渡せる
     */
    function createWindow(id, title, defaults) {
        var windowElement = document.createElement("div");
        windowElement.id = id;
        windowElement.className = "window";
        if (defaults) {
            for (var property in defaults) {
                var val = defaults[property];
                windowElement.style[property] = val;
            }
        }

        var titleElement = document.createElement("div");
        titleElement.className = "title";
        titleElement.innerHTML = title;
        windowElement.appendChild(titleElement);

        // ドラッグ可能にする
        (function() {
            var dragging = false, relativeX, relativeY;
            var saveX = loadData(id + "X");
            var saveY = loadData(id + "Y");

            if (saveX && saveY) {
                windowElement.style.position = "absolute";
                windowElement.style.left = saveX;
                windowElement.style.top = saveY;
                windowElement.style.bottom = "";
                windowElement.style.right = "";
            }

            function move(event) {
                if (dragging) {
                    var offsetX = window.pageXOffset;
                    var offsetY = window.pageYOffset;
                    windowElement.style.left = offsetX + event.clientX - relativeX + "px";
                    windowElement.style.top  = offsetY + event.clientY - relativeY + "px";
                    event.preventDefault();
                }
            }

            titleElement.addEventListener("mousedown", function(event) {
                dragging = true;
                relativeX = event.layerX;
                relativeY = event.layerY;
                var rect = windowElement.getBoundingClientRect();
                var offsetX = window.pageXOffset;
                var offsetY = window.pageYOffset;
                windowElement.style.left = offsetX + rect.left + "px";
                windowElement.style.top = offsetY + rect.top + "px";
                windowElement.style.bottom = "";
                windowElement.style.right = "";
                windowElement.style.position = "absolute";
                document.addEventListener("mousemove", move);
                event.preventDefault();
                event.stopPropagation();
            });

            function release(event) {
                dragging = false;
                document.removeEventListener("mousemove", move);
                saveData(id + "X", windowElement.style.left);
                saveData(id + "Y", windowElement.style.top);
                event.preventDefault();
            }

            titleElement.addEventListener("mouseup", release);
        })();

        return windowElement;
    }

    /**
     * プロパティ確認用ウィンドウ作成
     */
    function createPropertyWindow() {
        var window = createWindow("property", "プロパティ", {
            position: "absolute",
            right: "0px",
            bottom: "0px"
        });
        document.body.appendChild(window);

        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            window.appendChild(property.type(property));
        }
        return window;
    }
    window.addEventListener("load", createPropertyWindow);

    /**
     * input系で共通なもの
     */
    function inputCommon(property) {
        var element = document.createElement("div");
        var title = document.createElement("span");
        title.innerHTML = property.title + ":";
        var input = document.createElement("input");
        input.addEventListener("mousedown", function(event) {
            event.stopPropagation();
        });
        input.addEventListener("mousemove", function(event) {
            event.preventDefault();
            event.stopPropagation();
        });
        property.title = title;
        property.input = input;
        property.element = element;
        element.appendChild(title);
        element.appendChild(input);
        return element;
    }

    /**
     * <input type="number">
     */
    function inputNumber(property) {
        var propertyName = property.property;
        var element = inputCommon(property);
        var input = property.input;
        input.type = "number";

        input.addEventListener("input", function(event) {
            if (selected && input.value) {
                var value = null;
                var num = parseInt(input.value, 10);
                if (!isNaN(num)) {
                    value = num / property.ratio;
                }
                if (value !== null) {
                    selected[propertyName] = value;
                    selected.dispatchEvent(DebugEvent.REDRAW);
                    selected.transform();
                }
            }
            event.preventDefault();
        });
        return element;
    }

    /**
     * <input type="checkbox">
     */
    function inputCheckbox(property) {
        var propertyName = property.property;
        var element = inputCommon(property);
        var input = property.input;
        input.type = "checkbox";

        input.addEventListener("click", function(event) {
            if (selected) {
                var value = input.checked;
                if (value !== null) {
                    selected[propertyName] = value;
                    selected.dispatchEvent(zz.Event.ENTER_FRAME);
                }
            }
        });
        return element;
    }

    /**
     * <select>
     *   <option></option>
     * </select>
     */
    function referencePointList(property) {
        function optionTag(name, point, desc) {
            return [
                '<option name="',
                name,
                '" value="',
                point,
                '">',
                desc,
                '</option>'
            ].join("");
        }
        var options = [
            optionTag("LT", RP.LEFT | RP.TOP, "左上"),
            optionTag("LM", RP.LEFT | RP.MIDDLE, "左中"),
            optionTag("LB", RP.LEFT | RP.BOTTOM, "左下"),
            optionTag("CT", RP.CENTER | RP.TOP, "中上"),
            optionTag("CM", RP.CENTER | RP.MIDDLE, "中中"),
            optionTag("CB", RP.CENTER | RP.BOTTOM, "中下"),
            optionTag("RT", RP.RIGHT | RP.TOP, "右上"),
            optionTag("RM", RP.RIGHT | RP.MIDDLE, "右中"),
            optionTag("RB", RP.RIGHT | RP.BOTTOM, "右下")
        ].join("");

        var propertyName = property.property;
        var element = document.createElement("div");
        var title = document.createElement("span");
        title.innerHTML = property.title + ":";
        var select = document.createElement("select");
        select.innerHTML = options;
        select.addEventListener("mouseup", function(event) {
            var pos = select.options[select.selectedIndex].value;
            if (selected) {
                selected[propertyName] = pos;
                selected.transform();
            }
        });
        element.appendChild(select);
        property.input = select;
        return element;
    }

    /**
     * <input type="range">
     */
    function inputRange(property) {
        var propertyName = property.property;
        var element = inputCommon(property);
        element.style.display = "none";
        var input = property.input;
        input.type = "range";
        var title = property.title;

        function setTimeLine(event) {
            if (selected && input.value) {
                var v = parseInt(input.value, 10);
                if (selected.playing) {
                    selected.gotoAndPlay(v);
                } else {
                    selected.gotoAndStop(v);
                }
                updateProperty();
            }
            event.preventDefault();
        }

        input.addEventListener("change", setTimeLine);
        input.addEventListener("input", setTimeLine);
        return element;
    }

    /**
     * 選択したDisplayObjectにアウトラインを表示する
     * @param {DisplayObject} obj 選択対象
     */
    function setSelectLine(obj) {
        if (selected) {
            (function clearAllOutline(target) {
                target.style.outline = "";
                if (target instanceof zz.DisplayObjectContainer) {
                    for (var i = 0, len = target.numChildren; i < len; i++) {
                        var c = target.getChildAt(i);
                        clearAllOutline(c);
                    }
                }
            })(selected);
        }
        var outlines = [
            {color: "rgb(0,50,255)",
             style: "solid",
             width: "3px"
            },
            {color: "rgb(50,150,255)",
             style: "dotted",
             width: "2px"
            },
            {color: "rgb(150,200,255)",
             style: "dashed",
             width: "1px"
            }
        ];
        var maxDepth = outlines.length;
        var depth = 0;

        (function setAllOutline(target) {
            var outline = outlines[depth];
            target.style.outline = [outline.width, outline.style, outline.color].join(" ");
            ++depth;
            if (depth < maxDepth) {
                if (target instanceof zz.DisplayObjectContainer) {
                    for (var i = 0, len = target.numChildren; i < len; i++) {
                        var c = target.getChildAt(i);
                        setAllOutline(c);
                    }
                }
            }
            --depth;
        })(obj);
        selected = obj;
    }

    /**
     * DisplayObjectにデバッグ機能を付与する
     */
    function debugDisplayObject() {
        this.opened = false;
        this.addEventListener(zz.TouchEvent.TOUCH_DOWN, function() {
            this.opened = true;
            setSelectLine(this);
            var current = this.parent;
            while (current) {
                current.opened = true;
                current = current.parent;
            }
            this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
            return true;
        });

        // Firefoxだとアウトラインが広がるから再描画してやってごまかす。
        if (zz.ENV.RENDERING_ENGINE == "Gecko") {
            this.addEventListener(DebugEvent.REDRAW, function() {
                var tmp = this.style.outline;
                var self = this;
                function outline() {
                    self.style.outline = tmp;
                }
                if (tmp) {
                    this.style.outline = "";
                    setTimeout(outline, 100);
                }
            });
        }
    }

    /**
     * Stage内のオブジェクトを表示する
     */
    function debugStage() {
        var stage = this;

        // キーボードの↑↓←→でオブジェクトを移動できるように。
        this.addEventListener(KeyboardEvent.KEY_DOWN, function(e) {
            if (selected) {
                var match = false;
                var value = e.shiftKey ? 10 : 1;
                switch (e.keyCode) {
                case Keyboard.LEFT:
                    selected.x -= value;
                    match = true;
                    break;
                case Keyboard.RIGHT:
                    selected.x += value;
                    match = true;
                    break;
                case Keyboard.UP:
                    selected.y -= value;
                    match = true;
                    break;
                case Keyboard.DOWN:
                    selected.y += value;
                    match = true;
                    break;
                default:
                    break;
                }
                if (match) {
                    selected.dispatchEvent(DebugEvent.REDRAW);
                    selected.transform();
                    return true;
                }
            }
            return false;
        });

        // DisplayObjectのツリー表示用div要素
        function createObjectTreeWindow() {
            var window = createWindow("objectTree", "DisplayObject Tree", {
                position: "absolute",
                left: "0px",
                bottom: "0px"
            });
            document.body.appendChild(window);
            return window;
        }

        // オブジェクトツリーのベースウィンドウ
        var objectTreeWindow = createObjectTreeWindow();
        var objectTree = document.createElement("div");
        objectTreeWindow.appendChild(objectTree);

        // 全体のツリーを作成
        function createObjectTree() {

            updateProperty();

            // ツリーを一旦消す
            while (objectTree.firstChild) {
                objectTree.removeChild(objectTree.firstChild);
            }

            // 親作成
            function createObject(parentElement, displayObject) {
                var group = document.createElement("div");
                group.className = "group";
                var s = group.style;
                if (displayObject === selected) {
                    s.outline = "1px solid #f00";
                } else {
                    s.outline = "";
                }
                function openChildren() {
                    if (displayObject.opened) {
                        if (displayObject instanceof zz.DisplayObjectContainer) {
                            for (var i = 0, len = displayObject.numChildren; i < len; i++) {
                                var c = displayObject.getChildAt(i);
                                createObject(group, c);
                            }
                        }
                    }
                }

                function createInput() {
                    var e = document.createElement("input");
                    e.type = "button";
                    var s = e.style;
                    e.onmousedown = function(event) {
                        setSelectLine(displayObject);
                        displayObject.opened ^= true;
                        openChildren();
                        stage.dispatchEvent(DebugEvent.UPDATE_TREE);
                    };
                    var name = "[" + (displayObject.name || "-") + "]";
                    if (displayObject instanceof zz.DisplayObjectContainer) {
                        name += " (" + displayObject.numChildren + ")";
                    } else {
                        name += " (-)";
                    }
                    e.value = name;
                    return e;
                }
                group.appendChild(createInput());
                parentElement.appendChild(group);
                openChildren();
            }

            // ベースのelementにstageを追加
            createObject(objectTree, this);
        }

        this.addEventListener(DebugEvent.UPDATE_TREE, createObjectTree);
        this.addEventListener(zz.Event.ENTER_FRAME, updateProperty);

        // ステージウィンドウ
        (function() {
            // frameRateプロパティ書き換え
            var expectFrameRate = loadData("debugFrameRate") || this.frameRate;
            var actuallyFrameRate = expectFrameRate;
            Object.defineProperty(this, "frameRate", {
                get: function() {
                    return actuallyFrameRate;
                },
                set: function(rate) {
                    expectFrameRate = rate;
                }
            });

            // 表示ウィンドウ
            var stageWindow = createWindow("stageProperty", "Stage設定", {
                position: "absolute",
                top: "0px",
                left: "0px"
            });

            document.body.appendChild(stageWindow);

            // fps
            (function() {
                var title = document.createElement("div");
                title.innerHTML = "FPS:";
                var input = document.createElement("input");
                input.type = "range";
                input.max = 60;
                input.min = 1;
                input.value = actuallyFrameRate;
                input.addEventListener("mousedown", function(event) {
                    event.stopPropagation();
                });

                function setFPS() {
                    var n = parseInt(input.value, 10);
                    if (!isNaN(n)) {
                        actuallyFrameRate = n;
                        saveData("debugFrameRate", n);
                    }
                }

                input.addEventListener("change", setFPS);
                input.addEventListener("input", setFPS);
                title.appendChild(input);
                stageWindow.appendChild(title);
                this.addEventListener(zz.Event.ENTER_FRAME, function() {
                    title.firstChild.nodeValue = ["FPS 本来:",
                                                  expectFrameRate,
                                                  "/設定値:",
                                                  actuallyFrameRate
                                                 ].join("");
                });
            }).call(this);

            // 再生、一時停止
            (function() {
                var line = document.createElement("div");
                var title = document.createElement("span");
                title.innerHTML = this.running ? "再生中" : "停止中";
                function createButton(title) {
                    var button = document.createElement("input");
                    button.type = "button";
                    button.value = title;
                    button.style.margin = "5px 5px";
                    button.style.width = "100px";
                    return button;
                }
                var suspend = createButton("一時停止");
                suspend.addEventListener("click", function(event) {
                    if (stage.running) {
                        title.innerHTML = "停止中";
                        suspend.value = "再生";
                        stage.pause();
                    } else {
                        title.innerHTML = "再生中";
                        suspend.value = "一時停止";
                        stage.start();
                    }
                });
                this.timeLineElement = document.createElement("span");
                this.timeLineElement.innerHTML = "現在:" + this.frameCount + "フレーム目";
                line.appendChild(suspend);
                line.appendChild(this.timeLineElement);
                line.appendChild(title);
                stageWindow.appendChild(line);
            }).call(this);

            // ステージ色
            (function() {
                var line = document.createElement("div");
                var title = document.createElement("span");
                title.innerHTML = "ステージ色:";
                var select = document.createElement("select");
                var colors = [
                    ["透明", ""],
                    ["半透明(黒10%)", "rgba(0, 0, 0, 0.1)"],
                    ["半透明(黒25%)", "rgba(0, 0, 0, 0.25)"],
                    ["黒", "#000"],
                    ["白", "#fff"],
                    ["赤", "#f00"],
                    ["緑", "#0f0"],
                    ["青", "#00f"]
                ];
                var defaultColorIdx = parseInt(loadData("stageColor") || 0, 10);
                for (var i = 0; i < colors.length; i++) {
                    var c = colors[i];
                    select.innerHTML += ['<option value="',
                                         c[1],
                                         '">',
                                         c[0],
                                         "</option>"].join("");
                }
                select.options[defaultColorIdx].selected = true;
                this.backgroundColor = select.options[defaultColorIdx].value;
                var self = this;
                select.addEventListener("mouseup", function(event) {
                    var color = select.options[select.selectedIndex].value;
                    self.backgroundColor = color;
                    saveData("stageColor", select.selectedIndex);
                });
                line.appendChild(title);
                line.appendChild(select);
                stageWindow.appendChild(line);
            }).call(this);

            // 枠外表示
            (function() {
                var line = document.createElement("div");
                var title = document.createElement("span");
                title.innerHTML = "ステージ外表示";

                var input = document.createElement("input");
                input.type = "checkbox";
                input.checked = loadData("stageOverflow");
                stage.style.overflow = input.checked ? "" : "hidden";
                input.addEventListener("click", function(event) {
                    stage.style.overflow = input.checked ? "" : "hidden";
                    saveData("stageOverflow", input.checked || "");
                });
                line.appendChild(title);
                line.appendChild(input);
                stageWindow.appendChild(line);
            }).call(this);
        }).call(this);
    }
    debugStage.prototype = zz.createClass(debugStage, {
        onEnterFrame: function() {
            if (this.frameCount === undefined) {
                this.frameCount = 0;
            }
            if (this.timeLineElement) {
                this.timeLineElement.innerHTML = " 現在:" + this.frameCount + "フレーム目";
            }
            ++this.frameCount;
        }
    });

    /**
     * DisplayObjectContainer書き換え
     */
    function debugDisplayObjectContainer() {
    }
    debugDisplayObjectContainer.prototype = zz.createClass(debugDisplayObjectContainer, {
        addChildAt: function() {
            this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
        },
        removeChild: function() {
            this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
        },
        setChildIndex: function() {
            this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
        },
        swapChildren: function() {
            this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
        }
    });

    /**
     * クラスを上書きする。継承ではなくて上書き。
     * @param {Object} cls 上書き対象のクラス
     * @param {Object} extension 拡張するクラス
     * 
     */
    function overwriteClass(cls, extension) {
        function overwrite() {
            cls.apply(this, arguments);
            if (typeof extension != "function") {
                throw new Error(extension + " is not function.");
            }
            extension.apply(this, arguments);
        }

        overwrite.prototype = cls.prototype;

        function overwriteMethod(name) {
            var method = extension.prototype[name];
            var originalFunc = cls.prototype[name];
            function newMethod() {
                if (typeof originalFunc == "function") {
                    originalFunc.apply(this, arguments);
                }
                if (typeof method == "function") {
                    method.apply(this, arguments);
                }
            }
            overwrite.prototype[name] = newMethod;
        }

        for (var methodName in extension.prototype) {
            overwriteMethod(methodName);
        }
        return overwrite;
    }

    return zz.modularize(null, {
        DisplayObject: overwriteClass(zz.DisplayObject, debugDisplayObject),
        DisplayObjectContainer: overwriteClass(zz.DisplayObjectContainer, debugDisplayObjectContainer),
        Stage: overwriteClass(zz.Stage, debugStage)
    });
};
