import _Map from 'babel-runtime/core-js/map';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _Set from 'babel-runtime/core-js/set';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
/**
 * @license
 * Copyright 2017 Google Inc.
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
import { ManagedUserLayerWithSpecification } from '../layer_specification';
import { decodeParametersFromDragTypeList, encodeParametersAsDragType, setDropEffect } from '../util/drag_and_drop';
import { parseArray, verifyBoolean, verifyObjectProperty, verifyString } from '../util/json';
var layerDragTypePrefix = 'neuroglancer-layer\0';
var dragSource = void 0;
export function startLayerDrag(event, sourceInfo) {
    event.dataTransfer.setData(encodeParametersAsDragType(layerDragTypePrefix, sourceInfo.layers.map(function (layer) {
        return { name: layer.name, visible: layer.visible };
    })), _JSON$stringify({ layers: sourceInfo.layers.map(function (layer) {
            return layer.toJSON();
        }), layout: sourceInfo.layoutSpec }));
    if (dragSource !== undefined) {
        dragSource.disposer();
    }
    var newDragSource = void 0;
    var disposer = function disposer() {
        sourceInfo.manager.unregisterDisposer(disposer);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(sourceInfo.layers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var layer = _step.value;

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

        sourceInfo.manager.dispose();
        if (dragSource === newDragSource) {
            dragSource = undefined;
        }
    };
    dragSource = newDragSource = {
        manager: sourceInfo.manager.addRef(),
        layers: sourceInfo.layers.map(function (x) {
            return x.addRef();
        }),
        layoutSpec: sourceInfo.layoutSpec,
        disposer: disposer
    };
}
export function endLayerDrag(event) {
    if (dragSource !== undefined) {
        if (event && event.dataTransfer.dropEffect === 'move') {
            var removedLayers = new _Set(dragSource.layers);
            dragSource.manager.layerManager.filter(function (x) {
                return !removedLayers.has(x);
            });
        }
        dragSource.disposer();
    }
}
export function getLayerDragInfo(event) {
    return decodeParametersFromDragTypeList(event.dataTransfer.types, layerDragTypePrefix);
}
function getCompatibleDragSource(manager) {
    if (dragSource !== undefined && dragSource.manager.rootLayers === manager.rootLayers) {
        return dragSource;
    }
    return undefined;
}
export var DropLayers = function () {
    function DropLayers() {
        _classCallCheck(this, DropLayers);
    }

    _createClass(DropLayers, [{
        key: 'finalize',

        /**
         * Called in the 'drop' event handler to actually initialize the layers if they are external.
         * Returns false if any layers failed to initialized.
         */
        value: function finalize(event) {
            var dragType = this.dragType;

            if (dragType !== undefined) {
                try {
                    var _JSON$parse = JSON.parse(event.dataTransfer.getData(dragType)),
                        spec = _JSON$parse.layers,
                        layout = _JSON$parse.layout;

                    if (!Array.isArray(spec) || this.numSourceLayers !== spec.length) {
                        throw new Error('Invalid layer drop data');
                    }
                    this.layoutSpec = layout;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = _getIterator(this.layers), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var _ref = _step2.value;

                            var _ref2 = _slicedToArray(_ref, 2);

                            var layer = _ref2[0];
                            var index = _ref2[1];

                            this.manager.initializeLayerFromSpec(layer, spec[index]);
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

                    return true;
                } catch (_a) {
                    return false;
                }
            }
            return true;
        }
    }, {
        key: 'compatibleWithMethod',
        value: function compatibleWithMethod(otherMethod) {
            if (this.method === otherMethod) {
                return true;
            }
            if (!this.moveSupported && otherMethod === 'move') {
                return true;
            }
            return false;
        }
    }, {
        key: 'method',
        get: function get() {
            if (this.sourceManager !== undefined) {
                if (this.manager === this.sourceManager) {
                    return 'move';
                } else {
                    return 'link';
                }
            } else {
                return 'copy';
            }
        }
    }]);

    return DropLayers;
}();
export function getDefaultLayerDropEfect(manager) {
    var newTarget = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var source = getCompatibleDragSource(manager);
    if (source === undefined) {
        return 'copy';
    }
    if (!newTarget && source.manager === manager) {
        return 'move';
    }
    return 'link';
}
export function getLayerDropEffect(event, manager) {
    var newTarget = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (event.shiftKey) {
        return 'copy';
    } else if (event.ctrlKey) {
        return 'move';
    } else {
        return getDefaultLayerDropEfect(manager, newTarget);
    }
}
export function updateLayerDropEffect(event, manager) {
    var newTarget = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    return setDropEffect(event, getLayerDropEffect(event, manager, newTarget));
}
export function getDropLayers(event, manager, forceCopy, allowMove, newTarget) {
    var source = getCompatibleDragSource(manager);
    var moveSupported = !newTarget && source !== undefined && source.manager === manager;
    if (!forceCopy) {
        if (source !== undefined) {
            var result = new DropLayers();
            result.manager = manager;
            result.numSourceLayers = source.layers.length;
            result.sourceManager = source.manager;
            result.moveSupported = moveSupported;
            result.layers = new _Map();
            result.layoutSpec = source.layoutSpec;
            if (!newTarget && source.manager === manager) {
                if (allowMove) {
                    source.layers.forEach(function (layer, index) {
                        result.layers.set(layer, index);
                    });
                } else {
                    return undefined;
                }
            }
            source.layers.forEach(function (layer, index) {
                if (newTarget || !manager.layerManager.has(layer)) {
                    result.layers.set(layer.addRef(), index);
                }
            });
            return result;
        }
    }
    var info = getLayerDragInfo(event);
    if (info !== undefined) {
        try {
            var layers = parseArray(info.parameters, function (layerInfo, index) {
                var name = verifyObjectProperty(layerInfo, 'name', verifyString);
                var visible = verifyObjectProperty(layerInfo, 'visible', verifyBoolean);
                var newLayer = new ManagedUserLayerWithSpecification(name, null, manager);
                newLayer.visible = visible;
                return [newLayer, index];
            });
            var _result = new DropLayers();
            _result.numSourceLayers = layers.length;
            _result.moveSupported = moveSupported;
            _result.manager = manager;
            _result.dragType = info.dragType;
            _result.layers = new _Map(layers);
            return _result;
        } catch (_a) {}
    }
    return undefined;
}
//# sourceMappingURL=layer_drag_and_drop.js.map