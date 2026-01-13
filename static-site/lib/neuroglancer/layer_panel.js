import _Math$fround from 'babel-runtime/core-js/math/fround';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _Set from 'babel-runtime/core-js/set';
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
import { LayerDialog } from './layer_dialog';
import { ManagedUserLayerWithSpecification } from './layer_specification';
import { NavigationLinkType } from './navigation_state';
import { endLayerDrag, getDropLayers, getLayerDropEffect, startLayerDrag } from './ui/layer_drag_and_drop';
import { animationFrameDebounce } from './util/animation_frame_debounce';
import { RefCounted, registerEventListener } from './util/disposable';
import { removeFromParent } from './util/dom';
import { getDropEffect, preventDrag, setDropEffect } from './util/drag_and_drop';
import { float32ToString } from './util/float32_to_string';
import { makeCloseButton, makeRefreshButton } from './widget/close_button';
import { PositionWidget } from './widget/position_widget';

function destroyDropLayers(dropLayers, targetLayer) {
    if (dropLayers.method === 'move') {
        // Nothing to do.
        return false;
    }
    dropLayers.manager.layerManager.filter(function (layer) {
        return !dropLayers.layers.has(layer);
    });
    return targetLayer !== undefined && dropLayers.layers.has(targetLayer);
}
function registerDropHandlers(panel, target, targetLayer) {
    function update(event, updateDropEffect) {
        var dropLayers = panel.dropLayers;
        var dropEffect = updateDropEffect ? getLayerDropEffect(event, panel.manager) : getDropEffect();
        var existingDropLayers = true;
        if (dropLayers !== undefined) {
            if (updateDropEffect) {
                setDropEffect(event, dropEffect);
            }
            if (!dropLayers.compatibleWithMethod(dropEffect)) {
                panel.dropLayers = undefined;
                if (destroyDropLayers(dropLayers, targetLayer)) {
                    // We destroyed the layer for which we received the dragenter event.  Wait until we get
                    // another dragenter or drop event to do something.
                    return undefined;
                }
            }
        }
        if (dropLayers === undefined) {
            dropLayers = panel.dropLayers = getDropLayers(event, panel.manager, /*forceCopy=*/dropEffect === 'copy', /*allowMove=*/true,
            /*newTarget=*/false);
            if (dropLayers === undefined) {
                return undefined;
            }
            existingDropLayers = dropLayers.method === 'move';
        }
        // Dragged onto itself, nothing to do.
        if (targetLayer !== undefined && dropLayers.layers.has(targetLayer)) {
            return dropLayers;
        }
        if (!existingDropLayers) {
            var newIndex = void 0;
            if (targetLayer !== undefined) {
                newIndex = panel.manager.layerManager.managedLayers.indexOf(targetLayer);
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(dropLayers.layers.keys()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var newLayer = _step.value;

                    panel.manager.add(newLayer, newIndex);
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
            // Rearrange layers.
            var layerManager = panel.manager.layerManager;

            var existingLayers = new _Set();
            var firstRemovalIndex = Number.POSITIVE_INFINITY;
            var managedLayers = layerManager.managedLayers = layerManager.managedLayers.filter(function (x, index) {
                if (dropLayers.layers.has(x)) {
                    if (firstRemovalIndex === Number.POSITIVE_INFINITY) {
                        firstRemovalIndex = index;
                    }
                    existingLayers.add(x);
                    return false;
                } else {
                    return true;
                }
            });
            var _newIndex = void 0;
            if (targetLayer !== undefined) {
                _newIndex = managedLayers.indexOf(targetLayer);
                if (firstRemovalIndex <= _newIndex) {
                    ++_newIndex;
                }
            } else {
                _newIndex = managedLayers.length;
            }
            // Filter out layers that have been concurrently removed.
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(dropLayers.layers.keys()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var layer = _step2.value;

                    if (!existingLayers.has(layer)) {
                        dropLayers.layers.delete(layer);
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

            managedLayers.splice.apply(managedLayers, [_newIndex, 0].concat(_toConsumableArray(dropLayers.layers.keys())));
            layerManager.layersChanged.dispatch();
        }
        return dropLayers;
    }
    var enterDisposer = registerEventListener(target, 'dragenter', function (event) {
        if (update(event, /*updateDropEffect=*/true) !== undefined) {
            event.preventDefault();
        }
    });
    var dropDisposer = registerEventListener(target, 'drop', function (event) {
        event.preventDefault();
        var dropLayers = update(event, /*updateDropEffect=*/false);
        if (dropLayers !== undefined) {
            if (!dropLayers.finalize(event)) {
                destroyDropLayers(dropLayers);
            } else {
                event.dataTransfer.dropEffect = getDropEffect();
                endLayerDrag(dropLayers.method === 'move' ? undefined : event);
            }
        }
        panel.dropLayers = undefined;
    });
    var overDisposer = registerEventListener(target, 'dragover', function (event) {
        var dropLayers = update(event, /*updateDropEffect=*/true);
        if (dropLayers === undefined) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    });
    return function () {
        overDisposer();
        dropDisposer();
        enterDisposer();
    };
}

var LayerWidget = function (_RefCounted) {
    _inherits(LayerWidget, _RefCounted);

    function LayerWidget(layer, panel) {
        _classCallCheck(this, LayerWidget);

        var _this = _possibleConstructorReturn(this, (LayerWidget.__proto__ || _Object$getPrototypeOf(LayerWidget)).call(this));

        _this.layer = layer;
        _this.panel = panel;
        var element = _this.element = document.createElement('div');
        element.title = 'Control+click for layer options, drag to move/copy.';
        element.className = 'neuroglancer-layer-item neuroglancer-noselect';
        var labelElement = _this.labelElement = document.createElement('span');
        labelElement.className = 'neuroglancer-layer-item-label';
        var layerNumberElement = _this.layerNumberElement = document.createElement('span');
        layerNumberElement.className = 'neuroglancer-layer-item-number';
        var valueElement = _this.valueElement = document.createElement('span');
        valueElement.className = 'neuroglancer-layer-item-value';
        var closeElement = makeCloseButton();
        closeElement.title = 'Delete layer';
        var refreshElement = makeRefreshButton();
        refreshElement.title = 'Refresh data';
        _this.registerEventListener(closeElement, 'click', function (event) {
            _this.panel.layerManager.removeManagedLayer(_this.layer);
            event.stopPropagation();
        });
        _this.registerEventListener(refreshElement, 'click', function (event) {
            event.stopPropagation();
            var spec = _this.layer.initialSpecification;
            var recoverLayerSelection = panel.selectedLayer.layer == _this.layer && panel.selectedLayer.visible ? function (layer) {
                _this.panel.selectedLayer.layer = layer;
                _this.panel.selectedLayer.visible = true;
            } : function (_0) {};
            _this.panel.layerManager.removeManagedLayer(_this.layer);
            _this.layer.manager.dataSourceProvider.getDataSource(_this.layer.sourceUrl)[0].forgetAnnotationSource(_this.layer.manager.chunkManager);
            setTimeout(function () {
                var layer = panel.manager.getLayer(spec.name, spec);
                _this.panel.manager.add(layer);
                recoverLayerSelection(layer);
            }, 100);
        });
        if (_this.allowingRefresh(layer)) {
            element.appendChild(refreshElement);
        }
        element.appendChild(layerNumberElement);
        element.appendChild(labelElement);
        element.appendChild(valueElement);
        element.appendChild(closeElement);
        _this.registerEventListener(element, 'click', function (event) {
            if (event.ctrlKey) {
                panel.selectedLayer.layer = layer;
                panel.selectedLayer.visible = true;
            } else {
                layer.setVisible(!layer.visible);
            }
        });
        _this.registerEventListener(element, 'contextmenu', function (event) {
            panel.selectedLayer.layer = layer;
            panel.selectedLayer.visible = true;
            event.stopPropagation();
            event.preventDefault();
        });
        element.draggable = true;
        _this.registerEventListener(element, 'dragstart', function (event) {
            startLayerDrag(event, { manager: panel.manager, layers: [_this.layer], layoutSpec: panel.getLayoutSpecForDrag() });
            event.stopPropagation();
        });
        _this.registerEventListener(element, 'dragend', function (event) {
            endLayerDrag(event);
        });
        _this.registerDisposer(registerDropHandlers(_this.panel, element, _this.layer));
        _this.registerEventListener(element, 'dblclick', function (_event) {
            if (layer instanceof ManagedUserLayerWithSpecification) {
                new LayerDialog(_this.panel.manager, layer);
            }
        });
        return _this;
    }

    _createClass(LayerWidget, [{
        key: 'allowingRefresh',
        value: function allowingRefresh(layer) {
            return layer.initialSpecification.type === 'annotation';
        }
    }, {
        key: 'update',
        value: function update() {
            var layer = this.layer;

            this.labelElement.textContent = layer.name;
            this.element.setAttribute('layer-visible', layer.visible.toString());
            this.element.setAttribute('layer-selected', (layer === this.panel.selectedLayer.layer).toString());
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.element.parentElement.removeChild(this.element);
            _get(LayerWidget.prototype.__proto__ || _Object$getPrototypeOf(LayerWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return LayerWidget;
}(RefCounted);

export var LayerPanel = function (_RefCounted2) {
    _inherits(LayerPanel, _RefCounted2);

    function LayerPanel(display, manager, viewerNavigationState, selectedLayer, getLayoutSpecForDrag) {
        _classCallCheck(this, LayerPanel);

        var _this2 = _possibleConstructorReturn(this, (LayerPanel.__proto__ || _Object$getPrototypeOf(LayerPanel)).call(this));

        _this2.display = display;
        _this2.manager = manager;
        _this2.viewerNavigationState = viewerNavigationState;
        _this2.selectedLayer = selectedLayer;
        _this2.getLayoutSpecForDrag = getLayoutSpecForDrag;
        _this2.layerWidgets = new _Map();
        _this2.element = document.createElement('div');
        _this2.layerUpdateNeeded = true;
        _this2.valueUpdateNeeded = false;
        _this2.layerWidgetInsertionPoint = document.createElement('div');
        _this2.positionWidget = _this2.registerDisposer(new PositionWidget(_this2.viewerNavigationState.position.value));
        _this2.scheduleUpdate = _this2.registerCancellable(animationFrameDebounce(function () {
            return _this2.update();
        }));
        _this2.registerDisposer(selectedLayer);
        var element = _this2.element;

        element.className = 'neuroglancer-layer-panel';
        _this2.registerDisposer(manager.layerSelectedValues.changed.add(function () {
            _this2.handleLayerValuesChanged();
        }));
        _this2.registerDisposer(manager.layerManager.layersChanged.add(function () {
            _this2.handleLayersChanged();
        }));
        _this2.registerDisposer(selectedLayer.changed.add(function () {
            _this2.handleLayersChanged();
        }));
        _this2.layerWidgetInsertionPoint.style.display = 'none';
        _this2.element.appendChild(_this2.layerWidgetInsertionPoint);
        var addButton = document.createElement('div');
        addButton.className = 'neuroglancer-layer-add-button neuroglancer-button';
        addButton.title = 'Click to add layer, control+click/right click/⌘+click to add local annotation layer.';
        addButton.textContent = '+';
        var dropZone = _this2.dropZone = document.createElement('div');
        dropZone.className = 'neuroglancer-layer-panel-drop-zone';
        var addLayer = function addLayer(event) {
            if (event.ctrlKey || event.metaKey || event.type === 'contextmenu') {
                var layer = new ManagedUserLayerWithSpecification('annotation', {}, _this2.manager);
                _this2.manager.initializeLayerFromSpec(layer, { type: 'annotation' });
                _this2.manager.add(layer);
            } else {
                _this2.addLayerMenu();
            }
        };
        _this2.registerEventListener(addButton, 'click', addLayer);
        _this2.registerEventListener(addButton, 'contextmenu', addLayer);
        element.appendChild(addButton);
        element.appendChild(dropZone);
        _this2.registerDisposer(preventDrag(addButton));
        element.appendChild(_this2.positionWidget.element);
        var updatePositionWidgetVisibility = function updatePositionWidgetVisibility() {
            var linkValue = _this2.viewerNavigationState.position.link.value;
            _this2.positionWidget.element.style.display = linkValue === NavigationLinkType.LINKED ? 'none' : null;
        };
        _this2.registerDisposer(_this2.viewerNavigationState.position.link.changed.add(updatePositionWidgetVisibility));
        updatePositionWidgetVisibility();
        _this2.update();
        _this2.registerEventListener(element, 'dragleave', function (event) {
            if (event.relatedTarget && element.contains(event.relatedTarget)) {
                return;
            }
            var dropLayers = _this2.dropLayers;

            if (dropLayers !== undefined) {
                destroyDropLayers(dropLayers);
                _this2.dropLayers = undefined;
            }
        });
        _this2.registerDisposer(registerDropHandlers(_this2, addButton, undefined));
        _this2.registerDisposer(registerDropHandlers(_this2, dropZone, undefined));
        // Ensure layer widgets are updated before WebGL drawing starts; we don't want the layout to
        // change after WebGL drawing or we will get flicker.
        _this2.registerDisposer(display.updateStarted.add(function () {
            return _this2.updateLayers();
        }));
        return _this2;
    }

    _createClass(LayerPanel, [{
        key: 'disposed',
        value: function disposed() {
            this.layerWidgets.forEach(function (x) {
                return x.dispose();
            });
            this.layerWidgets = undefined;
            removeFromParent(this.element);
            _get(LayerPanel.prototype.__proto__ || _Object$getPrototypeOf(LayerPanel.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'handleLayersChanged',
        value: function handleLayersChanged() {
            this.layerUpdateNeeded = true;
            this.handleLayerValuesChanged();
        }
    }, {
        key: 'handleLayerValuesChanged',
        value: function handleLayerValuesChanged() {
            if (!this.valueUpdateNeeded) {
                this.valueUpdateNeeded = true;
                this.scheduleUpdate();
            }
        }
    }, {
        key: 'update',
        value: function update() {
            this.valueUpdateNeeded = false;
            this.updateLayers();
            var values = this.manager.layerSelectedValues;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(this.layerWidgets), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _ref = _step3.value;

                    var _ref2 = _slicedToArray(_ref, 2);

                    var layer = _ref2[0];
                    var widget = _ref2[1];

                    var userLayer = layer.layer;
                    var text = '';
                    if (userLayer !== null) {
                        var value = values.get(userLayer);
                        if (value !== undefined) {
                            value = Array().concat(value);
                            value = value.map(function (x) {
                                if (x === null) {
                                    return 'null';
                                } else if (_Math$fround(x) === x) {
                                    // FIXME: Verify actual layer data type
                                    return float32ToString(x);
                                } else {
                                    return x;
                                }
                            });
                            text += value.join(', ');
                        }
                    }
                    widget.valueElement.textContent = text;
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
    }, {
        key: 'updateLayers',
        value: function updateLayers() {
            var _this3 = this;

            if (!this.layerUpdateNeeded) {
                return;
            }
            this.layerUpdateNeeded = false;
            var container = this.element;
            var layers = new _Set();
            var nextChild = this.layerWidgetInsertionPoint.nextElementSibling;
            this.manager.layerManager.managedLayers.forEach(function (layer) {
                layers.add(layer);
                var widget = _this3.layerWidgets.get(layer);
                var layerIndex = _this3.manager.rootLayers.managedLayers.indexOf(layer);
                if (widget === undefined) {
                    widget = new LayerWidget(layer, _this3);
                    _this3.layerWidgets.set(layer, widget);
                }
                widget.layerNumberElement.textContent = '' + (1 + layerIndex);
                widget.update();
                var _widget = widget,
                    element = _widget.element;

                if (element !== nextChild) {
                    container.insertBefore(widget.element, nextChild);
                }
                nextChild = element.nextElementSibling;
            });
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(this.layerWidgets), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref3 = _step4.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var layer = _ref4[0];
                    var widget = _ref4[1];

                    if (!layers.has(layer)) {
                        this.layerWidgets.delete(layer);
                        widget.dispose();
                    }
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
    }, {
        key: 'addLayerMenu',
        value: function addLayerMenu() {
            // Automatically destroys itself when it exits.
            new LayerDialog(this.manager);
        }
    }, {
        key: 'layerManager',
        get: function get() {
            return this.manager.layerManager;
        }
    }]);

    return LayerPanel;
}(RefCounted);
//# sourceMappingURL=layer_panel.js.map