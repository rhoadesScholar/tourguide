import _Promise from 'babel-runtime/core-js/promise';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2019 Google Inc.
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
import { VolumeChunkEncoding, VolumeChunkSourceParameters } from './base';
import { DataType, VolumeChunkSpecification, VolumeType } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { mat4, vec3 } from '../../util/geom';
import { fetchOk, HttpError, parseSpecialUrl } from '../../util/http_request';
import { parseArray, parseFixedLengthArray, verifyEnumString, verifyFinitePositiveFloat, verifyObject, verifyObjectProperty, verifyPositiveInt } from '../../util/json';

var N5VolumeChunkSource = function (_WithParameters) {
    _inherits(N5VolumeChunkSource, _WithParameters);

    function N5VolumeChunkSource() {
        _classCallCheck(this, N5VolumeChunkSource);

        return _possibleConstructorReturn(this, (N5VolumeChunkSource.__proto__ || _Object$getPrototypeOf(N5VolumeChunkSource)).apply(this, arguments));
    }

    return N5VolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeChunkSourceParameters));

export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, url, topLevelMetadata, scales) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.url = url;
        this.topLevelMetadata = topLevelMetadata;
        this.scales = scales;
        var dataType = void 0;
        var baseScaleIndex = void 0;
        scales.forEach(function (scale, i) {
            if (scale === undefined) return;
            if (baseScaleIndex === undefined) {
                baseScaleIndex = i;
            }
            if (dataType !== undefined && scale.dataType !== dataType) {
                throw new Error('Scale s' + i + ' has data type ' + DataType[scale.dataType] + ' but expected ' + DataType[dataType] + '.');
            }
            dataType = scale.dataType;
        });
        if (dataType === undefined) {
            throw new Error('At least one scale must be specified.');
        }
        this.dataType = dataType;
        this.volumeType = VolumeType.IMAGE;
        this.baseScaleIndex = baseScaleIndex;
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getMeshSource',
        value: function getMeshSource() {
            return null;
        }
    }, {
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var _this2 = this;

            var topLevelMetadata = this.topLevelMetadata;

            var sources = [];
            this.scales.forEach(function (scale, i) {
                if (scale === undefined) return;
                sources.push(VolumeChunkSpecification.getDefaults({
                    voxelSize: vec3.multiply(vec3.create(), topLevelMetadata.pixelResolution, topLevelMetadata.scales[i]),
                    dataType: scale.dataType,
                    numChannels: 1,
                    upperVoxelBound: scale.size,
                    volumeType: _this2.volumeType,
                    chunkDataSizes: [scale.chunkSize],
                    volumeSourceOptions: volumeSourceOptions
                }).map(function (spec) {
                    return _this2.chunkManager.getChunkSource(N5VolumeChunkSource, {
                        spec: spec,
                        parameters: { 'url': _this2.url + '/s' + i, 'encoding': scale.encoding }
                    });
                }));
            });
            return sources;
        }
    }, {
        key: 'getStaticAnnotations',
        value: function getStaticAnnotations() {
            var topLevelMetadata = this.topLevelMetadata,
                baseScaleIndex = this.baseScaleIndex;

            var annotationSet = new AnnotationSource(mat4.fromScaling(mat4.create(), vec3.multiply(vec3.create(), topLevelMetadata.pixelResolution, topLevelMetadata.scales[baseScaleIndex])));
            annotationSet.readonly = true;
            annotationSet.add(makeDataBoundsBoundingBox(vec3.create(), this.scales[baseScaleIndex].size));
            return annotationSet;
        }
    }, {
        key: 'numChannels',
        get: function get() {
            return 1;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
var pixelResolutionUnits = new _Map([['mm', 1e6], ['m', 1e9], ['um', 1000], ['nm', 1]]);

var TopLevelMetadata = function TopLevelMetadata(obj) {
    var _this3 = this;

    _classCallCheck(this, TopLevelMetadata);

    verifyObject(obj);
    verifyObjectProperty(obj, 'pixelResolution', function (resObj) {
        verifyObject(resObj);
        var unitScale = verifyObjectProperty(resObj, 'unit', function (x) {
            var s = pixelResolutionUnits.get(x);
            if (s === undefined) {
                throw new Error('Unsupported unit: ' + _JSON$stringify(x) + '.');
            }
            return s;
        });
        var dimensions = verifyObjectProperty(resObj, 'dimensions', function (x) {
            return parseFixedLengthArray(vec3.create(), x, verifyFinitePositiveFloat);
        });
        _this3.pixelResolution = vec3.scale(dimensions, dimensions, unitScale);
    });
    this.scales = verifyObjectProperty(obj, 'scales', function (scalesObj) {
        return parseArray(scalesObj, function (scaleObj) {
            return parseFixedLengthArray(vec3.create(), scaleObj, verifyFinitePositiveFloat);
        });
    });
};

var ScaleMetadata = function ScaleMetadata(obj) {
    _classCallCheck(this, ScaleMetadata);

    verifyObject(obj);
    this.dataType = verifyObjectProperty(obj, 'dataType', function (x) {
        return verifyEnumString(x, DataType);
    });
    this.size = verifyObjectProperty(obj, 'dimensions', function (x) {
        return parseFixedLengthArray(vec3.create(), x, verifyPositiveInt);
    });
    this.chunkSize = verifyObjectProperty(obj, 'blockSize', function (x) {
        return parseFixedLengthArray(vec3.create(), x, verifyPositiveInt);
    });
    var encoding = void 0;
    verifyObjectProperty(obj, 'compression', function (compression) {
        encoding = verifyObjectProperty(compression, 'type', function (x) {
            return verifyEnumString(x, VolumeChunkEncoding);
        });
    });
    if (encoding === undefined) {
        encoding = verifyObjectProperty(obj, 'compressionType', function (x) {
            return verifyEnumString(x, VolumeChunkEncoding);
        });
    }
    this.encoding = encoding;
};

function getTopLevelMetadata(chunkManager, url) {
    return chunkManager.memoize.getUncounted({ 'type': 'n5:topLevelMetadata', url: url }, function () {
        return fetchOk(url).then(function (response) {
            return response.json();
        }).then(function (response) {
            return new TopLevelMetadata(response);
        });
    });
}
function getScaleMetadata(chunkManager, url) {
    return chunkManager.memoize.getUncounted({ 'type': 'n5:scaleMetadata', url: url }, function () {
        return fetchOk(url).then(function (response) {
            return response.json();
        }).then(function (response) {
            return new ScaleMetadata(response);
        });
    });
}
function getAllScales(chunkManager, url, topLevelMetadata) {
    return _Promise.all(topLevelMetadata.scales.map(function (_scale, i) {
        return getScaleMetadata(chunkManager, url + '/s' + i + '/attributes.json').catch(function (e) {
            if (e instanceof HttpError && e.status === 404) {
                return undefined;
            }
            throw e;
        });
    }));
}
export var N5DataSource = function (_DataSource) {
    _inherits(N5DataSource, _DataSource);

    function N5DataSource() {
        _classCallCheck(this, N5DataSource);

        return _possibleConstructorReturn(this, (N5DataSource.__proto__ || _Object$getPrototypeOf(N5DataSource)).apply(this, arguments));
    }

    _createClass(N5DataSource, [{
        key: 'getVolume',
        value: function getVolume(chunkManager, url) {
            url = parseSpecialUrl(url);
            var m = url.match(/^(.*)\/(c[0-9]+)$/);
            var topLevelMetadataUrl = void 0;
            if (m !== null) {
                topLevelMetadataUrl = m[1] + '/attributes.json';
            } else {
                topLevelMetadataUrl = url + '/attributes.json';
            }
            return chunkManager.memoize.getUncounted({ 'type': 'n5:MultiscaleVolumeChunkSource', url: url }, function () {
                return getTopLevelMetadata(chunkManager, topLevelMetadataUrl).then(function (topLevelMetadata) {
                    return getAllScales(chunkManager, url, topLevelMetadata).then(function (scales) {
                        return new MultiscaleVolumeChunkSource(chunkManager, url, topLevelMetadata, scales);
                    });
                });
            });
        }
    }, {
        key: 'description',
        get: function get() {
            return 'N5 data source';
        }
    }]);

    return N5DataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map