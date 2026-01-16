import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
/**
 * @file
 * Support for Python integration.
 */
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { MeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters } from './base';
import { MeshSource } from '../../mesh/frontend';
import { SkeletonSource } from '../../skeleton/frontend';
import { DataType, DEFAULT_MAX_VOXELS_PER_CHUNK_LOG2, getNearIsotropicBlockSize, getTwoDimensionalBlockSize } from '../../sliceview/base';
import { VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { mat4, vec3 } from '../../util/geom';
import { fetchOk } from '../../util/http_request';
import { parseArray, parseFixedLengthArray, verify3dDimensions, verify3dScale, verify3dVec, verifyEnumString, verifyObject, verifyObjectAsMap, verifyObjectProperty, verifyPositiveInt, verifyString } from '../../util/json';
import { getObjectId } from '../../util/object_id';
function WithPythonDataSource(Base) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = _possibleConstructorReturn(this, (_ref = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref, [this].concat(args)));

            var options = args[1];
            var dataSource = _this.dataSource = _this.registerDisposer(options.dataSource.addRef());
            _this.generation = options.generation;
            var key = options.parameters.key;
            dataSource.registerSource(key, _this);
            return _this;
        }

        _createClass(C, null, [{
            key: 'encodeOptions',
            value: function encodeOptions(options) {
                var encoding = _get(C.__proto__ || _Object$getPrototypeOf(C), 'encodeOptions', this).call(this, options);
                // `generation` is not encoded in cache key, since it is not fixed.
                encoding['dataSource'] = getObjectId(options.dataSource);
                return encoding;
            }
        }]);

        return C;
    }(Base);

    return C;
}

var PythonVolumeChunkSource = function (_WithPythonDataSource) {
    _inherits(PythonVolumeChunkSource, _WithPythonDataSource);

    function PythonVolumeChunkSource() {
        _classCallCheck(this, PythonVolumeChunkSource);

        return _possibleConstructorReturn(this, (PythonVolumeChunkSource.__proto__ || _Object$getPrototypeOf(PythonVolumeChunkSource)).apply(this, arguments));
    }

    return PythonVolumeChunkSource;
}(WithPythonDataSource(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters)));

var PythonMeshSource = function (_WithPythonDataSource2) {
    _inherits(PythonMeshSource, _WithPythonDataSource2);

    function PythonMeshSource() {
        _classCallCheck(this, PythonMeshSource);

        return _possibleConstructorReturn(this, (PythonMeshSource.__proto__ || _Object$getPrototypeOf(PythonMeshSource)).apply(this, arguments));
    }

    return PythonMeshSource;
}(WithPythonDataSource(WithParameters(MeshSource, MeshSourceParameters)));

