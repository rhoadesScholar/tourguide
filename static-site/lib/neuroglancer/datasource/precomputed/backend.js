import _Math$log from "babel-runtime/core-js/math/log2";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _Map from "babel-runtime/core-js/map";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";

var getShardedData = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(minishardIndexSource, chunk, key, cancellationToken) {
        var sharding, hashFunction, hashCode, shardAndMinishard, getPriority, minishardIndex, _findMinishardEntry, startOffset, endOffset, data;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        sharding = minishardIndexSource.sharding;
                        hashFunction = shardingHashFunctions.get(sharding.hash);
                        hashCode = Uint64.rshift(new Uint64(), key, sharding.preshiftBits);

                        hashFunction(hashCode);
                        shardAndMinishard = Uint64.lowMask(new Uint64(), sharding.minishardBits + sharding.shardBits);

                        Uint64.and(shardAndMinishard, shardAndMinishard, hashCode);

                        getPriority = function getPriority() {
                            return { priorityTier: chunk.priorityTier, priority: chunk.priority };
                        };

                        _context2.next = 9;
                        return minishardIndexSource.getData(shardAndMinishard, getPriority, cancellationToken);

                    case 9:
                        minishardIndex = _context2.sent;
                        _findMinishardEntry = findMinishardEntry(minishardIndex, key), startOffset = _findMinishardEntry.startOffset, endOffset = _findMinishardEntry.endOffset;
                        _context2.next = 13;
                        return fetchHttpByteRange(minishardIndex.shardUrl, startOffset, endOffset, cancellationToken);

                    case 13:
                        data = _context2.sent;

                        if (!(minishardIndexSource.sharding.dataEncoding === DataEncoding.GZIP)) {
                            _context2.next = 18;
                            break;
                        }

                        _context2.next = 17;
                        return requestAsyncComputation(decodeGzip, cancellationToken, [data], new Uint8Array(data));

                    case 17:
                        data = _context2.sent.buffer;

                    case 18:
                        return _context2.abrupt("return", { data: data, shardInfo: { shardUrl: minishardIndex.shardUrl, offset: startOffset } });

                    case 19:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function getShardedData(_x3, _x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
}();

var decodeMultiscaleFragmentChunk = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(chunk, response) {
        var lod, source, m, rawMesh;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        lod = chunk.lod;
                        source = chunk.manifestChunk.source;
                        _context4.next = 4;
                        return import( /* webpackChunkName: "draco" */"../../mesh/draco");

                    case 4:
                        m = _context4.sent;
                        _context4.next = 7;
                        return m.decodeDracoPartitioned(new Uint8Array(response), source.parameters.metadata.vertexQuantizationBits, lod !== 0);

                    case 7:
                        rawMesh = _context4.sent;

                        assignMultiscaleMeshFragmentData(chunk, rawMesh, source.format.vertexPositionFormat);

                    case 9:
                    case "end":
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function decodeMultiscaleFragmentChunk(_x9, _x10) {
        return _ref4.apply(this, arguments);
    };
}();

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
import { decodeGzip } from "../../async_computation/decode_gzip_request";
import { requestAsyncComputation } from "../../async_computation/request";
import { WithParameters } from "../../chunk_manager/backend";
import { GenericSharedDataSource } from "../../chunk_manager/generic_file_source";
import { DataEncoding, MeshSourceParameters, MultiscaleMeshSourceParameters, ShardingHashFunction, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters } from "./base";
import { assignMeshFragmentData, assignMultiscaleMeshFragmentData, computeOctreeChildOffsets, decodeJsonManifestChunk, decodeTriangleVertexPositionsAndIndices, generateHigherOctreeLevel, MeshSource, MultiscaleMeshSource } from "../../mesh/backend";
import { SkeletonSource } from "../../skeleton/backend";
import { decodeSkeletonChunk } from "../../skeleton/decode_precomputed_skeleton";
import { decodeCompressedSegmentationChunk } from "../../sliceview/backend_chunk_decoders/compressed_segmentation";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { fetchHttpByteRange } from "../../util/byte_range_http_requests";
import { convertEndian32, Endianness } from "../../util/endian";
import { vec3 } from "../../util/geom";
import { murmurHash3_x86_128Hash64Bits } from "../../util/hash";
import { cancellableFetchOk, responseArrayBuffer, responseJson } from "../../util/http_request";
import { stableStringify } from "../../util/json";
import { Uint64 } from "../../util/uint64";
import { encodeZIndexCompressed } from "../../util/zorder";
import { registerSharedObject } from "../../worker_rpc";
var shardingHashFunctions = new _Map([[ShardingHashFunction.MURMURHASH3_X86_128, function (out) {
    murmurHash3_x86_128Hash64Bits(out, 0, out.low, out.high);
}], [ShardingHashFunction.IDENTITY, function (_out) {}]]);
function getMinishardIndexDataSource(chunkManager, parameters) {
    var url = parameters.url,
        sharding = parameters.sharding;

    if (sharding === undefined) return undefined;
    var source = GenericSharedDataSource.get(chunkManager, stableStringify({ type: 'precomputed:shardedDataSource', url: url, sharding: sharding }), {
        download: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(shardAndMinishard, cancellationToken) {
                var minishard, shard, temp, shardUrlPrefix, indexUrl, shardIndexStart, shardIndexEnd, shardIndexResponse, shardIndexDv, minishardStartOffset, minishardEndOffset, dataUrl, minishardIndexResponse, minishardIndex, minishardIndexSize, prevEntryKeyLow, prevEntryKeyHigh, prevStartLow, prevStartHigh, i, entryKeyLow, entryKeyHigh, startLow, startHigh, sizeLow, sizeHigh, endLow, endHigh;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                minishard = Uint64.lowMask(new Uint64(), sharding.minishardBits);

                                Uint64.and(minishard, minishard, shardAndMinishard);
                                shard = Uint64.lowMask(new Uint64(), sharding.shardBits);
                                temp = new Uint64();

                                Uint64.rshift(temp, shardAndMinishard, sharding.minishardBits);
                                Uint64.and(shard, shard, temp);
                                shardUrlPrefix = url + "/" + shard.toString(16).padStart(Math.ceil(sharding.shardBits / 4), '0');
                                // Retrive minishard index start/end offsets.

                                indexUrl = shardUrlPrefix + '.index';
                                // Multiply minishard by 16.

                                shardIndexStart = Uint64.lshift(new Uint64(), minishard, 4);
                                shardIndexEnd = Uint64.addUint32(new Uint64(), shardIndexStart, 16);
                                _context.next = 12;
                                return fetchHttpByteRange(indexUrl, shardIndexStart, shardIndexEnd, cancellationToken);

                            case 12:
                                shardIndexResponse = _context.sent;

                                if (!(shardIndexResponse.byteLength !== 16)) {
                                    _context.next = 15;
                                    break;
                                }

                                throw new Error("Failed to retrieve minishard offset");

                            case 15:
                                shardIndexDv = new DataView(shardIndexResponse);
                                minishardStartOffset = new Uint64(shardIndexDv.getUint32(0, /*littleEndian=*/true), shardIndexDv.getUint32(4, /*littleEndian=*/true));
                                minishardEndOffset = new Uint64(shardIndexDv.getUint32(8, /*littleEndian=*/true), shardIndexDv.getUint32(12, /*littleEndian=*/true));

                                if (!Uint64.equal(minishardStartOffset, minishardEndOffset)) {
                                    _context.next = 20;
                                    break;
                                }

                                throw new Error('Object not found');

                            case 20:
                                dataUrl = shardUrlPrefix + '.data';
                                _context.next = 23;
                                return fetchHttpByteRange(dataUrl, minishardStartOffset, minishardEndOffset, cancellationToken);

                            case 23:
                                minishardIndexResponse = _context.sent;

                                if (!(sharding.minishardIndexEncoding === DataEncoding.GZIP)) {
                                    _context.next = 28;
                                    break;
                                }

                                _context.next = 27;
                                return requestAsyncComputation(decodeGzip, cancellationToken, [minishardIndexResponse], new Uint8Array(minishardIndexResponse));

                            case 27:
                                minishardIndexResponse = _context.sent.buffer;

                            case 28:
                                if (!(minishardIndexResponse.byteLength % 24 !== 0)) {
                                    _context.next = 30;
                                    break;
                                }

                                throw new Error("Invalid minishard index length: " + minishardIndexResponse.byteLength);

                            case 30:
                                minishardIndex = new Uint32Array(minishardIndexResponse);

                                convertEndian32(minishardIndex, Endianness.LITTLE);
                                minishardIndexSize = minishardIndex.byteLength / 24;
                                prevEntryKeyLow = 0, prevEntryKeyHigh = 0, prevStartLow = 0, prevStartHigh = 0;

                                for (i = 0; i < minishardIndexSize; ++i) {
                                    entryKeyLow = prevEntryKeyLow + minishardIndex[i * 2];
                                    entryKeyHigh = prevEntryKeyHigh + minishardIndex[i * 2 + 1];

                                    if (entryKeyLow >= 4294967296) {
                                        entryKeyLow -= 4294967296;
                                        entryKeyHigh += 1;
                                    }
                                    prevEntryKeyLow = minishardIndex[i * 2] = entryKeyLow;
                                    prevEntryKeyHigh = minishardIndex[i * 2 + 1] = entryKeyHigh;
                                    startLow = prevStartLow + minishardIndex[(minishardIndexSize + i) * 2];
                                    startHigh = prevStartHigh + minishardIndex[(minishardIndexSize + i) * 2 + 1];

                                    if (startLow >= 4294967296) {
                                        startLow -= 4294967296;
                                        startHigh += 1;
                                    }
                                    minishardIndex[(minishardIndexSize + i) * 2] = startLow;
                                    minishardIndex[(minishardIndexSize + i) * 2 + 1] = startHigh;
                                    sizeLow = minishardIndex[(2 * minishardIndexSize + i) * 2];
                                    sizeHigh = minishardIndex[(2 * minishardIndexSize + i) * 2 + 1];
                                    endLow = startLow + sizeLow;
                                    endHigh = startHigh + sizeHigh;

                                    if (endLow >= 4294967296) {
                                        endLow -= 4294967296;
                                        endHigh += 1;
                                    }
                                    prevStartLow = endLow;
                                    prevStartHigh = endHigh;
                                    minishardIndex[(2 * minishardIndexSize + i) * 2] = endLow;
                                    minishardIndex[(2 * minishardIndexSize + i) * 2 + 1] = endHigh;
                                }
                                return _context.abrupt("return", {
                                    data: { data: minishardIndex, shardUrl: dataUrl },
                                    size: minishardIndex.byteLength
                                });

                            case 36:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function download(_x, _x2) {
                return _ref.apply(this, arguments);
            }

            return download;
        }(),
        encodeKey: function encodeKey(key) {
            return key.toString();
        },
        sourceQueueLevel: 1
    });
    source.sharding = sharding;
    return source;
}
function findMinishardEntry(minishardIndex, key) {
    var minishardIndexData = minishardIndex.data;
    var minishardIndexSize = minishardIndexData.length / 6;
    var keyLow = key.low,
        keyHigh = key.high;
    for (var i = 0; i < minishardIndexSize; ++i) {
        if (minishardIndexData[i * 2] !== keyLow || minishardIndexData[i * 2 + 1] !== keyHigh) {
            continue;
        }
        var startOffset = new Uint64(minishardIndexData[(minishardIndexSize + i) * 2], minishardIndexData[(minishardIndexSize + i) * 2 + 1]);
        var endOffset = new Uint64(minishardIndexData[(2 * minishardIndexSize + i) * 2], minishardIndexData[(2 * minishardIndexSize + i) * 2 + 1]);
        return { startOffset: startOffset, endOffset: endOffset };
    }
    throw new Error("Object not found in minishard: " + key);
}

var chunkDecoders = new _Map();
chunkDecoders.set(VolumeChunkEncoding.RAW, decodeRawChunk);
chunkDecoders.set(VolumeChunkEncoding.JPEG, decodeJpegChunk);
chunkDecoders.set(VolumeChunkEncoding.COMPRESSED_SEGMENTATION, decodeCompressedSegmentationChunk);
var PrecomputedVolumeChunkSource = function (_WithParameters) {
    _inherits(PrecomputedVolumeChunkSource, _WithParameters);

    function PrecomputedVolumeChunkSource() {
        _classCallCheck(this, PrecomputedVolumeChunkSource);

        var _this = _possibleConstructorReturn(this, (PrecomputedVolumeChunkSource.__proto__ || _Object$getPrototypeOf(PrecomputedVolumeChunkSource)).apply(this, arguments));

        _this.chunkDecoder = chunkDecoders.get(_this.parameters.encoding);
        _this.minishardIndexSource = getMinishardIndexDataSource(_this.chunkManager, _this.parameters);
        _this.gridShape = function () {
            var gridShape = new Uint32Array(3);
            var _this$spec = _this.spec,
                upperVoxelBound = _this$spec.upperVoxelBound,
                chunkDataSize = _this$spec.chunkDataSize;

            for (var i = 0; i < 3; ++i) {
                gridShape[i] = Math.ceil(upperVoxelBound[i] / chunkDataSize[i]);
            }
            return gridShape;
        }();
        return _this;
    }

    _createClass(PrecomputedVolumeChunkSource, [{
        key: "download",
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(chunk, cancellationToken) {
                var parameters, minishardIndexSource, response, url, chunkPosition, chunkDataSize, gridShape, chunkGridPosition, xBits, yBits, zBits, chunkIndex;
                return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                parameters = this.parameters;
                                minishardIndexSource = this.minishardIndexSource;
                                response = void 0;

                                if (!(minishardIndexSource === undefined)) {
                                    _context3.next = 13;
                                    break;
                                }

                                url = void 0;

                                // chunkPosition must not be captured, since it will be invalidated by the next call to
                                // computeChunkBounds.
                                chunkPosition = this.computeChunkBounds(chunk);
                                chunkDataSize = chunk.chunkDataSize;

                                url = parameters.url + "/" + chunkPosition[0] + "-" + (chunkPosition[0] + chunkDataSize[0]) + "_" + (chunkPosition[1] + "-" + (chunkPosition[1] + chunkDataSize[1]) + "_") + (chunkPosition[2] + "-" + (chunkPosition[2] + chunkDataSize[2]));
                                _context3.next = 10;
                                return cancellableFetchOk(url, {}, responseArrayBuffer, cancellationToken);

                            case 10:
                                response = _context3.sent;
                                _context3.next = 21;
                                break;

                            case 13:
                                this.computeChunkBounds(chunk);
                                gridShape = this.gridShape;
                                chunkGridPosition = chunk.chunkGridPosition;
                                xBits = Math.ceil(_Math$log(gridShape[0])), yBits = Math.ceil(_Math$log(gridShape[1])), zBits = Math.ceil(_Math$log(gridShape[2]));
                                chunkIndex = encodeZIndexCompressed(new Uint64(), xBits, yBits, zBits, chunkGridPosition[0], chunkGridPosition[1], chunkGridPosition[2]);
                                _context3.next = 20;
                                return getShardedData(minishardIndexSource, chunk, chunkIndex, cancellationToken);

                            case 20:
                                response = _context3.sent.data;

                            case 21:
                                _context3.next = 23;
                                return this.chunkDecoder(chunk, cancellationToken, response);

                            case 23:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function download(_x7, _x8) {
                return _ref3.apply(this, arguments);
            }

            return download;
        }()
    }]);

    return PrecomputedVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));
