import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
/**
 * @license
 * Copyright 2019 Google Inc.
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
import { encodeCompressedSegmentationUint32, encodeCompressedSegmentationUint64 } from './encode_compressed_segmentation_request';
import { registerAsyncComputation } from './handler';
import { encodeChannels as encodeChannelsUint32 } from '../sliceview/compressed_segmentation/encode_uint32';
import { encodeChannels as encodeChannelsUint64 } from '../sliceview/compressed_segmentation/encode_uint64';
import { Uint32ArrayBuilder } from '../util/uint32array_builder';
var tempBuffer = new Uint32ArrayBuilder(20000);
registerAsyncComputation(encodeCompressedSegmentationUint32, function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(rawData, shape, blockSize) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        tempBuffer.clear();
                        encodeChannelsUint32(tempBuffer, blockSize, rawData, shape);
                        return _context.abrupt('return', { value: tempBuffer.view });

                    case 3:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}());
registerAsyncComputation(encodeCompressedSegmentationUint64, function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(rawData, shape, blockSize) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        tempBuffer.clear();
                        encodeChannelsUint64(tempBuffer, blockSize, rawData, shape);
                        return _context2.abrupt('return', { value: tempBuffer.view });

                    case 3:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function (_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
}());
//# sourceMappingURL=encode_compressed_segmentation.js.map