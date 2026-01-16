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
import { parseCSVFromArrayBuffer } from './csv_vertex_attributes_request';
import { registerAsyncComputation } from './handler';
import { DataType } from '../util/data_type';
import { maybeDecompressGzip } from '../util/gzip';
registerAsyncComputation(parseCSVFromArrayBuffer, function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(buffer) {
        var decoder, text, lines, headers, attributeInfo, numRows, numColumns, attributes, i, fields, j;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        decoder = new TextDecoder();
                        text = decoder.decode(maybeDecompressGzip(buffer));
                        lines = text.trim().split(/\n+/);

                        if (lines) {
                            _context.next = 5;
                            break;
                        }

                        throw new Error('CSV file is empty.');

                    case 5:
                        headers = lines[0].split(',');
                        attributeInfo = headers.map(function (name) {
                            return { name: name.trim(), dataType: DataType.FLOAT32, numComponents: 1 };
                        });
                        numRows = lines.length - 1;
                        numColumns = headers.length;
                        attributes = headers.map(function () {
                            return new Float32Array(numRows);
                        });

                        for (i = 0; i < numRows; ++i) {
                            fields = lines[i + 1].split(',');

                            for (j = 0; j < numColumns; ++j) {
                                attributes[j][i] = parseFloat(fields[j]);
                            }
                        }
                        return _context.abrupt('return', {
                            value: {
                                data: {
                                    numVertices: numRows,
                                    attributeInfo: attributeInfo,
                                    attributes: attributes
                                },
                                size: numRows * numColumns * 4
                            },
                            transfer: attributes.map(function (a) {
                                return a.buffer;
                            })
                        });

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x) {
        return _ref.apply(this, arguments);
    };
}());
//# sourceMappingURL=csv_vertex_attributes.js.map