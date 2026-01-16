// DO NOT EDIT.  Generated from
// templates/neuroglancer/sliceview/compressed_segmentation/encode.template.ts.
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
 * @file
 * Support for compressing uint32/uint64 segment label chunks.
 */
import { encodeChannel as encodeChannelCommon, encodeChannels as encodeChannelsCommon, writeBlock } from './encode_common';
import { getFortranOrderStrides } from '../../util/array';
export { newCache } from './encode_common';
var tempEncodingBuffer = void 0;
var tempValuesBuffer1 = void 0;
var tempValuesBuffer2 = void 0;
var tempIndexBuffer1 = void 0;
var tempIndexBuffer2 = void 0;
var uint32sPerElement = 1;
export function encodeBlock(rawData, inputOffset, inputStrides, blockSize, actualSize, baseOffset, cache, output) {
    var ax = actualSize[0],
        ay = actualSize[1],
        az = actualSize[2];
    var bx = blockSize[0],
        by = blockSize[1],
        bz = blockSize[2];
    var sx = inputStrides[0],
        sy = inputStrides[1],
        sz = inputStrides[2];
    sz -= sy * ay;
    sy -= sx * ax;
    if (ax * ay * az === 0) {
        return [0, 0];
    }
    var numBlockElements = bx * by * bz + 31; // Add padding elements.
    if (tempEncodingBuffer === undefined || tempEncodingBuffer.length < numBlockElements) {
        tempEncodingBuffer = new Uint32Array(numBlockElements);
        tempValuesBuffer1 = new Uint32Array(numBlockElements * uint32sPerElement);
        tempValuesBuffer2 = new Uint32Array(numBlockElements * uint32sPerElement);
        tempIndexBuffer1 = new Uint32Array(numBlockElements);
        tempIndexBuffer2 = new Uint32Array(numBlockElements);
    }
    var encodingBuffer = tempEncodingBuffer.subarray(0, numBlockElements);
    encodingBuffer.fill(0);
    var valuesBuffer1 = tempValuesBuffer1;
    var valuesBuffer2 = tempValuesBuffer2;
    var indexBuffer1 = tempIndexBuffer1;
    var indexBuffer2 = tempIndexBuffer2;
    var noAdjacentDuplicateIndex = 0;
    {
        var prevLow = rawData[inputOffset] + 1 >>> 0;
        var curInputOff = inputOffset;
        var blockElementIndex = 0;
        var bsy = bx - ax;
        var bsz = bx * by - bx * ay;
        for (var z = 0; z < az; ++z, curInputOff += sz, blockElementIndex += bsz) {
            for (var y = 0; y < ay; ++y, curInputOff += sy, blockElementIndex += bsy) {
                for (var x = 0; x < ax; ++x, curInputOff += sx) {
                    var valueLow = rawData[curInputOff];
                    if (valueLow !== prevLow) {
                        prevLow = valuesBuffer1[noAdjacentDuplicateIndex * 1] = valueLow;
                        indexBuffer1[noAdjacentDuplicateIndex] = noAdjacentDuplicateIndex++;
                    }
                    encodingBuffer[blockElementIndex++] = noAdjacentDuplicateIndex;
                }
            }
        }
    }
    indexBuffer1.subarray(0, noAdjacentDuplicateIndex).sort(function (a, b) {
        return valuesBuffer1[a] - valuesBuffer1[b];
    });
    var numUniqueValues = -1;
    {
        var _prevLow = valuesBuffer1[indexBuffer1[0] * uint32sPerElement] + 1 >>> 0;
        for (var i = 0; i < noAdjacentDuplicateIndex; ++i) {
            var index = indexBuffer1[i];
            var valueIndex = index * uint32sPerElement;
            var _valueLow = valuesBuffer1[valueIndex];
            if (_valueLow !== _prevLow) {
                ++numUniqueValues;
                var outputIndex2 = numUniqueValues * uint32sPerElement;
                _prevLow = valuesBuffer2[outputIndex2] = _valueLow;
            }
            indexBuffer2[index + 1] = numUniqueValues;
        }
        ++numUniqueValues;
    }
    return writeBlock(output, baseOffset, cache, bx * by * bz, numUniqueValues, valuesBuffer2, encodingBuffer, indexBuffer2, uint32sPerElement);
}
export function encodeChannel(output, blockSize, rawData, volumeSize) {
    var baseInputOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var inputStrides = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : getFortranOrderStrides(volumeSize, 1);

    return encodeChannelCommon(output, blockSize, rawData, volumeSize, baseInputOffset, inputStrides, encodeBlock);
}
export function encodeChannels(output, blockSize, rawData, volumeSize) {
    var baseInputOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
    var inputStrides = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : getFortranOrderStrides(volumeSize, 1);

    return encodeChannelsCommon(output, blockSize, rawData, volumeSize, baseInputOffset, inputStrides, encodeBlock);
}
//# sourceMappingURL=encode_uint32.js.map