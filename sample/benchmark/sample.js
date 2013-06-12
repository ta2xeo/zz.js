/** -*- coding: utf-8 -*-
 * sample.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

var ROOT_PATH = "../../";
var URL = "http://google.com";

function main() {
    zz.globalize();

    var root = new Stage("stage");
    root.backgroundColor = "#333";

    var container = new DisplayObjectContainer();

    function move(obj) {
        var moveX = Math.random() * 5 + 2;
        var moveY = Math.random() * 5 + 2;
        var rot = Math.random() * 10 + 1;
        obj.addEventListener(Event.ENTER_FRAME, function() {
//            obj.rotation += rot;
            if (obj.rotation >= 360) {
                obj.rotation = 0;
            }
            obj.x += moveX;
            if (obj.x > 640) {
                obj.x = 640;
                moveX = -moveX;
            } else if (obj.x < 0) {
                obj.x = 0;
                moveX = -moveX;
            }
            obj.y += moveY;
            if (obj.y > 900) {
                obj.y = 900;
                moveY = -moveY;
            } else if (obj.y < 0) {
                obj.y = 0;
                moveY = -moveY;
            }
        });
    }

    for (var i = 0; i < 100; i++) {
        var obj = new DisplayObject();
        obj.backgroundColor = "#00f";
        obj.setSize(50, 50);
        container.addChild(obj);
        var x = Math.random() * 640;
        var y = Math.random() * 900;
        obj.setPosition(x, y);
        move(obj);
    }
    root.addChild(container);

    var fps = new FPS(root);
    fps.text();
}

window.addEventListener('load', main, false);
