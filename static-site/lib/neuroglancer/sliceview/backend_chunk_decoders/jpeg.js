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
import { decodeJpeg } from '../../async_computation/decode_jpeg_request';
import { requestAsyncComputation } from '../../async_computation/request';
export var decodeJpegChunk = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(chunk, cancellationToken, response) {
    var chunkDataSize, decoded;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            chunkDataSize = chunk.chunkDataSize;
            _context.next = 3;
            return requestAsyncComputation(decodeJpeg, cancellationToken, [response], new Uint8Array(response), chunkDataSize[0], chunkDataSize[1] * chunkDataSize[2], chunk.source.spec.numChannels);

          case 3:
            decoded = _context.sent;
            _context.next = 6;
            return postProcessRawData(chunk, cancellationToken, decoded);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function decodeJpegChunk(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=jpeg.js.map