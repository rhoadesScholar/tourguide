import _Promise from "babel-runtime/core-js/promise";
import _Set from "babel-runtime/core-js/set";
import _Object$assign from "babel-runtime/core-js/object/assign";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _Array$from from "babel-runtime/core-js/array/from";
import _Math$log from "babel-runtime/core-js/math/log2";
import _regeneratorRuntime from "babel-runtime/regenerator";
import _JSON$stringify from "babel-runtime/core-js/json/stringify";
import _asyncToGenerator from "babel-runtime/helpers/asyncToGenerator";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Map from "babel-runtime/core-js/map";
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
import { AnnotationSerializer, AnnotationType } from "../../annotation";
import { AnnotationGeometryData, AnnotationSource } from "../../annotation/backend";
import { WithParameters } from "../../chunk_manager/backend";
import { WithSharedCredentialsProviderCounterpart } from "../../credentials_provider/shared_counterpart";
import { makeRequest } from "./api";
import { AnnotationSourceParameters, MeshSourceParameters, MultiscaleMeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeSourceParameters } from "./base";
import { assignMeshFragmentData, assignMultiscaleMeshFragmentData, generateHigherOctreeLevel, MeshSource, MultiscaleMeshSource } from "../../mesh/backend";
import { VertexPositionFormat } from "../../mesh/base";
import { decodeSkeletonVertexPositionsAndIndices, SkeletonSource } from "../../skeleton/backend";
import { decodeCompressedSegmentationChunk } from "../../sliceview/backend_chunk_decoders/compressed_segmentation";
import { decodeJpegChunk } from "../../sliceview/backend_chunk_decoders/jpeg";
import { decodeRawChunk } from "../../sliceview/backend_chunk_decoders/raw";
import { VolumeChunkSource } from "../../sliceview/volume/backend";
import { convertEndian32, Endianness } from "../../util/endian";
import { kInfinityVec, kZeroVec, vec3, vec3Key } from "../../util/geom";
import { parseArray, parseFixedLengthArray, verifyObject, verifyObjectProperty, verifyOptionalString, verifyString, verifyStringArray } from "../../util/json";
import { Uint64 } from "../../util/uint64";
import { decodeZIndexCompressed, getOctreeChildIndex, zorder3LessThan, encodeZIndexCompressed } from "../../util/zorder";
import { registerSharedObject } from "../../worker_rpc";
var CHUNK_DECODERS = new _Map([[VolumeChunkEncoding.RAW, decodeRawChunk], [VolumeChunkEncoding.JPEG, decodeJpegChunk], [VolumeChunkEncoding.COMPRESSED_SEGMENTATION, decodeCompressedSegmentationChunk]]);
function applyChangeStack(changeStack, payload) {
    if (!changeStack) {
        return;
    }
    payload.change_spec = {
        change_stack_id: changeStack.changeStackId
    };
    if (changeStack.timeStamp) {
        payload.change_spec.time_stamp = changeStack.timeStamp;
    }
    if (changeStack.skipEquivalences) {
        payload.change_spec.skip_equivalences = changeStack.skipEquivalences;
    }
}
function BrainmapsSource(Base, parametersConstructor) {
    return WithParameters(WithSharedCredentialsProviderCounterpart()(Base), parametersConstructor);
}
var tempUint64 = new Uint64();
var BrainmapsVolumeChunkSource = function (_BrainmapsSource) {
    _inherits(BrainmapsVolumeChunkSource, _BrainmapsSource);

    function BrainmapsVolumeChunkSource() {
        _classCallCheck(this, BrainmapsVolumeChunkSource);

        var _this = _possibleConstructorReturn(this, (BrainmapsVolumeChunkSource.__proto__ || _Object$getPrototypeOf(BrainmapsVolumeChunkSource)).apply(this, arguments));

        _this.chunkDecoder = CHUNK_DECODERS.get(_this.parameters.encoding);
        return _this;
    }

    _createClass(BrainmapsVolumeChunkSource, [{
        key: "applyEncodingParams",
        value: function applyEncodingParams(payload) {
            var encoding = this.parameters.encoding;

            switch (encoding) {
                case VolumeChunkEncoding.RAW:
                    payload.subvolume_format = 'RAW';
                    break;
                case VolumeChunkEncoding.JPEG:
                    payload.subvolume_format = 'SINGLE_IMAGE';
                    payload.image_format_options = {
                        image_format: 'JPEG',
                        jpeg_quality: 70
                    };
                    return;
                case VolumeChunkEncoding.COMPRESSED_SEGMENTATION:
                    payload.subvolume_format = 'RAW';
                    payload.image_format_options = {
                        compressed_segmentation_block_size: vec3Key(this.spec.compressedSegmentationBlockSize)
                    };
                    break;
                default:
                    throw new Error("Invalid encoding: " + encoding);
            }
        }
    }, {
        key: "download",
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken) {
                var parameters, path, chunkPosition, chunkDataSize, payload, response;
                return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                parameters = this.parameters;
                                path = void 0;
                                // chunkPosition must not be captured, since it will be invalidated by the next call to
                                // computeChunkBounds.

                                chunkPosition = this.computeChunkBounds(chunk);
                                chunkDataSize = chunk.chunkDataSize;

                                path = "/v1/volumes/" + parameters['volumeId'] + "/subvolume:binary";
                                payload = {
                                    geometry: {
                                        corner: vec3Key(chunkPosition),
                                        size: vec3Key(chunkDataSize),
                                        scale: parameters.scaleIndex
                                    }
                                };

                                this.applyEncodingParams(payload);
                                applyChangeStack(parameters.changeSpec, payload);
                                _context.next = 10;
                                return makeRequest(parameters['instance'], this.credentialsProvider, {
                                    method: 'POST',
                                    payload: _JSON$stringify(payload),
                                    path: path,
                                    responseType: 'arraybuffer'
                                }, cancellationToken);

                            case 10:
                                response = _context.sent;
                                _context.next = 13;
                                return this.chunkDecoder(chunk, cancellationToken, response);

                            case 13:
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
        }()
    }]);

    return BrainmapsVolumeChunkSource;
}(BrainmapsSource(VolumeChunkSource, VolumeSourceParameters));
BrainmapsVolumeChunkSource = __decorate([registerSharedObject()], BrainmapsVolumeChunkSource);
export { BrainmapsVolumeChunkSource };
function getFragmentCorner(fragmentId, xBits, yBits, zBits) {
    var id = new Uint64();
    if (!id.tryParseString(fragmentId, 16)) {
        throw new Error("Couldn't parse fragmentId " + fragmentId + " as hex-encoded Uint64");
    }
    return decodeZIndexCompressed(id, xBits, yBits, zBits);
}
function decodeMultiscaleManifestChunk(chunk, response) {
    verifyObject(response);
    var source = chunk.source;
    var fragmentKeys = verifyObjectProperty(response, 'fragmentKey', verifyStringArray);
    var supervoxelIds = verifyObjectProperty(response, 'supervoxelId', verifyStringArray);
    var length = fragmentKeys.length;
    if (length !== supervoxelIds.length) {
        throw new Error('Expected fragmentKey and supervoxelId arrays to have the same length.');
    }
    var fragmentSupervoxelIds = new _Map();
    fragmentKeys.forEach(function (fragmentId, i) {
        var ids = fragmentSupervoxelIds.get(fragmentId);
        if (ids === undefined) {
            ids = [];
            fragmentSupervoxelIds.set(fragmentId, ids);
        }
        ids.push(supervoxelIds[i]);
    });
    var chunkShape = source.parameters.info.chunkShape;

    var gridShape = source.parameters.info.lods[0].gridShape;
    var xBits = Math.ceil(_Math$log(gridShape[0])),
        yBits = Math.ceil(_Math$log(gridShape[1])),
        zBits = Math.ceil(_Math$log(gridShape[2]));
    var fragmentIdAndCorners = _Array$from(fragmentSupervoxelIds.entries()).map(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            id = _ref3[0],
            supervoxelIds = _ref3[1];

        return {
            fragmentId: id,
            corner: getFragmentCorner(id, xBits, yBits, zBits),
            supervoxelIds: supervoxelIds
        };
    });
    fragmentIdAndCorners.sort(function (a, b) {
        return zorder3LessThan(a.corner[0], a.corner[1], a.corner[2], b.corner[0], b.corner[1], b.corner[2]) ? -1 : 1;
    });
    var clipLowerBound = void 0,
        clipUpperBound = void 0;
    var minNumLods = 0;
    var octree = void 0;
    if (length === 0) {
        clipLowerBound = clipUpperBound = kZeroVec;
        octree = Uint32Array.of(0, 0, 0, 0, 0x80000000);
    } else {
        var minCoord = vec3.clone(kInfinityVec);
        var maxCoord = vec3.clone(kZeroVec);
        fragmentIdAndCorners.forEach(function (x) {
            var corner = x.corner;

            for (var i = 0; i < 3; ++i) {
                minCoord[i] = Math.min(minCoord[i], corner[i]);
                maxCoord[i] = Math.max(maxCoord[i], corner[i]);
            }
        });
        minNumLods = 1;
        while (maxCoord[0] >>> minNumLods - 1 != minCoord[0] >>> minNumLods - 1 || maxCoord[1] >>> minNumLods - 1 != minCoord[1] >>> minNumLods - 1 || maxCoord[2] >>> minNumLods - 1 != minCoord[2] >>> minNumLods - 1) {
            ++minNumLods;
        }
        clipLowerBound = vec3.multiply(minCoord, minCoord, chunkShape);
        clipUpperBound = vec3.add(maxCoord, vec3.multiply(maxCoord, maxCoord, chunkShape), chunkShape);
    }
    var lods = source.parameters.info.lods;

    var lodScales = new Float32Array(Math.max(lods.length, minNumLods));
    for (var lodIndex = 0; lodIndex < lods.length; ++lodIndex) {
        lodScales[lodIndex] = lods[lodIndex].scale;
    }
    if (length !== 0) {
        var octreeTemp = new Uint32Array(fragmentIdAndCorners.length * lodScales.length * 5);
        fragmentIdAndCorners.forEach(function (x, i) {
            octreeTemp.set(x.corner, i * 5);
            octreeTemp[i * 5] = x.corner[0];
        });
        var priorStart = 0;
        var priorEnd = fragmentIdAndCorners.length;
        for (var lod = 1; lod < lodScales.length; ++lod) {
            var curEnd = generateHigherOctreeLevel(octreeTemp, priorStart, priorEnd);
            priorStart = priorEnd;
            priorEnd = curEnd;
        }
        octree = octreeTemp.slice(0, priorEnd * 5);
    }
    var manifest = {
        chunkShape: chunkShape,
        chunkGridSpatialOrigin: kZeroVec,
        clipLowerBound: clipLowerBound,
        clipUpperBound: clipUpperBound,
        octree: octree,
        lodScales: lodScales,
        vertexOffsets: new Float32Array(lodScales.length * 3)
    };
    chunk.manifest = manifest;
    chunk.fragmentSupervoxelIds = fragmentIdAndCorners;
}
var maxMeshBatchSize = 100;
function decodeBatchMeshResponse(response, callback) {
    var length = response.byteLength;
    var index = 0;
    var dataView = new DataView(response);
    var headerSize =
    /*object id*/8 + /*fragment key length*/8 + /*num vertices*/8 + /*num triangles*/8;
    while (index < length) {
        if (index + headerSize > length) {
            throw new Error("Invalid batch mesh fragment response.");
        }
        var objectIdLow = dataView.getUint32(index, /*littleEndian=*/true);
        var objectIdHigh = dataView.getUint32(index + 4, /*littleEndian=*/true);
        var objectIdString = new Uint64(objectIdLow, objectIdHigh).toString();
        var prefix = objectIdString + '\0';
        index += 8;
        var fragmentKeyLength = dataView.getUint32(index, /*littleEndian=*/true);
        var fragmentKeyLengthHigh = dataView.getUint32(index + 4, /*littleEndian=*/true);
        index += 8;
        if (fragmentKeyLengthHigh !== 0) {
            throw new Error("Invalid batch mesh fragment response.");
        }
        if (index + fragmentKeyLength + /* num vertices */8 + /*num indices*/8 > length) {
            throw new Error("Invalid batch mesh fragment response.");
        }
        var fragmentKey = new TextDecoder().decode(new Uint8Array(response, index, fragmentKeyLength));
        var fullKey = prefix + fragmentKey;
        index += fragmentKeyLength;
        var numVertices = dataView.getUint32(index, /*littleEndian=*/true);
        var numVerticesHigh = dataView.getUint32(index + 4, /*littleEndian=*/true);
        index += 8;
        var numTriangles = dataView.getUint32(index, /*littleEndian=*/true);
        var numTrianglesHigh = dataView.getUint32(index + 4, /*littleEndian=*/true);
        index += 8;
        if (numVerticesHigh !== 0 || numTrianglesHigh !== 0) {
            throw new Error("Invalid batch mesh fragment response.");
        }
        var endOffset = index + numTriangles * 12 + numVertices * 12;
        if (endOffset > length) {
            throw new Error("Invalid batch mesh fragment response.");
        }
        callback({
            fullKey: fullKey,
            buffer: response,
            verticesOffset: index,
            numVertices: numVertices,
            indicesOffset: index + 12 * numVertices,
            numIndices: numTriangles * 3
        });
        index = endOffset;
    }
}
function combineBatchMeshFragments(fragments) {
    var totalVertices = 0,
        totalIndices = 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(fragments), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var fragment = _step.value;

            totalVertices += fragment.numVertices;
            totalIndices += fragment.numIndices;
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

    var vertexBuffer = new Float32Array(totalVertices * 3);
    var indexBuffer = new Uint32Array(totalIndices);
    var vertexOffset = 0;
    var indexOffset = 0;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = _getIterator(fragments), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _fragment = _step2.value;

            vertexBuffer.set(new Float32Array(_fragment.buffer, _fragment.verticesOffset, _fragment.numVertices * 3), vertexOffset * 3);
            var numIndices = _fragment.numIndices;

            var sourceIndices = new Uint32Array(_fragment.buffer, _fragment.indicesOffset, numIndices);
            convertEndian32(sourceIndices, Endianness.LITTLE);
            for (var i = 0; i < numIndices; ++i) {
                indexBuffer[indexOffset++] = sourceIndices[i] + vertexOffset;
            }
            vertexOffset += _fragment.numVertices;
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

    convertEndian32(vertexBuffer, Endianness.LITTLE);
    return { vertexPositions: vertexBuffer, indices: indexBuffer };
}
function makeBatchMeshRequest(credentialsProvider, parameters, ids, cancellationToken) {
    var path = "/v1/objects/meshes:batch";
    var batches = [];
    var prevObjectId = void 0;
    var batchSize = 0;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(ids), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var id = _step3.value;

            var splitIndex = id.indexOf('\0');
            var objectId = id.substring(0, splitIndex);
            var fragmentId = id.substring(splitIndex + 1);
            if (objectId !== prevObjectId) {
                batches.push({ object_id: objectId, fragment_keys: [] });
            }
            batches[batches.length - 1].fragment_keys.push(fragmentId);
            if (++batchSize === maxMeshBatchSize) break;
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

    var payload = {
        volume_id: parameters.volumeId,
        mesh_name: parameters.meshName,
        batches: batches
    };
    return makeRequest(parameters['instance'], credentialsProvider, {
        method: 'POST',
        path: path,
        payload: _JSON$stringify(payload),
        responseType: 'arraybuffer'
    }, cancellationToken);
}
var BrainmapsMultiscaleMeshSource = function (_BrainmapsSource2) {
    _inherits(BrainmapsMultiscaleMeshSource, _BrainmapsSource2);

    function BrainmapsMultiscaleMeshSource() {
        _classCallCheck(this, BrainmapsMultiscaleMeshSource);

        var _this2 = _possibleConstructorReturn(this, (BrainmapsMultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(BrainmapsMultiscaleMeshSource)).apply(this, arguments));

        _this2.listFragmentsParams = function () {
            var parameters = _this2.parameters;
            var changeSpec = parameters.changeSpec;

            if (changeSpec !== undefined) {
                return "&header.changeStackId=" + changeSpec.changeStackId;
            }
            return '';
        }();
        return _this2;
    }

    _createClass(BrainmapsMultiscaleMeshSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            var path = "/v1/objects/" + parameters['volumeId'] + "/meshes/" + (parameters.info.lods[0].info.name + ":listfragments?") + ("object_id=" + chunk.objectId + "&return_supervoxel_ids=true") + this.listFragmentsParams;
            return makeRequest(parameters['instance'], this.credentialsProvider, {
                method: 'GET',
                path: path,
                responseType: 'json'
            }, cancellationToken).then(function (response) {
                return decodeMultiscaleManifestChunk(chunk, response);
            });
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            var manifestChunk = chunk.manifestChunk;
            var fragmentSupervoxelIds = manifestChunk.fragmentSupervoxelIds;

            var manifest = manifestChunk.manifest;
            var lod = chunk.lod;
            var octree = manifest.octree;

            var numBaseChunks = fragmentSupervoxelIds.length;
            var row = chunk.chunkIndex;
            var startChunkIndex = row;
            while (startChunkIndex >= numBaseChunks) {
                startChunkIndex = octree[startChunkIndex * 5 + 3];
            }
            var endChunkIndex = row + 1;
            while (endChunkIndex > numBaseChunks) {
                endChunkIndex = octree[endChunkIndex * 5 - 1] & 0x7FFFFFFF;
            }
            var _parameters$info$lods = parameters.info.lods[lod],
                relativeBlockShape = _parameters$info$lods.relativeBlockShape,
                gridShape = _parameters$info$lods.gridShape;

            var xBits = Math.ceil(_Math$log(gridShape[0])),
                yBits = Math.ceil(_Math$log(gridShape[1])),
                zBits = Math.ceil(_Math$log(gridShape[2]));
            var ids = new _Map();
            for (var chunkIndex = startChunkIndex; chunkIndex < endChunkIndex; ++chunkIndex) {
                // Determine number of x, y, and z bits to skip.
                var gridX = Math.floor(octree[chunkIndex * 5] / relativeBlockShape[0]),
                    gridY = Math.floor(octree[chunkIndex * 5 + 1] / relativeBlockShape[1]),
                    gridZ = Math.floor(octree[chunkIndex * 5 + 2] / relativeBlockShape[2]);
                var fragmentKey = encodeZIndexCompressed(tempUint64, xBits, yBits, zBits, gridX, gridY, gridZ).toString(16).padStart(16, '0');
                var entry = fragmentSupervoxelIds[chunkIndex];
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = _getIterator(entry.supervoxelIds), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var supervoxelId = _step4.value;

                        ids.set(supervoxelId + '\0' + fragmentKey, chunkIndex);
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
            var prevLod = Math.max(0, lod - 1);
            var fragments = [];
            var idArray = _Array$from(ids);
            idArray.sort(function (a, b) {
                return a[0].localeCompare(b[0]);
            });
            ids = new _Map(idArray);
            function copyMeshData() {
                fragments.sort(function (a, b) {
                    return a.chunkIndex - b.chunkIndex;
                });
                var indexOffset = 0;
                var numSubChunks = 1 << 3 * (lod - prevLod);
                var subChunkOffsets = new Uint32Array(numSubChunks + 1);
                var prevSubChunkIndex = 0;
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = _getIterator(fragments), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var fragment = _step5.value;

                        var _row = fragment.chunkIndex;
                        var subChunkIndex = getOctreeChildIndex(octree[_row * 5] >>> prevLod, octree[_row * 5 + 1] >>> prevLod, octree[_row * 5 + 2] >>> prevLod) & numSubChunks - 1;
                        subChunkOffsets.fill(indexOffset, prevSubChunkIndex + 1, subChunkIndex + 1);
                        prevSubChunkIndex = subChunkIndex;
                        indexOffset += fragment.numIndices;
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

                subChunkOffsets.fill(indexOffset, prevSubChunkIndex + 1, numSubChunks + 1);
                assignMultiscaleMeshFragmentData(chunk, _Object$assign({}, combineBatchMeshFragments(fragments), { subChunkOffsets: subChunkOffsets }), VertexPositionFormat.float32);
            }
            function decodeResponse(response) {
                decodeBatchMeshResponse(response, function (fragment) {
                    var chunkIndex = ids.get(fragment.fullKey);
                    if (!ids.delete(fragment.fullKey)) {
                        throw new Error("Received unexpected fragment key: " + _JSON$stringify(fragment.fullKey) + ".");
                    }
                    fragment.chunkIndex = chunkIndex;
                    fragments.push(fragment);
                });
                if (ids.size !== 0) {
                    // Partial response received.
                    return makeBatchRequest();
                }
                copyMeshData();
            }
            var credentialsProvider = this.credentialsProvider;

            var meshName = parameters.info.lods[lod].info.name;
            function makeBatchRequest() {
                return makeBatchMeshRequest(credentialsProvider, { instance: parameters.instance, volumeId: parameters.volumeId, meshName: meshName }, ids.keys(), cancellationToken).then(decodeResponse);
            }
            return makeBatchRequest();
        }
    }]);

    return BrainmapsMultiscaleMeshSource;
}(BrainmapsSource(MultiscaleMeshSource, MultiscaleMeshSourceParameters));
BrainmapsMultiscaleMeshSource = __decorate([registerSharedObject()], BrainmapsMultiscaleMeshSource);
export { BrainmapsMultiscaleMeshSource };
function groupFragmentsIntoBatches(ids) {
    var batches = [];
    var index = 0;
    var length = ids.length;
    while (index < length) {
        batches.push(_JSON$stringify(ids.slice(index, index + maxMeshBatchSize)));
        index += maxMeshBatchSize;
    }
    return batches;
}
function decodeManifestChunkWithSupervoxelIds(chunk, response) {
    verifyObject(response);
    var fragmentKeys = verifyObjectProperty(response, 'fragmentKey', verifyStringArray);
    var supervoxelIds = verifyObjectProperty(response, 'supervoxelId', verifyStringArray);
    var length = fragmentKeys.length;
    if (length !== supervoxelIds.length) {
        throw new Error('Expected fragmentKey and supervoxelId arrays to have the same length.');
    }
    var fragmentIds = supervoxelIds.map(function (supervoxelId, index) {
        return supervoxelId + '\0' + fragmentKeys[index];
    });
    chunk.fragmentIds = groupFragmentsIntoBatches(fragmentIds);
}
var BrainmapsMeshSource = function (_BrainmapsSource3) {
    _inherits(BrainmapsMeshSource, _BrainmapsSource3);

    function BrainmapsMeshSource() {
        _classCallCheck(this, BrainmapsMeshSource);

        var _this3 = _possibleConstructorReturn(this, (BrainmapsMeshSource.__proto__ || _Object$getPrototypeOf(BrainmapsMeshSource)).apply(this, arguments));

        _this3.listFragmentsParams = function () {
            var parameters = _this3.parameters;
            var changeSpec = parameters.changeSpec;

            if (changeSpec !== undefined) {
                return "&header.changeStackId=" + changeSpec.changeStackId;
            }
            return '';
        }();
        return _this3;
    }

    _createClass(BrainmapsMeshSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            var path = "/v1/objects/" + parameters['volumeId'] + "/meshes/" + (parameters['meshName'] + ":listfragments?") + ("object_id=" + chunk.objectId + "&return_supervoxel_ids=true") + this.listFragmentsParams;
            return makeRequest(parameters['instance'], this.credentialsProvider, {
                method: 'GET',
                path: path,
                responseType: 'json'
            }, cancellationToken).then(function (response) {
                return decodeManifestChunkWithSupervoxelIds(chunk, response);
            });
        }
    }, {
        key: "downloadFragment",
        value: function downloadFragment(chunk, cancellationToken) {
            var parameters = this.parameters;

            var ids = new _Set(JSON.parse(chunk.fragmentId));
            var fragments = [];
            function copyMeshData() {
                assignMeshFragmentData(chunk, combineBatchMeshFragments(fragments));
            }
            function decodeResponse(response) {
                decodeBatchMeshResponse(response, function (fragment) {
                    if (!ids.delete(fragment.fullKey)) {
                        throw new Error("Received unexpected fragment key: " + _JSON$stringify(fragment.fullKey) + ".");
                    }
                    fragments.push(fragment);
                });
                if (ids.size !== 0) {
                    // Partial response received.
                    return makeBatchRequest();
                }
                copyMeshData();
            }
            var credentialsProvider = this.credentialsProvider;

            function makeBatchRequest() {
                return makeBatchMeshRequest(credentialsProvider, parameters, ids, cancellationToken).then(decodeResponse);
            }
            return makeBatchRequest();
        }
    }]);

    return BrainmapsMeshSource;
}(BrainmapsSource(MeshSource, MeshSourceParameters));
BrainmapsMeshSource = __decorate([registerSharedObject()], BrainmapsMeshSource);
export { BrainmapsMeshSource };
function decodeSkeletonChunk(chunk, response) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    var numVerticesHigh = dv.getUint32(4, true);
    if (numVerticesHigh !== 0) {
        throw new Error("The number of vertices should not exceed 2^32-1.");
    }
    var numEdges = dv.getUint32(8, true);
    var numEdgesHigh = dv.getUint32(12, true);
    if (numEdgesHigh !== 0) {
        throw new Error("The number of edges should not exceed 2^32-1.");
    }
    decodeSkeletonVertexPositionsAndIndices(chunk, response, Endianness.LITTLE, /*vertexByteOffset=*/16, numVertices,
    /*indexByteOffset=*/undefined, /*numEdges=*/numEdges);
}
var BrainmapsSkeletonSource = function (_BrainmapsSource4) {
    _inherits(BrainmapsSkeletonSource, _BrainmapsSource4);

    function BrainmapsSkeletonSource() {
        _classCallCheck(this, BrainmapsSkeletonSource);

        return _possibleConstructorReturn(this, (BrainmapsSkeletonSource.__proto__ || _Object$getPrototypeOf(BrainmapsSkeletonSource)).apply(this, arguments));
    }

    _createClass(BrainmapsSkeletonSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            var parameters = this.parameters;

            var payload = {
                object_id: "" + chunk.objectId
            };
            var path = "/v1/objects/" + parameters['volumeId'] + ("/meshes/" + parameters.meshName) + '/skeleton:binary';
            applyChangeStack(parameters.changeSpec, payload);
            return makeRequest(parameters['instance'], this.credentialsProvider, {
                method: 'POST',
                path: path,
                payload: _JSON$stringify(payload),
                responseType: 'arraybuffer'
            }, cancellationToken).then(function (response) {
                return decodeSkeletonChunk(chunk, response);
            });
        }
    }]);

    return BrainmapsSkeletonSource;
}(BrainmapsSource(SkeletonSource, SkeletonSourceParameters));
BrainmapsSkeletonSource = __decorate([registerSharedObject()], BrainmapsSkeletonSource);
export { BrainmapsSkeletonSource };
var spatialAnnotationTypes = ['LOCATION', 'LINE', 'VOLUME'];
function parseCommaSeparatedPoint(x) {
    var pattern = /(-?[0-9]+),(-?[0-9]+),(-?[0-9]+)/;
    var cornerParts = x.match(pattern);
    if (cornerParts === null) {
        throw new Error("Error parsing number triplet: " + _JSON$stringify(x) + ".");
    }
    return vec3.fromValues(parseFloat(cornerParts[1]), parseFloat(cornerParts[2]), parseFloat(cornerParts[3]));
}
function getIdPrefix(parameters) {
    return parameters.volumeId + ':' + parameters.changestack + ':';
}
function parseBrainmapsAnnotationId(idPrefix, fullId) {
    if (!fullId.startsWith(idPrefix)) {
        throw new Error("Received annotation id " + _JSON$stringify(fullId) + " does not have expected prefix of " + _JSON$stringify(idPrefix) + ".");
    }
    var id = fullId.substring(idPrefix.length);
    return id;
}
function parseObjectLabels(obj) {
    if (obj == null) {
        return undefined;
    }
    return parseArray(obj, function (x) {
        return Uint64.parseString('' + x, 10);
    });
}
function parseAnnotation(entry, idPrefix, expectedId) {
    var corner = verifyObjectProperty(entry, 'corner', function (x) {
        return parseCommaSeparatedPoint(verifyString(x));
    });
    var size = verifyObjectProperty(entry, 'size', function (x) {
        return parseCommaSeparatedPoint(verifyString(x));
    });
    var description = verifyObjectProperty(entry, 'payload', verifyOptionalString);
    var spatialAnnotationType = verifyObjectProperty(entry, 'type', verifyString);
    var fullId = verifyObjectProperty(entry, 'id', verifyString);
    var id = parseBrainmapsAnnotationId(idPrefix, fullId);
    var segments = verifyObjectProperty(entry, 'objectLabels', parseObjectLabels);
    if (expectedId !== undefined && id !== expectedId) {
        throw new Error("Received annotation has unexpected id " + _JSON$stringify(fullId) + ".");
    }
    switch (spatialAnnotationType) {
        case 'LOCATION':
            if (vec3.equals(size, kZeroVec)) {
                return {
                    type: AnnotationType.POINT,
                    id: id,
                    point: corner,
                    description: description,
                    segments: segments
                };
            } else {
                var radii = vec3.scale(vec3.create(), size, 0.5);
                var center = vec3.add(vec3.create(), corner, radii);
                return {
                    type: AnnotationType.ELLIPSOID,
                    id: id,
                    center: center,
                    radii: radii,
                    description: description,
                    segments: segments
                };
            }
        case 'LINE':
            return {
                type: AnnotationType.LINE,
                id: id,
                pointA: corner,
                pointB: vec3.add(vec3.create(), corner, size),
                description: description,
                segments: segments
            };
        case 'VOLUME':
            return {
                type: AnnotationType.AXIS_ALIGNED_BOUNDING_BOX,
                id: id,
                pointA: corner,
                pointB: vec3.add(vec3.create(), corner, size),
                description: description,
                segments: segments
            };
        default:
            throw new Error("Unknown spatial annotation type: " + _JSON$stringify(spatialAnnotationType) + ".");
    }
}
function parseAnnotationResponse(response, idPrefix, expectedId) {
    verifyObject(response);
    var entry = verifyObjectProperty(response, 'annotations', function (x) {
        return parseFixedLengthArray([undefined], x, verifyObject);
    })[0];
    return parseAnnotation(entry, idPrefix, expectedId);
}
function parseAnnotations(chunk, responses) {
    var serializer = new AnnotationSerializer();
    var source = chunk.source.parent;
    var idPrefix = getIdPrefix(source.parameters);
    responses.forEach(function (response, responseIndex) {
        try {
            verifyObject(response);
            var annotationsArray = verifyObjectProperty(response, 'annotations', function (x) {
                return x === undefined ? [] : x;
            });
            if (!Array.isArray(annotationsArray)) {
                throw new Error("Expected array, but received " + _JSON$stringify(typeof annotationsArray === "undefined" ? "undefined" : _typeof(annotationsArray)) + ".");
            }
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(annotationsArray), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var entry = _step6.value;

                    try {
                        serializer.add(parseAnnotation(entry, idPrefix));
                    } catch (e) {
                        throw new Error("Error parsing annotation: " + e.message);
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
        } catch (parseError) {
            throw new Error("Error parsing " + spatialAnnotationTypes[responseIndex] + " annotations: " + parseError.message);
        }
    });
    chunk.data = _Object$assign(new AnnotationGeometryData(), serializer.serialize());
}
function getSpatialAnnotationTypeFromId(id) {
    var index = id.indexOf('.');
    return id.substring(0, index);
}
function toCommaSeparated(v) {
    return Math.round(v[0]) + "," + Math.round(v[1]) + "," + Math.round(v[2]);
}
function getFullSpatialAnnotationId(parameters, id) {
    return parameters.volumeId + ":" + parameters.changestack + ":" + id;
}
function annotationToBrainmaps(annotation) {
    var payload = annotation.description || '';
    var objectLabels = annotation.segments === undefined ? undefined : annotation.segments.map(function (x) {
        return x.toString();
    });
    switch (annotation.type) {
        case AnnotationType.LINE:
        case AnnotationType.AXIS_ALIGNED_BOUNDING_BOX:
            {
                var pointA = annotation.pointA,
                    pointB = annotation.pointB;

                var minPoint = vec3.min(vec3.create(), pointA, pointB);
                var maxPoint = vec3.max(vec3.create(), pointA, pointB);
                var size = vec3.subtract(maxPoint, maxPoint, minPoint);
                return {
                    type: annotation.type === AnnotationType.LINE ? 'LINE' : 'VOLUME',
                    corner: toCommaSeparated(minPoint),
                    size: toCommaSeparated(size),
                    object_labels: objectLabels,
                    payload: payload
                };
            }
        case AnnotationType.POINT:
            {
                return {
                    type: 'LOCATION',
                    corner: toCommaSeparated(annotation.point),
                    size: '0,0,0',
                    object_labels: objectLabels,
                    payload: payload
                };
            }
        case AnnotationType.ELLIPSOID:
            {
                var corner = vec3.subtract(vec3.create(), annotation.center, annotation.radii);
                var _size = vec3.scale(vec3.create(), annotation.radii, 2);
                return {
                    type: 'LOCATION',
                    corner: toCommaSeparated(corner),
                    size: toCommaSeparated(_size),
                    object_labels: objectLabels,
                    payload: payload
                };
            }
    }
}
var BrainmapsAnnotationSource = function (_BrainmapsSource5) {
    _inherits(BrainmapsAnnotationSource, _BrainmapsSource5);

    function BrainmapsAnnotationSource() {
        _classCallCheck(this, BrainmapsAnnotationSource);

        return _possibleConstructorReturn(this, (BrainmapsAnnotationSource.__proto__ || _Object$getPrototypeOf(BrainmapsAnnotationSource)).apply(this, arguments));
    }

    _createClass(BrainmapsAnnotationSource, [{
        key: "downloadGeometry",
        value: function downloadGeometry(chunk, cancellationToken) {
            var _this6 = this;

            var parameters = this.parameters;

            return _Promise.all(spatialAnnotationTypes.map(function (spatialAnnotationType) {
                return makeRequest(parameters.instance, _this6.credentialsProvider, {
                    method: 'POST',
                    path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:get",
                    payload: _JSON$stringify({
                        type: spatialAnnotationType,
                        ignore_payload: true
                    }),
                    responseType: 'json'
                }, cancellationToken);
            })).then(function (values) {
                parseAnnotations(chunk, values);
            });
        }
    }, {
        key: "downloadSegmentFilteredGeometry",
        value: function downloadSegmentFilteredGeometry(chunk, cancellationToken) {
            var _this7 = this;

            var parameters = this.parameters;

            return _Promise.all(spatialAnnotationTypes.map(function (spatialAnnotationType) {
                return makeRequest(parameters.instance, _this7.credentialsProvider, {
                    method: 'POST',
                    path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:get",
                    payload: _JSON$stringify({
                        type: spatialAnnotationType,
                        object_labels: [chunk.objectId.toString()],
                        ignore_payload: true
                    }),
                    responseType: 'json'
                }, cancellationToken);
            })).then(function (values) {
                parseAnnotations(chunk, values);
            });
        }
    }, {
        key: "downloadMetadata",
        value: function downloadMetadata(chunk, cancellationToken) {
            var parameters = this.parameters;

            var id = chunk.key;
            return makeRequest(parameters.instance, this.credentialsProvider, {
                method: 'POST',
                path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:get",
                payload: _JSON$stringify({
                    type: getSpatialAnnotationTypeFromId(id),
                    id: getFullSpatialAnnotationId(parameters, id)
                }),
                responseType: 'json'
            }, cancellationToken).then(function (response) {
                chunk.annotation = parseAnnotationResponse(response, getIdPrefix(parameters), id);
            }, function () {
                chunk.annotation = null;
            });
        }
    }, {
        key: "add",
        value: function add(annotation) {
            var _this8 = this;

            var parameters = this.parameters;

            var brainmapsAnnotation = annotationToBrainmaps(annotation);
            return makeRequest(parameters.instance, this.credentialsProvider, {
                method: 'POST',
                path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:push",
                payload: _JSON$stringify({ annotations: [brainmapsAnnotation] }),
                responseType: 'json'
            }).then(function (response) {
                verifyObject(response);
                var ids = verifyObjectProperty(response, 'ids', verifyStringArray);
                if (ids.length !== 1) {
                    throw new Error("Expected list of 1 id, but received " + _JSON$stringify(ids) + ".");
                }
                var idPrefix = getIdPrefix(_this8.parameters);
                return parseBrainmapsAnnotationId(idPrefix, ids[0]);
            });
        }
    }, {
        key: "update",
        value: function update(id, annotation) {
            var parameters = this.parameters;

            var brainmapsAnnotation = annotationToBrainmaps(annotation);
            brainmapsAnnotation.id = getFullSpatialAnnotationId(parameters, id);
            return makeRequest(parameters.instance, this.credentialsProvider, {
                method: 'POST',
                path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:push",
                payload: _JSON$stringify({ annotations: [brainmapsAnnotation] }),
                responseType: 'json'
            });
        }
    }, {
        key: "delete",
        value: function _delete(id) {
            var parameters = this.parameters;

            return makeRequest(parameters.instance, this.credentialsProvider, {
                method: 'POST',
                path: "/v1/changes/" + parameters.volumeId + "/" + parameters.changestack + "/spatials:delete",
                payload: _JSON$stringify({
                    type: getSpatialAnnotationTypeFromId(id),
                    ids: [getFullSpatialAnnotationId(parameters, id)]
                }),
                responseType: 'json'
            });
        }
    }]);

    return BrainmapsAnnotationSource;
}(BrainmapsSource(AnnotationSource, AnnotationSourceParameters));
BrainmapsAnnotationSource = __decorate([registerSharedObject()], BrainmapsAnnotationSource);
export { BrainmapsAnnotationSource };
//# sourceMappingURL=backend.js.map