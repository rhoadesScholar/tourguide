import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Symbol from 'babel-runtime/core-js/symbol';
import _createClass from 'babel-runtime/helpers/createClass';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import { Chunk, ChunkSource, WithParameters } from '../chunk_manager/frontend';
import { CoordinateTransform } from '../coordinate_transform';
import { PerspectiveViewRenderLayer } from '../perspective_view/render_layer';
import { GET_SINGLE_MESH_INFO_RPC_ID, SINGLE_MESH_CHUNK_KEY, SINGLE_MESH_LAYER_RPC_ID, SingleMeshSourceParametersWithInfo } from './base';
import { TrackableValue } from '../trackable_value';
import { DataType } from '../util/data_type';
import { vec3 } from '../util/geom';
import { parseArray, stableStringify, verifyOptionalString, verifyString } from '../util/json';
import { getObjectId } from '../util/object_id';
import { withSharedVisibility } from '../visibility_priority/frontend';
import glsl_COLORMAPS from 'neuroglancer/webgl/colormaps.glsl';
import { makeWatchableShaderError } from '../webgl/dynamic_shader';
import { countingBufferShaderModule, disableCountingBuffer, getCountingBuffer, IndexBufferAttributeHelper, makeIndexBuffer } from '../webgl/index_emulation';
import { ShaderBuilder } from '../webgl/shader';
import { getShaderType } from '../webgl/shader_lib';
import { compute1dTextureLayout, computeTextureFormat, getSamplerPrefixForDataType, OneDimensionalTextureAccessHelper, setOneDimensionalTextureData, TextureFormat } from '../webgl/texture_access';
import { SharedObject } from '../worker_rpc';
export var FRAGMENT_MAIN_START = '//NEUROGLANCER_SINGLE_MESH_LAYER_FRAGMENT_MAIN_START';
var DEFAULT_FRAGMENT_MAIN = 'void main() {\n  emitGray();\n}\n';
export function getTrackableFragmentMain() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_FRAGMENT_MAIN;

    return new TrackableValue(value, verifyString);
}
export function getTrackableAttributeNames() {
    return new TrackableValue([], function (x) {
        return parseArray(x, verifyOptionalString);
    });
}
export var SingleMeshDisplayState = function SingleMeshDisplayState() {
    _classCallCheck(this, SingleMeshDisplayState);

    this.shaderError = makeWatchableShaderError();
    this.fragmentMain = getTrackableFragmentMain();
    this.attributeNames = getTrackableAttributeNames();
    this.objectToDataTransform = new CoordinateTransform();
};
export function getShaderAttributeType(info) {
    return getShaderType(info.dataType, info.numComponents);
}
var vertexAttributeSamplerSymbols = [];
var vertexPositionTextureFormat = computeTextureFormat(new TextureFormat(), DataType.FLOAT32, 3);
var vertexNormalTextureFormat = vertexPositionTextureFormat;
export var SingleMeshShaderManager = function () {
    function SingleMeshShaderManager(attributeNames, attributeInfo, fragmentMain) {
        _classCallCheck(this, SingleMeshShaderManager);

        this.attributeNames = attributeNames;
        this.attributeInfo = attributeInfo;
        this.fragmentMain = fragmentMain;
        this.tempLightVec = new Float32Array(4);
        this.textureAccessHelper = new OneDimensionalTextureAccessHelper('vertexData');
        this.indexBufferHelper = new IndexBufferAttributeHelper('vertexIndex');
    }

    _createClass(SingleMeshShaderManager, [{
        key: 'defineAttributeAccess',
        value: function defineAttributeAccess(builder, vertexIndexVariable) {
            var textureAccessHelper = this.textureAccessHelper;

            textureAccessHelper.defineShader(builder);
            var numAttributes = 2;
            var attributeNames = this.attributeNames;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(attributeNames), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attributeName = _step.value;

                    if (attributeName !== undefined) {
                        ++numAttributes;
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

            for (var j = vertexAttributeSamplerSymbols.length; j < numAttributes; ++j) {
                vertexAttributeSamplerSymbols[j] = _Symbol('SingleMeshShaderManager.vertexAttributeTextureUnit' + j);
            }
            numAttributes = 0;
            builder.addTextureSampler('sampler2D', 'uVertexAttributeSampler0', vertexAttributeSamplerSymbols[numAttributes++]);
            builder.addTextureSampler('sampler2D', 'uVertexAttributeSampler1', vertexAttributeSamplerSymbols[numAttributes++]);
            builder.addVertexCode(textureAccessHelper.getAccessor('readVertexPosition', 'uVertexAttributeSampler0', DataType.FLOAT32, 3));
            builder.addVertexCode(textureAccessHelper.getAccessor('readVertexNormal', 'uVertexAttributeSampler1', DataType.FLOAT32, 3));
            var vertexMain = '\nvec3 vertexPosition = readVertexPosition(' + vertexIndexVariable + ');\nvec3 vertexNormal = readVertexNormal(' + vertexIndexVariable + ');\n';
            this.attributeInfo.forEach(function (info, i) {
                var attributeName = attributeNames[i];
                if (attributeName !== undefined) {
                    builder.addTextureSampler(getSamplerPrefixForDataType(info.dataType) + 'sampler2D', 'uVertexAttributeSampler' + numAttributes, vertexAttributeSamplerSymbols[numAttributes]);
                    var attributeType = getShaderAttributeType(info);
                    builder.addVarying('highp ' + attributeType, 'vCustom' + i);
                    builder.addFragmentCode('\n#define ' + attributeNames[i] + ' vCustom' + i + '\n');
                    builder.addVertexCode(textureAccessHelper.getAccessor('readAttribute' + i, 'uVertexAttributeSampler' + numAttributes, info.dataType, info.numComponents));
                    vertexMain += 'vCustom' + i + ' = readAttribute' + i + '(' + vertexIndexVariable + ');\n';
                    ++numAttributes;
                }
            });
            builder.addVertexMain(vertexMain);
        }
    }, {
        key: 'defineShader',
        value: function defineShader(builder) {
            builder.require(countingBufferShaderModule);
            this.indexBufferHelper.defineShader(builder);
            builder.addVarying('highp float', 'vLightingFactor');
            builder.addUniform('highp vec4', 'uLightDirection');
            builder.addUniform('highp vec4', 'uColor');
            builder.addUniform('highp mat4', 'uModelMatrix');
            builder.addUniform('highp mat4', 'uProjection');
            builder.addUniform('highp uint', 'uPickID');
            builder.addVarying('highp uint', 'vPickID', 'flat');
            builder.addVertexMain('\nuint triangleIndex = getPrimitiveIndex() / 3u;\nvPickID = uPickID + triangleIndex;\n');
            builder.addFragmentCode('\nvoid emitPremultipliedRGBA(vec4 color) {\n  emit(vec4(color.rgb * vLightingFactor, color.a), vPickID);\n}\nvoid emitRGBA(vec4 color) {\n  color = clamp(color, 0.0, 1.0);\n  color.xyz *= color.a;\n  emitPremultipliedRGBA(color);\n}\nvoid emitRGB(vec3 color) {\n  emitRGBA(vec4(color, 1.0));\n}\nvoid emitGray() {\n  emitRGB(vec3(1.0, 1.0, 1.0));\n}\n');
            builder.addFragmentCode(glsl_COLORMAPS);
            // Make sure defineAttributeAccess is the last thing that adds fragment code prior to
            // this.fragmentMain, so that the #define attributes don't mess anything up.
            this.defineAttributeAccess(builder, 'vertexIndex');
            builder.addVertexMain('\ngl_Position = uProjection * (uModelMatrix * vec4(vertexPosition, 1.0));\nvec3 normal = normalize((uModelMatrix * vec4(vertexNormal, 0.0)).xyz);\nvLightingFactor = abs(dot(normal, uLightDirection.xyz)) + uLightDirection.w;\n');
            builder.setFragmentMainFunction(FRAGMENT_MAIN_START + '\n' + this.fragmentMain);
        }
    }, {
        key: 'beginLayer',
        value: function beginLayer(gl, shader, renderContext) {
            var dataToDevice = renderContext.dataToDevice,
                lightDirection = renderContext.lightDirection,
                ambientLighting = renderContext.ambientLighting,
                directionalLighting = renderContext.directionalLighting;

            gl.uniformMatrix4fv(shader.uniform('uProjection'), false, dataToDevice);
            var lightVec = this.tempLightVec;
            vec3.scale(lightVec, lightDirection, directionalLighting);
            lightVec[3] = ambientLighting;
            gl.uniform4fv(shader.uniform('uLightDirection'), lightVec);
        }
    }, {
        key: 'setPickID',
        value: function setPickID(gl, shader, pickID) {
            gl.uniform1ui(shader.uniform('uPickID'), pickID);
        }
    }, {
        key: 'beginObject',
        value: function beginObject(gl, shader, objectToDataMatrix) {
            gl.uniformMatrix4fv(shader.uniform('uModelMatrix'), false, objectToDataMatrix);
        }
    }, {
        key: 'getShader',
        value: function getShader(gl, emitter) {
            var _this = this;

            var key = {
                attributeNames: this.attributeNames,
                attributeInfo: this.attributeInfo,
                fragmentMain: this.fragmentMain
            };
            return gl.memoize.get('single_mesh/SingleMeshShaderManager:' + getObjectId(emitter) + ':' + stableStringify(key), function () {
                var builder = new ShaderBuilder(gl);
                builder.require(emitter);
                _this.defineShader(builder);
                return builder.build();
            });
        }
    }, {
        key: 'bindVertexData',
        value: function bindVertexData(gl, shader, data) {
            this.textureAccessHelper.setupTextureLayout(gl, shader, data);
            var index = 0;
            var bindTexture = function bindTexture(texture) {
                var textureUnit = WebGL2RenderingContext.TEXTURE0 + shader.textureUnit(vertexAttributeSamplerSymbols[index]);
                gl.activeTexture(textureUnit);
                gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);
                ++index;
            };
            bindTexture(data.vertexTexture);
            bindTexture(data.normalTexture);
            var attributeNames = this.attributeNames;

            data.vertexAttributeTextures.forEach(function (texture, i) {
                if (attributeNames[i] !== undefined) {
                    bindTexture(texture);
                }
            });
        }
    }, {
        key: 'disableVertexData',
        value: function disableVertexData(gl, shader) {
            var numTextures = 2;
            var numVertexAttributes = this.attributeInfo.length;
            var attributeNames = this.attributeNames;

            for (var i = 0; i < numVertexAttributes; ++i) {
                if (attributeNames[i] !== undefined) {
                    ++numTextures;
                }
            }
            for (var _i = 0; _i < numTextures; ++_i) {
                var curTextureUnit = shader.textureUnit(vertexAttributeSamplerSymbols[_i]) + WebGL2RenderingContext.TEXTURE0;
                gl.activeTexture(curTextureUnit);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
        }
    }, {
        key: 'drawFragment',
        value: function drawFragment(gl, shader, chunk, countingBuffer) {
            countingBuffer.ensure(chunk.numIndices).bind(shader);
            this.bindVertexData(gl, shader, chunk.vertexData);
            this.indexBufferHelper.bind(chunk.indexBuffer, shader);
            gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, chunk.numIndices);
        }
    }, {
        key: 'endLayer',
        value: function endLayer(gl, shader) {
            disableCountingBuffer(gl, shader);
            this.indexBufferHelper.disable(shader);
            this.disableVertexData(gl, shader);
        }
    }]);

    return SingleMeshShaderManager;
}();
export var VertexChunkData = function () {
    function VertexChunkData() {
        _classCallCheck(this, VertexChunkData);
    }

    _createClass(VertexChunkData, [{
        key: 'copyToGPU',
        value: function copyToGPU(gl, attributeFormats) {
            var _this2 = this;

            var numVertices = this.vertexPositions.length / 3;
            compute1dTextureLayout(this, gl, /*texelsPerElement=*/1, numVertices);
            var getBufferTexture = function getBufferTexture(data, format) {
                var texture = gl.createTexture();
                gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);
                setOneDimensionalTextureData(gl, _this2, format, data);
                return texture;
            };
            this.vertexTexture = getBufferTexture(this.vertexPositions, vertexPositionTextureFormat);
            this.normalTexture = getBufferTexture(this.vertexNormals, vertexNormalTextureFormat);
            this.vertexAttributeTextures = this.vertexAttributes.map(function (data, i) {
                return getBufferTexture(data, attributeFormats[i]);
            });
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, null);
        }
    }, {
        key: 'freeGPUMemory',
        value: function freeGPUMemory(gl) {
            gl.deleteTexture(this.vertexTexture);
            gl.deleteTexture(this.normalTexture);
            var vertexAttributeTextures = this.vertexAttributeTextures;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(vertexAttributeTextures), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var buffer = _step2.value;

                    gl.deleteTexture(buffer);
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
        }
    }]);

    return VertexChunkData;
}();
export var SingleMeshChunk = function (_Chunk) {
    _inherits(SingleMeshChunk, _Chunk);

    function SingleMeshChunk(source, x) {
        _classCallCheck(this, SingleMeshChunk);

        var _this3 = _possibleConstructorReturn(this, (SingleMeshChunk.__proto__ || _Object$getPrototypeOf(SingleMeshChunk)).call(this, source));

        var vertexData = _this3.vertexData = new VertexChunkData();
        vertexData.vertexPositions = x['vertexPositions'];
        vertexData.vertexNormals = x['vertexNormals'];
        vertexData.vertexAttributes = x['vertexAttributes'];
        var indices = _this3.indices = x['indices'];
        _this3.numIndices = indices.length;
        return _this3;
    }

    _createClass(SingleMeshChunk, [{
        key: 'copyToGPU',
        value: function copyToGPU(gl) {
            _get(SingleMeshChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshChunk.prototype), 'copyToGPU', this).call(this, gl);
            this.vertexData.copyToGPU(gl, this.source.attributeTextureFormats);
            this.indexBuffer = makeIndexBuffer(gl, this.indices);
        }
    }, {
        key: 'freeGPUMemory',
        value: function freeGPUMemory(gl) {
            _get(SingleMeshChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshChunk.prototype), 'freeGPUMemory', this).call(this, gl);
            this.vertexData.freeGPUMemory(gl);
            this.indexBuffer.dispose();
        }
    }]);

    return SingleMeshChunk;
}(Chunk);
export function getAttributeTextureFormats(vertexAttributes) {
    return vertexAttributes.map(function (x) {
        return computeTextureFormat(new TextureFormat(), x.dataType, x.numComponents);
    });
}
export var SingleMeshSource = function (_WithParameters) {
    _inherits(SingleMeshSource, _WithParameters);

    function SingleMeshSource() {
        _classCallCheck(this, SingleMeshSource);

        var _this4 = _possibleConstructorReturn(this, (SingleMeshSource.__proto__ || _Object$getPrototypeOf(SingleMeshSource)).apply(this, arguments));

        _this4.attributeTextureFormats = getAttributeTextureFormats(_this4.info.vertexAttributes);
        return _this4;
    }

    _createClass(SingleMeshSource, [{
        key: 'getChunk',
        value: function getChunk(x) {
            return new SingleMeshChunk(this, x);
        }
    }, {
        key: 'info',
        get: function get() {
            return this.parameters.info;
        }
    }]);

    return SingleMeshSource;
}(WithParameters(ChunkSource, SingleMeshSourceParametersWithInfo));
var SharedObjectWithSharedVisibility = withSharedVisibility(SharedObject);

