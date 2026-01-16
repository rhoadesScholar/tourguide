import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { AxesLineHelper } from '../axes_lines';
import { makeRenderedPanelVisibleLayerTracker, VisibilityTrackedRenderLayer } from '../layer';
import { PickIDManager } from '../object_picking';
import { RenderedDataPanel } from '../rendered_data_panel';
import { SliceViewRenderHelper } from './frontend';
import { registerActionListener } from '../util/event_action_map';
import { identityMat4, mat4, vec3, vec4 } from '../util/geom';
import { startRelativeMouseDrag } from '../util/mouse_drag';
import { FramebufferConfiguration, OffscreenCopyHelper, TextureBuffer } from '../webgl/offscreen';
import { ScaleBarTexture } from '../widget/scale_bar';
export var OffscreenTextures;
(function (OffscreenTextures) {
    OffscreenTextures[OffscreenTextures["COLOR"] = 0] = "COLOR";
    OffscreenTextures[OffscreenTextures["PICK"] = 1] = "PICK";
    OffscreenTextures[OffscreenTextures["NUM_TEXTURES"] = 2] = "NUM_TEXTURES";
})(OffscreenTextures || (OffscreenTextures = {}));
function sliceViewPanelEmitColor(builder) {
    builder.addOutputBuffer('vec4', 'out_fragColor', null);
    builder.addFragmentCode('\nvoid emit(vec4 color, highp uint pickId) {\n  out_fragColor = color;\n}\n');
}
function sliceViewPanelEmitPickID(builder) {
    builder.addOutputBuffer('highp float', 'out_pickId', null);
    builder.addFragmentCode('\nvoid emit(vec4 color, highp uint pickId) {\n  out_pickId = float(pickId);\n}\n');
}
export var SliceViewPanelRenderLayer = function (_VisibilityTrackedRen) {
    _inherits(SliceViewPanelRenderLayer, _VisibilityTrackedRen);

    function SliceViewPanelRenderLayer() {
        _classCallCheck(this, SliceViewPanelRenderLayer);

        return _possibleConstructorReturn(this, (SliceViewPanelRenderLayer.__proto__ || _Object$getPrototypeOf(SliceViewPanelRenderLayer)).apply(this, arguments));
    }

    _createClass(SliceViewPanelRenderLayer, [{
        key: 'draw',
        value: function draw(_renderContext) {
            // Must be overridden by subclasses.
        }
    }, {
        key: 'isReady',
        value: function isReady() {
            return true;
        }
    }]);

    return SliceViewPanelRenderLayer;
}(VisibilityTrackedRenderLayer);
var tempVec4 = vec4.create();
export var SliceViewPanel = function (_RenderedDataPanel) {
    _inherits(SliceViewPanel, _RenderedDataPanel);

    function SliceViewPanel(context, element, sliceView, viewer) {
        _classCallCheck(this, SliceViewPanel);

        var _this2 = _possibleConstructorReturn(this, (SliceViewPanel.__proto__ || _Object$getPrototypeOf(SliceViewPanel)).call(this, context, element, viewer));

        _this2.sliceView = sliceView;
        _this2.axesLineHelper = _this2.registerDisposer(AxesLineHelper.get(_this2.gl));
        _this2.sliceViewRenderHelper = _this2.registerDisposer(SliceViewRenderHelper.get(_this2.gl, sliceViewPanelEmitColor));
        _this2.colorFactor = vec4.fromValues(1, 1, 1, 1);
        _this2.pickIDs = new PickIDManager();
        _this2.visibleLayerTracker = makeRenderedPanelVisibleLayerTracker(_this2.viewer.layerManager, SliceViewPanelRenderLayer, _this2.viewer.visibleLayerRoles, _this2);
        _this2.offscreenFramebuffer = _this2.registerDisposer(new FramebufferConfiguration(_this2.gl, {
            colorBuffers: [new TextureBuffer(_this2.gl, WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE), new TextureBuffer(_this2.gl, WebGL2RenderingContext.R32F, WebGL2RenderingContext.RED, WebGL2RenderingContext.FLOAT)]
        }));
        _this2.offscreenCopyHelper = _this2.registerDisposer(OffscreenCopyHelper.get(_this2.gl));
        _this2.scaleBarCopyHelper = _this2.registerDisposer(OffscreenCopyHelper.get(_this2.gl));
        _this2.scaleBarTexture = _this2.registerDisposer(new ScaleBarTexture(_this2.gl));
        registerActionListener(element, 'rotate-via-mouse-drag', function (e) {
            var mouseState = _this2.viewer.mouseState;

            if (mouseState.updateUnconditionally()) {
                var initialPosition = vec3.clone(mouseState.position);
                startRelativeMouseDrag(e.detail, function (_event, deltaX, deltaY) {
                    var viewportAxes = _this2.sliceView.viewportAxes;

                    _this2.viewer.navigationState.pose.rotateAbsolute(viewportAxes[1], -deltaX / 4.0 * Math.PI / 180.0, initialPosition);
                    _this2.viewer.navigationState.pose.rotateAbsolute(viewportAxes[0], -deltaY / 4.0 * Math.PI / 180.0, initialPosition);
                });
            }
        });
        registerActionListener(element, 'rotate-in-plane-via-touchrotate', function (e) {
            var detail = e.detail;
            var mouseState = _this2.viewer.mouseState;

            _this2.handleMouseMove(detail.centerX, detail.centerY);
            if (mouseState.updateUnconditionally()) {
                var viewportAxes = _this2.sliceView.viewportAxes;

                _this2.navigationState.pose.rotateAbsolute(viewportAxes[2], detail.angle - detail.prevAngle, mouseState.position);
            }
        });
        _this2.registerDisposer(sliceView);
        _this2.registerDisposer(viewer.crossSectionBackgroundColor.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(sliceView.visibility.add(_this2.visibility));
        _this2.registerDisposer(sliceView.viewChanged.add(function () {
            if (_this2.visible) {
                context.scheduleRedraw();
            }
        }));
        _this2.registerDisposer(viewer.showAxisLines.changed.add(function () {
            if (_this2.visible) {
                _this2.scheduleRedraw();
            }
        }));
        _this2.registerDisposer(viewer.showScaleBar.changed.add(function () {
            if (_this2.visible) {
                _this2.context.scheduleRedraw();
            }
        }));
        _this2.registerDisposer(viewer.scaleBarOptions.changed.add(function () {
            if (_this2.visible) {
                _this2.context.scheduleRedraw();
            }
        }));
        return _this2;
    }

    _createClass(SliceViewPanel, [{
        key: 'translateByViewportPixels',
        value: function translateByViewportPixels(deltaX, deltaY) {
            var position = this.viewer.navigationState.position;

            var pos = position.spatialCoordinates;
            vec3.set(pos, -deltaX, -deltaY, 0);
            vec3.transformMat4(pos, pos, this.sliceView.viewportToData);
            position.changed.dispatch();
        }
    }, {
        key: 'translateDataPointByViewportPixels',
        value: function translateDataPointByViewportPixels(out, orig, deltaX, deltaY) {
            vec3.transformMat4(out, orig, this.sliceView.dataToViewport);
            vec3.set(out, out[0] + deltaX, out[1] + deltaY, out[2]);
            vec3.transformMat4(out, out, this.sliceView.viewportToData);
            return out;
        }
    }, {
        key: 'isReady',
        value: function isReady() {
            if (!this.visible) {
                return false;
            }
            if (!this.sliceView.isReady()) {
                return false;
            }
            var visibleLayers = this.visibleLayerTracker.getVisibleLayers();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(visibleLayers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var renderLayer = _step.value;

                    if (!renderLayer.isReady()) {
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
    }, {
        key: 'drawWithPicking',
        value: function drawWithPicking(pickingData) {
            var sliceView = this.sliceView;

            sliceView.setViewportSize(this.width, this.height);
            sliceView.updateRendering();
            if (!sliceView.hasValidViewport) {
                return false;
            }
            mat4.copy(pickingData.invTransform, sliceView.viewportToData);
            var gl = this.gl;
            var width = sliceView.width,
                height = sliceView.height,
                dataToDevice = sliceView.dataToDevice;

            this.offscreenFramebuffer.bind(width, height);
            gl.disable(WebGL2RenderingContext.SCISSOR_TEST);
            this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
            // Draw axes lines.
            // FIXME: avoid use of temporary matrix
            var mat = mat4.create();
            var backgroundColor = tempVec4;
            var crossSectionBackgroundColor = this.viewer.crossSectionBackgroundColor.value;
            backgroundColor[0] = crossSectionBackgroundColor[0];
            backgroundColor[1] = crossSectionBackgroundColor[1];
            backgroundColor[2] = crossSectionBackgroundColor[2];
            backgroundColor[3] = 1;
            this.offscreenFramebuffer.bindSingle(OffscreenTextures.COLOR);
            this.sliceViewRenderHelper.draw(sliceView.offscreenFramebuffer.colorBuffers[0].texture, identityMat4, this.colorFactor, backgroundColor, 0, 0, 1, 1);
            var visibleLayers = this.visibleLayerTracker.getVisibleLayers();
            var pickIDs = this.pickIDs;

            pickIDs.clear();
            var renderContext = {
                dataToDevice: sliceView.dataToDevice,
                pickIDs: pickIDs,
                emitter: sliceViewPanelEmitColor,
                emitColor: true,
                emitPickID: false,
                viewportWidth: width,
                viewportHeight: height,
                sliceView: sliceView
            };
            gl.enable(WebGL2RenderingContext.BLEND);
            gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(visibleLayers), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var renderLayer = _step2.value;

                    renderLayer.draw(renderContext);
                }
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

            gl.disable(WebGL2RenderingContext.BLEND);
            this.offscreenFramebuffer.bindSingle(OffscreenTextures.PICK);
            renderContext.emitColor = false;
            renderContext.emitPickID = true;
            renderContext.emitter = sliceViewPanelEmitPickID;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(visibleLayers), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _renderLayer = _step3.value;

                    _renderLayer.draw(renderContext);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            if (this.viewer.showAxisLines.value || this.viewer.showScaleBar.value) {
                if (this.viewer.showAxisLines.value) {
                    // Construct matrix that maps [-1, +1] x/y range to the full viewport data
                    // coordinates.
                    mat4.copy(mat, dataToDevice);
                    for (var i = 0; i < 3; ++i) {
                        mat[12 + i] = 0;
                    }
                    for (var _i = 0; _i < 4; ++_i) {
                        mat[2 + 4 * _i] = 0;
                    }
                    var axisLength = Math.min(width, height) / 4 * 1.5;
                    var pixelSize = sliceView.pixelSize;
                    for (var _i2 = 0; _i2 < 12; ++_i2) {
                        // pixelSize is nm / pixel
                        //
                        mat[_i2] *= axisLength * pixelSize;
                    }
                }
                this.offscreenFramebuffer.bindSingle(OffscreenTextures.COLOR);
                if (this.viewer.showAxisLines.value) {
                    this.axesLineHelper.draw(mat);
                }
                if (this.viewer.showScaleBar.value) {
                    gl.enable(WebGL2RenderingContext.BLEND);
                    gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
                    var options = this.viewer.scaleBarOptions.value;
                    var scaleBarTexture = this.scaleBarTexture;
                    var dimensions = scaleBarTexture.dimensions;

                    dimensions.targetLengthInPixels = Math.min(options.maxWidthFraction * width, options.maxWidthInPixels * options.scaleFactor);
                    dimensions.nanometersPerPixel = sliceView.pixelSize;
                    scaleBarTexture.update(options);
                    gl.viewport(options.leftPixelOffset * options.scaleFactor, options.bottomPixelOffset * options.scaleFactor, scaleBarTexture.width, scaleBarTexture.height);
                    this.scaleBarCopyHelper.draw(scaleBarTexture.texture);
                    gl.disable(WebGL2RenderingContext.BLEND);
                }
            }
            this.offscreenFramebuffer.unbind();
            // Draw the texture over the whole viewport.
            this.setGLViewport();
            this.offscreenCopyHelper.draw(this.offscreenFramebuffer.colorBuffers[OffscreenTextures.COLOR].texture);
            return true;
        }
    }, {
        key: 'panelSizeChanged',
        value: function panelSizeChanged() {
            this.sliceView.setViewportSizeDebounced(this.width, this.height);
        }
    }, {
        key: 'issuePickRequest',
        value: function issuePickRequest(glWindowX, glWindowY) {
            var offscreenFramebuffer = this.offscreenFramebuffer;

            offscreenFramebuffer.readPixelFloat32IntoBuffer(OffscreenTextures.PICK, glWindowX, glWindowY, 0);
        }
    }, {
        key: 'completePickRequest',
        value: function completePickRequest(glWindowX, glWindowY, data, pickingData) {
            var mouseState = this.viewer.mouseState;

            mouseState.pickedRenderLayer = null;
            var out = mouseState.position;
            var viewportWidth = pickingData.viewportWidth,
                viewportHeight = pickingData.viewportHeight;

            var y = pickingData.viewportHeight - glWindowY;
            vec3.set(out, glWindowX - viewportWidth / 2, y - viewportHeight / 2, 0);
            vec3.transformMat4(out, out, pickingData.invTransform);
            this.pickIDs.setMouseState(mouseState, data[0]);
            mouseState.setActive(true);
        }
        /**
         * Zooms by the specified factor, maintaining the data position that projects to the current mouse
         * position.
         */

    }, {
        key: 'zoomByMouse',
        value: function zoomByMouse(factor) {
            var navigationState = this.navigationState;

            if (!navigationState.valid) {
                return;
            }
            var sliceView = this.sliceView;
            var width = sliceView.width,
                height = sliceView.height;
            var mouseX = this.mouseX,
                mouseY = this.mouseY;

            mouseX -= width / 2;
            mouseY -= height / 2;
            var oldZoom = this.navigationState.zoomFactor.value;
            // oldPosition + (mouseX * viewportAxes[0] + mouseY * viewportAxes[1]) * oldZoom
            //     === newPosition + (mouseX * viewportAxes[0] + mouseY * viewportAxes[1]) * newZoom
            // Therefore, we compute newPosition by:
            // newPosition = oldPosition + (viewportAxes[0] * mouseX +
            //                              viewportAxes[1] * mouseY) * (oldZoom - newZoom).
            navigationState.zoomBy(factor);
            var newZoom = navigationState.zoomFactor.value;
            var spatialCoordinates = navigationState.position.spatialCoordinates;

            vec3.scaleAndAdd(spatialCoordinates, spatialCoordinates, sliceView.viewportAxes[0], mouseX * (oldZoom - newZoom));
            vec3.scaleAndAdd(spatialCoordinates, spatialCoordinates, sliceView.viewportAxes[1], mouseY * (oldZoom - newZoom));
            navigationState.position.changed.dispatch();
        }
    }, {
        key: 'navigationState',
        get: function get() {
            return this.sliceView.navigationState;
        }
    }]);

    return SliceViewPanel;
}(RenderedDataPanel);
//# sourceMappingURL=panel.js.map