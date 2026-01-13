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
/**
 * Converts raw data volumes to the appropriate format required by the frontend.
 */
import { encodeCompressedSegmentationUint32, encodeCompressedSegmentationUint64 } from '../../async_computation/encode_compressed_segmentation_request';
import { requestAsyncComputation } from '../../async_computation/request';
import { DataType } from '../base';
export var postProcessRawData = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken, data) {
        var spec, dataType, chunkDataSize, shape;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        cancellationToken;
                        spec = chunk.source.spec;

                        if (!(spec.compressedSegmentationBlockSize !== undefined)) {
                            _context.next = 20;
                            break;
                        }

                        dataType = spec.dataType;
                        chunkDataSize = chunk.chunkDataSize;
                        shape = [chunkDataSize[0], chunkDataSize[1], chunkDataSize[2], spec.numChannels];
                        _context.t0 = dataType;
                        _context.next = _context.t0 === DataType.UINT32 ? 9 : _context.t0 === DataType.UINT64 ? 13 : 17;
                        break;

                    case 9:
                        _context.next = 11;
                        return requestAsyncComputation(encodeCompressedSegmentationUint32, cancellationToken, [data.buffer], data, shape, spec.compressedSegmentationBlockSize);

                    case 11:
                        chunk.data = _context.sent;
                        return _context.abrupt('break', 18);

                    case 13:
                        _context.next = 15;
                        return requestAsyncComputation(encodeCompressedSegmentationUint64, cancellationToken, [data.buffer], data, shape, spec.compressedSegmentationBlockSize);

                    case 15:
                        chunk.data = _context.sent;
                        return _context.abrupt('break', 18);

                    case 17:
                        throw new Error('Unsupported data type for compressed segmentation: ' + DataType[dataType]);

                    case 18:
                        _context.next = 21;
                        break;

                    case 20:
                        chunk.data = data;

                    case 21:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function postProcessRawData(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();
//# sourceMappingURL=postprocess.js.map