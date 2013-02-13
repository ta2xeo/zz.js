/** -*- coding: utf-8 -*-
 * util.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.2
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */

/**
 * @param {String} sceneName
 */
function Scene(sceneName) {
    var scene = new zz.DisplayObjectContainer();
    scene.name = sceneName;
    return scene;
}

function SceneManager() {
    var manager = new zz.DisplayObjectContainer();
    manager.changeScene = function(sceneName) {
        var scene = manager.getChildByName(sceneName);
        scene.visible = true;
    };
    /**
     * @param {Scene} scene
     */
    manager.addScene = function(scene) {
        scene.visible = false;
        manager.addChild(scene);
    };
    return manager;
}

function Number(image, offset) {
    function number() {
        var n = new zz.DisplayObjectContainer();
        image.match(/\./);
        for (var i = 0; i < 10; i++) {
            var filename = RegExp.leftContext + i + "." + RegExp.rightContext;
            n.addChild(new zz.Sprite(filename));
        }
        n.setNum = function(num) {
            n._num = num;
            for (var i = 0; i < 10; i++) {
                var child = n.getChildAt(i);
                if (i == num) {
                    if (!child.visible) {
                        child.visible = true;
                    }
                } else {
                    if (child.visible) {
                        child.visible = false;
                    }
                }
            }
        };
        n.getNum = function() {
            return n._num;
        };
        n.setNum(0);
        return n;
    }
    var nums = new zz.DisplayObjectContainer();
    var maxLen = 0;
    var figure = 0;
    nums.setNumber = function(num) {
        var strNum = num + "";
        var strLen = strNum.length;
        var i;
        if (strLen > maxLen) {
            for (i = 0; i < strLen - maxLen; i++) {
                var n = number();
                n.x = offset * figure;
                --figure;
                nums.addChild(n);
            }
            maxLen = strLen;
        }
        var zero = true;
        for (i = 0, len = nums.numChildren; i < len; i++) {
            n = parseInt(strNum.charAt(i), 10);
            var idx = len - i - 1;
            var child = nums.getChildAt(idx);
            if (zero && n === 0 && maxLen !== 1) {
                if (child.visible) {
                    child.visible = false;
                }
            } else {
                if (!child.visible) {
                    child.visible = true;
                }
                child.setNum(n);
                zero = false;
            }
        }
    };
    return nums;
}

function Button(stateImages) {
    var button = new zz.MovieClip();
    if (!(stateImages instanceof Array)) {
        stateImages = Array.prototype.slice.call(arguments);
    }
    var len = stateImages.length;
    for (var i = 0; i < len; i++) {
        var btn = new zz.Sprite(stateImages[i]);
        button.addChild(btn);
    }
    var enabled = button.getChildAt(0);
    button.addEventListener(zz.TouchEvent.TOUCH_DOWN, function() {
        if (button.enabled) {
            button.disable();
            return true;
        }
    });
    button.addEventListener(zz.TouchEvent.TOUCH_UP, function() {
        button.enable();
        return true;
    });
    button.addEventListener(zz.TouchEvent.TOUCH_OUT, function(event) {
        button.enable();
        return true;
    });
    if (len != 1) {
        button.enable = function() {
            button.setChildIndex(enabled, 1);
        };
        button.disable = function() {
            button.setChildIndex(enabled, 0);
        };
    } else {
        button.enable = function() {
            // security error
            //enabled.brightness = 0;
            enabled.alpha = 1;
        };
        button.disable = function() {
            // security error
            //enabled.brightness = -50;
            enabled.alpha = 0.9;
        };
    }
    button.enable();
    return button;
}

function FPS() {
    var t = new zz.TextField();
    var cnt = 0;
    var before = 0;
    var after = 0;
    t.px = 16;
    t.textColor = "#fff";
    t.style.textShadow = "#363636 0px -1px 3px, #363636 1px 0px 3px, #363636 0px 1px 3px, #363636 -1px 0px 3px";
    function measure() {
        ++cnt;
        var d = new Date();
        after = d.getSeconds();
        if (before != after) {
            before = after;
            t.text = cnt;
            cnt = 0;
        }
    }
    t.addEventListener(Event.ENTER_FRAME, measure);
    return t;
}
