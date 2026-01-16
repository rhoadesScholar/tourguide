import _Promise from "babel-runtime/core-js/promise";
import _slicedToArray from "babel-runtime/helpers/slicedToArray";
import _JSON$stringify from "babel-runtime/core-js/json/stringify";
import _Map from "babel-runtime/core-js/map";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _toConsumableArray from "babel-runtime/helpers/toConsumableArray";
import _Set from "babel-runtime/core-js/set";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _get from "babel-runtime/helpers/get";
import _inherits from "babel-runtime/helpers/inherits";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
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
var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = _Object$getOwnPropertyDescriptor(target, key) : desc,
        d;
    if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    }return c > 3 && r && _Object$defineProperty(target, key, r), r;
};
import { Chunk, ChunkSource, withChunkManager, WithParameters } from "../chunk_manager/backend";
import { ChunkPriorityTier } from "../chunk_manager/base";
import { computeVertexNormals } from "../mesh/backend";
import { GET_SINGLE_MESH_INFO_RPC_ID, SINGLE_MESH_CHUNK_KEY, SINGLE_MESH_LAYER_RPC_ID, SingleMeshSourceParametersWithInfo } from "./base";
import { stableStringify } from "../util/json";
import { getBasePriority, getPriorityTier, withSharedVisibility } from "../visibility_priority/backend";
import { registerPromiseRPC, registerSharedObject, SharedObjectCounterpart } from "../worker_rpc";
var SINGLE_MESH_CHUNK_PRIORITY = 50;
/**
 * Chunk that contains the single mesh.
 */
