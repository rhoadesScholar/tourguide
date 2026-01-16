import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
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
import { SliceViewChunk, SliceViewChunkSource } from '../frontend';
import { vec3, vec3Key } from '../../util/geom';
var tempChunkGridPosition = vec3.create();
var tempLocalPosition = vec3.create();
var chunkFormatHandlers = new Array();
export function registerChunkFormatHandler(factory) {
    chunkFormatHandlers.push(factory);
}
export function getChunkFormatHandler(gl, spec) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(chunkFormatHandlers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var handler = _step.value;

            var result = handler(gl, spec);
            if (result != null) {
                return result;
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

    throw new Error('No chunk format handler found.');
}
export var VolumeChunkSource = function (_SliceViewChunkSource) {
    _inherits(VolumeChunkSource, _SliceViewChunkSource);

    function VolumeChunkSource(chunkManager, options) {
        _classCallCheck(this, VolumeChunkSource);

        var _this = _possibleConstructorReturn(this, (VolumeChunkSource.__proto__ || _Object$getPrototypeOf(VolumeChunkSource)).call(this, chunkManager, options));

        _this.chunkFormatHandler = _this.registerDisposer(getChunkFormatHandler(chunkManager.chunkQueueManager.gl, _this.spec));
        return _this;
    }

    _createClass(VolumeChunkSource, [{
        key: 'getValueAt',
        value: function getValueAt(position) {
            var chunkLayout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.spec.chunkLayout;

            var chunkGridPosition = tempChunkGridPosition;
            var localPosition = tempLocalPosition;
            var spec = this.spec;
            var chunkSize = chunkLayout.size;
            chunkLayout.globalToLocalSpatial(localPosition, position);
            for (var i = 0; i < 3; ++i) {
                var chunkSizeValue = chunkSize[i];
                var localPositionValue = localPosition[i];
                chunkGridPosition[i] = Math.floor(localPositionValue / chunkSizeValue);
            }
            var key = vec3Key(chunkGridPosition);
            var chunk = this.chunks.get(key);
            if (!chunk) {
                return null;
            }
            // Reuse temporary variable.
            var dataPosition = chunkGridPosition;
            var voxelSize = spec.voxelSize;
            for (var _i = 0; _i < 3; ++_i) {
                dataPosition[_i] = Math.floor((localPosition[_i] - chunkGridPosition[_i] * chunkSize[_i]) / voxelSize[_i]);
            }
            var chunkDataSize = chunk.chunkDataSize;
            for (var _i2 = 0; _i2 < 3; ++_i2) {
                if (dataPosition[_i2] >= chunkDataSize[_i2]) {
                    return undefined;
                }
            }
            var numChannels = spec.numChannels;

            if (numChannels === 1) {
                return chunk.getChannelValueAt(dataPosition, 0);
            } else {
                var result = new Array(numChannels);
                for (var _i3 = 0; _i3 < numChannels; ++_i3) {
                    result[_i3] = chunk.getChannelValueAt(dataPosition, _i3);
                }
                return result;
            }
        }
    }, {
        key: 'getChunk',
        value: function getChunk(x) {
            return this.chunkFormatHandler.getChunk(this, x);
        }
    }, {
        key: 'chunkFormat',
        get: function get() {
            return this.chunkFormatHandler.chunkFormat;
        }
    }]);

    return VolumeChunkSource;
}(SliceViewChunkSource);
export var VolumeChunk = function (_SliceViewChunk) {
    _inherits(VolumeChunk, _SliceViewChunk);

    _createClass(VolumeChunk, [{
        key: 'chunkFormat',
        get: function get() {
            return this.source.chunkFormat;
        }
    }]);

    function VolumeChunk(source, x) {
        _classCallCheck(this, VolumeChunk);

        var _this2 = _possibleConstructorReturn(this, (VolumeChunk.__proto__ || _Object$getPrototypeOf(VolumeChunk)).call(this, source, x));

        _this2.chunkDataSize = x['chunkDataSize'] || source.spec.chunkDataSize;
        return _this2;
    }

    return VolumeChunk;
}(SliceViewChunk);
//# sourceMappingURL=frontend.js.map