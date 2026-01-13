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
import { decodeVertexPositionsAndIndices } from "../mesh/backend";
import { SegmentationLayerSharedObjectCounterpart } from "../segmentation_display_state/backend";
import { forEachVisibleSegment, getObjectKey } from "../segmentation_display_state/base";
import { SKELETON_LAYER_RPC_ID } from "./base";
import { Uint64 } from "../util/uint64";
import { getBasePriority, getPriorityTier } from "../visibility_priority/backend";
import { registerSharedObject } from "../worker_rpc";
var SKELETON_CHUNK_PRIORITY = 60;
// Chunk that contains the skeleton of a single object.
export var SkeletonChunk = function (_Chunk) {
    _inherits(SkeletonChunk, _Chunk);

    function SkeletonChunk() {
        _classCallCheck(this, SkeletonChunk);

        var _this = _possibleConstructorReturn(this, (SkeletonChunk.__proto__ || _Object$getPrototypeOf(SkeletonChunk)).call(this));

        _this.objectId = new Uint64();
        _this.vertexPositions = null;
        _this.vertexAttributes = null;
        _this.indices = null;
        return _this;
    }

    _createClass(SkeletonChunk, [{
        key: "initializeSkeletonChunk",
        value: function initializeSkeletonChunk(key, objectId) {
            _get(SkeletonChunk.prototype.__proto__ || _Object$getPrototypeOf(SkeletonChunk.prototype), "initialize", this).call(this, key);
            this.objectId.assign(objectId);
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.vertexPositions = this.indices = null;
        }
    }, {
        key: "getVertexAttributeBytes",
        value: function getVertexAttributeBytes() {
            var total = this.vertexPositions.byteLength;
            var vertexAttributes = this.vertexAttributes;

            if (vertexAttributes != null) {
                vertexAttributes.forEach(function (a) {
                    total += a.byteLength;
                });
            }
            return total;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(SkeletonChunk.prototype.__proto__ || _Object$getPrototypeOf(SkeletonChunk.prototype), "serialize", this).call(this, msg, transfers);
            var vertexPositions = this.vertexPositions;
            var indices = this.indices;
            msg['numVertices'] = vertexPositions.length / 3;
            msg['indices'] = indices;
            transfers.push(indices.buffer);
            var vertexAttributes = this.vertexAttributes;

            if (vertexAttributes != null && vertexAttributes.length > 0) {
                var vertexData = new Uint8Array(this.getVertexAttributeBytes());
                vertexData.set(new Uint8Array(vertexPositions.buffer, vertexPositions.byteOffset, vertexPositions.byteLength));
                var vertexAttributeOffsets = msg['vertexAttributeOffsets'] = new Uint32Array(vertexAttributes.length + 1);
                vertexAttributeOffsets[0] = 0;
                var offset = vertexPositions.byteLength;
                vertexAttributes.forEach(function (a, i) {
                    vertexAttributeOffsets[i + 1] = offset;
                    vertexData.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), offset);
                    offset += a.byteLength;
                });
                transfers.push(vertexData.buffer);
                msg['vertexAttributes'] = vertexData;
            } else {
                msg['vertexAttributes'] = new Uint8Array(vertexPositions.buffer, vertexPositions.byteOffset, vertexPositions.byteLength);
                msg['vertexAttributeOffsets'] = Uint32Array.of(0);
                if (vertexPositions.buffer !== transfers[0]) {
                    transfers.push(vertexPositions.buffer);
                }
            }
            this.vertexPositions = this.indices = this.vertexAttributes = null;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.gpuMemoryBytes = this.indices.byteLength + this.getVertexAttributeBytes();
            _get(SkeletonChunk.prototype.__proto__ || _Object$getPrototypeOf(SkeletonChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }]);

    return SkeletonChunk;
}(Chunk);
export var SkeletonSource = function (_ChunkSource) {
    _inherits(SkeletonSource, _ChunkSource);

    function SkeletonSource() {
        _classCallCheck(this, SkeletonSource);

        return _possibleConstructorReturn(this, (SkeletonSource.__proto__ || _Object$getPrototypeOf(SkeletonSource)).apply(this, arguments));
    }

    _createClass(SkeletonSource, [{
        key: "getChunk",
        value: function getChunk(objectId) {
            var key = getObjectKey(objectId);
            var chunk = this.chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(SkeletonChunk);
                chunk.initializeSkeletonChunk(key, objectId);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }]);

    return SkeletonSource;
}(ChunkSource);
var SkeletonLayer = function (_SegmentationLayerSha) {
    _inherits(SkeletonLayer, _SegmentationLayerSha);

    function SkeletonLayer(rpc, options) {
        _classCallCheck(this, SkeletonLayer);

        var _this3 = _possibleConstructorReturn(this, (SkeletonLayer.__proto__ || _Object$getPrototypeOf(SkeletonLayer)).call(this, rpc, options));

        _this3.source = _this3.registerDisposer(rpc.getRef(options['source']));
        _this3.registerDisposer(_this3.chunkManager.recomputeChunkPriorities.add(function () {
            _this3.updateChunkPriorities();
        }));
        return _this3;
    }

    _createClass(SkeletonLayer, [{
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
                var chunk = source.getChunk(objectId);
                chunkManager.requestChunk(chunk, priorityTier, basePriority + SKELETON_CHUNK_PRIORITY);
            });
        }
    }]);

    return SkeletonLayer;
}(SegmentationLayerSharedObjectCounterpart);
SkeletonLayer = __decorate([registerSharedObject(SKELETON_LAYER_RPC_ID)], SkeletonLayer);
export { SkeletonLayer };
/**
 * Extracts vertex positions and edge vertex indices of the specified endianness from `data'.
 *
 * See documentation of decodeVertexPositionsAndIndices.
 */
export function decodeSkeletonVertexPositionsAndIndices(chunk, data, endianness, vertexByteOffset, numVertices, indexByteOffset, numEdges) {
    var meshData = decodeVertexPositionsAndIndices(
    /*verticesPerPrimitive=*/2, data, endianness, vertexByteOffset, numVertices, indexByteOffset, numEdges);
    chunk.vertexPositions = meshData.vertexPositions;
    chunk.indices = meshData.indices;
}
//# sourceMappingURL=backend.js.map