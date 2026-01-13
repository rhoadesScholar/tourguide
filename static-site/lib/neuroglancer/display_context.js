import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2016 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { RefCounted } from './util/disposable';
import { NullarySignal } from './util/signal';
import { initializeWebGL } from './webgl/context';
import ResizeObserver from 'resize-observer-polyfill';
export var RenderedPanel = function (_RefCounted) {
    _inherits(RenderedPanel, _RefCounted);

    function RenderedPanel(context, element, visibility) {
        _classCallCheck(this, RenderedPanel);

        var _this = _possibleConstructorReturn(this, (RenderedPanel.__proto__ || _Object$getPrototypeOf(RenderedPanel)).call(this));

        _this.context = context;
        _this.element = element;
        _this.visibility = visibility;
        _this.gl = context.gl;
        context.addPanel(_this);
        return _this;
    }

    _createClass(RenderedPanel, [{
        key: 'scheduleRedraw',
        value: function scheduleRedraw() {
            if (this.visible) {
                this.context.scheduleRedraw();
            }
        }
    }, {
        key: 'setGLViewport',
        value: function setGLViewport() {
            var element = this.element;
            var clientRect = element.getBoundingClientRect();
            var canvasRect = this.context.canvasRect;
            var scaleX = canvasRect.width / this.context.canvas.width;
            var scaleY = canvasRect.height / this.context.canvas.height;
            var left = (element.clientLeft + clientRect.left - canvasRect.left) * scaleX;
            var width = element.clientWidth;
            var top = (clientRect.top - canvasRect.top + element.clientTop) * scaleY;
            var height = element.clientHeight;
            var bottom = top + height;
            var gl = this.gl;
            gl.enable(gl.SCISSOR_TEST);
            var glBottom = this.context.canvas.height - bottom;
            gl.viewport(left, glBottom, width, height);
            gl.scissor(left, glBottom, width, height);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.context.removePanel(this);
            _get(RenderedPanel.prototype.__proto__ || _Object$getPrototypeOf(RenderedPanel.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'visible',
        get: function get() {
            return this.visibility.visible;
        }
    }]);

    return RenderedPanel;
}(RefCounted);
export var DisplayContext = function (_RefCounted2) {
    _inherits(DisplayContext, _RefCounted2);

    function DisplayContext(container) {
        _classCallCheck(this, DisplayContext);

        var _this2 = _possibleConstructorReturn(this, (DisplayContext.__proto__ || _Object$getPrototypeOf(DisplayContext)).call(this));

        _this2.container = container;
        _this2.canvas = document.createElement('canvas');
        _this2.updateStarted = new NullarySignal();
        _this2.updateFinished = new NullarySignal();
        _this2.changed = _this2.updateFinished;
        _this2.panels = new _Set();
        _this2.updatePending = null;
        /**
         * Unique number of the next frame.  Incremented once each time a frame is drawn.
         */
        _this2.frameNumber = 0;
        _this2.resizeObserver = new ResizeObserver(function () {
            return _this2.scheduleRedraw();
        });
        var canvas = _this2.canvas,
            resizeObserver = _this2.resizeObserver;

        container.style.position = 'relative';
        canvas.style.position = 'absolute';
        canvas.style.top = '0px';
        canvas.style.left = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        resizeObserver.observe(canvas);
        container.appendChild(canvas);
        _this2.gl = initializeWebGL(canvas);
        return _this2;
    }

    _createClass(DisplayContext, [{
        key: 'isReady',
        value: function isReady() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.panels), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var panel = _step.value;

                    if (!panel.visible) {
                        continue;
                    }
                    if (!panel.isReady()) {
                        return false;
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return true;
        }
        /**
         * Returns a child element that overlays the canvas.
         */

    }, {
        key: 'makeCanvasOverlayElement',
        value: function makeCanvasOverlayElement() {
            var element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = '0px';
            element.style.left = '0px';
            element.style.width = '100%';
            element.style.height = '100%';
            element.style.zIndex = '2';
            this.container.appendChild(element);
            return element;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.resizeObserver.disconnect();
            if (this.updatePending != null) {
                cancelAnimationFrame(this.updatePending);
                this.updatePending = null;
            }
        }
    }, {
        key: 'addPanel',
        value: function addPanel(panel) {
            this.panels.add(panel);
            this.resizeObserver.observe(panel.element);
            this.scheduleRedraw();
        }
    }, {
        key: 'removePanel',
        value: function removePanel(panel) {
            this.resizeObserver.unobserve(panel.element);
            this.panels.delete(panel);
            panel.dispose();
            this.scheduleRedraw();
        }
    }, {
        key: 'scheduleRedraw',
        value: function scheduleRedraw() {
            if (this.updatePending === null) {
                this.updatePending = requestAnimationFrame(this.update.bind(this));
            }
        }
    }, {
        key: 'draw',
        value: function draw() {
            ++this.frameNumber;
            this.updateStarted.dispatch();
            var gl = this.gl;
            var canvas = this.canvas;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            this.canvasRect = canvas.getBoundingClientRect();
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.panels), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var panel = _step2.value;
                    var element = panel.element;

                    if (!panel.visible || element.clientWidth === 0 || element.clientHeight === 0 || element.offsetWidth === 0 || element.offsetHeight === 0) {
                        // Skip drawing if the panel has zero client area.
                        continue;
                    }
                    panel.setGLViewport();
                    panel.draw();
                }
                // Ensure the alpha buffer is set to 1.
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            gl.disable(gl.SCISSOR_TEST);
            this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
            this.gl.colorMask(false, false, false, true);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.gl.colorMask(true, true, true, true);
            this.updateFinished.dispatch();
        }
    }, {
        key: 'update',
        value: function update() {
            this.updatePending = null;
            this.draw();
        }
    }]);

    return DisplayContext;
}(RefCounted);
//# sourceMappingURL=display_context.js.map