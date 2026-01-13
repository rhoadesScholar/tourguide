import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
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
import { postProcessRawData } from './postprocess';
import { DATA_TYPE_BYTES, DataType } from '../../util/data_type';
import { convertEndian16, convertEndian32, ENDIANNESS } from '../../util/endian';
import { prod3 } from '../../util/geom';
export var decodeRawChunk = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken, response) {
        var endianness = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ENDIANNESS;
        var byteOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
        var byteLength = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : response.byteLength;
        var spec, dataType, numElements, bytesPerElement, expectedBytes, data;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        cancellationToken;
                        spec = chunk.source.spec;
                        dataType = spec.dataType;
                        numElements = prod3(chunk.chunkDataSize);
                        bytesPerElement = DATA_TYPE_BYTES[dataType];
                        expectedBytes = numElements * bytesPerElement * spec.numChannels;

                        if (!(expectedBytes !== byteLength)) {
                            _context.next = 8;
                            break;
                        }

                        throw new Error('Raw-format chunk is ' + byteLength + ' bytes, ' + ('but ' + numElements + ' * ' + bytesPerElement + ' = ' + expectedBytes + ' bytes are expected.'));

                    case 8:
                        data = void 0;
                        _context.t0 = dataType;
                        _context.next = _context.t0 === DataType.UINT8 ? 12 : _context.t0 === DataType.UINT16 ? 14 : _context.t0 === DataType.UINT32 ? 17 : _context.t0 === DataType.UINT64 ? 17 : _context.t0 === DataType.FLOAT32 ? 20 : 23;
                        break;

                    case 12:
                        data = new Uint8Array(response, byteOffset, byteLength);
                        return _context.abrupt('break', 24);

                    case 14:
                        data = new Uint16Array(response, byteOffset, byteLength / 2);
                        convertEndian16(data, endianness);
                        return _context.abrupt('break', 24);

                    case 17:
                        data = new Uint32Array(response, byteOffset, byteLength / 4);
                        convertEndian32(data, endianness);
                        return _context.abrupt('break', 24);

                    case 20:
                        data = new Float32Array(response, byteOffset, byteLength / 4);
                        convertEndian32(data, endianness);
                        return _context.abrupt('break', 24);

                    case 23:
                        throw new Error('Unexpected data type: ' + dataType + '.');

                    case 24:
                        _context.next = 26;
                        return postProcessRawData(chunk, cancellationToken, data);

                    case 26:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function decodeRawChunk(_x4, _x5, _x6) {
        return _ref.apply(this, arguments);
    };
}();
//# sourceMappingURL=raw.js.map