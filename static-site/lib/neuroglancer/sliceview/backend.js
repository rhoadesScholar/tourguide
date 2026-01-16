import _getIterator from "babel-runtime/core-js/get-iterator";
import _createClass from "babel-runtime/helpers/createClass";
import _get from "babel-runtime/helpers/get";
import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
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
import { Chunk, ChunkSource, withChunkManager } from "../chunk_manager/backend";
import { CoordinateTransform } from "../coordinate_transform";
import { SLICEVIEW_ADD_VISIBLE_LAYER_RPC_ID, SLICEVIEW_REMOVE_VISIBLE_LAYER_RPC_ID, SLICEVIEW_RENDERLAYER_RPC_ID, SLICEVIEW_RENDERLAYER_UPDATE_TRANSFORM_RPC_ID, SLICEVIEW_RPC_ID, SLICEVIEW_UPDATE_VIEW_RPC_ID, SliceViewBase } from "./base";
import { mat4, vec3, vec3Key } from "../util/geom";
import { NullarySignal } from "../util/signal";
import { getBasePriority, getPriorityTier, withSharedVisibility } from "../visibility_priority/backend";
import { registerRPC, registerSharedObject, SharedObjectCounterpart } from "../worker_rpc";
var BASE_PRIORITY = -1e12;
var SCALE_PRIORITY_MULTIPLIER = 1e9;
// Temporary values used by SliceView.updateVisibleChunk
var tempChunkPosition = vec3.create();
var tempCenter = vec3.create();

var SliceViewCounterpartBase = function (_SliceViewBase) {
    _inherits(SliceViewCounterpartBase, _SliceViewBase);

    function SliceViewCounterpartBase(rpc, options) {
        _classCallCheck(this, SliceViewCounterpartBase);

        var _this = _possibleConstructorReturn(this, (SliceViewCounterpartBase.__proto__ || _Object$getPrototypeOf(SliceViewCounterpartBase)).call(this));

        _this.initializeSharedObject(rpc, options['id']);
        return _this;
    }

    return SliceViewCounterpartBase;
}(SliceViewBase);

