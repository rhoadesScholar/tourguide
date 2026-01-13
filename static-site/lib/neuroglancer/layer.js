import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _Map from 'babel-runtime/core-js/map';
import _WeakSet from 'babel-runtime/core-js/weak-set';
import _Set from 'babel-runtime/core-js/set';
import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _get from 'babel-runtime/helpers/get';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import debounce from 'lodash/debounce';
import { TrackableRefCounted, TrackableValue, WatchableSet } from './trackable_value';
import { restoreTool } from './ui/tool';
import { RefCounted } from './util/disposable';
import { vec3 } from './util/geom';
import { verifyObject, verifyObjectProperty, verifyOptionalBoolean, verifyOptionalString, verifyPositiveInt } from './util/json';
import { NullarySignal } from './util/signal';
import { addSignalBinding, removeSignalBinding } from './util/signal_binding_updater';
import { Uint64 } from './util/uint64';
import { VisibilityPriorityAggregator } from './visibility_priority/frontend';
import { TabSpecification } from './widget/tab_view';
export var RenderLayerRole;
(function (RenderLayerRole) {
    RenderLayerRole[RenderLayerRole["DATA"] = 0] = "DATA";
    RenderLayerRole[RenderLayerRole["ANNOTATION"] = 1] = "ANNOTATION";
    RenderLayerRole[RenderLayerRole["DEFAULT_ANNOTATION"] = 2] = "DEFAULT_ANNOTATION";
})(RenderLayerRole || (RenderLayerRole = {}));
export function allRenderLayerRoles() {
    return new WatchableSet([RenderLayerRole.DATA, RenderLayerRole.ANNOTATION, RenderLayerRole.DEFAULT_ANNOTATION]);
}
export var RenderLayer = function (_RefCounted) {
    _inherits(RenderLayer, _RefCounted);

    function RenderLayer() {
        _classCallCheck(this, RenderLayer);

        var _this = _possibleConstructorReturn(this, (RenderLayer.__proto__ || _Object$getPrototypeOf(RenderLayer)).apply(this, arguments));

        _this.ready = false;
        _this.role = RenderLayerRole.DATA;
        _this.layerChanged = new NullarySignal();
        _this.redrawNeeded = new NullarySignal();
        _this.readyStateChanged = new NullarySignal();
        /**
         * Base voxel size for this layer, in nanometers per voxel.
         */
        _this.voxelSize = null;
        /**
         * Bounding box for this layer, in nanometers.
         */
        _this.boundingBox = null;
        return _this;
    }

    _createClass(RenderLayer, [{
        key: 'setReady',
        value: function setReady(value) {
            this.ready = value;
            this.readyStateChanged.dispatch();
            this.layerChanged.dispatch();
        }
    }, {
        key: 'handleAction',
        value: function handleAction(_action) {
            // Do nothing by default.
        }
    }, {
        key: 'getValueAt',
        value: function getValueAt(_x) {
            return undefined;
        }
        /**
         * Transform the stored pickedValue and offset associated with the retrieved pick ID into the
         * actual value.
         */

    }, {
        key: 'transformPickedValue',
        value: function transformPickedValue(pickedValue, _pickedOffset) {
            return pickedValue;
        }
        /**
         * Optionally updates the mouse state based on the retrived pick information.  This might snap the
         * 3-d position to the center of the picked point.
         */

    }, {
        key: 'updateMouseState',
        value: function updateMouseState(_mouseState, _pickedValue, _pickedOffset, _data) {}
    }]);

    return RenderLayer;
}(RefCounted);
/**
 * Extends RenderLayer with functionality for tracking the number of panels in which the layer is
 * visible.
 */
