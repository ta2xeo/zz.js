/** -*- coding: utf-8 -*-
 * zz.debug.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

zz.debug = new function() {
    var RP = zz.ReferencePoint;
    var REDRAW = "__redraw__";

    // 選択中のDisplayObject
    var selected = null;

    // 情報の更新の必要がある場合trueにする。
    var modified = false;

    function setSelectLine(obj) {
        if (selected) {
            (function clearAllBorder(target) {
                target.style.outline = "";
                if (target instanceof zz.DisplayObjectContainer) {
                    for (var i = 0, len = target.numChildren; i < len; i++) {
                        var c = target.getChildAt(i);
                        clearAllBorder(c);
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

        (function setAllBorder(target) {
            var outline = outlines[depth];
            target.style.outline = [outline.width, outline.style, outline.color].join(" ");
            ++depth;
            if (depth < maxDepth) {
                if (target instanceof zz.DisplayObjectContainer) {
                    for (var i = 0, len = target.numChildren; i < len; i++) {
                        var c = target.getChildAt(i);
                        setAllBorder(c);
                    }
                }
            }
            --depth;
        })(obj);
        selected = obj;
    }

    var statusWindow = document.createElement("div");

    function referencePointList() {
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
        return [
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
    }

    var properties = {
        x: {"title": "X", "type": "number", "ratio": 1},
        y: {"title": "Y", "type": "number", "ratio": 1},
        width: {"title": "W", "type": "number", "ratio": 1},
        height: {"title": "H", "type": "number", "ratio": 1},
        rotation: {"title": "回転", "type": "number", "ratio": 1},
        alpha: {"title": "アルファ(％)", "type": "number", "ratio": 100},
        scaleX: {"title": "X(％)", "type": "number", "ratio": 100},
        scaleY: {"title": "Y(％)", "type": "number", "ratio": 100},
        visible: {"title": "表示", "type": "checkbox"}, 
        referencePoint: {"title": "参照位置", "select": referencePointList}
    };

    // 指定のエレメントに対してドラッグできるようにする
    function enableDragElement(element, name) {
        var dragging = false;
        var relativeX, relativeY;
        var saveX = window.localStorage.getItem(name + "X");
        var saveY = window.localStorage.getItem(name + "Y");
        if (saveX && saveY) {
            element.style.position = "absolute";
            element.style.left = saveX;
            element.style.top = saveY;
            element.style.bottom = "";
            element.style.right = "";
        }
        element.addEventListener("mousedown", function(event) {
            var target = event.target;
            dragging = true;
            relativeX = event.layerX;
            relativeY = event.layerY;
            var rect = element.getBoundingClientRect();
            var offsetX = window.pageXOffset;
            var offsetY = window.pageYOffset;
            element.style.left = offsetX + rect.left + "px";
            element.style.top = offsetY + rect.top + "px";
            element.style.bottom = "";
            element.style.right = "";
            element.style.position = "absolute";
            element.addEventListener("mousemove", move);
        });
        element.addEventListener("mouseup", function(event) {
            dragging = false;
            event.preventDefault();
            element.removeEventListener("mousemove", move);
            window.localStorage.setItem(name + "X", element.style.left);
            window.localStorage.setItem(name + "Y", element.style.top);
        });
        function move(event) {
            if (dragging) {
                var offsetX = window.pageXOffset;
                var offsetY = window.pageYOffset;
                element.style.left = offsetX + event.clientX - relativeX + "px";
                element.style.top  = offsetY + event.clientY - relativeY + "px";
                event.preventDefault();
            }
        }
    }

    function createStatusWindow() {
        var s = statusWindow.style;
        s.backgroundColor = "#ddd";
        s.borderRadius = "8px";
        s.border = "2px solid #bbb";
        s.display = "inline-block";
        s.padding = "20px";
        s.margin = "0px";
        s.textAlign = "right";
        if (false) {
            s.position = "fixed";
            s.bottom = "0px";
            s.right = "0px";
        } else {
            s.position = "fixed";
            s.top = "0px";
            s.right = "0px";
            enableDragElement(statusWindow, "statusWindow");
        }
        document.body.appendChild(statusWindow);

        function inputText(key) {
            var property = properties[key];
            var name = document.createElement("div");
            name.innerHTML = property.title + ":";
            var input = document.createElement("input");
            input.addEventListener("mousedown", function(event) {
                event.preventDefault();
                event.stopPropagation();
            });
            input.addEventListener("mousemove", function(event) {
                event.preventDefault();
                event.stopPropagation();
            });
            input.addEventListener("mouseup", function(event) {
                input.focus();
                input.select();
            });
            input.addEventListener("click", function(event) {
                var value = null;
                if (property.type == "checkbox") {
                    value = input.checked;
                }
                if (value !== null) {
                    selected[key] = value;
                }
                event.preventDefault();
            });
            input.addEventListener("input", function(event) {
                if (selected && input.value) {
                    var value = null;
                    if (property.type == "number") {
                        var num = parseInt(input.value, 10);
                        if (!isNaN(num)) {
                            value = num / property.ratio;
                        }
                    }
                    if (value !== null) {
                        selected[key] = value;
                        selected.dispatchEvent(REDRAW);
                    }
                }
                event.preventDefault();
            });
            input.type = property.type;
            name.appendChild(input);
            property.input = input;
            return name;
        }

        function pulldownMenu(Key) {
            var property = properties[key];
            var name = document.createElement("div");
            name.innerHTML = property.title + ":";
            var select = document.createElement("select");
            select.innerHTML = property.select();
            select.addEventListener("mouseup", function(event) {
                var pos = select.options[select.selectedIndex].value;
                if (selected) {
                    selected[key] = pos;
                }
            });
            name.appendChild(select);
            property.input = select;
            return name;
        }

        for (var key in properties) {
            var property = properties[key];
            if (property.type) {
                statusWindow.appendChild(inputText(key));
            } else if (property.select) {
                statusWindow.appendChild(pulldownMenu(key));
            }
        }
    }
    window.addEventListener("load", createStatusWindow);

    /**
     * DisplayObjectの枠を可視化したりドラッグで操作出来るようにDisplayObject自体を書き換える
     */
    function debugDisplayObject() {
        this.opened = false;
        modified = true;
        this.addEventListener(zz.TouchEvent.TOUCH_DOWN, function() {
            modified = true;
            this.opened = true;
            setSelectLine(this);
            var current = this.parent;
            while (current) {
                current.opened = true;
                current = current.parent;
            }
            return true;
        });

        // Firefoxだとアウトラインが広がるから再描画してやってごまかす。
        if (zz.ENV.RENDERING_ENGINE == "Gecko") {
            this.addEventListener(REDRAW, function() {
                var tmp = this.style.outline;
                function outline() {
                    this.style.outline = tmp;
                    this.removeEventListener(zz.Event.ENTER_FRAME, outline);
                }
                if (tmp) {
                    this.style.outline = "";
                    this.addEventListener(zz.Event.ENTER_FRAME, outline);
                }
            });
        }
    }

    /**
     * Stage内のオブジェクトを表示する
     */
    function debugStage() {
        this.style.border = "3px solid rgba(255, 0, 0, 0.5)";
        this.style.overflow = "";

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
                    selected.dispatchEvent(REDRAW);
                    return true;
                }
            }
            return false;
        });

        // DisplayObjectのマップ表示用div要素
        var objectMapWindowTitle = document.createElement("div");
        document.body.appendChild(objectMapWindowTitle);
        var objectMapWindow = document.createElement("div");
        (function() {
            var s = objectMapWindow.style;
            s.position = "fixed";
            s.left = "0px";
            s.bottom = "0px";
            s.backgroundColor = "rgba(200, 200, 200, 0.7)";
            s.borderRadius = "8px";
            s.border = "2px solid #bbb";
            s.display = "inline-block";
            s.padding = "20px";
            s.margin = "0px";
            document.body.appendChild(objectMapWindow);
        })();

        enableDragElement(objectMapWindow, "objectMapWindow");

        // 全体のマップを作成
        function createObjectMap() {

            // 変更がなければ更新しない
            if (!modified) {
                return;
            }

            // マップ表示を削除
            while (objectMapWindow.firstChild) {
                objectMapWindow.removeChild(objectMapWindow.firstChild);
            }

            // 親作成
            function createObject(parentElement, displayObject) {
                var group = document.createElement("div");
                var s = group.style;
                s.outline = "";
                s.margin = "5px 15px";  // インデント付ける

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
                    s.margin = "3px";
                    e.onmousedown = function(event) {
                        modified = true;
                        setSelectLine(displayObject);
                        displayObject.opened ^= true;
                        openChildren();
                    };
                    var name = Object.prototype.toString.apply(displayObject);
                    if (displayObject.name) {
                        name += " [" + displayObject.name + "]";
                    }
                    e.value = name;
                    return e;
                }
                group.appendChild(createInput());
                parentElement.appendChild(group);
                openChildren();
            }

            // ベースのelementにstageを追加
            createObject(objectMapWindow, this);

            modified = false;
        }

        this.addEventListener(zz.Event.ENTER_FRAME, createObjectMap);
        this.addEventListener(zz.Event.ENTER_FRAME, function() {
            if (selected) {
                for (var key in properties) {
                    var property = properties[key];
                    var input = property.input;
                    if (document.activeElement != input &&
                        input.value !== selected[key]) {
                        if (input.type == "select-one") {
                            for (var i = 0; i < input.options.length; i++) {
                                var pos = selected[key] == RP.CENTER ? RP.CENTER | RP.MIDDLE : selected[key];
                                if (input.options[i].value == pos) {
                                    input.options[i].selected = true;
                                }
                            }
                        } else if (input.type == "checkbox") {
                            input.checked = selected[key];
                        } else {
                            input.value = selected[key] * property.ratio;
                        }
                    }
                }
            }
        });

        // frameRateプロパティ書き換え
        var expectFrameRate = window.localStorage.getItem("debugFrameRate") || this.frameRate;
        var actuallyFrameRate = expectFrameRate;
        Object.defineProperty(this, "frameRate", {
            get: function() {
                return actuallyFrameRate;
            },
            set: function(rate) {
                expectFrameRate = rate;
            }
        });

        var stageWindow = document.createElement("div");
        (function() {
            var s = stageWindow.style;
            s.marginTop = "10px";

            var title = document.createElement("div");
            title.innerHTML = "FPS:";
            statusWindow.appendChild(stageWindow);
            var input = document.createElement("input");
            input.type = "range";
            input.max = 60;
            input.min = 1;
            input.value = actuallyFrameRate;
            input.onmouseup = function(event) {
                input.focus();
                input.select();
            };
            input.addEventListener("mousedown", function(event) {
                event.preventDefault();
                event.stopPropagation();
            });

            function setFPS() {
                var n = parseInt(input.value, 10);
                if (!isNaN(n)) {
                    actuallyFrameRate = n;
                    window.localStorage.setItem("debugFrameRate", n);
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
    }

    /**
     * DisplayObjectContainer書き換え
     */
    var debugDisplayObjectContainerMethods = {
        addChild: function() {
            modified = true;
        },
        addChildAt: function() {
            modified = true;
        },
        removeChild: function() {
            modified = true;
        },
        setChildIndex: function() {
            modified = true;
        },
        swapChildren: function() {
            modified = true;
        }
    };

    function overwriteClass(cls, initialize, methods) {
        function overwrite() {
            cls.apply(this, arguments);
            if (typeof initialize == "function") {
                initialize.apply(this, arguments);
            }
        }

        overwrite.prototype = cls.prototype;

        function overwriteMethod(name) {
            var method = methods[name];
            var originalFunc = overwrite.prototype[name];
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

        if (typeof methods == "object") {
            for (var name in methods) {
                overwriteMethod(name);
            }
        }
        return overwrite;
    }

    return zz.modularize(null, {
        DisplayObject: overwriteClass(zz.DisplayObject, debugDisplayObject),
        DisplayObjectContainer: overwriteClass(zz.DisplayObjectContainer, null, debugDisplayObjectContainerMethods),
        Stage: overwriteClass(zz.Stage, debugStage)
    });
};
