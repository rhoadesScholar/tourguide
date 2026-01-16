import _regeneratorRuntime from 'babel-runtime/regenerator';
import _Array$from from 'babel-runtime/core-js/array/from';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
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
import { registerAsyncComputation } from './handler';
import { parseVTKFromArrayBuffer } from './vtk_mesh_request';
import { getTriangularMeshSize, parseVTK } from '../datasource/vtk/parse';
import { maybeDecompressGzip } from '../util/gzip';
registerAsyncComputation(parseVTKFromArrayBuffer, function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(buffer) {
        var mesh;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        mesh = parseVTK(maybeDecompressGzip(buffer));
                        return _context.abrupt('return', {
                            value: { data: mesh, size: getTriangularMeshSize(mesh) },
                            transfer: [mesh.indices.buffer, mesh.vertexPositions.buffer].concat(_toConsumableArray(_Array$from(mesh.vertexAttributes.values()).map(function (a) {
                                return a.data.buffer;
                            })))
                        });

                    case 2:
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
//# sourceMappingURL=vtk_mesh.js.map