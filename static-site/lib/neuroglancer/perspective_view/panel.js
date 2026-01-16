import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import throttle from 'lodash/throttle';
import { AxesLineHelper } from '../axes_lines';
import { makeRenderedPanelVisibleLayerTracker } from '../layer';
import { PERSPECTIVE_VIEW_ADD_LAYER_RPC_ID, PERSPECTIVE_VIEW_REMOVE_LAYER_RPC_ID, PERSPECTIVE_VIEW_RPC_ID, PERSPECTIVE_VIEW_UPDATE_VIEWPORT_RPC_ID } from './base';
import { PerspectiveViewRenderLayer } from './render_layer';
import { clearOutOfBoundsPickData, pickDiameter, pickOffsetSequence, pickRadius, RenderedDataPanel } from '../rendered_data_panel';
import { SliceViewRenderHelper } from '../sliceview/frontend';
import { TrackableBooleanCheckbox } from '../trackable_boolean';
import { registerActionListener } from '../util/event_action_map';
import { kAxes, mat4, transformVectorByMat4, vec3, vec4 } from '../util/geom';
import { startRelativeMouseDrag } from '../util/mouse_drag';
import { WatchableMap } from '../util/watchable_map';
import { withSharedVisibility } from '../visibility_priority/frontend';
import { DepthBuffer, FramebufferConfiguration, makeTextureBuffers, OffscreenCopyHelper, TextureBuffer } from '../webgl/offscreen';
import { ScaleBarTexture } from '../widget/scale_bar';
import { SharedObject } from '../worker_rpc';

export var OffscreenTextures;
(function (OffscreenTextures) {
    OffscreenTextures[OffscreenTextures["COLOR"] = 0] = "COLOR";
    OffscreenTextures[OffscreenTextures["Z"] = 1] = "Z";
    OffscreenTextures[OffscreenTextures["PICK"] = 2] = "PICK";
    OffscreenTextures[OffscreenTextures["NUM_TEXTURES"] = 3] = "NUM_TEXTURES";
})(OffscreenTextures || (OffscreenTextures = {}));
export var glsl_perspectivePanelEmit = '\nvoid emit(vec4 color, highp uint pickId) {\n  out_color = color;\n  out_z = 1.0 - gl_FragCoord.z;\n  out_pickId = float(pickId);\n}\n';
/**
 * http://jcgt.org/published/0002/02/09/paper.pdf
 * http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html
 */
export var glsl_computeOITWeight = '\nfloat computeOITWeight(float alpha) {\n  float a = min(1.0, alpha) * 8.0 + 0.01;\n  float b = -gl_FragCoord.z * 0.95 + 1.0;\n  return a * a * a * b * b * b;\n}\n';
// Color must be premultiplied by alpha.
export var glsl_perspectivePanelEmitOIT = [glsl_computeOITWeight, '\nvoid emit(vec4 color, highp uint pickId) {\n  float weight = computeOITWeight(color.a);\n  vec4 accum = color * weight;\n  v4f_fragData0 = vec4(accum.rgb, color.a);\n  v4f_fragData1 = vec4(accum.a, 0.0, 0.0, 0.0);\n}\n'];
export function perspectivePanelEmit(builder) {
    builder.addOutputBuffer('vec4', 'out_color', OffscreenTextures.COLOR);
    builder.addOutputBuffer('highp float', 'out_z', OffscreenTextures.Z);
    builder.addOutputBuffer('highp float', 'out_pickId', OffscreenTextures.PICK);
    builder.addFragmentCode(glsl_perspectivePanelEmit);
}
export function perspectivePanelEmitOIT(builder) {
    builder.addOutputBuffer('vec4', 'v4f_fragData0', 0);
    builder.addOutputBuffer('vec4', 'v4f_fragData1', 1);
    builder.addFragmentCode(glsl_perspectivePanelEmitOIT);
}
var tempVec3 = vec3.create();
var tempVec3b = vec3.create();
var tempVec4 = vec4.create();
var tempMat4 = mat4.create();
function defineTransparencyCopyShader(builder) {
    builder.addOutputBuffer('vec4', 'v4f_fragColor', null);
    builder.setFragmentMain('\nvec4 v0 = getValue0();\nvec4 v1 = getValue1();\nvec4 accum = vec4(v0.rgb, v1.r);\nfloat revealage = v0.a;\n\nv4f_fragColor = vec4(accum.rgb / accum.a, revealage);\n');
}
var PerspectiveViewStateBase = withSharedVisibility(SharedObject);

