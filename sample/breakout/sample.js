/** -*- coding: utf-8 -*-
 * sample.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 * 色々と手抜きでバグってますがあくまでサンプルということで。
 */
"use strict";

var ROOT_PATH = "../../";

function main() {
    zz.globalize();

    var root = new Stage("stage");

    var touchSpace = new DisplayObject();
    touchSpace.backgroundColor = "#999999";
    touchSpace.y = 480;
    touchSpace.setSize(640, 480);
    root.addChild(touchSpace);

    // bar object
    var bar = new DisplayObject();
    bar.backgroundColor = "#00f";
    bar.setSize(150, 20);
    bar.setPosition(200, 400);
    var offsetX = 0;
    var isTouch = false;
    function moveBar(event) {
        if (isTouch) {
            var x = event.x + offsetX;
            bar.x = x;
            if (!isMove) {
                ball.x = bar.x + bar.width / 2;
            }
        }
    }
    function barHitCheck() {
        if ((ball.x + ball.width > bar.x) &&
            (ball.x < bar.x + bar.width) &&
            (ball.y + ball.height > bar.y) &&
            (ball.y < bar.y + bar.height)) {
            moveY = -moveY;
        }
    }
    root.addEventListener(Event.ENTER_FRAME, barHitCheck);

    // ball object
    var ball = new DisplayObject();
    ball.setSize(20, 20);
    ball.setPosition(bar.x + bar.width / 2, bar.y - bar.height);
    ball.backgroundColor = "#f00";

    function wallHitCheck() {
        if (ball.x + ball.width > root.width || ball.x < 0) {
            moveX = -moveX;
        }
        if (ball.y < 0) {
            moveY = -moveY;
        }
        if (ball.y + ball.height > 480) {
            // out of stage
            isMove = false;
            isTouch = false;
            message.visible = true;
            ball.x = bar.x + bar.width / 2;
            ball.y = bar.y - bar.height;
        }
    }
    root.addEventListener(Event.ENTER_FRAME, wallHitCheck);

    var speed = 5;
    var moveX = speed, moveY = -speed, isMove = false;
    function ballMove() {
        if (isMove) {
            ball.x += moveX;
            ball.y += moveY;
        }
    }
    ball.addEventListener(Event.ENTER_FRAME, ballMove);

    // block object
    var Block = function(x, y) {
        var box = new MovieClip();
        box.setSize(100, 20);
        box.setPosition(x, y);
        var colors = ["#0ff", "#0f0", "#ff0", "#f0f"];
        box.setAnimation({
            1: {label: "lv1", backgroundColor: colors[0], stop: true},
            2: {label: "lv2", backgroundColor: colors[1], stop: true},
            3: {label: "lv3", backgroundColor: colors[2], stop: true},
            4: {label: "lv4", backgroundColor: colors[3], stop: true},
            5: {label: "delete", visible: false, stop: true, event: "destroy"},
        });
        box.hitCheck = function() {
            if ((ball.x + ball.width > box.x) &&
                (ball.x < box.x + box.width) &&
                (ball.y + ball.height > box.y) &&
                (ball.y < box.y + box.height)) {
                moveY = -moveY;
                box.play();
            }
        }
        box.addEventListener("destroy", function() {
            box.removeSelf();
        });
        return box;
    }
    var blockContainer = new DisplayObjectContainer();

    for (var i = 0; i < 5; i++) {
        var y = i * 20 + (i + 1) * 10;
        for (var j = 0; j < 5; j++) {
            var x = j * 100 + (j + 5) * 10;
            var _b = new Block(x, y);
            blockContainer.addChild(_b);
        }
    }

    // 押した時
    root.addEventListener(TouchEvent.TOUCH_DOWN, function(event) {
        offsetX = bar.x - event.x;
        isTouch = true;
    });
    root.addEventListener(TouchEvent.TOUCH_MOVE, moveBar);

    // 離した時
    root.addEventListener(TouchEvent.TOUCH_UP, function() {
        if (!isMove) {
            isMove = true;
        }
        isTouch = false;
    });

    root.addChild(blockContainer);
    root.addChild(ball);
    root.addChild(bar);

    var msgTxt = new TextField();
    var message = new MovieClip();
    msgTxt.visible = false;
    message.setSize(300, 200);
    message.addChild(msgTxt);
    root.addChild(message);

    var fmt = new TextFormat();
    fmt.bold = true;
    fmt.font = "Impact";
    fmt.color = "#fff"
    fmt.size = 30;
    msgTxt.defaultTextFormat = fmt;
    msgTxt.referencePoint = ReferencePoint.CENTER;
    msgTxt.setPosition(root.width / 2, 300);
    msgTxt.text = "touch screen";
    msgTxt.visible = true;
    msgTxt.textColor = "#fff";
    message.setAnimation({
        1: {alpha: 1, tween: true},
        30: {alpha: 0, tween: true},
        60: {alpha: 1, tween: true},
    });

    function detectCollision() {
        var clear = true;
        for (var i = 0, len = blockContainer.numChildren; i < len; i++) {
            var b = blockContainer.getChildAt(i);
            b.hitCheck();
            clear = false;
        }
        if (clear) {
            root.pause();
            root.removeEventListener(Event.ENTER_FRAME, detectCollision);
            alert("congratulation");
        }
    }
    root.addEventListener(Event.ENTER_FRAME, detectCollision);

    root.addEventListener(TouchEvent.TOUCH_DOWN, function() {
        message.visible = false;
    });

    var fps = new FPS();
    root.addChild(fps);
}

window.addEventListener('load', main, false);
