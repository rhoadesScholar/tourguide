import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _Set from "babel-runtime/core-js/set";
import _Map from "babel-runtime/core-js/map";
import _createClass from "babel-runtime/helpers/createClass";
import _get from "babel-runtime/helpers/get";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
import debounce from 'lodash/debounce';
import { ChunkState } from "../chunk_manager/base";
import { Chunk, ChunkSource } from "../chunk_manager/frontend";
import { SLICEVIEW_ADD_VISIBLE_LAYER_RPC_ID, SLICEVIEW_REMOVE_VISIBLE_LAYER_RPC_ID, SLICEVIEW_RPC_ID, SLICEVIEW_UPDATE_VIEW_RPC_ID, SliceViewBase } from "./base";
import { RenderLayer } from "./renderlayer";
import { invokeDisposers, RefCounted } from "../util/disposable";
import { mat4, rectifyTransformMatrixIfAxisAligned, vec3Key } from "../util/geom";
import { getObjectId } from "../util/object_id";
import { NullarySignal } from "../util/signal";
import { withSharedVisibility } from "../visibility_priority/frontend";
import { FramebufferConfiguration, makeTextureBuffers, StencilBuffer } from "../webgl/offscreen";
import { ShaderBuilder } from "../webgl/shader";
import { getSquareCornersBuffer } from "../webgl/square_corners_buffer";
import { registerSharedObjectOwner } from "../worker_rpc";
var tempMat = mat4.create();

var FrontendSliceViewBase = function (_SliceViewBase) {
    _inherits(FrontendSliceViewBase, _SliceViewBase);

    function FrontendSliceViewBase() {
        _classCallCheck(this, FrontendSliceViewBase);

        return _possibleConstructorReturn(this, (FrontendSliceViewBase.__proto__ || _Object$getPrototypeOf(FrontendSliceViewBase)).apply(this, arguments));
    }

    return FrontendSliceViewBase;
}(SliceViewBase);

