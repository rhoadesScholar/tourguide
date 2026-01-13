import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Promise from 'babel-runtime/core-js/promise';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Set from 'babel-runtime/core-js/set';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _Map from 'babel-runtime/core-js/map';
export { _getVolume as getVolume };
export { _volumeCompleter as volumeCompleter };
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
 * Support for DVID (https://github.com/janelia-flyem/dvid) servers.
 */
import { DVIDInstance, makeRequest } from './api';
import { AnnotationGeometryChunkSpecification } from '../../annotation/base';
import { MultiscaleAnnotationSource } from '../../annotation/frontend';
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { AnnotationSourceParameters, MeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeChunkSourceParameters } from './base';
import { MeshSource } from '../../mesh/frontend';
import { SkeletonSource } from '../../skeleton/frontend';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { StatusMessage } from '../../status';
import { applyCompletionOffset, getPrefixMatchesWithDescriptions } from '../../util/completion';
import { mat4, vec3 } from '../../util/geom';
import { fetchOk } from '../../util/http_request';
import { parseQueryStringParameters, parseArray, parseFixedLengthArray, parseIntVec, verifyFinitePositiveFloat, verifyMapKey, verifyObject, verifyObjectAsMap, verifyObjectProperty, verifyPositiveInt, verifyString } from '../../util/json';
import { Env } from '../../_zhaot/env';
// import { MultiscaleAnnotationSource } from 'neuroglancer/annotation/frontend';
var serverDataTypes = new _Map();
serverDataTypes.set('uint8', DataType.UINT8);
serverDataTypes.set('uint64', DataType.UINT64);
export var DataInstanceBaseInfo = function () {
    function DataInstanceBaseInfo(obj) {
        _classCallCheck(this, DataInstanceBaseInfo);

        this.obj = obj;
        verifyObject(obj);
        verifyObjectProperty(obj, 'TypeName', verifyString);
    }

    _createClass(DataInstanceBaseInfo, [{
        key: 'typeName',
        get: function get() {
            return this.obj['TypeName'];
        }
    }, {
        key: 'compressionName',
        get: function get() {
            return this.obj['Compression'];
        }
    }]);

    return DataInstanceBaseInfo;
}();
export var DataInstanceInfo = function DataInstanceInfo(obj, name, base) {
    _classCallCheck(this, DataInstanceInfo);

    this.obj = obj;
    this.name = name;
    this.base = base;
};

var DVIDVolumeChunkSource = function (_WithParameters) {
    _inherits(DVIDVolumeChunkSource, _WithParameters);

    function DVIDVolumeChunkSource() {
        _classCallCheck(this, DVIDVolumeChunkSource);

        return _possibleConstructorReturn(this, (DVIDVolumeChunkSource.__proto__ || _Object$getPrototypeOf(DVIDVolumeChunkSource)).apply(this, arguments));
    }

    return DVIDVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));

var DVIDSkeletonSource = function (_WithParameters2) {
    _inherits(DVIDSkeletonSource, _WithParameters2);

    function DVIDSkeletonSource() {
        _classCallCheck(this, DVIDSkeletonSource);

        return _possibleConstructorReturn(this, (DVIDSkeletonSource.__proto__ || _Object$getPrototypeOf(DVIDSkeletonSource)).apply(this, arguments));
    }

    return DVIDSkeletonSource;
}(WithParameters(SkeletonSource, SkeletonSourceParameters));

var DVIDMeshSource = function (_WithParameters3) {
    _inherits(DVIDMeshSource, _WithParameters3);

    function DVIDMeshSource() {
        _classCallCheck(this, DVIDMeshSource);

        return _possibleConstructorReturn(this, (DVIDMeshSource.__proto__ || _Object$getPrototypeOf(DVIDMeshSource)).apply(this, arguments));
    }

    return DVIDMeshSource;
}(WithParameters(MeshSource, MeshSourceParameters));