export var VisibilityTrackedRenderLayer = function (_RenderLayer) {
    _inherits(VisibilityTrackedRenderLayer, _RenderLayer);

    function VisibilityTrackedRenderLayer() {
        _classCallCheck(this, VisibilityTrackedRenderLayer);

        var _this2 = _possibleConstructorReturn(this, (VisibilityTrackedRenderLayer.__proto__ || _Object$getPrototypeOf(VisibilityTrackedRenderLayer)).apply(this, arguments));

        _this2.visibility = new VisibilityPriorityAggregator();
        return _this2;
    }

    return VisibilityTrackedRenderLayer;
}(RenderLayer);
var TAB_JSON_KEY = 'tab';
var TOOL_JSON_KEY = 'tool';
export var UserLayer = function (_RefCounted2) {
    _inherits(UserLayer, _RefCounted2);

    function UserLayer(manager, specification) {
        _classCallCheck(this, UserLayer);

        var _this3 = _possibleConstructorReturn(this, (UserLayer.__proto__ || _Object$getPrototypeOf(UserLayer)).call(this));

        _this3.manager = manager;
        _this3.layersChanged = new NullarySignal();
        _this3.readyStateChanged = new NullarySignal();
        _this3.specificationChanged = new NullarySignal();
        _this3.renderLayers = new Array();
        _this3.isReady = false;
        _this3.tabs = _this3.registerDisposer(new TabSpecification());
        _this3.tool = _this3.registerDisposer(new TrackableRefCounted(function (value) {
            return restoreTool(_this3, value);
        }, function (value) {
            return value.toJSON();
        }));
        specification;
        _this3.tabs.changed.add(_this3.specificationChanged.dispatch);
        _this3.tool.changed.add(_this3.specificationChanged.dispatch);
        return _this3;
    }

    _createClass(UserLayer, [{
        key: 'restoreState',
        value: function restoreState(specification) {
            this.tool.restoreState(specification[TOOL_JSON_KEY]);
            this.tabs.restoreState(specification[TAB_JSON_KEY]);
        }
    }, {
        key: 'addRenderLayer',
        value: function addRenderLayer(layer) {
            this.renderLayers.push(layer);
            var layersChanged = this.layersChanged,
                readyStateChanged = this.readyStateChanged;

            layer.layerChanged.add(layersChanged.dispatch);
            layer.readyStateChanged.add(readyStateChanged.dispatch);
            readyStateChanged.dispatch();
            layersChanged.dispatch();
        }
    }, {
        key: 'removeRenderLayer',
        value: function removeRenderLayer(layer) {
            var renderLayers = this.renderLayers,
                layersChanged = this.layersChanged,
                readyStateChanged = this.readyStateChanged;

            var index = renderLayers.indexOf(layer);
            if (index === -1) {
                throw new Error('Attempted to remove invalid RenderLayer');
            }
            renderLayers.splice(index, 1);
            layer.layerChanged.remove(layersChanged.dispatch);
            layer.readyStateChanged.remove(readyStateChanged.dispatch);
            layer.dispose();
            readyStateChanged.dispatch();
            layersChanged.dispatch();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var layersChanged = this.layersChanged,
                readyStateChanged = this.readyStateChanged;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(this.renderLayers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var layer = _step.value;

                    layer.layerChanged.remove(layersChanged.dispatch);
                    layer.readyStateChanged.remove(readyStateChanged.dispatch);
                    layer.dispose();
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

            _get(UserLayer.prototype.__proto__ || _Object$getPrototypeOf(UserLayer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'getValueAt',
        value: function getValueAt(position, pickState) {
            var result = void 0;
            var renderLayers = this.renderLayers;
            var pickedRenderLayer = pickState.pickedRenderLayer;

            if (pickedRenderLayer !== null && renderLayers.indexOf(pickedRenderLayer) !== -1) {
                result = pickedRenderLayer.transformPickedValue(pickState.pickedValue, pickState.pickedOffset);
                return this.transformPickedValue(result);
            }
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(renderLayers), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var layer = _step2.value;

                    if (!layer.ready) {
                        continue;
                    }
                    result = layer.getValueAt(position);
                    if (result !== undefined) {
                        break;
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

            return this.transformPickedValue(result);
        }
    }, {
        key: 'transformPickedValue',
        value: function transformPickedValue(value) {
            return value;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var _ref;

            return _ref = {}, _defineProperty(_ref, TAB_JSON_KEY, this.tabs.toJSON()), _defineProperty(_ref, TOOL_JSON_KEY, this.tool.toJSON()), _ref;
        }
    }, {
        key: 'handleAction',
        value: function handleAction(_action) {}
    }]);

    return UserLayer;
}(RefCounted);
export var ManagedUserLayer = function (_RefCounted3) {
    _inherits(ManagedUserLayer, _RefCounted3);

    /**
     * If layer is not null, tranfers ownership of a reference.
     */
    function ManagedUserLayer(name) {
        var layer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var visible = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        _classCallCheck(this, ManagedUserLayer);

        var _this4 = _possibleConstructorReturn(this, (ManagedUserLayer.__proto__ || _Object$getPrototypeOf(ManagedUserLayer)).call(this));

        _this4.visible = visible;
        _this4.readyStateChanged = new NullarySignal();
        _this4.layerChanged = new NullarySignal();
        _this4.specificationChanged = new NullarySignal();
        _this4.wasDisposed = false;
        _this4.layer_ = null;
        _this4.name_ = name;
        _this4.layer = layer;
        return _this4;
    }

    _createClass(ManagedUserLayer, [{
        key: 'isReady',
        value: function isReady() {
            var layer = this.layer;

            return layer !== null && layer.isReady;
        }
    }, {
        key: 'handleLayerChanged',
        value: function handleLayerChanged() {
            if (this.visible) {
                this.layerChanged.dispatch();
            }
        }
    }, {
        key: 'setVisible',
        value: function setVisible(value) {
            if (value !== this.visible) {
                this.visible = value;
                this.layerChanged.dispatch();
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.wasDisposed = true;
            this.layer = null;
            _get(ManagedUserLayer.prototype.__proto__ || _Object$getPrototypeOf(ManagedUserLayer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'layer',
        get: function get() {
            return this.layer_;
        }
        /**
         * If layer is not null, tranfers ownership of a reference.
         */
        ,
        set: function set(layer) {
            var _this5 = this;

            var oldLayer = this.layer_;
            if (oldLayer != null) {
                this.unregisterUserLayer();
                oldLayer.dispose();
            }
            this.layer_ = layer;
            if (layer != null) {
                var removers = [layer.layersChanged.add(function () {
                    return _this5.handleLayerChanged();
                }), layer.readyStateChanged.add(this.readyStateChanged.dispatch), layer.specificationChanged.add(this.specificationChanged.dispatch)];
                this.unregisterUserLayer = function () {
                    removers.forEach(function (x) {
                        return x();
                    });
                };
                this.readyStateChanged.dispatch();
                this.handleLayerChanged();
            }
        }
    }, {
        key: 'name',
        get: function get() {
            return this.name_;
        },
        set: function set(value) {
            if (value !== this.name_) {
                this.name_ = value;
                this.layerChanged.dispatch();
            }
        }
    }]);

    return ManagedUserLayer;
}(RefCounted);
export var LayerManager = function (_RefCounted4) {
    _inherits(LayerManager, _RefCounted4);

    function LayerManager() {
        _classCallCheck(this, LayerManager);

        var _this6 = _possibleConstructorReturn(this, (LayerManager.__proto__ || _Object$getPrototypeOf(LayerManager)).call(this));

        _this6.managedLayers = new Array();
        _this6.layerSet = new _Set();
        _this6.layersChanged = new NullarySignal();
        _this6.readyStateChanged = new NullarySignal();
        _this6.specificationChanged = new NullarySignal();
        _this6.boundPositions = new _WeakSet();
        _this6.numDirectUsers = 0;
        _this6.renderLayerToManagedLayerMapGeneration = -1;
        _this6.renderLayerToManagedLayerMap_ = new _Map();
        _this6.scheduleRemoveLayersWithSingleRef = _this6.registerCancellable(debounce(function () {
            return _this6.removeLayersWithSingleRef();
        }, 0));
        _this6.layersChanged.add(_this6.scheduleRemoveLayersWithSingleRef);
        return _this6;
    }

    _createClass(LayerManager, [{
        key: 'filter',
        value: function filter(predicate) {
            var _this7 = this;

            var changed = false;
            this.managedLayers = this.managedLayers.filter(function (layer) {
                if (!predicate(layer)) {
                    _this7.unbindManagedLayer(layer);
                    _this7.layerSet.delete(layer);
                    changed = true;
                    return false;
                }
                return true;
            });
            if (changed) {
                this.layersChanged.dispatch();
            }
        }
    }, {
        key: 'removeLayersWithSingleRef',
        value: function removeLayersWithSingleRef() {
            if (this.numDirectUsers > 0) {
                return;
            }
            this.filter(function (layer) {
                return layer.refCount !== 1;
            });
        }
    }, {
        key: 'updateSignalBindings',
        value: function updateSignalBindings(layer, callback) {
            callback(layer.layerChanged, this.layersChanged.dispatch);
            callback(layer.readyStateChanged, this.readyStateChanged.dispatch);
            callback(layer.specificationChanged, this.specificationChanged.dispatch);
        }
    }, {
        key: 'useDirectly',
        value: function useDirectly() {
            var _this8 = this;

            if (++this.numDirectUsers === 1) {
                this.layersChanged.remove(this.scheduleRemoveLayersWithSingleRef);
            }
            return function () {
                if (--_this8.numDirectUsers === 0) {
                    _this8.layersChanged.add(_this8.scheduleRemoveLayersWithSingleRef);
                    _this8.scheduleRemoveLayersWithSingleRef();
                }
            };
        }
        /**
         * Assumes ownership of an existing reference to managedLayer.
         */

    }, {
        key: 'addManagedLayer',
        value: function addManagedLayer(managedLayer, index) {
            this.updateSignalBindings(managedLayer, addSignalBinding);
            this.layerSet.add(managedLayer);
            if (index === undefined) {
                index = this.managedLayers.length;
            }
            this.managedLayers.splice(index, 0, managedLayer);
            this.layersChanged.dispatch();
            this.readyStateChanged.dispatch();
            return managedLayer;
        }
        /**
         * Assumes ownership of an existing reference to userLayer.
         */

    }, {
        key: 'addUserLayer',
        value: function addUserLayer(name, userLayer, visible) {
            var managedLayer = new ManagedUserLayer(name, userLayer, visible);
            return this.addManagedLayer(managedLayer);
        }
    }, {
        key: 'readyRenderLayers',
        value: /*#__PURE__*/_regeneratorRuntime.mark(function readyRenderLayers() {
            var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, managedUserLayer, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, renderLayer;

            return _regeneratorRuntime.wrap(function readyRenderLayers$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _iteratorNormalCompletion3 = true;
                            _didIteratorError3 = false;
                            _iteratorError3 = undefined;
                            _context.prev = 3;
                            _iterator3 = _getIterator(this.managedLayers);

                        case 5:
                            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                                _context.next = 40;
                                break;
                            }

                            managedUserLayer = _step3.value;

                            if (!(!managedUserLayer.visible || !managedUserLayer.layer)) {
                                _context.next = 9;
                                break;
                            }

                            return _context.abrupt('continue', 37);

                        case 9:
                            _iteratorNormalCompletion4 = true;
                            _didIteratorError4 = false;
                            _iteratorError4 = undefined;
                            _context.prev = 12;
                            _iterator4 = _getIterator(managedUserLayer.layer.renderLayers);

                        case 14:
                            if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
                                _context.next = 23;
                                break;
                            }

                            renderLayer = _step4.value;

                            if (renderLayer.ready) {
                                _context.next = 18;
                                break;
                            }

                            return _context.abrupt('continue', 20);

                        case 18:
                            _context.next = 20;
                            return renderLayer;

                        case 20:
                            _iteratorNormalCompletion4 = true;
                            _context.next = 14;
                            break;

                        case 23:
                            _context.next = 29;
                            break;

                        case 25:
                            _context.prev = 25;
                            _context.t0 = _context['catch'](12);
                            _didIteratorError4 = true;
                            _iteratorError4 = _context.t0;

                        case 29:
                            _context.prev = 29;
                            _context.prev = 30;

                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }

                        case 32:
                            _context.prev = 32;

                            if (!_didIteratorError4) {
                                _context.next = 35;
                                break;
                            }

                            throw _iteratorError4;

                        case 35:
                            return _context.finish(32);

                        case 36:
                            return _context.finish(29);

                        case 37:
                            _iteratorNormalCompletion3 = true;
                            _context.next = 5;
                            break;

                        case 40:
                            _context.next = 46;
                            break;

                        case 42:
                            _context.prev = 42;
                            _context.t1 = _context['catch'](3);
                            _didIteratorError3 = true;
                            _iteratorError3 = _context.t1;

                        case 46:
                            _context.prev = 46;
                            _context.prev = 47;

                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }

                        case 49:
                            _context.prev = 49;

                            if (!_didIteratorError3) {
                                _context.next = 52;
                                break;
                            }

                            throw _iteratorError3;

                        case 52:
                            return _context.finish(49);

                        case 53:
                            return _context.finish(46);

                        case 54:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, readyRenderLayers, this, [[3, 42, 46, 54], [12, 25, 29, 37], [30,, 32, 36], [47,, 49, 53]]);
        })
    }, {
        key: 'unbindManagedLayer',
        value: function unbindManagedLayer(managedLayer) {
            this.updateSignalBindings(managedLayer, removeSignalBinding);
            managedLayer.dispose();
        }
    }, {
        key: 'clear',
        value: function clear() {
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(this.managedLayers), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var managedLayer = _step5.value;

                    this.unbindManagedLayer(managedLayer);
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

            this.managedLayers.length = 0;
            this.layerSet.clear();
            this.layersChanged.dispatch();
        }
    }, {
        key: 'remove',
        value: function remove(index) {
            var layer = this.managedLayers[index];
            this.unbindManagedLayer(layer);
            this.managedLayers.splice(index, 1);
            this.layerSet.delete(layer);
            this.layersChanged.dispatch();
        }
    }, {
        key: 'removeManagedLayer',
        value: function removeManagedLayer(managedLayer) {
            var index = this.managedLayers.indexOf(managedLayer);
            if (index === -1) {
                throw new Error('Internal error: invalid managed layer.');
            }
            this.remove(index);
        }
    }, {
        key: 'reorderManagedLayer',
        value: function reorderManagedLayer(oldIndex, newIndex) {
            var numLayers = this.managedLayers.length;
            if (oldIndex === newIndex || oldIndex < 0 || oldIndex >= numLayers || newIndex < 0 || newIndex >= numLayers) {
                // Don't do anything.
                return;
            }

            var _managedLayers$splice = this.managedLayers.splice(oldIndex, 1),
                _managedLayers$splice2 = _slicedToArray(_managedLayers$splice, 1),
                oldLayer = _managedLayers$splice2[0];

            this.managedLayers.splice(newIndex, 0, oldLayer);
            this.layersChanged.dispatch();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.clear();
            _get(LayerManager.prototype.__proto__ || _Object$getPrototypeOf(LayerManager.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'getLayerByName',
        value: function getLayerByName(name) {
            return this.managedLayers.find(function (x) {
                return x.name === name;
            });
        }
    }, {
        key: 'getUniqueLayerName',
        value: function getUniqueLayerName(name) {
            var suggestedName = name;
            var suffix = 0;
            while (this.getLayerByName(suggestedName) !== undefined) {
                suggestedName = name + ++suffix;
            }
            return suggestedName;
        }
    }, {
        key: 'has',
        value: function has(layer) {
            return this.layerSet.has(layer);
        }
        /**
         * Asynchronously initialize the voxelSize and position based on the managed layers.
         *
         * The first ready layer with an associated bounding box will set the position to the center of
         * the bounding box.
         *
         * If the position later becomes invalid, it will be initialized again.
         */

    }, {
        key: 'initializePosition',
        value: function initializePosition(position) {
            var _this9 = this;

            var boundPositions = this.boundPositions;

            if (boundPositions.has(position)) {
                return;
            }
            boundPositions.add(position);
            // Deboucne to ensure that if the position is reset and the layers are reset immediately after,
            // the position will not be reinitialized based on the soon to be reset layers.
            var handler = debounce(function () {
                _this9.updatePositionFromLayers(position);
            });
            this.readyStateChanged.add(handler);
            position.changed.add(handler);
            this.updatePositionFromLayers(position);
        }
    }, {
        key: 'updatePositionFromLayers',
        value: function updatePositionFromLayers(position) {
            if (position.valid) {
                return;
            }
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(this.managedLayers), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var managedLayer = _step6.value;

                    var userLayer = managedLayer.layer;
                    if (userLayer == null) {
                        continue;
                    }
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                        for (var _iterator7 = _getIterator(userLayer.renderLayers), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                            var renderLayer = _step7.value;

                            if (!renderLayer.ready) {
                                continue;
                            }
                            if (!position.voxelSize.valid && renderLayer.voxelSize != null) {
                                vec3.copy(position.voxelSize.size, renderLayer.voxelSize);
                                position.voxelSize.setValid();
                            }
                            if (!position.spatialCoordinatesValid && !position.voxelCoordinatesValid && renderLayer.boundingBox != null) {
                                var boundingBox = renderLayer.boundingBox;
                                var centerPosition = position.spatialCoordinates;
                                vec3.add(centerPosition, boundingBox.lower, boundingBox.upper);
                                vec3.scale(centerPosition, centerPosition, 0.5);
                                position.spatialCoordinatesValid = true;
                                position.changed.dispatch();
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
    }, {
        key: 'invokeAction',
        value: function invokeAction(action) {
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = _getIterator(this.managedLayers), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var managedLayer = _step8.value;

                    if (managedLayer.layer === null || !managedLayer.visible) {
                        continue;
                    }
                    var userLayer = managedLayer.layer;
                    userLayer.handleAction(action);
                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = _getIterator(userLayer.renderLayers), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var renderLayer = _step9.value;

                            if (!renderLayer.ready) {
                                continue;
                            }
                            renderLayer.handleAction(action);
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
    }, {
        key: 'renderLayerToManagedLayerMap',
        get: function get() {
            var generation = this.layersChanged.count;
            var map = this.renderLayerToManagedLayerMap_;
            if (this.renderLayerToManagedLayerMapGeneration !== generation) {
                this.renderLayerToManagedLayerMapGeneration = generation;
                map.clear();
                var _iteratorNormalCompletion10 = true;
                var _didIteratorError10 = false;
                var _iteratorError10 = undefined;

                try {
                    for (var _iterator10 = _getIterator(this.managedLayers), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                        var managedLayer = _step10.value;

                        var userLayer = managedLayer.layer;
                        if (userLayer !== null) {
                            var _iteratorNormalCompletion11 = true;
                            var _didIteratorError11 = false;
                            var _iteratorError11 = undefined;

                            try {
                                for (var _iterator11 = _getIterator(userLayer.renderLayers), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                                    var renderLayer = _step11.value;

                                    map.set(renderLayer, managedLayer);
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
            return map;
        }
    }, {
        key: 'renderLayers',
        get: function get() {
            var layerManager = this;
            return _defineProperty({}, _Symbol$iterator, /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                var _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, managedLayer, _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, renderLayer;

                return _regeneratorRuntime.wrap(function _callee$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _iteratorNormalCompletion12 = true;
                                _didIteratorError12 = false;
                                _iteratorError12 = undefined;
                                _context2.prev = 3;
                                _iterator12 = _getIterator(layerManager.managedLayers);

                            case 5:
                                if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
                                    _context2.next = 38;
                                    break;
                                }

                                managedLayer = _step12.value;

                                if (!(managedLayer.layer === null)) {
                                    _context2.next = 9;
                                    break;
                                }

                                return _context2.abrupt('continue', 35);

                            case 9:
                                _iteratorNormalCompletion13 = true;
                                _didIteratorError13 = false;
                                _iteratorError13 = undefined;
                                _context2.prev = 12;
                                _iterator13 = _getIterator(managedLayer.layer.renderLayers);

                            case 14:
                                if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
                                    _context2.next = 21;
                                    break;
                                }

                                renderLayer = _step13.value;
                                _context2.next = 18;
                                return renderLayer;

                            case 18:
                                _iteratorNormalCompletion13 = true;
                                _context2.next = 14;
                                break;

                            case 21:
                                _context2.next = 27;
                                break;

                            case 23:
                                _context2.prev = 23;
                                _context2.t0 = _context2['catch'](12);
                                _didIteratorError13 = true;
                                _iteratorError13 = _context2.t0;

                            case 27:
                                _context2.prev = 27;
                                _context2.prev = 28;

                                if (!_iteratorNormalCompletion13 && _iterator13.return) {
                                    _iterator13.return();
                                }

                            case 30:
                                _context2.prev = 30;

                                if (!_didIteratorError13) {
                                    _context2.next = 33;
                                    break;
                                }

                                throw _iteratorError13;

                            case 33:
                                return _context2.finish(30);

                            case 34:
                                return _context2.finish(27);

                            case 35:
                                _iteratorNormalCompletion12 = true;
                                _context2.next = 5;
                                break;

                            case 38:
                                _context2.next = 44;
                                break;

                            case 40:
                                _context2.prev = 40;
                                _context2.t1 = _context2['catch'](3);
                                _didIteratorError12 = true;
                                _iteratorError12 = _context2.t1;

                            case 44:
                                _context2.prev = 44;
                                _context2.prev = 45;

                                if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                    _iterator12.return();
                                }

                            case 47:
                                _context2.prev = 47;

                                if (!_didIteratorError12) {
                                    _context2.next = 50;
                                    break;
                                }

                                throw _iteratorError12;

                            case 50:
                                return _context2.finish(47);

                            case 51:
                                return _context2.finish(44);

                            case 52:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee, this, [[3, 40, 44, 52], [12, 23, 27, 35], [28,, 30, 34], [45,, 47, 51]]);
            }));
        }
    }, {
        key: 'visibleRenderLayers',
        get: function get() {
            var layerManager = this;
            return _defineProperty({}, _Symbol$iterator, /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
                var _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, managedLayer, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15, renderLayer;

                return _regeneratorRuntime.wrap(function _callee2$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                _iteratorNormalCompletion14 = true;
                                _didIteratorError14 = false;
                                _iteratorError14 = undefined;
                                _context3.prev = 3;
                                _iterator14 = _getIterator(layerManager.managedLayers);

                            case 5:
                                if (_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done) {
                                    _context3.next = 38;
                                    break;
                                }

                                managedLayer = _step14.value;

                                if (!(managedLayer.layer === null || !managedLayer.visible)) {
                                    _context3.next = 9;
                                    break;
                                }

                                return _context3.abrupt('continue', 35);

                            case 9:
                                _iteratorNormalCompletion15 = true;
                                _didIteratorError15 = false;
                                _iteratorError15 = undefined;
                                _context3.prev = 12;
                                _iterator15 = _getIterator(managedLayer.layer.renderLayers);

                            case 14:
                                if (_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done) {
                                    _context3.next = 21;
                                    break;
                                }

                                renderLayer = _step15.value;
                                _context3.next = 18;
                                return renderLayer;

                            case 18:
                                _iteratorNormalCompletion15 = true;
                                _context3.next = 14;
                                break;

                            case 21:
                                _context3.next = 27;
                                break;

                            case 23:
                                _context3.prev = 23;
                                _context3.t0 = _context3['catch'](12);
                                _didIteratorError15 = true;
                                _iteratorError15 = _context3.t0;

                            case 27:
                                _context3.prev = 27;
                                _context3.prev = 28;

                                if (!_iteratorNormalCompletion15 && _iterator15.return) {
                                    _iterator15.return();
                                }

                            case 30:
                                _context3.prev = 30;

                                if (!_didIteratorError15) {
                                    _context3.next = 33;
                                    break;
                                }

                                throw _iteratorError15;

                            case 33:
                                return _context3.finish(30);

                            case 34:
                                return _context3.finish(27);

                            case 35:
                                _iteratorNormalCompletion14 = true;
                                _context3.next = 5;
                                break;

                            case 38:
                                _context3.next = 44;
                                break;

                            case 40:
                                _context3.prev = 40;
                                _context3.t1 = _context3['catch'](3);
                                _didIteratorError14 = true;
                                _iteratorError14 = _context3.t1;

                            case 44:
                                _context3.prev = 44;
                                _context3.prev = 45;

                                if (!_iteratorNormalCompletion14 && _iterator14.return) {
                                    _iterator14.return();
                                }

                            case 47:
                                _context3.prev = 47;

                                if (!_didIteratorError14) {
                                    _context3.next = 50;
                                    break;
                                }

                                throw _iteratorError14;

                            case 50:
                                return _context3.finish(47);

                            case 51:
                                return _context3.finish(44);

                            case 52:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee2, this, [[3, 40, 44, 52], [12, 23, 27, 35], [28,, 30, 34], [45,, 47, 51]]);
            }));
        }
    }]);

    return LayerManager;
}(RefCounted);
export var MouseSelectionState = function () {
    function MouseSelectionState() {
        _classCallCheck(this, MouseSelectionState);

        this.changed = new NullarySignal();
        this.position = vec3.create();
        this.active = false;
        this.pickedRenderLayer = null;
        this.pickedValue = new Uint64(0, 0);
        this.pickedOffset = 0;
        this.pickedAnnotationLayer = undefined;
        this.pickedAnnotationId = undefined;
        this.pickedAnnotationBuffer = undefined;
        this.pickedAnnotationBufferOffset = undefined;
        this.forcerFunction = undefined;
    }

    _createClass(MouseSelectionState, [{
        key: 'removeForcer',
        value: function removeForcer(forcer) {
            if (forcer === this.forcerFunction) {
                this.forcerFunction = undefined;
                this.setActive(false);
            }
        }
    }, {
        key: 'setForcer',
        value: function setForcer(forcer) {
            this.forcerFunction = forcer;
            if (forcer === undefined) {
                this.setActive(false);
            }
        }
    }, {
        key: 'updateUnconditionally',
        value: function updateUnconditionally() {
            var forcerFunction = this.forcerFunction;

            if (forcerFunction === undefined) {
                return false;
            }
            forcerFunction();
            return this.active;
        }
    }, {
        key: 'setActive',
        value: function setActive(value) {
            if (this.active !== value || value === true) {
                this.active = value;
                this.changed.dispatch();
            }
        }
    }]);

    return MouseSelectionState;
}();
export var LayerSelectedValues = function (_RefCounted5) {
    _inherits(LayerSelectedValues, _RefCounted5);

    function LayerSelectedValues(layerManager, mouseState) {
        _classCallCheck(this, LayerSelectedValues);

        var _this10 = _possibleConstructorReturn(this, (LayerSelectedValues.__proto__ || _Object$getPrototypeOf(LayerSelectedValues)).call(this));

        _this10.layerManager = layerManager;
        _this10.mouseState = mouseState;
        _this10.values = new _Map();
        _this10.changed = new NullarySignal();
        _this10.needsUpdate = true;
        _this10.registerDisposer(mouseState.changed.add(function () {
            _this10.handleChange();
        }));
        _this10.registerDisposer(layerManager.layersChanged.add(function () {
            _this10.handleLayerChange();
        }));
        return _this10;
    }
    /**
     * This should be called when the layer data may have changed, due to the set of managed layers
     * changing or new data having been received.
     */


    _createClass(LayerSelectedValues, [{
        key: 'handleLayerChange',
        value: function handleLayerChange() {
            if (this.mouseState.active) {
                this.handleChange();
            }
        }
    }, {
        key: 'handleChange',
        value: function handleChange() {
            this.needsUpdate = true;
            this.changed.dispatch();
        }
    }, {
        key: 'update',
        value: function update() {
            if (!this.needsUpdate) {
                return;
            }
            this.needsUpdate = false;
            var values = this.values;
            var mouseState = this.mouseState;
            values.clear();
            if (mouseState.active) {
                var position = mouseState.position;
                var _iteratorNormalCompletion16 = true;
                var _didIteratorError16 = false;
                var _iteratorError16 = undefined;

                try {
                    for (var _iterator16 = _getIterator(this.layerManager.managedLayers), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
                        var layer = _step16.value;

                        var userLayer = layer.layer;
                        if (layer.visible && userLayer) {
                            values.set(userLayer, userLayer.getValueAt(position, mouseState));
                        }
                    }
                } catch (err) {
                    _didIteratorError16 = true;
                    _iteratorError16 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion16 && _iterator16.return) {
                            _iterator16.return();
                        }
                    } finally {
                        if (_didIteratorError16) {
                            throw _iteratorError16;
                        }
                    }
                }
            }
        }
    }, {
        key: 'get',
        value: function get(userLayer) {
            this.update();
            return this.values.get(userLayer);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            this.update();
            var result = {};
            var values = this.values;
            var _iteratorNormalCompletion17 = true;
            var _didIteratorError17 = false;
            var _iteratorError17 = undefined;

            try {
                for (var _iterator17 = _getIterator(this.layerManager.managedLayers), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
                    var layer = _step17.value;

                    var userLayer = layer.layer;
                    if (userLayer) {
                        var v = values.get(userLayer);
                        if (v !== undefined) {
                            if (v instanceof Uint64) {
                                v = { 't': 'u64', 'v': v };
                            }
                            result[layer.name] = v;
                        }
                    }
                }
            } catch (err) {
                _didIteratorError17 = true;
                _iteratorError17 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion17 && _iterator17.return) {
                        _iterator17.return();
                    }
                } finally {
                    if (_didIteratorError17) {
                        throw _iteratorError17;
                    }
                }
            }

            return result;
        }
    }]);

    return LayerSelectedValues;
}(RefCounted);
export var VisibleRenderLayerTracker = function (_RefCounted6) {
    _inherits(VisibleRenderLayerTracker, _RefCounted6);

    function VisibleRenderLayerTracker(layerManager, renderLayerType, roles, layerAdded, visibility) {
        _classCallCheck(this, VisibleRenderLayerTracker);

        var _this11 = _possibleConstructorReturn(this, (VisibleRenderLayerTracker.__proto__ || _Object$getPrototypeOf(VisibleRenderLayerTracker)).call(this));

        _this11.layerManager = layerManager;
        _this11.renderLayerType = renderLayerType;
        _this11.roles = roles;
        _this11.layerAdded = layerAdded;
        _this11.visibility = visibility;
        /**
         * Maps a layer to the disposer to call when it is no longer visible.
         */
        _this11.visibleLayers = new _Map();
        _this11.newVisibleLayers = new _Set();
        _this11.debouncedUpdateVisibleLayers = _this11.registerCancellable(debounce(function () {
            return _this11.updateVisibleLayers();
        }, 0));
        _this11.registerDisposer(layerManager.layersChanged.add(_this11.debouncedUpdateVisibleLayers));
        _this11.registerDisposer(roles.changed.add(_this11.debouncedUpdateVisibleLayers));
        _this11.updateVisibleLayers();
        return _this11;
    }

    _createClass(VisibleRenderLayerTracker, [{
        key: 'disposed',
        value: function disposed() {
            this.visibleLayers.forEach(function (disposer) {
                return disposer();
            });
            this.visibleLayers.clear();
            _get(VisibleRenderLayerTracker.prototype.__proto__ || _Object$getPrototypeOf(VisibleRenderLayerTracker.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'updateVisibleLayers',
        value: function updateVisibleLayers() {
            var _this12 = this;

            var visibleLayers = this.visibleLayers,
                newVisibleLayers = this.newVisibleLayers,
                renderLayerType = this.renderLayerType,
                layerAdded = this.layerAdded,
                roles = this.roles;
            var _iteratorNormalCompletion18 = true;
            var _didIteratorError18 = false;
            var _iteratorError18 = undefined;

            try {
                for (var _iterator18 = _getIterator(this.layerManager.readyRenderLayers()), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
                    var renderLayer = _step18.value;

                    if (renderLayer instanceof renderLayerType && roles.has(renderLayer.role)) {
                        (function () {
                            var typedLayer = renderLayer;
                            newVisibleLayers.add(typedLayer);
                            if (!visibleLayers.has(typedLayer)) {
                                var visibilityDisposer = typedLayer.visibility.add(_this12.visibility);
                                var _disposer = layerAdded(typedLayer);
                                visibleLayers.set(typedLayer.addRef(), function () {
                                    _disposer();
                                    visibilityDisposer();
                                    typedLayer.dispose();
                                });
                            }
                        })();
                    }
                }
            } catch (err) {
                _didIteratorError18 = true;
                _iteratorError18 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion18 && _iterator18.return) {
                        _iterator18.return();
                    }
                } finally {
                    if (_didIteratorError18) {
                        throw _iteratorError18;
                    }
                }
            }

            var _iteratorNormalCompletion19 = true;
            var _didIteratorError19 = false;
            var _iteratorError19 = undefined;

            try {
                for (var _iterator19 = _getIterator(visibleLayers), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
                    var _ref4 = _step19.value;

                    var _ref5 = _slicedToArray(_ref4, 2);

                    var _renderLayer = _ref5[0];
                    var disposer = _ref5[1];

                    if (!newVisibleLayers.has(_renderLayer)) {
                        visibleLayers.delete(_renderLayer);
                        disposer();
                    }
                }
            } catch (err) {
                _didIteratorError19 = true;
                _iteratorError19 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion19 && _iterator19.return) {
                        _iterator19.return();
                    }
                } finally {
                    if (_didIteratorError19) {
                        throw _iteratorError19;
                    }
                }
            }

            newVisibleLayers.clear();
        }
    }, {
        key: 'getVisibleLayers',
        value: function getVisibleLayers() {
            this.debouncedUpdateVisibleLayers.flush();
            return [].concat(_toConsumableArray(this.visibleLayers.keys()));
        }
    }]);

    return VisibleRenderLayerTracker;
}(RefCounted);
export function makeRenderedPanelVisibleLayerTracker(layerManager, renderLayerType, roles, panel, layerAdded) {
    return panel.registerDisposer(new VisibleRenderLayerTracker(layerManager, renderLayerType, roles, function (layer) {
        var disposer = layer.redrawNeeded.add(function () {
            return panel.scheduleRedraw();
        });
        var disposer2 = layerAdded && layerAdded(layer);
        panel.scheduleRedraw();
        return function () {
            if (disposer2 !== undefined) {
                disposer2();
            }
            disposer();
            panel.scheduleRedraw();
        };
    }, panel.visibility));
}
export var SelectedLayerState = function (_RefCounted7) {
    _inherits(SelectedLayerState, _RefCounted7);

    function SelectedLayerState(layerManager) {
        _classCallCheck(this, SelectedLayerState);

        var _this13 = _possibleConstructorReturn(this, (SelectedLayerState.__proto__ || _Object$getPrototypeOf(SelectedLayerState)).call(this));

        _this13.layerManager = layerManager;
        _this13.changed = new NullarySignal();
        _this13.visible_ = false;
        _this13.size = new TrackableValue(300, verifyPositiveInt);
        _this13.registerDisposer(layerManager);
        _this13.size.changed.add(_this13.changed.dispatch);
        return _this13;
    }

    _createClass(SelectedLayerState, [{
        key: 'toJSON',
        value: function toJSON() {
            if (this.layer === undefined) {
                return undefined;
            }
            return {
                'layer': this.layer.name,
                'visible': this.visible === true ? true : undefined,
                'size': this.size.toJSON()
            };
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this14 = this;

            if (obj === undefined) {
                this.reset();
                return;
            }
            verifyObject(obj);
            var layerName = verifyObjectProperty(obj, 'layer', verifyOptionalString);
            var layer = layerName !== undefined ? this.layerManager.getLayerByName(layerName) : undefined;
            this.layer = layer;
            this.visible = verifyObjectProperty(obj, 'visible', verifyOptionalBoolean) ? true : false;
            verifyObjectProperty(obj, 'size', function (x) {
                return _this14.size.restoreState(x);
            });
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.layer = undefined;
        }
    }, {
        key: 'layer',
        get: function get() {
            return this.layer_;
        },
        set: function set(layer) {
            var _this15 = this;

            if (layer === this.layer_) {
                return;
            }
            if (this.layer_ !== undefined) {
                this.existingLayerDisposer();
                this.existingLayerDisposer = undefined;
            }
            this.layer_ = layer;
            if (layer !== undefined) {
                var layerDisposed = function layerDisposed() {
                    _this15.layer_ = undefined;
                    _this15.visible = false;
                    _this15.existingLayerDisposer = undefined;
                    _this15.changed.dispatch();
                };
                layer.registerDisposer(layerDisposed);
                var layerChangedDisposer = layer.specificationChanged.add(function () {
                    _this15.changed.dispatch();
                });
                this.existingLayerDisposer = function () {
                    var userLayer = layer.layer;
                    if (userLayer !== null) {
                        var tool = userLayer.tool.value;
                        if (tool !== undefined) {
                            tool.deactivate();
                        }
                    }
                    layer.unregisterDisposer(layerDisposed);
                    layerChangedDisposer();
                };
            } else {
                this.visible_ = false;
            }
            this.changed.dispatch();
        }
    }, {
        key: 'visible',
        get: function get() {
            return this.visible_;
        },
        set: function set(value) {
            if (this.layer_ === undefined) {
                value = false;
            }
            if (this.visible_ !== value) {
                this.visible_ = value;
                this.changed.dispatch();
            }
        }
    }]);

    return SelectedLayerState;
}(RefCounted);
export var LayerReference = function (_RefCounted8) {
    _inherits(LayerReference, _RefCounted8);

    function LayerReference(layerManager, filter) {
        _classCallCheck(this, LayerReference);

        var _this16 = _possibleConstructorReturn(this, (LayerReference.__proto__ || _Object$getPrototypeOf(LayerReference)).call(this));

        _this16.layerManager = layerManager;
        _this16.filter = filter;
        _this16.changed = new NullarySignal();
        _this16.validate = debounce(function () {
            var layerName_ = _this16.layerName_;

            if (layerName_ !== undefined) {
                var layer = _this16.layerManager.getLayerByName(layerName_);
                if (layer !== undefined && _this16.filter(layer)) {
                    _this16.layer_ = layer;
                    _this16.changed.dispatch();
                } else {
                    _this16.layer_ = undefined;
                    _this16.layerName_ = undefined;
                    _this16.changed.dispatch();
                }
            }
        }, 0);
        _this16.registerDisposer(layerManager);
        _this16.registerDisposer(layerManager.specificationChanged.add(function () {
            var layer_ = _this16.layer_;

            if (layer_ !== undefined) {
                if (!_this16.layerManager.layerSet.has(layer_) || !_this16.filter(layer_)) {
                    _this16.layer_ = undefined;
                    _this16.layerName_ = undefined;
                    _this16.changed.dispatch();
                } else {
                    var name = layer_.name;

                    if (name !== _this16.layerName_) {
                        _this16.layerName_ = name;
                        _this16.changed.dispatch();
                    }
                }
            }
        }));
        return _this16;
    }

    _createClass(LayerReference, [{
        key: 'restoreState',
        value: function restoreState(obj) {
            var layerName = verifyOptionalString(obj);
            this.layerName = layerName;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var layer_ = this.layer_;

            if (layer_ !== undefined) {
                return layer_.name;
            }
            return this.layerName_;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.layerName_ = undefined;
            this.layer_ = undefined;
            this.changed.dispatch();
        }
    }, {
        key: 'layer',
        get: function get() {
            return this.layer_;
        },
        set: function set(value) {
            if (this.layer_ === value) {
                return;
            }
            if (value !== undefined && this.layerManager.layerSet.has(value) && this.filter(value)) {
                this.layer_ = value;
                this.layerName_ = value.name;
            } else {
                this.layer_ = undefined;
                this.layerName_ = undefined;
            }
            this.changed.dispatch();
        }
    }, {
        key: 'layerName',
        get: function get() {
            return this.layerName_;
        },
        set: function set(value) {
            if (value === this.layerName_) {
                return;
            }
            this.layer_ = undefined;
            this.layerName_ = value;
            this.changed.dispatch();
            this.validate();
        }
    }]);

    return LayerReference;
}(RefCounted);
//# sourceMappingURL=layer.js.map