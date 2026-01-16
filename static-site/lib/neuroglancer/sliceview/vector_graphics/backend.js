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
import { VectorGraphicsChunkSpecification } from './base';
export var VectorGraphicsChunk = function (_SliceViewChunk) {
    _inherits(VectorGraphicsChunk, _SliceViewChunk);

    function VectorGraphicsChunk() {
        _classCallCheck(this, VectorGraphicsChunk);

        var _this = _possibleConstructorReturn(this, (VectorGraphicsChunk.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk)).call(this));

        _this.source = null;
        _this.vertexPositions = null;
        _this.vertexNormals = null;
        return _this;
    }

    _createClass(VectorGraphicsChunk, [{
        key: 'initializeVolumeChunk',
        value: function initializeVolumeChunk(key, chunkGridPosition) {
            _get(VectorGraphicsChunk.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk.prototype), 'initializeVolumeChunk', this).call(this, key, chunkGridPosition);
            var chunkBytes = 0;
            if (this.vertexPositions) {
                chunkBytes = chunkBytes + this.vertexPositions.buffer.byteLength;
            }
            if (this.vertexNormals) {
                chunkBytes = chunkBytes + this.vertexNormals.buffer.byteLength;
            }
            this.systemMemoryBytes = chunkBytes;
            this.gpuMemoryBytes = chunkBytes;
            this.vertexPositions = null;
        }
    }, {
        key: 'serialize',
        value: function serialize(msg, transfers) {
            _get(VectorGraphicsChunk.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk.prototype), 'serialize', this).call(this, msg, transfers);
            var vertexPositions = this.vertexPositions,
                vertexNormals = this.vertexNormals;

            msg['vertexPositions'] = vertexPositions;
            var vertexPositionsBuffer = vertexPositions.buffer;
            transfers.push(vertexPositionsBuffer);
            if (vertexNormals) {
                msg['vertexNormals'] = vertexNormals;
                var vertexNormalsBuffer = vertexNormals.buffer;
                transfers.push(vertexNormalsBuffer);
            }
            this.vertexPositions = null;
            this.vertexNormals = null;
        }
    }, {
        key: 'downloadSucceeded',
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.gpuMemoryBytes = this.vertexPositions.byteLength;
            _get(VectorGraphicsChunk.prototype.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunk.prototype), 'downloadSucceeded', this).call(this);
        }
    }, {
        key: 'freeSystemMemory',
        value: function freeSystemMemory() {
            this.vertexPositions = null;
            this.vertexNormals = null;
        }
    }]);

    return VectorGraphicsChunk;
}(SliceViewChunk);
export var VectorGraphicsChunkSource = function (_SliceViewChunkSource) {
    _inherits(VectorGraphicsChunkSource, _SliceViewChunkSource);

    function VectorGraphicsChunkSource(rpc, options) {
        _classCallCheck(this, VectorGraphicsChunkSource);

        var _this2 = _possibleConstructorReturn(this, (VectorGraphicsChunkSource.__proto__ || _Object$getPrototypeOf(VectorGraphicsChunkSource)).call(this, rpc, options));

        _this2.spec = VectorGraphicsChunkSpecification.fromObject(options['spec']);
        return _this2;
    }

    return VectorGraphicsChunkSource;
}(SliceViewChunkSource);
VectorGraphicsChunkSource.prototype.chunkConstructor = VectorGraphicsChunk;
//# sourceMappingURL=backend.js.map