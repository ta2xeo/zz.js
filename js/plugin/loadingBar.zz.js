/** -*- coding: utf-8 -*-
 * loadingBar.zz.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.2
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";
/**
 * override preload function.
 * show progress bar.
 * e.g.)
 *   zz.preload(['pathToImage'], callback, {width:100, y: 200});
 *
 * @param {String[]} assets
 * @param {Function} callback
 * @param {Object} options
 */
zz.preload = new function() {
    function progressBar(assets, callback, options) {
        var assetsCount = assets.length;

        for (var i = 0; i < assetsCount; ++i) {
            zz.load(assets[i], function() { --assetsCount; });
        }
        var maxAssetsCount = assetsCount;
        var base = (function() {
            var base = new Stage("progress");
            base.style.position = "absolute";
            base.referencePoint = zz.ReferencePoint.CENTER;
            base.x = window.innerWidth / 2;
            base.y = window.innerHeight / 2;
            base.width = 300;
            base.height = 25;
            return base;
        })();

        if (options) {
            for (var prop in options) {
                base[prop] = options[prop];
            }
        }

        var progress = 0;
        var width = base.width - 10;

        function entityBar() {
            var bar = new Sprite();
            bar.x = 5;
            bar.y = 2;
            bar.width = width;
            bar.height = base.height - 10;
            bar.style.borderRadius = "10px";
            bar.canvas.style.borderRadius = "10px";
            bar.style.border = "2px solid #dddddd";
            bar.backgroundColor = "#333333";
            bar.context.beginPath();

            function getGradient() {
                var grad = bar.context.createLinearGradient(0, 0, 0, bar.height);
                grad.addColorStop(0, "#5555aa");
                grad.addColorStop(0.2, "#5566dd");
                grad.addColorStop(0.4, "#6688ff");
                grad.addColorStop(0.5, "#6677ee");
                grad.addColorStop(0.8, "#6666bb");
                grad.addColorStop(1, "#5555aa");
                return grad;
            }

            bar.context.fillStyle = getGradient();
            bar.render = function() {
                bar.context.clearRect(0, 0, width, bar.height);
                bar.context.fillRect(0, 0, progress, bar.height);
            }
            return bar;
        }

        var bar = entityBar();
        base.addChild(bar);
        var wait = 5;  // prevent invisible
        bar.addEventListener(Event.ENTER_FRAME, function() {
            var percent = (maxAssetsCount - assetsCount) * 100 / maxAssetsCount;
            var limit = Math.floor(percent * width / 100);
            progress += 10;
            if (progress >= limit) {
                progress = limit;
                if (percent == 100) {
                    if (--wait == 0) {
                        callback();
                        base.removeChild(bar);
                        base.end();
                    }
                }
            }
        });
    }

    return function(assets, callback, options) {
        if (!(assets instanceof Array)) {
            throw new Error('assets must be array.');
        }
        progressBar(assets, callback, options);
    }
}
