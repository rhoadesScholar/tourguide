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
import { chunkFormatTest } from '../chunk_format_testing';
import { ChunkFormat } from './chunk_format';
import { encodeChannels as encodeChannelsUint32 } from './encode_uint32';
import { encodeChannels as encodeChannelsUint64 } from './encode_uint64';
import { makeRandomUint64Array } from './test_util';
import { DataType } from '../../util/data_type';
import { prod4, vec3, vec3Key, vec4 } from '../../util/geom';
import { getRandomValues } from '../../util/random';
import { Uint32ArrayBuilder } from '../../util/uint32array_builder';
describe('sliceview/compressed_segmentation/chunk_format', function () {
    describe('data access', function () {
        var vec888 = vec3.fromValues(8, 8, 8);
        function runTest(dataType, volumeSize, rawData, compressedSegmentationBlockSize) {
            var encodeBuffer = new Uint32ArrayBuilder();
            (dataType === DataType.UINT32 ? encodeChannelsUint32 : encodeChannelsUint64)(encodeBuffer, compressedSegmentationBlockSize, rawData, volumeSize);
            var encodedData = encodeBuffer.view;
            chunkFormatTest(dataType, volumeSize, function (gl) {
                var chunkFormat = ChunkFormat.get(gl, dataType, compressedSegmentationBlockSize, volumeSize[3]);
                var textureLayout = chunkFormat.getTextureLayout(gl, volumeSize.subarray(0, 3), encodedData.length);
                return [chunkFormat, textureLayout];
            }, rawData, encodedData);
        }

        var _loop = function _loop(compressedSegmentationBlockSize) {
            describe('sequential values blockSize=' + vec3Key(compressedSegmentationBlockSize), function () {
                var _arr5 = [vec4.fromValues(13, 17, 23, 1), vec4.fromValues(13, 17, 23, 2)];

                for (var _i5 = 0; _i5 < _arr5.length; _i5++) {
                    var volumeSize = _arr5[_i5];
                    var numElements = prod4(volumeSize);
                    {
                        var rawData = new Uint32Array(numElements * 2);
                        for (var i = 0; i < rawData.length; ++i) {
                            rawData[i] = i;
                        }
                        runTest(DataType.UINT64, volumeSize, rawData, compressedSegmentationBlockSize);
                    }
                    {
                        var _rawData3 = new Uint32Array(numElements);
                        for (var _i6 = 0; _i6 < _rawData3.length; ++_i6) {
                            _rawData3[_i6] = _i6;
                        }
                        runTest(DataType.UINT32, volumeSize, _rawData3, compressedSegmentationBlockSize);
                    }
                }
            });
        };

        var _arr = [vec888, vec3.fromValues(16, 8, 4)];
        for (var _i = 0; _i < _arr.length; _i++) {
            var compressedSegmentationBlockSize = _arr[_i];
            _loop(compressedSegmentationBlockSize);
        }

        var _loop2 = function _loop2(numPossibleValues) {
            describe('random values out of ' + numPossibleValues + ' possible', function () {
                var dataType = DataType.UINT64;
                var _arr6 = [vec4.fromValues(64, 64, 64, 1), vec4.fromValues(36, 36, 36, 1)];
                for (var _i7 = 0; _i7 < _arr6.length; _i7++) {
                    var volumeSize = _arr6[_i7];
                    var numElements = prod4(volumeSize);
                    var rawData = makeRandomUint64Array(numElements, numPossibleValues);
                    runTest(dataType, volumeSize, rawData, vec888);
                }
            });
        };

        var _arr2 = [100];
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
            var numPossibleValues = _arr2[_i2];
            _loop2(numPossibleValues);
        }
        describe('random values', function () {
            var _arr3 = [vec4.fromValues(64, 64, 64, 1), vec4.fromValues(36, 36, 36, 1)];

            for (var _i3 = 0; _i3 < _arr3.length; _i3++) {
                var volumeSize = _arr3[_i3];
                var numElements = prod4(volumeSize);
                var rawData = new Uint32Array(numElements * 2);
                getRandomValues(rawData);
                runTest(DataType.UINT64, volumeSize, rawData, vec888);
            }
            var _arr4 = [vec4.fromValues(13, 17, 23, 1), vec4.fromValues(13, 17, 23, 2)];
            for (var _i4 = 0; _i4 < _arr4.length; _i4++) {
                var _volumeSize = _arr4[_i4];
                var numElements = prod4(_volumeSize);
                {
                    var _rawData = new Uint32Array(numElements * 2);
                    getRandomValues(_rawData);
                    runTest(DataType.UINT64, _volumeSize, _rawData, vec888);
                }
                {
                    var _rawData2 = new Uint32Array(numElements);
                    getRandomValues(_rawData2);
                    runTest(DataType.UINT32, _volumeSize, _rawData2, vec888);
                }
            }
        });
    });
});
//# sourceMappingURL=chunk_format.spec.js.map