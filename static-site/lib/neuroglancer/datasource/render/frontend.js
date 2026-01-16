import _Promise from 'babel-runtime/core-js/promise';
import _Array$from from 'babel-runtime/core-js/array/from';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _createClass from 'babel-runtime/helpers/createClass';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Set from 'babel-runtime/core-js/set';
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
 * Support for Render (https://github.com/saalfeldlab/render) servers.
 */
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { PointMatchChunkSourceParameters, TileChunkSourceParameters } from './base';
import { VectorGraphicsChunkSpecification } from '../../sliceview/vector_graphics/base';
import { VectorGraphicsChunkSource } from '../../sliceview/vector_graphics/frontend';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { applyCompletionOffset, getPrefixMatchesWithDescriptions } from '../../util/completion';
import { vec3 } from '../../util/geom';
import { fetchOk } from '../../util/http_request';
import { parseArray, parseQueryStringParameters, verifyFloat, verifyObject, verifyObjectProperty, verifyOptionalBoolean, verifyOptionalInt, verifyOptionalString, verifyString } from '../../util/json';
var VALID_ENCODINGS = new _Set(['jpg', 'raw16']);
var TileChunkSourceBase = WithParameters(VolumeChunkSource, TileChunkSourceParameters);

var TileChunkSource = function (_TileChunkSourceBase) {
    _inherits(TileChunkSource, _TileChunkSourceBase);

    function TileChunkSource() {
        _classCallCheck(this, TileChunkSource);

        return _possibleConstructorReturn(this, (TileChunkSource.__proto__ || _Object$getPrototypeOf(TileChunkSource)).apply(this, arguments));
    }

    return TileChunkSource;
}(TileChunkSourceBase);

var PointMatchSourceBase = WithParameters(VectorGraphicsChunkSource, PointMatchChunkSourceParameters);

var PointMatchSource = function (_PointMatchSourceBase) {
    _inherits(PointMatchSource, _PointMatchSourceBase);

    function PointMatchSource() {
        _classCallCheck(this, PointMatchSource);

        return _possibleConstructorReturn(this, (PointMatchSource.__proto__ || _Object$getPrototypeOf(PointMatchSource)).apply(this, arguments));
    }

    return PointMatchSource;
}(PointMatchSourceBase);

var VALID_STACK_STATES = new _Set(['COMPLETE', 'READ_ONLY']);
var PARTIAL_STACK_STATES = new _Set(['LOADING']);
function parseOwnerInfo(obj) {
    var stackObjs = parseArray(obj, verifyObject);
    if (stackObjs.length < 1) {
        throw new Error('No stacks found for owner object.');
    }
    var projects = new _Map();
    // Get the owner from the first stack
    var owner = verifyObjectProperty(stackObjs[0], 'stackId', parseStackOwner);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(stackObjs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var stackObj = _step.value;

            var stackName = verifyObjectProperty(stackObj, 'stackId', parseStackName);
            var stackInfo = parseStackInfo(stackObj);
            if (stackInfo !== undefined) {
                var projectName = stackInfo.project;
                var projectInfo = projects.get(projectName);
                if (projectInfo === undefined) {
                    var stacks = new _Map();
                    projects.set(projectName, { stacks: stacks });
                    projectInfo = projects.get(projectName);
                }
                projectInfo.stacks.set(stackName, stackInfo);
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

    return { owner: owner, projects: projects };
}
function parseStackName(stackIdObj) {
    verifyObject(stackIdObj);
    return verifyObjectProperty(stackIdObj, 'stack', verifyString);
}
function parseStackOwner(stackIdObj) {
    verifyObject(stackIdObj);
    return verifyObjectProperty(stackIdObj, 'owner', verifyString);
}
function parseStackInfo(obj) {
    verifyObject(obj);
    var state = verifyObjectProperty(obj, 'state', verifyString);
    var channels = [];
    var lowerVoxelBound = vec3.create();
    var upperVoxelBound = vec3.create();
    if (VALID_STACK_STATES.has(state)) {
        var stackStatsObj = verifyObjectProperty(obj, 'stats', verifyObject);
        lowerVoxelBound = parseLowerVoxelBounds(stackStatsObj);
        upperVoxelBound = parseUpperVoxelBounds(stackStatsObj);
        if (stackStatsObj.hasOwnProperty('channelNames')) {
            channels = parseChannelNames(stackStatsObj);
        }
    } else if (PARTIAL_STACK_STATES.has(state)) {
        // Stacks in LOADING state will not have a 'stats' object.
        // Values will be populated from command arguments in MultiscaleVolumeChunkSource()
    } else {
        return undefined;
    }
    var voxelResolution = verifyObjectProperty(obj, 'currentVersion', parseStackVersionInfo);
    var project = verifyObjectProperty(obj, 'stackId', parseStackProject);
    return { lowerVoxelBound: lowerVoxelBound, upperVoxelBound: upperVoxelBound, voxelResolution: voxelResolution, project: project, channels: channels };
}
function parseUpperVoxelBounds(stackStatsObj) {
    verifyObject(stackStatsObj);
    var stackBounds = verifyObjectProperty(stackStatsObj, 'stackBounds', verifyObject);
    var upperVoxelBound = vec3.create();
    upperVoxelBound[0] = verifyObjectProperty(stackBounds, 'maxX', verifyFloat) + 1;
    upperVoxelBound[1] = verifyObjectProperty(stackBounds, 'maxY', verifyFloat) + 1;
    upperVoxelBound[2] = verifyObjectProperty(stackBounds, 'maxZ', verifyFloat) + 1;
    return upperVoxelBound;
}
function parseLowerVoxelBounds(stackStatsObj) {
    verifyObject(stackStatsObj);
    var stackBounds = verifyObjectProperty(stackStatsObj, 'stackBounds', verifyObject);
    var lowerVoxelBound = vec3.create();
    lowerVoxelBound[0] = verifyObjectProperty(stackBounds, 'minX', verifyFloat);
    lowerVoxelBound[1] = verifyObjectProperty(stackBounds, 'minY', verifyFloat);
    lowerVoxelBound[2] = verifyObjectProperty(stackBounds, 'minZ', verifyFloat);
    return lowerVoxelBound;
}
function parseChannelNames(stackStatsObj) {
    verifyObject(stackStatsObj);
    return verifyObjectProperty(stackStatsObj, 'channelNames', function (channelNamesObj) {
        return parseArray(channelNamesObj, verifyString);
    });
}
function parseStackVersionInfo(stackVersionObj) {
    verifyObject(stackVersionObj);
    var voxelResolution = vec3.create();
    try {
        voxelResolution[0] = verifyObjectProperty(stackVersionObj, 'stackResolutionX', verifyFloat);
        voxelResolution[1] = verifyObjectProperty(stackVersionObj, 'stackResolutionY', verifyFloat);
        voxelResolution[2] = verifyObjectProperty(stackVersionObj, 'stackResolutionZ', verifyFloat);
    } catch (ignoredError) {
        // default is 1, 1, 1
        voxelResolution[0] = 1;
        voxelResolution[1] = 1;
        voxelResolution[2] = 1;
    }
    return voxelResolution;
}
function parseStackProject(stackIdObj) {
    verifyObject(stackIdObj);
    return verifyObjectProperty(stackIdObj, 'project', verifyString);
}
export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, baseUrl, ownerInfo, stack, project, channel, parameters) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.baseUrl = baseUrl;
        this.ownerInfo = ownerInfo;
        this.project = project;
        this.parameters = parameters;
        var projectInfo = ownerInfo.projects.get(project);
        if (projectInfo === undefined) {
            throw new Error('Specified project ' + _JSON$stringify(project) + ' does not exist for ' + ('specified owner ' + _JSON$stringify(ownerInfo.owner)));
        }
        if (stack === undefined) {
            var stackNames = _Array$from(projectInfo.stacks.keys());
            if (stackNames.length !== 1) {
                throw new Error('Dataset contains multiple stacks: ' + _JSON$stringify(stackNames));
            }
            stack = stackNames[0];
        }
        var stackInfo = projectInfo.stacks.get(stack);
        if (stackInfo === undefined) {
            throw new Error('Specified stack ' + _JSON$stringify(stack) + ' is not one of the supported stacks: ' + _JSON$stringify(_Array$from(projectInfo.stacks.keys())));
        }
        this.stack = stack;
        this.stackInfo = stackInfo;
        if (channel !== undefined && channel.length > 0) {
            this.channel = channel;
        }
        this.minIntensity = verifyOptionalInt(parameters['minIntensity']);
        this.maxIntensity = verifyOptionalInt(parameters['maxIntensity']);
        this.maxTileSpecsToRender = verifyOptionalInt(parameters['maxTileSpecsToRender']);
        this.filter = verifyOptionalBoolean(parameters['filter']);
        this.minX = verifyOptionalInt(parameters['minX']);
        this.minY = verifyOptionalInt(parameters['minY']);
        this.minZ = verifyOptionalInt(parameters['minZ']);
        this.maxX = verifyOptionalInt(parameters['maxX']);
        this.maxY = verifyOptionalInt(parameters['maxY']);
        this.maxZ = verifyOptionalInt(parameters['maxZ']);
        if (this.minX !== undefined) {
            stackInfo.lowerVoxelBound[0] = this.minX;
        }
        if (this.minY !== undefined) {
            stackInfo.lowerVoxelBound[1] = this.minY;
        }
        if (this.minZ !== undefined) {
            stackInfo.lowerVoxelBound[2] = this.minZ;
        }
        if (this.maxX !== undefined) {
            stackInfo.upperVoxelBound[0] = this.maxX;
        }
        if (this.maxY !== undefined) {
            stackInfo.upperVoxelBound[1] = this.maxY;
        }
        if (this.maxZ !== undefined) {
            stackInfo.upperVoxelBound[2] = this.maxZ;
        }
        var encoding = verifyOptionalString(parameters['encoding']);
        if (encoding === undefined) {
            encoding = 'jpg';
        } else {
            if (!VALID_ENCODINGS.has(encoding)) {
                throw new Error('Invalid encoding: ' + _JSON$stringify(encoding) + '.');
            }
        }
        this.encoding = encoding;
        this.numLevels = verifyOptionalInt(parameters['numlevels']);
        this.dims = vec3.create();
        var tileSize = verifyOptionalInt(parameters['tilesize']);
        if (tileSize === undefined) {
            tileSize = 1024; // Default tile size is 1024 x 1024
        }
        this.dims[0] = tileSize;
        this.dims[1] = tileSize;
        this.dims[2] = 1;
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var sources = [];
            var numLevels = this.numLevels;
            if (numLevels === undefined) {
                numLevels = computeStackHierarchy(this.stackInfo, this.dims[0]);
            }
            var lowerClipBound = vec3.create(),
                upperClipBound = vec3.create();
            // Generate and set the clip bounds based on the highest resolution (lowest scale) data in
            // render. Otherwise, rounding errors can cause inconsistencies in clip bounds between scaling
            // levels.
            for (var i = 0; i < 3; i++) {
                lowerClipBound[i] = this.stackInfo.lowerVoxelBound[i] * this.stackInfo.voxelResolution[i];
                upperClipBound[i] = this.stackInfo.upperVoxelBound[i] * this.stackInfo.voxelResolution[i];
            }
            for (var level = 0; level < numLevels; level++) {
                var voxelSize = vec3.clone(this.stackInfo.voxelResolution);
                var chunkDataSize = vec3.fromValues(1, 1, 1);
                // tiles are NxMx1
                for (var _i = 0; _i < 2; ++_i) {
                    voxelSize[_i] = voxelSize[_i] * Math.pow(2, level);
                    chunkDataSize[_i] = this.dims[_i];
                }
                var lowerVoxelBound = vec3.create(),
                    upperVoxelBound = vec3.create();
                for (var _i2 = 0; _i2 < 3; _i2++) {
                    lowerVoxelBound[_i2] = Math.floor(this.stackInfo.lowerVoxelBound[_i2] * (this.stackInfo.voxelResolution[_i2] / voxelSize[_i2]));
                    upperVoxelBound[_i2] = Math.ceil(this.stackInfo.upperVoxelBound[_i2] * (this.stackInfo.voxelResolution[_i2] / voxelSize[_i2]));
                }
                var spec = VolumeChunkSpecification.make({
                    voxelSize: voxelSize,
                    chunkDataSize: chunkDataSize,
                    numChannels: this.numChannels,
                    dataType: this.dataType,
                    lowerClipBound: lowerClipBound,
                    upperClipBound: upperClipBound,
                    lowerVoxelBound: lowerVoxelBound,
                    upperVoxelBound: upperVoxelBound,
                    volumeSourceOptions: volumeSourceOptions
                });
                var source = this.chunkManager.getChunkSource(TileChunkSource, {
                    spec: spec,
                    parameters: {
                        'baseUrl': this.baseUrl,
                        'owner': this.ownerInfo.owner,
                        'project': this.stackInfo.project,
                        'stack': this.stack,
                        'channel': this.channel,
                        'minIntensity': this.minIntensity,
                        'maxIntensity': this.maxIntensity,
                        'maxTileSpecsToRender': this.maxTileSpecsToRender,
                        'filter': this.filter,
                        'dims': this.dims[0] + '_' + this.dims[1],
                        'level': level,
                        'encoding': this.encoding
                    }
                });
                sources.push([source]);
            }
            return sources;
        }
        /**
         * Meshes are not supported.
         */

    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            return null;
        }
    }, {
        key: 'dataType',
        get: function get() {
            if (this.parameters.encoding === 'raw16') {
                return DataType.UINT16;
            } else {
                // JPEG
                return DataType.UINT8;
            }
        }
    }, {
        key: 'numChannels',
        get: function get() {
            if (this.parameters.encoding === 'raw16') {
                return 1;
            } else {
                // JPEG
                return 3;
            }
        }
    }, {
        key: 'volumeType',
        get: function get() {
            return VolumeType.IMAGE;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
export function computeStackHierarchy(stackInfo, tileSize) {
    var maxBound = 0;
    for (var i = 0; i < 2; i++) {
        maxBound < stackInfo.upperVoxelBound[i] ? maxBound = stackInfo.upperVoxelBound[i] : maxBound = maxBound;
    }
    if (tileSize >= maxBound) {
        return 1;
    }
    var counter = 0;
    while (maxBound > tileSize) {
        maxBound = maxBound / 2;
        counter++;
    }
    return counter;
}
export function getOwnerInfo(chunkManager, hostname, owner) {
    return chunkManager.memoize.getUncounted({ 'type': 'render:getOwnerInfo', hostname: hostname, owner: owner }, function () {
        return fetchOk(hostname + '/render-ws/v1/owner/' + owner + '/stacks').then(function (response) {
            return response.json();
        }).then(parseOwnerInfo);
    });
}
var pathPattern = /^([^\/?]+)(?:\/([^\/?]+))?(?:\/([^\/?]+))(?:\/([^\/?]*))?(?:\?(.*))?$/;
var urlPattern = /^((?:(?:(?:http|https):\/\/[^,\/]+)[^\/?]))\/(.*)$/;
function _getVolume(chunkManager, datasourcePath) {
    var hostname = void 0,
        path = void 0;
    {
        var _match = datasourcePath.match(urlPattern);
        if (_match === null) {
            throw new Error('Invalid render volume path: ' + _JSON$stringify(datasourcePath));
        }
        hostname = _match[1];
        path = _match[2];
    }
    var match = path.match(pathPattern);
    if (match === null) {
        throw new Error('Invalid volume path ' + _JSON$stringify(path));
    }
    var owner = match[1];
    var project = match[2];
    var stack = match[3];
    var channel = match[4];
    var parameters = parseQueryStringParameters(match[5] || '');
    return chunkManager.memoize.getUncounted({ type: 'render:MultiscaleVolumeChunkSource', hostname: hostname, path: path }, function () {
        return getOwnerInfo(chunkManager, hostname, owner).then(function (ownerInfo) {
            return new MultiscaleVolumeChunkSource(chunkManager, hostname, ownerInfo, stack, project, channel, parameters);
        });
    });
}
export function stackAndProjectCompleter(chunkManager, hostname, path) {
    var stackMatch = path.match(/^(?:([^\/]+)(?:\/([^\/]*))?(?:\/([^\/]*))?(\/.*?)?)?$/);
    if (stackMatch === null) {
        // URL has incorrect format, don't return any results.
        return _Promise.reject(null);
    }
    if (stackMatch[2] === undefined) {
        // Don't autocomplete the owner
        return _Promise.reject(null);
    }
    if (stackMatch[3] === undefined) {
        var projectPrefix = stackMatch[2] || '';
        return getOwnerInfo(chunkManager, hostname, stackMatch[1]).then(function (ownerInfo) {
            var completions = getPrefixMatchesWithDescriptions(projectPrefix, ownerInfo.projects, function (x) {
                return x[0] + '/';
            }, function () {
                return undefined;
            });
            return { offset: stackMatch[1].length + 1, completions: completions };
        });
    }
    if (stackMatch[4] === undefined) {
        var stackPrefix = stackMatch[3] || '';
        return getOwnerInfo(chunkManager, hostname, stackMatch[1]).then(function (ownerInfo) {
            var projectInfo = ownerInfo.projects.get(stackMatch[2]);
            if (projectInfo === undefined) {
                return _Promise.reject(null);
            }
            var completions = getPrefixMatchesWithDescriptions(stackPrefix, projectInfo.stacks, function (x) {
                return x[0] + '/';
            }, function (x) {
                return '(' + x[1].project + ')';
            });
            return { offset: stackMatch[1].length + stackMatch[2].length + 2, completions: completions };
        });
    }
    var channelPrefix = stackMatch[4].substr(1) || '';
    return getOwnerInfo(chunkManager, hostname, stackMatch[1]).then(function (ownerInfo) {
        var projectInfo = ownerInfo.projects.get(stackMatch[2]);
        if (projectInfo === undefined) {
            return _Promise.reject(null);
        }
        var stackInfo = projectInfo.stacks.get(stackMatch[3]);
        if (stackInfo === undefined) {
            return _Promise.reject(null);
        }
        var channels = stackInfo.channels;
        if (channels.length === 0) {
            return _Promise.reject(null);
        } else {
            // Try and complete the channel
            var completions = getPrefixMatchesWithDescriptions(channelPrefix, channels, function (x) {
                return x;
            }, function () {
                return undefined;
            });
            return {
                offset: stackMatch[1].length + stackMatch[2].length + stackMatch[3].length + 3,
                completions: completions
            };
        }
    });
}
function _volumeCompleter(url, chunkManager) {
    var match = url.match(urlPattern);
    if (match === null) {
        // We don't yet have a full hostname.
        return _Promise.reject(null);
    }
    var hostname = match[1];
    var path = match[2];
    return stackAndProjectCompleter(chunkManager, hostname, path).then(function (completions) {
        return applyCompletionOffset(match[1].length + 1, completions);
    });
}
export var MultiscaleVectorGraphicsChunkSource = function () {
    function MultiscaleVectorGraphicsChunkSource(chunkManager, baseUrl, ownerInfo, stack, project, parameters) {
        _classCallCheck(this, MultiscaleVectorGraphicsChunkSource);

        this.chunkManager = chunkManager;
        this.baseUrl = baseUrl;
        this.ownerInfo = ownerInfo;
        this.project = project;
        this.parameters = parameters;
        var projectInfo = ownerInfo.projects.get(project);
        if (projectInfo === undefined) {
            throw new Error('Specified project ' + _JSON$stringify(project) + ' does not exist for ' + ('specified owner ' + _JSON$stringify(ownerInfo.owner)));
        }
        if (stack === undefined) {
            var stackNames = _Array$from(projectInfo.stacks.keys());
            if (stackNames.length !== 1) {
                throw new Error('Dataset contains multiple stacks: ' + _JSON$stringify(stackNames));
            }
            stack = stackNames[0];
        }
        var stackInfo = projectInfo.stacks.get(stack);
        if (stackInfo === undefined) {
            throw new Error('Specified stack ' + _JSON$stringify(stack) + ' is not one of the supported stacks: ' + _JSON$stringify(_Array$from(projectInfo.stacks.keys())));
        }
        this.stack = stack;
        this.stackInfo = stackInfo;
        var matchCollection = verifyOptionalString(parameters['matchCollection']);
        if (matchCollection === undefined) {
            matchCollection = stack;
        }
        this.matchCollection = matchCollection;
        var zoffset = verifyOptionalInt(parameters['zoffset']);
        if (zoffset === undefined) {
            zoffset = 1;
        }
        this.zoffset = zoffset;
        this.dims = vec3.create();
        var tileSize = verifyOptionalInt(parameters['tilesize']);
        if (tileSize === undefined) {
            tileSize = 1024; // Default tile size is 1024 x 1024
        }
        this.dims[0] = tileSize;
        this.dims[1] = tileSize;
        this.dims[2] = 1;
    }

    _createClass(MultiscaleVectorGraphicsChunkSource, [{
        key: 'getSources',
        value: function getSources(vectorGraphicsSourceOptions) {
            var voxelSize = this.stackInfo.voxelResolution;
            var chunkSize = vec3.subtract(vec3.create(), this.stackInfo.upperVoxelBound, this.stackInfo.lowerVoxelBound);
            vec3.multiply(chunkSize, chunkSize, voxelSize);
            chunkSize[2] = voxelSize[2];
            var spec = VectorGraphicsChunkSpecification.make({
                voxelSize: voxelSize,
                chunkSize: chunkSize,
                lowerChunkBound: vec3.fromValues(0, 0, this.stackInfo.lowerVoxelBound[2]),
                upperChunkBound: vec3.fromValues(1, 1, this.stackInfo.upperVoxelBound[2]),
                vectorGraphicsSourceOptions: vectorGraphicsSourceOptions
            });
            var source = this.chunkManager.getChunkSource(PointMatchSource, {
                spec: spec,
                parameters: {
                    'baseUrl': this.baseUrl,
                    'owner': this.ownerInfo.owner,
                    'project': this.stackInfo.project,
                    'stack': this.stack,
                    'encoding': 'points',
                    'matchCollection': this.matchCollection,
                    'zoffset': this.zoffset
                }
            });
            return [[source]];
        }
    }]);

    return MultiscaleVectorGraphicsChunkSource;
}();
export function getPointMatches(chunkManager, datasourcePath) {
    var hostname = void 0,
        path = void 0;
    {
        var _match2 = datasourcePath.match(urlPattern);
        if (_match2 === null) {
            throw new Error('Invalid render point path: ' + _JSON$stringify(datasourcePath));
        }
        hostname = _match2[1];
        path = _match2[2];
    }
    var match = path.match(pathPattern);
    if (match === null) {
        throw new Error('Invalid point path ' + _JSON$stringify(path));
    }
    var owner = match[1];
    var project = match[2];
    var stack = match[3];
    var parameters = parseQueryStringParameters(match[4] || '');
    return chunkManager.memoize.getUncounted({ type: 'render:MultiscaleVectorGraphicsChunkSource', hostname: hostname, path: path }, function () {
        return getOwnerInfo(chunkManager, hostname, owner).then(function (ownerInfo) {
            return new MultiscaleVectorGraphicsChunkSource(chunkManager, hostname, ownerInfo, stack, project, parameters);
        });
    });
}
export var RenderDataSource = function (_DataSource) {
    _inherits(RenderDataSource, _DataSource);

    function RenderDataSource() {
        _classCallCheck(this, RenderDataSource);

        return _possibleConstructorReturn(this, (RenderDataSource.__proto__ || _Object$getPrototypeOf(RenderDataSource)).apply(this, arguments));
    }

    _createClass(RenderDataSource, [{
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
        key: 'getVectorGraphicsSource',
        value: function getVectorGraphicsSource(chunkManager, url) {
            return getPointMatches(chunkManager, url);
        }
    }, {
        key: 'description',
        get: function get() {
            return 'Render';
        }
    }]);

    return RenderDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map