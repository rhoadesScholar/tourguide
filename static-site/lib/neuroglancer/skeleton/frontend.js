import _Map from 'babel-runtime/core-js/map';
import _get from 'babel-runtime/helpers/get';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Symbol from 'babel-runtime/core-js/symbol';
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
import { ChunkState } from '../chunk_manager/base';
import { Chunk, ChunkSource } from '../chunk_manager/frontend';
import { PerspectiveViewRenderLayer } from '../perspective_view/render_layer';
import { forEachVisibleSegment, getObjectKey } from '../segmentation_display_state/base';
import { getObjectColor, registerRedrawWhenSegmentationDisplayState3DChanged, SegmentationLayerSharedObject } from '../segmentation_display_state/frontend';
import { SKELETON_LAYER_RPC_ID } from './base';
import { SliceViewPanelRenderLayer } from '../sliceview/panel';
import { TrackableValue, WatchableValue } from '../trackable_value';
import { DataType } from '../util/data_type';
import { RefCounted } from '../util/disposable';
import { mat4 } from '../util/geom';
import { verifyFinitePositiveFloat, verifyString } from '../util/json';
import { NullarySignal } from '../util/signal';
import { CompoundTrackable } from '../util/trackable';
import { TrackableEnum } from '../util/trackable_enum';
import { Buffer } from '../webgl/buffer';
import { CircleShader } from '../webgl/circles';
import { parameterizedEmitterDependentShaderGetter } from '../webgl/dynamic_shader';
import { LineShader } from '../webgl/lines';
import { compute1dTextureLayout, computeTextureFormat, getSamplerPrefixForDataType, OneDimensionalTextureAccessHelper, setOneDimensionalTextureData, TextureFormat } from '../webgl/texture_access';
import { colormaps } from '../webgl/colormaps';
var glsl_COLORMAPS = colormaps();
var tempMat2 = mat4.create();
var DEFAULT_FRAGMENT_MAIN = 'void main() {\n  emitDefault();\n}\n';
export var FRAGMENT_MAIN_START = '//NEUROGLANCER_SKELETON_LAYER_FRAGMENT_MAIN_START';
export function getTrackableFragmentMain() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_FRAGMENT_MAIN;

    return new TrackableValue(value, verifyString);
}
var vertexAttributeSamplerSymbols = [];
var vertexPositionTextureFormat = computeTextureFormat(new TextureFormat(), DataType.FLOAT32, 3);

