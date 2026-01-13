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
import { requestAsyncComputation } from '../../async_computation/request';
import { parseVTKFromArrayBuffer } from '../../async_computation/vtk_mesh_request';
import { GenericSharedDataSource } from '../../chunk_manager/generic_file_source';
import { registerSingleMeshFactory } from '../../single_mesh/backend';
import { DataType } from '../../util/data_type';
/**
 * This needs to be a global function, because it identifies the instance of GenericSharedDataSource
 * to use.
 */
function parse(buffer, cancellationToken) {
    return requestAsyncComputation(parseVTKFromArrayBuffer, cancellationToken, [buffer], buffer);
}
registerSingleMeshFactory('vtk', {
    description: 'VTK',
    getMesh: function getMesh(chunkManager, url, getPriority, cancellationToken) {
        return GenericSharedDataSource.getUrl(chunkManager, parse, url, getPriority, cancellationToken).then(function (mesh) {
            var result = {
                info: {
                    numTriangles: mesh.numTriangles,
                    numVertices: mesh.numVertices,
                    vertexAttributes: []
                },
                indices: mesh.indices,
                vertexPositions: mesh.vertexPositions,
                vertexAttributes: []
            };
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(mesh.vertexAttributes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var attribute = _step.value;

                    result.info.vertexAttributes.push({
                        name: attribute.name,
                        dataType: DataType.FLOAT32,
                        numComponents: attribute.numComponents
                    });
                    result.vertexAttributes.push(attribute.data);
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

            return result;
        });
    }
});
//# sourceMappingURL=backend.js.map