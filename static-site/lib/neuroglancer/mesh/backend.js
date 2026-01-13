import _getIterator from "babel-runtime/core-js/get-iterator";
import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _Map from "babel-runtime/core-js/map";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _get from "babel-runtime/helpers/get";
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
import { Chunk, ChunkSource } from "../chunk_manager/backend";
import { ChunkPriorityTier, ChunkState } from "../chunk_manager/base";
import { FRAGMENT_SOURCE_RPC_ID, MESH_LAYER_RPC_ID, MULTISCALE_FRAGMENT_SOURCE_RPC_ID, MULTISCALE_MESH_LAYER_RPC_ID, VertexPositionFormat } from "./base";
import { getDesiredMultiscaleMeshChunks } from "./multiscale";
import { computeTriangleStrips } from "./triangle_strips";
import { SegmentationLayerSharedObjectCounterpart } from "../segmentation_display_state/backend";
import { getObjectKey } from "../segmentation_display_state/base";
import { forEachVisibleSegment } from "../segmentation_display_state/base";
import { WatchableSet } from "../trackable_value";
import { convertEndian32 } from "../util/endian";
import { getFrustrumPlanes, mat4, vec3 } from "../util/geom";
import { verifyObject, verifyObjectProperty, verifyStringArray } from "../util/json";
import { Uint64 } from "../util/uint64";
import { zorder3LessThan } from "../util/zorder";
import { getBasePriority, getPriorityTier } from "../visibility_priority/backend";
import { registerSharedObject } from "../worker_rpc";
var MESH_OBJECT_MANIFEST_CHUNK_PRIORITY = 100;
var MESH_OBJECT_FRAGMENT_CHUNK_PRIORITY = 50;
var CONVERT_TO_TRIANGLE_STRIPS = false;
// Chunk that contains the list of fragments that make up a single object.
export var ManifestChunk = function (_Chunk) {
    _inherits(ManifestChunk, _Chunk);

    function ManifestChunk() {
        _classCallCheck(this, ManifestChunk);

        var _this = _possibleConstructorReturn(this, (ManifestChunk.__proto__ || _Object$getPrototypeOf(ManifestChunk)).call(this));

        _this.objectId = new Uint64();
        return _this;
    }
    // We can't save a reference to objectId, because it may be a temporary
    // object.


    _createClass(ManifestChunk, [{
        key: "initializeManifestChunk",
        value: function initializeManifestChunk(key, objectId) {
            _get(ManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(ManifestChunk.prototype), "initialize", this).call(this, key);
            this.objectId.assign(objectId);
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.fragmentIds = null;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(ManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(ManifestChunk.prototype), "serialize", this).call(this, msg, transfers);
            msg.fragmentIds = this.fragmentIds;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            // We can't easily determine the memory usage of the JSON manifest.  Just use 100 bytes as a
            // default value.
            this.systemMemoryBytes = 100;
            this.gpuMemoryBytes = 0;
            _get(ManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(ManifestChunk.prototype), "downloadSucceeded", this).call(this);
            if (this.priorityTier < ChunkPriorityTier.RECENT) {
                this.source.chunkManager.scheduleUpdateChunkPriorities();
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.objectId.toString();
        }
    }]);

    return ManifestChunk;
}(Chunk);
function serializeMeshData(data, msg, transfers) {
    var vertexPositions = data.vertexPositions,
        indices = data.indices,
        vertexNormals = data.vertexNormals,
        strips = data.strips;

    msg['vertexPositions'] = vertexPositions;
    msg['indices'] = indices;
    msg['strips'] = strips;
    msg['vertexNormals'] = vertexNormals;
    var vertexPositionsBuffer = vertexPositions.buffer;
    transfers.push(vertexPositionsBuffer);
    var indicesBuffer = indices.buffer;
    if (indicesBuffer !== vertexPositionsBuffer) {
        transfers.push(indicesBuffer);
    }
    transfers.push(vertexNormals.buffer);
}
function getMeshDataSize(data) {
    var vertexPositions = data.vertexPositions,
        indices = data.indices,
        vertexNormals = data.vertexNormals;

    return vertexPositions.byteLength + indices.byteLength + vertexNormals.byteLength;
}
/**
 * Chunk that contains the mesh for a single fragment of a single object.
 */
export var FragmentChunk = function (_Chunk2) {
    _inherits(FragmentChunk, _Chunk2);

    function FragmentChunk() {
        _classCallCheck(this, FragmentChunk);

        var _this2 = _possibleConstructorReturn(this, (FragmentChunk.__proto__ || _Object$getPrototypeOf(FragmentChunk)).call(this));

        _this2.manifestChunk = null;
        _this2.fragmentId = null;
        _this2.meshData = null;
        return _this2;
    }

    _createClass(FragmentChunk, [{
        key: "initializeFragmentChunk",
        value: function initializeFragmentChunk(key, manifestChunk, fragmentId) {
            _get(FragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(FragmentChunk.prototype), "initialize", this).call(this, key);
            this.manifestChunk = manifestChunk;
            this.fragmentId = fragmentId;
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.manifestChunk = null;
            this.meshData = null;
            this.fragmentId = null;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(FragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(FragmentChunk.prototype), "serialize", this).call(this, msg, transfers);
            serializeMeshData(this.meshData, msg, transfers);
            this.meshData = null;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.gpuMemoryBytes = getMeshDataSize(this.meshData);
            _get(FragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(FragmentChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }]);

    return FragmentChunk;
}(Chunk);
/**
 * Assigns chunk.fragmentKeys to response[keysPropertyName].
 *
 * Verifies that response[keysPropertyName] is an array of strings.
 */
export function decodeJsonManifestChunk(chunk, response, keysPropertyName) {
    verifyObject(response);
    chunk.fragmentIds = verifyObjectProperty(response, keysPropertyName, verifyStringArray);
}
/**
 * Computes normal vectors for each vertex of a triangular mesh.
 *
 * The normal vector for each triangle with vertices (v0, v1, v2) is computed as the (normalized)
 * cross product of (v1 - v0, v2 - v1).  The normal vector for each vertex is obtained by averaging
 * the normal vector of each of the triangles that contains it.
 *
 * @param positions The vertex positions in [x0, y0, z0, x1, y1, z1, ...] format.
 * @param indices The indices of the triangle vertices.  Each triplet of consecutive values
 *     specifies a triangle.
 */
export function computeVertexNormals(positions, indices) {
    var faceNormal = vec3.create();
    var v1v0 = vec3.create();
    var v2v1 = vec3.create();
    var vertexNormals = new Float32Array(positions.length);
    var numIndices = indices.length;
    for (var i = 0; i < numIndices; i += 3) {
        var i0 = indices[i] * 3,
            i1 = indices[i + 1] * 3,
            i2 = indices[i + 2] * 3;
        for (var j = 0; j < 3; ++j) {
            v1v0[j] = positions[i1 + j] - positions[i0 + j];
            v2v1[j] = positions[i2 + j] - positions[i1 + j];
        }
        vec3.cross(faceNormal, v1v0, v2v1);
        vec3.normalize(faceNormal, faceNormal);
        for (var k = 0; k < 3; ++k) {
            var index = indices[i + k];
            var offset = index * 3;
            for (var _j = 0; _j < 3; ++_j) {
                vertexNormals[offset + _j] += faceNormal[_j];
            }
        }
    }
    // Normalize all vertex normals.
    var numVertices = vertexNormals.length;
    for (var _i = 0; _i < numVertices; _i += 3) {
        var vec = vertexNormals.subarray(_i, _i + 3);
        vec3.normalize(vec, vec);
    }
    return vertexNormals;
}
/**
 * Converts a floating-point number in the range `[-1, 1]` to an integer in the range `[-127, 127]`.
 */
function snorm8(x) {
    return Math.min(Math.max(-127, x * 127 + 0.5), 127) >>> 0;
}
function signNotZero(x) {
    return x < 0 ? -1 : 1;
}
/**
 * Encodes normal vectors represented as 3x32-bit floating vectors into a 2x8-bit octahedron
 * representation.
 *
 * Zina H. Cigolle, Sam Donow, Daniel Evangelakos, Michael Mara, Morgan McGuire, and Quirin Meyer,
 * Survey of Efficient Representations for Independent Unit Vectors, Journal of Computer Graphics
 * Techniques (JCGT), vol. 3, no. 2, 1-30, 2014
 *
 * Available online http://jcgt.org/published/0003/02/01/
 *
 * @param out[out] Row-major array of shape `[n, 2]` set to octahedron representation.
 * @param normals[in] Row-major array of shape `[n, 3]` specifying unit normal vectors.
 */
export function encodeNormals32fx3ToOctahedron8x2(out, normals) {
    var length = normals.length;
    var outIndex = 0;
    for (var i = 0; i < length; i += 3) {
        var x = normals[i],
            y = normals[i + 1],
            z = normals[i + 2];
        var invL1Norm = 1 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
        if (z < 0) {
            out[outIndex] = snorm8((1 - Math.abs(y * invL1Norm)) * signNotZero(x));
            out[outIndex + 1] = snorm8((1 - Math.abs(x * invL1Norm)) * signNotZero(y));
        } else {
            out[outIndex] = snorm8(x * invL1Norm);
            out[outIndex + 1] = snorm8(y * invL1Norm);
        }
        outIndex += 2;
    }
}
/**
 * Extracts vertex positions and indices of the specified endianness from `data'.
 *
 * The vertexByteOffset specifies the byte offset into `data' of the start of the vertex position
 * data.  The vertex data must consist of verticesPerPrimitive * numVertices 32-bit float values.
 *
 * If indexByteOffset is not specified, it defaults to the end of the vertex position data.  If
 * numPrimitives is not specified, it is assumed that the index data continues until the end of the
 * array.
 */
export function decodeVertexPositionsAndIndices(verticesPerPrimitive, data, endianness, vertexByteOffset, numVertices, indexByteOffset, numPrimitives) {
    var vertexPositions = new Float32Array(data, vertexByteOffset, numVertices * 3);
    convertEndian32(vertexPositions, endianness);
    if (indexByteOffset === undefined) {
        indexByteOffset = vertexByteOffset + 12 * numVertices;
    }
    var numIndices = void 0;
    if (numPrimitives !== undefined) {
        numIndices = numPrimitives * verticesPerPrimitive;
    }
    // For compatibility with Firefox, length argument must not be undefined.
    var indices = numIndices === undefined ? new Uint32Array(data, indexByteOffset) : new Uint32Array(data, indexByteOffset, numIndices);
    if (indices.length % verticesPerPrimitive !== 0) {
        throw new Error("Number of indices is not a multiple of " + verticesPerPrimitive + ": " + indices.length + ".");
    }
    convertEndian32(indices, endianness);
    return { vertexPositions: vertexPositions, indices: indices };
}
/**
 * Extracts vertex positions and triangle vertex indices of the specified endianness from `data'.
 *
 * Vertex normals are computed.
 *
 * See decodeVertexPositionsAndIndices above.
 */
export function decodeTriangleVertexPositionsAndIndices(data, endianness, vertexByteOffset, numVertices, indexByteOffset, numTriangles) {
    return decodeVertexPositionsAndIndices(
    /*verticesPerPrimitive=*/3, data, endianness, vertexByteOffset, numVertices, indexByteOffset, numTriangles);
}
export var MeshSource = function (_ChunkSource) {
    _inherits(MeshSource, _ChunkSource);

    function MeshSource(rpc, options) {
        _classCallCheck(this, MeshSource);

        var _this3 = _possibleConstructorReturn(this, (MeshSource.__proto__ || _Object$getPrototypeOf(MeshSource)).call(this, rpc, options));

        var fragmentSource = _this3.fragmentSource = _this3.registerDisposer(rpc.getRef(options['fragmentSource']));
        fragmentSource.meshSource = _this3;
        return _this3;
    }

    _createClass(MeshSource, [{
        key: "getChunk",
        value: function getChunk(objectId) {
            var key = getObjectKey(objectId);
            var chunk = this.chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(ManifestChunk);
                chunk.initializeManifestChunk(key, objectId);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }, {
        key: "getFragmentChunk",
        value: function getFragmentChunk(manifestChunk, fragmentId) {
            var key = manifestChunk.key + "/" + fragmentId;
            var fragmentSource = this.fragmentSource;
            var chunk = fragmentSource.chunks.get(key);
            if (chunk === undefined) {
                chunk = fragmentSource.getNewChunk_(FragmentChunk);
                chunk.initializeFragmentChunk(key, manifestChunk, fragmentId);
                fragmentSource.addChunk(chunk);
            }
            return chunk;
        }
    }]);

    return MeshSource;
}(ChunkSource);
var FragmentSource = function (_ChunkSource2) {
    _inherits(FragmentSource, _ChunkSource2);

    function FragmentSource() {
        _classCallCheck(this, FragmentSource);

        var _this4 = _possibleConstructorReturn(this, (FragmentSource.__proto__ || _Object$getPrototypeOf(FragmentSource)).apply(this, arguments));

        _this4.meshSource = null;
        return _this4;
    }

    _createClass(FragmentSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            return this.meshSource.downloadFragment(chunk, cancellationToken);
        }
    }]);

    return FragmentSource;
}(ChunkSource);
FragmentSource = __decorate([registerSharedObject(FRAGMENT_SOURCE_RPC_ID)], FragmentSource);
export { FragmentSource };
var MeshLayer = function (_SegmentationLayerSha) {
    _inherits(MeshLayer, _SegmentationLayerSha);

    function MeshLayer(rpc, options) {
        _classCallCheck(this, MeshLayer);

        var _this5 = _possibleConstructorReturn(this, (MeshLayer.__proto__ || _Object$getPrototypeOf(MeshLayer)).call(this, rpc, options));

        _this5.viewStates = new WatchableSet();
        _this5.viewStatesDisposers = new _Map();
        _this5.source = _this5.registerDisposer(rpc.getRef(options['source']));
        _this5.registerDisposer(_this5.chunkManager.recomputeChunkPriorities.add(function () {
            _this5.updateChunkPriorities();
        }));
        var scheduleUpdateChunkPriorities = function scheduleUpdateChunkPriorities() {
            _this5.chunkManager.scheduleUpdateChunkPriorities();
        };
        _this5.registerDisposer(_this5.viewStates.changed.add(function () {
            var viewStatesDisposers = _this5.viewStatesDisposers;
            var viewStates = _this5.viewStates;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(viewStatesDisposers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var viewState = _ref2[0];
                    var disposer = _ref2[1];

                    if (!viewStates.has(viewState)) {
                        disposer();
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

            var _loop = function _loop(_viewState) {
                if (!viewStatesDisposers.has(_viewState)) {
                    _viewState.viewport.changed.add(scheduleUpdateChunkPriorities);
                    _viewState.visibility.changed.add(scheduleUpdateChunkPriorities);
                    viewStatesDisposers.set(_viewState, function () {
                        _viewState.viewport.changed.remove(scheduleUpdateChunkPriorities);
                        _viewState.visibility.changed.remove(scheduleUpdateChunkPriorities);
                    });
                }
            };

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(viewStates), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _viewState = _step2.value;

                    _loop(_viewState);
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
        }));
        _this5.registerDisposer(function () {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(_this5.viewStatesDisposers.values()), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var disposer = _step3.value;

                    disposer();
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
        });
        return _this5;
    }

    _createClass(MeshLayer, [{
        key: "updateChunkPriorities",
        value: function updateChunkPriorities() {
            var visibility = this.visibility.value;
            if (visibility === Number.NEGATIVE_INFINITY) {
                return;
            }
            var priorityTier = getPriorityTier(visibility);
            var basePriority = getBasePriority(visibility);
            var source = this.source,
                chunkManager = this.chunkManager;

            forEachVisibleSegment(this, function (objectId) {
                var manifestChunk = source.getChunk(objectId);
                chunkManager.requestChunk(manifestChunk, priorityTier, basePriority + MESH_OBJECT_MANIFEST_CHUNK_PRIORITY);
                var state = manifestChunk.state;
                if (state === ChunkState.SYSTEM_MEMORY_WORKER || state === ChunkState.SYSTEM_MEMORY || state === ChunkState.GPU_MEMORY) {
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = _getIterator(manifestChunk.fragmentIds), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var fragmentId = _step4.value;

                            var fragmentChunk = source.getFragmentChunk(manifestChunk, fragmentId);
                            chunkManager.requestChunk(fragmentChunk, priorityTier, basePriority + MESH_OBJECT_FRAGMENT_CHUNK_PRIORITY);
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
                }
            });
        }
    }]);

    return MeshLayer;
}(SegmentationLayerSharedObjectCounterpart);
MeshLayer = __decorate([registerSharedObject(MESH_LAYER_RPC_ID)], MeshLayer);
export { MeshLayer };
// Chunk that contains the list of fragments that make up a single object.
export var MultiscaleManifestChunk = function (_Chunk3) {
    _inherits(MultiscaleManifestChunk, _Chunk3);

    function MultiscaleManifestChunk() {
        _classCallCheck(this, MultiscaleManifestChunk);

        var _this6 = _possibleConstructorReturn(this, (MultiscaleManifestChunk.__proto__ || _Object$getPrototypeOf(MultiscaleManifestChunk)).call(this));

        _this6.objectId = new Uint64();
        return _this6;
    }
    // We can't save a reference to objectId, because it may be a temporary
    // object.


    _createClass(MultiscaleManifestChunk, [{
        key: "initializeManifestChunk",
        value: function initializeManifestChunk(key, objectId) {
            _get(MultiscaleManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleManifestChunk.prototype), "initialize", this).call(this, key);
            this.objectId.assign(objectId);
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.manifest = undefined;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(MultiscaleManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleManifestChunk.prototype), "serialize", this).call(this, msg, transfers);
            msg.manifest = this.manifest;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.manifest.octree.byteLength;
            this.gpuMemoryBytes = 0;
            _get(MultiscaleManifestChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleManifestChunk.prototype), "downloadSucceeded", this).call(this);
            if (this.priorityTier < ChunkPriorityTier.RECENT) {
                this.source.chunkManager.scheduleUpdateChunkPriorities();
            }
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.objectId.toString();
        }
    }]);

    return MultiscaleManifestChunk;
}(Chunk);
/**
 * Chunk that contains the mesh for a single fragment of a single object.
 */
export var MultiscaleFragmentChunk = function (_Chunk4) {
    _inherits(MultiscaleFragmentChunk, _Chunk4);

    function MultiscaleFragmentChunk() {
        _classCallCheck(this, MultiscaleFragmentChunk);

        var _this7 = _possibleConstructorReturn(this, (MultiscaleFragmentChunk.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk)).call(this));

        _this7.subChunkOffsets = null;
        _this7.meshData = null;
        _this7.lod = 0;
        _this7.chunkIndex = 0;
        _this7.manifestChunk = null;
        return _this7;
    }

    _createClass(MultiscaleFragmentChunk, [{
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.meshData = this.subChunkOffsets = null;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(MultiscaleFragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk.prototype), "serialize", this).call(this, msg, transfers);
            serializeMeshData(this.meshData, msg, transfers);
            var subChunkOffsets = this.subChunkOffsets;

            msg['subChunkOffsets'] = subChunkOffsets;
            transfers.push(subChunkOffsets.buffer);
            this.meshData = this.subChunkOffsets = null;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            var subChunkOffsets = this.subChunkOffsets;

            this.systemMemoryBytes = this.gpuMemoryBytes = getMeshDataSize(this.meshData);
            this.systemMemoryBytes += subChunkOffsets.byteLength;
            _get(MultiscaleFragmentChunk.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }]);

    return MultiscaleFragmentChunk;
}(Chunk);
export var MultiscaleMeshSource = function (_ChunkSource3) {
    _inherits(MultiscaleMeshSource, _ChunkSource3);

    function MultiscaleMeshSource(rpc, options) {
        _classCallCheck(this, MultiscaleMeshSource);

        var _this8 = _possibleConstructorReturn(this, (MultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(MultiscaleMeshSource)).call(this, rpc, options));

        var fragmentSource = _this8.fragmentSource = _this8.registerDisposer(rpc.getRef(options['fragmentSource']));
        _this8.format = options['format'];
        fragmentSource.meshSource = _this8;
        return _this8;
    }

    _createClass(MultiscaleMeshSource, [{
        key: "getChunk",
        value: function getChunk(objectId) {
            var key = getObjectKey(objectId);
            var chunk = this.chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(MultiscaleManifestChunk);
                chunk.initializeManifestChunk(key, objectId);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }, {
        key: "getFragmentChunk",
        value: function getFragmentChunk(manifestChunk, lod, chunkIndex) {
            var key = manifestChunk.key + "/" + lod + ":" + chunkIndex;
            var fragmentSource = this.fragmentSource;
            var chunk = fragmentSource.chunks.get(key);
            if (chunk === undefined) {
                chunk = fragmentSource.getNewChunk_(MultiscaleFragmentChunk);
                chunk.initialize(key);
                chunk.lod = lod;
                chunk.chunkIndex = chunkIndex;
                chunk.manifestChunk = manifestChunk;
                fragmentSource.addChunk(chunk);
            }
            return chunk;
        }
    }]);

    return MultiscaleMeshSource;
}(ChunkSource);
var MultiscaleFragmentSource = function (_ChunkSource4) {
    _inherits(MultiscaleFragmentSource, _ChunkSource4);

    function MultiscaleFragmentSource() {
        _classCallCheck(this, MultiscaleFragmentSource);

        var _this9 = _possibleConstructorReturn(this, (MultiscaleFragmentSource.__proto__ || _Object$getPrototypeOf(MultiscaleFragmentSource)).apply(this, arguments));

        _this9.meshSource = null;
        return _this9;
    }

    _createClass(MultiscaleFragmentSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            return this.meshSource.downloadFragment(chunk, cancellationToken);
        }
    }]);

    return MultiscaleFragmentSource;
}(ChunkSource);
MultiscaleFragmentSource = __decorate([registerSharedObject(MULTISCALE_FRAGMENT_SOURCE_RPC_ID)], MultiscaleFragmentSource);
export { MultiscaleFragmentSource };
var MultiscaleMeshLayer = function (_SegmentationLayerSha2) {
    _inherits(MultiscaleMeshLayer, _SegmentationLayerSha2);

    function MultiscaleMeshLayer(rpc, options) {
        _classCallCheck(this, MultiscaleMeshLayer);

        var _this10 = _possibleConstructorReturn(this, (MultiscaleMeshLayer.__proto__ || _Object$getPrototypeOf(MultiscaleMeshLayer)).call(this, rpc, options));

        _this10.viewStates = new WatchableSet();
        _this10.viewStatesDisposers = new _Map();
        _this10.source = _this10.registerDisposer(rpc.getRef(options['source']));
        _this10.registerDisposer(_this10.chunkManager.recomputeChunkPriorities.add(function () {
            _this10.updateChunkPriorities();
        }));
        var scheduleUpdateChunkPriorities = function scheduleUpdateChunkPriorities() {
            _this10.chunkManager.scheduleUpdateChunkPriorities();
        };
        _this10.registerDisposer(_this10.viewStates.changed.add(function () {
            var viewStatesDisposers = _this10.viewStatesDisposers;
            var viewStates = _this10.viewStates;
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(viewStatesDisposers), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _ref3 = _step5.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var viewState = _ref4[0];
                    var disposer = _ref4[1];

                    if (!viewStates.has(viewState)) {
                        disposer();
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

            var _loop2 = function _loop2(_viewState2) {
                if (!viewStatesDisposers.has(_viewState2)) {
                    _viewState2.viewport.changed.add(scheduleUpdateChunkPriorities);
                    _viewState2.visibility.changed.add(scheduleUpdateChunkPriorities);
                    viewStatesDisposers.set(_viewState2, function () {
                        _viewState2.viewport.changed.remove(scheduleUpdateChunkPriorities);
                        _viewState2.visibility.changed.remove(scheduleUpdateChunkPriorities);
                    });
                }
            };

            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(viewStates), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var _viewState2 = _step6.value;

                    _loop2(_viewState2);
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
        }));
        _this10.registerDisposer(function () {
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = _getIterator(_this10.viewStatesDisposers.values()), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var disposer = _step7.value;

                    disposer();
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
        });
        return _this10;
    }

    _createClass(MultiscaleMeshLayer, [{
        key: "updateChunkPriorities",
        value: function updateChunkPriorities() {
            var _this11 = this;

            var maxVisibility = this.visibility.value;
            if (maxVisibility === Number.NEGATIVE_INFINITY) {
                return;
            }
            var manifestChunks = new Array();
            {
                var priorityTier = getPriorityTier(maxVisibility);
                var basePriority = getBasePriority(maxVisibility);
                var _source = this.source,
                    _chunkManager = this.chunkManager;

                forEachVisibleSegment(this, function (objectId) {
                    var manifestChunk = _source.getChunk(objectId);
                    _chunkManager.requestChunk(manifestChunk, priorityTier, basePriority + MESH_OBJECT_MANIFEST_CHUNK_PRIORITY);
                    var state = manifestChunk.state;
                    if (state === ChunkState.SYSTEM_MEMORY_WORKER || state === ChunkState.SYSTEM_MEMORY || state === ChunkState.GPU_MEMORY) {
                        manifestChunks.push(manifestChunk);
                    }
                });
            }
            if (manifestChunks.length === 0) return;
            var source = this.source,
                chunkManager = this.chunkManager;

            var _loop3 = function _loop3(viewState) {
                var visibility = viewState.visibility.value;
                if (visibility === Number.NEGATIVE_INFINITY) {
                    return "continue";
                }
                var priorityTier = getPriorityTier(visibility);
                var basePriority = getBasePriority(visibility);
                var viewport = viewState.viewport.value;
                var modelViewProjection = mat4.create();
                mat4.multiply(modelViewProjection, viewport.viewProjectionMat, mat4.multiply(modelViewProjection, _this11.objectToDataTransform.value, source.format.transform));
                var clippingPlanes = getFrustrumPlanes(new Float32Array(24), modelViewProjection);
                var detailCutoff = _this11.renderScaleTarget.value;

                var _loop4 = function _loop4(manifestChunk) {
                    var maxLod = manifestChunk.manifest.lodScales.length - 1;
                    getDesiredMultiscaleMeshChunks(manifestChunk.manifest, modelViewProjection, clippingPlanes, detailCutoff, viewport.width, viewport.height, function (lod, chunkIndex, _renderScale, empty) {
                        if (empty) return;
                        var fragmentChunk = source.getFragmentChunk(manifestChunk, lod, chunkIndex);
                        chunkManager.requestChunk(fragmentChunk, priorityTier, basePriority + MESH_OBJECT_FRAGMENT_CHUNK_PRIORITY - maxLod + lod);
                    });
                };

                var _iteratorNormalCompletion9 = true;
                var _didIteratorError9 = false;
                var _iteratorError9 = undefined;

                try {
                    for (var _iterator9 = _getIterator(manifestChunks), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                        var manifestChunk = _step9.value;

                        _loop4(manifestChunk);
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
            };

            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(this.viewStates), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var viewState = _step8.value;

                    var _ret3 = _loop3(viewState);

                    if (_ret3 === "continue") continue;
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
        }
    }]);

    return MultiscaleMeshLayer;
}(SegmentationLayerSharedObjectCounterpart);
MultiscaleMeshLayer = __decorate([registerSharedObject(MULTISCALE_MESH_LAYER_RPC_ID)], MultiscaleMeshLayer);
export { MultiscaleMeshLayer };
function convertMeshData(data, vertexPositionFormat) {
    var normals = computeVertexNormals(data.vertexPositions, data.indices);
    var encodedNormals = new Uint8Array(normals.length / 3 * 2);
    encodeNormals32fx3ToOctahedron8x2(encodedNormals, normals);
    var encodedIndices = void 0;
    var strips = void 0;
    if (CONVERT_TO_TRIANGLE_STRIPS) {
        encodedIndices = computeTriangleStrips(data.indices, data.subChunkOffsets);
        strips = true;
    } else {
        if (data.indices.BYTES_PER_ELEMENT === 4 && data.vertexPositions.length / 3 < 65535) {
            encodedIndices = new Uint16Array(data.indices.length);
            encodedIndices.set(data.indices);
        } else {
            encodedIndices = data.indices;
        }
        strips = false;
    }
    var encodedVertexPositions = void 0;
    if (vertexPositionFormat === VertexPositionFormat.uint10) {
        var vertexPositions = data.vertexPositions;
        var numVertices = vertexPositions.length / 3;
        encodedVertexPositions = new Uint32Array(numVertices);
        for (var inputIndex = 0, outputIndex = 0; outputIndex < numVertices; inputIndex += 3, ++outputIndex) {
            encodedVertexPositions[outputIndex] = vertexPositions[inputIndex] & 1023 | (vertexPositions[inputIndex + 1] & 1023) << 10 | (vertexPositions[inputIndex + 2] & 1023) << 20;
        }
    } else if (vertexPositionFormat === VertexPositionFormat.uint16) {
        var _vertexPositions = data.vertexPositions;
        if (_vertexPositions.BYTES_PER_ELEMENT === 2) {
            encodedVertexPositions = _vertexPositions;
        } else {
            encodedVertexPositions = new Uint16Array(_vertexPositions.length);
            encodedVertexPositions.set(_vertexPositions);
        }
    } else {
        encodedVertexPositions = data.vertexPositions;
    }
    return {
        vertexPositions: encodedVertexPositions,
        vertexNormals: encodedNormals,
        indices: encodedIndices,
        strips: strips
    };
}
export function assignMeshFragmentData(chunk, data) {
    var vertexPositionFormat = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : VertexPositionFormat.float32;

    chunk.meshData = convertMeshData(data, vertexPositionFormat);
}
export function assignMultiscaleMeshFragmentData(chunk, data, vertexPositionFormat) {
    chunk.meshData = convertMeshData(data, vertexPositionFormat);
    chunk.subChunkOffsets = data.subChunkOffsets;
}
export function generateHigherOctreeLevel(octree, priorStart, priorEnd) {
    var curEnd = priorEnd;
    for (var i = 0; i < 3; ++i) {
        octree[curEnd * 5 + i] = octree[priorStart * 5 + i] >>> 1;
    }
    octree[curEnd * 5 + 3] = priorStart;
    for (var _i2 = priorStart + 1; _i2 < priorEnd; ++_i2) {
        var x = octree[_i2 * 5] >>> 1,
            y = octree[_i2 * 5 + 1] >>> 1,
            z = octree[_i2 * 5 + 2] >>> 1;
        if (x !== octree[curEnd * 5] || y !== octree[curEnd * 5 + 1] || z !== octree[curEnd * 5 + 2]) {
            octree[curEnd * 5 + 4] = _i2;
            ++curEnd;
            octree[curEnd * 5] = x;
            octree[curEnd * 5 + 1] = y;
            octree[curEnd * 5 + 2] = z;
            octree[curEnd * 5 + 3] = _i2;
        }
    }
    octree[curEnd * 5 + 4] = priorEnd;
    ++curEnd;
    return curEnd;
}
export function computeOctreeChildOffsets(octree, childStart, childEnd, parentEnd) {
    var childNode = childStart;
    for (var parentNode = childEnd; parentNode < parentEnd; ++parentNode) {
        var parentX = octree[parentNode * 5],
            parentY = octree[parentNode * 5 + 1],
            parentZ = octree[parentNode * 5 + 2];
        while (childNode < childEnd) {
            var childX = octree[childNode * 5] >>> 1,
                childY = octree[childNode * 5 + 1] >>> 1,
                childZ = octree[childNode * 5 + 2] >>> 1;
            if (!zorder3LessThan(childX, childY, childZ, parentX, parentY, parentZ)) {
                break;
            }
            ++childNode;
        }
        octree[parentNode * 5 + 3] = childNode;
        while (childNode < childEnd) {
            var _childX = octree[childNode * 5] >>> 1,
                _childY = octree[childNode * 5 + 1] >>> 1,
                _childZ = octree[childNode * 5 + 2] >>> 1;
            if (_childX != parentX || _childY != parentY || _childZ != parentZ) {
                break;
            }
            ++childNode;
        }
        octree[parentNode * 5 + 4] += childNode;
    }
}
//# sourceMappingURL=backend.js.map