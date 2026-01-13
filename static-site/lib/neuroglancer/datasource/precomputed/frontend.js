import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _Map from 'babel-runtime/core-js/map';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
export { _getVolume as getVolume };

var _getMeshSource = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(chunkManager, url) {
        var metadata, vertexPositionFormat, vertexQuantizationBits;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return getMeshMetadata(chunkManager, url);

                    case 2:
                        metadata = _context2.sent;

                        if (!(metadata === undefined)) {
                            _context2.next = 5;
                            break;
                        }

                        return _context2.abrupt('return', getShardedMeshSource(chunkManager, { url: url, lod: 0 }));

                    case 5:
                        vertexPositionFormat = void 0;
                        vertexQuantizationBits = metadata.vertexQuantizationBits;

                        if (!(vertexQuantizationBits === 10)) {
                            _context2.next = 11;
                            break;
                        }

                        vertexPositionFormat = VertexPositionFormat.uint10;
                        _context2.next = 16;
                        break;

                    case 11:
                        if (!(vertexQuantizationBits === 16)) {
                            _context2.next = 15;
                            break;
                        }

                        vertexPositionFormat = VertexPositionFormat.uint16;
                        _context2.next = 16;
                        break;

                    case 15:
                        throw new Error('Invalid vertex quantization bits: ' + vertexQuantizationBits);

                    case 16:
                        return _context2.abrupt('return', chunkManager.getChunkSource(PrecomputedMultiscaleMeshSource, {
                            parameters: { url: url, metadata: metadata },
                            format: {
                                fragmentRelativeVertices: true,
                                vertexPositionFormat: vertexPositionFormat,
                                transform: metadata.transform
                            }
                        }));

                    case 17:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function _getMeshSource(_x, _x2) {
        return _ref2.apply(this, arguments);
    };
}();

