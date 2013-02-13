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

function main() {
    zz.globalize();

    var root = new Stage("stage");

    var obj = new DisplayObject();
    obj.x = 200;
    obj.y = 50;
    obj.width = 30;
    obj.height = 30;
    obj.backgroundColor = "#f00";
    root.addChild(obj);

    var moveX = 2;
    function move() {
        obj.x += moveX;
        if (obj.x > 440 || obj.x < 200) {
            moveX = -moveX;
        }
    }

    var text = new TextField();
    root.addChild(text);

    var enable = false;
    function toggle() {
        enable ^= true;
        if (enable) {
            text.text = "実行中";
            obj.addEventListener(Event.ENTER_FRAME, move);
        } else {
            text.text = "停止中";
            obj.removeEventListener(Event.ENTER_FRAME, move);
        }
    }

    setInterval(toggle, 2000);
    toggle();
}

window.addEventListener('load', main, false);
