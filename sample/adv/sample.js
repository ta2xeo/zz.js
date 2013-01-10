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
    controller.y = 180;
    controller.setUIPosition([70, 50],
                             [root.width / 2, 100],
                             [textArea.x, 0]
                            );
    namePlate.nameColors = {
        "ツチヤ": "#f00",
        "Tsuchiya": "#0f0"
    };
    var data = [
        {
            name: "ツチヤ",
            text: 'これはサンプルのテキストです。<br />このテキストは<span style="color:#f00;">HTMLタグ</span>が使用できます。',
            image: {
                path: "/img/hoge1.png",
                x: -50,
                y: 0,
                active: true,
            }
        },
        {
            name: "つちや",
            text: "nameColorsに指定されていない色はデフォルトの色になります。",
            image: [
                {
                    path: "/img/hoge1.png",
                    x: -50,
                    y: 0,
                    active: false
                },
                {
                    path: "/img/hoge2.png",
                    x: 150,
                    y: 0,
                    active: true
                }
            ]
        },
        {
            name: "Tsuchiya",
            text: "こんな<ruby>感<rp>(</rp><rt>かん</rt><rp>)</rp></ruby>じでルビもふれます。<br />ただし、ブラウザが<ruby>対応<rp>(</rp><rt>たいおう</rt><rp>)</rp></ruby>している<ruby>必要<rp>(</rp><rt>ひつよう</rt><rp>)</rp></ruby>があります。"
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
            textArea.addEventListener(TouchEvent.TOUCH_DOWN, function() {
                controller.read();
            });
            whiteOut.removeSelf();
        });
        whiteOut.addEventListener("half", function() {
            controller.erase();
        });
        textArea.cleanEventListener(TouchEvent.TOUCH_DOWN);
    }

    controller.setData(data, nextScene);
    controller.preloadImages();
    textArea.addEventListener(TouchEvent.TOUCH_DOWN, function() {
        controller.read();
    });

    root.addChild(controller);
}

function start() {
    zz.importModules([
        "/js/module/zz.adv.js"
    ], main);
}

window.addEventListener('load', start, false);