var _getSkeletonSource = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(chunkManager, url) {
        var metadata;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return getSkeletonMetadata(chunkManager, url);

                    case 2:
                        metadata = _context3.sent;
                        return _context3.abrupt('return', chunkManager.getChunkSource(PrecomputedSkeletonSource, {
                            parameters: {
                                url: url,
                                metadata: metadata
                            },
                            transform: metadata.transform
                        }));

                    case 4:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function _getSkeletonSource(_x3, _x4) {
        return _ref3.apply(this, arguments);
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
import { AnnotationSource, makeDataBoundsBoundingBox } from '../../annotation';
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { DataEncoding, MeshSourceParameters, MultiscaleMeshSourceParameters, ShardingHashFunction, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters } from './base';
import { VertexPositionFormat } from '../../mesh/base';
import { MeshSource, MultiscaleMeshSource } from '../../mesh/frontend';
import { SkeletonSource } from '../../skeleton/frontend';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { mat4, vec3 } from '../../util/geom';
import { fetchOk, parseSpecialUrl } from '../../util/http_request';
import { parseArray, parseFixedLengthArray, parseIntVec, verifyEnumString, verifyFiniteFloat, verifyFinitePositiveFloat, verifyInt, verifyObject, verifyObjectProperty, verifyOptionalString, verifyPositiveInt, verifyString } from '../../util/json';

var PrecomputedVolumeChunkSource = function (_WithParameters) {
    _inherits(PrecomputedVolumeChunkSource, _WithParameters);

    function PrecomputedVolumeChunkSource() {
        _classCallCheck(this, PrecomputedVolumeChunkSource);

        return _possibleConstructorReturn(this, (PrecomputedVolumeChunkSource.__proto__ || _Object$getPrototypeOf(PrecomputedVolumeChunkSource)).apply(this, arguments));
    }

    return PrecomputedVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));

var PrecomputedMeshSource = function (_WithParameters2) {
    _inherits(PrecomputedMeshSource, _WithParameters2);

    function PrecomputedMeshSource() {
        _classCallCheck(this, PrecomputedMeshSource);

        return _possibleConstructorReturn(this, (PrecomputedMeshSource.__proto__ || _Object$getPrototypeOf(PrecomputedMeshSource)).apply(this, arguments));
    }

    return PrecomputedMeshSource;
}(WithParameters(MeshSource, MeshSourceParameters));

var PrecomputedMultiscaleMeshSource = function (_WithParameters3) {
    _inherits(PrecomputedMultiscaleMeshSource, _WithParameters3);

    function PrecomputedMultiscaleMeshSource() {
        _classCallCheck(this, PrecomputedMultiscaleMeshSource);

        return _possibleConstructorReturn(this, (PrecomputedMultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(PrecomputedMultiscaleMeshSource)).apply(this, arguments));
    }

    return PrecomputedMultiscaleMeshSource;
}(WithParameters(MultiscaleMeshSource, MultiscaleMeshSourceParameters));

export var PrecomputedSkeletonSource = function (_WithParameters4) {
    _inherits(PrecomputedSkeletonSource, _WithParameters4);

    function PrecomputedSkeletonSource() {
        _classCallCheck(this, PrecomputedSkeletonSource);

        return _possibleConstructorReturn(this, (PrecomputedSkeletonSource.__proto__ || _Object$getPrototypeOf(PrecomputedSkeletonSource)).apply(this, arguments));
    }

    _createClass(PrecomputedSkeletonSource, [{
        key: 'skeletonVertexCoordinatesInVoxels',
        get: function get() {
            return false;
        }
    }, {
        key: 'vertexAttributes',
        get: function get() {
            return this.parameters.metadata.vertexAttributes;
        }
    }]);

    return PrecomputedSkeletonSource;
}(WithParameters(SkeletonSource, SkeletonSourceParameters));
function resolvePath(a, b) {
    var outputParts = a.split('/');
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(b.split('/')), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var part = _step.value;

            if (part === '..') {
                if (outputParts.length !== 0) {
                    outputParts.length = outputParts.length - 1;
                    continue;
                }
            }
            outputParts.push(part);
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

    return outputParts.join('/');
}

var ScaleInfo = function ScaleInfo(obj) {
    _classCallCheck(this, ScaleInfo);

    verifyObject(obj);
    this.resolution = verifyObjectProperty(obj, 'resolution', function (x) {
        return parseFixedLengthArray(vec3.create(), x, verifyFinitePositiveFloat);
    });
    this.voxelOffset = verifyObjectProperty(obj, 'voxel_offset', function (x) {
        return x === undefined ? vec3.create() : parseIntVec(vec3.create(), x);
    });
    this.size = verifyObjectProperty(obj, 'size', function (x) {
        return parseFixedLengthArray(vec3.create(), x, verifyPositiveInt);
    });
    this.chunkSizes = verifyObjectProperty(obj, 'chunk_sizes', function (x) {
        return parseArray(x, function (y) {
            return parseFixedLengthArray(vec3.create(), y, verifyPositiveInt);
        });
    });
    if (this.chunkSizes.length === 0) {
        throw new Error('No chunk sizes specified.');
    }
    this.sharding = verifyObjectProperty(obj, 'sharding', parseShardingParameters);
    if (this.sharding !== undefined && this.chunkSizes.length !== 1) {
        throw new Error('Sharding requires a single chunk size per scale');
    }
    var encoding = this.encoding = verifyObjectProperty(obj, 'encoding', function (x) {
        return verifyEnumString(x, VolumeChunkEncoding);
    });
    if (encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATION) {
        this.compressedSegmentationBlockSize = verifyObjectProperty(obj, 'compressed_segmentation_block_size', function (x) {
            return parseFixedLengthArray(vec3.create(), x, verifyPositiveInt);
        });
    }
    this.key = verifyObjectProperty(obj, 'key', verifyString);
};

export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, url, obj) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.url = url;
        verifyObject(obj);
        var t = verifyObjectProperty(obj, '@type', verifyOptionalString);
        if (t !== undefined && t !== 'neuroglancer_multiscale_volume') {
            throw new Error('Invalid type: ' + _JSON$stringify(t));
        }
        this.dataType = verifyObjectProperty(obj, 'data_type', function (x) {
            return verifyEnumString(x, DataType);
        });
        this.numChannels = verifyObjectProperty(obj, 'num_channels', verifyPositiveInt);
        this.volumeType = verifyObjectProperty(obj, 'type', function (x) {
            return verifyEnumString(x, VolumeType);
        });
        this.mesh = verifyObjectProperty(obj, 'mesh', verifyOptionalString);
        this.skeletons = verifyObjectProperty(obj, 'skeletons', verifyOptionalString);
        this.scales = verifyObjectProperty(obj, 'scales', function (x) {
            return parseArray(x, function (y) {
                return new ScaleInfo(y);
            });
        });
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getMeshSource',
        value: function getMeshSource() {
            var mesh = this.mesh;

            if (mesh !== undefined) {
                return _getMeshSource(this.chunkManager, resolvePath(this.url, mesh));
            }
            var skeletons = this.skeletons;

            if (skeletons !== undefined) {
                return _getSkeletonSource(this.chunkManager, resolvePath(this.url, skeletons));
            }
            return null;
        }
    }, {
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var _this5 = this;

            return this.scales.map(function (scaleInfo) {
                return VolumeChunkSpecification.getDefaults({
                    voxelSize: scaleInfo.resolution,
                    dataType: _this5.dataType,
                    numChannels: _this5.numChannels,
                    transform: mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), scaleInfo.resolution, scaleInfo.voxelOffset)),
                    upperVoxelBound: scaleInfo.size,
                    volumeType: _this5.volumeType,
                    chunkDataSizes: scaleInfo.chunkSizes,
                    baseVoxelOffset: scaleInfo.voxelOffset,
                    compressedSegmentationBlockSize: scaleInfo.compressedSegmentationBlockSize,
                    volumeSourceOptions: volumeSourceOptions
                }).map(function (spec) {
                    return _this5.chunkManager.getChunkSource(PrecomputedVolumeChunkSource, {
                        spec: spec,
                        parameters: {
                            url: resolvePath(_this5.url, scaleInfo.key),
                            encoding: scaleInfo.encoding,
                            sharding: scaleInfo.sharding
                        }
                    });
                });
            });
        }
    }, {
        key: 'getStaticAnnotations',
        value: function getStaticAnnotations() {
            var baseScale = this.scales[0];
            var annotationSet = new AnnotationSource(mat4.fromScaling(mat4.create(), baseScale.resolution));
            annotationSet.readonly = true;
            annotationSet.add(makeDataBoundsBoundingBox(baseScale.voxelOffset, vec3.add(vec3.create(), baseScale.voxelOffset, baseScale.size)));
            return annotationSet;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
export function getShardedMeshSource(chunkManager, parameters) {
    return chunkManager.getChunkSource(PrecomputedMeshSource, { parameters: parameters });
}
function parseTransform(data) {
    return verifyObjectProperty(data, 'transform', function (value) {
        var transform = mat4.create();
        if (value !== undefined) {
            parseFixedLengthArray(transform.subarray(0, 12), value, verifyFiniteFloat);
        }
        mat4.transpose(transform, transform);
        return transform;
    });
}
function parseMeshMetadata(data) {
    verifyObject(data);
    var t = verifyObjectProperty(data, '@type', verifyString);
    if (t !== 'neuroglancer_multilod_draco') {
        throw new Error('Unsupported mesh type: ' + _JSON$stringify(t));
    }
    var lodScaleMultiplier = verifyObjectProperty(data, 'lod_scale_multiplier', verifyFinitePositiveFloat);
    var vertexQuantizationBits = verifyObjectProperty(data, 'vertex_quantization_bits', verifyPositiveInt);
    var transform = parseTransform(data);
    var sharding = verifyObjectProperty(data, 'sharding', parseShardingParameters);
    return { lodScaleMultiplier: lodScaleMultiplier, transform: transform, sharding: sharding, vertexQuantizationBits: vertexQuantizationBits };
}
function getMeshMetadata(chunkManager, url) {
    return chunkManager.memoize.getUncounted({ 'type': 'precomputed:MeshSource', url: url }, function () {
        return fetchOk(url + '/info').then(function (response) {
            return response.json().then(function (value) {
                return parseMeshMetadata(value);
            });
        },
        // If we fail to fetch the info file, assume it is the legacy
        // single-resolution mesh format.
        function () {
            return undefined;
        });
    });
}
function parseShardingEncoding(y) {
    if (y === undefined) return DataEncoding.RAW;
    return verifyEnumString(y, DataEncoding);
}
function parseShardingParameters(shardingData) {
    if (shardingData === undefined) return undefined;
    verifyObject(shardingData);
    var t = verifyObjectProperty(shardingData, '@type', verifyString);
    if (t !== 'neuroglancer_uint64_sharded_v1') {
        throw new Error('Unsupported sharding format: ' + _JSON$stringify(t));
    }
    var hash = verifyObjectProperty(shardingData, 'hash', function (y) {
        return verifyEnumString(y, ShardingHashFunction);
    });
    var preshiftBits = verifyObjectProperty(shardingData, 'preshift_bits', verifyInt);
    var shardBits = verifyObjectProperty(shardingData, 'shard_bits', verifyInt);
    var minishardBits = verifyObjectProperty(shardingData, 'minishard_bits', verifyInt);
    var minishardIndexEncoding = verifyObjectProperty(shardingData, 'minishard_index_encoding', parseShardingEncoding);
    var dataEncoding = verifyObjectProperty(shardingData, 'data_encoding', parseShardingEncoding);
    return { hash: hash, preshiftBits: preshiftBits, shardBits: shardBits, minishardBits: minishardBits, minishardIndexEncoding: minishardIndexEncoding, dataEncoding: dataEncoding };
}
function parseSkeletonMetadata(data) {
    verifyObject(data);
    var t = verifyObjectProperty(data, '@type', verifyString);
    if (t !== 'neuroglancer_skeletons') {
        throw new Error('Unsupported skeleton type: ' + _JSON$stringify(t));
    }
    var transform = parseTransform(data);
    var vertexAttributes = new _Map();
    verifyObjectProperty(data, 'vertex_attributes', function (attributes) {
        if (attributes === undefined) return;
        parseArray(attributes, function (attributeData) {
            verifyObject(attributeData);
            var id = verifyObjectProperty(attributeData, 'id', verifyString);
            if (id === '') throw new Error('vertex attribute id must not be empty');
            if (vertexAttributes.has(id)) {
                throw new Error('duplicate vertex attribute id ' + _JSON$stringify(id));
            }
            var dataType = verifyObjectProperty(attributeData, 'data_type', function (y) {
                return verifyEnumString(y, DataType);
            });
            var numComponents = verifyObjectProperty(attributeData, 'num_components', verifyPositiveInt);
            vertexAttributes.set(id, { dataType: dataType, numComponents: numComponents });
        });
    });
    var sharding = verifyObjectProperty(data, 'sharding', parseShardingParameters);
    return { transform: transform, vertexAttributes: vertexAttributes, sharding: sharding };
}
function getSkeletonMetadata(chunkManager, url) {
    var _this6 = this;

    return chunkManager.memoize.getUncounted({ 'type': 'precomputed:SkeletonSource', url: url }, _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var response, value;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return fetchOk(url + '/info');

                    case 2:
                        response = _context.sent;
                        _context.next = 5;
                        return response.json();

                    case 5:
                        value = _context.sent;
                        return _context.abrupt('return', parseSkeletonMetadata(value));

                    case 7:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, _this6);
    })));
}
export { _getSkeletonSource as getSkeletonSource };
function _getVolume(chunkManager, url) {
    url = parseSpecialUrl(url);
    return chunkManager.memoize.getUncounted({ 'type': 'precomputed:MultiscaleVolumeChunkSource', url: url }, function () {
        return fetchOk(url + '/info').then(function (response) {
            return response.json();
        }).then(function (response) {
            return new MultiscaleVolumeChunkSource(chunkManager, url, response);
        });
    });
}
export var PrecomputedDataSource = function (_DataSource) {
    _inherits(PrecomputedDataSource, _DataSource);

    function PrecomputedDataSource() {
        _classCallCheck(this, PrecomputedDataSource);

        return _possibleConstructorReturn(this, (PrecomputedDataSource.__proto__ || _Object$getPrototypeOf(PrecomputedDataSource)).apply(this, arguments));
    }

    _createClass(PrecomputedDataSource, [{
        key: 'getVolume',
        value: function getVolume(chunkManager, url) {
            return _getVolume(chunkManager, url);
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource(chunkManager, url) {
            return _getMeshSource(chunkManager, parseSpecialUrl(url));
        }
    }, {
        key: 'getSkeletonSource',
        value: function getSkeletonSource(chunkManager, url) {
            return _getSkeletonSource(chunkManager, parseSpecialUrl(url));
        }
    }, {
        key: 'description',
        get: function get() {
            return 'Precomputed file-backed data source';
        }
    }]);

    return PrecomputedDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map