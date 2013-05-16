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

    var container = new DisplayObjectContainer();
    container.setPosition(100, 100);
    container.backgroundColor = "#ddd";
    container.setSize(300, 100);
    container.addEventListener(TouchEvent.TOUCH_DOWN, function() {
        zz.net.location(URL);
    });

    var t = new TextField("クリックするとページ移動します");
    t.referencePoint = ReferencePoint.CENTER;
    t.setPosition(150, 50);
    container.addChild(t);

    root.addChild(container);
}

window.addEventListener('load', main, false);
