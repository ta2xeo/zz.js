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

    var anim = new SpriteAnimation();
    var images = [
        ROOT_PATH + "img/hoge1.png",
        ROOT_PATH + "img/hoge2.png",
        ROOT_PATH + "img/hoge3.png"
    ];
    anim.setAnimationInterval(15);
    anim.loadAnimation(images);
    root.addChild(anim);
}

window.addEventListener('load', main, false);
