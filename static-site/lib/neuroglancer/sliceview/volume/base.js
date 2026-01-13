import _Object$assign from 'babel-runtime/core-js/object/assign';
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
import { getChunkDataSizes, getCombinedTransform, getNearIsotropicBlockSize, SliceViewChunkSpecification } from '../base';
import { DATA_TYPE_BYTES, DataType } from '../../util/data_type';
import { kInfinityVec, kZeroVec, prod3, vec3 } from '../../util/geom';
export { DATA_TYPE_BYTES, DataType };
/**
 * Specifies the interpretation of volumetric data.
 */
export var VolumeType;
(function (VolumeType) {
    VolumeType[VolumeType["UNKNOWN"] = 0] = "UNKNOWN";
    VolumeType[VolumeType["IMAGE"] = 1] = "IMAGE";
    VolumeType[VolumeType["SEGMENTATION"] = 2] = "SEGMENTATION";
})(VolumeType || (VolumeType = {}));
/**
 * By default, choose a chunk size with at most 2^18 = 262144 voxels.
 */
export var DEFAULT_MAX_VOXELS_PER_CHUNK_LOG2 = 18;
/**
 * Specifies a chunk layout and voxel size.
 */
export var VolumeChunkSpecification = function (_SliceViewChunkSpecif) {
    _inherits(VolumeChunkSpecification, _SliceViewChunkSpecif);

    function VolumeChunkSpecification(options) {
        _classCallCheck(this, VolumeChunkSpecification);

        var _options$lowerVoxelBo = options.lowerVoxelBound,
            lowerVoxelBound = _options$lowerVoxelBo === undefined ? kZeroVec : _options$lowerVoxelBo,
            upperVoxelBound = options.upperVoxelBound,
            chunkDataSize = options.chunkDataSize,
            voxelSize = options.voxelSize,
            transform = options.transform,
            _options$baseVoxelOff = options.baseVoxelOffset,
            baseVoxelOffset = _options$baseVoxelOff === undefined ? kZeroVec : _options$baseVoxelOff;
        var _options$lowerClipBou = options.lowerClipBound,
            lowerClipBound = _options$lowerClipBou === undefined ? vec3.multiply(vec3.create(), voxelSize, lowerVoxelBound) : _options$lowerClipBou,
            _options$upperClipBou = options.upperClipBound,
            upperClipBound = _options$upperClipBou === undefined ? vec3.multiply(vec3.create(), voxelSize, upperVoxelBound) : _options$upperClipBou;

        var chunkSize = vec3.multiply(vec3.create(), chunkDataSize, voxelSize);
        var lowerChunkBound = vec3.create();
        var upperChunkBound = vec3.create();
        for (var i = 0; i < 3; ++i) {
            lowerChunkBound[i] = Math.floor(lowerVoxelBound[i] / chunkDataSize[i]);
            upperChunkBound[i] = Math.floor((upperVoxelBound[i] - 1) / chunkDataSize[i] + 1);
        }

        var _this = _possibleConstructorReturn(this, (VolumeChunkSpecification.__proto__ || _Object$getPrototypeOf(VolumeChunkSpecification)).call(this, { voxelSize: voxelSize, transform: transform, lowerChunkBound: lowerChunkBound, upperChunkBound: upperChunkBound, chunkSize: chunkSize }));

        _this.baseVoxelOffset = baseVoxelOffset;
        _this.lowerClipBound = lowerClipBound;
        _this.upperClipBound = upperClipBound;
        _this.lowerVoxelBound = lowerVoxelBound;
        _this.upperVoxelBound = upperVoxelBound;
        _this.chunkDataSize = chunkDataSize;
        var dataType = _this.dataType = options.dataType;
        var numChannels = _this.numChannels = options.numChannels;
        _this.chunkBytes = prod3(chunkDataSize) * DATA_TYPE_BYTES[dataType] * numChannels;
        _this.compressedSegmentationBlockSize = options.compressedSegmentationBlockSize;
        return _this;
    }

    _createClass(VolumeChunkSpecification, [{
        key: 'toObject',
        value: function toObject() {
            return _Object$assign({}, _get(VolumeChunkSpecification.prototype.__proto__ || _Object$getPrototypeOf(VolumeChunkSpecification.prototype), 'toObject', this).call(this), { numChannels: this.numChannels, chunkDataSize: this.chunkDataSize, dataType: this.dataType, lowerVoxelBound: this.lowerVoxelBound, upperVoxelBound: this.upperVoxelBound, lowerClipBound: this.lowerClipBound, upperClipBound: this.upperClipBound, baseVoxelOffset: this.baseVoxelOffset, compressedSegmentationBlockSize: this.compressedSegmentationBlockSize });
        }
        /**
         * Returns a VolumeChunkSpecification with default compression specified if suitable for the
         * volumeType.
         */

    }], [{
        key: 'make',
        value: function make(options) {
            return new VolumeChunkSpecification(_Object$assign({}, options, { transform: getCombinedTransform(options.transform, options.volumeSourceOptions) }));
        }
    }, {
        key: 'fromObject',
        value: function fromObject(msg) {
            return new VolumeChunkSpecification(msg);
        }
    }, {
        key: 'withDefaultCompression',
        value: function withDefaultCompression(options) {
            var compressedSegmentationBlockSize = options.compressedSegmentationBlockSize,
                dataType = options.dataType,
                voxelSize = options.voxelSize,
                transform = options.transform,
                lowerVoxelBound = options.lowerVoxelBound,
                upperVoxelBound = options.upperVoxelBound;

            transform = getCombinedTransform(transform, options.volumeSourceOptions);
            if (compressedSegmentationBlockSize === undefined && options.volumeType === VolumeType.SEGMENTATION && (dataType === DataType.UINT32 || dataType === DataType.UINT64)) {
                compressedSegmentationBlockSize = getNearIsotropicBlockSize({
                    voxelSize: voxelSize,
                    transform: transform,
                    lowerVoxelBound: lowerVoxelBound,
                    upperVoxelBound: upperVoxelBound,
                    maxVoxelsPerChunkLog2: 9,
                    maxBlockSize: vec3.min(vec3.create(), options.chunkDataSize, options.maxCompressedSegmentationBlockSize || kInfinityVec)
                });
            }
            return new VolumeChunkSpecification(_Object$assign({}, options, { compressedSegmentationBlockSize: compressedSegmentationBlockSize, transform: transform }));
        }
    }, {
        key: 'getDefaults',
        value: function getDefaults(options) {
            var adjustedOptions = _Object$assign({}, options, { transform: getCombinedTransform(options.transform, options.volumeSourceOptions) });
            var _options$chunkDataSiz = options.chunkDataSizes,
                chunkDataSizes = _options$chunkDataSiz === undefined ? getChunkDataSizes(adjustedOptions) : _options$chunkDataSiz;

            return chunkDataSizes.map(function (chunkDataSize) {
                return VolumeChunkSpecification.withDefaultCompression(_Object$assign({}, options, { chunkDataSize: chunkDataSize }));
            });
        }
    }]);

    return VolumeChunkSpecification;
}(SliceViewChunkSpecification);
export var VOLUME_RPC_ID = 'volume';
//# sourceMappingURL=base.js.map