var SingleMeshLayerSharedObject = function (_SharedObjectWithShar) {
    _inherits(SingleMeshLayerSharedObject, _SharedObjectWithShar);

    function SingleMeshLayerSharedObject() {
        _classCallCheck(this, SingleMeshLayerSharedObject);

        return _possibleConstructorReturn(this, (SingleMeshLayerSharedObject.__proto__ || _Object$getPrototypeOf(SingleMeshLayerSharedObject)).apply(this, arguments));
    }

    return SingleMeshLayerSharedObject;
}(SharedObjectWithSharedVisibility);

export var SingleMeshLayer = function (_PerspectiveViewRende) {
    _inherits(SingleMeshLayer, _PerspectiveViewRende);

    function SingleMeshLayer(source, displayState) {
        _classCallCheck(this, SingleMeshLayer);

        var _this6 = _possibleConstructorReturn(this, (SingleMeshLayer.__proto__ || _Object$getPrototypeOf(SingleMeshLayer)).call(this));

        _this6.source = source;
        _this6.displayState = displayState;
        _this6.shaders = new _Map();
        _this6.sharedObject = _this6.registerDisposer(new SingleMeshLayerSharedObject());
        _this6.fallbackFragmentMain = DEFAULT_FRAGMENT_MAIN;
        _this6.countingBuffer = _this6.registerDisposer(getCountingBuffer(_this6.gl));
        _this6.displayState.shaderError.value = undefined;
        var shaderChanged = function shaderChanged() {
            _this6.shaderManager = undefined;
            _this6.displayState.shaderError.value = undefined;
            _this6.disposeShaders();
            _this6.redrawNeeded.dispatch();
        };
        _this6.registerDisposer(displayState.fragmentMain.changed.add(shaderChanged));
        _this6.registerDisposer(displayState.attributeNames.changed.add(shaderChanged));
        _this6.registerDisposer(displayState.objectToDataTransform.changed.add(function () {
            _this6.redrawNeeded.dispatch();
        }));
        _this6.displayState.shaderError.value = undefined;
        var sharedObject = _this6.sharedObject;

        sharedObject.visibility.add(_this6.visibility);
        sharedObject.RPC_TYPE_ID = SINGLE_MESH_LAYER_RPC_ID;
        sharedObject.initializeCounterpart(source.chunkManager.rpc, {
            'chunkManager': source.chunkManager.rpcId,
            'source': source.addCounterpartRef()
        });
        _this6.setReady(true);
        return _this6;
    }

    _createClass(SingleMeshLayer, [{
        key: 'disposeShaders',
        value: function disposeShaders() {
            var shaders = this.shaders;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(shaders.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var shader = _step3.value;

                    if (shader !== null) {
                        shader.dispose();
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

            shaders.clear();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.disposeShaders();
            _get(SingleMeshLayer.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshLayer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'makeShaderManager',
        value: function makeShaderManager() {
            var fragmentMain = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.displayState.fragmentMain.value;

            return new SingleMeshShaderManager(this.displayState.attributeNames.value, this.source.info.vertexAttributes, fragmentMain);
        }
    }, {
        key: 'getShader',
        value: function getShader(emitter) {
            var shaders = this.shaders;

            var shader = shaders.get(emitter);
            if (shader === undefined) {
                shader = null;
                var shaderManager = this.shaderManager;

                if (shaderManager === undefined) {
                    shaderManager = this.shaderManager = this.makeShaderManager();
                }
                var fragmentMain = this.displayState.fragmentMain.value;
                try {
                    shader = shaderManager.getShader(this.gl, emitter);
                    this.fallbackFragmentMain = fragmentMain;
                    this.displayState.shaderError.value = null;
                } catch (shaderError) {
                    this.displayState.shaderError.value = shaderError;
                    var fallbackFragmentMain = this.fallbackFragmentMain;

                    if (fallbackFragmentMain !== fragmentMain) {
                        shaderManager = this.shaderManager = this.makeShaderManager(fallbackFragmentMain);
                        try {
                            shader = shaderManager.getShader(this.gl, emitter);
                        } catch (otherShaderError) {}
                    }
                }
                shaders.set(emitter, shader);
            }
            return shader;
        }
    }, {
        key: 'draw',
        value: function draw(renderContext) {
            if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
                // No need for a separate pick ID pass.
                return;
            }
            var chunk = this.source.chunks.get(SINGLE_MESH_CHUNK_KEY);
            if (chunk === undefined || chunk.state !== ChunkState.GPU_MEMORY) {
                return;
            }
            var shader = this.getShader(renderContext.emitter);
            if (shader === null) {
                return;
            }
            var gl = this.gl;

            var shaderManager = this.shaderManager;
            shader.bind();
            shaderManager.beginLayer(gl, shader, renderContext);
            var pickIDs = renderContext.pickIDs;

            shaderManager.beginObject(gl, shader, this.displayState.objectToDataTransform.transform);
            if (renderContext.emitPickID) {
                shaderManager.setPickID(gl, shader, pickIDs.register(this, chunk.numIndices / 3));
            }
            shaderManager.drawFragment(gl, shader, chunk, this.countingBuffer);
            shaderManager.endLayer(gl, shader);
        }
    }, {
        key: 'drawPicking',
        value: function drawPicking(renderContext) {
            this.draw(renderContext);
        }
    }, {
        key: 'transformPickedValue',
        value: function transformPickedValue(_pickedValue, pickedOffset) {
            var chunk = this.source.chunks.get(SINGLE_MESH_CHUNK_KEY);
            if (chunk === undefined) {
                return undefined;
            }
            var startIndex = pickedOffset * 3;
            var indices = chunk.indices;

            if (startIndex >= indices.length) {
                return undefined;
            }
            // FIXME: compute closest vertex position.  For now just use first vertex.
            var vertexIndex = indices[startIndex];
            var values = [];
            var attributeNames = this.displayState.attributeNames.value;
            chunk.vertexData.vertexAttributes.forEach(function (attributes, i) {
                var attributeName = attributeNames[i];
                if (attributeName !== undefined) {
                    values.push(attributeName + '=' + attributes[vertexIndex].toPrecision(6));
                }
            });
            return values.join(', ');
        }
    }, {
        key: 'isTransparent',
        get: function get() {
            return this.displayState.fragmentMain.value.match(/emitRGBA|emitPremultipliedRGBA/) !== null;
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.source.gl;
        }
    }]);

    return SingleMeshLayer;
}(PerspectiveViewRenderLayer);
function getSingleMeshInfo(chunkManager, parameters) {
    return chunkManager.memoize.getUncounted({ type: 'single_mesh:getMeshInfo', parameters: parameters }, function () {
        return chunkManager.rpc.promiseInvoke(GET_SINGLE_MESH_INFO_RPC_ID, { 'chunkManager': chunkManager.addCounterpartRef(), 'parameters': parameters });
    });
}
export function getSingleMeshSource(chunkManager, parameters) {
    return getSingleMeshInfo(chunkManager, parameters).then(function (info) {
        return chunkManager.getChunkSource(SingleMeshSource, { parameters: _Object$assign({}, parameters, { info: info }) });
    });
}
//# sourceMappingURL=frontend.js.map