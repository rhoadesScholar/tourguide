import _get from "babel-runtime/helpers/get";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _Map from "babel-runtime/core-js/map";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _defineProperty from "babel-runtime/helpers/defineProperty";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";

var _vertexPositionHandle;

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
import { ChunkState } from "../chunk_manager/base";
import { Chunk, ChunkSource } from "../chunk_manager/frontend";
import { FRAGMENT_SOURCE_RPC_ID, MESH_LAYER_RPC_ID, MULTISCALE_FRAGMENT_SOURCE_RPC_ID, MULTISCALE_MESH_LAYER_RPC_ID, VertexPositionFormat } from "./base";
import { getMultiscaleChunksToDraw, getMultiscaleFragmentKey } from "./multiscale";
import { PerspectiveViewRenderLayer } from "../perspective_view/render_layer";
import { forEachVisibleSegment, getObjectKey } from "../segmentation_display_state/base";
import { getObjectColor, registerRedrawWhenSegmentationDisplayState3DChanged, SegmentationLayerSharedObject } from "../segmentation_display_state/frontend";
import { getFrustrumPlanes, mat3, mat3FromMat4, mat4, vec3 } from "../util/geom";
import { getObjectId } from "../util/object_id";
import { Buffer } from "../webgl/buffer";
import { ShaderBuilder } from "../webgl/shader";
import { registerSharedObjectOwner } from "../worker_rpc";
var tempMat4 = mat4.create();
var tempModelMatrix = mat4.create();
var tempMat3 = mat3.create();
var DEBUG_MULTISCALE_FRAGMENTS = false;
function copyMeshDataToGpu(gl, chunk) {
    chunk.vertexBuffer = Buffer.fromData(gl, chunk.meshData.vertexPositions, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    chunk.indexBuffer = Buffer.fromData(gl, chunk.meshData.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
    chunk.normalBuffer = Buffer.fromData(gl, chunk.meshData.vertexNormals, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
}
function freeGpuMeshData(chunk) {
    chunk.vertexBuffer.dispose();
    chunk.indexBuffer.dispose();
    chunk.normalBuffer.dispose();
}
/**
 * Decodes normal vectors in 2xSnorm8 octahedron encoding into normalized 3x32f vector.
 *
 * Zina H. Cigolle, Sam Donow, Daniel Evangelakos, Michael Mara, Morgan McGuire, and Quirin Meyer,
 * Survey of Efficient Representations for Independent Unit Vectors, Journal of Computer Graphics
 * Techniques (JCGT), vol. 3, no. 2, 1-30, 2014
 *
 * Available online http://jcgt.org/published/0003/02/01/
 */
var glsl_decodeNormalOctahedronSnorm8 = "\nhighp vec3 decodeNormalOctahedronSnorm8(highp vec2 e) {\n  vec3 v = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));\n  if (v.z < 0.0) v.xy = (1.0 - abs(v.yx)) * vec2(v.x > 0.0 ? 1.0 : -1.0, v.y > 0.0 ? 1.0 : -1.0);\n  return normalize(v);\n}\n";
function getFloatPositionHandler(glAttributeType) {
    return {
        defineShader: function defineShader(builder) {
            builder.addAttribute('highp vec3', 'aVertexPosition');
            builder.addVertexCode("highp vec3 getVertexPosition() { return aVertexPosition; }");
        },
        bind: function bind(_gl, shader, fragmentChunk) {
            fragmentChunk.vertexBuffer.bindToVertexAttrib(shader.attribute('aVertexPosition'),
            /*components=*/3, glAttributeType, /* normalized=*/true);
        },

        endLayer: function endLayer(gl, shader) {
            gl.disableVertexAttribArray(shader.attribute('aVertexPosition'));
        }
    };
}
var vertexPositionHandlers = (_vertexPositionHandle = {}, _defineProperty(_vertexPositionHandle, VertexPositionFormat.float32, getFloatPositionHandler(WebGL2RenderingContext.FLOAT)), _defineProperty(_vertexPositionHandle, VertexPositionFormat.uint16, getFloatPositionHandler(WebGL2RenderingContext.UNSIGNED_SHORT)), _defineProperty(_vertexPositionHandle, VertexPositionFormat.uint10, {
    defineShader: function defineShader(builder) {
        builder.addAttribute('highp uint', 'aVertexPosition');
        builder.addVertexCode("\nhighp vec3 getVertexPosition() {\n  return vec3(float(aVertexPosition & 1023u),\n              float((aVertexPosition >> 10) & 1023u),\n              float((aVertexPosition >> 20) & 1023u)) / 1023.0;\n}\n");
    },
    bind: function bind(_gl, shader, fragmentChunk) {
        fragmentChunk.vertexBuffer.bindToVertexAttribI(shader.attribute('aVertexPosition'),
        /*components=*/1, WebGL2RenderingContext.UNSIGNED_INT);
    },

    endLayer: function endLayer(gl, shader) {
        gl.disableVertexAttribArray(shader.attribute('aVertexPosition'));
    }
}), _vertexPositionHandle);
export var MeshShaderManager = function () {
    function MeshShaderManager(fragmentRelativeVertices, vertexPositionFormat) {
        _classCallCheck(this, MeshShaderManager);

        this.fragmentRelativeVertices = fragmentRelativeVertices;
        this.vertexPositionFormat = vertexPositionFormat;
        this.tempLightVec = new Float32Array(4);
        this.vertexPositionHandler = vertexPositionHandlers[this.vertexPositionFormat];
    }

    _createClass(MeshShaderManager, [{
        key: "defineShader",
        value: function defineShader(builder) {
            this.vertexPositionHandler.defineShader(builder);
            builder.addAttribute('highp vec2', 'aVertexNormal');
            builder.addVarying('highp vec4', 'vColor');
            builder.addUniform('highp vec4', 'uLightDirection');
            builder.addUniform('highp vec4', 'uColor');
            builder.addUniform('highp mat3', 'uNormalMatrix');
            builder.addUniform('highp mat4', 'uModelViewProjection');
            builder.addUniform('highp uint', 'uPickID');
            if (this.fragmentRelativeVertices) {
                builder.addUniform('highp vec3', 'uFragmentOrigin');
                builder.addUniform('highp vec3', 'uFragmentShape');
            }
            builder.addVertexCode(glsl_decodeNormalOctahedronSnorm8);
            var vertexMain = "";
            if (this.fragmentRelativeVertices) {
                vertexMain += "\nhighp vec3 vertexPosition = uFragmentOrigin + uFragmentShape * getVertexPosition();\nhighp vec3 normalMultiplier = 1.0 / uFragmentShape;\n";
            } else {
                vertexMain += "\nhighp vec3 vertexPosition = getVertexPosition();\nhighp vec3 normalMultiplier = vec3(1.0, 1.0, 1.0);\n";
            }
            vertexMain += "\ngl_Position = uModelViewProjection * vec4(vertexPosition, 1.0);\nvec3 normal = normalize(uNormalMatrix * normalMultiplier * decodeNormalOctahedronSnorm8(aVertexNormal));\nfloat lightingFactor = abs(dot(normal, uLightDirection.xyz)) + uLightDirection.w;\nvColor = vec4(lightingFactor * uColor.rgb, uColor.a);\n";
            builder.setVertexMain(vertexMain);
            builder.setFragmentMain("emit(vColor, uPickID);");
        }
    }, {
        key: "beginLayer",
        value: function beginLayer(gl, shader, renderContext) {
            var lightDirection = renderContext.lightDirection,
                ambientLighting = renderContext.ambientLighting,
                directionalLighting = renderContext.directionalLighting;

            var lightVec = this.tempLightVec;
            vec3.scale(lightVec, lightDirection, directionalLighting);
            lightVec[3] = ambientLighting;
            gl.uniform4fv(shader.uniform('uLightDirection'), lightVec);
        }
    }, {
        key: "setColor",
        value: function setColor(gl, shader, color) {
            gl.uniform4fv(shader.uniform('uColor'), color);
        }
    }, {
        key: "setPickID",
        value: function setPickID(gl, shader, pickID) {
            gl.uniform1ui(shader.uniform('uPickID'), pickID);
        }
    }, {
        key: "beginModel",
        value: function beginModel(gl, shader, renderContext, modelMat) {
            gl.uniformMatrix4fv(shader.uniform('uModelViewProjection'), false, mat4.multiply(tempMat4, renderContext.dataToDevice, modelMat));
            mat3FromMat4(tempMat3, modelMat);
            mat3.invert(tempMat3, tempMat3);
            mat3.transpose(tempMat3, tempMat3);
            gl.uniformMatrix3fv(shader.uniform('uNormalMatrix'), false, tempMat3);
        }
    }, {
        key: "getShader",
        value: function getShader(gl, emitter) {
            var _this = this;

            return gl.memoize.get("mesh/MeshShaderManager:" + getObjectId(emitter) + "/" + (this.fragmentRelativeVertices + "/" + this.vertexPositionFormat), function () {
                var builder = new ShaderBuilder(gl);
                builder.require(emitter);
                _this.defineShader(builder);
                return builder.build();
            });
        }
    }, {
        key: "drawFragmentHelper",
        value: function drawFragmentHelper(gl, shader, fragmentChunk, indexBegin, indexEnd) {
            this.vertexPositionHandler.bind(gl, shader, fragmentChunk);
            var meshData = fragmentChunk.meshData;

            fragmentChunk.normalBuffer.bindToVertexAttrib(shader.attribute('aVertexNormal'),
            /*components=*/2, WebGL2RenderingContext.BYTE, /*normalized=*/true);
            fragmentChunk.indexBuffer.bind();
            var indices = meshData.indices;

            gl.drawElements(meshData.strips ? WebGL2RenderingContext.TRIANGLE_STRIP : WebGL2RenderingContext.TRIANGLES, indexEnd - indexBegin, indices.BYTES_PER_ELEMENT === 2 ? WebGL2RenderingContext.UNSIGNED_SHORT : WebGL2RenderingContext.UNSIGNED_INT, indexBegin * indices.BYTES_PER_ELEMENT);
        }
    }, {
        key: "drawFragment",
        value: function drawFragment(gl, shader, fragmentChunk) {
            var meshData = fragmentChunk.meshData;
            var indices = meshData.indices;

            this.drawFragmentHelper(gl, shader, fragmentChunk, 0, indices.length);
        }
    }, {
        key: "drawMultiscaleFragment",
        value: function drawMultiscaleFragment(gl, shader, fragmentChunk, subChunkBegin, subChunkEnd) {
            var indexBegin = fragmentChunk.meshData.subChunkOffsets[subChunkBegin];
            var indexEnd = fragmentChunk.meshData.subChunkOffsets[subChunkEnd];
            this.drawFragmentHelper(gl, shader, fragmentChunk, indexBegin, indexEnd);
        }
    }, {
        key: "endLayer",
        value: function endLayer(gl, shader) {
            this.vertexPositionHandler.endLayer(gl, shader);
            gl.disableVertexAttribArray(shader.attribute('aVertexNormal'));
        }
    }]);

    return MeshShaderManager;
}();
export var MeshLayer = function (_PerspectiveViewRende) {
    _inherits(MeshLayer, _PerspectiveViewRende);

    function MeshLayer(chunkManager, source, displayState) {
        _classCallCheck(this, MeshLayer);

        var _this2 = _possibleConstructorReturn(this, (MeshLayer.__proto__ || _Object$getPrototypeOf(MeshLayer)).call(this));

        _this2.chunkManager = chunkManager;
        _this2.source = source;
        _this2.displayState = displayState;
        _this2.meshShaderManager = new MeshShaderManager( /*fragmentRelativeVertices=*/false, VertexPositionFormat.float32);
        _this2.shaders = new _Map();
        registerRedrawWhenSegmentationDisplayState3DChanged(displayState, _this2);
        var sharedObject = _this2.backend = _this2.registerDisposer(new SegmentationLayerSharedObject(chunkManager, displayState));
        sharedObject.RPC_TYPE_ID = MESH_LAYER_RPC_ID;
        sharedObject.initializeCounterpartWithChunkManager({
            'source': source.addCounterpartRef()
        });
        _this2.setReady(true);
        sharedObject.visibility.add(_this2.visibility);
        _this2.registerDisposer(displayState.renderScaleHistogram.visibility.add(_this2.visibility));
        return _this2;
    }

    _createClass(MeshLayer, [{
        key: "getShader",
        value: function getShader(emitter) {
            var shaders = this.shaders;

            var shader = shaders.get(emitter);
            if (shader === undefined) {
                shader = this.registerDisposer(this.meshShaderManager.getShader(this.gl, emitter));
                shaders.set(emitter, shader);
            }
            return shader;
        }
    }, {
        key: "draw",
        value: function draw(renderContext) {
            var _this3 = this;

            if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
                // No need for a separate pick ID pass.
                return;
            }
            var gl = this.gl,
                displayState = this.displayState,
                meshShaderManager = this.meshShaderManager;

            var alpha = Math.min(1.0, displayState.objectAlpha.value);
            if (alpha <= 0.0) {
                // Skip drawing.
                return;
            }
            var shader = this.getShader(renderContext.emitter);
            shader.bind();
            var objectToDataMatrix = this.displayState.objectToDataTransform.transform;
            meshShaderManager.beginLayer(gl, shader, renderContext);
            meshShaderManager.beginModel(gl, shader, renderContext, objectToDataMatrix);
            var pickIDs = renderContext.pickIDs;

            var manifestChunks = this.source.chunks;
            var totalChunks = 0,
                presentChunks = 0;
            var renderScaleHistogram = this.displayState.renderScaleHistogram;

            var fragmentChunks = this.source.fragmentSource.chunks;
            forEachVisibleSegment(displayState, function (objectId, rootObjectId) {
                var key = getObjectKey(objectId);
                var manifestChunk = manifestChunks.get(key);
                if (manifestChunk === undefined) return;
                if (renderContext.emitColor) {
                    meshShaderManager.setColor(gl, shader, getObjectColor(displayState, rootObjectId, alpha));
                }
                if (renderContext.emitPickID) {
                    meshShaderManager.setPickID(gl, shader, pickIDs.registerUint64(_this3, objectId));
                }
                totalChunks += manifestChunk.fragmentIds.length;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(manifestChunk.fragmentIds), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var fragmentId = _step.value;

                        var fragment = fragmentChunks.get(key + "/" + fragmentId);
                        if (fragment !== undefined && fragment.state === ChunkState.GPU_MEMORY) {
                            meshShaderManager.drawFragment(gl, shader, fragment);
                            ++presentChunks;
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
            });
            if (renderContext.emitColor) {
                renderScaleHistogram.begin(this.chunkManager.chunkQueueManager.frameNumberCounter.frameNumber);
                renderScaleHistogram.add(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, presentChunks, totalChunks - presentChunks);
            }
            meshShaderManager.endLayer(gl, shader);
        }
    }, {
        key: "isReady",
        value: function isReady() {
            var displayState = this.displayState,
                source = this.source;

            var ready = true;
            var fragmentChunks = source.fragmentSource.chunks;
            forEachVisibleSegment(displayState, function (objectId) {
                var key = getObjectKey(objectId);
                var manifestChunk = source.chunks.get(key);
                if (manifestChunk === undefined) {
                    ready = false;
                    return;
                }
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(manifestChunk.fragmentIds), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var fragmentId = _step2.value;

                        var fragmentChunk = fragmentChunks.get(key + "/" + fragmentId);
                        if (fragmentChunk === undefined || fragmentChunk.state !== ChunkState.GPU_MEMORY) {
                            ready = false;
                            return;
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
            });
            return ready;
        }
    }, {
        key: "isTransparent",
        get: function get() {
            return this.displayState.objectAlpha.value < 1.0;
        }
    }, {
        key: "gl",
        get: function get() {
            return this.chunkManager.chunkQueueManager.gl;
        }
    }]);

    return MeshLayer;
}(PerspectiveViewRenderLayer);
export var ManifestChunk = function (_Chunk) {
    _inherits(ManifestChunk, _Chunk);

    function ManifestChunk(source, x) {
        _classCallCheck(this, ManifestChunk);

        var _this4 = _possibleConstructorReturn(this, (ManifestChunk.__proto__ || _Object$getPrototypeOf(ManifestChunk)).call(this, source));

        _this4.fragmentIds = x.fragmentIds;
        return _this4;
    }

    return ManifestChunk;
}(Chunk);
export var FragmentChunk = function (_Chunk2) {
    _inherits(FragmentChunk, _Chunk2);

    function FragmentChunk(source, x) {
        _classCallCheck(this, FragmentChunk);

        var _this5 = _possibleConstructorReturn(this, (FragmentChunk.__proto__ || _Object$getPrototypeOf(FragmentChunk)).call(this, source));

        _this5.meshData = x;
        return _this5;
    }

    _createClass(FragmentChunk, [{
        key: "copyToGPU",
        value: function copyToGPU(gl) {
            _get(FragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(FragmentChunk.prototype), "copyToGPU", this).call(this, gl);
            copyMeshDataToGpu(gl, this);
        }
    }, {
        key: "freeGPUMemory",
        value: function freeGPUMemory(gl) {
            _get(FragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(FragmentChunk.prototype), "freeGPUMemory", this).call(this, gl);
            freeGpuMeshData(this);
        }
    }]);

    return FragmentChunk;
}(Chunk);
export var MeshSource = function (_ChunkSource) {
    _inherits(MeshSource, _ChunkSource);

    function MeshSource() {
        _classCallCheck(this, MeshSource);

        var _this6 = _possibleConstructorReturn(this, (MeshSource.__proto__ || _Object$getPrototypeOf(MeshSource)).apply(this, arguments));

        _this6.fragmentSource = _this6.registerDisposer(new FragmentSource(_this6.chunkManager, _this6));
        return _this6;
    }

    _createClass(MeshSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            this.fragmentSource.initializeCounterpart(this.chunkManager.rpc, {});
            options['fragmentSource'] = this.fragmentSource.addCounterpartRef();
            _get(MeshSource.prototype.__proto__ || _Object$getPrototypeOf(MeshSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "getChunk",
        value: function getChunk(x) {
            return new ManifestChunk(this, x);
        }
    }]);

    return MeshSource;
}(ChunkSource);
var FragmentSource = function (_ChunkSource2) {
    _inherits(FragmentSource, _ChunkSource2);

    function FragmentSource(chunkManager, meshSource) {
        _classCallCheck(this, FragmentSource);

        var _this7 = _possibleConstructorReturn(this, (FragmentSource.__proto__ || _Object$getPrototypeOf(FragmentSource)).call(this, chunkManager));

        _this7.meshSource = meshSource;
        return _this7;
    }

    _createClass(FragmentSource, [{
        key: "getChunk",
        value: function getChunk(x) {
            return new FragmentChunk(this, x);
        }
    }, {
        key: "key",
        get: function get() {
            return this.meshSource.key;
        }
    }]);

    return FragmentSource;
}(ChunkSource);
FragmentSource = __decorate([registerSharedObjectOwner(FRAGMENT_SOURCE_RPC_ID)], FragmentSource);
export { FragmentSource };
function hasFragmentChunk(fragmentChunks, objectKey, lod, chunkIndex) {
    var fragmentChunk = fragmentChunks.get(getMultiscaleFragmentKey(objectKey, lod, chunkIndex));
    return fragmentChunk !== undefined && fragmentChunk.state === ChunkState.GPU_MEMORY;
}
export var MultiscaleMeshLayer = function (_PerspectiveViewRende2) {
    _inherits(MultiscaleMeshLayer, _PerspectiveViewRende2);

    function MultiscaleMeshLayer(chunkManager, source, displayState) {
        _classCallCheck(this, MultiscaleMeshLayer);

        var _this8 = _possibleConstructorReturn(this, (MultiscaleMeshLayer.__proto__ || _Object$getPrototypeOf(MultiscaleMeshLayer)).call(this));

        _this8.chunkManager = chunkManager;
        _this8.source = source;
        _this8.displayState = displayState;
        _this8.meshShaderManager = new MeshShaderManager(
        /*fragmentRelativeVertices=*/_this8.source.format.fragmentRelativeVertices, _this8.source.format.vertexPositionFormat);
        _this8.shaders = new _Map();
        registerRedrawWhenSegmentationDisplayState3DChanged(displayState, _this8);
        var sharedObject = _this8.backend = _this8.registerDisposer(new SegmentationLayerSharedObject(chunkManager, displayState));
        sharedObject.RPC_TYPE_ID = MULTISCALE_MESH_LAYER_RPC_ID;
        sharedObject.initializeCounterpartWithChunkManager({
            'source': source.addCounterpartRef()
        });
        _this8.setReady(true);
        sharedObject.visibility.add(_this8.visibility);
        _this8.registerDisposer(displayState.renderScaleHistogram.visibility.add(_this8.visibility));
        return _this8;
    }

    _createClass(MultiscaleMeshLayer, [{
        key: "getShader",
        value: function getShader(emitter) {
            var shaders = this.shaders;

            var shader = shaders.get(emitter);
            if (shader === undefined) {
                shader = this.registerDisposer(this.meshShaderManager.getShader(this.gl, emitter));
                shaders.set(emitter, shader);
            }
            return shader;
        }
    }, {
        key: "draw",
        value: function draw(renderContext) {
            var _this9 = this;

            if (!renderContext.emitColor && renderContext.alreadyEmittedPickID) {
                // No need for a separate pick ID pass.
                return;
            }
            var gl = this.gl,
                displayState = this.displayState,
                meshShaderManager = this.meshShaderManager;

            var alpha = Math.min(1.0, displayState.objectAlpha.value);
            if (alpha <= 0.0) {
                // Skip drawing.
                return;
            }
            var shader = this.getShader(renderContext.emitter);
            shader.bind();
            meshShaderManager.beginLayer(gl, shader, renderContext);
            var renderScaleHistogram = this.displayState.renderScaleHistogram;

            if (renderContext.emitColor) {
                renderScaleHistogram.begin(this.chunkManager.chunkQueueManager.frameNumberCounter.frameNumber);
            }
            var pickIDs = renderContext.pickIDs;

            var objectToDataMatrix = mat4.multiply(tempModelMatrix, this.displayState.objectToDataTransform.transform, this.source.format.transform);
            mat3FromMat4(tempMat3, objectToDataMatrix);
            var scaleMultiplier = Math.pow(mat3.determinant(tempMat3), 1 / 3);
            var chunks = this.source.chunks;

            var fragmentChunks = this.source.fragmentSource.chunks;
            var modelViewProjection = mat4.multiply(mat4.create(), renderContext.dataToDevice, objectToDataMatrix);
            var clippingPlanes = getFrustrumPlanes(new Float32Array(24), modelViewProjection);
            var detailCutoff = this.displayState.renderScaleTarget.value;
            var fragmentRelativeVertices = this.source.format.fragmentRelativeVertices;

            meshShaderManager.beginModel(gl, shader, renderContext, objectToDataMatrix);
            forEachVisibleSegment(displayState, function (objectId, rootObjectId) {
                var key = getObjectKey(objectId);
                var manifestChunk = chunks.get(key);
                if (manifestChunk === undefined) return;
                var manifest = manifestChunk.manifest;
                var octree = manifest.octree,
                    chunkShape = manifest.chunkShape,
                    chunkGridSpatialOrigin = manifest.chunkGridSpatialOrigin,
                    vertexOffsets = manifest.vertexOffsets;

                if (renderContext.emitColor) {
                    meshShaderManager.setColor(gl, shader, getObjectColor(displayState, rootObjectId, alpha));
                }
                if (renderContext.emitPickID) {
                    meshShaderManager.setPickID(gl, shader, pickIDs.registerUint64(_this9, objectId));
                }
                if (DEBUG_MULTISCALE_FRAGMENTS) {
                    console.log('drawing object, numChunks=', manifest.octree.length / 5, manifest.octree);
                }
                getMultiscaleChunksToDraw(manifest, modelViewProjection, clippingPlanes, detailCutoff, renderContext.viewportWidth, renderContext.viewportHeight, function (lod, chunkIndex, renderScale) {
                    var has = hasFragmentChunk(fragmentChunks, key, lod, chunkIndex);
                    if (renderContext.emitColor) {
                        renderScaleHistogram.add(manifest.lodScales[lod] * scaleMultiplier, renderScale, has ? 1 : 0, has ? 0 : 1);
                    }
                    return has;
                }, function (lod, chunkIndex, subChunkBegin, subChunkEnd) {
                    var fragmentKey = getMultiscaleFragmentKey(key, lod, chunkIndex);
                    var fragmentChunk = fragmentChunks.get(fragmentKey);
                    var x = octree[5 * chunkIndex],
                        y = octree[5 * chunkIndex + 1],
                        z = octree[5 * chunkIndex + 2];
                    var scale = 1 << lod;
                    if (fragmentRelativeVertices) {
                        gl.uniform3f(shader.uniform('uFragmentOrigin'), chunkGridSpatialOrigin[0] + x * chunkShape[0] * scale + vertexOffsets[lod * 3 + 0], chunkGridSpatialOrigin[1] + y * chunkShape[1] * scale + vertexOffsets[lod * 3 + 1], chunkGridSpatialOrigin[2] + z * chunkShape[2] * scale + vertexOffsets[lod * 3 + 2]);
                        gl.uniform3f(shader.uniform('uFragmentShape'), chunkShape[0] * scale, chunkShape[1] * scale, chunkShape[2] * scale);
                    }
                    meshShaderManager.drawMultiscaleFragment(gl, shader, fragmentChunk, subChunkBegin, subChunkEnd);
                });
            });
            meshShaderManager.endLayer(gl, shader);
        }
    }, {
        key: "isReady",
        value: function isReady(renderContext) {
            var displayState = this.displayState;

            var alpha = Math.min(1.0, displayState.objectAlpha.value);
            if (alpha <= 0.0) {
                // Skip drawing.
                return true;
            }
            var objectToDataMatrix = this.displayState.objectToDataTransform.transform;
            var chunks = this.source.chunks;

            var fragmentChunks = this.source.fragmentSource.chunks;
            var modelViewProjection = mat4.multiply(mat4.create(), renderContext.dataToDevice, objectToDataMatrix);
            var clippingPlanes = getFrustrumPlanes(new Float32Array(24), modelViewProjection);
            var detailCutoff = this.displayState.renderScaleTarget.value;
            var hasAllChunks = true;
            forEachVisibleSegment(displayState, function (objectId) {
                if (!hasAllChunks) return;
                var key = getObjectKey(objectId);
                var manifestChunk = chunks.get(key);
                if (manifestChunk === undefined) {
                    hasAllChunks = false;
                    return;
                }
                var manifest = manifestChunk.manifest;

                getMultiscaleChunksToDraw(manifest, modelViewProjection, clippingPlanes, detailCutoff, renderContext.viewportWidth, renderContext.viewportHeight, function (lod, chunkIndex) {
                    hasAllChunks = hasAllChunks && hasFragmentChunk(fragmentChunks, key, lod, chunkIndex);
                    return hasAllChunks;
                }, function () {});
            });
            return hasAllChunks;
        }
    }, {
        key: "isTransparent",
        get: function get() {
            return this.displayState.objectAlpha.value < 1.0;
        }
    }, {
        key: "gl",
        get: function get() {
            return this.chunkManager.chunkQueueManager.gl;
        }
    }]);

    return MultiscaleMeshLayer;
}(PerspectiveViewRenderLayer);
export var MultiscaleManifestChunk = function (_Chunk3) {
    _inherits(MultiscaleManifestChunk, _Chunk3);

    function MultiscaleManifestChunk(source, x) {
        _classCallCheck(this, MultiscaleManifestChunk);

        var _this10 = _possibleConstructorReturn(this, (MultiscaleManifestChunk.__proto__ || _Object$getPrototypeOf(MultiscaleManifestChunk)).call(this, source));

        _this10.manifest = x['manifest'];
        return _this10;
    }

    return MultiscaleManifestChunk;
}(Chunk);
export var MultiscaleFragmentChunk = function (_Chunk4) {
    _inherits(MultiscaleFragmentChunk, _Chunk4);

    function MultiscaleFragmentChunk(source, x) {
        _classCallCheck(this, MultiscaleFragmentChunk);

        var _this11 = _possibleConstructorReturn(this, (MultiscaleFragmentChunk.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk)).call(this, source));

        _this11.meshData = x;
        return _this11;
    }

    _createClass(MultiscaleFragmentChunk, [{
        key: "copyToGPU",
        value: function copyToGPU(gl) {
            _get(MultiscaleFragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk.prototype), "copyToGPU", this).call(this, gl);
            copyMeshDataToGpu(gl, this);
        }
    }, {
        key: "freeGPUMemory",
        value: function freeGPUMemory(gl) {
            _get(MultiscaleFragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk.prototype), "freeGPUMemory", this).call(this, gl);
            freeGpuMeshData(this);
        }
    }]);

    return MultiscaleFragmentChunk;
}(Chunk);
export var MultiscaleMeshSource = function (_ChunkSource3) {
    _inherits(MultiscaleMeshSource, _ChunkSource3);

    function MultiscaleMeshSource(chunkManager, options) {
        _classCallCheck(this, MultiscaleMeshSource);

        var _this12 = _possibleConstructorReturn(this, (MultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(MultiscaleMeshSource)).call(this, chunkManager, options));

        _this12.fragmentSource = _this12.registerDisposer(new MultiscaleFragmentSource(_this12.chunkManager, _this12));
        _this12.format = options.format;
        return _this12;
    }

    _createClass(MultiscaleMeshSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            this.fragmentSource.initializeCounterpart(this.chunkManager.rpc, {});
            options['fragmentSource'] = this.fragmentSource.addCounterpartRef();
            options['format'] = this.format;
            _get(MultiscaleMeshSource.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleMeshSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "getChunk",
        value: function getChunk(x) {
            return new MultiscaleManifestChunk(this, x);
        }
    }]);

    return MultiscaleMeshSource;
}(ChunkSource);
var MultiscaleFragmentSource = function (_ChunkSource4) {
    _inherits(MultiscaleFragmentSource, _ChunkSource4);

    function MultiscaleFragmentSource(chunkManager, meshSource) {
        _classCallCheck(this, MultiscaleFragmentSource);

        var _this13 = _possibleConstructorReturn(this, (MultiscaleFragmentSource.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentSource)).call(this, chunkManager));

        _this13.meshSource = meshSource;
        return _this13;
    }

    _createClass(MultiscaleFragmentSource, [{
        key: "getChunk",
        value: function getChunk(x) {
            return new MultiscaleFragmentChunk(this, x);
        }
    }, {
        key: "key",
        get: function get() {
            return this.meshSource.key;
        }
    }]);

    return MultiscaleFragmentSource;
}(ChunkSource);
MultiscaleFragmentSource = __decorate([registerSharedObjectOwner(MULTISCALE_FRAGMENT_SOURCE_RPC_ID)], MultiscaleFragmentSource);
export { MultiscaleFragmentSource };
//# sourceMappingURL=frontend.js.map