import _Map from 'babel-runtime/core-js/map';
import _Promise from 'babel-runtime/core-js/promise';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
 * @license
 * Copyright 2018 Google Inc.
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
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { ComputedVolumeChunkSourceParameters } from './base';
import { VolumeChunkSpecification } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { mat4, vec3 } from '../../util/geom';
import { verifyObject, verifyString } from '../../util/json';
import { SharedObject } from '../../worker_rpc';

var ComputedVolumeChunkSource = function (_WithParameters) {
    _inherits(ComputedVolumeChunkSource, _WithParameters);

    function ComputedVolumeChunkSource() {
        _classCallCheck(this, ComputedVolumeChunkSource);

        return _possibleConstructorReturn(this, (ComputedVolumeChunkSource.__proto__ || _Object$getPrototypeOf(ComputedVolumeChunkSource)).apply(this, arguments));
    }

    return ComputedVolumeChunkSource;
}(WithParameters(VolumeChunkSource, ComputedVolumeChunkSourceParameters));

export var VolumeComputationFrontend = function (_SharedObject) {
    _inherits(VolumeComputationFrontend, _SharedObject);

    function VolumeComputationFrontend(params) {
        _classCallCheck(this, VolumeComputationFrontend);

        var _this2 = _possibleConstructorReturn(this, (VolumeComputationFrontend.__proto__ || _Object$getPrototypeOf(VolumeComputationFrontend)).call(this));

        _this2.params = params;
        return _this2;
    }

    return VolumeComputationFrontend;
}(SharedObject);
export var ComputedMultiscaleVolumeChunkSource = function () {
    function ComputedMultiscaleVolumeChunkSource(params, sources, computation, chunkManager) {
        _classCallCheck(this, ComputedMultiscaleVolumeChunkSource);

        this.params = params;
        this.sources = sources;
        this.computation = computation;
        this.chunkManager = chunkManager;
        this.numChannels = params.computationParameters.outputSpec.numChannels;
        this.dataType = params.computationParameters.outputSpec.dataType;
        this.volumeType = params.computationParameters.outputSpec.volumeType;
    }

    _createClass(ComputedMultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var spec = VolumeChunkSpecification.getDefaults({
                voxelSize: this.params.outputVoxelSize,
                dataType: this.dataType,
                numChannels: this.numChannels,
                chunkDataSizes: [this.params.computationParameters.outputSpec.size],
                transform: mat4.fromTranslation(mat4.create(), vec3.multiply(vec3.create(), this.params.outputVoxelSize, this.params.outputVoxelOffset)),
                upperVoxelBound: this.params.outputVolumeSize,
                volumeType: this.volumeType,
                baseVoxelOffset: this.params.outputVoxelOffset,
                volumeSourceOptions: volumeSourceOptions
            })[0];
            var originSource = this.sources[this.params.inputScaleIndex][this.params.inputSourceIndex];
            var inputResolution = originSource.spec.voxelSize;
            var parameters = {
                computationRef: this.computation.addCounterpartRef(),
                sourceRef: originSource.addCounterpartRef(),
                inputSize: this.params.computationParameters.inputSpec.size,
                scaleFactor: vec3.divide(vec3.create(), this.params.outputVoxelSize, inputResolution)
            };
            var computedSource = this.chunkManager.getChunkSource(ComputedVolumeChunkSource, { spec: spec, parameters: parameters });
            return [[computedSource]];
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            return null;
        }
    }]);

    return ComputedMultiscaleVolumeChunkSource;
}();
export var ComputedDataSource = function (_DataSource) {
    _inherits(ComputedDataSource, _DataSource);

    function ComputedDataSource() {
        _classCallCheck(this, ComputedDataSource);

        return _possibleConstructorReturn(this, (ComputedDataSource.__proto__ || _Object$getPrototypeOf(ComputedDataSource)).apply(this, arguments));
    }

    _createClass(ComputedDataSource, [{
        key: 'getOriginVolumes',
        value: function getOriginVolumes(dataSourceProvider, originUrl, chunkManager, cancellationToken) {
            return dataSourceProvider.getVolume(chunkManager, originUrl, {}, cancellationToken).then(function (multiScaleVolumeChunkSource) {
                var sources = multiScaleVolumeChunkSource.getSources({});
                var specs = sources.map(function (volumeChunkSources) {
                    return volumeChunkSources.map(function (volumeChunkSource) {
                        return volumeChunkSource.spec;
                    });
                });
                return {
                    specs: specs,
                    sources: sources,
                    volumeType: multiScaleVolumeChunkSource.volumeType,
                    dataType: multiScaleVolumeChunkSource.dataType,
                    numChannels: multiScaleVolumeChunkSource.numChannels
                };
            });
        }
        /**
         * Creates a ComputedVolumeDataSourceParameters object with default values
         * populated from the first volume spec at native resolution.
         * @param volumeSpecs ComputedVolumeSpecs
         * @param originUrl url for the origin data source
         * @param dataSourceProvider
         * @returns ComputedVolumeDataSourceParameters
         */

    }, {
        key: 'defaultParams',
        value: function defaultParams(volumeSpecs, originUrl, dataSourceProvider) {
            var spec = volumeSpecs.sources[0][0].spec;
            // Default DataType, VolumeType, channel count
            var dataType = volumeSpecs.dataType,
                volumeType = volumeSpecs.volumeType,
                numChannels = volumeSpecs.numChannels;
            // Default chunk size, used for input and output computation buffer sizes.

            var size = spec.chunkDataSize;
            return {
                originUrl: originUrl,
                computationParameters: {
                    inputSpec: { size: vec3.copy(vec3.create(), size), dataType: dataType, volumeType: volumeType, numChannels: numChannels },
                    outputSpec: { size: vec3.copy(vec3.create(), size), dataType: dataType, volumeType: volumeType, numChannels: numChannels }
                },
                inputScaleIndex: 0,
                inputSourceIndex: 0,
                outputVoxelSize: vec3.copy(vec3.create(), spec.voxelSize),
                outputVolumeSize: vec3.copy(vec3.create(), spec.upperVoxelBound),
                outputVoxelOffset: vec3.copy(vec3.create(), spec.baseVoxelOffset),
                dataSourceProvider: dataSourceProvider
            };
        }
    }, {
        key: 'getVolume',
        value: function getVolume(chunkManager, config, options, cancellationToken) {
            var _this4 = this;

            // Config is expected to be a json string, for example:
            //   {"origin":"brainmaps://p:d:v","computation":"example","inputSize":
            //     [36,36,32],"outputSize":[32,32,32]}
            console.log('Computed datasource config:', config);
            if (!options.dataSourceProvider) {
                return _Promise.reject(new Error('Need a DataSourceProvider'));
            }
            var dataSourceProvider = options.dataSourceProvider;
            var configObj = void 0;
            try {
                configObj = verifyObject(JSON.parse(config));
            } catch (error) {
                return _Promise.reject(new Error('Could not parse JSON configuration while initializing computational datasource: ' + error));
            }
            if (!configObj) {
                return _Promise.reject(new Error('Could not verify configuration JSON'));
            }
            if (configObj['origin'] === undefined) {
                return _Promise.reject(new Error('Config is missing origin'));
            }
            if (configObj['computation'] === undefined) {
                return _Promise.reject(new Error('Config is missing computation'));
            }
            var computationName = verifyString(configObj['computation']);
            var computationProvider = ComputedDataSource.computationMap.get(computationName);
            var originUrl = verifyString(configObj['origin']);
            if (!computationProvider) {
                return _Promise.reject(new Error('Unable to find computation ' + computationName));
            }
            return this.getOriginVolumes(dataSourceProvider, originUrl, chunkManager, cancellationToken).then(function (volumes) {
                var dataSourceParams = _this4.defaultParams(volumes, originUrl, dataSourceProvider);
                return chunkManager.memoize.getUncounted({ type: 'computed:getVolume', config: configObj }, function () {
                    return computationProvider.getComputation(configObj, volumes.sources, dataSourceParams).then(function (computation) {
                        computation.initializeCounterpart(chunkManager.rpc, computation.params);
                        return new ComputedMultiscaleVolumeChunkSource(dataSourceParams, volumes.sources, computation, chunkManager);
                    });
                });
            });
        }
    }, {
        key: 'description',
        get: function get() {
            return 'Computed data source.';
        }
    }], [{
        key: 'registerComputation',
        value: function registerComputation(key, computationProvider) {
            this.computationMap.set(key, computationProvider);
        }
    }]);

    return ComputedDataSource;
}(DataSource);
ComputedDataSource.computationMap = new _Map();
//# sourceMappingURL=frontend.js.map