export var SingleMeshChunk = function (_Chunk) {
    _inherits(SingleMeshChunk, _Chunk);

    function SingleMeshChunk() {
        _classCallCheck(this, SingleMeshChunk);

        var _this = _possibleConstructorReturn(this, (SingleMeshChunk.__proto__ || _Object$getPrototypeOf(SingleMeshChunk)).call(this));

        _this.data = null;
        return _this;
    }

    _createClass(SingleMeshChunk, [{
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.data = null;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(SingleMeshChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshChunk.prototype), "serialize", this).call(this, msg, transfers);
            var _data = this.data,
                vertexPositions = _data.vertexPositions,
                indices = _data.indices,
                vertexNormals = _data.vertexNormals,
                vertexAttributes = _data.vertexAttributes;

            msg['vertexPositions'] = vertexPositions;
            msg['indices'] = indices;
            msg['vertexNormals'] = vertexNormals;
            msg['vertexAttributes'] = vertexAttributes;
            var transferSet = new _Set();
            transferSet.add(vertexPositions.buffer);
            transferSet.add(indices.buffer);
            transferSet.add(vertexNormals.buffer);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(vertexAttributes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var data = _step.value;

                    transferSet.add(data.buffer);
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

            transfers.push.apply(transfers, _toConsumableArray(transferSet));
            this.data = null;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            var _data2 = this.data,
                vertexPositions = _data2.vertexPositions,
                indices = _data2.indices,
                vertexNormals = _data2.vertexNormals,
                vertexAttributes = _data2.vertexAttributes;

            var totalBytes = this.gpuMemoryBytes = vertexPositions.byteLength + indices.byteLength + vertexNormals.byteLength;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(vertexAttributes), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var data = _step2.value;

                    totalBytes += data.byteLength;
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.systemMemoryBytes = this.gpuMemoryBytes = totalBytes;
            _get(SingleMeshChunk.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }]);

    return SingleMeshChunk;
}(Chunk);
var singleMeshFactories = new _Map();
var singleMeshVertexAttributesFactories = new _Map();
export function registerSingleMeshFactory(name, factory) {
    singleMeshFactories.set(name, factory);
}
export function registerSingleMeshVertexAttributesFactory(name, factory) {
    singleMeshVertexAttributesFactories.set(name, factory);
}
var protocolPattern = /^(?:([a-zA-Z-+_]+):\/\/)?(.*)$/;
function getDataSource(factories, url) {
    var m = url.match(protocolPattern);
    if (m === null || m[1] === undefined) {
        throw new Error("Data source URL must have the form \"<protocol>://<path>\".");
    }
    var dataSource = m[1];
    var factory = factories.get(dataSource);
    if (factory === undefined) {
        throw new Error("Unsupported data source: " + _JSON$stringify(dataSource) + ".");
    }
    return [factory, m[2], dataSource];
}
export function getMesh(chunkManager, url, getPriority, cancellationToken) {
    var _getDataSource = getDataSource(singleMeshFactories, url),
        _getDataSource2 = _slicedToArray(_getDataSource, 2),
        factory = _getDataSource2[0],
        path = _getDataSource2[1];

    return factory.getMesh(chunkManager, path, getPriority, cancellationToken);
}
export function getMeshVertexAttributes(chunkManager, url, getPriority, cancellationToken) {
    var _getDataSource3 = getDataSource(singleMeshVertexAttributesFactories, url),
        _getDataSource4 = _slicedToArray(_getDataSource3, 2),
        factory = _getDataSource4[0],
        path = _getDataSource4[1];

    return factory.getMeshVertexAttributes(chunkManager, path, getPriority, cancellationToken);
}
export function getMinMax(array) {
    var min = Number.POSITIVE_INFINITY;
    var max = Number.NEGATIVE_INFINITY;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(array), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var value = _step3.value;

            min = Math.min(min, value);
            max = Math.max(max, value);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    return [min, max];
}
export function getCombinedMesh(chunkManager, parameters, getPriority, cancellationToken) {
    var promises = [getMesh(chunkManager, parameters.meshSourceUrl, getPriority, cancellationToken)];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = _getIterator(parameters.attributeSourceUrls), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var source = _step4.value;

            promises.push(getMeshVertexAttributes(chunkManager, source, getPriority, cancellationToken));
        }
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    return _Promise.all(promises).then(function (results) {
        var origMesh = results[0];
        var combinedMesh = {
            info: {
                numVertices: origMesh.info.numVertices,
                numTriangles: origMesh.info.numTriangles,
                vertexAttributes: []
            },
            vertexPositions: origMesh.vertexPositions,
            indices: origMesh.indices,
            vertexNormals: origMesh.vertexNormals,
            vertexAttributes: []
        };
        function addAttribute(info, data, source) {
            var _getMinMax = getMinMax(data),
                _getMinMax2 = _slicedToArray(_getMinMax, 2),
                min = _getMinMax2[0],
                max = _getMinMax2[1];

            combinedMesh.info.vertexAttributes.push({
                name: info.name,
                source: source,
                numComponents: info.numComponents,
                dataType: info.dataType,
                min: min,
                max: max
            });
            combinedMesh.vertexAttributes.push(data);
        }
        function addAttributes(info, data, source) {
            var numAttributes = info.length;
            for (var i = 0; i < numAttributes; ++i) {
                addAttribute(info[i], data[i], source);
            }
        }
        addAttributes(origMesh.info.vertexAttributes, origMesh.vertexAttributes);
        parameters.attributeSourceUrls.forEach(function (source, i) {
            var result = results[i + 1];
            if (result.numVertices !== origMesh.info.numVertices) {
                throw new Error("Vertex attribute source " + _JSON$stringify(source) + " specifies attributes for " + (result.numVertices + " vertices, but mesh has " + origMesh.info.numVertices + " vertices."));
            }
            addAttributes(result.attributeInfo, result.attributes, source);
        });
        return combinedMesh;
    });
}
var SingleMeshSource = function (_WithParameters) {
    _inherits(SingleMeshSource, _WithParameters);

    function SingleMeshSource() {
        _classCallCheck(this, SingleMeshSource);

        return _possibleConstructorReturn(this, (SingleMeshSource.__proto__ || _Object$getPrototypeOf(SingleMeshSource)).apply(this, arguments));
    }

    _createClass(SingleMeshSource, [{
        key: "getChunk",
        value: function getChunk() {
            var key = SINGLE_MESH_CHUNK_KEY;
            var chunk = this.chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(SingleMeshChunk);
                chunk.initialize(key);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }, {
        key: "download",
        value: function download(chunk, cancellationToken) {
            var _this3 = this;

            var getPriority = function getPriority() {
                return { priorityTier: chunk.priorityTier, priority: chunk.priority };
            };
            return getCombinedMesh(this.chunkManager, this.parameters, getPriority, cancellationToken).then(function (data) {
                if (stableStringify(data.info) !== stableStringify(_this3.parameters.info)) {
                    throw new Error("Mesh info has changed.");
                }
                if (data.vertexNormals === undefined) {
                    data.vertexNormals = computeVertexNormals(data.vertexPositions, data.indices);
                }
                chunk.data = data;
            });
        }
    }]);

    return SingleMeshSource;
}(WithParameters(ChunkSource, SingleMeshSourceParametersWithInfo));
SingleMeshSource = __decorate([registerSharedObject()], SingleMeshSource);
export { SingleMeshSource };
var SingleMeshLayerBase = withSharedVisibility(withChunkManager(SharedObjectCounterpart));
var SingleMeshLayer = function (_SingleMeshLayerBase) {
    _inherits(SingleMeshLayer, _SingleMeshLayerBase);

    function SingleMeshLayer(rpc, options) {
        _classCallCheck(this, SingleMeshLayer);

        var _this4 = _possibleConstructorReturn(this, (SingleMeshLayer.__proto__ || _Object$getPrototypeOf(SingleMeshLayer)).call(this, rpc, options));

        _this4.source = _this4.registerDisposer(rpc.getRef(options['source']));
        _this4.registerDisposer(_this4.chunkManager.recomputeChunkPriorities.add(function () {
            _this4.updateChunkPriorities();
        }));
        return _this4;
    }

    _createClass(SingleMeshLayer, [{
        key: "updateChunkPriorities",
        value: function updateChunkPriorities() {
            var visibility = this.visibility.value;
            if (visibility === Number.NEGATIVE_INFINITY) {
                return;
            }
            var priorityTier = getPriorityTier(visibility);
            var basePriority = getBasePriority(visibility);
            var source = this.source,
                chunkManager = this.chunkManager;

            var chunk = source.getChunk();
            chunkManager.requestChunk(chunk, priorityTier, basePriority + SINGLE_MESH_CHUNK_PRIORITY);
        }
    }]);

    return SingleMeshLayer;
}(SingleMeshLayerBase);
SingleMeshLayer = __decorate([registerSharedObject(SINGLE_MESH_LAYER_RPC_ID)], SingleMeshLayer);
export { SingleMeshLayer };
var INFO_PRIORITY = 1000;
registerPromiseRPC(GET_SINGLE_MESH_INFO_RPC_ID, function (x, cancellationToken) {
    var chunkManager = this.getRef(x['chunkManager']);
    try {
        var parameters = x['parameters'];
        return getCombinedMesh(chunkManager, parameters, function () {
            return { priorityTier: ChunkPriorityTier.VISIBLE, priority: INFO_PRIORITY };
        }, cancellationToken).then(function (mesh) {
            return { value: mesh.info };
        });
    } finally {
        chunkManager.dispose();
    }
});
//# sourceMappingURL=backend.js.map