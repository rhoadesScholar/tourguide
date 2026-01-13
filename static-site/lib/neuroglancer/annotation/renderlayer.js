import _get from "babel-runtime/helpers/get";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _getIterator from "babel-runtime/core-js/get-iterator";
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
import "./bounding_box";
import "./line";
import "./point";
import "./ellipsoid";
import { AnnotationSource, annotationTypes } from "./index";
import { ANNOTATION_PERSPECTIVE_RENDER_LAYER_RPC_ID, ANNOTATION_RENDER_LAYER_RPC_ID, ANNOTATION_RENDER_LAYER_UPDATE_SEGMENTATION_RPC_ID } from "./base";
import { MultiscaleAnnotationSource } from "./frontend_source";
import { getAnnotationTypeRenderHandler } from "./type_handler";
import { ChunkState } from "../chunk_manager/base";
import { PerspectiveViewRenderLayer } from "../perspective_view/render_layer";
import { forEachVisibleSegment, getObjectKey } from "../segmentation_display_state/base";
import { SharedWatchableValue } from "../shared_watchable_value";
import { SliceViewPanelRenderLayer } from "../sliceview/panel";
import { binarySearch } from "../util/array";
import { RefCounted } from "../util/disposable";
import { mat4 } from "../util/geom";
import { NullarySignal } from "../util/signal";
import { withSharedVisibility } from "../visibility_priority/frontend";
import { Buffer } from "../webgl/buffer";
import { registerSharedObjectOwner, SharedObject } from "../worker_rpc";
var tempMat = mat4.create();
function segmentationFilter(segmentationState) {
    if (segmentationState == null) {
        return function () {
            return false;
        };
    }
    var visibleSegments = segmentationState.visibleSegments,
        segmentEquivalences = segmentationState.segmentEquivalences;

    return function (annotation) {
        var segments = annotation.segments;

        if (segments === undefined) {
            return false;
        }
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(segments), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var segment = _step.value;

                if (visibleSegments.has(segmentEquivalences.get(segment))) {
                    return true;
                }
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

        return false;
    };
}
function serializeAnnotationSet(annotationSet, filter) {
    var typeToIds = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = _getIterator(annotationTypes), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var annotationType = _step2.value;

            typeToIds[annotationType] = [];
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

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = _getIterator(annotationSet), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var annotation = _step3.value;

            if (filter === undefined || filter(annotation)) {
                typeToIds[annotation.type].push(annotation.id);
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

    var totalBytes = 0;
    var numPickIds = 0;
    var typeToOffset = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = _getIterator(annotationTypes), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _annotationType = _step4.value;

            typeToOffset[_annotationType] = totalBytes;
            var count = typeToIds[_annotationType].length;
            var handler = getAnnotationTypeRenderHandler(_annotationType);
            totalBytes += count * handler.bytes;
            numPickIds += handler.pickIdsPerInstance * count;
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

    var data = new ArrayBuffer(totalBytes);

    var _loop = function _loop(_annotationType2) {
        var ids = typeToIds[_annotationType2];
        var handler = getAnnotationTypeRenderHandler(_annotationType2);
        var serializer = handler.serializer(data, typeToOffset[_annotationType2], ids.length);
        ids.forEach(function (id, index) {
            return serializer(annotationSet.get(id), index);
        });
    };

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
        for (var _iterator5 = _getIterator(annotationTypes), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var _annotationType2 = _step5.value;

            _loop(_annotationType2);
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

    return { typeToIds: typeToIds, typeToOffset: typeToOffset, data: data, numPickIds: numPickIds };
}
var AnnotationLayerSharedObject = function (_withSharedVisibility) {
    _inherits(AnnotationLayerSharedObject, _withSharedVisibility);

    function AnnotationLayerSharedObject(chunkManager, source, state, filterBySegmentation) {
        _classCallCheck(this, AnnotationLayerSharedObject);

        var _this = _possibleConstructorReturn(this, (AnnotationLayerSharedObject.__proto__ || _Object$getPrototypeOf(AnnotationLayerSharedObject)).call(this));

        _this.chunkManager = chunkManager;
        _this.source = source;
        _this.state = state;
        _this.filterBySegmentation = filterBySegmentation;
        _this.initializeCounterpart(_this.chunkManager.rpc, {
            chunkManager: _this.chunkManager.rpcId,
            source: source.rpcId,
            segmentationState: _this.serializeDisplayState()
        });
        var update = function update() {
            var msg = { id: _this.rpcId, segmentationState: _this.serializeDisplayState() };
            _this.rpc.invoke(ANNOTATION_RENDER_LAYER_UPDATE_SEGMENTATION_RPC_ID, msg);
        };
        _this.registerDisposer(state.changed.add(update));
        _this.registerDisposer(filterBySegmentation.changed.add(update));
        return _this;
    }

    _createClass(AnnotationLayerSharedObject, [{
        key: "serializeDisplayState",
        value: function serializeDisplayState() {
            var state = this.state.value;
            if (state == null) {
                return state;
            }
            if (!this.filterBySegmentation.value) {
                return null;
            }
            return {
                segmentEquivalences: state.segmentEquivalences.rpcId,
                visibleSegments: state.visibleSegments.rpcId
            };
        }
    }]);

    return AnnotationLayerSharedObject;
}(withSharedVisibility(SharedObject));
AnnotationLayerSharedObject = __decorate([registerSharedObjectOwner(ANNOTATION_RENDER_LAYER_RPC_ID)], AnnotationLayerSharedObject);
export var AnnotationLayer = function (_RefCounted) {
    _inherits(AnnotationLayer, _RefCounted);

    function AnnotationLayer(chunkManager, state) {
        _classCallCheck(this, AnnotationLayer);

        var _this2 = _possibleConstructorReturn(this, (AnnotationLayer.__proto__ || _Object$getPrototypeOf(AnnotationLayer)).call(this));

        _this2.chunkManager = chunkManager;
        _this2.state = state;
        /**
         * The value of this.state.annotationSet.changed.count when `buffer` was last updated.
         */
        _this2.generation = -1;
        _this2.redrawNeeded = new NullarySignal();
        _this2.handleChangeAffectingBuffer = function () {
            _this2.generation = -1;
            _this2.redrawNeeded.dispatch();
        };
        _this2.handleSegmentationChanged = function () {
            if (_this2.state.filterBySegmentation.value) {
                _this2.handleChangeAffectingBuffer();
            }
        };
        _this2.registerDisposer(state);
        _this2.buffer = _this2.registerDisposer(new Buffer(chunkManager.gl));
        _this2.registerDisposer(_this2.source.changed.add(_this2.handleChangeAffectingBuffer));
        _this2.registerDisposer(state.filterBySegmentation.changed.add(_this2.handleChangeAffectingBuffer));
        _this2.registerDisposer(function () {
            return _this2.unregisterSegmentationState();
        });
        _this2.registerDisposer(state.segmentationState.changed.add(function () {
            var segmentationState = state.segmentationState.value;
            if (segmentationState !== _this2.segmentationState) {
                _this2.unregisterSegmentationState();
                if (segmentationState != null) {
                    segmentationState.visibleSegments.changed.add(_this2.handleSegmentationChanged);
                    segmentationState.segmentEquivalences.changed.add(_this2.handleSegmentationChanged);
                }
                _this2.segmentationState = segmentationState;
                _this2.handleSegmentationChanged();
            }
        }));
        if (!(_this2.source instanceof AnnotationSource)) {
            _this2.sharedObject = _this2.registerDisposer(new AnnotationLayerSharedObject(chunkManager, _this2.source, state.segmentationState, state.filterBySegmentation));
        }
        _this2.registerDisposer(_this2.state.color.changed.add(_this2.redrawNeeded.dispatch));
        _this2.registerDisposer(_this2.state.fillOpacity.changed.add(_this2.redrawNeeded.dispatch));
        _this2.registerDisposer(_this2.hoverState.changed.add(_this2.redrawNeeded.dispatch));
        _this2.registerDisposer(_this2.transform.changed.add(_this2.redrawNeeded.dispatch));
        return _this2;
    }

    _createClass(AnnotationLayer, [{
        key: "unregisterSegmentationState",
        value: function unregisterSegmentationState() {
            var segmentationState = this.segmentationState;

            if (segmentationState != null) {
                segmentationState.visibleSegments.changed.remove(this.handleSegmentationChanged);
                segmentationState.segmentEquivalences.changed.remove(this.handleSegmentationChanged);
                this.segmentationState = undefined;
            }
        }
    }, {
        key: "updateBuffer",
        value: function updateBuffer() {
            var source = this.source;

            if (source instanceof AnnotationSource) {
                var generation = source.changed.count;
                if (this.generation !== generation) {
                    this.generation = generation;

                    var _serializeAnnotationS = serializeAnnotationSet(source, this.state.filterBySegmentation.value ? segmentationFilter(this.segmentationState) : undefined),
                        data = _serializeAnnotationS.data,
                        typeToIds = _serializeAnnotationS.typeToIds,
                        typeToOffset = _serializeAnnotationS.typeToOffset,
                        numPickIds = _serializeAnnotationS.numPickIds;

                    this.data = new Uint8Array(data);
                    this.buffer.setData(this.data);
                    this.typeToIds = typeToIds;
                    this.typeToOffset = typeToOffset;
                    this.numPickIds = numPickIds;
                }
            }
        }
    }, {
        key: "source",
        get: function get() {
            return this.state.source;
        }
    }, {
        key: "transform",
        get: function get() {
            return this.state.transform;
        }
    }, {
        key: "hoverState",
        get: function get() {
            return this.state.hoverState;
        }
    }, {
        key: "visibility",
        get: function get() {
            var sharedObject = this.sharedObject;

            if (sharedObject === undefined) {
                return undefined;
            }
            return sharedObject.visibility;
        }
    }, {
        key: "gl",
        get: function get() {
            return this.chunkManager.gl;
        }
    }]);

    return AnnotationLayer;
}(RefCounted);

var AnnotationPerspectiveRenderLayerBase = function (_PerspectiveViewRende) {
    _inherits(AnnotationPerspectiveRenderLayerBase, _PerspectiveViewRende);

    function AnnotationPerspectiveRenderLayerBase(base) {
        _classCallCheck(this, AnnotationPerspectiveRenderLayerBase);

        var _this3 = _possibleConstructorReturn(this, (AnnotationPerspectiveRenderLayerBase.__proto__ || _Object$getPrototypeOf(AnnotationPerspectiveRenderLayerBase)).call(this));

        _this3.base = base;
        return _this3;
    }

    return AnnotationPerspectiveRenderLayerBase;
}(PerspectiveViewRenderLayer);

var AnnotationSliceViewRenderLayerBase = function (_SliceViewPanelRender) {
    _inherits(AnnotationSliceViewRenderLayerBase, _SliceViewPanelRender);

    function AnnotationSliceViewRenderLayerBase(base) {
        _classCallCheck(this, AnnotationSliceViewRenderLayerBase);

        var _this4 = _possibleConstructorReturn(this, (AnnotationSliceViewRenderLayerBase.__proto__ || _Object$getPrototypeOf(AnnotationSliceViewRenderLayerBase)).call(this));

        _this4.base = base;
        return _this4;
    }

    return AnnotationSliceViewRenderLayerBase;
}(SliceViewPanelRenderLayer);

function AnnotationRenderLayer(Base, renderHelperType) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this5 = _possibleConstructorReturn(this, (_ref = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref, [this].concat(args)));

            _this5.renderHelpers = [];
            _this5.isAnnotation = true;
            var base = _this5.registerDisposer(_this5.base);
            var baseVisibility = base.visibility;
            if (baseVisibility !== undefined) {
                _this5.registerDisposer(baseVisibility.add(_this5.visibility));
            }
            _this5.role = base.state.role;
            var renderHelpers = _this5.renderHelpers,
                gl = _this5.gl;
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(annotationTypes), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var annotationType = _step6.value;

                    var handler = getAnnotationTypeRenderHandler(annotationType);
                    var renderHelperConstructor = handler[renderHelperType];
                    var helper = renderHelpers[annotationType] = _this5.registerDisposer(new renderHelperConstructor(gl));
                    helper.pickIdsPerInstance = handler.pickIdsPerInstance;
                    helper.targetIsSliceView = renderHelperType === 'sliceViewRenderHelper';
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

            _this5.registerDisposer(base.redrawNeeded.add(function () {
                _this5.redrawNeeded.dispatch();
            }));
            _this5.setReady(true);
            return _this5;
        }

        _createClass(C, [{
            key: "drawGeometryChunkData",
            value: function drawGeometryChunkData(chunk, renderContext) {
                if (!chunk.bufferValid) {
                    var buffer = chunk.buffer;

                    if (buffer === undefined) {
                        buffer = chunk.buffer = new Buffer(this.gl);
                    }
                    buffer.setData(chunk.data);
                    chunk.bufferValid = true;
                }
                this.drawGeometry(chunk, renderContext);
            }
        }, {
            key: "drawGeometry",
            value: function drawGeometry(chunk, renderContext) {
                var base = this.base;

                var typeToIds = chunk.typeToIds;
                var typeToOffset = chunk.typeToOffset;
                var pickId = 0;
                if (renderContext.emitPickID) {
                    pickId = renderContext.pickIDs.register(this, chunk.numPickIds, 0, 0, chunk);
                }
                var hoverValue = base.hoverState.value;
                var projectionMatrix = mat4.multiply(tempMat, renderContext.dataToDevice, base.state.objectToGlobal);
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = _getIterator(annotationTypes), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var annotationType = _step7.value;

                        var ids = typeToIds[annotationType];
                        if (ids.length > 0) {
                            var count = ids.length;
                            var handler = getAnnotationTypeRenderHandler(annotationType);
                            var selectedIndex = 0xFFFFFFFF;
                            if (hoverValue !== undefined) {
                                var index = binarySearch(ids, hoverValue.id, function (a, b) {
                                    return a < b ? -1 : a === b ? 0 : 1;
                                });
                                if (index >= 0) {
                                    selectedIndex = index * handler.pickIdsPerInstance;
                                    // If we wanted to include the partIndex, we would add:
                                    // selectedIndex += hoverValue.partIndex;
                                }
                            }
                            var context = {
                                annotationLayer: base,
                                renderContext: renderContext,
                                selectedIndex: selectedIndex,
                                basePickId: pickId,
                                buffer: chunk.buffer,
                                bufferOffset: typeToOffset[annotationType],
                                count: count,
                                projectionMatrix: projectionMatrix
                            };
                            this.renderHelpers[annotationType].draw(context);
                            pickId += count * handler.pickIdsPerInstance;
                        }
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
            }
        }, {
            key: "draw",
            value: function draw(renderContext) {
                var _this6 = this;

                var source = this.base.source;

                if (source instanceof AnnotationSource) {
                    var base = this.base;

                    base.updateBuffer();
                    this.drawGeometry(base, renderContext);
                } else {
                    this.drawGeometryChunkData(source.temporary.data, renderContext);
                    if (this.base.state.filterBySegmentation.value) {
                        var segmentationState = this.base.state.segmentationState.value;
                        if (segmentationState == null) {
                            return;
                        }
                        var chunks = source.segmentFilteredSource.chunks;
                        forEachVisibleSegment(segmentationState, function (objectId) {
                            var key = getObjectKey(objectId);
                            var chunk = chunks.get(key);
                            if (chunk !== undefined) {
                                _this6.drawGeometryChunkData(chunk.data, renderContext);
                            }
                        });
                    } else {
                        var _iteratorNormalCompletion8 = true;
                        var _didIteratorError8 = false;
                        var _iteratorError8 = undefined;

                        try {
                            for (var _iterator8 = _getIterator(source.sources), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                var alternatives = _step8.value;
                                var _iteratorNormalCompletion9 = true;
                                var _didIteratorError9 = false;
                                var _iteratorError9 = undefined;

                                try {
                                    for (var _iterator9 = _getIterator(alternatives), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                                        var geometrySource = _step9.value;
                                        var _iteratorNormalCompletion10 = true;
                                        var _didIteratorError10 = false;
                                        var _iteratorError10 = undefined;

                                        try {
                                            for (var _iterator10 = _getIterator(geometrySource.chunks.values()), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                                                var chunk = _step10.value;

                                                if (chunk.state !== ChunkState.GPU_MEMORY) {
                                                    continue;
                                                }
                                                this.drawGeometryChunkData(chunk.data, renderContext);
                                            }
                                        } catch (err) {
                                            _didIteratorError10 = true;
                                            _iteratorError10 = err;
                                        } finally {
                                            try {
                                                if (!_iteratorNormalCompletion10 && _iterator10.return) {
                                                    _iterator10.return();
                                                }
                                            } finally {
                                                if (_didIteratorError10) {
                                                    throw _iteratorError10;
                                                }
                                            }
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError9 = true;
                                    _iteratorError9 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                            _iterator9.return();
                                        }
                                    } finally {
                                        if (_didIteratorError9) {
                                            throw _iteratorError9;
                                        }
                                    }
                                }
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
                }
            }
        }, {
            key: "updateMouseState",
            value: function updateMouseState(mouseState, _pickedValue, pickedOffset, data) {
                var chunk = data;
                var typeToIds = chunk.typeToIds;
                var typeToOffset = chunk.typeToOffset;
                var _iteratorNormalCompletion11 = true;
                var _didIteratorError11 = false;
                var _iteratorError11 = undefined;

                try {
                    for (var _iterator11 = _getIterator(annotationTypes), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                        var annotationType = _step11.value;

                        var ids = typeToIds[annotationType];
                        var handler = getAnnotationTypeRenderHandler(annotationType);
                        var pickIdsPerInstance = handler.pickIdsPerInstance;

                        if (pickedOffset < ids.length * pickIdsPerInstance) {
                            var instanceIndex = Math.floor(pickedOffset / pickIdsPerInstance);
                            var id = ids[instanceIndex];
                            var partIndex = pickedOffset % pickIdsPerInstance;
                            mouseState.pickedAnnotationId = id;
                            mouseState.pickedAnnotationLayer = this.base.state;
                            mouseState.pickedOffset = partIndex;
                            mouseState.pickedAnnotationBuffer = chunk.data.buffer;
                            mouseState.pickedAnnotationBufferOffset = chunk.data.byteOffset + typeToOffset[annotationType] + instanceIndex * handler.bytes;
                            handler.snapPosition(mouseState.position, this.base.state.objectToGlobal, mouseState.pickedAnnotationBuffer, mouseState.pickedAnnotationBufferOffset, partIndex);
                            return;
                        }
                        pickedOffset -= ids.length * pickIdsPerInstance;
                    }
                } catch (err) {
                    _didIteratorError11 = true;
                    _iteratorError11 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion11 && _iterator11.return) {
                            _iterator11.return();
                        }
                    } finally {
                        if (_didIteratorError11) {
                            throw _iteratorError11;
                        }
                    }
                }
            }
        }, {
            key: "transformPickedValue",
            value: function transformPickedValue(_pickedValue, _pickedOffset) {
                return undefined;
            }
        }, {
            key: "isReady",
            value: function isReady() {
                var base = this.base;
                var source = base.source;

                if (!(source instanceof MultiscaleAnnotationSource)) {
                    return true;
                }
                if (!base.state.filterBySegmentation.value) {
                    return true;
                }
                var segmentationState = this.base.state.segmentationState.value;
                if (segmentationState === undefined) {
                    // We are still waiting to attach segmentation.
                    return false;
                }
                if (segmentationState === null) {
                    return true;
                }
                var chunks = source.segmentFilteredSource.chunks;
                var missing = false;
                forEachVisibleSegment(segmentationState, function (objectId) {
                    var key = getObjectKey(objectId);
                    if (!chunks.has(key)) {
                        missing = true;
                    }
                });
                return !missing;
            }
        }, {
            key: "gl",
            get: function get() {
                return this.base.chunkManager.gl;
            }
        }]);

        return C;
    }(Base);

    return C;
}
var PerspectiveViewAnnotationLayerBase = AnnotationRenderLayer(AnnotationPerspectiveRenderLayerBase, 'perspectiveViewRenderHelper');
export var PerspectiveViewAnnotationLayer = function (_PerspectiveViewAnnot) {
    _inherits(PerspectiveViewAnnotationLayer, _PerspectiveViewAnnot);

    function PerspectiveViewAnnotationLayer() {
        _classCallCheck(this, PerspectiveViewAnnotationLayer);

        var _this7 = _possibleConstructorReturn(this, (PerspectiveViewAnnotationLayer.__proto__ || _Object$getPrototypeOf(PerspectiveViewAnnotationLayer)).apply(this, arguments));

        _this7.backend = function () {
            var source = _this7.base.source;

            if (source instanceof MultiscaleAnnotationSource) {
                var sharedObject = _this7.registerDisposer(new SharedObject());
                var rpc = source.chunkManager.rpc;
                sharedObject.RPC_TYPE_ID = ANNOTATION_PERSPECTIVE_RENDER_LAYER_RPC_ID;
                sharedObject.initializeCounterpart(rpc, {
                    source: source.rpcId,
                    filterBySegmentation: _this7.registerDisposer(SharedWatchableValue.makeFromExisting(rpc, _this7.base.state.filterBySegmentation)).rpcId
                });
                return sharedObject;
            }
            return undefined;
        }();
        return _this7;
    }

    _createClass(PerspectiveViewAnnotationLayer, [{
        key: "isReady",
        value: function isReady() {
            if (!_get(PerspectiveViewAnnotationLayer.prototype.__proto__ || _Object$getPrototypeOf(PerspectiveViewAnnotationLayer.prototype), "isReady", this).call(this)) {
                return false;
            }
            var base = this.base;
            var source = base.source;

            if (source instanceof MultiscaleAnnotationSource) {
                if (!base.state.filterBySegmentation.value) {
                    var geometrySource = source.sources[0][0];
                    var chunk = geometrySource.chunks.get('0,0,0');
                    if (chunk === undefined || chunk.state !== ChunkState.GPU_MEMORY) {
                        return false;
                    }
                }
            }
            return true;
        }
    }]);

    return PerspectiveViewAnnotationLayer;
}(PerspectiveViewAnnotationLayerBase);
export var SliceViewAnnotationLayer = AnnotationRenderLayer(AnnotationSliceViewRenderLayerBase, 'sliceViewRenderHelper');
//# sourceMappingURL=renderlayer.js.map