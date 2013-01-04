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

    var textArea = new TextArea(500, 140);
    textArea.setPosition(root.width / 2, 100);
    textArea.referencePoint = ReferencePoint.TOP | ReferencePoint.CENTER;

    var namePlate = new NamePlate(100, 40);
    namePlate.setPosition(70, 50);

    var controller = new ADVController(textArea, namePlate);
    namePlate.nameColors = {
        "ツチヤ": "#f00",
        "Tsuchiya": "#0f0"
    };
    var data = [
        {
            name: "ツチヤ",
            text: "これはサンプルのテキストです。ルールにそってオブジェクトに文字列を入れることで表示することができます。"
        },
        {
            name: "つちや",
            text: "nameColorsに指定されていない色はデフォルトの色になります。"
        },
        {
            name: "Tsuchiya",
            text: "牛丼＋卵が好きです。"
        }
    ];

    var whiteOut = new MovieClip();
    whiteOut.width = root.width;
    whiteOut.height = root.height;
    whiteOut.backgroundColor = "#fff";
    whiteOut.visible = false;
    whiteOut.setAnimation({
        1: {alpha: 0, visible: true, tween: true},
        50: {alpha: 1, tween: true, event: "half"},
        100: {alpha: 0, tween: true, stop: true, event: "end"}
    });

    function nextScene() {
        root.addChild(whiteOut);
        controller.setData([
            {
                name: "ツチヤ",
                text: "次のシーンに移りました。"
            },
            {
                name: "つちや",
                text: "サンプルはここまで。"
            }
        ]);
        whiteOut.gotoAndPlay(1);
        whiteOut.addEventListener("end", function() {
            controller.read();
            root.addEventListener(TouchEvent.TOUCH_DOWN, function() {
                controller.read();
            });
        });
        whiteOut.addEventListener("half", function() {
            controller.erase();
        });
        root.cleanEventListener(TouchEvent.TOUCH_DOWN);
    }

    controller.setData(data, nextScene);
    root.addEventListener(TouchEvent.TOUCH_DOWN, function() {
        controller.read();
    });

    root.addChild(textArea);
    root.addChild(namePlate);
}

function start() {
    zz.importModules([
        "/js/plugin/zz.adv.js"
    ], main);
}

window.addEventListener('load', start, false);
