import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
export { _getVolume as getVolume };
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
 * @file Support for displaying single NIfTI (https://www.nitrc.org/projects/nifti) files as
 * volumes.
 */
import { WithParameters } from '../../chunk_manager/frontend';
import { DataSource } from './..';
import { GET_NIFTI_VOLUME_INFO_RPC_ID, VolumeSourceParameters } from './base';
import { VolumeChunkSpecification } from '../../sliceview/volume/base';
import { VolumeChunkSource } from '../../sliceview/volume/frontend';
import { uncancelableToken } from '../../util/cancellation';
import { kOneVec, mat4, translationRotationScaleZReflectionToMat4 } from '../../util/geom';

var NiftiVolumeChunkSource = function (_WithParameters) {
    _inherits(NiftiVolumeChunkSource, _WithParameters);

    function NiftiVolumeChunkSource() {
        _classCallCheck(this, NiftiVolumeChunkSource);

        return _possibleConstructorReturn(this, (NiftiVolumeChunkSource.__proto__ || _Object$getPrototypeOf(NiftiVolumeChunkSource)).apply(this, arguments));
    }

    return NiftiVolumeChunkSource;
}(WithParameters(VolumeChunkSource, VolumeSourceParameters));

export var MultiscaleVolumeChunkSource = function () {
    function MultiscaleVolumeChunkSource(chunkManager, url, info) {
        _classCallCheck(this, MultiscaleVolumeChunkSource);

        this.chunkManager = chunkManager;
        this.url = url;
        this.info = info;
    }

    _createClass(MultiscaleVolumeChunkSource, [{
        key: 'getSources',
        value: function getSources(volumeSourceOptions) {
            var info = this.info;

            var spec = VolumeChunkSpecification.withDefaultCompression({
                volumeType: info.volumeType,
                chunkDataSize: info.volumeSize,
                dataType: info.dataType,
                voxelSize: info.voxelSize,
                numChannels: info.numChannels,
                upperVoxelBound: info.volumeSize,
                transform: translationRotationScaleZReflectionToMat4(mat4.create(), info.qoffset, info.quatern, kOneVec, info.qfac),
                volumeSourceOptions: volumeSourceOptions
            });
            return [[this.chunkManager.getChunkSource(NiftiVolumeChunkSource, { spec: spec, parameters: { url: this.url } })]];
        }
    }, {
        key: 'getMeshSource',
        value: function getMeshSource() {
            return null;
        }
    }, {
        key: 'numChannels',
        get: function get() {
            return this.info.numChannels;
        }
    }, {
        key: 'dataType',
        get: function get() {
            return this.info.dataType;
        }
    }, {
        key: 'volumeType',
        get: function get() {
            return this.info.volumeType;
        }
    }]);

    return MultiscaleVolumeChunkSource;
}();
function getNiftiVolumeInfo(chunkManager, url, cancellationToken) {
    return chunkManager.rpc.promiseInvoke(GET_NIFTI_VOLUME_INFO_RPC_ID, { 'chunkManager': chunkManager.addCounterpartRef(), 'url': url }, cancellationToken);
}
function _getVolume(chunkManager, url) {
    return chunkManager.memoize.getUncounted({ type: 'nifti/getVolume', url: url }, function () {
        return getNiftiVolumeInfo(chunkManager, url, uncancelableToken).then(function (info) {
            return new MultiscaleVolumeChunkSource(chunkManager, url, info);
        });
    });
}
export var NiftiDataSource = function (_DataSource) {
    _inherits(NiftiDataSource, _DataSource);

    function NiftiDataSource() {
        _classCallCheck(this, NiftiDataSource);

        return _possibleConstructorReturn(this, (NiftiDataSource.__proto__ || _Object$getPrototypeOf(NiftiDataSource)).apply(this, arguments));
    }

    _createClass(NiftiDataSource, [{
        key: 'getVolume',
        value: function getVolume(chunkManager, url) {
            return _getVolume(chunkManager, url);
        }
    }, {
        key: 'description',
        get: function get() {
            return 'Single NIfTI file';
        }
    }]);

    return NiftiDataSource;
}(DataSource);
//# sourceMappingURL=frontend.js.map