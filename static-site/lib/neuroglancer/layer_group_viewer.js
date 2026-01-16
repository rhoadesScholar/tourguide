import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _get from 'babel-runtime/helpers/get';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
/**
 * @file Viewer for a group of layers.
 */
import debounce from 'lodash/debounce';
import { DataPanelLayoutContainer } from './data_panel_layout';
import { LayerPanel } from './layer_panel';
import { LayerSubsetSpecification } from './layer_specification';
import { LinkedOrientationState, LinkedSpatialPosition, LinkedZoomState, NavigationState, Pose } from './navigation_state';
import { TrackableBoolean } from './trackable_boolean';
import { ContextMenu } from './ui/context_menu';
import { endLayerDrag, startLayerDrag } from './ui/layer_drag_and_drop';
import { setupPositionDropHandlers } from './ui/position_drag_and_drop';
import { AutomaticallyFocusedElement } from './util/automatic_focus';
import { RefCounted } from './util/disposable';
import { removeChildren } from './util/dom';
import { registerActionListener } from './util/event_action_map';
import { CompoundTrackable } from './util/trackable';
import { EnumSelectWidget } from './widget/enum_widget';

export var viewerDragType = 'neuroglancer-layer-group-viewer';
export function hasViewerDrag(event) {
    return event.dataTransfer.types.indexOf(viewerDragType) !== -1;
}
var dragSource = void 0;
export function getCompatibleViewerDragSource(manager) {
    if (dragSource && dragSource.viewer.layerSpecification.rootLayers === manager.rootLayers) {
        return dragSource.viewer;
    } else {
        return undefined;
    }
}
function getDefaultViewerDropEffect(manager) {
    if (getCompatibleViewerDragSource(manager) !== undefined) {
        return 'move';
    } else {
        return 'copy';
    }
}
export function getViewerDropEffect(event, manager) {
    if (event.shiftKey) {
        return 'copy';
    } else if (event.ctrlKey) {
        return 'move';
    } else {
        return getDefaultViewerDropEffect(manager);
    }
}
export var LinkedViewerNavigationState = function (_RefCounted) {
    _inherits(LinkedViewerNavigationState, _RefCounted);

    function LinkedViewerNavigationState(parent) {
        _classCallCheck(this, LinkedViewerNavigationState);

        var _this = _possibleConstructorReturn(this, (LinkedViewerNavigationState.__proto__ || _Object$getPrototypeOf(LinkedViewerNavigationState)).call(this));

        _this.position = new LinkedSpatialPosition(parent.navigationState.position.addRef());
        _this.crossSectionOrientation = new LinkedOrientationState(parent.navigationState.pose.orientation.addRef());
        _this.crossSectionZoom = new LinkedZoomState(parent.navigationState.zoomFactor.addRef());
        _this.navigationState = _this.registerDisposer(new NavigationState(new Pose(_this.position.value, _this.crossSectionOrientation.value), _this.crossSectionZoom.value));
        _this.perspectiveOrientation = new LinkedOrientationState(parent.perspectiveNavigationState.pose.orientation.addRef());
        _this.perspectiveZoom = new LinkedZoomState(parent.perspectiveNavigationState.zoomFactor.addRef());
        _this.perspectiveNavigationState = _this.registerDisposer(new NavigationState(new Pose(_this.position.value.addRef(), _this.perspectiveOrientation.value), _this.perspectiveZoom.value));
        return _this;
    }

    _createClass(LinkedViewerNavigationState, [{
        key: 'copyToParent',
        value: function copyToParent() {
            var _arr = [this.position, this.crossSectionOrientation, this.crossSectionZoom, this.perspectiveOrientation, this.perspectiveZoom];

            for (var _i = 0; _i < _arr.length; _i++) {
                var x = _arr[_i];
                x.copyToPeer();
            }
        }
    }, {
        key: 'register',
        value: function register(state) {
            state.add('position', this.position);
            state.add('crossSectionOrientation', this.crossSectionOrientation);
            state.add('crossSectionZoom', this.crossSectionZoom);
            state.add('perspectiveOrientation', this.perspectiveOrientation);
            state.add('perspectiveZoom', this.perspectiveZoom);
        }
    }]);

    return LinkedViewerNavigationState;
}(RefCounted);
function makeViewerMenu(parent, viewer) {
    var contextMenu = new ContextMenu(parent);
    var menu = contextMenu.element;
    menu.classList.add('neuroglancer-layer-group-viewer-context-menu');
    var closeButton = document.createElement('button');
    closeButton.textContent = 'Remove layer group';
    menu.appendChild(closeButton);
    contextMenu.registerEventListener(closeButton, 'click', function () {
        viewer.layerSpecification.layerManager.clear();
    });
    var viewerNavigationState = viewer.viewerNavigationState;
    var _arr2 = [['Position', viewerNavigationState.position.link], ['Cross-section orientation', viewerNavigationState.crossSectionOrientation.link], ['Cross-section zoom', viewerNavigationState.crossSectionZoom.link], ['Perspective orientation', viewerNavigationState.perspectiveOrientation.link], ['Perspective zoom', viewerNavigationState.perspectiveZoom.link]];

    for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var _ref = _arr2[_i2];

        var _ref2 = _slicedToArray(_ref, 2);

        var name = _ref2[0];
        var model = _ref2[1];

        var widget = contextMenu.registerDisposer(new EnumSelectWidget(model));
        var label = document.createElement('label');
        label.style.display = 'flex';
        label.style.flexDirection = 'row';
        label.style.whiteSpace = 'nowrap';
        label.textContent = name;
        label.appendChild(widget.element);
        menu.appendChild(label);
    }
    return contextMenu;
}
export var LayerGroupViewer = function (_RefCounted2) {
    _inherits(LayerGroupViewer, _RefCounted2);

    function LayerGroupViewer(element, viewerState) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        _classCallCheck(this, LayerGroupViewer);

        var _this2 = _possibleConstructorReturn(this, (LayerGroupViewer.__proto__ || _Object$getPrototypeOf(LayerGroupViewer)).call(this));

        _this2.element = element;
        _this2.viewerState = viewerState;
        _this2.state = new CompoundTrackable();
        _this2.options = _Object$assign({ showLayerPanel: new TrackableBoolean(true), showViewerMenu: false }, options);
        _this2.layerSpecification = _this2.registerDisposer(viewerState.layerSpecification);
        _this2.viewerNavigationState = _this2.registerDisposer(new LinkedViewerNavigationState(viewerState));
        _this2.viewerNavigationState.register(_this2.state);
        if (!(_this2.layerSpecification instanceof LayerSubsetSpecification)) {
            _this2.state.add('layers', {
                changed: _this2.layerSpecification.changed,
                toJSON: function toJSON() {
                    return _this2.layerSpecification.layerManager.managedLayers.map(function (x) {
                        return x.name;
                    });
                },
                reset: function reset() {
                    throw new Error('not implemented');
                },
                restoreState: function restoreState() {
                    throw new Error('not implemented');
                }
            });
        } else {
            _this2.state.add('layers', _this2.layerSpecification);
        }
        element.classList.add('neuroglancer-layer-group-viewer');
        _this2.registerDisposer(new AutomaticallyFocusedElement(element));
        _this2.layout = _this2.registerDisposer(new DataPanelLayoutContainer(_this2, 'xy'));
        _this2.state.add('layout', _this2.layout);
        _this2.registerActionBindings();
        _this2.registerDisposer(_this2.layerManager.useDirectly());
        _this2.registerDisposer(setupPositionDropHandlers(element, _this2.navigationState.position));
        _this2.registerDisposer(_this2.options.showLayerPanel.changed.add(_this2.registerCancellable(debounce(function () {
            return _this2.updateUI();
        }, 0))));
        _this2.makeUI();
        return _this2;
    }

    _createClass(LayerGroupViewer, [{
        key: 'bindAction',
        value: function bindAction(action, handler) {
            this.registerDisposer(registerActionListener(this.element, action, handler));
        }
    }, {
        key: 'registerActionBindings',
        value: function registerActionBindings() {
            var _this3 = this;

            this.bindAction('add-layer', function () {
                if (_this3.layerPanel) {
                    _this3.layerPanel.addLayerMenu();
                }
            });
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return _Object$assign({ 'type': 'viewer' }, this.state.toJSON());
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.state.reset();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            this.state.restoreState(obj);
        }
    }, {
        key: 'makeUI',
        value: function makeUI() {
            this.element.style.flex = '1';
            this.element.style.display = 'flex';
            this.element.style.flexDirection = 'column';
            this.element.appendChild(this.layout.element);
            this.updateUI();
        }
    }, {
        key: 'updateUI',
        value: function updateUI() {
            var _this4 = this;

            var options = this.options;

            var showLayerPanel = options.showLayerPanel.value;
            if (this.layerPanel !== undefined && !showLayerPanel) {
                this.layerPanel.dispose();
                this.layerPanel = undefined;
                return;
            }
            if (showLayerPanel && this.layerPanel === undefined) {
                var layerPanel = this.layerPanel = new LayerPanel(this.display, this.layerSpecification, this.viewerNavigationState, this.viewerState.selectedLayer, function () {
                    return _this4.layout.toJSON();
                });
                if (options.showViewerMenu) {
                    layerPanel.registerDisposer(makeViewerMenu(layerPanel.element, this));
                    layerPanel.element.title = 'Right click for options, drag to move/copy layer group.';
                } else {
                    layerPanel.element.title = 'Drag to move/copy layer group.';
                }
                layerPanel.element.draggable = true;
                this.registerEventListener(layerPanel.element, 'dragstart', function (event) {
                    startLayerDrag(event, {
                        manager: _this4.layerSpecification,
                        layers: _this4.layerManager.managedLayers,
                        layoutSpec: _this4.layout.toJSON()
                    });
                    var disposer = function disposer() {
                        if (dragSource && dragSource.viewer === _this4) {
                            dragSource = undefined;
                        }
                        _this4.unregisterDisposer(disposer);
                    };
                    dragSource = { viewer: _this4, disposer: disposer };
                    _this4.registerDisposer(disposer);
                    var dragData = _this4.toJSON();
                    delete dragData['layers'];
                    event.dataTransfer.setData(viewerDragType, _JSON$stringify(dragData));
                });
                this.registerEventListener(layerPanel.element, 'dragend', function (event) {
                    endLayerDrag(event);
                    if (dragSource !== undefined && dragSource.viewer === _this4) {
                        dragSource.disposer();
                    }
                });
                this.element.insertBefore(layerPanel.element, this.element.firstChild);
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.element);
            var layerPanel = this.layerPanel;

            if (layerPanel !== undefined) {
                layerPanel.dispose();
                this.layerPanel = undefined;
            }
            _get(LayerGroupViewer.prototype.__proto__ || _Object$getPrototypeOf(LayerGroupViewer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'perspectiveNavigationState',
        get: function get() {
            return this.viewerNavigationState.perspectiveNavigationState;
        }
    }, {
        key: 'navigationState',
        get: function get() {
            return this.viewerNavigationState.navigationState;
        }
        // FIXME: don't make viewerState a property, just make these things properties directly

    }, {
        key: 'display',
        get: function get() {
            return this.viewerState.display;
        }
    }, {
        key: 'selectedLayer',
        get: function get() {
            return this.viewerState.selectedLayer;
        }
    }, {
        key: 'layerManager',
        get: function get() {
            return this.layerSpecification.layerManager;
        }
    }, {
        key: 'chunkManager',
        get: function get() {
            return this.layerSpecification.chunkManager;
        }
    }, {
        key: 'mouseState',
        get: function get() {
            return this.viewerState.mouseState;
        }
    }, {
        key: 'showAxisLines',
        get: function get() {
            return this.viewerState.showAxisLines;
        }
    }, {
        key: 'showScaleBar',
        get: function get() {
            return this.viewerState.showScaleBar;
        }
    }, {
        key: 'showPerspectiveSliceViews',
        get: function get() {
            return this.viewerState.showPerspectiveSliceViews;
        }
    }, {
        key: 'inputEventBindings',
        get: function get() {
            return this.viewerState.inputEventBindings;
        }
    }, {
        key: 'visibility',
        get: function get() {
            return this.viewerState.visibility;
        }
    }, {
        key: 'visibleLayerRoles',
        get: function get() {
            return this.viewerState.visibleLayerRoles;
        }
    }, {
        key: 'crossSectionBackgroundColor',
        get: function get() {
            return this.viewerState.crossSectionBackgroundColor;
        }
    }, {
        key: 'perspectiveViewBackgroundColor',
        get: function get() {
            return this.viewerState.perspectiveViewBackgroundColor;
        }
    }, {
        key: 'scaleBarOptions',
        get: function get() {
            return this.viewerState.scaleBarOptions;
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.state.changed;
        }
    }]);

    return LayerGroupViewer;
}(RefCounted);
//# sourceMappingURL=layer_group_viewer.js.map