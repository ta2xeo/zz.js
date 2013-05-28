/** -*- coding: utf-8 -*-
 * sample.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";

function main() {
    zz.globalize();

    var root = new Stage("stage");

    var colors = ["red", "blue", "orange", "green", "black"];
    var easing = [Back.easeInOut,
                  Bounce.easeInOut,
                  Circular.easeInOut,
                  Cubic.easeInOut,
                  Elastic.easeInOut];
    for (var i = 0; i < 5; i++) {
        var o = new DisplayObject();
        o.setSize(50, 50);
        o.setPosition(100, i * 100 + 100);
        o.backgroundColor = colors[i];
        root.addChild(o);
        var tw = new Tween(o, "x", easing[i], 100, 500, 3, true);
        tw.looping = true;
        tw.start();
    }
}

window.addEventListener('load', main, false);