PrecomputedVolumeChunkSource = __decorate([registerSharedObject()], PrecomputedVolumeChunkSource);
export { PrecomputedVolumeChunkSource };
export function decodeManifestChunk(chunk, response) {
    return decodeJsonManifestChunk(chunk, response, 'fragments');
}
export function decodeFragmentChunk(chunk, response) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    assignMeshFragmentData(chunk, decodeTriangleVertexPositionsAndIndices(response, Endianness.LITTLE, /*vertexByteOffset=*/4, numVertices));
}
var PrecomputedMeshSource = function (_WithParameters2) {
    _inherits(PrecomputedMeshSource, _WithParameters2);

    function PrecomputedMeshSource() {
        _classCallCheck(this, PrecomputedMeshSource);

        return _possibleConstructorReturn(this, (PrecomputedMeshSource.__proto__ || _Object$getPrototypeOf(PrecomputedMeshSource)).apply(this, arguments));
    }

    _createClass(PrecomputedMeshSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            return cancellableFetchOk(parameters.url + "/" + chunk.objectId + ":" + parameters.lod, {}, responseJson, cancellationToken).then(function (response) {
                return decodeManifestChunk(chunk, response);
            });
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            return cancellableFetchOk(parameters.url + "/" + chunk.fragmentId, {}, responseArrayBuffer, cancellationToken).then(function (response) {
                return decodeFragmentChunk(chunk, response);
            });
        }
    }]);

    return PrecomputedMeshSource;
}(WithParameters(MeshSource, MeshSourceParameters));
PrecomputedMeshSource = __decorate([registerSharedObject()], PrecomputedMeshSource);
export { PrecomputedMeshSource };
function decodeMultiscaleManifestChunk(chunk, response) {
    if (response.byteLength < 28 || response.byteLength % 4 !== 0) {
        throw new Error("Invalid index file size: " + response.byteLength);
    }
    var dv = new DataView(response);
    var offset = 0;
    var chunkShape = vec3.fromValues(dv.getFloat32(offset, /*littleEndian=*/true), dv.getFloat32(offset + 4, /*littleEndian=*/true), dv.getFloat32(offset + 8, /*littleEndian=*/true));
    offset += 12;
    var gridOrigin = vec3.fromValues(dv.getFloat32(offset, /*littleEndian=*/true), dv.getFloat32(offset + 4, /*littleEndian=*/true), dv.getFloat32(offset + 8, /*littleEndian=*/true));
    offset += 12;
    var numStoredLods = dv.getUint32(offset, /*littleEndian=*/true);
    offset += 4;
    if (response.byteLength < offset + (4 + 4 + 4 * 3) * numStoredLods) {
        throw new Error("Invalid index file size for " + numStoredLods + " lods: " + response.byteLength);
    }
    var storedLodScales = new Float32Array(response, offset, numStoredLods);
    offset += 4 * numStoredLods;
    convertEndian32(storedLodScales, Endianness.LITTLE);
    var vertexOffsets = new Float32Array(response, offset, numStoredLods * 3);
    convertEndian32(vertexOffsets, Endianness.LITTLE);
    offset += 12 * numStoredLods;
    var numFragmentsPerLod = new Uint32Array(response, offset, numStoredLods);
    offset += 4 * numStoredLods;
    convertEndian32(numFragmentsPerLod, Endianness.LITTLE);
    var totalFragments = numFragmentsPerLod.reduce(function (a, b) {
        return a + b;
    });
    if (response.byteLength !== offset + 16 * totalFragments) {
        throw new Error("Invalid index file size for " + numStoredLods + " lods and " + (totalFragments + " total fragments: " + response.byteLength));
    }
    var fragmentInfo = new Uint32Array(response, offset);
    convertEndian32(fragmentInfo, Endianness.LITTLE);
    var clipUpperBound = vec3.fromValues(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    var clipLowerBound = vec3.fromValues(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    var numLods = Math.max(1, storedLodScales.length);
    {
        var fragmentBase = 0;
        for (var lodIndex = 0; lodIndex < numStoredLods; ++lodIndex) {
            var numFragments = numFragmentsPerLod[lodIndex];
            for (var i = 0; i < 3; ++i) {
                var upperBoundValue = Number.NEGATIVE_INFINITY;
                var lowerBoundValue = Number.POSITIVE_INFINITY;
                var base = fragmentBase + numFragments * i;
                for (var j = 0; j < numFragments; ++j) {
                    var v = fragmentInfo[base + j];
                    upperBoundValue = Math.max(upperBoundValue, v);
                    lowerBoundValue = Math.min(lowerBoundValue, v);
                }
                if (numFragments != 0) {
                    while (upperBoundValue >>> numLods - lodIndex - 1 != lowerBoundValue >>> numLods - lodIndex - 1) {
                        ++numLods;
                    }
                    if (lodIndex === 0) {
                        clipLowerBound[i] = Math.min(clipLowerBound[i], (1 << lodIndex) * lowerBoundValue);
                        clipUpperBound[i] = Math.max(clipUpperBound[i], (1 << lodIndex) * (upperBoundValue + 1));
                    }
                }
            }
            fragmentBase += numFragments * 4;
        }
    }
    var maxFragments = 0;
    {
        var prevNumFragments = 0;
        var prevLodIndex = 0;
        for (var _lodIndex = 0; _lodIndex < numStoredLods; ++_lodIndex) {
            var _numFragments = numFragmentsPerLod[_lodIndex];
            maxFragments += prevNumFragments * (_lodIndex - prevLodIndex);
            prevLodIndex = _lodIndex;
            prevNumFragments = _numFragments;
            maxFragments += _numFragments;
        }
        maxFragments += (numLods - 1 - prevLodIndex) * prevNumFragments;
    }
    var octreeTemp = new Uint32Array(5 * maxFragments);
    var offsetsTemp = new Float64Array(maxFragments + 1);
    var octree = void 0;
    {
        var priorStart = 0;
        var baseRow = 0;
        var dataOffset = 0;
        var _fragmentBase = 0;
        for (var _lodIndex2 = 0; _lodIndex2 < numStoredLods; ++_lodIndex2) {
            var _numFragments2 = numFragmentsPerLod[_lodIndex2];
            // Copy in indices
            for (var _j = 0; _j < _numFragments2; ++_j) {
                for (var _i = 0; _i < 3; ++_i) {
                    octreeTemp[5 * (baseRow + _j) + _i] = fragmentInfo[_fragmentBase + _j + _i * _numFragments2];
                }
                var dataSize = fragmentInfo[_fragmentBase + _j + 3 * _numFragments2];
                dataOffset += dataSize;
                offsetsTemp[baseRow + _j + 1] = dataOffset;
                if (dataSize === 0) {
                    // Mark node as empty.
                    octreeTemp[5 * (baseRow + _j) + 4] = 0x80000000;
                }
            }
            _fragmentBase += 4 * _numFragments2;
            if (_lodIndex2 !== 0) {
                // Connect with prior level
                computeOctreeChildOffsets(octreeTemp, priorStart, baseRow, baseRow + _numFragments2);
            }
            priorStart = baseRow;
            baseRow += _numFragments2;
            while (_lodIndex2 + 1 < numLods && (_lodIndex2 + 1 >= storedLodScales.length || storedLodScales[_lodIndex2 + 1] === 0)) {
                var curEnd = generateHigherOctreeLevel(octreeTemp, priorStart, baseRow);
                offsetsTemp.fill(dataOffset, baseRow + 1, curEnd + 1);
                priorStart = baseRow;
                baseRow = curEnd;
                ++_lodIndex2;
            }
        }
        octree = octreeTemp.slice(0, 5 * baseRow);
        chunk.offsets = offsetsTemp.slice(0, baseRow + 1);
    }
    var source = chunk.source;
    var lodScaleMultiplier = source.parameters.metadata.lodScaleMultiplier;

    var lodScales = new Float32Array(numLods);
    lodScales.set(storedLodScales, 0);
    for (var _i2 = 0; _i2 < storedLodScales.length; ++_i2) {
        lodScales[_i2] *= lodScaleMultiplier;
    }
    chunk.manifest = {
        chunkShape: chunkShape,
        chunkGridSpatialOrigin: gridOrigin,
        clipLowerBound: vec3.add(clipLowerBound, gridOrigin, vec3.multiply(clipLowerBound, clipLowerBound, chunkShape)),
        clipUpperBound: vec3.add(clipUpperBound, gridOrigin, vec3.multiply(clipUpperBound, clipUpperBound, chunkShape)),
        octree: octree,
        lodScales: lodScales,
        vertexOffsets: vertexOffsets
    };
}

var PrecomputedMultiscaleMeshSource = function (_WithParameters3) {
    _inherits(PrecomputedMultiscaleMeshSource, _WithParameters3);

    function PrecomputedMultiscaleMeshSource() {
        _classCallCheck(this, PrecomputedMultiscaleMeshSource);

        var _this3 = _possibleConstructorReturn(this, (PrecomputedMultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(PrecomputedMultiscaleMeshSource)).apply(this, arguments));

        _this3.minishardIndexSource = getMinishardIndexDataSource(_this3.chunkManager, { url: _this3.parameters.url, sharding: _this3.parameters.metadata.sharding });
        return _this3;
    }

    _createClass(PrecomputedMultiscaleMeshSource, [{
        key: "download",
        value: function () {
            var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(chunk, cancellationToken) {
                var parameters, minishardIndexSource, data, _ref6;

                return _regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                parameters = this.parameters, minishardIndexSource = this.minishardIndexSource;
                                data = void 0;

                                if (!(minishardIndexSource === undefined)) {
                                    _context5.next = 8;
                                    break;
                                }

                                _context5.next = 5;
                                return cancellableFetchOk(parameters.url + "/" + chunk.objectId + ".index", {}, responseArrayBuffer, cancellationToken);

                            case 5:
                                data = _context5.sent;
                                _context5.next = 13;
                                break;

                            case 8:
                                _context5.next = 10;
                                return getShardedData(minishardIndexSource, chunk, chunk.objectId, cancellationToken);

                            case 10:
                                _ref6 = _context5.sent;
                                data = _ref6.data;
                                chunk.shardInfo = _ref6.shardInfo;

                            case 13:
                                _context5.next = 15;
                                return decodeMultiscaleManifestChunk(chunk, data);

                            case 15:
                            case "end":
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            }));

            function download(_x11, _x12) {
                return _ref5.apply(this, arguments);
            }

            return download;
        }()
    }, {
        key: "downloadFragment",
        value: function () {
            var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(chunk, cancellationToken) {
                var parameters, manifestChunk, chunkIndex, shardInfo, offsets, startOffset, endOffset, requestUrl, adjustedStartOffset, adjustedEndOffset, fullDataSize, startLow, startHigh, endLow, endHigh, response;
                return _regeneratorRuntime.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                parameters = this.parameters;
                                manifestChunk = chunk.manifestChunk;
                                chunkIndex = chunk.chunkIndex;
                                shardInfo = manifestChunk.shardInfo, offsets = manifestChunk.offsets;
                                startOffset = offsets[chunkIndex];
                                endOffset = offsets[chunkIndex + 1];
                                requestUrl = void 0;
                                adjustedStartOffset = void 0, adjustedEndOffset = void 0;

                                if (shardInfo !== undefined) {
                                    requestUrl = shardInfo.shardUrl;
                                    fullDataSize = offsets[offsets.length - 1];
                                    startLow = shardInfo.offset.low - fullDataSize + startOffset;
                                    startHigh = shardInfo.offset.high;
                                    endLow = startLow + endOffset - startOffset;
                                    endHigh = startHigh;

                                    while (startLow < 0) {
                                        startLow += 4294967296;
                                        startHigh -= 1;
                                    }
                                    while (endLow < 0) {
                                        endLow += 4294967296;
                                        endHigh -= 1;
                                    }
                                    while (endLow > 4294967296) {
                                        endLow -= 4294967296;
                                        endHigh += 1;
                                    }
                                    adjustedStartOffset = new Uint64(startLow, startHigh);
                                    adjustedEndOffset = new Uint64(endLow, endHigh);
                                } else {
                                    requestUrl = parameters.url + "/" + manifestChunk.objectId;
                                    adjustedStartOffset = startOffset;
                                    adjustedEndOffset = endOffset;
                                }
                                _context6.next = 11;
                                return fetchHttpByteRange(requestUrl, adjustedStartOffset, adjustedEndOffset, cancellationToken);

                            case 11:
                                response = _context6.sent;
                                _context6.next = 14;
                                return decodeMultiscaleFragmentChunk(chunk, response);

                            case 14:
                            case "end":
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            }));

            function downloadFragment(_x13, _x14) {
                return _ref7.apply(this, arguments);
            }

            return downloadFragment;
        }()
    }]);

    return PrecomputedMultiscaleMeshSource;
}(WithParameters(MultiscaleMeshSource, MultiscaleMeshSourceParameters));
PrecomputedMultiscaleMeshSource = __decorate([registerSharedObject() //
], PrecomputedMultiscaleMeshSource);
export { PrecomputedMultiscaleMeshSource };
var PrecomputedSkeletonSource = function (_WithParameters4) {
    _inherits(PrecomputedSkeletonSource, _WithParameters4);

    function PrecomputedSkeletonSource() {
        _classCallCheck(this, PrecomputedSkeletonSource);

        var _this4 = _possibleConstructorReturn(this, (PrecomputedSkeletonSource.__proto__ || _Object$getPrototypeOf(PrecomputedSkeletonSource)).apply(this, arguments));

        _this4.minishardIndexSource = getMinishardIndexDataSource(_this4.chunkManager, { url: _this4.parameters.url, sharding: _this4.parameters.metadata.sharding });
        return _this4;
    }

    _createClass(PrecomputedSkeletonSource, [{
        key: "download",
        value: function () {
            var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(chunk, cancellationToken) {
                var minishardIndexSource, parameters, response;
                return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                minishardIndexSource = this.minishardIndexSource, parameters = this.parameters;
                                response = void 0;

                                if (!(minishardIndexSource === undefined)) {
                                    _context7.next = 8;
                                    break;
                                }

                                _context7.next = 5;
                                return cancellableFetchOk(parameters.url + "/" + chunk.objectId, {}, responseArrayBuffer, cancellationToken);

                            case 5:
                                response = _context7.sent;
                                _context7.next = 11;
                                break;

                            case 8:
                                _context7.next = 10;
                                return getShardedData(minishardIndexSource, chunk, chunk.objectId, cancellationToken);

                            case 10:
                                response = _context7.sent.data;

                            case 11:
                                decodeSkeletonChunk(chunk, response, parameters.metadata.vertexAttributes);

                            case 12:
                            case "end":
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function download(_x15, _x16) {
                return _ref8.apply(this, arguments);
            }

            return download;
        }()
    }]);

    return PrecomputedSkeletonSource;
}(WithParameters(SkeletonSource, SkeletonSourceParameters));
PrecomputedSkeletonSource = __decorate([registerSharedObject() //
], PrecomputedSkeletonSource);
export { PrecomputedSkeletonSource };
//# sourceMappingURL=backend.js.map