var RenderHelper = function (_RefCounted) {
    _inherits(RenderHelper, _RefCounted);

    function RenderHelper(base, targetIsSliceView) {
        _classCallCheck(this, RenderHelper);

        var _this = _possibleConstructorReturn(this, (RenderHelper.__proto__ || _Object$getPrototypeOf(RenderHelper)).call(this));

        _this.base = base;
        _this.targetIsSliceView = targetIsSliceView;
        _this.textureAccessHelper = new OneDimensionalTextureAccessHelper('vertexData');
        _this.lineShader = _this.registerDisposer(new LineShader(_this.gl, 1));
        _this.circleShader = _this.registerDisposer(new CircleShader(_this.gl, 2));
        _this.edgeShaderGetter = parameterizedEmitterDependentShaderGetter(_this, _this.gl, { type: 'skeleton/SkeletonShaderManager/edge', vertexAttributes: _this.vertexAttributes }, _this.base.fallbackFragmentMain, _this.base.displayState.skeletonRenderingOptions.shader, _this.base.displayState.shaderError, function (builder, fragmentMain) {
            _this.defineAttributeAccess(builder);
            _this.lineShader.defineShader(builder);
            builder.addAttribute('highp uvec2', 'aVertexIndex');
            _this.defineCommonShader(builder);
            var vertexMain = '\nhighp vec3 vertexA = readAttribute0(aVertexIndex.x);\nhighp vec3 vertexB = readAttribute0(aVertexIndex.y);\nemitLine(uProjection, vertexA, vertexB);\nhighp uint lineEndpointIndex = getLineEndpointIndex();\nhighp uint vertexIndex = aVertexIndex.x * lineEndpointIndex + aVertexIndex.y * (1u - lineEndpointIndex);\n';
            builder.addFragmentCode('\nvec4 segmentColor() {\n  return uColor;\n}\nvoid emitRGB(vec3 color) {\n  emit(vec4(color * uColor.a, uColor.a * getLineAlpha() * ' + _this.getCrossSectionFadeFactor() + '), uPickID);\n}\nvoid emitDefault() {\n  //emit(vec4(uColor.rgb, uColor.a * ' + _this.getCrossSectionFadeFactor() + '), uPickID);\n  emit(vec4(uColor.rgb, uColor.a * getLineAlpha() * ' + _this.getCrossSectionFadeFactor() + '), uPickID);\n}\n');
            builder.addFragmentCode(glsl_COLORMAPS);
            var vertexAttributes = _this.vertexAttributes;

            var numAttributes = vertexAttributes.length;
            for (var i = 1; i < numAttributes; ++i) {
                var info = vertexAttributes[i];
                builder.addVarying('highp ' + info.glslDataType, 'vCustom' + i);
                vertexMain += 'vCustom' + i + ' = readAttribute' + i + '(vertexIndex);\n';
                builder.addFragmentCode('#define ' + info.name + ' vCustom' + i + '\n');
            }
            builder.setVertexMain(vertexMain);
            builder.setFragmentMainFunction(FRAGMENT_MAIN_START + '\n' + fragmentMain);
        });
        _this.nodeShaderGetter = parameterizedEmitterDependentShaderGetter(_this, _this.gl, { type: 'skeleton/SkeletonShaderManager/node', vertexAttributes: _this.vertexAttributes }, _this.base.fallbackFragmentMain, _this.base.displayState.skeletonRenderingOptions.shader, _this.base.displayState.shaderError, function (builder, fragmentMain) {
            _this.defineAttributeAccess(builder);
            _this.circleShader.defineShader(builder, /*crossSectionFade=*/_this.targetIsSliceView);
            _this.defineCommonShader(builder);
            var vertexMain = '\nhighp uint vertexIndex = uint(gl_InstanceID);\nhighp vec3 vertexPosition = readAttribute0(vertexIndex);\nemitCircle(uProjection * vec4(vertexPosition, 1.0));\n';
            builder.addFragmentCode('\nvec4 segmentColor() {\n  return uColor;\n}\nvoid emitRGBA(vec4 color) {\n  vec4 borderColor = color;\n  emit(getCircleColor(color, borderColor), uPickID);\n}\nvoid emitRGB(vec3 color) {\n  emitRGBA(vec4(color, 1.0));\n}\nvoid emitDefault() {\n  emitRGBA(uColor);\n}\n');
            builder.addFragmentCode(glsl_COLORMAPS);
            var vertexAttributes = _this.vertexAttributes;

            var numAttributes = vertexAttributes.length;
            for (var i = 1; i < numAttributes; ++i) {
                var info = vertexAttributes[i];
                builder.addVarying('highp ' + info.glslDataType, 'vCustom' + i);
                vertexMain += 'vCustom' + i + ' = readAttribute' + i + '(vertexIndex);\n';
                builder.addFragmentCode('#define ' + info.name + ' vCustom' + i + '\n');
            }
            builder.setVertexMain(vertexMain);
            builder.setFragmentMainFunction(FRAGMENT_MAIN_START + '\n' + fragmentMain);
        });
        return _this;
    }

    _createClass(RenderHelper, [{
        key: 'defineCommonShader',
        value: function defineCommonShader(builder) {
            builder.addUniform('highp vec4', 'uColor');
            builder.addUniform('highp mat4', 'uProjection');
            builder.addUniform('highp uint', 'uPickID');
        }
    }, {
        key: 'defineAttributeAccess',
        value: function defineAttributeAccess(builder) {
            var textureAccessHelper = this.textureAccessHelper;

            textureAccessHelper.defineShader(builder);
            var numAttributes = this.vertexAttributes.length;
            for (var j = vertexAttributeSamplerSymbols.length; j < numAttributes; ++j) {
                vertexAttributeSamplerSymbols[j] = _Symbol('SkeletonShader.vertexAttributeTextureUnit' + j);
            }
            this.vertexAttributes.forEach(function (info, i) {
                builder.addTextureSampler(getSamplerPrefixForDataType(info.dataType) + 'sampler2D', 'uVertexAttributeSampler' + i, vertexAttributeSamplerSymbols[i]);
                builder.addVertexCode(textureAccessHelper.getAccessor('readAttribute' + i, 'uVertexAttributeSampler' + i, info.dataType, info.numComponents));
            });
        }
    }, {
        key: 'getCrossSectionFadeFactor',
        value: function getCrossSectionFadeFactor() {
            if (this.targetIsSliceView) {
                return '(clamp(1.0 - 2.0 * abs(0.5 - gl_FragCoord.z), 0.0, 1.0))';
            } else {
                return '(1.0)';
            }
        }
    }, {
        key: 'beginLayer',
        value: function beginLayer(gl, shader, renderContext, objectToDataMatrix) {
            var dataToDevice = renderContext.dataToDevice;

            var mat = mat4.multiply(tempMat2, dataToDevice, objectToDataMatrix);
            gl.uniformMatrix4fv(shader.uniform('uProjection'), false, mat);
        }
    }, {
        key: 'setColor',
        value: function setColor(gl, shader, color) {
            gl.uniform4fv(shader.uniform('uColor'), color);
        }
    }, {
        key: 'setPickID',
        value: function setPickID(gl, shader, pickID) {
            gl.uniform1ui(shader.uniform('uPickID'), pickID);
        }
    }, {
        key: 'drawSkeleton',
        value: function drawSkeleton(gl, edgeShader, nodeShader, skeletonChunk, renderContext, lineWidth, pointDiameter) {
            var vertexAttributes = this.vertexAttributes;

            var numAttributes = vertexAttributes.length;
            var vertexAttributeTextures = skeletonChunk.vertexAttributeTextures;

            for (var i = 0; i < numAttributes; ++i) {
                var textureUnit = WebGL2RenderingContext.TEXTURE0 + edgeShader.textureUnit(vertexAttributeSamplerSymbols[i]);
                gl.activeTexture(textureUnit);
                gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, vertexAttributeTextures[i]);
            }
            // Draw edges
            {
                edgeShader.bind();
                this.textureAccessHelper.setupTextureLayout(gl, edgeShader, skeletonChunk);
                var aVertexIndex = edgeShader.attribute('aVertexIndex');
                skeletonChunk.indexBuffer.bindToVertexAttribI(aVertexIndex, 2, WebGL2RenderingContext.UNSIGNED_INT);
                gl.vertexAttribDivisor(aVertexIndex, 1);
                this.lineShader.draw(edgeShader, renderContext, lineWidth, this.targetIsSliceView ? 1.0 : 0.0, skeletonChunk.numIndices / 2);
                gl.vertexAttribDivisor(aVertexIndex, 0);
                gl.disableVertexAttribArray(aVertexIndex);
            }
            if (nodeShader !== null) {
                nodeShader.bind();
                this.textureAccessHelper.setupTextureLayout(gl, nodeShader, skeletonChunk);
                this.circleShader.draw(nodeShader, renderContext, {
                    interiorRadiusInPixels: pointDiameter / 2,
                    borderWidthInPixels: 0,
                    featherWidthInPixels: this.targetIsSliceView ? 1.0 : 0.0
                }, skeletonChunk.numVertices);
            }
        }
    }, {
        key: 'endLayer',
        value: function endLayer(gl, shader) {
            var vertexAttributes = this.vertexAttributes;

            var numAttributes = vertexAttributes.length;
            for (var i = 0; i < numAttributes; ++i) {
                var curTextureUnit = shader.textureUnit(vertexAttributeSamplerSymbols[i]) + WebGL2RenderingContext.TEXTURE0;
                gl.activeTexture(curTextureUnit);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
    }, {
        key: 'vertexAttributes',
        get: function get() {
            return this.base.vertexAttributes;
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.base.gl;
        }
    }]);

    return RenderHelper;
}(RefCounted);

export var SkeletonRenderMode;
(function (SkeletonRenderMode) {
    SkeletonRenderMode[SkeletonRenderMode["LINES"] = 0] = "LINES";
    SkeletonRenderMode[SkeletonRenderMode["LINES_AND_POINTS"] = 1] = "LINES_AND_POINTS";
})(SkeletonRenderMode || (SkeletonRenderMode = {}));
export var TrackableSkeletonRenderMode = function (_TrackableEnum) {
    _inherits(TrackableSkeletonRenderMode, _TrackableEnum);

    function TrackableSkeletonRenderMode(value) {
        var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : value;

        _classCallCheck(this, TrackableSkeletonRenderMode);

        return _possibleConstructorReturn(this, (TrackableSkeletonRenderMode.__proto__ || _Object$getPrototypeOf(TrackableSkeletonRenderMode)).call(this, SkeletonRenderMode, value, defaultValue));
    }

    return TrackableSkeletonRenderMode;
}(TrackableEnum);
export var TrackableSkeletonLineWidth = function (_TrackableValue) {
    _inherits(TrackableSkeletonLineWidth, _TrackableValue);

    function TrackableSkeletonLineWidth(value) {
        var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : value;

        _classCallCheck(this, TrackableSkeletonLineWidth);

        return _possibleConstructorReturn(this, (TrackableSkeletonLineWidth.__proto__ || _Object$getPrototypeOf(TrackableSkeletonLineWidth)).call(this, value, verifyFinitePositiveFloat, defaultValue));
    }

    return TrackableSkeletonLineWidth;
}(TrackableValue);
export var SkeletonRenderingOptions = function () {
    function SkeletonRenderingOptions() {
        _classCallCheck(this, SkeletonRenderingOptions);

        this.compound = new CompoundTrackable();
        this.shader = getTrackableFragmentMain();
        this.params2d = {
            mode: new TrackableSkeletonRenderMode(SkeletonRenderMode.LINES_AND_POINTS),
            lineWidth: new TrackableSkeletonLineWidth(5)
        };
        this.params3d = {
            mode: new TrackableSkeletonRenderMode(SkeletonRenderMode.LINES),
            lineWidth: new TrackableSkeletonLineWidth(2)
        };
        var compound = this.compound;

        compound.add('shader', this.shader);
        compound.add('mode2d', this.params2d.mode);
        compound.add('lineWidth2d', this.params2d.lineWidth);
        compound.add('mode3d', this.params3d.mode);
        compound.add('lineWidth3d', this.params3d.lineWidth);
    }

    _createClass(SkeletonRenderingOptions, [{
        key: 'reset',
        value: function reset() {
            this.compound.reset();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            if (obj === undefined) return;
            this.compound.restoreState(obj);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var obj = this.compound.toJSON();
            for (var _ in obj) {
                return obj;
            }return undefined;
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.compound.changed;
        }
    }]);

    return SkeletonRenderingOptions;
}();
export var SkeletonLayer = function (_RefCounted2) {
    _inherits(SkeletonLayer, _RefCounted2);

    function SkeletonLayer(chunkManager, source, voxelSizeObject, displayState) {
        _classCallCheck(this, SkeletonLayer);

        var _this4 = _possibleConstructorReturn(this, (SkeletonLayer.__proto__ || _Object$getPrototypeOf(SkeletonLayer)).call(this));

        _this4.chunkManager = chunkManager;
        _this4.source = source;
        _this4.voxelSizeObject = voxelSizeObject;
        _this4.displayState = displayState;
        _this4.tempMat = mat4.create();
        _this4.redrawNeeded = new NullarySignal();
        _this4.fallbackFragmentMain = new WatchableValue(DEFAULT_FRAGMENT_MAIN);
        registerRedrawWhenSegmentationDisplayState3DChanged(displayState, _this4);
        _this4.displayState.shaderError.value = undefined;
        var renderingOptions = displayState.skeletonRenderingOptions;

        _this4.registerDisposer(renderingOptions.shader.changed.add(function () {
            _this4.displayState.shaderError.value = undefined;
            _this4.redrawNeeded.dispatch();
        }));
        var sharedObject = _this4.sharedObject = _this4.registerDisposer(new SegmentationLayerSharedObject(chunkManager, displayState));
        sharedObject.RPC_TYPE_ID = SKELETON_LAYER_RPC_ID;
        sharedObject.initializeCounterpartWithChunkManager({
            'source': source.addCounterpartRef()
        });
        var vertexAttributes = _this4.vertexAttributes = [vertexPositionAttribute];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(source.vertexAttributes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ref = _step.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var name = _ref2[0];
                var info = _ref2[1];

                vertexAttributes.push({
                    name: name,
                    dataType: info.dataType,
                    numComponents: info.numComponents,
                    webglDataType: getWebglDataType(info.dataType),
                    glslDataType: info.numComponents > 1 ? 'vec' + info.numComponents : 'float'
                });
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

        return _this4;
    }

    _createClass(SkeletonLayer, [{
        key: 'draw',
        value: function draw(renderContext, layer, renderHelper, renderOptions) {
            var lineWidth = renderOptions.lineWidth.value;
            var gl = this.gl,
                source = this.source,
                displayState = this.displayState;

            var alpha = Math.min(1.0, displayState.objectAlpha.value);
            if (alpha <= 0.0) {
                // Skip drawing.
                return;
            }
            var pointDiameter = void 0;
            if (renderOptions.mode.value === SkeletonRenderMode.LINES_AND_POINTS) {
                pointDiameter = Math.max(10, lineWidth * 2);
            } else {
                pointDiameter = lineWidth;
            }
            var edgeShader = renderHelper.edgeShaderGetter(renderContext.emitter);
            var nodeShader = renderHelper.nodeShaderGetter(renderContext.emitter);
            if (edgeShader === null || nodeShader === null) {
                // Shader error, skip drawing.
                return;
            }
            var objectToDataMatrix = this.tempMat;
            mat4.identity(objectToDataMatrix);
            if (source.skeletonVertexCoordinatesInVoxels) {
                mat4.scale(objectToDataMatrix, objectToDataMatrix, this.voxelSizeObject.size);
            }
            mat4.multiply(objectToDataMatrix, objectToDataMatrix, source.transform);
            mat4.multiply(objectToDataMatrix, this.displayState.objectToDataTransform.transform, objectToDataMatrix);
            edgeShader.bind();
            renderHelper.beginLayer(gl, edgeShader, renderContext, objectToDataMatrix);
            nodeShader.bind();
            renderHelper.beginLayer(gl, nodeShader, renderContext, objectToDataMatrix);
            var skeletons = source.chunks;
            var pickIDs = renderContext.pickIDs;

            forEachVisibleSegment(displayState, function (objectId, rootObjectId) {
                var key = getObjectKey(objectId);
                var skeleton = skeletons.get(key);
                if (skeleton === undefined || skeleton.state !== ChunkState.GPU_MEMORY) {
                    return;
                }
                if (renderContext.emitColor) {
                    edgeShader.bind();
                    renderHelper.setColor(gl, edgeShader, getObjectColor(displayState, rootObjectId, alpha));
                    nodeShader.bind();
                    renderHelper.setColor(gl, nodeShader, getObjectColor(displayState, rootObjectId, alpha));
                }
                if (renderContext.emitPickID) {
                    edgeShader.bind();
                    renderHelper.setPickID(gl, edgeShader, pickIDs.registerUint64(layer, objectId));
                    nodeShader.bind();
                    renderHelper.setPickID(gl, nodeShader, pickIDs.registerUint64(layer, objectId));
                }
                renderHelper.drawSkeleton(gl, edgeShader, nodeShader, skeleton, renderContext, lineWidth, pointDiameter);
            });
            renderHelper.endLayer(gl, edgeShader);
        }
    }, {
        key: 'visibility',
        get: function get() {
            return this.sharedObject.visibility;
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.chunkManager.chunkQueueManager.gl;
        }
    }]);

    return SkeletonLayer;
}(RefCounted);
export var PerspectiveViewSkeletonLayer = function (_PerspectiveViewRende) {
    _inherits(PerspectiveViewSkeletonLayer, _PerspectiveViewRende);

    function PerspectiveViewSkeletonLayer(base) {
        _classCallCheck(this, PerspectiveViewSkeletonLayer);

        var _this5 = _possibleConstructorReturn(this, (PerspectiveViewSkeletonLayer.__proto__ || _Object$getPrototypeOf(PerspectiveViewSkeletonLayer)).call(this));

        _this5.base = base;
        _this5.renderHelper = _this5.registerDisposer(new RenderHelper(_this5.base, false));
        _this5.renderOptions = _this5.base.displayState.skeletonRenderingOptions.params3d;
        _this5.registerDisposer(base);
        _this5.registerDisposer(base.redrawNeeded.add(_this5.redrawNeeded.dispatch));
        var renderOptions = _this5.renderOptions;

        _this5.registerDisposer(renderOptions.mode.changed.add(_this5.redrawNeeded.dispatch));
        _this5.registerDisposer(renderOptions.lineWidth.changed.add(_this5.redrawNeeded.dispatch));
        _this5.setReady(true);
        _this5.registerDisposer(base.visibility.add(_this5.visibility));
        return _this5;
    }

    _createClass(PerspectiveViewSkeletonLayer, [{
        key: 'draw',
        value: function draw(renderContext) {
            if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
                // No need for a separate pick ID pass.
                return;
            }
            this.base.draw(renderContext, this, this.renderHelper, this.renderOptions);
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.base.gl;
        }
    }, {
        key: 'isTransparent',
        get: function get() {
            return this.base.displayState.objectAlpha.value < 1.0;
        }
    }]);

    return PerspectiveViewSkeletonLayer;
}(PerspectiveViewRenderLayer);
export var SliceViewPanelSkeletonLayer = function (_SliceViewPanelRender) {
    _inherits(SliceViewPanelSkeletonLayer, _SliceViewPanelRender);

    function SliceViewPanelSkeletonLayer(base) {
        _classCallCheck(this, SliceViewPanelSkeletonLayer);

        var _this6 = _possibleConstructorReturn(this, (SliceViewPanelSkeletonLayer.__proto__ || _Object$getPrototypeOf(SliceViewPanelSkeletonLayer)).call(this));

        _this6.base = base;
        _this6.renderHelper = _this6.registerDisposer(new RenderHelper(_this6.base, true));
        _this6.renderOptions = _this6.base.displayState.skeletonRenderingOptions.params2d;
        _this6.registerDisposer(base);
        var renderOptions = _this6.renderOptions;

        _this6.registerDisposer(renderOptions.mode.changed.add(_this6.redrawNeeded.dispatch));
        _this6.registerDisposer(renderOptions.lineWidth.changed.add(_this6.redrawNeeded.dispatch));
        _this6.registerDisposer(base.redrawNeeded.add(_this6.redrawNeeded.dispatch));
        _this6.setReady(true);
        _this6.registerDisposer(base.visibility.add(_this6.visibility));
        return _this6;
    }

    _createClass(SliceViewPanelSkeletonLayer, [{
        key: 'draw',
        value: function draw(renderContext) {
            this.base.draw(renderContext, this, this.renderHelper, this.renderOptions);
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.base.gl;
        }
    }]);

    return SliceViewPanelSkeletonLayer;
}(SliceViewPanelRenderLayer);
function getWebglDataType(dataType) {
    switch (dataType) {
        case DataType.FLOAT32:
            return WebGL2RenderingContext.FLOAT;
        default:
            throw new Error('Data type not supported by WebGL: ${DataType[dataType]}');
    }
}
var vertexPositionAttribute = {
    dataType: DataType.FLOAT32,
    numComponents: 3,
    name: '',
    webglDataType: WebGL2RenderingContext.FLOAT,
    glslDataType: 'vec3'
};
export var SkeletonChunk = function (_Chunk) {
    _inherits(SkeletonChunk, _Chunk);

    function SkeletonChunk(source, x) {
        _classCallCheck(this, SkeletonChunk);

        var _this7 = _possibleConstructorReturn(this, (SkeletonChunk.__proto__ || _Object$getPrototypeOf(SkeletonChunk)).call(this, source));

        _this7.vertexAttributes = x['vertexAttributes'];
        var indices = _this7.indices = x['indices'];
        _this7.numVertices = x['numVertices'];
        _this7.vertexAttributeOffsets = x['vertexAttributeOffsets'];
        _this7.numIndices = indices.length;
        return _this7;
    }

    _createClass(SkeletonChunk, [{
        key: 'copyToGPU',
        value: function copyToGPU(gl) {
            _get(SkeletonChunk.prototype.__proto__ || _Object$getPrototypeOf(SkeletonChunk.prototype), 'copyToGPU', this).call(this, gl);
            compute1dTextureLayout(this, gl, /*texelsPerElement=*/1, this.numVertices);
            var attributeTextureFormats = this.source.attributeTextureFormats;
            var vertexAttributes = this.vertexAttributes,
                vertexAttributeOffsets = this.vertexAttributeOffsets;

            var vertexAttributeTextures = this.vertexAttributeTextures = [];
            for (var i = 0, numAttributes = vertexAttributeOffsets.length; i < numAttributes; ++i) {
                var texture = gl.createTexture();
                gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);
                setOneDimensionalTextureData(gl, this, attributeTextureFormats[i], vertexAttributes.subarray(vertexAttributeOffsets[i], i + 1 !== numAttributes ? vertexAttributeOffsets[i + 1] : vertexAttributes.length));
                vertexAttributeTextures[i] = texture;
            }
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, null);
            this.indexBuffer = Buffer.fromData(gl, this.indices, WebGL2RenderingContext.ARRAY_BUFFER, WebGL2RenderingContext.STATIC_DRAW);
        }
    }, {
        key: 'freeGPUMemory',
        value: function freeGPUMemory(gl) {
            _get(SkeletonChunk.prototype.__proto__ || _Object$getPrototypeOf(SkeletonChunk.prototype), 'freeGPUMemory', this).call(this, gl);
            var vertexAttributeTextures = this.vertexAttributeTextures;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(vertexAttributeTextures), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var texture = _step2.value;

                    gl.deleteTexture(texture);
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

            vertexAttributeTextures.length = 0;
            this.indexBuffer.dispose();
        }
    }]);

    return SkeletonChunk;
}(Chunk);
var emptyVertexAttributes = new _Map();
function getAttributeTextureFormats(vertexAttributes) {
    var attributeTextureFormats = [vertexPositionTextureFormat];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(vertexAttributes.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var info = _step3.value;

            attributeTextureFormats.push(computeTextureFormat(new TextureFormat(), info.dataType, info.numComponents));
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

    return attributeTextureFormats;
}
export var SkeletonSource = function (_ChunkSource) {
    _inherits(SkeletonSource, _ChunkSource);

    _createClass(SkeletonSource, [{
        key: 'getChunk',
        value: function getChunk(x) {
            return new SkeletonChunk(this, x);
        }
    }, {
        key: 'attributeTextureFormats',
        get: function get() {
            var attributeTextureFormats = this.attributeTextureFormats_;
            if (attributeTextureFormats === undefined) {
                attributeTextureFormats = this.attributeTextureFormats_ = getAttributeTextureFormats(this.vertexAttributes);
            }
            return attributeTextureFormats;
        }
    }]);

    function SkeletonSource(chunkManager, options) {
        _classCallCheck(this, SkeletonSource);

        var _this8 = _possibleConstructorReturn(this, (SkeletonSource.__proto__ || _Object$getPrototypeOf(SkeletonSource)).call(this, chunkManager, options));

        var _options$transform = options.transform,
            transform = _options$transform === undefined ? mat4.create() : _options$transform;

        _this8.transform = transform;
        return _this8;
    }
    /**
     * Specifies whether the skeleton vertex coordinates are specified in units of voxels rather than
     * nanometers.
     */


    _createClass(SkeletonSource, [{
        key: 'skeletonVertexCoordinatesInVoxels',
        get: function get() {
            return true;
        }
    }, {
        key: 'vertexAttributes',
        get: function get() {
            return emptyVertexAttributes;
        }
    }]);

    return SkeletonSource;
}(ChunkSource);
//# sourceMappingURL=frontend.js.map