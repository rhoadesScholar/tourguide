import _Map from 'babel-runtime/core-js/map';
import _Set from 'babel-runtime/core-js/set';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Promise from 'babel-runtime/core-js/promise';
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
import { LayerManager, ManagedUserLayer } from './layer';
import { VolumeType } from './sliceview/volume/base';
import { StatusMessage } from './status';
import { RefCounted } from './util/disposable';
import { parseArray, verifyObject, verifyObjectProperty, verifyOptionalString, verifyString } from './util/json';
import { NullarySignal, Signal } from './util/signal';
export function getVolumeWithStatusMessage(dataSourceProvider, chunkManager, x) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    return StatusMessage.forPromise(new _Promise(function (resolve) {
        resolve(dataSourceProvider.getVolume(chunkManager, x, options));
    }), {
        initialMessage: 'Retrieving metadata for volume ' + x + '.',
        delay: true,
        errorPrefix: 'Error retrieving metadata for volume ' + x + ': '
    });
}
export var ManagedUserLayerWithSpecification = function (_ManagedUserLayer) {
    _inherits(ManagedUserLayerWithSpecification, _ManagedUserLayer);

    function ManagedUserLayerWithSpecification(name, initialSpecification, manager) {
        _classCallCheck(this, ManagedUserLayerWithSpecification);

        var _this = _possibleConstructorReturn(this, (ManagedUserLayerWithSpecification.__proto__ || _Object$getPrototypeOf(ManagedUserLayerWithSpecification)).call(this, name));

        _this.initialSpecification = initialSpecification;
        _this.manager = manager;
        return _this;
    }

    _createClass(ManagedUserLayerWithSpecification, [{
        key: 'toJSON',
        value: function toJSON() {
            var userLayer = this.layer;
            if (!userLayer) {
                return this.initialSpecification;
            }
            var layerSpec = userLayer.toJSON();
            layerSpec.name = this.name;
            if (!this.visible) {
                layerSpec['visible'] = false;
            }
            return layerSpec;
        }
    }]);

    return ManagedUserLayerWithSpecification;
}(ManagedUserLayer);
export var TopLevelLayerListSpecification = function (_RefCounted) {
    _inherits(TopLevelLayerListSpecification, _RefCounted);

    function TopLevelLayerListSpecification(dataSourceProvider, layerManager, chunkManager, layerSelectedValues, voxelSize) {
        _classCallCheck(this, TopLevelLayerListSpecification);

        var _this2 = _possibleConstructorReturn(this, (TopLevelLayerListSpecification.__proto__ || _Object$getPrototypeOf(TopLevelLayerListSpecification)).call(this));

        _this2.dataSourceProvider = dataSourceProvider;
        _this2.layerManager = layerManager;
        _this2.chunkManager = chunkManager;
        _this2.layerSelectedValues = layerSelectedValues;
        _this2.voxelSize = voxelSize;
        _this2.changed = new NullarySignal();
        _this2.voxelCoordinatesSet = new Signal();
        _this2.spatialCoordinatesSet = new Signal();
        _this2.registerDisposer(layerManager.layersChanged.add(_this2.changed.dispatch));
        _this2.registerDisposer(layerManager.specificationChanged.add(_this2.changed.dispatch));
        return _this2;
    }
    /**
     * @deprecated
     */


    _createClass(TopLevelLayerListSpecification, [{
        key: 'reset',
        value: function reset() {
            this.layerManager.clear();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            this.layerManager.clear();
            if (Array.isArray(x)) {
                // If array, layers have an order
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(x), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var layerObj = _step.value;

                        verifyObject(layerObj);
                        var name = this.layerManager.getUniqueLayerName(verifyObjectProperty(layerObj, 'name', verifyString));
                        this.layerManager.addManagedLayer(this.getLayer(name, layerObj));
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
            } else {
                // Keep for backwards compatibility
                verifyObject(x);
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _getIterator(_Object$keys(x)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var key = _step2.value;

                        this.layerManager.addManagedLayer(this.getLayer(key, x[key]));
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
        }
    }, {
        key: 'initializeLayerFromSpec',
        value: function initializeLayerFromSpec(managedLayer, spec) {
            var _this3 = this;

            managedLayer.initialSpecification = spec;
            if (typeof spec === 'string') {
                spec = { 'source': spec };
            }
            verifyObject(spec);
            var layerType = verifyObjectProperty(spec, 'type', verifyOptionalString);
            managedLayer.visible = verifyObjectProperty(spec, 'visible', function (x) {
                if (x === undefined || x === true) {
                    return true;
                }
                if (x === false) {
                    return false;
                }
                throw new Error('Expected boolean, but received: ' + _JSON$stringify(x) + '.');
            });
            var makeUserLayer = function makeUserLayer(layerConstructor, spec) {
                var userLayer = new layerConstructor(_this3, spec);
                userLayer.restoreState(spec);
                managedLayer.layer = userLayer;
            };
            var sourceUrl = managedLayer.sourceUrl = verifyObjectProperty(spec, 'source', verifyOptionalString);
            if (layerType === undefined) {
                if (sourceUrl === undefined) {
                    throw new Error('Either layer \'type\' or \'source\' URL must be specified.');
                }
                var volumeSourcePromise = getVolumeWithStatusMessage(this.dataSourceProvider, this.chunkManager, sourceUrl);
                volumeSourcePromise.then(function (source) {
                    if (_this3.layerManager.managedLayers.indexOf(managedLayer) === -1) {
                        // Layer was removed before promise became ready.
                        return;
                    }
                    var layerConstructor = volumeLayerTypes.get(source.volumeType);
                    if (layerConstructor !== undefined) {
                        makeUserLayer(layerConstructor, spec);
                    } else {
                        throw new Error('Unsupported volume type: ' + VolumeType[source.volumeType] + '.');
                    }
                });
            } else {
                var layerConstructor = layerTypes.get(layerType);
                if (layerConstructor !== undefined) {
                    makeUserLayer(layerConstructor, spec);
                } else {
                    throw new Error('Unsupported layer type: ' + _JSON$stringify(layerType) + '.');
                }
            }
        }
    }, {
        key: 'getLayer',
        value: function getLayer(name, spec) {
            var managedLayer = new ManagedUserLayerWithSpecification(name, spec, this);
            this.initializeLayerFromSpec(managedLayer, spec);
            return managedLayer;
        }
    }, {
        key: 'add',
        value: function add(layer, index) {
            if (this.layerManager.managedLayers.indexOf(layer) === -1) {
                layer.name = this.layerManager.getUniqueLayerName(layer.name);
            }
            this.layerManager.addManagedLayer(layer, index);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var result = [];
            var numResults = 0;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.layerManager.managedLayers), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var managedLayer = _step3.value;

                    var layerJson = managedLayer.toJSON();
                    // A `null` layer specification is used to indicate a transient drag target, and should not be
                    // serialized.
                    if (layerJson != null) {
                        result.push(layerJson);
                        ++numResults;
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

            if (numResults === 0) {
                return undefined;
            }
            return result;
        }
        /**
         * Called by user layers to indicate that a voxel position has been selected interactively.
         */

    }, {
        key: 'setVoxelCoordinates',
        value: function setVoxelCoordinates(voxelCoordinates) {
            this.voxelCoordinatesSet.dispatch(voxelCoordinates);
        }
    }, {
        key: 'setSpatialCoordinates',
        value: function setSpatialCoordinates(spatialCoordinates) {
            this.spatialCoordinatesSet.dispatch(spatialCoordinates);
        }
    }, {
        key: 'worker',
        get: function get() {
            return this.chunkManager.rpc;
        }
    }, {
        key: 'rpc',
        get: function get() {
            return this.chunkManager.rpc;
        }
    }, {
        key: 'rootLayers',
        get: function get() {
            return this.layerManager;
        }
    }]);

    return TopLevelLayerListSpecification;
}(RefCounted);
/**
 * Class for specifying a subset of a TopLevelLayerListsSpecification.
 */
export var LayerSubsetSpecification = function (_RefCounted2) {
    _inherits(LayerSubsetSpecification, _RefCounted2);

    function LayerSubsetSpecification(master) {
        _classCallCheck(this, LayerSubsetSpecification);

        var _this4 = _possibleConstructorReturn(this, (LayerSubsetSpecification.__proto__ || _Object$getPrototypeOf(LayerSubsetSpecification)).call(this));

        _this4.master = master;
        _this4.changed = new NullarySignal();
        _this4.layerManager = new LayerManager();
        _this4.registerDisposer(master);
        var layerManager = _this4.layerManager;

        _this4.registerDisposer(layerManager.layersChanged.add(_this4.changed.dispatch));
        _this4.registerDisposer(layerManager.specificationChanged.add(_this4.changed.dispatch));
        return _this4;
    }

    _createClass(LayerSubsetSpecification, [{
        key: 'reset',
        value: function reset() {
            this.layerManager.clear();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            var masterLayerManager = this.master.layerManager;
            var layers = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(new _Set(parseArray(x, verifyString))), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var name = _step4.value;

                    var layer = masterLayerManager.getLayerByName(name);
                    if (layer === undefined) {
                        throw new Error('Undefined layer referenced in subset specification: ' + _JSON$stringify(name));
                    }
                    layers.push(layer);
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

            this.layerManager.clear();
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = _getIterator(layers), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var layer = _step5.value;

                    this.layerManager.addManagedLayer(layer.addRef());
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
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.layerManager.managedLayers.map(function (x) {
                return x.name;
            });
        }
    }, {
        key: 'initializeLayerFromSpec',
        value: function initializeLayerFromSpec(managedLayer, spec) {
            this.master.initializeLayerFromSpec(managedLayer, spec);
        }
    }, {
        key: 'getLayer',
        value: function getLayer(name, spec) {
            return this.master.getLayer(name, spec);
        }
    }, {
        key: 'add',
        value: function add(layer, index) {
            if (this.master.layerManager.managedLayers.indexOf(layer) === -1) {
                layer.name = this.master.layerManager.getUniqueLayerName(layer.name);
                this.master.layerManager.addManagedLayer(layer.addRef());
            }
            this.layerManager.addManagedLayer(layer, index);
        }
    }, {
        key: 'setVoxelCoordinates',
        value: function setVoxelCoordinates(voxelCoordinates) {
            this.master.setVoxelCoordinates(voxelCoordinates);
        }
    }, {
        key: 'setSpatialCoordinates',
        value: function setSpatialCoordinates(spatialCoordinates) {
            this.master.setSpatialCoordinates(spatialCoordinates);
        }
    }, {
        key: 'voxelCoordinatesSet',
        get: function get() {
            return this.master.voxelCoordinatesSet;
        }
    }, {
        key: 'spatialCoordinatesSet',
        get: function get() {
            return this.master.spatialCoordinatesSet;
        }
    }, {
        key: 'worker',
        get: function get() {
            return this.master.rpc;
        }
    }, {
        key: 'rpc',
        get: function get() {
            return this.master.rpc;
        }
    }, {
        key: 'dataSourceProvider',
        get: function get() {
            return this.master.dataSourceProvider;
        }
    }, {
        key: 'chunkManager',
        get: function get() {
            return this.master.chunkManager;
        }
    }, {
        key: 'voxelSize',
        get: function get() {
            return this.master.voxelSize;
        }
    }, {
        key: 'layerSelectedValues',
        get: function get() {
            return this.master.layerSelectedValues;
        }
    }, {
        key: 'rootLayers',
        get: function get() {
            return this.master.rootLayers;
        }
    }]);

    return LayerSubsetSpecification;
}(RefCounted);
var layerTypes = new _Map();
var volumeLayerTypes = new _Map();
export function registerLayerType(name, layerConstructor) {
    layerTypes.set(name, layerConstructor);
}
export function registerVolumeLayerType(volumeType, layerConstructor) {
    volumeLayerTypes.set(volumeType, layerConstructor);
}
//# sourceMappingURL=layer_specification.js.map