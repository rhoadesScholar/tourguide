import _Object$assign from "babel-runtime/core-js/object/assign";
import _getIterator from "babel-runtime/core-js/get-iterator";
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
import { deserializeAnnotation } from "./index";
import { ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID, ANNOTATION_COMMIT_UPDATE_RPC_ID, ANNOTATION_GEOMETRY_CHUNK_SOURCE_RPC_ID, ANNOTATION_METADATA_CHUNK_SOURCE_RPC_ID, ANNOTATION_PERSPECTIVE_RENDER_LAYER_RPC_ID, ANNOTATION_REFERENCE_ADD_RPC_ID, ANNOTATION_REFERENCE_DELETE_RPC_ID, ANNOTATION_RENDER_LAYER_RPC_ID, ANNOTATION_RENDER_LAYER_UPDATE_SEGMENTATION_RPC_ID, ANNOTATION_SUBSET_GEOMETRY_CHUNK_SOURCE_RPC_ID, AnnotationGeometryChunkSpecification } from "./base";
import { Chunk, ChunkSource, withChunkManager } from "../chunk_manager/backend";
import { ChunkPriorityTier } from "../chunk_manager/base";
import { PerspectiveViewRenderLayer } from "../perspective_view/backend";
import { forEachVisibleSegment, getObjectKey } from "../segmentation_display_state/base";
import { SliceViewChunk, SliceViewChunkSource } from "../sliceview/backend";
import { registerNested, WatchableValue } from "../trackable_value";
import { kZeroVec } from "../util/geom";
import { getBasePriority, getPriorityTier } from "../visibility_priority/backend";
import { withSharedVisibility } from "../visibility_priority/backend";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "../worker_rpc";
var ANNOTATION_METADATA_CHUNK_PRIORITY = 200;
var ANNOTATION_SEGMENT_FILTERED_CHUNK_PRIORITY = 60;
export var AnnotationMetadataChunk = function (_Chunk) {
    _inherits(AnnotationMetadataChunk, _Chunk);

    function AnnotationMetadataChunk() {
        _classCallCheck(this, AnnotationMetadataChunk);

        return _possibleConstructorReturn(this, (AnnotationMetadataChunk.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunk)).apply(this, arguments));
    }

    _createClass(AnnotationMetadataChunk, [{
        key: "freeSystemMemory",
        value: function freeSystemMemory() {
            this.annotation = undefined;
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(AnnotationMetadataChunk.prototype.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunk.prototype), "serialize", this).call(this, msg, transfers);
            msg.annotation = this.annotation;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            this.systemMemoryBytes = this.gpuMemoryBytes = 0;
            _get(AnnotationMetadataChunk.prototype.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }]);

    return AnnotationMetadataChunk;
}(Chunk);
export var AnnotationGeometryData = function () {
    function AnnotationGeometryData() {
        _classCallCheck(this, AnnotationGeometryData);
    }

    _createClass(AnnotationGeometryData, [{
        key: "serialize",
        value: function serialize(msg, transfers) {
            msg.data = this.data;
            msg.typeToOffset = this.typeToOffset;
            msg.typeToIds = this.typeToIds;
            msg.segmentList = this.segmentList;
            msg.segmentListIndex = this.segmentListIndex;
            transfers.push(this.data.buffer, this.segmentList.buffer, this.segmentListIndex.buffer);
        }
    }, {
        key: "numBytes",
        get: function get() {
            return this.data.byteLength;
        }
    }]);

    return AnnotationGeometryData;
}();
function GeometryChunkMixin(Base) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            _classCallCheck(this, C);

            return _possibleConstructorReturn(this, (C.__proto__ || _Object$getPrototypeOf(C)).apply(this, arguments));
        }

        _createClass(C, [{
            key: "serialize",
            value: function serialize(msg, transfers) {
                _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), "serialize", this).call(this, msg, transfers);
                this.data.serialize(msg, transfers);
                this.data = undefined;
            }
        }, {
            key: "downloadSucceeded",
            value: function downloadSucceeded() {
                this.systemMemoryBytes = this.gpuMemoryBytes = this.data.numBytes;
                _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), "downloadSucceeded", this).call(this);
            }
        }, {
            key: "freeSystemMemory",
            value: function freeSystemMemory() {
                this.data = undefined;
            }
        }]);

        return C;
    }(Base);

    return C;
}
export var AnnotationGeometryChunk = function (_GeometryChunkMixin) {
    _inherits(AnnotationGeometryChunk, _GeometryChunkMixin);

    function AnnotationGeometryChunk() {
        _classCallCheck(this, AnnotationGeometryChunk);

        return _possibleConstructorReturn(this, (AnnotationGeometryChunk.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunk)).apply(this, arguments));
    }

    return AnnotationGeometryChunk;
}(GeometryChunkMixin(SliceViewChunk));
export var AnnotationSubsetGeometryChunk = function (_GeometryChunkMixin2) {
    _inherits(AnnotationSubsetGeometryChunk, _GeometryChunkMixin2);

    function AnnotationSubsetGeometryChunk() {
        _classCallCheck(this, AnnotationSubsetGeometryChunk);

        return _possibleConstructorReturn(this, (AnnotationSubsetGeometryChunk.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunk)).apply(this, arguments));
    }

    return AnnotationSubsetGeometryChunk;
}(GeometryChunkMixin(Chunk));
var AnnotationMetadataChunkSource = function (_ChunkSource) {
    _inherits(AnnotationMetadataChunkSource, _ChunkSource);

    function AnnotationMetadataChunkSource() {
        _classCallCheck(this, AnnotationMetadataChunkSource);

        var _this5 = _possibleConstructorReturn(this, (AnnotationMetadataChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationMetadataChunkSource)).apply(this, arguments));

        _this5.parent = undefined;
        return _this5;
    }

    _createClass(AnnotationMetadataChunkSource, [{
        key: "getChunk",
        value: function getChunk(id) {
            var chunks = this.chunks;

            var chunk = chunks.get(id);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(AnnotationMetadataChunk);
                chunk.initialize(id);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }, {
        key: "download",
        value: function download(chunk, cancellationToken) {
            return this.parent.downloadMetadata(chunk, cancellationToken);
        }
    }]);

    return AnnotationMetadataChunkSource;
}(ChunkSource);
AnnotationMetadataChunkSource = __decorate([registerSharedObject(ANNOTATION_METADATA_CHUNK_SOURCE_RPC_ID)], AnnotationMetadataChunkSource);
var AnnotationGeometryChunkSource = function (_SliceViewChunkSource) {
    _inherits(AnnotationGeometryChunkSource, _SliceViewChunkSource);

    function AnnotationGeometryChunkSource(rpc, options) {
        _classCallCheck(this, AnnotationGeometryChunkSource);

        var _this6 = _possibleConstructorReturn(this, (AnnotationGeometryChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationGeometryChunkSource)).call(this, rpc, options));

        _this6.parent = undefined;
        _this6.spec = new AnnotationGeometryChunkSpecification(options.spec);
        return _this6;
    }

    _createClass(AnnotationGeometryChunkSource, [{
        key: "download",
        value: function download(chunk, cancellationToken) {
            return this.parent.downloadGeometry(chunk, cancellationToken);
        }
    }]);

    return AnnotationGeometryChunkSource;
}(SliceViewChunkSource);
AnnotationGeometryChunkSource = __decorate([registerSharedObject(ANNOTATION_GEOMETRY_CHUNK_SOURCE_RPC_ID)], AnnotationGeometryChunkSource);
AnnotationGeometryChunkSource.prototype.chunkConstructor = AnnotationGeometryChunk;
var AnnotationSubsetGeometryChunkSource = function (_ChunkSource2) {
    _inherits(AnnotationSubsetGeometryChunkSource, _ChunkSource2);

    function AnnotationSubsetGeometryChunkSource(rpc, options) {
        _classCallCheck(this, AnnotationSubsetGeometryChunkSource);

        var _this7 = _possibleConstructorReturn(this, (AnnotationSubsetGeometryChunkSource.__proto__ || _Object$getPrototypeOf(AnnotationSubsetGeometryChunkSource)).call(this, rpc, options));

        _this7.parent = undefined;
        return _this7;
    }

    _createClass(AnnotationSubsetGeometryChunkSource, [{
        key: "getChunk",
        value: function getChunk(objectId) {
            var key = getObjectKey(objectId);
            var chunks = this.chunks;

            var chunk = chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(AnnotationSubsetGeometryChunk);
                chunk.initialize(key);
                chunk.objectId = objectId.clone();
                this.addChunk(chunk);
            }
            return chunk;
        }
    }, {
        key: "download",
        value: function download(chunk, cancellationToken) {
            return this.parent.downloadSegmentFilteredGeometry(chunk, cancellationToken);
        }
    }]);

    return AnnotationSubsetGeometryChunkSource;
}(ChunkSource);
AnnotationSubsetGeometryChunkSource = __decorate([registerSharedObject(ANNOTATION_SUBSET_GEOMETRY_CHUNK_SOURCE_RPC_ID)], AnnotationSubsetGeometryChunkSource);
export var AnnotationSource = function (_SharedObjectCounterp) {
    _inherits(AnnotationSource, _SharedObjectCounterp);

    function AnnotationSource(rpc, options) {
        _classCallCheck(this, AnnotationSource);

        var _this8 = _possibleConstructorReturn(this, (AnnotationSource.__proto__ || _Object$getPrototypeOf(AnnotationSource)).call(this, rpc, options));

        _this8.references = new _Set();
        console.log('constructinng backend annotation source');
        var chunkManager = _this8.chunkManager = rpc.get(options.chunkManager);
        var metadataChunkSource = _this8.metadataChunkSource = _this8.registerDisposer(rpc.getRef(options.metadataChunkSource));
        _this8.sources = options.sources.map(function (alternatives) {
            return alternatives.map(function (id) {
                var source = _this8.registerDisposer(rpc.getRef(id));
                source.parent = _this8;
                return source;
            });
        });
        _this8.segmentFilteredSource = _this8.registerDisposer(rpc.getRef(options.segmentFilteredSource));
        _this8.segmentFilteredSource.parent = _this8;
        metadataChunkSource.parent = _this8;
        _this8.registerDisposer(chunkManager.recomputeChunkPriorities.add(function () {
            return _this8.recomputeChunkPriorities();
        }));
        return _this8;
    }

    _createClass(AnnotationSource, [{
        key: "recomputeChunkPriorities",
        value: function recomputeChunkPriorities() {
            var chunkManager = this.chunkManager,
                metadataChunkSource = this.metadataChunkSource;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.references), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var id = _step.value;

                    chunkManager.requestChunk(metadataChunkSource.getChunk(id), ChunkPriorityTier.VISIBLE, ANNOTATION_METADATA_CHUNK_PRIORITY);
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
        }
    }, {
        key: "add",
        value: function add(annotation) {
            annotation;
            throw new Error('Not implemented');
        }
    }, {
        key: "delete",
        value: function _delete(id) {
            id;
            throw new Error('Not implemented');
        }
    }, {
        key: "update",
        value: function update(id, newAnnotation) {
            id;
            newAnnotation;
            throw new Error('Not implemented');
        }
    }]);

    return AnnotationSource;
}(SharedObjectCounterpart);
registerRPC(ANNOTATION_REFERENCE_ADD_RPC_ID, function (x) {
    var obj = this.get(x.id);
    obj.references.add(x.annotation);
    obj.chunkManager.scheduleUpdateChunkPriorities();
});
registerRPC(ANNOTATION_REFERENCE_DELETE_RPC_ID, function (x) {
    var obj = this.get(x.id);
    obj.references.delete(x.annotation);
    obj.chunkManager.scheduleUpdateChunkPriorities();
});
registerRPC(ANNOTATION_COMMIT_UPDATE_RPC_ID, function (x) {
    var _this9 = this;

    var obj = this.get(x.id);
    var annotationId = x.annotationId;
    var newAnnotation = deserializeAnnotation(x.newAnnotation);
    var promise = void 0;
    if (annotationId === undefined) {
        promise = obj.add(newAnnotation).then(function (id) {
            return _Object$assign({}, newAnnotation, { id: id });
        });
    } else if (newAnnotation === null) {
        promise = obj.delete(annotationId).then(function () {
            return null;
        });
    } else {
        promise = obj.update(annotationId, newAnnotation).then(function () {
            return newAnnotation;
        });
    }
    // FIXME: Handle new chunks requested prior to update but not yet sent to frontend.
    promise.then(function (result) {
        if (!obj.wasDisposed) {
            _this9.invoke(ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID, {
                id: obj.rpcId,
                annotationId: annotationId || newAnnotation.id,
                newAnnotation: result
            });
        }
    }, function (error) {
        if (!obj.wasDisposed) {
            _this9.invoke(ANNOTATION_COMMIT_UPDATE_RESULT_RPC_ID, { id: obj.rpcId, annotationId: annotationId, error: error.message });
        }
    });
});
var AnnotationPerspectiveRenderLayer = function (_PerspectiveViewRende) {
    _inherits(AnnotationPerspectiveRenderLayer, _PerspectiveViewRende);

    function AnnotationPerspectiveRenderLayer(rpc, options) {
        _classCallCheck(this, AnnotationPerspectiveRenderLayer);

        var _this10 = _possibleConstructorReturn(this, (AnnotationPerspectiveRenderLayer.__proto__ || _Object$getPrototypeOf(AnnotationPerspectiveRenderLayer)).call(this, rpc, options));

        _this10.source = rpc.get(options.source);
        _this10.filterBySegmentation = rpc.get(options.filterBySegmentation);
        _this10.viewStates.changed.add(function () {
            return _this10.source.chunkManager.scheduleUpdateChunkPriorities();
        });
        _this10.filterBySegmentation.changed.add(function () {
            return _this10.source.chunkManager.scheduleUpdateChunkPriorities();
        });
        _this10.registerDisposer(_this10.source.chunkManager.recomputeChunkPriorities.add(function () {
            return _this10.recomputeChunkPriorities();
        }));
        return _this10;
    }

    _createClass(AnnotationPerspectiveRenderLayer, [{
        key: "recomputeChunkPriorities",
        value: function recomputeChunkPriorities() {
            var source = this.source;

            if (this.filterBySegmentation.value) {
                return;
            }
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.viewStates), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var state = _step2.value;

                    var visibility = state.visibility.value;
                    if (visibility === Number.NEGATIVE_INFINITY) {
                        continue;
                    }
                    var priorityTier = getPriorityTier(visibility);
                    var basePriority = getBasePriority(visibility);
                    // FIXME: priority should be based on location
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = _getIterator(source.sources), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var alternatives = _step3.value;
                            var _iteratorNormalCompletion4 = true;
                            var _didIteratorError4 = false;
                            var _iteratorError4 = undefined;

                            try {
                                for (var _iterator4 = _getIterator(alternatives), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                    var geometrySource = _step4.value;

                                    var chunk = geometrySource.getChunk(kZeroVec);
                                    source.chunkManager.requestChunk(chunk, priorityTier, basePriority);
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
        }
    }]);

    return AnnotationPerspectiveRenderLayer;
}(PerspectiveViewRenderLayer);
AnnotationPerspectiveRenderLayer = __decorate([registerSharedObject(ANNOTATION_PERSPECTIVE_RENDER_LAYER_RPC_ID)], AnnotationPerspectiveRenderLayer);
AnnotationPerspectiveRenderLayer;
var AnnotationLayerSharedObjectCounterpart = function (_withSharedVisibility) {
    _inherits(AnnotationLayerSharedObjectCounterpart, _withSharedVisibility);

    function AnnotationLayerSharedObjectCounterpart(rpc, options) {
        _classCallCheck(this, AnnotationLayerSharedObjectCounterpart);

        var _this11 = _possibleConstructorReturn(this, (AnnotationLayerSharedObjectCounterpart.__proto__ || _Object$getPrototypeOf(AnnotationLayerSharedObjectCounterpart)).call(this, rpc, options));

        _this11.segmentationState = new WatchableValue(undefined);
        _this11.source = rpc.get(options.source);
        _this11.segmentationState.value = _this11.getSegmentationState(options.segmentationState);
        var scheduleUpdateChunkPriorities = function scheduleUpdateChunkPriorities() {
            return _this11.chunkManager.scheduleUpdateChunkPriorities();
        };
        _this11.registerDisposer(registerNested(_this11.segmentationState, function (context, state) {
            if (state != null) {
                context.registerDisposer(state.visibleSegments.changed.add(scheduleUpdateChunkPriorities));
                context.registerDisposer(state.segmentEquivalences.changed.add(scheduleUpdateChunkPriorities));
            }
        }));
        _this11.registerDisposer(_this11.chunkManager.recomputeChunkPriorities.add(function () {
            return _this11.recomputeChunkPriorities();
        }));
        return _this11;
    }

    _createClass(AnnotationLayerSharedObjectCounterpart, [{
        key: "recomputeChunkPriorities",
        value: function recomputeChunkPriorities() {
            var state = this.segmentationState.value;
            if (state == null) {
                return;
            }
            var visibility = this.visibility.value;
            if (visibility === Number.NEGATIVE_INFINITY) {
                return;
            }
            var priorityTier = getPriorityTier(visibility);
            var basePriority = getBasePriority(visibility);
            var chunkManager = this.chunkManager;

            var source = this.source.segmentFilteredSource;
            forEachVisibleSegment(state, function (objectId) {
                var chunk = source.getChunk(objectId);
                chunkManager.requestChunk(chunk, priorityTier, basePriority + ANNOTATION_SEGMENT_FILTERED_CHUNK_PRIORITY);
            });
        }
    }, {
        key: "getSegmentationState",
        value: function getSegmentationState(msg) {
            if (msg == null) {
                return msg;
            }
            return {
                visibleSegments: this.rpc.get(msg.visibleSegments),
                segmentEquivalences: this.rpc.get(msg.segmentEquivalences)
            };
        }
    }]);

    return AnnotationLayerSharedObjectCounterpart;
}(withSharedVisibility(withChunkManager(SharedObjectCounterpart)));
AnnotationLayerSharedObjectCounterpart = __decorate([registerSharedObject(ANNOTATION_RENDER_LAYER_RPC_ID)], AnnotationLayerSharedObjectCounterpart);
AnnotationLayerSharedObjectCounterpart;
registerRPC(ANNOTATION_RENDER_LAYER_UPDATE_SEGMENTATION_RPC_ID, function (x) {
    var obj = this.get(x.id);
    obj.segmentationState.value = obj.getSegmentationState(x.segmentationState);
});
//# sourceMappingURL=backend.js.map