var PerspectiveViewState = function (_PerspectiveViewState) {
    _inherits(PerspectiveViewState, _PerspectiveViewState);

    function PerspectiveViewState() {
        _classCallCheck(this, PerspectiveViewState);

        return _possibleConstructorReturn(this, (PerspectiveViewState.__proto__ || _Object$getPrototypeOf(PerspectiveViewState)).apply(this, arguments));
    }

    return PerspectiveViewState;
}(PerspectiveViewStateBase);

export var PerspectivePanel = function (_RenderedDataPanel) {
    _inherits(PerspectivePanel, _RenderedDataPanel);

    function PerspectivePanel(context, element, viewer) {
        _classCallCheck(this, PerspectivePanel);

        /**
         * If boolean value is true, sliceView is shown unconditionally, regardless of the value of
         * this.viewer.showSliceViews.value.
         */
        var _this2 = _possibleConstructorReturn(this, (PerspectivePanel.__proto__ || _Object$getPrototypeOf(PerspectivePanel)).call(this, context, element, viewer));

        _this2.sliceViews = function () {
            var sliceViewDisposers = new _Map();
            return _this2.registerDisposer(new WatchableMap(function (_unconditional, sliceView) {
                var disposer = sliceView.visibility.add(_this2.visibility);
                sliceViewDisposers.set(sliceView, disposer);
                _this2.scheduleRedraw();
            }, function (_unconditional, sliceView) {
                var disposer = sliceViewDisposers.get(sliceView);
                sliceViewDisposers.delete(sliceView);
                disposer();
                sliceView.dispose();
                _this2.scheduleRedraw();
            }));
        }();
        /**
         * Transform from camera space to OpenGL clip space.
         */
        _this2.projectionMat = mat4.create();
        /**
         * Transform from world space to camera space.
         */
        _this2.viewMat = mat4.create();
        /**
         * Inverse of `viewMat`.
         */
        _this2.viewMatInverse = mat4.create();
        /**
         * Transform from world space to OpenGL clip space.  Equal to `projectionMat * viewMat`.
         */
        _this2.viewProjectionMat = mat4.create();
        /**
         * Inverse of `viewProjectionMat`.
         */
        _this2.viewProjectionMatInverse = mat4.create();
        /**
         * Width of panel viewport in pixels.
         */
        _this2.width = 0;
        /**
         * Height of panel viewport in pixels.
         */
        _this2.height = 0;
        _this2.axesLineHelper = _this2.registerDisposer(AxesLineHelper.get(_this2.gl));
        _this2.sliceViewRenderHelper = _this2.registerDisposer(SliceViewRenderHelper.get(_this2.gl, perspectivePanelEmit));
        _this2.offscreenFramebuffer = _this2.registerDisposer(new FramebufferConfiguration(_this2.gl, {
            colorBuffers: [new TextureBuffer(_this2.gl, WebGL2RenderingContext.RGBA8, WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE), new TextureBuffer(_this2.gl, WebGL2RenderingContext.R32F, WebGL2RenderingContext.RED, WebGL2RenderingContext.FLOAT), new TextureBuffer(_this2.gl, WebGL2RenderingContext.R32F, WebGL2RenderingContext.RED, WebGL2RenderingContext.FLOAT)],
            depthBuffer: new DepthBuffer(_this2.gl)
        }));
        _this2.offscreenCopyHelper = _this2.registerDisposer(OffscreenCopyHelper.get(_this2.gl));
        _this2.transparencyCopyHelper = _this2.registerDisposer(OffscreenCopyHelper.get(_this2.gl, defineTransparencyCopyShader, 2));
        _this2.scaleBarCopyHelper = _this2.registerDisposer(OffscreenCopyHelper.get(_this2.gl));
        _this2.scaleBarTexture = _this2.registerDisposer(new ScaleBarTexture(_this2.gl));
        _this2.nanometersPerPixel = 1;
        _this2.throttledSendViewportUpdate = _this2.registerCancellable(throttle(function () {
            var sharedObject = _this2.sharedObject;
            var valid = _this2.navigationState.valid;

            if (valid) {
                _this2.updateProjectionMatrix();
            }
            sharedObject.rpc.invoke(PERSPECTIVE_VIEW_UPDATE_VIEWPORT_RPC_ID, {
                view: sharedObject.rpcId,
                viewport: {
                    width: valid ? _this2.width : 0,
                    height: valid ? _this2.height : 0,
                    viewMat: _this2.viewMat,
                    projectionMat: _this2.projectionMat,
                    viewProjectionMat: _this2.viewProjectionMat
                }
            });
        }, 10));
        _this2.registerDisposer(_this2.navigationState.changed.add(function () {
            _this2.throttledSendViewportUpdate();
            _this2.context.scheduleRedraw();
        }));
        var sharedObject = _this2.sharedObject = _this2.registerDisposer(new PerspectiveViewState());
        sharedObject.RPC_TYPE_ID = PERSPECTIVE_VIEW_RPC_ID;
        sharedObject.initializeCounterpart(viewer.rpc, {});
        sharedObject.visibility.add(_this2.visibility);
        _this2.visibleLayerTracker = makeRenderedPanelVisibleLayerTracker(_this2.viewer.layerManager, PerspectiveViewRenderLayer, _this2.viewer.visibleLayerRoles, _this2, function (layer) {
            var backend = layer.backend;

            if (backend) {
                backend.rpc.invoke(PERSPECTIVE_VIEW_ADD_LAYER_RPC_ID, { layer: backend.rpcId, view: _this2.sharedObject.rpcId });
                return function () {
                    backend.rpc.invoke(PERSPECTIVE_VIEW_REMOVE_LAYER_RPC_ID, { layer: backend.rpcId, view: _this2.sharedObject.rpcId });
                };
            }
            return undefined;
        });
        registerActionListener(element, 'rotate-via-mouse-drag', function (e) {
            startRelativeMouseDrag(e.detail, function (_event, deltaX, deltaY) {
                _this2.navigationState.pose.rotateRelative(kAxes[1], deltaX / 4.0 * Math.PI / 180.0);
                _this2.navigationState.pose.rotateRelative(kAxes[0], -deltaY / 4.0 * Math.PI / 180.0);
            });
        });
        registerActionListener(element, 'rotate-in-plane-via-touchrotate', function (e) {
            var detail = e.detail;

            _this2.navigationState.pose.rotateRelative(kAxes[2], detail.angle - detail.prevAngle);
        });
        registerActionListener(element, 'rotate-out-of-plane-via-touchtranslate', function (e) {
            var detail = e.detail;

            _this2.navigationState.pose.rotateRelative(kAxes[1], detail.deltaX / 4.0 * Math.PI / 180.0);
            _this2.navigationState.pose.rotateRelative(kAxes[0], -detail.deltaY / 4.0 * Math.PI / 180.0);
        });
        if (viewer.showSliceViewsCheckbox) {
            var showSliceViewsCheckbox = _this2.registerDisposer(new TrackableBooleanCheckbox(viewer.showSliceViews));
            showSliceViewsCheckbox.element.className = 'perspective-panel-show-slice-views neuroglancer-noselect';
            var showSliceViewsLabel = document.createElement('label');
            showSliceViewsLabel.className = 'perspective-panel-show-slice-views neuroglancer-noselect';
            showSliceViewsLabel.appendChild(document.createTextNode('Slices'));
            showSliceViewsLabel.appendChild(showSliceViewsCheckbox.element);
            _this2.element.appendChild(showSliceViewsLabel);
        }
        _this2.registerDisposer(viewer.orthographicProjection.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.showScaleBar.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.scaleBarOptions.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.showSliceViews.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.showAxisLines.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.crossSectionBackgroundColor.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        _this2.registerDisposer(viewer.perspectiveViewBackgroundColor.changed.add(function () {
            return _this2.scheduleRedraw();
        }));
        return _this2;
    }

    _createClass(PerspectivePanel, [{
        key: 'translateByViewportPixels',
        value: function translateByViewportPixels(deltaX, deltaY) {
            var temp = tempVec3;
            var viewProjectionMat = this.viewProjectionMat;
            var width = this.width,
                height = this.height;
            var position = this.viewer.navigationState.position;

            var pos = position.spatialCoordinates;
            vec3.transformMat4(temp, pos, viewProjectionMat);
            temp[0] = -2 * deltaX / width;
            temp[1] = 2 * deltaY / height;
            vec3.transformMat4(pos, temp, this.viewProjectionMatInverse);
            position.changed.dispatch();
        }
    }, {
        key: 'isReady',
        value: function isReady() {
            if (!this.visible) {
                return true;
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.sliceViews), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var sliceView = _ref2[0];
                    var unconditional = _ref2[1];

                    if (unconditional || this.viewer.showSliceViews.value) {
                        if (!sliceView.isReady()) {
                            return false;
                        }
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

            this.checkForResize();
            var width = this.width,
                height = this.height;

            if (width === 0 || height === 0) {
                return true;
            }
            var viewProjectionMat = this.viewProjectionMat;

            this.updateProjectionMatrix();
            var renderContext = {
                viewportWidth: width,
                viewportHeight: height,
                dataToDevice: viewProjectionMat
            };
            var visibleLayers = this.visibleLayerTracker.getVisibleLayers();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(visibleLayers), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var renderLayer = _step2.value;

                    if (!renderLayer.isReady(renderContext)) {
                        return false;
                    }
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

            return true;
        }
    }, {
        key: 'updateProjectionMatrix',
        value: function updateProjectionMatrix() {
            var projectionMat = this.projectionMat,
                viewProjectionMat = this.viewProjectionMat;

            var zOffsetAmount = 100;
            var widthOverHeight = this.width / this.height;
            var fovy = Math.PI / 4.0;
            var nearBound = 10,
                farBound = 5000;
            if (this.viewer.orthographicProjection.value) {
                // Pick orthographic projection to match perspective projection at plane parallel to image
                // plane containing the center position.
                var f = 1.0 / Math.tan(fovy / 2);
                // We need -2 / (left - right) == f / widthOverHeight.
                // left - right = - 2 * widthOverHeight * orthoScalar
                // -2 / (left - right) = 1 / (widthOverHeight * orthoScalar).
                // 1 / orthoScalar == f.
                // orthoScalar = 1 / f
                var orthoScalar = zOffsetAmount / f;
                mat4.ortho(projectionMat, -widthOverHeight * orthoScalar, widthOverHeight * orthoScalar, -orthoScalar, orthoScalar, nearBound, farBound);
                this.nanometersPerPixel = 1 / (2 * projectionMat[0]) * this.navigationState.zoomFactor.value;
                this.nanometersPerPixel = 2 * widthOverHeight * orthoScalar / this.width * this.navigationState.zoomFactor.value;
            } else {
                mat4.perspective(projectionMat, fovy, widthOverHeight, nearBound, farBound);
            }
            var viewMatInverse = this.viewMatInverse,
                viewMat = this.viewMat;

            this.navigationState.toMat4(viewMatInverse);
            vec3.set(tempVec3, 1, -1, -1);
            mat4.scale(viewMatInverse, viewMatInverse, tempVec3);
            var viewOffset = vec3.set(tempVec3, 0, 0, zOffsetAmount);
            mat4.translate(viewMatInverse, viewMatInverse, viewOffset);
            mat4.invert(viewMat, viewMatInverse);
            mat4.multiply(viewProjectionMat, projectionMat, viewMat);
            mat4.invert(this.viewProjectionMatInverse, viewProjectionMat);
        }
    }, {
        key: 'panelSizeChanged',
        value: function panelSizeChanged() {
            this.throttledSendViewportUpdate();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.sliceViews.keys()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var sliceView = _step3.value;

                    sliceView.dispose();
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

            this.sliceViews.clear();
            _get(PerspectivePanel.prototype.__proto__ || _Object$getPrototypeOf(PerspectivePanel.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'issuePickRequest',
        value: function issuePickRequest(glWindowX, glWindowY) {
            var offscreenFramebuffer = this.offscreenFramebuffer;

            offscreenFramebuffer.readPixelFloat32IntoBuffer(OffscreenTextures.Z, glWindowX - pickRadius, glWindowY - pickRadius, 0, pickDiameter, pickDiameter);
            offscreenFramebuffer.readPixelFloat32IntoBuffer(OffscreenTextures.PICK, glWindowX - pickRadius, glWindowY - pickRadius, 4 * 4 * pickDiameter * pickDiameter, pickDiameter, pickDiameter);
        }
    }, {
        key: 'completePickRequest',
        value: function completePickRequest(glWindowX, glWindowY, data, pickingData) {
            var mouseState = this.viewer.mouseState;

            mouseState.pickedRenderLayer = null;
            clearOutOfBoundsPickData(data, 0, 4, glWindowX, glWindowY, pickingData.viewportWidth, pickingData.viewportHeight);
            var numOffsets = pickOffsetSequence.length;
            for (var i = 0; i < numOffsets; ++i) {
                var offset = pickOffsetSequence[i];
                var zValue = data[4 * offset];
                if (zValue === 0) continue;
                var relativeX = offset % pickDiameter;
                var relativeY = (offset - relativeX) / pickDiameter;
                var glWindowZ = 1.0 - zValue;
                var out = mouseState.position;
                out[0] = 2.0 * (glWindowX + relativeX - pickRadius) / pickingData.viewportWidth - 1.0;
                out[1] = 2.0 * (glWindowY + relativeY - pickRadius) / pickingData.viewportHeight - 1.0;
                out[2] = 2.0 * glWindowZ - 1.0;
                vec3.transformMat4(out, out, pickingData.invTransform);
                var pickValue = data[4 * pickDiameter * pickDiameter + 4 * offset];
                pickingData.pickIDs.setMouseState(mouseState, pickValue);
                mouseState.setActive(true);
                return;
            }
            mouseState.setActive(false);
        }
    }, {
        key: 'translateDataPointByViewportPixels',
        value: function translateDataPointByViewportPixels(out, orig, deltaX, deltaY) {
            var temp = tempVec3;
            var viewProjectionMat = this.viewProjectionMat;
            var width = this.width,
                height = this.height;

            vec3.transformMat4(temp, orig, viewProjectionMat);
            temp[0] += 2 * deltaX / width;
            temp[1] += -2 * deltaY / height;
            return vec3.transformMat4(out, temp, this.viewProjectionMatInverse);
        }
    }, {
        key: 'drawWithPicking',
        value: function drawWithPicking(pickingData) {
            if (!this.navigationState.valid) {
                return false;
            }
            var width = this.width,
                height = this.height;

            var showSliceViews = this.viewer.showSliceViews.value;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(this.sliceViews), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref3 = _step4.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var sliceView = _ref4[0];
                    var unconditional = _ref4[1];

                    if (unconditional || showSliceViews) {
                        sliceView.updateRendering();
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            var gl = this.gl;
            this.offscreenFramebuffer.bind(width, height);
            gl.disable(gl.SCISSOR_TEST);
            var backgroundColor = this.viewer.perspectiveViewBackgroundColor.value;
            this.gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            var viewProjectionMat = this.viewProjectionMat;

            this.updateProjectionMatrix();
            // FIXME; avoid temporaries
            var lightingDirection = vec3.create();
            transformVectorByMat4(lightingDirection, kAxes[2], this.viewMatInverse);
            vec3.normalize(lightingDirection, lightingDirection);
            var ambient = 0.2;
            var directional = 1 - ambient;
            var renderContext = {
                dataToDevice: viewProjectionMat,
                lightDirection: lightingDirection,
                ambientLighting: ambient,
                directionalLighting: directional,
                pickIDs: pickingData.pickIDs,
                emitter: perspectivePanelEmit,
                emitColor: true,
                emitPickID: true,
                alreadyEmittedPickID: false,
                viewportWidth: width,
                viewportHeight: height
            };
            mat4.copy(pickingData.invTransform, this.viewProjectionMatInverse);
            var visibleLayers = this.visibleLayerTracker.getVisibleLayers();
            var hasTransparent = false;
            var hasAnnotation = false;
            // Draw fully-opaque layers first.
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(visibleLayers), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var renderLayer = _step5.value;

                    if (!renderLayer.isTransparent) {
                        if (!renderLayer.isAnnotation) {
                            renderLayer.draw(renderContext);
                        } else {
                            hasAnnotation = true;
                        }
                    } else {
                        hasTransparent = true;
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            this.drawSliceViews(renderContext);
            if (hasAnnotation) {
                gl.enable(WebGL2RenderingContext.BLEND);
                gl.depthFunc(WebGL2RenderingContext.LEQUAL);
                gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
                // Render only to the color buffer, but not the pick or z buffer.  With blending enabled, the
                // z and color values would be corrupted.
                gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE]);
                renderContext.emitPickID = false;
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = _getIterator(visibleLayers), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var _renderLayer = _step6.value;

                        if (_renderLayer.isAnnotation) {
                            _renderLayer.draw(renderContext);
                        }
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                gl.depthFunc(WebGL2RenderingContext.LESS);
                gl.disable(WebGL2RenderingContext.BLEND);
                gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
                renderContext.emitPickID = true;
            }
            if (this.viewer.showAxisLines.value) {
                this.drawAxisLines();
            }
            if (hasTransparent) {
                // Draw transparent objects.
                gl.depthMask(false);
                gl.enable(WebGL2RenderingContext.BLEND);
                // Compute accumulate and revealage textures.
                var transparentConfiguration = this.transparentConfiguration;

                transparentConfiguration.bind(width, height);
                this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
                renderContext.emitter = perspectivePanelEmitOIT;
                gl.blendFuncSeparate(WebGL2RenderingContext.ONE, WebGL2RenderingContext.ONE, WebGL2RenderingContext.ZERO, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
                renderContext.emitPickID = false;
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = _getIterator(visibleLayers), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var _renderLayer2 = _step7.value;

                        if (_renderLayer2.isTransparent) {
                            _renderLayer2.draw(renderContext);
                        }
                    }
                    // Copy transparent rendering result back to primary buffer.
                } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                            _iterator7.return();
                        }
                    } finally {
                        if (_didIteratorError7) {
                            throw _iteratorError7;
                        }
                    }
                }

                gl.disable(WebGL2RenderingContext.DEPTH_TEST);
                this.offscreenFramebuffer.bindSingle(OffscreenTextures.COLOR);
                gl.blendFunc(WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA, WebGL2RenderingContext.SRC_ALPHA);
                this.transparencyCopyHelper.draw(transparentConfiguration.colorBuffers[0].texture, transparentConfiguration.colorBuffers[1].texture);
                gl.depthMask(true);
                gl.disable(WebGL2RenderingContext.BLEND);
                gl.enable(WebGL2RenderingContext.DEPTH_TEST);
                // Restore framebuffer attachments.
                this.offscreenFramebuffer.bind(width, height);
            }
            // Do picking only rendering pass.
            gl.drawBuffers([gl.NONE, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
            renderContext.emitter = perspectivePanelEmit;
            renderContext.emitPickID = true;
            renderContext.emitColor = false;
            // Offset z values forward so that we reliably write pick IDs and depth information even though
            // we've already done one drawing pass.
            gl.enable(WebGL2RenderingContext.POLYGON_OFFSET_FILL);
            gl.polygonOffset(-1, -1);
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(visibleLayers), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var _renderLayer3 = _step8.value;

                    renderContext.alreadyEmittedPickID = !_renderLayer3.isTransparent && !_renderLayer3.isAnnotation;
                    _renderLayer3.draw(renderContext);
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            gl.disable(WebGL2RenderingContext.POLYGON_OFFSET_FILL);
            if (this.viewer.showScaleBar.value && this.viewer.orthographicProjection.value) {
                // Only modify color buffer.
                gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
                gl.disable(WebGL2RenderingContext.DEPTH_TEST);
                gl.enable(WebGL2RenderingContext.BLEND);
                gl.blendFunc(WebGL2RenderingContext.SRC_ALPHA, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
                var scaleBarTexture = this.scaleBarTexture;

                var options = this.viewer.scaleBarOptions.value;
                var dimensions = scaleBarTexture.dimensions;

                dimensions.targetLengthInPixels = Math.min(options.maxWidthFraction * width, options.maxWidthInPixels * options.scaleFactor);
                dimensions.nanometersPerPixel = this.nanometersPerPixel;
                scaleBarTexture.update(options);
                gl.viewport(options.leftPixelOffset * options.scaleFactor, options.bottomPixelOffset * options.scaleFactor, scaleBarTexture.width, scaleBarTexture.height);
                this.scaleBarCopyHelper.draw(scaleBarTexture.texture);
                gl.disable(WebGL2RenderingContext.BLEND);
            }
            this.offscreenFramebuffer.unbind();
            // Draw the texture over the whole viewport.
            this.setGLViewport();
            this.offscreenCopyHelper.draw(this.offscreenFramebuffer.colorBuffers[OffscreenTextures.COLOR].texture);
            return true;
        }
    }, {
        key: 'drawSliceViews',
        value: function drawSliceViews(renderContext) {
            var sliceViewRenderHelper = this.sliceViewRenderHelper;
            var lightDirection = renderContext.lightDirection,
                ambientLighting = renderContext.ambientLighting,
                directionalLighting = renderContext.directionalLighting,
                dataToDevice = renderContext.dataToDevice;

            var showSliceViews = this.viewer.showSliceViews.value;
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = _getIterator(this.sliceViews), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var _ref5 = _step9.value;

                    var _ref6 = _slicedToArray(_ref5, 2);

                    var sliceView = _ref6[0];
                    var unconditional = _ref6[1];

                    if (!unconditional && !showSliceViews) {
                        continue;
                    }
                    if (sliceView.width === 0 || sliceView.height === 0 || !sliceView.hasValidViewport) {
                        continue;
                    }
                    var scalar = Math.abs(vec3.dot(lightDirection, sliceView.viewportAxes[2]));
                    var factor = ambientLighting + scalar * directionalLighting;
                    var mat = tempMat4;
                    // Need a matrix that maps (+1, +1, 0) to projectionMat * (width, height, 0)
                    mat4.identity(mat);
                    mat[0] = sliceView.width / 2.0;
                    mat[5] = -sliceView.height / 2.0;
                    mat4.multiply(mat, sliceView.viewportToData, mat);
                    mat4.multiply(mat, dataToDevice, mat);
                    var backgroundColor = tempVec4;
                    var crossSectionBackgroundColor = this.viewer.crossSectionBackgroundColor.value;
                    backgroundColor[0] = crossSectionBackgroundColor[0];
                    backgroundColor[1] = crossSectionBackgroundColor[1];
                    backgroundColor[2] = crossSectionBackgroundColor[2];
                    backgroundColor[3] = 1;
                    sliceViewRenderHelper.draw(sliceView.offscreenFramebuffer.colorBuffers[0].texture, mat, vec4.fromValues(factor, factor, factor, 1), tempVec4, 0, 0, 1, 1);
                }
            } catch (err) {
                _didIteratorError9 = true;
                _iteratorError9 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion9 && _iterator9.return) {
                        _iterator9.return();
                    }
                } finally {
                    if (_didIteratorError9) {
                        throw _iteratorError9;
                    }
                }
            }
        }
    }, {
        key: 'drawAxisLines',
        value: function drawAxisLines() {
            var temp = tempVec3;
            var temp2 = tempVec3b;
            var viewProjectionMat = this.viewProjectionMat;
            var position = this.viewer.navigationState.position;

            var pos = position.spatialCoordinates;
            vec3.transformMat4(temp, pos, viewProjectionMat);
            temp[0] = 0.5;
            vec3.transformMat4(temp2, temp, this.viewProjectionMatInverse);
            var length0 = vec3.distance(temp2, pos);
            temp[0] = 0;
            temp[1] = 0.5;
            vec3.transformMat4(temp2, temp, this.viewProjectionMatInverse);
            var length1 = vec3.distance(temp2, pos);
            var gl = this.gl;

            var mat = tempMat4;
            mat4.identity(mat);
            // Draw axes lines.
            var axisLength = Math.min(length0, length1);
            // Construct matrix that maps [-1, +1] x/y range to the full viewport data
            // coordinates.
            mat[0] = axisLength;
            mat[5] = axisLength;
            mat[10] = axisLength;
            var center = this.navigationState.position.spatialCoordinates;
            mat[12] = center[0];
            mat[13] = center[1];
            mat[14] = center[2];
            mat[15] = 1;
            mat4.multiply(mat, this.viewProjectionMat, mat);
            gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
            this.axesLineHelper.draw(mat, false);
        }
    }, {
        key: 'zoomByMouse',
        value: function zoomByMouse(factor) {
            this.navigationState.zoomBy(factor);
        }
    }, {
        key: 'navigationState',
        get: function get() {
            return this.viewer.navigationState;
        }
    }, {
        key: 'transparentConfiguration',
        get: function get() {
            var transparentConfiguration = this.transparentConfiguration_;
            if (transparentConfiguration === undefined) {
                transparentConfiguration = this.transparentConfiguration_ = this.registerDisposer(new FramebufferConfiguration(this.gl, {
                    colorBuffers: makeTextureBuffers(this.gl, 2, this.gl.RGBA32F, this.gl.RGBA, this.gl.FLOAT),
                    depthBuffer: this.offscreenFramebuffer.depthBuffer.addRef()
                }));
            }
            return transparentConfiguration;
        }
    }]);

    return PerspectivePanel;
}(RenderedDataPanel);
//# sourceMappingURL=panel.js.map