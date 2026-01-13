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
import { encodeChannels as encodeChannelsUint32 } from './encode_uint32';
import { encodeChannels as encodeChannelsUint64 } from './encode_uint64';
import { makeRandomUint64Array } from './test_util';
import { prod4, vec3Key } from '../../util/geom';
import { Uint32ArrayBuilder } from '../../util/uint32array_builder';
var exampleChunkData64 = new Uint32Array(require('raw-data!neuroglancer-testdata/64x64x64-raw-uint64-segmentation.dat').buffer);
var exampleChunkData32 = exampleChunkData64.filter(function (_element, index) {
    return index % 2 === 0;
});
suite('64x64x64 example', function () {
    var blockSize = [8, 8, 8];
    var output = new Uint32ArrayBuilder(1000000);
    var volumeSize = [64, 64, 64, 1];
    benchmark('encode_uint64', function () {
        output.clear();
        encodeChannelsUint64(output, blockSize, exampleChunkData64, volumeSize);
    });
    benchmark('encode_uint32', function () {
        output.clear();
        encodeChannelsUint32(output, blockSize, exampleChunkData32, volumeSize);
    });
});
suite('compressed_segmentation', function () {
    var blockSize = [8, 8, 8];
    var output = new Uint32ArrayBuilder(1000000);

    var _loop = function _loop(volumeSize) {
        var numPossibleValues = 15;
        var input = makeRandomUint64Array(prod4(volumeSize), numPossibleValues);
        benchmark('encode_uint64 ' + vec3Key(volumeSize), function () {
            output.clear();
            encodeChannelsUint64(output, blockSize, input, volumeSize);
        });
    };

    var _arr = [[16, 16, 16, 1]];
    for (var _i = 0; _i < _arr.length; _i++) {
        var volumeSize = _arr[_i];
        _loop(volumeSize);
    }
});
//# sourceMappingURL=encode.benchmark.js.map