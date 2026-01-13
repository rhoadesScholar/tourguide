import _Array$from from 'babel-runtime/core-js/array/from';
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
import { decodeChannel, decodeChannels } from './decode_uint64';
import { encodeBlock, encodeChannel, encodeChannels, newCache } from './encode_uint64';
import { makeRandomUint64Array } from './test_util';
import { prod3, prod4 } from '../../util/geom';
import { Uint32ArrayBuilder } from '../../util/uint32array_builder';
describe('compressed_segmentation uint64', function () {
    describe('encodeBlock', function () {
        // Test 0-bit encoding.
        it('basic 0-bit', function () {
            var input = Uint32Array.of(3, 0, 3, 0, 3, 0, 3, 0);
            var inputStrides = [2, 4, 8];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            var expected = Uint32Array.of(3, 0);
            var cache = newCache();

            var _encodeBlock = encodeBlock(input, 0, inputStrides, blockSize, blockSize, 0, cache, output),
                _encodeBlock2 = _slicedToArray(_encodeBlock, 2),
                encodedBits = _encodeBlock2[0],
                tableOffset = _encodeBlock2[1];

            expect(encodedBits).toBe(0);
            expect(tableOffset).toBe(0);
            expect(output.view).toEqual(expected);
            expect(_Array$from(cache)).toEqual([['3,0', 0]]);
        });
        // // Test 0-bit encoding with existing data in output buffer.
        it('basic 0-bit preserve existing', function () {
            var input = Uint32Array.of(3, 0, 3, 0, 3, 0, 3, 0);
            var inputStrides = [2, 4, 8];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            var expected = Uint32Array.of(1, 2, 3, 3, 0);
            var cache = newCache();

            var _encodeBlock3 = encodeBlock(input, 0, inputStrides, blockSize, blockSize, 3, cache, output),
                _encodeBlock4 = _slicedToArray(_encodeBlock3, 2),
                encodedBits = _encodeBlock4[0],
                tableOffset = _encodeBlock4[1];

            expect(encodedBits).toBe(0);
            expect(tableOffset).toBe(0);
            expect(output.view).toEqual(expected);
            expect(_Array$from(cache)).toEqual([['3,0', 0]]);
        });
        // Test 1-bit encoding.
        it('basic 1-bit', function () {
            var input = Uint32Array.of(4, 0, 3, 0, 4, 0, 4, 0);
            var inputStrides = [2, 4, 8];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            var cache = newCache();

            var _encodeBlock5 = encodeBlock(input, 0, inputStrides, blockSize, blockSize, 3, cache, output),
                _encodeBlock6 = _slicedToArray(_encodeBlock5, 2),
                encodedBits = _encodeBlock6[0],
                tableOffset = _encodeBlock6[1];

            expect(encodedBits).toBe(1);
            expect(tableOffset).toBe(1);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, 13, 3, 0, 4, 0));
            expect(_Array$from(cache)).toEqual([['3,0,4,0', 1]]);
        });
        // Test 1-bit encoding, actual_size != block_size.
        it('size mismatch 1-bit', function () {
            var input = Uint32Array.of(4, 0, 3, 0, 4, 0, 3, 0);
            var inputStrides = [2, 4, 8];
            var blockSize = [3, 2, 1];
            var actualSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            var cache = newCache();

            var _encodeBlock7 = encodeBlock(input, 0, inputStrides, blockSize, actualSize, 3, cache, output),
                _encodeBlock8 = _slicedToArray(_encodeBlock7, 2),
                encodedBits = _encodeBlock8[0],
                tableOffset = _encodeBlock8[1];

            expect(encodedBits).toBe(1);
            expect(tableOffset).toBe(1);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, 9, 3, 0, 4, 0));
            expect(_Array$from(cache)).toEqual([['3,0,4,0', 1]]);
        });
        // Test 2-bit encoding.
        it('basic 2-bit', function () {
            var input = Uint32Array.of(4, 0, 3, 0, 5, 0, 4, 0);
            var inputStrides = [2, 4, 8];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            var cache = newCache();

            var _encodeBlock9 = encodeBlock(input, 0, inputStrides, blockSize, blockSize, 3, cache, output),
                _encodeBlock10 = _slicedToArray(_encodeBlock9, 2),
                encodedBits = _encodeBlock10[0],
                tableOffset = _encodeBlock10[1];

            expect(encodedBits).toBe(2);
            expect(tableOffset).toBe(1);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, 97, 3, 0, 4, 0, 5, 0));
            expect(_Array$from(cache)).toEqual([['3,0,4,0,5,0', 1]]);
        });
    });
    describe('encodeChannel', function () {
        it('basic', function () {
            var input = Uint32Array.of(4, 0, 3, 0, 5, 0, 4, 0, //
            1, 0, 3, 0, 3, 0, 3, 0 //
            );
            var volumeSize = [2, 2, 2];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            encodeChannel(output, blockSize, input, volumeSize);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, //
            5 | 2 << 24, 4, //
            12 | 1 << 24, 11, //
            97, 3, 0, 4, 0, 5, 0, //
            14, 1, 0, 3, 0 //
            ));
        });
        it('basic cached 0-bit', function () {
            var input = Uint32Array.of(4, 0, 4, 0, 4, 0, 4, 0, //
            3, 0, 3, 0, 3, 0, 3, 0, //
            3, 0, 3, 0, 3, 0, 3, 0, //
            4, 0, 4, 0, 4, 0, 4, 0 //
            );
            var volumeSize = [2, 2, 4];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            encodeChannel(output, blockSize, input, volumeSize);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, //
            8 | 0 << 24, 8, //
            10 | 0 << 24, 10, //
            10 | 0 << 24, 12, //
            8 | 0 << 24, 12, //
            4, 0, //
            3, 0 //
            ));
        });
        it('basic cached 2-bit', function () {
            var input = Uint32Array.of(4, 0, 3, 0, 5, 0, 4, 0, //
            1, 0, 3, 0, 3, 0, 3, 0, //
            3, 0, 1, 0, 1, 0, 1, 0, //
            5, 0, 5, 0, 3, 0, 4, 0 //
            );
            var volumeSize = [2, 2, 4];
            var blockSize = [2, 2, 1];
            var output = new Uint32ArrayBuilder();
            output.appendArray([1, 2, 3]);
            encodeChannel(output, blockSize, input, volumeSize);
            expect(output.view).toEqual(Uint32Array.of(1, 2, 3, //
            9 | 2 << 24, 8, //
            16 | 1 << 24, 15, //
            16 | 1 << 24, 20, //
            9 | 2 << 24, 21, //
            97, 3, 0, 4, 0, 5, 0, //
            14, 1, 0, 3, 0, //
            1, //
            74 //
            ));
        });

        var _loop = function _loop(volumeSize) {
            it('round trip ' + volumeSize.join(','), function () {
                var numPossibleValues = 15;
                var input = makeRandomUint64Array(prod3(volumeSize), numPossibleValues);
                var blockSize = [2, 2, 2];
                var output = new Uint32ArrayBuilder();
                encodeChannel(output, blockSize, input, volumeSize);
                var decoded = new Uint32Array(input.length);
                decodeChannel(decoded, output.view, 0, volumeSize, blockSize);
                expect(decoded).toEqual(input);
            });
        };

        var _arr = [[1, 2, 1], [2, 2, 2], [4, 4, 5]];
        for (var _i = 0; _i < _arr.length; _i++) {
            var volumeSize = _arr[_i];
            _loop(volumeSize);
        }
    });
    describe('encodeChannels', function () {
        it('basic 1-channel 1-block', function () {
            var blockSize = [2, 2, 1];
            var input = Uint32Array.of(4, 0, 4, 0, 4, 0, 4, 0 //
            );
            var volumeSize = [2, 2, 1, 1];
            var output = new Uint32ArrayBuilder();
            encodeChannels(output, blockSize, input, volumeSize);
            expect(output.view).toEqual(Uint32Array.of(1, //
            2, 2, 4, 0 //
            ));
        });

        var _loop2 = function _loop2(volumeSize) {
            it('round trip ' + volumeSize.join(','), function () {
                var numPossibleValues = 15;
                var input = makeRandomUint64Array(prod4(volumeSize), numPossibleValues);
                var blockSize = [2, 2, 2];
                var output = new Uint32ArrayBuilder();
                encodeChannels(output, blockSize, input, volumeSize);
                var decoded = new Uint32Array(input.length);
                decodeChannels(decoded, output.view, 0, volumeSize, blockSize);
                expect(decoded).toEqual(input);
            });
        };

        var _arr2 = [[1, 2, 1, 1], [1, 2, 1, 3], [2, 2, 2, 1], [2, 2, 2, 3], [4, 4, 5, 3]];
        for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
            var volumeSize = _arr2[_i2];
            _loop2(volumeSize);
        }
    });
});
//# sourceMappingURL=encode_uint64.spec.js.map