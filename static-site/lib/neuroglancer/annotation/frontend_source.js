import _regeneratorRuntime from "babel-runtime/regenerator";
import _Symbol$iterator from "babel-runtime/core-js/symbol/iterator";
import _Map from "babel-runtime/core-js/map";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _get from "babel-runtime/helpers/get";
import _inherits from "babel-runtime/helpers/inherits";
import _getIterator from "babel-runtime/core-js/get-iterator";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _Object$defineProperty from "babel-runtime/core-js/object/define-property";
import _typeof from "babel-runtime/helpers/typeof";
import _Object$getOwnPropertyDescriptor from "babel-runtime/core-js/object/get-own-property-descriptor";
/**
 * @license
 * Copyright 2018 Google Inc.
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
import { AnnotationReference, annotationTypes, deserializeAnnotation, getAnnotationTypeHandler, makeAnnotationId } from "./index";
import { ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID, ANNOTATION_COMMIT_UPDATE_RPC_ID, ANNOTATION_GEOMETRY_CHUNK_SOURCE_RPC_ID, ANNOTATION_METADATA_CHUNK_SOURCE_RPC_ID, ANNOTATION_REFERENCE_ADD_RPC_ID, ANNOTATION_REFERENCE_DELETE_RPC_ID, ANNOTATION_SUBSET_GEOMETRY_CHUNK_SOURCE_RPC_ID } from "./base";
import { getAnnotationTypeRenderHandler } from "./type_handler";
import { Chunk, ChunkSource } from "../chunk_manager/frontend";
import { getObjectKey } from "../segmentation_display_state/base";
import { SliceViewChunk, SliceViewChunkSource } from "../sliceview/frontend";
import { RenderLayer } from "../sliceview/renderlayer";
import { StatusMessage } from "../status";
import { binarySearch } from "../util/array";
import { mat4 } from "../util/geom";
import { Signal, NullarySignal } from "../util/signal";
import { registerRPC, registerSharedObjectOwner, SharedObject } from "../worker_rpc";
export var AnnotationGeometryData = function () {
    function AnnotationGeometryData(x) {
        _classCallCheck(this, AnnotationGeometryData);

        this.bufferValid = false;
        this.data = x.data;
        var typeToIds = this.typeToIds = x.typeToIds;
        var numPickIds = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(annotationTypes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var annotationType = _step.value;

                numPickIds += getAnnotationTypeRenderHandler(annotationType).pickIdsPerInstance * typeToIds[annotationType].length;
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

        this.numPickIds = numPickIds;
        this.typeToOffset = x.typeToOffset;
    }

    _createClass(AnnotationGeometryData, [{
        key: "freeGPUMemory",
        value: function freeGPUMemory(gl) {
            gl;
            var buffer = this.buffer;

            if (buffer !== undefined) {
                buffer.dispose();
                this.bufferValid = false;
                this.buffer = undefined;
            }
        }
    }]);

    return AnnotationGeometryData;
}();
export var AnnotationSubsetGeometryChunk = function (_Chunk) {
    _inherits(AnnotationSubsetGeometryChunk, _Chunk);

    function AnnotationSubsetGeometryChunk(source, x) {
        _classCallCheck(this, AnnotationSubsetGeometryChunk);

        var _this = _possibleConstructorReturn(this, (AnnotationSubsetGeometryChunk.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunk)).call(this, source));

        _this.data = new AnnotationGeometryData(x);
        return _this;
    }

    _createClass(AnnotationSubsetGeometryChunk, [{
        key: "freeGPUMemory",
        value: function freeGPUMemory(gl) {
            _get(AnnotationSubsetGeometryChunk.prototype.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunk.prototype), "freeGPUMemory", this).call(this, gl);
            this.data.freeGPUMemory(gl);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.data = undefined;
        }
    }]);

    return AnnotationSubsetGeometryChunk;
}(Chunk);
export var AnnotationGeometryChunk = function (_SliceViewChunk) {
    _inherits(AnnotationGeometryChunk, _SliceViewChunk);

    function AnnotationGeometryChunk(source, x) {
        _classCallCheck(this, AnnotationGeometryChunk);

        var _this2 = _possibleConstructorReturn(this, (AnnotationGeometryChunk.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunk)).call(this, source, x));

        _this2.data = new AnnotationGeometryData(x);
        return _this2;
    }

    _createClass(AnnotationGeometryChunk, [{
        key: "freeGPUMemory",
        value: function freeGPUMemory(gl) {
            _get(AnnotationGeometryChunk.prototype.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunk.prototype), "freeGPUMemory", this).call(this, gl);
            this.data.freeGPUMemory(gl);
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.data = undefined;
        }
    }]);

    return AnnotationGeometryChunk;
}(SliceViewChunk);
var AnnotationGeometryChunkSource = function (_SliceViewChunkSource) {
    _inherits(AnnotationGeometryChunkSource, _SliceViewChunkSource);

    function AnnotationGeometryChunkSource(chunkManager, options) {
        _classCallCheck(this, AnnotationGeometryChunkSource);

        var _this3 = _possibleConstructorReturn(this, (AnnotationGeometryChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunkSource)).call(this, chunkManager, options));

        _this3.immediateChunkUpdates = true;
        _this3.parent = options.parent;
        _this3.parameters = options.parameters;
        _this3.spec = options.spec;
        return _this3;
    }

    _createClass(AnnotationGeometryChunkSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            options['parameters'] = this.parameters;
            options['parent'] = this.parent.rpcId;
            _get(AnnotationGeometryChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunkSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "addChunk",
        value: function addChunk(key, chunk) {
            _get(AnnotationGeometryChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunkSource.prototype), "addChunk", this).call(this, key, chunk);
            // TODO: process local deletions
        }
    }, {
        key: "getChunk",
        value: function getChunk(x) {
            return new AnnotationGeometryChunk(this, x);
        }
    }]);

    return AnnotationGeometryChunkSource;
}(SliceViewChunkSource);
AnnotationGeometryChunkSource = __decorate([registerSharedObjectOwner(ANNOTATION_GEOMETRY_CHUNK_SOURCE_RPC_ID)], AnnotationGeometryChunkSource);
export { AnnotationGeometryChunkSource };
var AnnotationSubsetGeometryChunkSource = function (_ChunkSource) {
    _inherits(AnnotationSubsetGeometryChunkSource, _ChunkSource);

    function AnnotationSubsetGeometryChunkSource(chunkManager, parent) {
        _classCallCheck(this, AnnotationSubsetGeometryChunkSource);

        var _this4 = _possibleConstructorReturn(this, (AnnotationSubsetGeometryChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunkSource)).call(this, chunkManager, {}));

        _this4.parent = parent;
        _this4.immediateChunkUpdates = true;
        return _this4;
    }

    _createClass(AnnotationSubsetGeometryChunkSource, [{
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            options['parent'] = this.parent.rpcId;
            _get(AnnotationSubsetGeometryChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunkSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "addChunk",
        value: function addChunk(key, chunk) {
            _get(AnnotationSubsetGeometryChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunkSource.prototype), "addChunk", this).call(this, key, chunk);
            // TODO: process local deletions
        }
    }, {
        key: "getChunk",
        value: function getChunk(x) {
            return new AnnotationSubsetGeometryChunk(this, x);
        }
    }]);

    return AnnotationSubsetGeometryChunkSource;
}(ChunkSource);
AnnotationSubsetGeometryChunkSource = __decorate([registerSharedObjectOwner(ANNOTATION_SUBSET_GEOMETRY_CHUNK_SOURCE_RPC_ID)], AnnotationSubsetGeometryChunkSource);
export { AnnotationSubsetGeometryChunkSource };
export var AnnotationMetadataChunk = function (_Chunk2) {
    _inherits(AnnotationMetadataChunk, _Chunk2);

    function AnnotationMetadataChunk(source, x) {
        _classCallCheck(this, AnnotationMetadataChunk);

        var _this5 = _possibleConstructorReturn(this, (AnnotationMetadataChunk.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunk)).call(this, source));

        _this5.annotation = deserializeAnnotation(x.annotation);
        return _this5;
    }

    return AnnotationMetadataChunk;
}(Chunk);
var AnnotationMetadataChunkSource = function (_ChunkSource2) {
    _inherits(AnnotationMetadataChunkSource, _ChunkSource2);

    function AnnotationMetadataChunkSource(chunkManager, parent) {
        _classCallCheck(this, AnnotationMetadataChunkSource);

        var _this6 = _possibleConstructorReturn(this, (AnnotationMetadataChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunkSource)).call(this, chunkManager));

        _this6.parent = parent;
        return _this6;
    }

    _createClass(AnnotationMetadataChunkSource, [{
        key: "getChunk",
        value: function getChunk(x) {
            return new AnnotationMetadataChunk(this, x);
        }
    }, {
        key: "addChunk",
        value: function addChunk(key, chunk) {
            _get(AnnotationMetadataChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunkSource.prototype), "addChunk", this).call(this, key, chunk);
            var references = this.parent.references;

            var reference = references.get(key);
            if (reference !== undefined) {
                reference.value = chunk.annotation;
                reference.changed.dispatch();
            }
        }
    }, {
        key: "deleteChunk",
        value: function deleteChunk(key) {
            var references = this.parent.references;

            var reference = references.get(key);
            if (reference !== undefined) {
                reference.value = undefined;
                reference.changed.dispatch();
            }
        }
    }, {
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            options['parent'] = this.parent.rpcId;
            _get(AnnotationMetadataChunkSource.prototype.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunkSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }]);

    return AnnotationMetadataChunkSource;
}(ChunkSource);
AnnotationMetadataChunkSource = __decorate([registerSharedObjectOwner(ANNOTATION_METADATA_CHUNK_SOURCE_RPC_ID)], AnnotationMetadataChunkSource);
export { AnnotationMetadataChunkSource };
function updateAnnotation(chunk, annotation) {
    // Find insertion point.
    var type = annotation.type;
    var ids = chunk.typeToIds[type];
    var handler = getAnnotationTypeHandler(type);
    var numBytes = handler.serializedBytes;
    var renderHandler = getAnnotationTypeRenderHandler(type);
    var insertionPoint = binarySearch(ids, annotation.id, function (a, b) {
        return a < b ? -1 : a === b ? 0 : 1;
    });
    var offset = 0;
    if (insertionPoint < 0) {
        // Doesn't already exist.
        insertionPoint = ~insertionPoint;
        ids.splice(insertionPoint, 0, annotation.id);
        var newData = new Uint8Array(chunk.data.length + numBytes);
        chunk.numPickIds += renderHandler.pickIdsPerInstance;
        offset = chunk.typeToOffset[type] + numBytes * insertionPoint;
        newData.set(chunk.data.subarray(0, offset), 0);
        newData.set(chunk.data.subarray(offset), offset + numBytes);
        chunk.data = newData;
    } else {
        offset = chunk.typeToOffset[type] + handler.serializedBytes * insertionPoint;
    }
    var serializer = handler.serializer(chunk.data.buffer, chunk.typeToOffset[type], ids.length);
    serializer(annotation, insertionPoint);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = _getIterator(annotationTypes), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var otherType = _step2.value;

            if (otherType > type) {
                chunk.typeToOffset[otherType] += numBytes;
            }
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

    chunk.bufferValid = false;
}
function deleteAnnotation(chunk, type, id) {
    var ids = chunk.typeToIds[type];
    var handler = getAnnotationTypeRenderHandler(type);
    var numBytes = handler.bytes;
    var insertionPoint = binarySearch(ids, id, function (a, b) {
        return a < b ? -1 : a === b ? 0 : 1;
    });
    if (insertionPoint < 0) {
        return false;
    }
    chunk.numPickIds -= handler.pickIdsPerInstance;
    ids.splice(insertionPoint, 1);
    var offset = chunk.typeToOffset[type] + handler.bytes * insertionPoint;
    var newData = new Uint8Array(chunk.data.length - numBytes);
    newData.set(chunk.data.subarray(0, offset), 0);
    newData.set(chunk.data.subarray(offset + numBytes), offset);
    chunk.data = newData;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(annotationTypes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var otherType = _step3.value;

            if (otherType > type) {
                chunk.typeToOffset[otherType] -= numBytes;
            }
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

    chunk.bufferValid = false;
    return true;
}
function makeTemporaryChunk() {
    var typeToIds = [];
    var typeToOffset = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = _getIterator(annotationTypes), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var annotationType = _step4.value;

            typeToIds[annotationType] = [];
            typeToOffset[annotationType] = 0;
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

    return new AnnotationGeometryChunk(undefined, { data: new Uint8Array(0), numPickIds: 0, typeToOffset: typeToOffset, typeToIds: typeToIds });
}
export var MultiscaleAnnotationSource = function (_SharedObject) {
    _inherits(MultiscaleAnnotationSource, _SharedObject);

    function MultiscaleAnnotationSource(chunkManager, options) {
        _classCallCheck(this, MultiscaleAnnotationSource);

        var _this7 = _possibleConstructorReturn(this, (MultiscaleAnnotationSource.__proto__ || _Object$getPrototypeOf(MultiscaleAnnotationSource)).call(this));

        _this7.chunkManager = chunkManager;
        _this7.metadataChunkSource = _this7.registerDisposer(new AnnotationMetadataChunkSource(_this7.chunkManager, _this7));
        _this7.objectToLocal = mat4.create();
        _this7.temporary = makeTemporaryChunk();
        _this7.references = new _Map();
        _this7.localUpdates = new _Map();
        _this7.numCommitsInProgress = 0;
        // FIXME
        _this7.changed = new NullarySignal();
        _this7.readonly = false;
        _this7.childAdded = new Signal();
        _this7.childUpdated = new Signal();
        _this7.childDeleted = new Signal();
        console.log(options);
        _this7.sources = options.sourceSpecifications.map(function (alternatives) {
            return alternatives.map(function (_ref) {
                var parameters = _ref.parameters,
                    spec = _ref.spec;
                return _this7.registerDisposer(new AnnotationGeometryChunkSource(chunkManager, { spec: spec, parameters: parameters, parent: _this7 }));
            });
        });
        _this7.segmentFilteredSource = _this7.registerDisposer(new AnnotationSubsetGeometryChunkSource(chunkManager, _this7));
        return _this7;
    }

    _createClass(MultiscaleAnnotationSource, [{
        key: "getSources",
        value: function getSources(_options) {
            var sources = this.sources;

            sources.forEach(function (alternatives) {
                return alternatives.forEach(function (source) {
                    return source.addRef();
                });
            });
            return sources;
        }
    }, {
        key: "initializeCounterpart",
        value: function initializeCounterpart(rpc, options) {
            this.metadataChunkSource.initializeCounterpart(rpc, {});
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(this.sources), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var alternatives = _step5.value;
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                        for (var _iterator6 = _getIterator(alternatives), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            var source = _step6.value;

                            source.initializeCounterpart(rpc, {});
                        }
                    } catch (err) {
                        _didIteratorError6 = true;
                        _iteratorError6 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }
                        } finally {
                            if (_didIteratorError6) {
                                throw _iteratorError6;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            this.segmentFilteredSource.initializeCounterpart(rpc, {});
            options.segmentFilteredSource = this.segmentFilteredSource.addCounterpartRef();
            options.metadataChunkSource = this.metadataChunkSource.addCounterpartRef();
            options.sources = this.sources.map(function (alternatives) {
                return alternatives.map(function (source) {
                    return source.addCounterpartRef();
                });
            });
            options.chunkManager = this.chunkManager.rpcId;
            _get(MultiscaleAnnotationSource.prototype.__proto__ || _Object$getPrototypeOf(MultiscaleAnnotationSource.prototype), "initializeCounterpart", this).call(this, rpc, options);
        }
    }, {
        key: "add",
        value: function add(annotation) {
            var _this8 = this;

            var commit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            annotation.id = makeAnnotationId();
            var reference = new AnnotationReference(annotation.id);
            reference.value = annotation;
            this.references.set(reference.id, reference);
            reference.registerDisposer(function () {
                _this8.references.delete(reference.id);
            });
            this.applyLocalUpdate(reference, /*existing=*/false, /*commit=*/commit, /*newAnnotation=*/annotation);
            return reference;
        }
    }, {
        key: "applyLocalUpdate",
        value: function applyLocalUpdate(reference, existing, commit, newAnnotation) {
            var localUpdates = this.localUpdates;
            var id = reference.id;

            var localUpdate = this.localUpdates.get(id);
            var annotation = reference.value;
            if (annotation == null) {
                throw new Error("Cannot create local update from null annotation");
            }
            if (localUpdate === undefined) {
                localUpdate = {
                    type: annotation.type,
                    reference: reference.addRef(),
                    existingAnnotation: existing ? annotation : undefined,
                    pendingCommit: undefined,
                    commitInProgress: undefined
                };
                localUpdates.set(id, localUpdate);
                this.forEachPossibleChunk(annotation, function (chunk) {
                    deleteAnnotation(chunk.data, annotation.type, id);
                });
                if (newAnnotation !== null) {
                    // Add to temporary chunk.
                    updateAnnotation(this.temporary.data, newAnnotation);
                }
            } else {
                if (newAnnotation === null) {
                    // Annotation has a local update already, so we need to delete it from the temporary chunk.
                    deleteAnnotation(this.temporary.data, annotation.type, annotation.id);
                } else {
                    // Modify existing entry in temporary chunk.
                    updateAnnotation(this.temporary.data, newAnnotation);
                }
                reference.value = newAnnotation;
            }
            if (commit) {
                if (localUpdate.commitInProgress !== undefined) {
                    localUpdate.pendingCommit = newAnnotation;
                } else {
                    if (newAnnotation === null && localUpdate.existingAnnotation === undefined) {
                        // Local update, which we would now like to delete, has never been committed.
                        // Therefore we can just delete it locally.
                        localUpdates.delete(id);
                        localUpdate.reference.dispose();
                        return;
                    }
                    this.sendCommitRequest(localUpdate, newAnnotation);
                }
            }
            this.notifyChanged(reference.id, newAnnotation || undefined);
        }
    }, {
        key: "sendCommitRequest",
        value: function sendCommitRequest(localUpdate, newAnnotation) {
            this.updateCommitsInProgress(1);
            localUpdate.commitInProgress = newAnnotation;
            this.rpc.invoke(ANNOTATION_COMMIT_UPDATE_RPC_ID, {
                id: this.rpcId,
                annotationId: localUpdate.existingAnnotation && localUpdate.reference.id,
                newAnnotation: newAnnotation
            });
        }
    }, {
        key: "delete",
        value: function _delete(reference) {
            this.applyLocalUpdate(reference, /*existing=*/true, /*commit=*/true, /*newAnnotation=*/null);
        }
    }, {
        key: "update",
        value: function update(reference, newAnnotation) {
            this.applyLocalUpdate(reference, /*existing=*/true, /*commit=*/false, /*newAnnotation=*/newAnnotation);
        }
    }, {
        key: "notifyChanged",
        value: function notifyChanged(id, annotation) {
            var reference = this.references.get(id);
            var chunk = this.metadataChunkSource.chunks.get(id);
            if (chunk !== undefined) {
                chunk.annotation = annotation || null;
            }
            if (reference !== undefined) {
                reference.value = annotation || null;
                reference.changed.dispatch();
            }
            this.chunkManager.chunkQueueManager.visibleChunksChanged.dispatch();
        }
        /**
         * Must be called after `add` or `update` to commit the result.
         */

    }, {
        key: "commit",
        value: function commit(reference) {
            this.applyLocalUpdate(reference, /*existing=*/true, /*commit=*/true, reference.value);
        }
    }, {
        key: "getReference",
        value: function getReference(id) {
            var _this9 = this;

            var existing = this.references.get(id);
            if (existing !== undefined) {
                return existing.addRef();
            }
            existing = new AnnotationReference(id);
            this.references.set(id, existing);
            this.rpc.invoke(ANNOTATION_REFERENCE_ADD_RPC_ID, { id: this.rpcId, annotation: id });
            existing.registerDisposer(function () {
                _this9.references.delete(id);
                _this9.rpc.invoke(ANNOTATION_REFERENCE_DELETE_RPC_ID, { id: _this9.rpcId, annotation: id });
            });
            var chunk = this.metadataChunkSource.chunks.get(id);
            if (chunk !== undefined) {
                existing.value = chunk.annotation;
            }
            return existing;
        }
    }, {
        key: "forEachPossibleChunk",
        value: function forEachPossibleChunk(annotation, callback) {
            var sources = this.sources;

            if (sources.length !== 1 || sources[0].length !== 1) {
                throw new Error('Not implemented');
            }
            var source = sources[0][0];
            if (source.chunks.size > 1) {
                throw new Error('Not implemented');
            }
            annotation;
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = _getIterator(source.chunks.values()), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var chunk = _step7.value;

                    callback(chunk);
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }

            var segments = annotation.segments;

            if (segments === undefined || segments.length === 0) {
                return;
            }
            var segmentFilteredSource = this.segmentFilteredSource;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(segments), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var segment = _step8.value;

                    var _chunk = segmentFilteredSource.chunks.get(getObjectKey(segment));
                    if (_chunk === undefined) {
                        continue;
                    }
                    callback(_chunk);
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }
        }
    }, {
        key: "handleSuccessfulUpdate",
        value: function handleSuccessfulUpdate(id, newAnnotation) {
            var localUpdate = this.localUpdates.get(id);
            if (localUpdate === undefined || localUpdate.commitInProgress === undefined) {
                throw new Error("Received invalid successful update notification");
            }
            this.updateCommitsInProgress(-1);
            if (newAnnotation !== null && localUpdate.reference.id !== newAnnotation.id) {
                if (localUpdate.commitInProgress === null) {
                    throw new Error("Received invalid successful update notification");
                }
                localUpdate.reference.id = newAnnotation.id;
                this.references.delete(id);
                this.references.set(newAnnotation.id, localUpdate.reference);
                this.localUpdates.delete(id);
                this.localUpdates.set(newAnnotation.id, localUpdate);
                if (localUpdate.reference.value !== null) {
                    localUpdate.reference.value.id = newAnnotation.id;
                    deleteAnnotation(this.temporary.data, localUpdate.type, id);
                    updateAnnotation(this.temporary.data, localUpdate.reference.value);
                }
                localUpdate.reference.changed.dispatch();
            }
            localUpdate.existingAnnotation = newAnnotation || undefined;
            localUpdate.commitInProgress = undefined;
            var pendingCommit = localUpdate.pendingCommit;

            localUpdate.pendingCommit = undefined;
            if (newAnnotation === null) {
                pendingCommit = undefined;
            }
            if (pendingCommit !== undefined) {
                if (pendingCommit !== null) {
                    pendingCommit.id = newAnnotation.id;
                }
                this.sendCommitRequest(localUpdate, pendingCommit);
            } else {
                this.revertLocalUpdate(localUpdate);
            }
        }
    }, {
        key: "disposed",
        value: function disposed() {
            var commitStatus = this.commitStatus;

            if (commitStatus !== undefined) {
                commitStatus.dispose();
            }
        }
    }, {
        key: "updateCommitsInProgress",
        value: function updateCommitsInProgress(amount) {
            this.numCommitsInProgress += amount;
            if (this.numCommitsInProgress === 0) {
                if (this.commitStatus !== undefined) {
                    this.commitStatus.dispose();
                    this.commitStatus = undefined;
                }
            } else if (this.commitStatus === undefined) {
                var status = this.commitStatus = new StatusMessage( /*delay=*/true);
                status.setText('Commiting annotations');
            }
        }
    }, {
        key: "handleFailedUpdate",
        value: function handleFailedUpdate(id, message) {
            var localUpdate = this.localUpdates.get(id);
            if (localUpdate === undefined || localUpdate.commitInProgress === undefined) {
                throw new Error("Received invalid update notification");
            }
            var status = new StatusMessage();
            status.setErrorMessage("Error commiting annotation update: " + message);
            this.revertLocalUpdate(localUpdate);
            this.updateCommitsInProgress(-1);
        }
    }, {
        key: "revertLocalUpdate",
        value: function revertLocalUpdate(localUpdate) {
            deleteAnnotation(this.temporary.data, localUpdate.type, localUpdate.reference.id);
            var existingAnnotation = localUpdate.existingAnnotation;

            if (existingAnnotation !== undefined) {
                this.forEachPossibleChunk(existingAnnotation, function (chunk) {
                    updateAnnotation(chunk.data, existingAnnotation);
                });
            }
            var reference = localUpdate.reference;
            var id = reference.id;

            reference.value = existingAnnotation || null;
            reference.changed.dispatch();
            reference.dispose();
            this.localUpdates.delete(id);
        }
    }, {
        key: _Symbol$iterator,
        value: /*#__PURE__*/_regeneratorRuntime.mark(function value() {
            return _regeneratorRuntime.wrap(function value$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                        case "end":
                            return _context.stop();
                    }
                }
            }, value, this);
        })
    }], [{
        key: "encodeOptions",
        value: function encodeOptions(_options) {
            return {};
        }
    }]);

    return MultiscaleAnnotationSource;
}(SharedObject);
registerRPC(ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID, function (x) {
    var source = this.get(x.id);
    var annotationId = x.annotationId;
    var error = x.error;
    if (error !== undefined) {
        source.handleFailedUpdate(annotationId, error);
    } else {
        var newAnnotation = deserializeAnnotation(x.newAnnotation);
        source.handleSuccessfulUpdate(annotationId, newAnnotation);
    }
});
export var DataFetchSliceViewRenderLayer = function (_RenderLayer) {
    _inherits(DataFetchSliceViewRenderLayer, _RenderLayer);

    function DataFetchSliceViewRenderLayer(multiscaleSource) {
        _classCallCheck(this, DataFetchSliceViewRenderLayer);

        return _possibleConstructorReturn(this, (DataFetchSliceViewRenderLayer.__proto__ || _Object$getPrototypeOf(DataFetchSliceViewRenderLayer)).call(this, multiscaleSource.chunkManager, multiscaleSource.getSources({}), {}));
    }
    // Does nothing.


    _createClass(DataFetchSliceViewRenderLayer, [{
        key: "draw",
        value: function draw() {}
    }]);

    return DataFetchSliceViewRenderLayer;
}(RenderLayer);
//# sourceMappingURL=frontend_source.js.map