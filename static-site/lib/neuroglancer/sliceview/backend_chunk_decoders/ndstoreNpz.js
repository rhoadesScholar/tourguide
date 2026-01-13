import _regeneratorRuntime from 'babel-runtime/regenerator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
/**
 * This decodes the NDStore (https://github.com/neurodata/ndstore) NPZ format, which is the Python
 * NPY binary format with zlib encoding.
 *
 * This is NOT the same as the Python NPZ format, which is a ZIP file containing multiple files
 * (each corresponding to a different variable) in NPY binary format.
 */
import { decodeGzip } from '../../async_computation/decode_gzip_request';
import { requestAsyncComputation } from '../../async_computation/request';
import { postProcessRawData } from './postprocess';
import { DataType } from '../base';
import { vec3Key } from '../../util/geom';
import { parseNpy } from '../../util/npy';
export var decodeNdstoreNpzChunk = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken, response) {
        var parseResult, chunkDataSize, source, numChannels, shape, parsedDataType, spec;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.t0 = parseNpy;
                        _context.next = 3;
                        return requestAsyncComputation(decodeGzip, cancellationToken, [response], new Uint8Array(response));

                    case 3:
                        _context.t1 = _context.sent;
                        parseResult = (0, _context.t0)(_context.t1);
                        chunkDataSize = chunk.chunkDataSize;
                        source = chunk.source;
                        numChannels = source.spec.numChannels;
                        shape = parseResult.shape;

                        if (!(shape.length !== 4 || shape[0] !== numChannels || shape[1] !== chunkDataSize[2] || shape[2] !== chunkDataSize[1] || shape[3] !== chunkDataSize[0])) {
                            _context.next = 11;
                            break;
                        }

                        throw new Error('Shape ' + _JSON$stringify(shape) + ' does not match chunkDataSize ' + vec3Key(chunkDataSize));

                    case 11:
                        parsedDataType = parseResult.dataType.dataType;
                        spec = source.spec;

                        if (!(parsedDataType !== spec.dataType)) {
                            _context.next = 15;
                            break;
                        }

                        throw new Error('Data type ' + DataType[parsedDataType] + ' does not match ' + ('expected data type ' + DataType[spec.dataType]));

                    case 15:
                        _context.next = 17;
                        return postProcessRawData(chunk, cancellationToken, parseResult.data);

                    case 17:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function decodeNdstoreNpzChunk(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();
//# sourceMappingURL=ndstoreNpz.js.map