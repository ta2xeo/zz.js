/** -*- coding: utf-8 -*-
 * zz.debug.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.8
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
    // style.zIndex
    var DEFAULT_Z_INDEX = 10000;
    var RP = zz.ReferencePoint;
    var DebugEvent = {
        REDRAW: "__redraw__",
        UPDATE_TREE: "__update_tree__"
    };

    // 選択中のDisplayObject
    var selected = null;

    // 選択中のStageオブジェクト
    var attachStage = null;

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
        {"property": "tx", "title": "TX", "type": inputNumber, "ratio": 1},
        {"property": "ty", "title": "TY", "type": inputNumber, "ratio": 1},
        {"property": "tw", "title": "TW", "type": inputNumber, "ratio": 1},
        {"property": "th", "title": "TH", "type": inputNumber, "ratio": 1},
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
                // 対応外のものは非表示
                switch (propertyName) {
                case "timeLine":
                    if (selected instanceof zz.MovieClip) {
                        property.element.style.display = "block";
                    } else {
                        property.element.style.display = "none";
                        continue;
                    }
                    break;
                case "tx":
                case "ty":
                case "tw":
                case "th":
                    if (selected instanceof zz.Sprite) {
                        property.element.style.display = "block";
                    } else {
                        property.element.style.display = "none";
                        continue;
                    }
                    break;
                default:
                    break;
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
    var windows = [];
    function createWindow(id, title, defaults) {
        var exist = document.getElementById(id);
        if (exist) {
            return exist;
        }
        var windowElement = document.createElement("div");
        windows.push(windowElement);
        windowElement.id = id;
        windowElement.className = "zz_debug_window";
        windowElement.style.zIndex = DEFAULT_Z_INDEX;
        if (defaults) {
            for (var property in defaults) {
                var val = defaults[property];
                windowElement.style[property] = val;
            }
        }

        var titleElement = document.createElement("div");
        titleElement.className = "zz_debug_title";
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

            windowElement.addEventListener("mousedown", function(event) {
                for (var i = 0, len = windows.length; i < len; i++) {
                    var w = windows[i];
                    if (w === windowElement) {
                        w.style.zIndex = DEFAULT_Z_INDEX + 1;
                    } else {
                        w.style.zIndex = DEFAULT_Z_INDEX;
                    }
                }
                var exclude = {"input": 1, "select": 1};
                if (!(event.target.tagName.toLowerCase() in exclude)) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

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
        var window = createWindow("zz_debug_property_window", "プロパティ", {
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
     * DisplayObjectのツリー表示用ウィンドウ
     */
    function getObjectTreeWindow() {
        var id = "zz_debug_object_tree_window";
        var exist = document.getElementById(id);
        if (exist) {
            return exist;
        }
        var window = createWindow(id, "DisplayObject Tree", {
            position: "absolute",
            left: "0px",
            bottom: "0px"
        });
        document.body.appendChild(window);
        var objectTree = document.createElement("div");
        objectTree.id = "zz_debug_object_tree";
        window.appendChild(objectTree);
        return window;
    }

    /**
     * ステージウィンドウ
     */
    var stageSelector;
    var fpsText, fpsInput;
    var pauseButton;
    var timeLineText;
    var stageColorSelect;
    var overflowInput;

    function changeStage(detach, attach) {
        fpsInput.value = attach.actuallyFrameRate;
        function updateFps() {
            fpsText.innerHTML = ["FPS 本来:",
                                 attachStage.expectFrameRate,
                                 "/設定値:",
                                 attachStage.actuallyFrameRate
                                ].join("");
        }
        function updateTimeLine() {
            timeLineText.innerHTML = "現在:" + attachStage.frameCount + "フレーム目" + (attachStage.running ? "再生中" : "停止中");
            if (attachStage.running) {
                pauseButton.value = "一時停止";
            } else {
                pauseButton.value = "再生";
            }
        }
        if (detach) {
            detach.removeEventListener(Event.ENTER_FRAME, updateFps);
            detach.removeEventListener(Event.ENTER_FRAME, updateTimeLine);
            //detach.removeEventListener(DebugEvent.UPDATE_TREE, attach.createObjectTree);
            detach.removeEventListener(zz.Event.ENTER_FRAME, updateProperty);
        }
        attach.addEventListener(Event.ENTER_FRAME, updateFps);
        attach.addEventListener(Event.ENTER_FRAME, updateTimeLine);

        var defaultColorIdx = parseInt(loadData("zz_debug_stageColor_" + attach.element.id) || 0, 10);
        stageColorSelect.options[defaultColorIdx].selected = true;

        overflowInput.checked = loadData("zz_debug_stageOverflow_" + attach.element.id);
        attach.style.overflow = overflowInput.checked ? "" : "hidden";

        attach.dispatchEvent(DebugEvent.UPDATE_TREE);
    }

    function getStageWindow(stage) {
        attachStage = stage;
        var id = "zz_debug_stage_window";
        var window = document.getElementById(id);

        if (!window) {
            window = createWindow(id, "Stage設定", {
                position: "absolute",
                top: "0px",
                left: "0px"
            });
            document.body.appendChild(window);

            // ステージ選択
            (function() {
                var line = document.createElement("div");
                line.innerHTML = "ステージ選択:";
                stageSelector = document.createElement("select");
                stageSelector.id = "zz_debug_stage_window_selector";
                line.appendChild(stageSelector);
                window.appendChild(line);

                stageSelector.addEventListener("mouseup", function(event) {
                    var detachStage = attachStage;
                    attachStage = stageSelector.options[stageSelector.selectedIndex].stage;
                    changeStage(detachStage, attachStage);
                });
            })();

            // FPS
            (function() {
                var line = document.createElement("div");
                fpsText = document.createElement("span");
                fpsText.innerHTML = "FPS:";
                fpsInput = document.createElement("input");
                fpsInput.type = "range";
                fpsInput.max = 60;
                fpsInput.min = 1;
                fpsInput.value = stage.actuallyFrameRate;
                fpsInput.addEventListener("mousedown", function(event) {
                    event.stopPropagation();
                });

                function setFPS() {
                    var n = parseInt(fpsInput.value, 10);
                    if (!isNaN(n)) {
                        attachStage.actuallyFrameRate = n;
                        saveData("zz_debug_FrameRate_" + attachStage.element.id, n);
                    }
                }

                fpsInput.addEventListener("change", setFPS);
                fpsInput.addEventListener("input", setFPS);
                line.appendChild(fpsText);
                line.appendChild(fpsInput);
                window.appendChild(line);
            })();

            // 再生、一時停止
            (function() {
                var line = document.createElement("div");
                timeLineText = document.createElement("span");
                function createButton(title) {
                    var button = document.createElement("input");
                    button.type = "button";
                    button.value = title;
                    button.style.margin = "5px 5px";
                    button.style.width = "100px";
                    return button;
                }
                pauseButton = createButton("一時停止");
                pauseButton.addEventListener("click", function(event) {
                    if (attachStage.running) {
                        attachStage.pause();
                        pauseButton.value = "再生";
                        timeLineText.innerHTML = "現在:" + attachStage.frameCount + "フレーム目停止中";
                    } else {
                        attachStage.start();
                        pauseButton.value = "一時停止";
                        timeLineText.innerHTML = "現在:" + attachStage.frameCount + "フレーム目再生中";
                    }
                });
                line.appendChild(pauseButton);
                line.appendChild(timeLineText);
                window.appendChild(line);
            })();

            // ステージ色
            (function() {
                var line = document.createElement("div");
                var title = document.createElement("span");
                title.innerHTML = "ステージ色:";
                var select = stageColorSelect = document.createElement("select");
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
                var defaultColorIdx = parseInt(loadData("zz_debug_stageColor_" + attachStage.element.id) || 0, 10);
                for (var i = 0; i < colors.length; i++) {
                    var c = colors[i];
                    select.innerHTML += ['<option value="',
                                         c[1],
                                         '">',
                                         c[0],
                                         "</option>"].join("");
                }
                select.options[defaultColorIdx].selected = true;
                stage.backgroundColor = select.options[defaultColorIdx].value;
                select.addEventListener("mouseup", function(event) {
                    var color = select.options[select.selectedIndex].value;
                    attachStage.backgroundColor = color;
                    saveData("zz_debug_stageColor_" + attachStage.element.id, select.selectedIndex);
                });
                line.appendChild(title);
                line.appendChild(select);
                window.appendChild(line);
            })();

            // 枠外表示
            (function() {
                var line = document.createElement("div");
                var title = document.createElement("span");
                title.innerHTML = "ステージ外表示";

                var input = overflowInput = document.createElement("input");
                input.type = "checkbox";
                input.addEventListener("click", function(event) {
                    attachStage.style.overflow = input.checked ? "" : "hidden";
                    saveData("zz_debug_stageOverflow_" + attachStage.element.id, input.checked || "");
                });
                line.appendChild(title);
                line.appendChild(input);
                window.appendChild(line);
            })();
        }

        var option = document.createElement("option");
        option.innerHTML = stage.element.id;
        option.selected = true;
        option.stage = stage;
        stageSelector.appendChild(option);

        changeStage(null, stage);
        return window;
    }

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
        element.appendChild(title);
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
                if (target && target.style) {
                    target.style.outline = "";
                    if (target instanceof zz.DisplayObjectContainer) {
                        for (var i = 0, len = target.numChildren; i < len; i++) {
                            var c = target.getChildAt(i);
                            clearAllOutline(c);
                        }
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

        // 選択ステージ表示
        var detachStage = attachStage;
        attachStage = selected.root;
        changeStage(detachStage, attachStage);
        for (var i = 0; i < stageSelector.options.length; i++) {
            if (attachStage === stageSelector.options[i].stage) {
                stageSelector.options[i].selected = true;
            } else {
                stageSelector.options[i].selected = false;
            }
        }
    }

    /**
     * DisplayObjectにデバッグ機能を付与する
     */
    function debugDisplayObject() {
        this.opened = false;
        this.addEventListener(zz.TouchEvent.TOUCH_DOWN, function(event) {
            // シフトキー押してると無効になる。
            if (!event.shiftKey) {
                this.opened = true;
                setSelectLine(this);
                var current = this.parent;
                while (current) {
                    current.opened = true;
                    current = current.parent;
                }
                this.root.dispatchEvent(DebugEvent.UPDATE_TREE);
                return true;
            }
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
                    updateProperty();
                    return true;
                }
            }
            return false;
        });

        // オブジェクトツリーのベースウィンドウ
        var objectTreeWindow = getObjectTreeWindow();
        // オブジェクトツリーのベースウィンドウ
        var objectTree = document.getElementById("zz_debug_object_tree");

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
                group.className = "zz_debug_group";
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
                                if (c) {
                                    createObject(group, c);
                                }
                            }
                        }
                    }
                }

                function createNamePlate() {
                    var e = document.createElement("input");
                    e.type = "button";
                    var s = e.style;
                    e.onmousedown = function(event) {
                        setSelectLine(displayObject);
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

                function createOpenButton() {
                    var e = document.createElement("input");
                    e.type = "button";
                    var s = e.style;
                    e.value = displayObject.opened ? "-" : "+";
                    e.onmousedown = function(event) {
                        displayObject.opened ^= true;
                        openChildren();
                        stage.dispatchEvent(DebugEvent.UPDATE_TREE);
                    };
                    return e;
                }

                group.appendChild(createNamePlate());
                if (displayObject instanceof zz.DisplayObjectContainer) {
                    group.appendChild(createOpenButton());
                }
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
            this.expectFrameRate = loadData("zz_debug_FrameRate_" + this.element.id) || this.frameRate;
            this.actuallyFrameRate = this.expectFrameRate;
            Object.defineProperty(this, "frameRate", {
                get: function() {
                    return this.actuallyFrameRate;
                },
                set: function(rate) {
                    this.expectFrameRate = rate;
                }
            });

            // 表示ウィンドウ
            if (attachStage === null) {
                var stageWindow = getStageWindow(this);
            }
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
                throw new zz.ZZError(extension + " is not function.");
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

    return zz.modularize({
        global: {
            DisplayObject: overwriteClass(zz.DisplayObject, debugDisplayObject),
            DisplayObjectContainer: overwriteClass(zz.DisplayObjectContainer, debugDisplayObjectContainer),
            Stage: overwriteClass(zz.Stage, debugStage)
        }
    });
};