export var VolumeDataInstanceInfo = function (_DataInstanceInfo) {
    _inherits(VolumeDataInstanceInfo, _DataInstanceInfo);

    function VolumeDataInstanceInfo(obj, name, base, encoding, instanceNames) {
        _classCallCheck(this, VolumeDataInstanceInfo);

        var _this4 = _possibleConstructorReturn(this, (VolumeDataInstanceInfo.__proto__ || _Object$getPrototypeOf(VolumeDataInstanceInfo)).call(this, obj, name, base));

        _this4.encoding = encoding;
        var extended = verifyObjectProperty(obj, 'Extended', verifyObject);
        var extendedValues = verifyObjectProperty(extended, 'Values', function (x) {
            return parseArray(x, verifyObject);
        });
        if (extendedValues.length < 1) {
            throw new Error('Expected Extended.Values property to have length >= 1, but received: ${JSON.stringify(extendedValues)}.');
        }
        _this4.numLevels = 1;
        var instSet = new _Set(instanceNames);
        if (encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY) {
            // retrieve maximum downres level
            var maxdownreslevel = verifyObjectProperty(extended, 'MaxDownresLevel', verifyPositiveInt);
            _this4.numLevels = maxdownreslevel + 1;
        } else {
            // labelblk does not have explicit datatype support for multiscale but
            // by convention different levels are specified with unique
            // instances where levels are distinguished by the suffix '_LEVELNUM'
            while (instSet.has(name + '_' + _this4.numLevels.toString())) {
                _this4.numLevels += 1;
            }
        }
        // only allow mesh or skeletons as sources but not both
        _this4.meshSrc = '';
        if (instSet.has(name + '_meshes')) {
            _this4.meshSrc = name + '_meshes';
        }
        _this4.skeletonSrc = '';
        if (_this4.meshSrc !== '') {
            if (instSet.has(name + '_skeletons')) {
                _this4.skeletonSrc = name + '_skeletons';
            }
        }
        _this4.dataType = verifyObjectProperty(extendedValues[0], 'DataType', function (x) {
            return verifyMapKey(x, serverDataTypes);
        });
        _this4.voxelSize = verifyObjectProperty(extended, 'VoxelSize', function (x) {
            return parseFixedLengthArray(vec3.create(), x, verifyFinitePositiveFloat);
        });
        _this4.numChannels = 1;
        return _this4;
    }

    _createClass(VolumeDataInstanceInfo, [{
        key: 'getSources',
        value: function getSources(chunkManager, parameters, volumeSourceOptions) {
            var _this5 = this;

            var encoding = this.encoding;

            var sources = [];
            // must be 64 block size to work with neuroglancer properly
            var blocksize = 64;

            var _loop = function _loop(level) {
                var voxelSize = vec3.scale(vec3.create(), _this5.voxelSize, Math.pow(2, level));
                var lowerVoxelBound = vec3.create();
                var upperVoxelBound = vec3.create();
                for (var i = 0; i < 3; ++i) {
                    var lowerVoxelNotAligned = Math.floor(_this5.lowerVoxelBound[i] * (_this5.voxelSize[i] / voxelSize[i]));
                    // adjust min to be a multiple of blocksize
                    lowerVoxelBound[i] = lowerVoxelNotAligned - lowerVoxelNotAligned % blocksize;
                    var upperVoxelNotAligned = Math.ceil((_this5.upperVoxelBound[i] + 1) * (_this5.voxelSize[i] / voxelSize[i]));
                    upperVoxelBound[i] = upperVoxelNotAligned;
                    // adjust max to be a multiple of blocksize
                    if (upperVoxelNotAligned % blocksize !== 0) {
                        upperVoxelBound[i] += blocksize - upperVoxelNotAligned % blocksize;
                    }
                }
                var dataInstanceKey = parameters.dataInstanceKey;
                if (encoding !== VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY) {
                    if (level > 0) {
                        dataInstanceKey += '_' + level.toString();
                    }
                }
                var volParameters = {
                    'baseUrl': parameters.baseUrl,
                    'nodeKey': parameters.nodeKey,
                    'dataInstanceKey': dataInstanceKey,
                    'dataScale': level.toString(),
                    'encoding': encoding
                };
                var alternatives = VolumeChunkSpecification.getDefaults({
                    voxelSize: voxelSize,
                    dataType: _this5.dataType,
                    numChannels: _this5.numChannels,
                    transform: mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), lowerVoxelBound, voxelSize)),
                    baseVoxelOffset: lowerVoxelBound,
                    upperVoxelBound: vec3.subtract(vec3.create(), upperVoxelBound, lowerVoxelBound),
                    volumeType: _this5.volumeType,
                    volumeSourceOptions: volumeSourceOptions,
                    compressedSegmentationBlockSize: encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATION || encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY ? vec3.fromValues(8, 8, 8) : undefined
                }).map(function (spec) {
                    return chunkManager.getChunkSource(DVIDVolumeChunkSource, { spec: spec, parameters: volParameters });
                });
                sources.push(alternatives);
            };

            for (var level = 0; level < this.numLevels; ++level) {
                _loop(level);
            }
            return sources;
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource(chunkManager, parameters) {
            if (this.meshSrc !== '') {
                return chunkManager.getChunkSource(DVIDMeshSource, {
                    parameters: {
                        'baseUrl': parameters.baseUrl,
                        'nodeKey': parameters.nodeKey,
                        'dataInstanceKey': this.meshSrc
                    }
                });
            } else {
                return null;
            }
        }
    }, {
        key: 'getSkeletonSource',
        value: function getSkeletonSource(chunkManager, parameters) {
            if (this.skeletonSrc !== '') {
                return chunkManager.getChunkSource(DVIDSkeletonSource, {
                    parameters: {
                        'baseUrl': parameters.baseUrl,
                        'nodeKey': parameters.nodeKey,
                        'dataInstanceKey': this.skeletonSrc
                    }
                });
            } else {
                return null;
            }
        }
    }, {
        key: 'volumeType',
        get: function get() {
            return this.encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATION || this.encoding === VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY ? VolumeType.SEGMENTATION : VolumeType.IMAGE;
        }
    }]);

    return VolumeDataInstanceInfo;
}(DataInstanceInfo);
export function parseDataInstance(obj, name, instanceNames) {
    verifyObject(obj);
    var baseInfo = verifyObjectProperty(obj, 'Base', function (x) {
        return new DataInstanceBaseInfo(x);
    });
    switch (baseInfo.typeName) {
        case 'uint8blk':
        case 'grayscale8':
            var isjpegcompress = baseInfo.compressionName.indexOf('jpeg') !== -1;
            return new VolumeDataInstanceInfo(obj, name, baseInfo, isjpegcompress ? VolumeChunkEncoding.JPEG : VolumeChunkEncoding.RAW, instanceNames);
        case 'labels64':
        case 'labelblk':
            return new VolumeDataInstanceInfo(obj, name, baseInfo, VolumeChunkEncoding.COMPRESSED_SEGMENTATION, instanceNames);
        case 'labelarray':
        case 'labelmap':
            return new VolumeDataInstanceInfo(obj, name, baseInfo, VolumeChunkEncoding.COMPRESSED_SEGMENTATIONARRAY, instanceNames);
        case 'annotation':
            return new VolumeDataInstanceInfo(obj, name, baseInfo, VolumeChunkEncoding.RAW, instanceNames);
        default:
            throw new Error('DVID data type ' + _JSON$stringify(baseInfo.typeName) + ' is not supported.');
    }
}
export var RepositoryInfo = function RepositoryInfo(obj) {
    _classCallCheck(this, RepositoryInfo);

    this.errors = [];
    this.dataInstances = new _Map();
    this.vnodes = new _Set();
    if (obj instanceof RepositoryInfo) {
        this.alias = obj.alias;
        this.description = obj.description;
        // just copy references
        this.errors = obj.errors;
        this.dataInstances = obj.dataInstances;
        return;
    }
    verifyObject(obj);
    this.alias = verifyObjectProperty(obj, 'Alias', verifyString);
    this.description = verifyObjectProperty(obj, 'Description', verifyString);
    var dataInstanceObjs = verifyObjectProperty(obj, 'DataInstances', verifyObject);
    var instanceKeys = _Object$keys(dataInstanceObjs);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(instanceKeys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            try {
                this.dataInstances.set(key, parseDataInstance(dataInstanceObjs[key], key, instanceKeys));
            } catch (parseError) {
                var message = 'Failed to parse data instance ' + _JSON$stringify(key) + ': ' + parseError.message;
                console.log(message);
                this.errors.push(message);
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

    var dagObj = verifyObjectProperty(obj, 'DAG', verifyObject);
    var nodeObjs = verifyObjectProperty(dagObj, 'Nodes', verifyObject);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = _getIterator(_Object$keys(nodeObjs)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _key = _step2.value;

            this.vnodes.add(_key);
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
};
export function parseRepositoriesInfo(obj) {
    try {
        var result = verifyObjectAsMap(obj, function (x) {
            return new RepositoryInfo(x);
        });
        // make all versions available for viewing
        var allVersions = new _Map();
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = _getIterator(result), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _ref = _step3.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var key = _ref2[0];
                var info = _ref2[1];

                allVersions.set(key, info);
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = _getIterator(info.vnodes), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var key2 = _step5.value;

                        if (key2 !== key) {
                            // create new repo
                            var rep = new RepositoryInfo(info);
                            allVersions.set(key2, rep);
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

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = _getIterator(allVersions), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var _ref3 = _step4.value;

                var _ref4 = _slicedToArray(_ref3, 2);

                var _key2 = _ref4[0];
                var _info = _ref4[1];

                _info.uuid = _key2;
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

        return allVersions;
    } catch (parseError) {
        throw new Error('Failed to parse DVID repositories info: ' + parseError.message);
    }
}
export var ServerInfo = function () {
    function ServerInfo(obj) {
        _classCallCheck(this, ServerInfo);

        this.repositories = parseRepositoriesInfo(obj);
    }

    _createClass(ServerInfo, [{
        key: 'getNode',
        value: function getNode(nodeKey) {
            // FIXME: Support non-root nodes.
            var matches = [];
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(this.repositories.keys()), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var key = _step6.value;

                    if (key.startsWith(nodeKey)) {
                        matches.push(key);
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

            if (matches.length !== 1) {
                throw new Error('Node key ' + _JSON$stringify(nodeKey) + ' matches ' + _JSON$stringify(matches) + ' nodes.');
            }
            return this.repositories.get(matches[0]);
        }
    }]);

    return ServerInfo;
}();
export function getServerInfo(chunkManager, baseUrl) {
    return chunkManager.memoize.getUncounted({ type: 'dvid:getServerInfo', baseUrl: baseUrl }, function () {
        var result = fetchOk(baseUrl + '/api/repos/info').then(function (response) {
            return response.json();
        }).then(function (response) {
            return new ServerInfo(response);
        });
        var description = 'repository info for DVID server ' + baseUrl;
        StatusMessage.forPromise(result, {
            initialMessage: 'Retrieving ' + description + '.',
            delay: true,
            errorPrefix: 'Error retrieving ' + description + ': '
        });
        return result;
    });
}
/**
 * Get extra dataInstance info that isn't available on the server level.
 * this requires an extra api call
 */
export function getDataInstanceDetails(chunkManager, baseUrl, nodeKey, info) {
    return chunkManager.memoize.getUncounted({ type: 'dvid:getInstanceDetails', baseUrl: baseUrl, nodeKey: nodeKey, name: info.name }, function () {
        var result = fetchOk(baseUrl + '/api/node/' + nodeKey + '/' + info.name + '/info').then(function (response) {
            return response.json();
        });
        var description = 'datainstance info for node ' + nodeKey + ' and instance ' + info.name + ' ' + ('on DVID server ' + baseUrl);
        StatusMessage.forPromise(result, {
            initialMessage: 'Retrieving ' + description + '.',
            delay: true,
            errorPrefix: 'Error retrieving ' + description + ': '
        });
        return result.then(function (instanceDetails) {
            var extended = verifyObjectProperty(instanceDetails, 'Extended', verifyObject);
            info.lowerVoxelBound = verifyObjectProperty(extended, 'MinPoint', function (x) {
                return parseIntVec(vec3.create(), x);
            });
            info.upperVoxelBound = verifyObjectProperty(extended, 'MaxPoint', function (x) {
                return parseIntVec(vec3.create(), x);
            });
            return info;
        });
    });
}
export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, baseUrl, nodeKey, dataInstanceKey, info) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.baseUrl = baseUrl;
        this.nodeKey = nodeKey;
        this.dataInstanceKey = dataInstanceKey;
        this.info = info;
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            return this.info.getSources(this.chunkManager, {
                'baseUrl': this.baseUrl,
                'nodeKey': this.nodeKey,
                'dataInstanceKey': this.dataInstanceKey
            }, volumeSourceOptions);
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            var meshSource = this.info.getMeshSource(this.chunkManager, {
                'baseUrl': this.baseUrl,
                'nodeKey': this.nodeKey,
                'dataInstanceKey': this.dataInstanceKey
            });
            if (meshSource === null) {
                return this.info.getSkeletonSource(this.chunkManager, {
                    'baseUrl': this.baseUrl,
                    'nodeKey': this.nodeKey,
                    'dataInstanceKey': this.dataInstanceKey
                });
            }
            return meshSource;
        }
    }, {
        key: 'dataType',
        get: function get() {
            return this.info.dataType;
        }
    }, {
        key: 'numChannels',
        get: function get() {
            return this.info.numChannels;
        }
    }, {
        key: 'volumeType',
        get: function get() {
            return this.info.volumeType;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
var urlPattern = /^((?:http|https):\/\/[^\/]+)\/([^\/]+)\/([^\/]+)$/;
function _getVolume(chunkManager, url) {
    var match = url.match(urlPattern);
    if (match === null) {
        throw new Error('Invalid DVID URL: ' + _JSON$stringify(url) + '.');
    }
    var baseUrl = match[1];
    var nodeKey = match[2];
    var dataInstanceKey = match[3];
    return getServerInfo(chunkManager, baseUrl).then(function (serverInfo) {
        var repositoryInfo = serverInfo.getNode(nodeKey);
        if (repositoryInfo === undefined) {
            throw new Error('Invalid node: ' + _JSON$stringify(nodeKey) + '.');
        }
        var dataInstanceInfo = repositoryInfo.dataInstances.get(dataInstanceKey);
        if (!(dataInstanceInfo instanceof VolumeDataInstanceInfo)) {
            throw new Error('Invalid data instance ' + dataInstanceKey + '.');
        }
        return getDataInstanceDetails(chunkManager, baseUrl, nodeKey, dataInstanceInfo);
    }).then(function (info) {
        return chunkManager.memoize.getUncounted({
            type: 'dvid:MultiscaleVolumeChunkSource',
            baseUrl: baseUrl,
            nodeKey: nodeKey,
            dataInstanceKey: dataInstanceKey
        }, function () {
            return new MultiscaleVolumeChunkSource(chunkManager, baseUrl, nodeKey, dataInstanceKey, info);
        });
    });
}
export function completeInstanceName(repositoryInfo, prefix) {
    return {
        offset: 0,
        completions: getPrefixMatchesWithDescriptions(prefix, repositoryInfo.dataInstances.values(), function (instance) {
            return instance.name;
        }, function (instance) {
            return '' + instance.base.typeName;
        })
    };
}
export function completeNodeAndInstance(serverInfo, prefix) {
    var match = prefix.match(/^(?:([^\/]+)(?:\/([^\/]*))?)?$/);
    if (match === null) {
        throw new Error('Invalid DVID URL syntax.');
    }
    if (match[2] === undefined) {
        // Try to complete the node name.
        return {
            offset: 0,
            completions: getPrefixMatchesWithDescriptions(prefix, serverInfo.repositories.values(), function (repository) {
                return repository.uuid + '/';
            }, function (repository) {
                return repository.alias + ': ' + repository.description;
            })
        };
    }
    var nodeKey = match[1];
    var repositoryInfo = serverInfo.getNode(nodeKey);
    return applyCompletionOffset(nodeKey.length + 1, completeInstanceName(repositoryInfo, match[2]));
}
function _volumeCompleter(url, chunkManager) {
    var curUrlPattern = /^((?:http|https):\/\/[^\/]+)\/(.*)$/;
    var match = url.match(curUrlPattern);
    if (match === null) {
        // We don't yet have a full hostname.
        return _Promise.reject(null);
    }
    var baseUrl = match[1];
    var path = match[2];
    return getServerInfo(chunkManager, baseUrl).then(function (serverInfo) {
        return applyCompletionOffset(baseUrl.length + 1, completeNodeAndInstance(serverInfo, path));
    });
}
var SERVER_DATA_TYPES = new _Map();
SERVER_DATA_TYPES.set('UINT8', DataType.UINT8);
SERVER_DATA_TYPES.set('UINT64', DataType.UINT64);
/*
function parseBoundingBox(obj: any) {
  verifyObject(obj);
  try {
    return {
      corner:
          verifyObjectProperty(obj, 'corner', x => parseXYZ(vec3.create(), x, verifyFiniteFloat)),
      size: verifyObjectProperty(
          obj, 'size', x => parseXYZ(vec3.create(), x, verifyFinitePositiveFloat)),
      metadata: verifyObjectProperty(obj, 'metadata', verifyOptionalString),
    };
  } catch (parseError) {
    throw new Error(`Failed to parse bounding box: ${parseError.message}`);
  }
}
*/
export var VolumeInfo = function VolumeInfo(obj) {
    _classCallCheck(this, VolumeInfo);

    try {
        verifyObject(obj);
        this.numChannels = 1;
        var baseObj = verifyObjectProperty(obj, 'Base', verifyObject);
        this.dataType = verifyObjectProperty(baseObj, 'TypeName', function (x) {
            return x === undefined ? 'UINT8' : x.TypeName;
        });
        var extended = verifyObjectProperty(obj, 'Extended', verifyObject);
        this.voxelSize = verifyObjectProperty(extended, 'VoxelSize', function (x) {
            return parseIntVec(vec3.create(), x);
        });
        this.upperVoxelBound = verifyObjectProperty(extended, 'MaxPoint', function (x) {
            return parseIntVec(vec3.create(), x.map(function (a) {
                return ++a;
            }));
        });
        var _lowerVoxelBound = verifyObjectProperty(extended, 'MinPoint', function (x) {
            return parseIntVec(vec3.create(), x);
        });
        this.boundingBoxes = [{
            corner: _lowerVoxelBound,
            size: this.upperVoxelBound
        }];
    } catch (parseError) {
        throw new Error('Failed to parse DVID volume geometry: ' + parseError.message);
    }
};
export var MultiscaleVolumeInfo = function MultiscaleVolumeInfo(volumeInfoResponse) {
    _classCallCheck(this, MultiscaleVolumeInfo);

    try {
        verifyObject(volumeInfoResponse);
        this.scales = [];
        this.scales.push(new VolumeInfo(volumeInfoResponse));
        var baseScale = this.scales[0];
        this.numChannels = this.numChannels = baseScale.numChannels;
        this.dataType = this.dataType = baseScale.dataType;
    } catch (parseError) {
        throw new Error('Failed to parse DVID multiscale volume specification: ' + parseError.message);
    }
};
function makeAnnotationGeometrySourceSpecifications(multiscaleInfo) {
    var baseScale = multiscaleInfo.scales[0];
    var spec = new AnnotationGeometryChunkSpecification({
        voxelSize: baseScale.voxelSize,
        chunkSize: vec3.multiply(vec3.create(), baseScale.upperVoxelBound, baseScale.voxelSize),
        upperChunkBound: vec3.fromValues(1, 1, 1)
    });
    return [[{ parameters: undefined, spec: spec }]];
}
var MultiscaleAnnotationSourceBase = WithParameters(MultiscaleAnnotationSource, AnnotationSourceParameters);
export var DvidAnnotationSource = function (_MultiscaleAnnotation) {
    _inherits(DvidAnnotationSource, _MultiscaleAnnotation);

    function DvidAnnotationSource(chunkManager, options) {
        _classCallCheck(this, DvidAnnotationSource);

        var _this6 = _possibleConstructorReturn(this, (DvidAnnotationSource.__proto__ || _Object$getPrototypeOf(DvidAnnotationSource)).call(this, chunkManager, _Object$assign({ sourceSpecifications: makeAnnotationGeometrySourceSpecifications(options.multiscaleVolumeInfo) }, options)));

        mat4.fromScaling(_this6.objectToLocal, options.multiscaleVolumeInfo.scales[0].voxelSize);
        return _this6;
    }

    return DvidAnnotationSource;
}(MultiscaleAnnotationSourceBase);
export function parseVolumeKey(key) {
    var match = key.match(/^([^\/]+:\/\/[^\/]+)\/([^\/]+)\/.*\?(.*)$/);
    // const match = key.match(/^([^:?]+:[^:?]+:[^:?]+)?(?:\?(.*))?$/);
    if (match === null) {
        throw new Error('Invalid DVID volume key: ' + _JSON$stringify(key) + '.');
    }
    /*
    let changeSpec: ChangeSpec|undefined;
    if (match[2] !== undefined) {
      changeSpec = {changeStackId: match[2]};
    }*/
    // let changeSpec = {changeStackId: ''};
    var parameters = parseQueryStringParameters(match[3] || '');
    return { 'baseUrl': match[1], 'nodeKey': match[2], 'dataInstanceKey': parameters['label'], 'user': Env.getUser() };
    // return parameters;
}
export var DVIDDataSource = function (_DataSource) {
    _inherits(DVIDDataSource, _DataSource);

    function DVIDDataSource() {
        _classCallCheck(this, DVIDDataSource);

        return _possibleConstructorReturn(this, (DVIDDataSource.__proto__ || _Object$getPrototypeOf(DVIDDataSource)).call(this));
    }

    _createClass(DVIDDataSource, [{
        key: 'getVolume',
        value: function getVolume(chunkManager, url) {
            return _getVolume(chunkManager, url);
        }
    }, {
        key: 'volumeCompleter',
        value: function volumeCompleter(url, chunkManager) {
            return _volumeCompleter(url, chunkManager);
        }
    }, {
        key: 'getMultiscaleInfo',
        value: function getMultiscaleInfo(chunkManager, parameters) {
            var volumeId = parameters.dataInstanceKey;
            var instance = new DVIDInstance(parameters.baseUrl, parameters.nodeKey);
            return chunkManager.memoize.getUncounted({
                type: 'dvid:getMultiscaleInfo',
                volumeId: volumeId,
                instance: instance
            }, function () {
                return makeRequest(instance, {
                    method: 'GET',
                    path: '/' + volumeId + '/info',
                    responseType: 'json'
                }).then(function (response) {
                    return new MultiscaleVolumeInfo(response);
                });
            });
        }
    }, {
        key: 'forgetAnnotationSource',
        value: function forgetAnnotationSource(chunkManager) {
            var parameters = this.dvidAnnotationSourceKey['parameters'];
            this.getMultiscaleInfo(chunkManager, parameters).then(function (multiscaleVolumeInfo) {
                return chunkManager.forgetChunkSource(DvidAnnotationSource, {
                    parameters: parameters,
                    multiscaleVolumeInfo: multiscaleVolumeInfo
                });
            });
            chunkManager.memoize.forget(this.dvidAnnotationSourceKey);
        }
    }, {
        key: 'getAnnotationSource',
        value: function getAnnotationSource(chunkManager, key) {
            var _this8 = this;

            var parameters = parseVolumeKey(key);
            this.dvidAnnotationSourceKey = {
                type: 'dvid:getAnnotationSource',
                parameters: parameters
            };
            /*
            if (changeSpec === undefined) {
              throw new Error(`A changestack must be specified.`);
            }
            */
            return chunkManager.memoize.getUncounted(this.dvidAnnotationSourceKey, function () {
                return _this8.getMultiscaleInfo(chunkManager, parameters).then(function (multiscaleVolumeInfo) {
                    return chunkManager.getChunkSource(DvidAnnotationSource, {
                        parameters: parameters,
                        multiscaleVolumeInfo: multiscaleVolumeInfo
                    });
                });
            });
        }
    }, {
        key: 'description',
        get: function get() {
            return 'DVID';
        }
    }]);

    return DVIDDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map