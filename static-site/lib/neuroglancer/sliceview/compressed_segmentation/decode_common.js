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
 * Support for decompressing uint32 and uint64 segment label chunks.
 */
/**
 * Determines the offset of the value at the specified dataPosition in a single-channel compressed
 * segmentation.
 *
 * @param baseOffset The base offset into `data' at which the compressed data for this channel
 * starts.
 * @param chunkDataSize A 3-element array specifying the size of the volume,
 * @param blockSize A 3-element array specifying the block size ued for compression.
 * @param dataPosition A 3-element array specifying the position within the volume from which to
 * read.
 * @returns The offset into `data', relative to baseOffset, at which the value is located.
 */
export function decodeValueOffset(data, baseOffset, chunkDataSize, blockSize, dataPosition, uint32sPerElement) {
  var gridOffset = 0,
      subchunkOffset = 0,
      gridStride = 1,
      subchunkStride = 1;
  for (var i = 0; i < 3; ++i) {
    var posValue = dataPosition[i];
    var subchunkSizeValue = blockSize[i];
    var gridSubscript = Math.floor(posValue / subchunkSizeValue);
    var subchunkSubscript = posValue % subchunkSizeValue;
    gridOffset += gridSubscript * gridStride;
    gridStride *= Math.ceil(chunkDataSize[i] / subchunkSizeValue);
    subchunkOffset += subchunkSubscript * subchunkStride;
    subchunkStride *= subchunkSizeValue;
  }
  var subchunkHeaderOffset = baseOffset + gridOffset * 2;
  var subchunkHeader0 = data[subchunkHeaderOffset];
  var subchunkHeader1 = data[subchunkHeaderOffset + 1];
  var outputValueOffset = subchunkHeader0 & 0xFFFFFF;
  var encodingBits = subchunkHeader0 >> 24 & 0xFF;
  if (encodingBits > 0) {
    var encodedValueBaseOffset = baseOffset + subchunkHeader1 & 0xFFFFFF;
    var encodedValueOffset = encodedValueBaseOffset + Math.floor(subchunkOffset * encodingBits / 32.0);
    var encodedValue = data[encodedValueOffset];
    var wordOffset = subchunkOffset * encodingBits % 32;
    var decodedValue = encodedValue >> wordOffset & (1 << encodingBits) - 1;
    outputValueOffset += uint32sPerElement * decodedValue;
  }
  return outputValueOffset;
}
//# sourceMappingURL=decode_common.js.map