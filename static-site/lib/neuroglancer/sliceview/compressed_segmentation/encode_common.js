import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
// DO NOT EDIT.  Generated from
// templates/neuroglancer/sliceview/compressed_segmentation/encode_common.template.ts.
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
export var BLOCK_HEADER_SIZE = 2;
export function newCache() {
    return new _Map();
}
function writeEncodedRepresentation(outputData, outputOffset, encodingBuffer, indexBuffer, encodedBits, encodedSize32Bits) {
    // Write encoded representation.
    if (encodedBits > 0) {
        switch (encodedBits) {
            case 1:
                {
                    for (var wordIndex = 0, elementIndex = 0; wordIndex < encodedSize32Bits; ++wordIndex) {
                        var word = 0;
                        word |= indexBuffer[encodingBuffer[elementIndex + 0]] << 0;
                        word |= indexBuffer[encodingBuffer[elementIndex + 1]] << 1;
                        word |= indexBuffer[encodingBuffer[elementIndex + 2]] << 2;
                        word |= indexBuffer[encodingBuffer[elementIndex + 3]] << 3;
                        word |= indexBuffer[encodingBuffer[elementIndex + 4]] << 4;
                        word |= indexBuffer[encodingBuffer[elementIndex + 5]] << 5;
                        word |= indexBuffer[encodingBuffer[elementIndex + 6]] << 6;
                        word |= indexBuffer[encodingBuffer[elementIndex + 7]] << 7;
                        word |= indexBuffer[encodingBuffer[elementIndex + 8]] << 8;
                        word |= indexBuffer[encodingBuffer[elementIndex + 9]] << 9;
                        word |= indexBuffer[encodingBuffer[elementIndex + 10]] << 10;
                        word |= indexBuffer[encodingBuffer[elementIndex + 11]] << 11;
                        word |= indexBuffer[encodingBuffer[elementIndex + 12]] << 12;
                        word |= indexBuffer[encodingBuffer[elementIndex + 13]] << 13;
                        word |= indexBuffer[encodingBuffer[elementIndex + 14]] << 14;
                        word |= indexBuffer[encodingBuffer[elementIndex + 15]] << 15;
                        word |= indexBuffer[encodingBuffer[elementIndex + 16]] << 16;
                        word |= indexBuffer[encodingBuffer[elementIndex + 17]] << 17;
                        word |= indexBuffer[encodingBuffer[elementIndex + 18]] << 18;
                        word |= indexBuffer[encodingBuffer[elementIndex + 19]] << 19;
                        word |= indexBuffer[encodingBuffer[elementIndex + 20]] << 20;
                        word |= indexBuffer[encodingBuffer[elementIndex + 21]] << 21;
                        word |= indexBuffer[encodingBuffer[elementIndex + 22]] << 22;
                        word |= indexBuffer[encodingBuffer[elementIndex + 23]] << 23;
                        word |= indexBuffer[encodingBuffer[elementIndex + 24]] << 24;
                        word |= indexBuffer[encodingBuffer[elementIndex + 25]] << 25;
                        word |= indexBuffer[encodingBuffer[elementIndex + 26]] << 26;
                        word |= indexBuffer[encodingBuffer[elementIndex + 27]] << 27;
                        word |= indexBuffer[encodingBuffer[elementIndex + 28]] << 28;
                        word |= indexBuffer[encodingBuffer[elementIndex + 29]] << 29;
                        word |= indexBuffer[encodingBuffer[elementIndex + 30]] << 30;
                        word |= indexBuffer[encodingBuffer[elementIndex + 31]] << 31;
                        outputData[outputOffset + wordIndex] = word;
                        elementIndex += 32;
                    }
                }
                break;
            case 2:
                {
                    for (var _wordIndex = 0, _elementIndex = 0; _wordIndex < encodedSize32Bits; ++_wordIndex) {
                        var _word = 0;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 0]] << 0;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 1]] << 2;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 2]] << 4;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 3]] << 6;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 4]] << 8;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 5]] << 10;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 6]] << 12;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 7]] << 14;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 8]] << 16;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 9]] << 18;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 10]] << 20;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 11]] << 22;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 12]] << 24;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 13]] << 26;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 14]] << 28;
                        _word |= indexBuffer[encodingBuffer[_elementIndex + 15]] << 30;
                        outputData[outputOffset + _wordIndex] = _word;
                        _elementIndex += 16;
                    }
                }
                break;
            case 4:
                {
                    for (var _wordIndex2 = 0, _elementIndex2 = 0; _wordIndex2 < encodedSize32Bits; ++_wordIndex2) {
                        var _word2 = 0;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 0]] << 0;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 1]] << 4;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 2]] << 8;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 3]] << 12;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 4]] << 16;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 5]] << 20;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 6]] << 24;
                        _word2 |= indexBuffer[encodingBuffer[_elementIndex2 + 7]] << 28;
                        outputData[outputOffset + _wordIndex2] = _word2;
                        _elementIndex2 += 8;
                    }
                }
                break;
            case 8:
                {
                    for (var _wordIndex3 = 0, _elementIndex3 = 0; _wordIndex3 < encodedSize32Bits; ++_wordIndex3) {
                        var _word3 = 0;
                        _word3 |= indexBuffer[encodingBuffer[_elementIndex3 + 0]] << 0;
                        _word3 |= indexBuffer[encodingBuffer[_elementIndex3 + 1]] << 8;
                        _word3 |= indexBuffer[encodingBuffer[_elementIndex3 + 2]] << 16;
                        _word3 |= indexBuffer[encodingBuffer[_elementIndex3 + 3]] << 24;
                        outputData[outputOffset + _wordIndex3] = _word3;
                        _elementIndex3 += 4;
                    }
                }
                break;
            case 16:
                {
                    for (var _wordIndex4 = 0, _elementIndex4 = 0; _wordIndex4 < encodedSize32Bits; ++_wordIndex4) {
                        var _word4 = 0;
                        _word4 |= indexBuffer[encodingBuffer[_elementIndex4 + 0]] << 0;
                        _word4 |= indexBuffer[encodingBuffer[_elementIndex4 + 1]] << 16;
                        outputData[outputOffset + _wordIndex4] = _word4;
                        _elementIndex4 += 2;
                    }
                }
                break;
            case 32:
                {
                    for (var _wordIndex5 = 0, _elementIndex5 = 0; _wordIndex5 < encodedSize32Bits; ++_wordIndex5) {
                        var _word5 = 0;
                        _word5 |= indexBuffer[encodingBuffer[_elementIndex5 + 0]] << 0;
                        outputData[outputOffset + _wordIndex5] = _word5;
                        _elementIndex5 += 1;
                    }
                }
                break;
        }
    }
}
export function writeBlock(output, baseOffset, cache, numBlockElements, numUniqueValues, valuesBuffer2, encodingBuffer, indexBuffer2, uint32sPerElement) {
    var encodedBits = void 0;
    if (numUniqueValues === 1) {
        encodedBits = 0;
    } else {
        encodedBits = 1;
        while (1 << encodedBits < numUniqueValues) {
            encodedBits *= 2;
        }
    }
    var encodedSize32bits = Math.ceil(encodedBits * numBlockElements / 32);
    var encodedValueBaseOffset = output.length;
    var elementsToWrite = encodedSize32bits;
    var writeTable = false;
    var key = Array.prototype.join.call(valuesBuffer2.subarray(0, numUniqueValues * uint32sPerElement), ',');
    var tableOffset = cache.get(key);
    if (tableOffset === undefined) {
        writeTable = true;
        elementsToWrite += numUniqueValues * uint32sPerElement;
        tableOffset = encodedValueBaseOffset + encodedSize32bits - baseOffset;
        cache.set(key, tableOffset);
    }
    output.resize(encodedValueBaseOffset + elementsToWrite);
    var outputData = output.data;
    writeEncodedRepresentation(outputData, encodedValueBaseOffset, encodingBuffer, indexBuffer2, encodedBits, encodedSize32bits);
    // Write table
    if (writeTable) {
        var curOutputOff = encodedValueBaseOffset + encodedSize32bits;
        for (var i = 0, length = numUniqueValues * uint32sPerElement; i < length; ++i) {
            outputData[curOutputOff++] = valuesBuffer2[i];
        }
    }
    return [encodedBits, tableOffset];
}
export function encodeChannel(output, blockSize, rawData, volumeSize, baseInputOffset, inputStrides, encodeBlock) {
    // Maps a sorted list of table entries in the form <low>,<high>,<low>,<high>,... to the table
    // offset relative to baseOffset.
    var cache = newCache();
    var gridSize = new Array(3);
    var blockIndexSize = BLOCK_HEADER_SIZE;
    for (var i = 0; i < 3; ++i) {
        var curGridSize = gridSize[i] = Math.ceil(volumeSize[i] / blockSize[i]);
        blockIndexSize *= curGridSize;
    }
    var gx = gridSize[0],
        gy = gridSize[1],
        gz = gridSize[2];
    var xSize = volumeSize[0],
        ySize = volumeSize[1],
        zSize = volumeSize[2];
    var xBlockSize = blockSize[0],
        yBlockSize = blockSize[1],
        zBlockSize = blockSize[2];
    var baseOffset = output.length;
    var headerOffset = baseOffset;
    var actualSize = [0, 0, 0];
    output.resize(baseOffset + blockIndexSize);
    var sx = inputStrides[0],
        sy = inputStrides[1],
        sz = inputStrides[2];
    for (var bz = 0; bz < gz; ++bz) {
        actualSize[2] = Math.min(zBlockSize, zSize - bz * zBlockSize);
        for (var by = 0; by < gy; ++by) {
            actualSize[1] = Math.min(yBlockSize, ySize - by * yBlockSize);
            for (var bx = 0; bx < gx; ++bx) {
                actualSize[0] = Math.min(xBlockSize, xSize - bx * xBlockSize);
                var inputOffset = bz * zBlockSize * sz + by * yBlockSize * sy + bx * xBlockSize * sx;
                var encodedValueBaseOffset = output.length - baseOffset;

                var _encodeBlock = encodeBlock(rawData, baseInputOffset + inputOffset, inputStrides, blockSize, actualSize, baseOffset, cache, output),
                    _encodeBlock2 = _slicedToArray(_encodeBlock, 2),
                    encodedBits = _encodeBlock2[0],
                    tableOffset = _encodeBlock2[1];

                var outputData = output.data;
                outputData[headerOffset++] = tableOffset | encodedBits << 24;
                outputData[headerOffset++] = encodedValueBaseOffset;
            }
        }
    }
}
export function encodeChannels(output, blockSize, rawData, volumeSize, baseInputOffset, inputStrides, encodeBlock) {
    var channelOffsetOutputBase = output.length;
    var numChannels = volumeSize[3];
    output.resize(channelOffsetOutputBase + numChannels);
    for (var channel = 0; channel < numChannels; ++channel) {
        output.data[channelOffsetOutputBase + channel] = output.length;
        encodeChannel(output, blockSize, rawData, volumeSize, baseInputOffset + inputStrides[3] * channel, inputStrides, encodeBlock);
    }
}
//# sourceMappingURL=encode_common.js.map