function parseScaleInfo(obj) {
    verifyObject(obj);
    return {
        key: verifyObjectProperty(obj, 'key', verifyString),
        offset: verifyObjectProperty(obj, 'offset', verify3dVec),
        sizeInVoxels: verifyObjectProperty(obj, 'sizeInVoxels', verify3dDimensions),
        voxelSize: verifyObjectProperty(obj, 'voxelSize', verify3dScale),
        chunkDataSize: verifyObjectProperty(obj, 'chunkDataSize', function (x) {
            return x === undefined ? undefined : verify3dDimensions(x);
        })
    };
}
export var MultiscaleVolumeChunkSource = function () {
    // TODO(jbms): Properly handle reference counting of `dataSource`.
    function MultiscaleVolumeChunkSource(dataSource, chunkManager, key, response) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.dataSource = dataSource;
        this.chunkManager = chunkManager;
        this.key = key;
        this.response = response;
        verifyObject(response);
        this.dataType = verifyObjectProperty(response, 'dataType', function (x) {
            return verifyEnumString(x, DataType);
        });
        this.volumeType = verifyObjectProperty(response, 'volumeType', function (x) {
            return verifyEnumString(x, VolumeType);
        });
        this.numChannels = verifyObjectProperty(response, 'numChannels', verifyPositiveInt);
        this.encoding = verifyObjectProperty(response, 'encoding', function (x) {
            return verifyEnumString(x, VolumeChunkEncoding);
        });
        this.generation = verifyObjectProperty(response, 'generation', function (x) {
            return x;
        });
        this.skeletonVertexAttributes = verifyObjectProperty(response, 'skeletonVertexAttributes', function (x) {
            return x === undefined ? undefined : verifyObjectAsMap(x, parseVertexAttributeInfo);
        });
        var maxVoxelsPerChunkLog2 = verifyObjectProperty(response, 'maxVoxelsPerChunkLog2', function (x) {
            return x === undefined ? DEFAULT_MAX_VOXELS_PER_CHUNK_LOG2 : verifyPositiveInt(x);
        });
        /**
         * Scales used for arbitrary orientation (should be near isotropic).
         *
         * Exactly one of threeDimensionalScales and twoDimensionalScales should be specified.
         */
        var threeDimensionalScales = verifyObjectProperty(response, 'threeDimensionalScales', function (x) {
            return x === undefined ? undefined : parseArray(x, parseScaleInfo);
        });
        /**
         * Separate scales used for XY, XZ, YZ slice views, respectively.  The chunks should be flat or
         * nearly flat in Z, Y, X respectively.  The inner arrays must have length 3.
         */
        var twoDimensionalScales = verifyObjectProperty(response, 'twoDimensionalScales', function (x) {
            return x === undefined ? undefined : parseArray(x, function (y) {
                return parseFixedLengthArray(new Array(3), y, parseScaleInfo);
            });
        });
        if (twoDimensionalScales === undefined === (threeDimensionalScales === undefined)) {
            throw new Error('Exactly one of "threeDimensionalScales" and "twoDimensionalScales" must be specified.');
        }
        if (twoDimensionalScales !== undefined) {
            if (twoDimensionalScales.length === 0) {
                throw new Error('At least one scale must be specified.');
            }
            this.scales = twoDimensionalScales.map(function (levelScales) {
                return levelScales.map(function (scale, index) {
                    var voxelSize = scale.voxelSize,
                        sizeInVoxels = scale.sizeInVoxels;

                    var flatDimension = 2 - index;
                    var _scale$chunkDataSize = scale.chunkDataSize,
                        chunkDataSize = _scale$chunkDataSize === undefined ? getTwoDimensionalBlockSize({ voxelSize: voxelSize, upperVoxelBound: sizeInVoxels, flatDimension: flatDimension, maxVoxelsPerChunkLog2: maxVoxelsPerChunkLog2 }) : _scale$chunkDataSize;

                    return {
                        key: scale.key,
                        offset: scale.offset,
                        sizeInVoxels: sizeInVoxels,
                        voxelSize: voxelSize,
                        chunkDataSize: chunkDataSize
                    };
                });
            });
            if (!vec3.equals(this.scales[0][0].voxelSize, this.scales[0][1].voxelSize) || !vec3.equals(this.scales[0][0].voxelSize, this.scales[0][2].voxelSize)) {
                throw new Error('Lowest scale must have uniform voxel size.');
            }
        }
        if (threeDimensionalScales !== undefined) {
            if (threeDimensionalScales.length === 0) {
                throw new Error('At least one scale must be specified.');
            }
            this.scales = threeDimensionalScales.map(function (scale) {
                var voxelSize = scale.voxelSize,
                    sizeInVoxels = scale.sizeInVoxels;
                var _scale$chunkDataSize2 = scale.chunkDataSize,
                    chunkDataSize = _scale$chunkDataSize2 === undefined ? getNearIsotropicBlockSize({ voxelSize: voxelSize, upperVoxelBound: sizeInVoxels, maxVoxelsPerChunkLog2: maxVoxelsPerChunkLog2 }) : _scale$chunkDataSize2;

                return [{ key: scale.key, offset: scale.offset, sizeInVoxels: sizeInVoxels, voxelSize: voxelSize, chunkDataSize: chunkDataSize }];
            });
        }
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var _this4 = this;

            var numChannels = this.numChannels,
                dataType = this.dataType,
                volumeType = this.volumeType,
                encoding = this.encoding;
            // Clip based on the bounds of the first scale.

            var baseScale = this.scales[0][0];
            var upperClipBound = vec3.multiply(vec3.create(), baseScale.voxelSize, baseScale.sizeInVoxels);
            return this.scales.map(function (levelScales) {
                return levelScales.map(function (scaleInfo) {
                    var spec = VolumeChunkSpecification.withDefaultCompression({
                        voxelSize: scaleInfo.voxelSize,
                        dataType: dataType,
                        volumeType: volumeType,
                        numChannels: numChannels,
                        transform: mat4.fromTranslation(mat4.create(), scaleInfo.offset),
                        upperVoxelBound: scaleInfo.sizeInVoxels,
                        upperClipBound: upperClipBound,
                        chunkDataSize: scaleInfo.chunkDataSize,
                        volumeSourceOptions: volumeSourceOptions
                    });
                    return _this4.chunkManager.getChunkSource(PythonVolumeChunkSource, {
                        spec: spec,
                        dataSource: _this4.dataSource,
                        generation: _this4.generation,
                        parameters: { key: _this4.key, scaleKey: scaleInfo.key, encoding: encoding }
                    });
                });
            });
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            var skeletonVertexAttributes = this.skeletonVertexAttributes;

            if (skeletonVertexAttributes !== undefined) {
                return this.chunkManager.getChunkSource(PythonSkeletonSource, {
                    dataSource: this.dataSource,
                    generation: this.generation,
                    parameters: {
                        key: this.key,
                        vertexAttributes: skeletonVertexAttributes
                    }
                });
            }
            return this.chunkManager.getChunkSource(PythonMeshSource, {
                dataSource: this.dataSource,
                generation: this.generation,
                parameters: {
                    key: this.key
                }
            });
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
export var PythonSkeletonSource = function (_WithPythonDataSource3) {
    _inherits(PythonSkeletonSource, _WithPythonDataSource3);

    function PythonSkeletonSource() {
        _classCallCheck(this, PythonSkeletonSource);

        return _possibleConstructorReturn(this, (PythonSkeletonSource.__proto__ || _Object$getPrototypeOf(PythonSkeletonSource)).apply(this, arguments));
    }

    _createClass(PythonSkeletonSource, [{
        key: 'skeletonVertexCoordinatesInVoxels',
        get: function get() {
            return false;
        }
    }, {
        key: 'vertexAttributes',
        get: function get() {
            return this.parameters.vertexAttributes;
        }
    }]);

    return PythonSkeletonSource;
}(WithPythonDataSource(WithParameters(SkeletonSource, SkeletonSourceParameters)));
function parseVertexAttributeInfo(x) {
    verifyObject(x);
    return {
        dataType: verifyObjectProperty(x, 'dataType', function (y) {
            return verifyEnumString(y, DataType);
        }),
        numComponents: verifyObjectProperty(x, 'numComponents', verifyPositiveInt)
    };
}
function parseSkeletonVertexAttributes(spec) {
    return verifyObjectAsMap(JSON.parse(spec), parseVertexAttributeInfo);
}
export var PythonDataSource = function (_DataSource) {
    _inherits(PythonDataSource, _DataSource);

    function PythonDataSource() {
        _classCallCheck(this, PythonDataSource);

        var _this6 = _possibleConstructorReturn(this, (PythonDataSource.__proto__ || _Object$getPrototypeOf(PythonDataSource)).apply(this, arguments));

        _this6.sources = new _Map();
        _this6.sourceGenerations = new _Map();
        return _this6;
    }

    _createClass(PythonDataSource, [{
        key: 'registerSource',
        value: function registerSource(key, source) {
            var _this7 = this;

            var existingSet = this.sources.get(key);
            if (existingSet === undefined) {
                existingSet = new _Set();
                this.sources.set(key, existingSet);
            }
            var generation = this.sourceGenerations.get(key);
            if (generation !== undefined) {
                source.generation = generation;
            }
            existingSet.add(source);
            source.registerDisposer(function () {
                existingSet.delete(source);
                if (existingSet.size === 0) {
                    _this7.sources.delete(key);
                }
            });
        }
    }, {
        key: 'setSourceGeneration',
        value: function setSourceGeneration(key, generation) {
            var sourceGenerations = this.sourceGenerations;

            if (sourceGenerations.get(key) === generation) {
                return;
            }
            sourceGenerations.set(key, generation);
            var sources = this.sources.get(key);
            if (sources !== undefined) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(sources), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var source = _step.value;

                        if (source.generation !== generation) {
                            source.generation = generation;
                            source.invalidateCache();
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
            }
        }
    }, {
        key: 'deleteSourceGeneration',
        value: function deleteSourceGeneration(key) {
            this.sourceGenerations.delete(key);
        }
    }, {
        key: 'getVolume',
        value: function getVolume(chunkManager, key) {
            var _this8 = this;

            return chunkManager.memoize.getUncounted({ 'type': 'python:MultiscaleVolumeChunkSource', key: key }, function () {
                return fetchOk('/neuroglancer/info/' + key).then(function (response) {
                    return response.json();
                }).then(function (response) {
                    return new MultiscaleVolumeChunkSource(_this8, chunkManager, key, response);
                });
            });
        }
    }, {
        key: 'getSkeletonSource',
        value: function getSkeletonSource(chunkManager, key) {
            var skeletonKeyPattern = /^([^\/?]+)\?(.*)$/;
            var match = key.match(skeletonKeyPattern);
            if (match === null) {
                throw new Error('Invalid python volume path: ' + _JSON$stringify(key));
            }
            return chunkManager.getChunkSource(PythonSkeletonSource, {
                dataSource: this,
                generation: -1,
                parameters: {
                    key: match[1],
                    vertexAttributes: parseSkeletonVertexAttributes(match[2])
                }
            });
        }
    }, {
        key: 'description',
        get: function get() {
            return 'Python-served volume';
        }
    }]);

    return PythonDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map