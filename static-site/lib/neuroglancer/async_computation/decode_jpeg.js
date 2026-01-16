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
import { JpegDecoder } from 'jpgjs';
import { decodeJpeg } from './decode_jpeg_request';
import { registerAsyncComputation } from './handler';
import { transposeArray2d } from '../util/array';
registerAsyncComputation(decodeJpeg, function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(data, width, height, numComponents) {
        var parser, result;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        parser = new JpegDecoder();

                        parser.parse(data);
                        // Just check that the total number pixels matches the expected value.

                        if (!(parser.width !== width || parser.height !== height)) {
                            _context.next = 4;
                            break;
                        }

                        throw new Error('JPEG data does not have the expected dimensions: ' + ('width=' + parser.width + ', height=' + parser.height + ', ') + ('expected width=' + parser.width + ', expected height=' + parser.height));

                    case 4:
                        if (!(parser.numComponents !== numComponents)) {
                            _context.next = 6;
                            break;
                        }

                        throw new Error('JPEG data does not have the expected number of components: ' + ('components=' + parser.numComponents + ', expected=' + numComponents));

                    case 6:
                        result = void 0;

                        if (!(parser.numComponents === 1)) {
                            _context.next = 11;
                            break;
                        }

                        result = parser.getData(parser.width, parser.height, /*forceRGBOutput=*/false);
                        _context.next = 17;
                        break;

                    case 11:
                        if (!(parser.numComponents === 3)) {
                            _context.next = 16;
                            break;
                        }

                        result = parser.getData(parser.width, parser.height, /*forceRGBOutput=*/false);
                        result = transposeArray2d(result, parser.width * parser.height, 3);
                        _context.next = 17;
                        break;

                    case 16:
                        throw new Error('JPEG data has an unsupported number of components: components=' + parser.numComponents);

                    case 17:
                        return _context.abrupt('return', { value: result, transfer: [result.buffer] });

                    case 18:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
}());
//# sourceMappingURL=decode_jpeg.js.map