var SliceViewIntermediateBase = withSharedVisibility(withChunkManager(SliceViewCounterpartBase));
var SliceView = function (_SliceViewIntermediat) {
    _inherits(SliceView, _SliceViewIntermediat);

    function SliceView(rpc, options) {
        _classCallCheck(this, SliceView);

        var _this2 = _possibleConstructorReturn(this, (SliceView.__proto__ || _Object$getPrototypeOf(SliceView)).call(this, rpc, options));

        _this2.handleLayerChanged = function () {
            if (_this2.hasValidViewport) {
                _this2.chunkManager.scheduleUpdateChunkPriorities();
            }
        };
        _this2.invalidateVisibleSources = function () {
            _this2.visibleSourcesStale = true;
            if (_this2.hasValidViewport) {
                _this2.chunkManager.scheduleUpdateChunkPriorities();
            }
        };
        _this2.registerDisposer(_this2.chunkManager.recomputeChunkPriorities.add(function () {
            _this2.updateVisibleChunks();
        }));
        return _this2;
    }

    _createClass(SliceView, [{
        key: "onViewportChanged",
        value: function onViewportChanged() {
            this.chunkManager.scheduleUpdateChunkPriorities();
        }
    }, {
        key: "updateVisibleChunks",
        value: function updateVisibleChunks() {
            var _this3 = this;

            var globalCenter = this.centerDataPosition;
            var chunkManager = this.chunkManager;
            var visibility = this.visibility.value;
            if (visibility === Number.NEGATIVE_INFINITY) {
                return;
            }
            var priorityTier = getPriorityTier(visibility);
            var basePriority = getBasePriority(visibility);
            basePriority += BASE_PRIORITY;
            var localCenter = tempCenter;
            var getLayoutObject = function getLayoutObject(chunkLayout) {
                chunkLayout.globalToLocalSpatial(localCenter, globalCenter);
                return _this3.visibleChunkLayouts.get(chunkLayout);
            };
            function addChunk(chunkLayout, sources, positionInChunks, visibleSources) {
                vec3.multiply(tempChunkPosition, positionInChunks, chunkLayout.size);
                var priority = -vec3.distance(localCenter, tempChunkPosition);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(visibleSources), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var source = _step.value;

                        var priorityIndex = sources.get(source);
                        var chunk = source.getChunk(positionInChunks);
                        chunkManager.requestChunk(chunk, priorityTier, basePriority + priority + SCALE_PRIORITY_MULTIPLIER * priorityIndex);
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
            this.computeVisibleChunks(getLayoutObject, addChunk);
        }
    }, {
        key: "removeVisibleLayer",
        value: function removeVisibleLayer(layer) {
            this.visibleLayers.delete(layer);
            layer.layerChanged.remove(this.handleLayerChanged);
            layer.transform.changed.remove(this.invalidateVisibleSources);
            layer.renderScaleTarget.changed.remove(this.invalidateVisibleSources);
            this.invalidateVisibleSources();
        }
    }, {
        key: "addVisibleLayer",
        value: function addVisibleLayer(layer) {
            this.visibleLayers.set(layer, []);
            layer.layerChanged.add(this.handleLayerChanged);
            layer.transform.changed.add(this.invalidateVisibleSources);
            layer.renderScaleTarget.changed.add(this.invalidateVisibleSources);
            this.invalidateVisibleSources();
        }
    }, {
        key: "disposed",
        value: function disposed() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(this.visibleLayers.keys()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var layer = _step2.value;

                    this.removeVisibleLayer(layer);
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

            _get(SliceView.prototype.__proto__ || _Object$getPrototypeOf(SliceView.prototype), "disposed", this).call(this);
        }
    }]);

    return SliceView;
}(SliceViewIntermediateBase);
SliceView = __decorate([registerSharedObject(SLICEVIEW_RPC_ID)], SliceView);
export { SliceView };
registerRPC(SLICEVIEW_UPDATE_VIEW_RPC_ID, function (x) {
    var obj = this.get(x.id);
    if (x.width) {
        obj.setViewportSize(x.width, x.height);
    }
    if (x.viewportToData) {
        obj.setViewportToDataMatrix(x.viewportToData);
    }
});
registerRPC(SLICEVIEW_ADD_VISIBLE_LAYER_RPC_ID, function (x) {
    var obj = this.get(x['id']);
    var layer = this.get(x['layerId']);
    obj.addVisibleLayer(layer);
});
registerRPC(SLICEVIEW_REMOVE_VISIBLE_LAYER_RPC_ID, function (x) {
    var obj = this.get(x['id']);
    var layer = this.get(x['layerId']);
    obj.removeVisibleLayer(layer);
});
export var SliceViewChunk = function (_Chunk) {
    _inherits(SliceViewChunk, _Chunk);

    function SliceViewChunk() {
        _classCallCheck(this, SliceViewChunk);

        var _this4 = _possibleConstructorReturn(this, (SliceViewChunk.__proto__ || _Object$getPrototypeOf(SliceViewChunk)).call(this));

        _this4.source = null;
        // console.log('constructing slice view chunk');
        _this4.chunkGridPosition = vec3.create();
        return _this4;
    }

    _createClass(SliceViewChunk, [{
        key: "initializeVolumeChunk",
        value: function initializeVolumeChunk(key, chunkGridPosition) {
            _get(SliceViewChunk.prototype.__proto__ || _Object$getPrototypeOf(SliceViewChunk.prototype), "initialize", this).call(this, key);
            vec3.copy(this.chunkGridPosition, chunkGridPosition);
        }
    }, {
        key: "serialize",
        value: function serialize(msg, transfers) {
            _get(SliceViewChunk.prototype.__proto__ || _Object$getPrototypeOf(SliceViewChunk.prototype), "serialize", this).call(this, msg, transfers);
            msg['chunkGridPosition'] = this.chunkGridPosition;
        }
    }, {
        key: "downloadSucceeded",
        value: function downloadSucceeded() {
            _get(SliceViewChunk.prototype.__proto__ || _Object$getPrototypeOf(SliceViewChunk.prototype), "downloadSucceeded", this).call(this);
        }
    }, {
        key: "freeSystemMemory",
        value: function freeSystemMemory() {}
    }, {
        key: "toString",
        value: function toString() {
            return this.source.toString() + ':' + vec3Key(this.chunkGridPosition);
        }
    }]);

    return SliceViewChunk;
}(Chunk);
export var SliceViewChunkSource = function (_ChunkSource) {
    _inherits(SliceViewChunkSource, _ChunkSource);

    function SliceViewChunkSource(rpc, options) {
        _classCallCheck(this, SliceViewChunkSource);

        return _possibleConstructorReturn(this, (SliceViewChunkSource.__proto__ || _Object$getPrototypeOf(SliceViewChunkSource)).call(this, rpc, options));
    }

    _createClass(SliceViewChunkSource, [{
        key: "getChunk",
        value: function getChunk(chunkGridPosition) {
            var key = vec3Key(chunkGridPosition);
            var chunk = this.chunks.get(key);
            if (chunk === undefined) {
                chunk = this.getNewChunk_(this.chunkConstructor);
                chunk.initializeVolumeChunk(key, chunkGridPosition);
                this.addChunk(chunk);
            }
            return chunk;
        }
    }]);

    return SliceViewChunkSource;
}(ChunkSource);
var RenderLayer = function (_SharedObjectCounterp) {
    _inherits(RenderLayer, _SharedObjectCounterp);

    function RenderLayer(rpc, options) {
        _classCallCheck(this, RenderLayer);

        var _this6 = _possibleConstructorReturn(this, (RenderLayer.__proto__ || _Object$getPrototypeOf(RenderLayer)).call(this, rpc, options));

        _this6.layerChanged = new NullarySignal();
        _this6.transform = new CoordinateTransform();
        _this6.transformedSourcesGeneration = -1;
        _this6.renderScaleTarget = rpc.get(options.renderScaleTarget);
        var sources = _this6.sources = new Array();
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = _getIterator(options['sources']), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var alternativeIds = _step3.value;

                var alternatives = new Array();
                sources.push(alternatives);
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = _getIterator(alternativeIds), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var sourceId = _step4.value;

                        var source = rpc.get(sourceId);
                        _this6.registerDisposer(source.addRef());
                        alternatives.push(source);
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

        mat4.copy(_this6.transform.transform, options['transform']);
        _this6.transform.changed.add(_this6.layerChanged.dispatch);
        return _this6;
    }

    return RenderLayer;
}(SharedObjectCounterpart);
RenderLayer = __decorate([registerSharedObject(SLICEVIEW_RENDERLAYER_RPC_ID)], RenderLayer);
export { RenderLayer };
registerRPC(SLICEVIEW_RENDERLAYER_UPDATE_TRANSFORM_RPC_ID, function (x) {
    var layer = this.get(x['id']);
    var newValue = x['value'];
    var oldValue = layer.transform.transform;
    if (!mat4.equals(newValue, oldValue)) {
        mat4.copy(oldValue, newValue);
        layer.transform.changed.dispatch();
    }
});
//# sourceMappingURL=backend.js.map