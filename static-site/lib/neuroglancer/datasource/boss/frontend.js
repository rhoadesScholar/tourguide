import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Array$from from 'babel-runtime/core-js/array/from';
import _createClass from 'babel-runtime/helpers/createClass';
import _Promise from 'babel-runtime/core-js/promise';
import _Set from 'babel-runtime/core-js/set';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
export { _getVolume as getVolume };
/**
 * @license
 * Copyright 2017 Google Inc.
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
 * Support for The Boss (https://github.com/jhuapl-boss) web services.
 */
import { WithParameters } from '../../chunk_manager/frontend';
import { WithCredentialsProvider } from '../../credentials_provider/chunk_source_frontend';
import { DataSource } from './..';
import { credentialsKey, fetchWithBossCredentials } from './api';
import { MeshSourceParameters, VolumeChunkSourceParameters } from './base';
import { MeshSource } from '../../mesh/frontend';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { applyCompletionOffset, getPrefixMatchesWithDescriptions } from '../../util/completion';
import { mat4, vec2, vec3 } from '../../util/geom';
import { responseJson } from '../../util/http_request';
import { parseArray, parseQueryStringParameters, verify3dDimensions, verify3dScale, verifyEnumString, verifyFiniteFloat, verifyInt, verifyObject, verifyObjectAsMap, verifyObjectProperty, verifyOptionalString, verifyString } from '../../util/json';

var BossVolumeChunkSource = function (_WithParameters) {
    _inherits(BossVolumeChunkSource, _WithParameters);

    function BossVolumeChunkSource() {
        _classCallCheck(this, BossVolumeChunkSource);

        return _possibleConstructorReturn(this, (BossVolumeChunkSource.__proto__ || _Object$getPrototypeOf(BossVolumeChunkSource)).apply(this, arguments));
    }

    return BossVolumeChunkSource;
}(WithParameters(WithCredentialsProvider()(VolumeChunkSource), VolumeChunkSourceParameters));

var BossMeshSource = function (_WithParameters2) {
    _inherits(BossMeshSource, _WithParameters2);

    function BossMeshSource() {
        _classCallCheck(this, BossMeshSource);

        return _possibleConstructorReturn(this, (BossMeshSource.__proto__ || _Object$getPrototypeOf(BossMeshSource)).apply(this, arguments));
    }

    return BossMeshSource;
}(WithParameters(WithCredentialsProvider()(MeshSource), MeshSourceParameters));

var serverVolumeTypes = new _Map();
serverVolumeTypes.set('image', VolumeType.IMAGE);
serverVolumeTypes.set('annotation', VolumeType.SEGMENTATION);
var VALID_ENCODINGS = new _Set(['npz', 'jpeg']);
var DEFAULT_CUBOID_SIZE = vec3.fromValues(512, 512, 16);
var VoxelUnitType;
(function (VoxelUnitType) {
    VoxelUnitType[VoxelUnitType["NANOMETERS"] = 0] = "NANOMETERS";
    VoxelUnitType[VoxelUnitType["MICROMETERS"] = 1] = "MICROMETERS";
    VoxelUnitType[VoxelUnitType["MILLIMETERS"] = 2] = "MILLIMETERS";
    VoxelUnitType[VoxelUnitType["CENTIMETERS"] = 3] = "CENTIMETERS";
})(VoxelUnitType || (VoxelUnitType = {}));
function getVoxelUnitInNanometers(voxelUnit) {
    switch (voxelUnit) {
        case VoxelUnitType.MICROMETERS:
            return 1.e3;
        case VoxelUnitType.MILLIMETERS:
            return 1.e6;
        case VoxelUnitType.CENTIMETERS:
            return 1.e7;
        default:
            return 1.0;
    }
}
/**
 * This function adds scaling info by processing coordinate frame object and adding it to the
 * experiment.
 */