var Base = withSharedVisibility(FrontendSliceViewBase);
var SliceView = function (_Base) {
    _inherits(SliceView, _Base);

    function SliceView(chunkManager, layerManager, navigationState) {
        _classCallCheck(this, SliceView);

        var _this2 = _possibleConstructorReturn(this, (SliceView.__proto__ || _Object$getPrototypeOf(SliceView)).call(this));

        _this2.chunkManager = chunkManager;
        _this2.layerManager = layerManager;
        _this2.navigationState = navigationState;
        _this2.gl = _this2.chunkManager.gl;
        _this2.dataToViewport = mat4.create();
        // Transforms viewport coordinates to OpenGL normalized device coordinates
        // [left: -1, right: 1], [top: 1, bottom: -1].
        _this2.viewportToDevice = mat4.create();
        // Equals viewportToDevice * dataToViewport.
        _this2.dataToDevice = mat4.create();
        _this2.visibleChunks = new _Map();
        _this2.viewChanged = new NullarySignal();
        _this2.renderingStale = true;
        _this2.visibleChunksStale = true;
        _this2.visibleLayerList = new Array();
        _this2.newVisibleLayers = new _Set();
        _this2.offscreenFramebuffer = _this2.registerDisposer(new FramebufferConfiguration(_this2.gl, { colorBuffers: makeTextureBuffers(_this2.gl, 1), depthBuffer: new StencilBuffer(_this2.gl) }));
        _this2.numVisibleChunks = 0;
        _this2.updateVisibleLayers = _this2.registerCancellable(debounce(function () {
            _this2.updateVisibleLayersNow();
        }, 0));
        _this2.invalidateVisibleSources = function () {
            _this2.visibleSourcesStale = true;
            _this2.viewChanged.dispatch();
        };
        _this2.visibleLayerDisposers = new _Map();
        _this2.setViewportSizeDebounced = _this2.registerCancellable(debounce(function (width, height) {
            return _this2.setViewportSize(width, height);
        }, 0));
        mat4.identity(_this2.dataToViewport);
        var rpc = _this2.chunkManager.rpc;
        _this2.initializeCounterpart(rpc, {
            'chunkManager': chunkManager.rpcId
        });
        _this2.registerDisposer(navigationState.changed.add(function () {
            _this2.updateViewportFromNavigationState();
        }));
        _this2.updateViewportFromNavigationState();
        _this2.registerDisposer(layerManager.layersChanged.add(function () {
            if (_this2.hasValidViewport) {
                _this2.updateVisibleLayers();
            }
        }));
        _this2.viewChanged.add(function () {
            _this2.renderingStale = true;
        });
        _this2.registerDisposer(chunkManager.chunkQueueManager.visibleChunksChanged.add(_this2.viewChanged.dispatch));
        _this2.updateViewportFromNavigationState();
        _this2.updateVisibleLayers();
        return _this2;
    }

    _createClass(SliceView, [{
        key: "isReady",
        value: function isReady() {
            this.setViewportSizeDebounced.flush();
            if (!this.hasValidViewport) {
                return false;
            }
            this.maybeUpdateVisibleChunks();
            var numValidChunks = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.visibleLayers.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var visibleSources = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = _getIterator(visibleSources), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var _ref = _step2.value;
                            var chunkLayout = _ref.chunkLayout;
                            var source = _ref.source;

                            // FIXME: handle change to chunkLayout
                            var visibleChunks = this.visibleChunks.get(chunkLayout);
                            if (!visibleChunks) {
                                return false;
                            }
                            var chunks = source.chunks;
                            var _iteratorNormalCompletion3 = true;
                            var _didIteratorError3 = false;
                            var _iteratorError3 = undefined;

                            try {
                                for (var _iterator3 = _getIterator(visibleChunks), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                    var key = _step3.value;

                                    var chunk = chunks.get(key);
                                    if (chunk && chunk.state === ChunkState.GPU_MEMORY) {
                                        ++numValidChunks;
                                    }
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

            return numValidChunks === this.numVisibleChunks;
        }
    }, {
        key: "updateViewportFromNavigationState",
        value: function updateViewportFromNavigationState() {
            var navigationState = this.navigationState;

            if (!navigationState.valid) {
                return;
            }
            navigationState.toMat4(tempMat);
            this.setViewportToDataMatrix(tempMat);
        }
    }, {
        key: "bindVisibleRenderLayer",
        value: function bindVisibleRenderLayer(renderLayer, disposers) {
            disposers.push(renderLayer.redrawNeeded.add(this.viewChanged.dispatch));
            disposers.push(renderLayer.transform.changed.add(this.invalidateVisibleSources));
            disposers.push(renderLayer.renderScaleTarget.changed.add(this.invalidateVisibleSources));
            var renderScaleHistogram = renderLayer.renderScaleHistogram;

            if (renderScaleHistogram !== undefined) {
                disposers.push(renderScaleHistogram.visibility.add(this.visibility));
            }
        }
    }, {
        key: "updateVisibleLayersNow",
        value: function updateVisibleLayersNow() {
            if (this.wasDisposed) {
                return false;
            }
            if (!this.hasValidViewport) {
                return false;
            }
            var visibleLayers = this.visibleLayers;
            var rpc = this.rpc;
            var rpcMessage = { 'id': this.rpcId };
            var newVisibleLayers = this.newVisibleLayers;
            var changed = false;
            var visibleLayerList = this.visibleLayerList;
            var visibleLayerDisposers = this.visibleLayerDisposers;

            visibleLayerList.length = 0;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(this.layerManager.readyRenderLayers()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var renderLayer = _step4.value;

                    if (renderLayer instanceof RenderLayer) {
                        newVisibleLayers.add(renderLayer);
                        visibleLayerList.push(renderLayer);
                        if (!visibleLayers.has(renderLayer)) {
                            visibleLayers.set(renderLayer.addRef(), []);
                            var disposers = [];
                            visibleLayerDisposers.set(renderLayer, disposers);
                            this.bindVisibleRenderLayer(renderLayer, disposers);
                            rpcMessage['layerId'] = renderLayer.rpcId;
                            rpc.invoke(SLICEVIEW_ADD_VISIBLE_LAYER_RPC_ID, rpcMessage);
                            changed = true;
                        }
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

            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(visibleLayers.keys()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _renderLayer = _step5.value;

                    if (!newVisibleLayers.has(_renderLayer)) {
                        visibleLayers.delete(_renderLayer);
                        var _disposers = this.visibleLayerDisposers.get(_renderLayer);
                        this.visibleLayerDisposers.delete(_renderLayer);
                        invokeDisposers(_disposers);
                        rpcMessage['layerId'] = _renderLayer.rpcId;
                        rpc.invoke(SLICEVIEW_REMOVE_VISIBLE_LAYER_RPC_ID, rpcMessage);
                        _renderLayer.dispose();
                        changed = true;
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

            newVisibleLayers.clear();
            if (changed) {
                this.visibleSourcesStale = true;
            }
            // Unconditionally call viewChanged, because layers may have been reordered even if the set of
            // sources is the same.
            this.viewChanged.dispatch();
            return changed;
        }
    }, {
        key: "onViewportChanged",
        value: function onViewportChanged() {
            var width = this.width,
                height = this.height,
                viewportToDevice = this.viewportToDevice,
                dataToViewport = this.dataToViewport,
                dataToDevice = this.dataToDevice;
            // FIXME: Make this adjustable.

            var sliceThickness = 10;
            mat4.ortho(viewportToDevice, -width / 2, width / 2, height / 2, -height / 2, -sliceThickness, sliceThickness);
            mat4.multiply(dataToDevice, viewportToDevice, dataToViewport);
            this.visibleChunksStale = true;
            this.viewChanged.dispatch();
        }
    }, {
        key: "setViewportSize",
        value: function setViewportSize(width, height) {
            this.setViewportSizeDebounced.cancel();
            if (_get(SliceView.prototype.__proto__ || _Object$getPrototypeOf(SliceView.prototype), "setViewportSize", this).call(this, width, height)) {
                this.rpc.invoke(SLICEVIEW_UPDATE_VIEW_RPC_ID, { id: this.rpcId, width: width, height: height });
                // this.chunkManager.scheduleUpdateChunkPriorities();
                return true;
            }
            return false;
        }
    }, {
        key: "onViewportToDataMatrixChanged",
        value: function onViewportToDataMatrixChanged() {
            var viewportToData = this.viewportToData,
                dataToViewport = this.dataToViewport;

            mat4.invert(dataToViewport, viewportToData);
            rectifyTransformMatrixIfAxisAligned(dataToViewport);
            this.rpc.invoke(SLICEVIEW_UPDATE_VIEW_RPC_ID, { id: this.rpcId, viewportToData: viewportToData });
        }
    }, {
        key: "onHasValidViewport",
        value: function onHasValidViewport() {
            this.updateVisibleLayers();
        }
    }, {
        key: "updateRendering",
        value: function updateRendering() {
            this.setViewportSizeDebounced.flush();
            if (!this.renderingStale || !this.hasValidViewport || this.width === 0 || this.height === 0) {
                return;
            }
            this.renderingStale = false;
            this.maybeUpdateVisibleChunks();
            var gl = this.gl,
                offscreenFramebuffer = this.offscreenFramebuffer,
                width = this.width,
                height = this.height;

            offscreenFramebuffer.bind(width, height);
            gl.disable(gl.SCISSOR_TEST);
            // we have viewportToData
            // we need: matrix that maps input x to the output x axis, scaled by
            gl.clearStencil(0);
            gl.clearColor(0, 0, 0, 0);
            gl.colorMask(true, true, true, true);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.STENCIL_TEST);
            gl.disable(gl.DEPTH_TEST);
            gl.stencilOpSeparate(
            /*face=*/gl.FRONT_AND_BACK, /*sfail=*/gl.KEEP, /*dpfail=*/gl.KEEP,
            /*dppass=*/gl.REPLACE);
            var renderLayerNum = 0;
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(this.visibleLayerList), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var renderLayer = _step6.value;

                    gl.clear(gl.STENCIL_BUFFER_BIT);
                    gl.stencilFuncSeparate(
                    /*face=*/gl.FRONT_AND_BACK,
                    /*func=*/gl.GREATER,
                    /*ref=*/1,
                    /*mask=*/1);
                    renderLayer.setGLBlendMode(gl, renderLayerNum);
                    renderLayer.draw(this);
                    ++renderLayerNum;
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

            gl.disable(gl.BLEND);
            gl.disable(gl.STENCIL_TEST);
            offscreenFramebuffer.unbind();
        }
    }, {
        key: "maybeUpdateVisibleChunks",
        value: function maybeUpdateVisibleChunks() {
            this.updateVisibleLayers.flush();
            if (!this.visibleChunksStale && !this.visibleSourcesStale) {
                return false;
            }
            this.visibleChunksStale = false;
            this.updateVisibleChunks();
            return true;
        }
    }, {
        key: "updateVisibleChunks",
        value: function updateVisibleChunks() {
            var allVisibleChunks = this.visibleChunks;
            function getLayoutObject(chunkLayout) {
                var visibleChunks = allVisibleChunks.get(chunkLayout);
                if (visibleChunks === undefined) {
                    visibleChunks = [];
                    allVisibleChunks.set(chunkLayout, visibleChunks);
                } else {
                    visibleChunks.length = 0;
                }
                return visibleChunks;
            }
            var numVisibleChunks = 0;
            function addChunk(_chunkLayout, visibleChunks, positionInChunks, fullyVisibleSources) {
                var key = vec3Key(positionInChunks);
                visibleChunks[visibleChunks.length] = key;
                numVisibleChunks += fullyVisibleSources.length;
            }
            this.computeVisibleChunks(getLayoutObject, addChunk);
            this.numVisibleChunks = numVisibleChunks;
        }
    }, {
        key: "disposed",
        value: function disposed() {
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = _getIterator(this.visibleLayerDisposers), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var _ref2 = _step7.value;

                    var _ref3 = _slicedToArray(_ref2, 2);

                    var renderLayer = _ref3[0];
                    var disposers = _ref3[1];

                    invokeDisposers(disposers);
                    renderLayer.dispose();
                }
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

            this.visibleLayerDisposers.clear();
            this.visibleLayers.clear();
            this.visibleLayerList.length = 0;
        }
    }]);

    return SliceView;
}(Base);
SliceView = __decorate([registerSharedObjectOwner(SLICEVIEW_RPC_ID)], SliceView);
export { SliceView };
export var SliceViewChunkSource = function (_ChunkSource) {
    _inherits(SliceViewChunkSource, _ChunkSource);

    function SliceViewChunkSource(chunkManager, options) {
        _classCallCheck(this, SliceViewChunkSource);

        var _this3 = _possibleConstructorReturn(this, (SliceViewChunkSource.__proto__ || _Object$getPrototypeOf(SliceViewChunkSource)).call(this, chunkManager, options));

        _this3.spec = options.spec;
        return _this3;
    }

    _createClass(SliceViewChunkSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            options['spec'] = this.spec.toObject();
            _get(SliceViewChunkSource.prototype.__proto__ || _Object$getPrototypeOf(SliceViewChunkSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }], [{
        key: "encodeOptions",
        value: function encodeOptions(options) {
            var encoding = _get(SliceViewChunkSource.__proto__ || _Object$getPrototypeOf(SliceViewChunkSource), "encodeOptions", this).call(this, options);
            encoding.spec = options.spec.toObject();
            return encoding;
        }
    }]);

    return SliceViewChunkSource;
}(ChunkSource);
export var SliceViewChunk = function (_Chunk) {
    _inherits(SliceViewChunk, _Chunk);

    function SliceViewChunk(source, x) {
        _classCallCheck(this, SliceViewChunk);

        var _this4 = _possibleConstructorReturn(this, (SliceViewChunk.__proto__ || _Object$getPrototypeOf(SliceViewChunk)).call(this, source));

        _this4.chunkGridPosition = x['chunkGridPosition'];
        _this4.state = ChunkState.SYSTEM_MEMORY;
        return _this4;
    }

    return SliceViewChunk;
}(Chunk);
/**
 * Helper for rendering a SliceView that has been pre-rendered to a texture.
 */
export var SliceViewRenderHelper = function (_RefCounted) {
    _inherits(SliceViewRenderHelper, _RefCounted);

    function SliceViewRenderHelper(gl, emitter) {
        _classCallCheck(this, SliceViewRenderHelper);

        var _this5 = _possibleConstructorReturn(this, (SliceViewRenderHelper.__proto__ || _Object$getPrototypeOf(SliceViewRenderHelper)).call(this));

        _this5.gl = gl;
        _this5.copyVertexPositionsBuffer = getSquareCornersBuffer(_this5.gl);
        _this5.textureCoordinateAdjustment = new Float32Array(4);
        var builder = new ShaderBuilder(gl);
        builder.addVarying('vec2', 'vTexCoord');
        builder.addUniform('sampler2D', 'uSampler');
        builder.addInitializer(function (shader) {
            gl.uniform1i(shader.uniform('uSampler'), 0);
        });
        builder.addUniform('vec4', 'uColorFactor');
        builder.addUniform('vec4', 'uBackgroundColor');
        builder.addUniform('mat4', 'uProjectionMatrix');
        builder.addUniform('vec4', 'uTextureCoordinateAdjustment');
        builder.require(emitter);
        builder.setFragmentMain("\nvec4 sampledColor = texture(uSampler, vTexCoord);\nif (sampledColor.a == 0.0) {\n  sampledColor = uBackgroundColor;\n}\nemit(sampledColor * uColorFactor, 0u);\n");
        builder.addAttribute('vec4', 'aVertexPosition');
        builder.setVertexMain("\nvTexCoord = uTextureCoordinateAdjustment.xy + 0.5 * (aVertexPosition.xy + 1.0) * uTextureCoordinateAdjustment.zw;\ngl_Position = uProjectionMatrix * aVertexPosition;\n");
        _this5.shader = _this5.registerDisposer(builder.build());
        return _this5;
    }

    _createClass(SliceViewRenderHelper, [{
        key: "draw",
        value: function draw(texture, projectionMatrix, colorFactor, backgroundColor, xStart, yStart, xEnd, yEnd) {
            var gl = this.gl,
                shader = this.shader,
                textureCoordinateAdjustment = this.textureCoordinateAdjustment;

            textureCoordinateAdjustment[0] = xStart;
            textureCoordinateAdjustment[1] = yStart;
            textureCoordinateAdjustment[2] = xEnd - xStart;
            textureCoordinateAdjustment[3] = yEnd - yStart;
            shader.bind();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniformMatrix4fv(shader.uniform('uProjectionMatrix'), false, projectionMatrix);
            gl.uniform4fv(shader.uniform('uColorFactor'), colorFactor);
            gl.uniform4fv(shader.uniform('uBackgroundColor'), backgroundColor);
            gl.uniform4fv(shader.uniform('uTextureCoordinateAdjustment'), textureCoordinateAdjustment);
            var aVertexPosition = shader.attribute('aVertexPosition');
            this.copyVertexPositionsBuffer.bindToVertexAttrib(aVertexPosition, /*components=*/2);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
            gl.disableVertexAttribArray(aVertexPosition);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }], [{
        key: "get",
        value: function get(gl, emitter) {
            return gl.memoize.get("sliceview/SliceViewRenderHelper:" + getObjectId(emitter), function () {
                return new SliceViewRenderHelper(gl, emitter);
            });
        }
    }]);

    return SliceViewRenderHelper;
}(RefCounted);
//# sourceMappingURL=frontend.js.map