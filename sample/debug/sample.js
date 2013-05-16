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

    var container = new DisplayObjectContainer();
    for (var i = 0; i < 10; i++) {
        var mc = new MovieClip(ROOT_PATH + "img/hoge1.png");
        mc.setPosition(50 * i, 50 * i);
        container.addChild(mc);
    }

    root.addChild(container);
}

window.addEventListener('load', main, false);
