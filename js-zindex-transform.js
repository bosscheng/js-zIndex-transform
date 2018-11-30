/*
* author: wancheng
* date: 11/30/18
* desc:
*/


!(function () {
    var slice = Array.prototype.slice;
    var toString = Object.prototype.toString;

    function noop() {

    }

    //
    var utils = {
        extend: function (target) {

            var args = slice.call(arguments, 1);

            for (var i = 0, len = args.length; i < len; i++) {
                var item = args[i] || {};

                for (var key in item) {
                    if (item.hasOwnProperty(key) && item[key] !== undefined) {
                        target[key] = item[key];
                    }
                }
            }
            return target;
        },

        isArray: function (value) {
            return toString.call(value) === '[object Array]';
        },


        isFunction: function (value) {
            return toString.call(value) === '[object Function]';
        },

        isString: function (value) {
            return toString.call(value) === '[object String]';
        },

        isElement: function (value) {
            return value && value.nodeType === 1;
        },

        loopTarget: function (taregt, func) {
            if (!utils.isArray(taregt)) {
                taregt = [taregt];
            }

            func = utils.isFunction(func) ? func : noop;

            taregt = slice.call(taregt);

            for (; taregt.length;) {

                var item = taregt.shift();

                var result = func(item);

                if (result) {
                    return result;
                }

                if (item.childNodes && item.childNodes.length) {
                    taregt = slice.call(item.childNodes).concat(taregt);
                }
            }
        },
        //
        getInitialTransformMatrix: function (target) {
            var matrix = window.getComputedStyle(target).transform.match(/matrix.*\((.*)\)/);
            var matrixArr = [1, 0, 0, 1, 0, 0];
            var xIndex = 4;
            var yIndex = 5;

            if (matrix && matrix[1]) {
                matrixArr = matrix[1].split(/\s*\,\s*/);
                if (matrixArr.length === 16) {
                    xIndex = 12;
                    yIndex = 13;
                }
            }

            return {
                matrixArr: matrixArr,
                translateXIndex: xIndex,
                translateYIndex: yIndex
            }

        }
    };

    var defaultConfig = {
        layers: [],
        max: 20,
        reverseTitle: false,
        perspective: 1000,
        easing: 'cubic-bezier(.03, .98, .52, .99)',
        sacle: 1,
        speed: 300,
        disabledAxis: '',
        reset: true
    };


    var ZIndexTransform = function (target, config) {
        var self = this;

        if (utils.isString(target)) {
            target = document.querySelector(target);
        }

        if (!utils.isElement(target)) {
            throw new Error('Cannot find target dom to apply hover effects');
        }

        config = utils.extend({}, defaultConfig, config);

        this.target = target;
        this.config = config;
        this.layers = [];
        this.transitionTimeout = null;
        this.width = 0;
        this.height = 0;
        this.left = 0;
        this.top = 0;

        utils.loopTarget(target, function (element) {
            if (utils.isElement(element)) {
                var level = element.getAttribute('data-hover-layer');

                if (level) {
                    var layer = config.layers[parseInt(level, 10)];
                    var multiple = layer.multiple;
                    if (!multiple) {
                        throw new Error("Missing translate config for " + level);
                    }

                    var data = {
                        node: element,
                        multiple: multiple,
                        reverseTranslate: layer.reverseTranslate
                    };
                    self.layers.push(utils.extend({}, data, utils.getInitialTransformMatrix(element)))
                }
            }

        });

        self.target.style.transition = "perspective(" + self.config.perspective + "px)";

        self.addEventHandlers();
    };

    ZIndexTransform.prototype = {
        constructor: ZIndexTransform,

        addEventHandlers: function () {
            this.target.addEventListener('mouseenter', this.onMouseEnter.bind(this), false);
            this.target.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            this.target.addEventListener('mouseleave', this.onMouseLeave.bind(this), false);
        },

        doTranslate: function (layer, xIndex, yInde) {
            var transformA = ["webkitTransform", "msTransform", "mozTransform", "transform"];
            var node = layer.node;
            var matrixArr = layer.matrixArr;
            var translateXIndex = layer.translateXIndex;
            var translateYIndex = layer.translateYIndex;
            matrixArr = slice.call(matrixArr);

            matrixArr[translateXIndex] = parseInt(matrixArr[translateXIndex], 10) + xIndex;
            matrixArr[translateYIndex] = parseInt(matrixArr[translateYIndex], 10) + yInde;

            var newArr = matrixArr.join(', ');

            transformA.forEach(function (transform) {
                node.style[transform] = (matrixArr.length === 6 ? 'matrix' : 'matrix3d') + '(' + newArr + ')';
            })

        },

        translateLayers: function (layer, clientX, clientY) {
            var multiple = layer.multiple;
            var reverseTranslate = layer.reverseTranslate;
            var xIndex = Math.floor(multiple * (0.5 * document.body.clientWidth + (reverseTranslate ? -1 : 1) * clientX));
            var yIndex = Math.floor(multiple * (0.5 * document.body.clientHeight + (reverseTranslate ? -1 : 1) * clientY));
            this.doTranslate(layer, xIndex, yIndex);
        },

        getValues: function (event) {
            var w = (event.pageX - this.left) / this.width;
            var h = (event.pageY - this.top) / this.height;

            w = Math.min(Math.max(w, 0), 1);
            h = Math.min(Math.max(h, 0), 1);
            return {
                tiltX: (this.config.reverseTilt ? -1 : 1) * (this.config.max / 2 - w * this.config.max).toFixed(2),
                tiltY: (this.config.reverseTilt ? -1 : 1) * (h * this.config.max - this.config.max / 2).toFixed(2)
            }
        },

        setTransition: function () {
            var self = this;

            clearTimeout(this.transitionTimeout);
            this.target.style.transition = this.config.speed + 'ms ' + this.config.easing;

            this.transitionTimeout = setTimeout(function () {
                self.target.style.transition = '';
            }, this.config.speed);
        },

        onMouseEnter: function (event) {
            var self = this;

            this.width = this.target.offsetWidth;
            this.height = this.target.offsetHeight;
            this.left = this.target.offsetLeft;
            this.top = this.target.offsetTop;

            this.setTransition();

            this.layers.forEach(function (layer) {
                layer.node.style.transition = self.config.speed + 'ms ' + self.config.easing;

                self.translateLayers(layer, event.clientX, event.clientY);
            });

            setTimeout(function () {
                self.layers.forEach(function (layer) {
                    layer.node.style.transition = 'none';
                })
            }, self.config.speed);

        },

        onMouseMove: function (event) {
            var self = this;
            var values = this.getValues(event);

            self.target.style.transform = 'perspective(' + self.config.perspective + 'px) ' +
                'rotateX(' + (self.config.disabledAxis === 'x' ? 0 : values.tiltX) + 'deg) ' +
                'rotateY(' + (self.config.disabledAxis === 'y' ? 0 : values.tiltY) + 'deg) ' +
                'scale3d(' + self.config.sacle + ', ' + self.config.scale + ', ' + self.config.sacle + ')';

            window.requestAnimationFrame(function (time) {
                self.layers.forEach(function (layer) {
                    self.translateLayers(layer, event.clientX, event.clientY)
                })
            })
        },

        onMouseLeave: function (event) {
            var self = this;
            if (this.config.reset) {
                this.setTransition();
            }

            this.target.style.transform = 'perspective(' + this.config.perspective + 'px) rotateX(0deg); rotateY(0deg);scale3d(1, 1, 1)';

            this.layers.forEach(function (layer) {
                layer.node.style.transition = self.config.speed + 'ms ' + self.config.easing;
                self.doTranslate(layer, 0, 0);
            })
        }
    }


    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function () {
            return ZIndexTransform;
        });
        // NodeJS
    } else if (typeof exports !== 'undefined') {
        module.exports = ZIndexTransform;
    } else {
        // browser
        window.ZIndexTransform = ZIndexTransform;
    }
})();
