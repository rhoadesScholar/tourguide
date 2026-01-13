import _Promise from 'babel-runtime/core-js/promise';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Array$from from 'babel-runtime/core-js/array/from';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import { AnnotationSource, AnnotationType, makeDataBoundsBoundingBox } from '../../annotation';
import { AnnotationGeometryChunkSpecification } from '../../annotation/base';
import { MultiscaleAnnotationSource } from '../../annotation/frontend';
import { WithParameters } from '../../chunk_manager/frontend';
import { WithCredentialsProvider } from '../../credentials_provider/chunk_source_frontend';
import { DataSource } from './..';
import { makeRequest } from './api';
import { AnnotationSourceParameters, MeshSourceParameters, MultiscaleMeshSourceParameters, SkeletonSourceParameters, VolumeChunkEncoding, VolumeSourceParameters } from './base';
import { VertexPositionFormat } from '../../mesh/base';
import { MeshSource, MultiscaleMeshSource } from '../../mesh/frontend';
import { SkeletonSource } from '../../skeleton/frontend';
import { ChunkLayoutPreference } from '../../sliceview/base';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { StatusMessage } from '../../status';
import { getPrefixMatches, getPrefixMatchesWithDescriptions } from '../../util/completion';
import { mat4, vec3 } from '../../util/geom';
import { parseArray, parseQueryStringParameters, parseXYZ, verifyEnumString, verifyFiniteFloat, verifyFinitePositiveFloat, verifyMapKey, verifyObject, verifyObjectProperty, verifyOptionalString, verifyPositiveInt, verifyString } from '../../util/json';
import { getObjectId } from '../../util/object_id';

var BrainmapsVolumeChunkSource = function (_WithParameters) {
    _inherits(BrainmapsVolumeChunkSource, _WithParameters);

    function BrainmapsVolumeChunkSource() {
        _classCallCheck(this, BrainmapsVolumeChunkSource);

        return _possibleConstructorReturn(this, (BrainmapsVolumeChunkSource.__proto__ || _Object$getPrototypeOf(BrainmapsVolumeChunkSource)).apply(this, arguments));
    }

    return BrainmapsVolumeChunkSource;
}(WithParameters(WithCredentialsProvider()(VolumeChunkSource), VolumeSourceParameters));

var BrainmapsMultiscaleMeshSource = function (_WithParameters2) {
    _inherits(BrainmapsMultiscaleMeshSource, _WithParameters2);

    function BrainmapsMultiscaleMeshSource() {
        _classCallCheck(this, BrainmapsMultiscaleMeshSource);

        return _possibleConstructorReturn(this, (BrainmapsMultiscaleMeshSource.__proto__ || _Object$getPrototypeOf(BrainmapsMultiscaleMeshSource)).apply(this, arguments));
    }

    return BrainmapsMultiscaleMeshSource;
}(WithParameters(WithCredentialsProvider()(MultiscaleMeshSource), MultiscaleMeshSourceParameters));

var BrainmapsMeshSource = function (_WithParameters3) {
    _inherits(BrainmapsMeshSource, _WithParameters3);

    function BrainmapsMeshSource() {
        _classCallCheck(this, BrainmapsMeshSource);

        return _possibleConstructorReturn(this, (BrainmapsMeshSource.__proto__ || _Object$getPrototypeOf(BrainmapsMeshSource)).apply(this, arguments));
    }

    return BrainmapsMeshSource;
}(WithParameters(WithCredentialsProvider()(MeshSource), MeshSourceParameters));

