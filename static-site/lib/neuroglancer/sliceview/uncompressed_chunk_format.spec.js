import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
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
import { chunkFormatTest } from './chunk_format_testing';
import { ChunkFormat } from './uncompressed_chunk_format';
import { DataType } from '../util/data_type';
import { prod4, vec4 } from '../util/geom';
import { getRandomValues } from '../util/random';
describe('sliceview/uncompressed_chunk_format', function () {
    describe('data access', function () {
        var _loop = function _loop(volumeSize) {
            var numElements = prod4(volumeSize);
            var data = new Float32Array(numElements);
            for (var i = 0; i < numElements; ++i) {
                data[i] = i;
            }
            var dataType = DataType.FLOAT32;
            chunkFormatTest(dataType, volumeSize, function (gl) {
                var chunkFormat = ChunkFormat.get(gl, dataType, volumeSize[3]);
                var textureLayout = chunkFormat.getTextureLayout(gl, volumeSize.subarray(0, 3));
                return [chunkFormat, textureLayout];
            }, data, data);
        };

        var _arr = [vec4.fromValues(64, 64, 64, 1), vec4.fromValues(36, 36, 36, 1)];

        for (var _i = 0; _i < _arr.length; _i++) {
            var volumeSize = _arr[_i];
            _loop(volumeSize);
        }

        var _loop2 = function _loop2(volumeSize) {
            var numElements = prod4(volumeSize);

            var _loop3 = function _loop3(arrayConstructor, _dataType) {
                var texelsPerElement = _dataType === DataType.UINT64 ? 2 : 1;
                var data = new arrayConstructor(numElements * texelsPerElement);
                getRandomValues(data);
                chunkFormatTest(_dataType, volumeSize, function (gl) {
                    var chunkFormat = ChunkFormat.get(gl, _dataType, volumeSize[3]);
                    var textureLayout = chunkFormat.getTextureLayout(gl, volumeSize.subarray(0, 3));
                    return [chunkFormat, textureLayout];
                }, data, data);
            };

            var _arr3 = [[DataType.UINT8, Uint8Array], [DataType.UINT16, Uint16Array], [DataType.UINT32, Uint32Array], [DataType.UINT64, Uint32Array]];
            for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
                var _ref = _arr3[_i3];

                var _ref2 = _slicedToArray(_ref, 2);

                var _dataType = _ref2[0];
                var arrayConstructor = _ref2[1];

                _loop3(arrayConstructor, _dataType);
            }
        };

        var _arr2 = [vec4.fromValues(13, 17, 23, 1), vec4.fromValues(13, 17, 23, 2)];
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
            var volumeSize = _arr2[_i2];
            _loop2(volumeSize);
        }
    });
});
//# sourceMappingURL=uncompressed_chunk_format.spec.js.map