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
import { SliceViewChunk, SliceViewChunkSource } from '../backend';
import { VolumeChunkSpecification } from './base';
import { vec3 } from '../../util/geom';
var tempChunkDataSize = vec3.create();
var tempChunkPosition = vec3.create();
export var VolumeChunk = function (_SliceViewChunk) {
    _inherits(VolumeChunk, _SliceViewChunk);

    function VolumeChunk() {
        _classCallCheck(this, VolumeChunk);

        var _this = _possibleConstructorReturn(this, (VolumeChunk.__proto__ || _Object$getPrototypeOf(VolumeChunk)).call(this));

        _this.source = null;
        return _this;
    }

    _createClass(VolumeChunk, [{
        key: 'initializeVolumeChunk',
        value: function initializeVolumeChunk(key, chunkGridPosition) {
            _get(VolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(VolumeChunk.prototype), 'initializeVolumeChunk', this).call(this, key, chunkGridPosition);
            this.chunkDataSize = null;
            var source = this.source;
            /**
             * Grid position within chunk layout (coordinates are in units of chunks).
             */
            this.systemMemoryBytes = source.spec.chunkBytes;
            this.gpuMemoryBytes = source.spec.chunkBytes;
            this.data = null;
        }
    }, {
        key: 'serialize',
        value: function serialize(msg, transfers) {
            _get(VolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(VolumeChunk.prototype), 'serialize', this).call(this, msg, transfers);
            var chunkDataSize = this.chunkDataSize;
            if (chunkDataSize !== this.source.spec.chunkDataSize) {
                msg['chunkDataSize'] = chunkDataSize;
            }
            var data = msg['data'] = this.data;
            transfers.push(data.buffer);
            this.data = null;
        }
    }, {
        key: 'downloadSucceeded',
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.gpuMemoryBytes = this.data.byteLength;
            _get(VolumeChunk.prototype.__proto__ || _Object$getPrototypeOf(VolumeChunk.prototype), 'downloadSucceeded', this).call(this);
        }
    }, {
        key: 'freeSystemMemory',
        value: function freeSystemMemory() {
            this.data = null;
        }
    }]);

    return VolumeChunk;
}(SliceViewChunk);
export var VolumeChunkSource = function (_SliceViewChunkSource) {
    _inherits(VolumeChunkSource, _SliceViewChunkSource);

    function VolumeChunkSource(rpc, options) {
        _classCallCheck(this, VolumeChunkSource);

        var _this2 = _possibleConstructorReturn(this, (VolumeChunkSource.__proto__ || _Object$getPrototypeOf(VolumeChunkSource)).call(this, rpc, options));

        _this2.spec = VolumeChunkSpecification.fromObject(options['spec']);
        return _this2;
    }
    /**
     * Helper function for computing the voxel bounds of a chunk based on its chunkGridPosition.
     *
     * This assumes that the grid of chunk positions starts at this.baseVoxelOffset.  Chunks are
     * clipped to lie within upperVoxelBound, but are not clipped to lie within lowerVoxelBound.  (The
     * frontend code currently cannot handle chunks clipped at their lower corner, and the chunk
     * layout can generally be chosen so that lowerVoxelBound lies on a chunk boundary.)
     *
     * This sets chunk.chunkDataSize to a copy of the returned chunkDataSize if it differs from
     * this.spec.chunkDataSize; otherwise, it is set to this.spec.chunkDataSize.
     *
     * @returns A globally-allocated Vec3 containing the chunk corner position in voxel coordinates.
     * The returned Vec3 will be invalidated by any subsequent call to this method, even on a
     * different VolumeChunkSource instance.
     */


    _createClass(VolumeChunkSource, [{
        key: 'computeChunkBounds',
        value: function computeChunkBounds(chunk) {
            var spec = this.spec;
            var upperVoxelBound = spec.upperVoxelBound;

            var origChunkDataSize = spec.chunkDataSize;
            var newChunkDataSize = tempChunkDataSize;
            // Chunk start position in voxel coordinates.
            var chunkPosition = vec3.multiply(tempChunkPosition, chunk.chunkGridPosition, origChunkDataSize);
            // Specifies whether the chunk only partially fits within the data bounds.
            var partial = false;
            for (var i = 0; i < 3; ++i) {
                var upper = Math.min(upperVoxelBound[i], chunkPosition[i] + origChunkDataSize[i]);
                var size = newChunkDataSize[i] = upper - chunkPosition[i];
                if (size !== origChunkDataSize[i]) {
                    partial = true;
                }
            }
            vec3.add(chunkPosition, chunkPosition, this.spec.baseVoxelOffset);
            if (partial) {
                chunk.chunkDataSize = vec3.clone(newChunkDataSize);
            } else {
                chunk.chunkDataSize = origChunkDataSize;
            }
            return chunkPosition;
        }
    }]);

    return VolumeChunkSource;
}(SliceViewChunkSource);
VolumeChunkSource.prototype.chunkConstructor = VolumeChunk;
//# sourceMappingURL=backend.js.map