function parseCoordinateFrame(coordFrame, experimentInfo) {
    verifyObject(coordFrame);
    var voxelSizeBase = vec3.create(),
        voxelOffsetBase = vec3.create(),
        imageSizeBase = vec3.create();
    voxelSizeBase[0] = verifyObjectProperty(coordFrame, 'x_voxel_size', verifyInt);
    voxelSizeBase[1] = verifyObjectProperty(coordFrame, 'y_voxel_size', verifyInt);
    voxelSizeBase[2] = verifyObjectProperty(coordFrame, 'z_voxel_size', verifyInt);
    voxelOffsetBase[0] = verifyObjectProperty(coordFrame, 'x_start', verifyInt);
    voxelOffsetBase[1] = verifyObjectProperty(coordFrame, 'y_start', verifyInt);
    voxelOffsetBase[2] = verifyObjectProperty(coordFrame, 'z_start', verifyInt);
    imageSizeBase[0] = verifyObjectProperty(coordFrame, 'x_stop', verifyInt);
    imageSizeBase[1] = verifyObjectProperty(coordFrame, 'y_stop', verifyInt);
    imageSizeBase[2] = verifyObjectProperty(coordFrame, 'z_stop', verifyInt);
    var voxelUnit = verifyObjectProperty(coordFrame, 'voxel_unit', function (x) {
        return verifyEnumString(x, VoxelUnitType);
    });
    var voxelSizeBaseNanometers = vec3.scale(vec3.create(), voxelSizeBase, getVoxelUnitInNanometers(voxelUnit));
    experimentInfo.coordFrame = { voxelSizeBaseNanometers: voxelSizeBaseNanometers, voxelOffsetBase: voxelOffsetBase, imageSizeBase: imageSizeBase, voxelUnit: voxelUnit };
    return experimentInfo;
}
function getVolumeTypeFromChannelType(channelType) {
    var volumeType = serverVolumeTypes.get(channelType);
    if (volumeType === undefined) {
        volumeType = VolumeType.UNKNOWN;
    }
    return volumeType;
}
function parseChannelInfo(obj) {
    verifyObject(obj);
    var channelType = verifyObjectProperty(obj, 'type', verifyString);
    var downsampleStatus = false;
    var downsampleStr = verifyObjectProperty(obj, 'downsample_status', verifyString);
    if (downsampleStr === 'DOWNSAMPLED') {
        downsampleStatus = true;
    }
    return {
        channelType: channelType,
        description: verifyObjectProperty(obj, 'description', verifyString),
        volumeType: getVolumeTypeFromChannelType(channelType),
        dataType: verifyObjectProperty(obj, 'datatype', function (x) {
            return verifyEnumString(x, DataType);
        }),
        downsampled: downsampleStatus,
        scales: [],
        key: verifyObjectProperty(obj, 'name', verifyString)
    };
}
function parseExperimentInfo(obj, chunkManager, hostname, credentialsProvider, collection, experiment) {
    verifyObject(obj);
    var channelPromiseArray = verifyObjectProperty(obj, 'channels', function (x) {
        return parseArray(x, function (ch) {
            return getChannelInfo(chunkManager, hostname, credentialsProvider, experiment, collection, ch);
        });
    });
    return _Promise.all(channelPromiseArray).then(function (channelArray) {
        // Parse out channel information
        var channels = new _Map();
        channelArray.forEach(function (channel) {
            channels.set(channel.key, channel);
        });
        var experimentInfo = {
            channels: channels,
            scalingLevels: verifyObjectProperty(obj, 'num_hierarchy_levels', verifyInt),
            coordFrameKey: verifyObjectProperty(obj, 'coord_frame', verifyString),
            coordFrame: undefined,
            key: verifyObjectProperty(obj, 'name', verifyString),
            collection: verifyObjectProperty(obj, 'collection', verifyString)
        };
        // Get and parse the coordinate frame
        return getCoordinateFrame(chunkManager, hostname, credentialsProvider, experimentInfo);
    });
}
export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, baseUrl, credentialsProvider, experimentInfo, channel, parameters) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.baseUrl = baseUrl;
        this.credentialsProvider = credentialsProvider;
        this.experimentInfo = experimentInfo;
        this.parameters = parameters;
        /**
         * Parameters for getting 3D meshes alongside segmentations
         */
        this.meshPath = undefined;
        this.meshUrl = undefined;
        if (channel === undefined) {
            var channelNames = _Array$from(experimentInfo.channels.keys());
            if (channelNames.length !== 1) {
                throw new Error('Experiment contains multiple channels: ' + _JSON$stringify(channelNames));
            }
            channel = channelNames[0];
        }
        var channelInfo = experimentInfo.channels.get(channel);
        if (channelInfo === undefined) {
            throw new Error('Specified channel ' + _JSON$stringify(channel) + ' is not one of the supported channels ' + _JSON$stringify(_Array$from(experimentInfo.channels.keys())));
        }
        this.channel = channel;
        this.channelInfo = channelInfo;
        this.scales = channelInfo.scales;
        if (experimentInfo.coordFrame === undefined) {
            throw new Error('Specified experiment ' + _JSON$stringify(experimentInfo.key) + ' does not have a valid coordinate frame');
        }
        this.coordinateFrame = experimentInfo.coordFrame;
        if (this.channelInfo.downsampled === false) {
            this.scales = [channelInfo.scales[0]];
        }
        this.experiment = experimentInfo.key;
        var window = verifyOptionalString(parameters['window']);
        if (window !== undefined) {
            var windowobj = vec2.create();
            var parts = window.split(/,/);
            if (parts.length === 2) {
                windowobj[0] = verifyFiniteFloat(parts[0]);
                windowobj[1] = verifyFiniteFloat(parts[1]);
            } else if (parts.length === 1) {
                windowobj[0] = 0.;
                windowobj[1] = verifyFiniteFloat(parts[1]);
            } else {
                throw new Error('Invalid window. Must be either one value or two comma separated values: ' + _JSON$stringify(window));
            }
            this.window = windowobj;
            if (this.window[0] === this.window[1]) {
                throw new Error('Invalid window. First element must be different from second: ' + _JSON$stringify(window) + '.');
            }
        }
        var meshUrl = verifyOptionalString(parameters['meshurl']);
        if (meshUrl !== undefined) {
            this.meshUrl = meshUrl;
        }
        var encoding = verifyOptionalString(parameters['encoding']);
        if (encoding === undefined) {
            encoding = this.volumeType === VolumeType.IMAGE ? 'jpeg' : 'npz';
        } else {
            if (!VALID_ENCODINGS.has(encoding)) {
                throw new Error('Invalid encoding: ' + _JSON$stringify(encoding) + '.');
            }
        }
        this.encoding = encoding;
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var _this3 = this;

            return this.scales.map(function (scaleInfo) {
                var voxelSizeNanometers = scaleInfo.voxelSizeNanometers,
                    imageSize = scaleInfo.imageSize;

                var voxelOffset = _this3.coordinateFrame.voxelOffsetBase;
                var baseVoxelOffset = vec3.create();
                for (var i = 0; i < 3; ++i) {
                    baseVoxelOffset[i] = Math.ceil(voxelOffset[i]);
                }
                return VolumeChunkSpecification.getDefaults({
                    numChannels: _this3.numChannels,
                    volumeType: _this3.volumeType,
                    dataType: _this3.dataType,
                    voxelSize: voxelSizeNanometers,
                    chunkDataSizes: [DEFAULT_CUBOID_SIZE],
                    transform: mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), voxelOffset, voxelSizeNanometers)),
                    baseVoxelOffset: baseVoxelOffset,
                    upperVoxelBound: imageSize,
                    volumeSourceOptions: volumeSourceOptions
                }).map(function (spec) {
                    return _this3.chunkManager.getChunkSource(BossVolumeChunkSource, {
                        credentialsProvider: _this3.credentialsProvider,
                        spec: spec,
                        parameters: {
                            baseUrl: _this3.baseUrl,
                            collection: _this3.experimentInfo.collection,
                            experiment: _this3.experimentInfo.key,
                            channel: _this3.channel,
                            resolution: scaleInfo.key,
                            encoding: _this3.encoding,
                            window: _this3.window
                        }
                    });
                });
            });
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            if (this.meshUrl !== undefined) {
                return this.chunkManager.getChunkSource(BossMeshSource, { credentialsProvider: this.credentialsProvider, parameters: { baseUrl: this.meshUrl } });
            }
            return null;
        }
    }, {
        key: 'dataType',
        get: function get() {
            if (this.channelInfo.dataType === DataType.UINT16) {
                // 16-bit channels automatically rescaled to uint8 by The Boss
                return DataType.UINT8;
            }
            return this.channelInfo.dataType;
        }
    }, {
        key: 'numChannels',
        get: function get() {
            return 1;
        }
    }, {
        key: 'volumeType',
        get: function get() {
            return this.channelInfo.volumeType;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
var pathPattern = /^([^\/?]+)\/([^\/?]+)(?:\/([^\/?]+))?(?:\?(.*))?$/;
export function getExperimentInfo(chunkManager, hostname, credentialsProvider, experiment, collection) {
    return chunkManager.memoize.getUncounted({
        hostname: hostname,
        collection: collection,
        experiment: experiment,
        type: 'boss:getExperimentInfo'
    }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/collection/' + collection + '/experiment/' + experiment + '/', {}, responseJson).then(function (value) {
            return parseExperimentInfo(value, chunkManager, hostname, credentialsProvider, collection, experiment);
        });
    });
}
export function getChannelInfo(chunkManager, hostname, credentialsProvider, experiment, collection, channel) {
    return chunkManager.memoize.getUncounted({
        hostname: hostname,
        collection: collection,
        experiment: experiment,
        channel: channel,
        type: 'boss:getChannelInfo'
    }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/collection/' + collection + '/experiment/' + experiment + '/channel/' + channel + '/', {}, responseJson).then(parseChannelInfo);
    });
}
export function getDownsampleInfoForChannel(chunkManager, hostname, credentialsProvider, collection, experimentInfo, channel) {
    return chunkManager.memoize.getUncounted({
        hostname: hostname,
        collection: collection,
        experiment: experimentInfo.key,
        channel: channel,
        downsample: true,
        type: 'boss:getDownsampleInfoForChannel'
    }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/downsample/' + collection + '/' + experimentInfo.key + '/' + channel + '/', {}, responseJson);
    }).then(function (downsampleObj) {
        return parseDownsampleInfoForChannel(downsampleObj, experimentInfo, channel);
    });
}
export function parseDownsampleScales(downsampleObj, voxelUnit) {
    verifyObject(downsampleObj);
    var voxelSizes = verifyObjectProperty(downsampleObj, 'voxel_size', function (x) {
        return verifyObjectAsMap(x, verify3dScale);
    });
    var imageSizes = verifyObjectProperty(downsampleObj, 'extent', function (x) {
        return verifyObjectAsMap(x, verify3dDimensions);
    });
    var num_hierarchy_levels = verifyObjectProperty(downsampleObj, 'num_hierarchy_levels', verifyInt);
    var scaleInfo = new Array();
    for (var i = 0; i < num_hierarchy_levels; i++) {
        var key = String(i);
        var voxelSize = voxelSizes.get(key);
        var imageSize = imageSizes.get(key);
        if (voxelSize === undefined || imageSize === undefined) {
            throw new Error('Missing voxel_size/extent for resolution ' + key + '.');
        }
        var voxelSizeNanometers = vec3.scale(vec3.create(), voxelSize, getVoxelUnitInNanometers(voxelUnit));
        scaleInfo[i] = { voxelSizeNanometers: voxelSizeNanometers, imageSize: imageSize, key: key };
    }
    return scaleInfo;
}
export function parseDownsampleInfoForChannel(downsampleObj, experimentInfo, channel) {
    var coordFrame = experimentInfo.coordFrame;
    if (coordFrame === undefined) {
        throw new Error('Missing coordinate frame information for experiment ' + experimentInfo.key + '. A valid coordinate frame is required to retrieve downsampling information.');
    }
    var channelInfo = experimentInfo.channels.get(channel);
    if (channelInfo === undefined) {
        throw new Error('Specified channel ' + _JSON$stringify(channel) + ' is not one of the supported channels ' + _JSON$stringify(_Array$from(experimentInfo.channels.keys())));
    }
    channelInfo.scales = parseDownsampleScales(downsampleObj, coordFrame.voxelUnit);
    experimentInfo.channels.set(channel, channelInfo);
    return experimentInfo;
}
function _getVolume(chunkManager, hostname, credentialsProvider, path) {
    var match = path.match(pathPattern);
    if (match === null) {
        throw new Error('Invalid volume path ' + _JSON$stringify(path));
    }
    var collection = match[1];
    var experiment = match[2];
    var channel = match[3];
    var parameters = parseQueryStringParameters(match[4] || '');
    // Warning: If additional arguments are added, the cache key should be updated as well.
    return chunkManager.memoize.getUncounted({ hostname: hostname, path: path, type: 'boss:getVolume' }, function () {
        return getExperimentInfo(chunkManager, hostname, credentialsProvider, experiment, collection).then(function (experimentInfo) {
            return getDownsampleInfoForChannel(chunkManager, hostname, credentialsProvider, collection, experimentInfo, channel).then(function (experimentInfoWithDownsample) {
                return new MultiscaleVolumeChunkSource(chunkManager, hostname, credentialsProvider, experimentInfoWithDownsample, channel, parameters);
            });
        });
    });
}
var urlPattern = /^((?:http|https):\/\/[^\/?]+)\/(.*)$/;
export function getCollections(chunkManager, hostname, credentialsProvider) {
    return chunkManager.memoize.getUncounted({ hostname: hostname, type: 'boss:getCollections' }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/collection/', {}, responseJson).then(function (value) {
            return verifyObjectProperty(value, 'collections', function (x) {
                return parseArray(x, verifyString);
            });
        });
    });
}
export function getExperiments(chunkManager, hostname, credentialsProvider, collection) {
    return chunkManager.memoize.getUncounted({ hostname: hostname, collection: collection, type: 'boss:getExperiments' }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/collection/' + collection + '/experiment/', {}, responseJson).then(function (value) {
            return verifyObjectProperty(value, 'experiments', function (x) {
                return parseArray(x, verifyString);
            });
        });
    });
}
export function getCoordinateFrame(chunkManager, hostname, credentialsProvider, experimentInfo) {
    var key = experimentInfo.coordFrameKey;
    return chunkManager.memoize.getUncounted({
        hostname: hostname,
        coordinateframe: key,
        experimentInfo: experimentInfo,
        type: 'boss:getCoordinateFrame'
    }, function () {
        return fetchWithBossCredentials(credentialsProvider, hostname + '/latest/coord/' + key + '/', {}, responseJson).then(function (coordinateFrameObj) {
            return parseCoordinateFrame(coordinateFrameObj, experimentInfo);
        });
    });
}
export function collectionExperimentChannelCompleter(chunkManager, hostname, credentialsProvider, path) {
    var channelMatch = path.match(/^(?:([^\/]+)(?:\/?([^\/]*)(?:\/?([^\/]*)(?:\/?([^\/]*)?))?)?)?$/);
    if (channelMatch === null) {
        // URL has incorrect format, don't return any results.
        return _Promise.reject(null);
    }
    if (channelMatch[1] === undefined) {
        // No collection. Reject.
        return _Promise.reject(null);
    }
    if (channelMatch[2] === undefined) {
        var collectionPrefix = channelMatch[1] || '';
        // Try to complete the collection.
        return getCollections(chunkManager, hostname, credentialsProvider).then(function (collections) {
            return {
                offset: 0,
                completions: getPrefixMatchesWithDescriptions(collectionPrefix, collections, function (x) {
                    return x + '/';
                }, function () {
                    return undefined;
                })
            };
        });
    }
    if (channelMatch[3] === undefined) {
        var experimentPrefix = channelMatch[2] || '';
        return getExperiments(chunkManager, hostname, credentialsProvider, channelMatch[1]).then(function (experiments) {
            return {
                offset: channelMatch[1].length + 1,
                completions: getPrefixMatchesWithDescriptions(experimentPrefix, experiments, function (y) {
                    return y + '/';
                }, function () {
                    return undefined;
                })
            };
        });
    }
    return getExperimentInfo(chunkManager, hostname, credentialsProvider, channelMatch[2], channelMatch[1]).then(function (experimentInfo) {
        var completions = getPrefixMatchesWithDescriptions(channelMatch[3], experimentInfo.channels, function (x) {
            return x[0];
        }, function (x) {
            return x[1].channelType + ' (' + DataType[x[1].dataType] + ')';
        });
        return { offset: channelMatch[1].length + channelMatch[2].length + 2, completions: completions };
    });
}
function getAuthServer(endpoint) {
    var baseHostName = endpoint.match(/^(?:https:\/\/[^.]+([^\/]+))/);
    if (baseHostName === null) {
        throw new Error('Unable to construct auth server hostname from base hostname ' + endpoint + '.');
    }
    var authServer = 'https://auth' + baseHostName[1] + '/auth';
    return authServer;
}
export var BossDataSource = function (_DataSource) {
    _inherits(BossDataSource, _DataSource);

    function BossDataSource(credentialsManager) {
        _classCallCheck(this, BossDataSource);

        var _this4 = _possibleConstructorReturn(this, (BossDataSource.__proto__ || _Object$getPrototypeOf(BossDataSource)).call(this));

        _this4.credentialsManager = credentialsManager;
        return _this4;
    }

    _createClass(BossDataSource, [{
        key: 'getCredentialsProvider',
        value: function getCredentialsProvider(path) {
            var authServer = getAuthServer(path);
            return this.credentialsManager.getCredentialsProvider(credentialsKey, authServer);
        }
    }, {
        key: 'getVolume',
        value: function getVolume(chunkManager, path) {
            var match = path.match(urlPattern);
            if (match === null) {
                throw new Error('Invalid boss volume path: ' + _JSON$stringify(path));
            }
            var credentialsProvider = this.getCredentialsProvider(path);
            return _getVolume(chunkManager, match[1], credentialsProvider, match[2]);
        }
    }, {
        key: 'volumeCompleter',
        value: function volumeCompleter(url, chunkManager) {
            var match = url.match(urlPattern);
            if (match === null) {
                // We don't yet have a full hostname.
                return _Promise.reject(null);
            }
            var hostname = match[1];
            var credentialsProvider = this.getCredentialsProvider(match[1]);
            var path = match[2];
            return collectionExperimentChannelCompleter(chunkManager, hostname, credentialsProvider, path).then(function (completions) {
                return applyCompletionOffset(match[1].length + 1, completions);
            });
        }
    }, {
        key: 'description',
        get: function get() {
            return 'The Boss';
        }
    }]);

    return BossDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map