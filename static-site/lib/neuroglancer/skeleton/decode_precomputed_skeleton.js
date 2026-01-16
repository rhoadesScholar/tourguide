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
import { decodeSkeletonVertexPositionsAndIndices } from './backend';
import { DATA_TYPE_BYTES } from '../util/data_type';
import { convertEndian16, convertEndian32, Endianness } from '../util/endian';
export function decodeSkeletonChunk(chunk, response, vertexAttributes) {
    var dv = new DataView(response);
    var numVertices = dv.getUint32(0, true);
    var numEdges = dv.getUint32(4, true);
    var vertexPositionsStartOffset = 8;
    var curOffset = 8 + numVertices * 4 * 3;
    decodeSkeletonVertexPositionsAndIndices(chunk, response, Endianness.LITTLE, /*vertexByteOffset=*/vertexPositionsStartOffset, numVertices,
    /*indexByteOffset=*/curOffset, /*numEdges=*/numEdges);
    curOffset += numEdges * 4 * 2;
    var attributes = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(vertexAttributes.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var info = _step.value;

            var bytesPerVertex = DATA_TYPE_BYTES[info.dataType] * info.numComponents;
            var totalBytes = bytesPerVertex * numVertices;
            var attribute = new Uint8Array(response, curOffset, totalBytes);
            switch (bytesPerVertex) {
                case 2:
                    convertEndian16(attribute, Endianness.LITTLE);
                    break;
                case 4:
                case 8:
                    convertEndian32(attribute, Endianness.LITTLE);
                    break;
            }
            attributes.push(attribute);
            curOffset += totalBytes;
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

    chunk.vertexAttributes = attributes;
}
//# sourceMappingURL=decode_precomputed_skeleton.js.map