export var BrainmapsSkeletonSource = function (_WithParameters4) {
    _inherits(BrainmapsSkeletonSource, _WithParameters4);

    function BrainmapsSkeletonSource() {
        _classCallCheck(this, BrainmapsSkeletonSource);

        return _possibleConstructorReturn(this, (BrainmapsSkeletonSource.__proto__ || _Object$getPrototypeOf(BrainmapsSkeletonSource)).apply(this, arguments));
    }

    _createClass(BrainmapsSkeletonSource, [{
        key: 'skeletonVertexCoordinatesInVoxels',
        get: function get() {
            return false;
        }
    }]);

    return BrainmapsSkeletonSource;
}(WithParameters(WithCredentialsProvider()(SkeletonSource), SkeletonSourceParameters));
var SERVER_DATA_TYPES = new _Map();
SERVER_DATA_TYPES.set('UINT8', DataType.UINT8);
SERVER_DATA_TYPES.set('FLOAT', DataType.FLOAT32);
SERVER_DATA_TYPES.set('UINT64', DataType.UINT64);
function parseBoundingBox(obj) {
    verifyObject(obj);
    try {
        return {
            corner: verifyObjectProperty(obj, 'corner', function (x) {
                return parseXYZ(vec3.create(), x, verifyFiniteFloat);
            }),
            size: verifyObjectProperty(obj, 'size', function (x) {
                return parseXYZ(vec3.create(), x, verifyFinitePositiveFloat);
            }),
            metadata: verifyObjectProperty(obj, 'metadata', verifyOptionalString)
        };
    } catch (parseError) {
        throw new Error('Failed to parse bounding box: ' + parseError.message);
    }
}
export var VolumeInfo = function VolumeInfo(obj) {
    _classCallCheck(this, VolumeInfo);

    try {
        verifyObject(obj);
        this.numChannels = verifyObjectProperty(obj, 'channelCount', verifyPositiveInt);
        this.dataType = verifyObjectProperty(obj, 'channelType', function (x) {
            return verifyMapKey(x, SERVER_DATA_TYPES);
        });
        this.voxelSize = verifyObjectProperty(obj, 'pixelSize', function (x) {
            return parseXYZ(vec3.create(), x, verifyFinitePositiveFloat);
        });
        this.upperVoxelBound = verifyObjectProperty(obj, 'volumeSize', function (x) {
            return parseXYZ(vec3.create(), x, verifyPositiveInt);
        });
        this.boundingBoxes = verifyObjectProperty(obj, 'boundingBox', function (a) {
            return a === undefined ? [] : parseArray(a, parseBoundingBox);
        });
    } catch (parseError) {
        throw new Error('Failed to parse BrainMaps volume geometry: ' + parseError.message);
    }
};
function parseMeshInfo(obj) {
    verifyObject(obj);
    return {
        name: verifyObjectProperty(obj, 'name', verifyString),
        type: verifyObjectProperty(obj, 'type', verifyString)
    };
}
function parseMeshesResponse(meshesResponse) {
    try {
        verifyObject(meshesResponse);
        return verifyObjectProperty(meshesResponse, 'meshes', function (y) {
            if (y === undefined) {
                return [];
            }
            return parseArray(y, parseMeshInfo);
        });
    } catch (parseError) {
        throw new Error('Failed to parse BrainMaps meshes specification: ' + parseError.message);
    }
}
var floatPattern = '([0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?)';
var intPattern = '([0-9]+)';
var lodPattern = new RegExp('^(.*)_' + intPattern + 'x' + intPattern + 'x' + intPattern + '_lod([0-9]+)_' + floatPattern + '$');
function getMultiscaleMeshes(volumeInfo, meshes) {
    var multiscaleMeshes = new _Map();
    var baseVolume = volumeInfo.scales[0];
    var invalidLodMeshes = new _Set();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(meshes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var mesh = _step.value;

            // Only triangular meshes supported currently.
            if (mesh.type !== 'TRIANGLES') continue;
            var m = mesh.name.match(lodPattern);
            if (m === null) continue;
            var key = m[1];
            var info = multiscaleMeshes.get(key);
            if (info === undefined) {
                info = {
                    key: key,
                    chunkShape: vec3.create(),
                    lods: []
                };
                multiscaleMeshes.set(key, info);
            }
            var lod = parseInt(m[5]);
            if (info.lods[lod] !== undefined) {
                invalidLodMeshes.add(key);
                continue;
            }
            var chunkShapeInVoxels = vec3.fromValues(parseInt(m[2], 10), parseInt(m[3], 10), parseInt(m[4], 10));
            var gridShape = new Uint32Array(3);
            for (var i = 0; i < 3; ++i) {
                gridShape[i] = Math.ceil(baseVolume.upperVoxelBound[i] / chunkShapeInVoxels[i]);
            }
            info.lods[lod] = {
                info: mesh,
                scale: parseFloat(m[6]),
                // Temporarily use the relativeBlockShape field to store the absolute shape in voxels.
                relativeBlockShape: chunkShapeInVoxels,
                gridShape: gridShape
            };
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

    var output = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        meshLoop: for (var _iterator2 = _getIterator(multiscaleMeshes.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _mesh = _step2.value;

            if (invalidLodMeshes.has(_mesh.key)) continue meshLoop;
            var baseLod = _mesh.lods[0];
            if (baseLod === undefined) continue meshLoop;
            var baseBlockShapeInVoxels = baseLod.relativeBlockShape;
            vec3.multiply(_mesh.chunkShape, baseBlockShapeInVoxels, baseVolume.voxelSize);
            for (var lodIndex = 1; lodIndex < _mesh.lods.length; ++lodIndex) {
                var _lod = _mesh.lods[lodIndex];
                if (_lod === undefined) continue meshLoop;
                var relativeBlockShape = _lod.relativeBlockShape;

                for (var _i = 0; _i < 3; ++_i) {
                    var curSize = relativeBlockShape[_i];
                    var baseSize = baseBlockShapeInVoxels[_i];
                    if (curSize < baseSize || curSize % baseSize !== 0) continue meshLoop;
                    relativeBlockShape[_i] = curSize / baseSize;
                }
            }
            baseBlockShapeInVoxels.fill(1);
            output.push(_mesh);
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

    return output;
}
export var MultiscaleVolumeInfo = function MultiscaleVolumeInfo(volumeInfoResponse) {
    _classCallCheck(this, MultiscaleVolumeInfo);

    try {
        verifyObject(volumeInfoResponse);
        var scales = this.scales = verifyObjectProperty(volumeInfoResponse, 'geometry', function (y) {
            return parseArray(y, function (x) {
                return new VolumeInfo(x);
            });
        });
        if (scales.length === 0) {
            throw new Error('Expected at least one scale.');
        }
        var baseScale = scales[0];
        var numChannels = this.numChannels = baseScale.numChannels;
        var dataType = this.dataType = baseScale.dataType;
        for (var scaleIndex = 1, numScales = scales.length; scaleIndex < numScales; ++scaleIndex) {
            var scale = scales[scaleIndex];
            if (scale.dataType !== dataType) {
                throw new Error('Scale ' + scaleIndex + ' has data type ' + DataType[scale.dataType] + ' ' + ('but scale 0 has data type ' + DataType[dataType] + '.'));
            }
            if (scale.numChannels !== numChannels) {
                throw new Error('Scale ' + scaleIndex + ' has ' + scale.numChannels + ' channel(s) ' + ('but scale 0 has ' + numChannels + ' channels.'));
            }
        }
    } catch (parseError) {
        throw new Error('Failed to parse BrainMaps multiscale volume specification: ' + parseError.message);
    }
};
export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, instance, credentialsProvider, volumeId, changeSpec, multiscaleVolumeInfo, meshesResponse, options) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.instance = instance;
        this.credentialsProvider = credentialsProvider;
        this.volumeId = volumeId;
        this.changeSpec = changeSpec;
        this.multiscaleVolumeInfo = multiscaleVolumeInfo;
        this.encoding = options.encoding;
        this.chunkLayoutPreference = options.chunkLayoutPreference;
        // Infer the VolumeType from the data type and number of channels.
        var volumeType = void 0;
        if (this.numChannels === 1) {
            switch (this.dataType) {
                case DataType.UINT64:
                    volumeType = VolumeType.SEGMENTATION;
                    break;
            }
        }
        if (volumeType === undefined) {
            if (options.volumeType !== undefined) {
                volumeType = options.volumeType;
            } else {
                volumeType = VolumeType.IMAGE;
            }
        }
        this.volumeType = volumeType;
        this.meshes = parseMeshesResponse(meshesResponse);
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var _this5 = this;

            var encoding = VolumeChunkEncoding.RAW;
            if (this.dataType === DataType.UINT64) {
                encoding = VolumeChunkEncoding.COMPRESSED_SEGMENTATION;
            } else if (this.volumeType === VolumeType.IMAGE && this.dataType === DataType.UINT8 && this.numChannels === 1 && this.encoding !== VolumeChunkEncoding.RAW) {
                encoding = VolumeChunkEncoding.JPEG;
            }
            var baseScale = this.scales[0];
            var upperClipBound = vec3.multiply(vec3.create(), baseScale.upperVoxelBound, baseScale.voxelSize);
            return this.scales.map(function (volumeInfo, scaleIndex) {
                return VolumeChunkSpecification.getDefaults({
                    voxelSize: volumeInfo.voxelSize,
                    dataType: volumeInfo.dataType,
                    numChannels: volumeInfo.numChannels,
                    upperVoxelBound: volumeInfo.upperVoxelBound,
                    upperClipBound: upperClipBound,
                    volumeType: _this5.volumeType,
                    volumeSourceOptions: volumeSourceOptions,
                    chunkLayoutPreference: _this5.chunkLayoutPreference,
                    maxCompressedSegmentationBlockSize: vec3.fromValues(64, 64, 64)
                }).map(function (spec) {
                    return _this5.chunkManager.getChunkSource(BrainmapsVolumeChunkSource, {
                        credentialsProvider: _this5.credentialsProvider,
                        spec: spec,
                        parameters: {
                            'volumeId': _this5.volumeId,
                            'changeSpec': _this5.changeSpec,
                            'scaleIndex': scaleIndex,
                            'encoding': encoding,
                            'instance': _this5.instance
                        }
                    });
                });
            });
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            var multiscaleMeshes = getMultiscaleMeshes(this.multiscaleVolumeInfo, this.meshes);
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(multiscaleMeshes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var mesh = _step3.value;

                    return this.chunkManager.getChunkSource(BrainmapsMultiscaleMeshSource, {
                        credentialsProvider: this.credentialsProvider,
                        format: {
                            fragmentRelativeVertices: false,
                            transform: mat4.create(),
                            vertexPositionFormat: VertexPositionFormat.float32
                        },
                        parameters: {
                            'instance': this.instance,
                            'volumeId': this.volumeId,
                            'info': mesh,
                            'changeSpec': this.changeSpec
                        }
                    });
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
                for (var _iterator4 = _getIterator(this.meshes), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _mesh2 = _step4.value;

                    if (_mesh2.type === 'TRIANGLES') {
                        return this.chunkManager.getChunkSource(BrainmapsMeshSource, {
                            credentialsProvider: this.credentialsProvider,
                            parameters: {
                                'instance': this.instance,
                                'volumeId': this.volumeId,
                                'meshName': _mesh2.name,
                                'changeSpec': this.changeSpec
                            }
                        });
                    } else if (_mesh2.type === 'LINE_SEGMENTS') {
                        return this.chunkManager.getChunkSource(BrainmapsSkeletonSource, {
                            credentialsProvider: this.credentialsProvider,
                            parameters: {
                                'instance': this.instance,
                                'volumeId': this.volumeId,
                                'meshName': _mesh2.name,
                                'changeSpec': this.changeSpec
                            }
                        });
                    }
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

            return null;
        }
    }, {
        key: 'getStaticAnnotations',
        value: function getStaticAnnotations() {
            var baseScale = this.scales[0];
            var annotationSet = new AnnotationSource(mat4.fromScaling(mat4.create(), baseScale.voxelSize));
            annotationSet.readonly = true;
            annotationSet.add(makeDataBoundsBoundingBox(vec3.create(), baseScale.upperVoxelBound));
            baseScale.boundingBoxes.forEach(function (boundingBox, i) {
                annotationSet.add({
                    type: AnnotationType.AXIS_ALIGNED_BOUNDING_BOX,
                    description: boundingBox.metadata,
                    pointA: boundingBox.corner,
                    pointB: vec3.add(vec3.create(), boundingBox.corner, boundingBox.size),
                    id: 'boundingBox' + i
                });
            });
            return annotationSet;
        }
    }, {
        key: 'scales',
        get: function get() {
            return this.multiscaleVolumeInfo.scales;
        }
    }, {
        key: 'dataType',
        get: function get() {
            return this.multiscaleVolumeInfo.dataType;
        }
    }, {
        key: 'numChannels',
        get: function get() {
            return this.multiscaleVolumeInfo.numChannels;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
export function parseVolumeKey(key) {
    var match = key.match(/^([^:?]+:[^:?]+:[^:?]+)(?::([^:?]+))?(?:\?(.*))?$/);
    if (match === null) {
        throw new Error('Invalid Brain Maps volume key: ' + _JSON$stringify(key) + '.');
    }
    var changeSpec = void 0;
    if (match[2] !== undefined) {
        changeSpec = { changeStackId: match[2] };
    }
    var parameters = parseQueryStringParameters(match[3] || '');
    return { volumeId: match[1], changeSpec: changeSpec, parameters: parameters };
}
var meshSourcePattern = /^([^\/]+)\/(.*)$/;
function parseProject(obj) {
    try {
        verifyObject(obj);
        return {
            id: verifyObjectProperty(obj, 'id', verifyString),
            label: verifyObjectProperty(obj, 'label', verifyString),
            description: verifyObjectProperty(obj, 'description', verifyOptionalString)
        };
    } catch (parseError) {
        throw new Error('Failed to parse project: ' + parseError.message);
    }
}
function parseProjectList(obj) {
    try {
        verifyObject(obj);
        return verifyObjectProperty(obj, 'project', function (x) {
            return x === undefined ? [] : parseArray(x, parseProject);
        });
    } catch (parseError) {
        throw new Error('Error parsing project list: ' + parseError.message);
    }
}
function parseAPIResponseList(obj, propertyName) {
    try {
        verifyObject(obj);
        return verifyObjectProperty(obj, propertyName, function (x) {
            return x === undefined ? [] : parseArray(x, verifyString);
        });
    } catch (parseError) {
        throw new Error('Error parsing dataset list: ' + parseError.message);
    }
}
export var VolumeList = function VolumeList(projectsResponse, volumesResponse) {
    _classCallCheck(this, VolumeList);

    this.projects = new _Map();
    this.hierarchicalVolumeIds = new _Map();
    var projects = this.projects;
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = _getIterator(parseProjectList(projectsResponse)), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var project = _step5.value;

            projects.set(project.id, project);
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

    try {
        verifyObject(volumesResponse);
        var volumeIds = this.volumeIds = verifyObjectProperty(volumesResponse, 'volumeId', function (x) {
            return x === undefined ? [] : parseArray(x, verifyString);
        });
        volumeIds.sort();
        var hierarchicalSets = new _Map();
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = _getIterator(volumeIds), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var volumeId = _step6.value;

                var componentStart = 0;
                while (true) {
                    var nextColon = volumeId.indexOf(':', componentStart);
                    if (nextColon === -1) {
                        nextColon = undefined;
                    } else {
                        ++nextColon;
                    }
                    var groupString = volumeId.substring(0, componentStart);
                    var _group = hierarchicalSets.get(groupString);
                    if (_group === undefined) {
                        _group = new _Set();
                        hierarchicalSets.set(groupString, _group);
                    }
                    _group.add(volumeId.substring(componentStart, nextColon));
                    if (nextColon === undefined) {
                        break;
                    }
                    componentStart = nextColon;
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

        var hierarchicalVolumeIds = this.hierarchicalVolumeIds;
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = _getIterator(hierarchicalSets), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var _ref = _step7.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var group = _ref2[0];
                var valueSet = _ref2[1];

                hierarchicalVolumeIds.set(group, _Array$from(valueSet));
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
    } catch (parseError) {
        throw new Error('Failed to parse Brain Maps volume list reply: ' + parseError.message);
    }
};
export function parseChangeStackList(x) {
    return verifyObjectProperty(x, 'changeStackId', function (y) {
        return y === undefined ? undefined : parseArray(y, verifyString);
    });
}
function makeAnnotationGeometrySourceSpecifications(multiscaleInfo) {
    var baseScale = multiscaleInfo.scales[0];
    var spec = new AnnotationGeometryChunkSpecification({
        voxelSize: baseScale.voxelSize,
        chunkSize: vec3.multiply(vec3.create(), baseScale.upperVoxelBound, baseScale.voxelSize),
        upperChunkBound: vec3.fromValues(1, 1, 1)
    });
    return [[{ parameters: undefined, spec: spec }]];
}
var MultiscaleAnnotationSourceBase = WithParameters(WithCredentialsProvider()(MultiscaleAnnotationSource), AnnotationSourceParameters);
export var BrainmapsAnnotationSource = function (_MultiscaleAnnotation) {
    _inherits(BrainmapsAnnotationSource, _MultiscaleAnnotation);

    function BrainmapsAnnotationSource(chunkManager, options) {
        _classCallCheck(this, BrainmapsAnnotationSource);

        var _this6 = _possibleConstructorReturn(this, (BrainmapsAnnotationSource.__proto__ || _Object$getPrototypeOf(BrainmapsAnnotationSource)).call(this, chunkManager, _Object$assign({ sourceSpecifications: makeAnnotationGeometrySourceSpecifications(options.multiscaleVolumeInfo) }, options)));

        mat4.fromScaling(_this6.objectToLocal, options.multiscaleVolumeInfo.scales[0].voxelSize);
        return _this6;
    }

    return BrainmapsAnnotationSource;
}(MultiscaleAnnotationSourceBase);
export var BrainmapsDataSource = function (_DataSource) {
    _inherits(BrainmapsDataSource, _DataSource);

    function BrainmapsDataSource(instance, credentialsProvider) {
        _classCallCheck(this, BrainmapsDataSource);

        var _this7 = _possibleConstructorReturn(this, (BrainmapsDataSource.__proto__ || _Object$getPrototypeOf(BrainmapsDataSource)).call(this));

        _this7.instance = instance;
        _this7.credentialsProvider = credentialsProvider;
        return _this7;
    }

    _createClass(BrainmapsDataSource, [{
        key: 'getMeshSource',
        value: function getMeshSource(chunkManager, url) {
            return chunkManager.getChunkSource(BrainmapsMeshSource, {
                credentialsProvider: this.credentialsProvider,
                parameters: this.getMeshSourceParameters(url)
            });
        }
    }, {
        key: 'getMeshSourceParameters',
        value: function getMeshSourceParameters(url) {
            var match = url.match(meshSourcePattern);
            if (match === null) {
                throw new Error('Invalid Brainmaps mesh URL: ' + url);
            }

            var _parseVolumeKey = parseVolumeKey(match[1]),
                volumeId = _parseVolumeKey.volumeId,
                changeSpec = _parseVolumeKey.changeSpec;

            return { instance: this.instance, volumeId: volumeId, changeSpec: changeSpec, meshName: match[2] };
        }
    }, {
        key: 'getSkeletonSource',
        value: function getSkeletonSource(chunkManager, url) {
            return chunkManager.getChunkSource(BrainmapsSkeletonSource, {
                credentialsProvider: this.credentialsProvider,
                parameters: this.getMeshSourceParameters(url)
            });
        }
    }, {
        key: 'getMultiscaleInfo',
        value: function getMultiscaleInfo(chunkManager, volumeId) {
            var _this8 = this;

            return chunkManager.memoize.getUncounted({
                type: 'brainmaps:getMultiscaleInfo',
                volumeId: volumeId,
                instance: this.instance,
                credentialsProvider: getObjectId(this.credentialsProvider)
            }, function () {
                return makeRequest(_this8.instance, _this8.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/volumes/' + volumeId,
                    responseType: 'json'
                }).then(function (response) {
                    return new MultiscaleVolumeInfo(response);
                });
            });
        }
    }, {
        key: 'getVolume',
        value: function getVolume(chunkManager, key, options) {
            var _this9 = this;

            var _parseVolumeKey2 = parseVolumeKey(key),
                volumeId = _parseVolumeKey2.volumeId,
                changeSpec = _parseVolumeKey2.changeSpec,
                parameters = _parseVolumeKey2.parameters;

            verifyObject(parameters);
            var encoding = verifyObjectProperty(parameters, 'encoding', function (x) {
                return x === undefined ? undefined : verifyEnumString(x, VolumeChunkEncoding);
            });
            var chunkLayoutPreference = verifyObjectProperty(parameters, 'chunkLayout', function (x) {
                return x === undefined ? undefined : verifyEnumString(x, ChunkLayoutPreference);
            });
            var brainmapsOptions = _Object$assign({}, options, { encoding: encoding, chunkLayoutPreference: chunkLayoutPreference });
            return chunkManager.memoize.getUncounted({
                type: 'brainmaps:getVolume',
                instance: this.instance,
                volumeId: volumeId,
                changeSpec: changeSpec,
                brainmapsOptions: brainmapsOptions
            }, function () {
                return _Promise.all([_this9.getMultiscaleInfo(chunkManager, volumeId), makeRequest(_this9.instance, _this9.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/objects/' + volumeId + '/meshes',
                    responseType: 'json'
                })]).then(function (_ref3) {
                    var _ref4 = _slicedToArray(_ref3, 2),
                        multiscaleVolumeInfo = _ref4[0],
                        meshesResponse = _ref4[1];

                    return new MultiscaleVolumeChunkSource(chunkManager, _this9.instance, _this9.credentialsProvider, volumeId, changeSpec, multiscaleVolumeInfo, meshesResponse, brainmapsOptions);
                });
            });
        }
    }, {
        key: 'getAnnotationSource',
        value: function getAnnotationSource(chunkManager, key) {
            var _this10 = this;

            var _parseVolumeKey3 = parseVolumeKey(key),
                volumeId = _parseVolumeKey3.volumeId,
                changeSpec = _parseVolumeKey3.changeSpec;

            if (changeSpec === undefined) {
                throw new Error('A changestack must be specified.');
            }
            var parameters = {
                volumeId: volumeId,
                changestack: changeSpec.changeStackId,
                instance: this.instance
            };
            return chunkManager.memoize.getUncounted({
                type: 'brainmaps:getAnnotationSource',
                instance: this.instance,
                credentialsProvider: getObjectId(this.credentialsProvider),
                parameters: parameters
            }, function () {
                return _this10.getMultiscaleInfo(chunkManager, volumeId).then(function (multiscaleVolumeInfo) {
                    return chunkManager.getChunkSource(BrainmapsAnnotationSource, {
                        parameters: parameters,
                        credentialsProvider: _this10.credentialsProvider,
                        multiscaleVolumeInfo: multiscaleVolumeInfo
                    });
                });
            });
        }
    }, {
        key: 'getProjectList',
        value: function getProjectList(chunkManager) {
            var _this11 = this;

            return chunkManager.memoize.getUncounted({ instance: this.instance, type: 'brainmaps:getProjectList' }, function () {
                var promise = makeRequest(_this11.instance, _this11.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/projects',
                    responseType: 'json'
                }).then(function (projectsResponse) {
                    return parseProjectList(projectsResponse);
                });
                var description = _this11.instance.description + ' project list';
                StatusMessage.forPromise(promise, {
                    delay: true,
                    initialMessage: 'Retrieving ' + description + '.',
                    errorPrefix: 'Error retrieving ' + description + ': '
                });
                return promise;
            });
        }
    }, {
        key: 'getDatasetList',
        value: function getDatasetList(chunkManager, project) {
            var _this12 = this;

            return chunkManager.memoize.getUncounted({ instance: this.instance, type: 'brainmaps:' + project + ':getDatasetList' }, function () {
                var promise = makeRequest(_this12.instance, _this12.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/datasets?project_id=' + project,
                    responseType: 'json'
                }).then(function (datasetsResponse) {
                    return parseAPIResponseList(datasetsResponse, 'datasetIds');
                });
                var description = _this12.instance.description + ' dataset list';
                StatusMessage.forPromise(promise, {
                    delay: true,
                    initialMessage: 'Retrieving ' + description,
                    errorPrefix: 'Error retrieving ' + description
                });
                return promise;
            });
        }
    }, {
        key: 'getVolumeList',
        value: function getVolumeList(chunkManager, project, dataset) {
            var _this13 = this;

            return chunkManager.memoize.getUncounted({ instance: this.instance, type: 'brainmaps:' + project + ':' + dataset + ':getVolumeList' }, function () {
                var promise = makeRequest(_this13.instance, _this13.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/volumes?project_id=' + project + '&dataset_id=' + dataset,
                    responseType: 'json'
                }).then(function (volumesResponse) {
                    var fullyQualifyiedVolumeList = parseAPIResponseList(volumesResponse, 'volumeId');
                    var splitPoint = project.length + dataset.length + 2;
                    var volumeList = [];
                    var _iteratorNormalCompletion8 = true;
                    var _didIteratorError8 = false;
                    var _iteratorError8 = undefined;

                    try {
                        for (var _iterator8 = _getIterator(fullyQualifyiedVolumeList), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                            var volume = _step8.value;

                            volumeList.push(volume.substring(splitPoint));
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

                    return volumeList;
                });
                var description = _this13.instance.description + ' volume list';
                StatusMessage.forPromise(promise, {
                    delay: true,
                    initialMessage: 'Retrieving ' + description,
                    errorPrefix: 'Error retrieving ' + description
                });
                return promise;
            });
        }
    }, {
        key: 'getChangeStackList',
        value: function getChangeStackList(chunkManager, volumeId) {
            var _this14 = this;

            return chunkManager.memoize.getUncounted({ instance: this.instance, type: 'brainmaps:getChangeStackList', volumeId: volumeId }, function () {
                var promise = makeRequest(_this14.instance, _this14.credentialsProvider, {
                    method: 'GET',
                    path: '/v1beta2/changes/' + volumeId + '/change_stacks',
                    responseType: 'json'
                }).then(function (response) {
                    return parseChangeStackList(response);
                });
                var description = 'change stacks for ' + volumeId;
                StatusMessage.forPromise(promise, {
                    delay: true,
                    initialMessage: 'Retrieving ' + description + '.',
                    errorPrefix: 'Error retrieving ' + description + ': '
                });
                return promise;
            });
        }
    }, {
        key: 'volumeCompleter',
        value: function volumeCompleter(url, chunkManager) {
            var colonCount = 0;
            var colonIndices = [];
            for (var lastColon = url.indexOf(':'); lastColon >= 0; lastColon = url.indexOf(':', lastColon + 1)) {
                colonIndices.push(lastColon);
                ++colonCount;
            }
            switch (colonCount) {
                case 0:
                    {
                        // Fetch project names
                        return this.getProjectList(chunkManager).then(function (projectMetadata) {
                            var projectList = [];
                            var descriptionMap = new _Map();
                            var _iteratorNormalCompletion9 = true;
                            var _didIteratorError9 = false;
                            var _iteratorError9 = undefined;

                            try {
                                for (var _iterator9 = _getIterator(projectMetadata), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                                    var projectDatum = _step9.value;

                                    var projectColon = projectDatum.id + ':';
                                    projectList.push(projectColon);
                                    descriptionMap.set(projectColon, projectDatum.label);
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

                            return {
                                offset: 0,
                                completions: getPrefixMatchesWithDescriptions(url, projectList, function (x) {
                                    return x;
                                }, function (x) {
                                    return descriptionMap.get(x);
                                })
                            };
                        });
                    }
                case 1:
                    {
                        // Fetch dataset names, under the current project
                        var colonLocation = colonIndices[0];
                        var projectId = url.substring(0, colonLocation);
                        return this.getDatasetList(chunkManager, projectId).then(function (datasetList) {
                            var splitPoint = colonLocation + 1;
                            var matchString = url.substring(splitPoint);
                            var possibleMatches = [];
                            var _iteratorNormalCompletion10 = true;
                            var _didIteratorError10 = false;
                            var _iteratorError10 = undefined;

                            try {
                                for (var _iterator10 = _getIterator(datasetList), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                                    var datasetName = _step10.value;

                                    possibleMatches.push(datasetName + ':');
                                }
                            } catch (err) {
                                _didIteratorError10 = true;
                                _iteratorError10 = err;
                            } finally {
                                try {
                                    if (!_iteratorNormalCompletion10 && _iterator10.return) {
                                        _iterator10.return();
                                    }
                                } finally {
                                    if (_didIteratorError10) {
                                        throw _iteratorError10;
                                    }
                                }
                            }

                            possibleMatches.sort();
                            return { offset: splitPoint, completions: getPrefixMatches(matchString, possibleMatches) };
                        });
                    }
                case 2:
                    {
                        // Fetch volume names, under the current project and dataset
                        var _projectId = url.substring(0, colonIndices[0]);
                        var datasetId = url.substring(colonIndices[0] + 1, colonIndices[1]);
                        var splitPoint = colonIndices[1] + 1;
                        return this.getVolumeList(chunkManager, _projectId, datasetId).then(function (volumeList) {
                            var matchString = url.substring(splitPoint);
                            return { offset: splitPoint, completions: getPrefixMatches(matchString, volumeList) };
                        });
                    }
                default:
                    {
                        // Fetch changestack names, under the current volume
                        var volumeId = url.substring(0, colonIndices[2]);
                        var _splitPoint = colonIndices[2] + 1;
                        var matchString = url.substring(_splitPoint);
                        return this.getChangeStackList(chunkManager, volumeId).then(function (changeStacks) {
                            if (changeStacks === undefined) {
                                throw null;
                            }
                            return { offset: _splitPoint, completions: getPrefixMatches(matchString, changeStacks) };
                        });
                    }
            }
        }
    }, {
        key: 'description',
        get: function get() {
            return this.instance.description;
        }
    }]);

    return BrainmapsDataSource;
}(DataSource);
export var productionInstance = {
    description: 'Google Brain Maps',
    serverUrl: 'https://brainmaps.googleapis.com'
};
//# sourceMappingURL=frontend.js.map