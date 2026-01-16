import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _getIterator from 'babel-runtime/core-js/get-iterator';
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
import { CapacitySpecification, ChunkManager, ChunkQueueManager } from './chunk_manager/frontend';
import { defaultCredentialsManager } from './credentials_provider/default_manager';
import { InputEventBindings as DataPanelInputEventBindings } from './data_panel_layout';
import { getDefaultDataSourceProvider } from './datasource/default_provider';
import { InputEventBindingHelpDialog } from './help/input_event_bindings';
import { allRenderLayerRoles, LayerManager, LayerSelectedValues, MouseSelectionState, RenderLayerRole, SelectedLayerState } from './layer';
import { LayerDialog } from './layer_dialog';
import { RootLayoutContainer } from './layer_groups_layout';
import { TopLevelLayerListSpecification } from './layer_specification';
import { NavigationState, Pose } from './navigation_state';
import { overlaysOpen } from './overlay';
import { StatusMessage } from './status';
import { ElementVisibilityFromTrackableBoolean, TrackableBoolean, TrackableBooleanCheckbox } from './trackable_boolean';
import { makeDerivedWatchableValue } from './trackable_value';
import { ContextMenu } from './ui/context_menu';
import { DragResizablePanel } from './ui/drag_resize';
import { LayerInfoPanelContainer } from './ui/layer_side_panel';
import { MouseSelectionStateTooltipManager } from './ui/mouse_selection_state_tooltip';
import { setupPositionDropHandlers } from './ui/position_drag_and_drop';
import { StateEditorDialog } from './ui/state_editor';
import { StatisticsDisplayState, StatisticsPanel } from './ui/statistics';
import { AutomaticallyFocusedElement } from './util/automatic_focus';
import { TrackableRGB } from './util/color';
import { RefCounted } from './util/disposable';
import { removeFromParent } from './util/dom';
import { registerActionListener } from './util/event_action_map';
import { vec3 } from './util/geom';
import { EventActionMap, KeyboardEventBinder } from './util/keyboard_bindings';
import { NullarySignal } from './util/signal';
import { CompoundTrackable } from './util/trackable';
import { WatchableVisibilityPriority } from './visibility_priority/frontend';
import { AnnotationToolStatusWidget } from './widget/annotation_tool_status';
import { NumberInputWidget } from './widget/number_input_widget';
import { MousePositionWidget, PositionWidget, VoxelSizeWidget } from './widget/position_widget';
import { TrackableScaleBarOptions } from './widget/scale_bar';
import { makeTextIconButton } from './widget/text_icon_button';
import { RPC } from './worker_rpc';

export var DataManagementContext = function (_RefCounted) {
    _inherits(DataManagementContext, _RefCounted);

    function DataManagementContext(gl, frameNumberCounter) {
        _classCallCheck(this, DataManagementContext);

        var _this = _possibleConstructorReturn(this, (DataManagementContext.__proto__ || _Object$getPrototypeOf(DataManagementContext)).call(this));

        _this.gl = gl;
        _this.frameNumberCounter = frameNumberCounter;
        _this.worker = new Worker('/chunk_worker.bundle.js');
        _this.chunkQueueManager = _this.registerDisposer(new ChunkQueueManager(new RPC(_this.worker), _this.gl, _this.frameNumberCounter, {
            gpuMemory: new CapacitySpecification({ defaultItemLimit: 1e6, defaultSizeLimit: 1e9 }),
            systemMemory: new CapacitySpecification({ defaultItemLimit: 1e7, defaultSizeLimit: 2e9 }),
            download: new CapacitySpecification({ defaultItemLimit: 32, defaultSizeLimit: Number.POSITIVE_INFINITY }),
            compute: new CapacitySpecification({ defaultItemLimit: 128, defaultSizeLimit: 5e8 })
        }));
        _this.chunkManager = _this.registerDisposer(new ChunkManager(_this.chunkQueueManager));
        _this.chunkQueueManager.registerDisposer(function () {
            return _this.worker.terminate();
        });
        return _this;
    }

    _createClass(DataManagementContext, [{
        key: 'rpc',
        get: function get() {
            return this.chunkQueueManager.rpc;
        }
    }]);

    return DataManagementContext;
}(RefCounted);
export var InputEventBindings = function (_DataPanelInputEventB) {
    _inherits(InputEventBindings, _DataPanelInputEventB);

    function InputEventBindings() {
        _classCallCheck(this, InputEventBindings);

        var _this2 = _possibleConstructorReturn(this, (InputEventBindings.__proto__ || _Object$getPrototypeOf(InputEventBindings)).apply(this, arguments));

        _this2.global = new EventActionMap();
        return _this2;
    }

    return InputEventBindings;
}(DataPanelInputEventBindings);
var viewerUiControlOptionKeys = ['showHelpButton', 'showEditStateButton', 'showLayerPanel', 'showLocation', 'showAnnotationToolStatus'];
var viewerOptionKeys = ['showUIControls', 'showPanelBorders'].concat(viewerUiControlOptionKeys);
export var ViewerUIControlConfiguration = function ViewerUIControlConfiguration() {
    _classCallCheck(this, ViewerUIControlConfiguration);

    this.showHelpButton = new TrackableBoolean(true);
    this.showEditStateButton = new TrackableBoolean(true);
    this.showLayerPanel = new TrackableBoolean(true);
    this.showLocation = new TrackableBoolean(true);
    this.showAnnotationToolStatus = new TrackableBoolean(true);
};
export var ViewerUIConfiguration = function (_ViewerUIControlConfi) {
    _inherits(ViewerUIConfiguration, _ViewerUIControlConfi);

    function ViewerUIConfiguration() {
        _classCallCheck(this, ViewerUIConfiguration);

        /**
         * If set to false, all UI controls (controlled individually by the options below) are disabled.
         */
        var _this3 = _possibleConstructorReturn(this, (ViewerUIConfiguration.__proto__ || _Object$getPrototypeOf(ViewerUIConfiguration)).apply(this, arguments));

        _this3.showUIControls = new TrackableBoolean(true);
        _this3.showPanelBorders = new TrackableBoolean(true);
        return _this3;
    }

    return ViewerUIConfiguration;
}(ViewerUIControlConfiguration);
function setViewerUiConfiguration(config, options) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(viewerOptionKeys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            var value = options[key];
            if (value !== undefined) {
                config[key].value = value;
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
}
var defaultViewerOptions = "undefined" !== typeof NEUROGLANCER_OVERRIDE_DEFAULT_VIEWER_OPTIONS ? NEUROGLANCER_OVERRIDE_DEFAULT_VIEWER_OPTIONS : {
    showLayerDialog: true,
    resetStateWhenEmpty: true
};
function makeViewerContextMenu(viewer) {
    var menu = new ContextMenu();
    var element = menu.element;

    element.classList.add('neuroglancer-viewer-context-menu');
    var addLimitWidget = function addLimitWidget(label, limit) {
        var widget = menu.registerDisposer(new NumberInputWidget(limit, { label: label }));
        widget.element.classList.add('neuroglancer-viewer-context-menu-limit-widget');
        element.appendChild(widget.element);
    };
    addLimitWidget('GPU memory limit', viewer.chunkQueueManager.capacities.gpuMemory.sizeLimit);
    addLimitWidget('System memory limit', viewer.chunkQueueManager.capacities.systemMemory.sizeLimit);
    addLimitWidget('Concurrent chunk requests', viewer.chunkQueueManager.capacities.download.itemLimit);
    var addCheckbox = function addCheckbox(label, value) {
        var labelElement = document.createElement('label');
        labelElement.textContent = label;
        var checkbox = menu.registerDisposer(new TrackableBooleanCheckbox(value));
        labelElement.appendChild(checkbox.element);
        element.appendChild(labelElement);
    };
    addCheckbox('Show axis lines', viewer.showAxisLines);
    addCheckbox('Show scale bar', viewer.showScaleBar);
    addCheckbox('Show cross sections in 3-d', viewer.showPerspectiveSliceViews);
    addCheckbox('Show default annotations', viewer.showDefaultAnnotations);
    addCheckbox('Show chunk statistics', viewer.statisticsDisplayState.visible);
    return menu;
}
export var Viewer = function (_RefCounted2) {
    _inherits(Viewer, _RefCounted2);

    function Viewer(display) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Viewer);

        var _this4 = _possibleConstructorReturn(this, (Viewer.__proto__ || _Object$getPrototypeOf(Viewer)).call(this));

        _this4.display = display;
        _this4.navigationState = _this4.registerDisposer(new NavigationState());
        _this4.perspectiveNavigationState = new NavigationState(new Pose(_this4.navigationState.position), 1);
        _this4.mouseState = new MouseSelectionState();
        _this4.layerManager = _this4.registerDisposer(new LayerManager());
        _this4.selectedLayer = _this4.registerDisposer(new SelectedLayerState(_this4.layerManager.addRef()));
        _this4.showAxisLines = new TrackableBoolean(true, true);
        _this4.showScaleBar = new TrackableBoolean(true, true);
        _this4.showPerspectiveSliceViews = new TrackableBoolean(true, true);
        _this4.visibleLayerRoles = allRenderLayerRoles();
        _this4.showDefaultAnnotations = new TrackableBoolean(true, true);
        _this4.crossSectionBackgroundColor = new TrackableRGB(vec3.fromValues(0.5, 0.5, 0.5));
        _this4.perspectiveViewBackgroundColor = new TrackableRGB(vec3.fromValues(0, 0, 0));
        _this4.scaleBarOptions = new TrackableScaleBarOptions();
        _this4.statisticsDisplayState = new StatisticsDisplayState();
        _this4.layerSelectedValues = _this4.registerDisposer(new LayerSelectedValues(_this4.layerManager, _this4.mouseState));
        _this4.resetInitiated = new NullarySignal();
        _this4.state = new CompoundTrackable();
        /**
         * Logical and of each of the above values with the value of showUIControls.
         */
        _this4.uiControlVisibility = {};
        _this4.visible = true;
        var _options$dataContext = options.dataContext,
            dataContext = _options$dataContext === undefined ? new DataManagementContext(display.gl, display) : _options$dataContext,
            _options$visibility = options.visibility,
            visibility = _options$visibility === undefined ? new WatchableVisibilityPriority(WatchableVisibilityPriority.VISIBLE) : _options$visibility,
            _options$inputEventBi = options.inputEventBindings,
            inputEventBindings = _options$inputEventBi === undefined ? {
            global: new EventActionMap(),
            sliceView: new EventActionMap(),
            perspectiveView: new EventActionMap()
        } : _options$inputEventBi,
            _options$element = options.element,
            element = _options$element === undefined ? display.makeCanvasOverlayElement() : _options$element,
            _options$dataSourcePr = options.dataSourceProvider,
            dataSourceProvider = _options$dataSourcePr === undefined ? getDefaultDataSourceProvider({ credentialsManager: defaultCredentialsManager }) : _options$dataSourcePr,
            _options$uiConfigurat = options.uiConfiguration,
            uiConfiguration = _options$uiConfigurat === undefined ? new ViewerUIConfiguration() : _options$uiConfigurat;

        _this4.visibility = visibility;
        _this4.inputEventBindings = inputEventBindings;
        _this4.element = element;
        _this4.dataSourceProvider = dataSourceProvider;
        _this4.uiConfiguration = uiConfiguration;
        _this4.registerDisposer(function () {
            return removeFromParent(_this4.element);
        });
        _this4.dataContext = _this4.registerDisposer(dataContext);
        setViewerUiConfiguration(uiConfiguration, options);
        var optionsWithDefaults = _Object$assign({}, defaultViewerOptions, options);
        var resetStateWhenEmpty = optionsWithDefaults.resetStateWhenEmpty,
            showLayerDialog = optionsWithDefaults.showLayerDialog;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _getIterator(viewerUiControlOptionKeys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var key = _step2.value;

                _this4.uiControlVisibility[key] = _this4.makeUiControlVisibilityState(key);
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

        _this4.registerDisposer(_this4.uiConfiguration.showPanelBorders.changed.add(function () {
            _this4.updateShowBorders();
        }));
        _this4.showLayerDialog = showLayerDialog;
        _this4.resetStateWhenEmpty = resetStateWhenEmpty;
        _this4.layerSpecification = new TopLevelLayerListSpecification(_this4.dataSourceProvider, _this4.layerManager, _this4.chunkManager, _this4.layerSelectedValues, _this4.navigationState.voxelSize);
        _this4.registerDisposer(display.updateStarted.add(function () {
            _this4.onUpdateDisplay();
        }));
        _this4.showDefaultAnnotations.changed.add(function () {
            if (_this4.showDefaultAnnotations.value) {
                _this4.visibleLayerRoles.add(RenderLayerRole.DEFAULT_ANNOTATION);
            } else {
                _this4.visibleLayerRoles.delete(RenderLayerRole.DEFAULT_ANNOTATION);
            }
        });
        var state = _this4.state;

        state.add('layers', _this4.layerSpecification);
        state.add('navigation', _this4.navigationState);
        state.add('showAxisLines', _this4.showAxisLines);
        state.add('showScaleBar', _this4.showScaleBar);
        state.add('showDefaultAnnotations', _this4.showDefaultAnnotations);
        state.add('perspectiveOrientation', _this4.perspectiveNavigationState.pose.orientation);
        state.add('perspectiveZoom', _this4.perspectiveNavigationState.zoomFactor);
        state.add('showSlices', _this4.showPerspectiveSliceViews);
        state.add('gpuMemoryLimit', _this4.dataContext.chunkQueueManager.capacities.gpuMemory.sizeLimit);
        state.add('systemMemoryLimit', _this4.dataContext.chunkQueueManager.capacities.systemMemory.sizeLimit);
        state.add('concurrentDownloads', _this4.dataContext.chunkQueueManager.capacities.download.itemLimit);
        state.add('selectedLayer', _this4.selectedLayer);
        state.add('crossSectionBackgroundColor', _this4.crossSectionBackgroundColor);
        state.add('perspectiveViewBackgroundColor', _this4.perspectiveViewBackgroundColor);
        _this4.registerDisposer(_this4.navigationState.changed.add(function () {
            _this4.handleNavigationStateChanged();
        }));
        _this4.layerManager.initializePosition(_this4.navigationState.position);
        _this4.registerDisposer(_this4.layerSpecification.voxelCoordinatesSet.add(function (voxelCoordinates) {
            _this4.navigationState.position.setVoxelCoordinates(voxelCoordinates);
        }));
        _this4.registerDisposer(_this4.layerSpecification.spatialCoordinatesSet.add(function (spatialCoordinates) {
            var position = _this4.navigationState.position;

            vec3.copy(position.spatialCoordinates, spatialCoordinates);
            position.markSpatialCoordinatesChanged();
        }));
        // Debounce this call to ensure that a transient state does not result in the layer dialog being
        // shown.
        var maybeResetState = _this4.registerCancellable(debounce(function () {
            if (!_this4.wasDisposed && _this4.layerManager.managedLayers.length === 0 && _this4.resetStateWhenEmpty) {
                // No layers, reset state.
                _this4.navigationState.reset();
                _this4.perspectiveNavigationState.pose.orientation.reset();
                _this4.perspectiveNavigationState.zoomFactor.reset();
                _this4.resetInitiated.dispatch();
                if (!overlaysOpen && _this4.showLayerDialog && _this4.visibility.visible) {
                    new LayerDialog(_this4.layerSpecification);
                }
            }
        }));
        _this4.layerManager.layersChanged.add(maybeResetState);
        maybeResetState();
        _this4.registerDisposer(_this4.dataContext.chunkQueueManager.visibleChunksChanged.add(function () {
            _this4.layerSelectedValues.handleLayerChange();
        }));
        _this4.registerDisposer(_this4.dataContext.chunkQueueManager.visibleChunksChanged.add(function () {
            if (_this4.visible) {
                display.scheduleRedraw();
            }
        }));
        _this4.makeUI();
        _this4.updateShowBorders();
        state.add('layout', _this4.layout);
        state.add('statistics', _this4.statisticsDisplayState);
        _this4.registerActionListeners();
        _this4.registerEventActionBindings();
        _this4.registerDisposer(setupPositionDropHandlers(element, _this4.navigationState.position));
        _this4.registerDisposer(new MouseSelectionStateTooltipManager(_this4.mouseState, _this4.layerManager, _this4.navigationState.voxelSize));
        return _this4;
    }

    _createClass(Viewer, [{
        key: 'makeUiControlVisibilityState',
        value: function makeUiControlVisibilityState(key) {
            var showUIControls = this.uiConfiguration.showUIControls;
            var option = this.uiConfiguration[key];
            return this.registerDisposer(makeDerivedWatchableValue(function (a, b) {
                return a && b;
            }, showUIControls, option));
        }
    }, {
        key: 'updateShowBorders',
        value: function updateShowBorders() {
            var element = this.element;

            var className = 'neuroglancer-show-panel-borders';
            if (this.uiConfiguration.showPanelBorders.value) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    }, {
        key: 'makeUI',
        value: function makeUI() {
            var _this5 = this;

            var gridContainer = this.element;
            gridContainer.classList.add('neuroglancer-viewer');
            gridContainer.classList.add('neuroglancer-noselect');
            gridContainer.style.display = 'flex';
            gridContainer.style.flexDirection = 'column';
            var topRow = document.createElement('div');
            topRow.title = 'Right click for settings';
            topRow.classList.add('neuroglancer-viewer-top-row');
            var contextMenu = this.contextMenu = this.registerDisposer(makeViewerContextMenu(this));
            contextMenu.registerParent(topRow);
            topRow.style.display = 'flex';
            topRow.style.flexDirection = 'row';
            topRow.style.alignItems = 'stretch';
            var voxelSizeWidget = this.registerDisposer(new VoxelSizeWidget(document.createElement('div'), this.navigationState.voxelSize));
            this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showLocation, voxelSizeWidget.element));
            topRow.appendChild(voxelSizeWidget.element);
            var positionWidget = this.registerDisposer(new PositionWidget(this.navigationState.position));
            this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showLocation, positionWidget.element));
            topRow.appendChild(positionWidget.element);
            var mousePositionWidget = this.registerDisposer(new MousePositionWidget(document.createElement('div'), this.mouseState, this.navigationState.voxelSize));
            mousePositionWidget.element.style.flex = '1';
            mousePositionWidget.element.style.alignSelf = 'center';
            this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showLocation, mousePositionWidget.element));
            topRow.appendChild(mousePositionWidget.element);
            var annotationToolStatus = this.registerDisposer(new AnnotationToolStatusWidget(this.selectedLayer));
            topRow.appendChild(annotationToolStatus.element);
            this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showAnnotationToolStatus, annotationToolStatus.element));
            {
                var button = makeTextIconButton('{}', 'Edit JSON state');
                this.registerEventListener(button, 'click', function () {
                    _this5.editJsonState();
                });
                this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showEditStateButton, button));
                topRow.appendChild(button);
            }
            {
                var _button = makeTextIconButton('?', 'Help');
                this.registerEventListener(_button, 'click', function () {
                    _this5.showHelpDialog();
                });
                this.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.uiControlVisibility.showHelpButton, _button));
                topRow.appendChild(_button);
            }
            this.registerDisposer(new ElementVisibilityFromTrackableBoolean(makeDerivedWatchableValue(function () {
                for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
                    values[_key] = arguments[_key];
                }

                return values.reduce(function (a, b) {
                    return a || b;
                }, false);
            }, this.uiControlVisibility.showHelpButton, this.uiControlVisibility.showEditStateButton, this.uiControlVisibility.showLocation, this.uiControlVisibility.showAnnotationToolStatus), topRow));
            gridContainer.appendChild(topRow);
            var layoutAndSidePanel = document.createElement('div');
            layoutAndSidePanel.style.display = 'flex';
            layoutAndSidePanel.style.flex = '1';
            layoutAndSidePanel.style.flexDirection = 'row';
            this.layout = this.registerDisposer(new RootLayoutContainer(this, '4panel'));
            layoutAndSidePanel.appendChild(this.layout.element);
            var layerInfoPanel = this.registerDisposer(new LayerInfoPanelContainer(this.selectedLayer.addRef()));
            layoutAndSidePanel.appendChild(layerInfoPanel.element);
            var self = this;
            layerInfoPanel.registerDisposer(new DragResizablePanel(layerInfoPanel.element, {
                changed: self.selectedLayer.changed,
                get value() {
                    return self.selectedLayer.visible;
                },
                set value(visible) {
                    self.selectedLayer.visible = visible;
                }
            }, this.selectedLayer.size, 'horizontal', 290));
            gridContainer.appendChild(layoutAndSidePanel);
            var statisticsPanel = this.registerDisposer(new StatisticsPanel(this.chunkQueueManager, this.statisticsDisplayState));
            gridContainer.appendChild(statisticsPanel.element);
            statisticsPanel.registerDisposer(new DragResizablePanel(statisticsPanel.element, this.statisticsDisplayState.visible, this.statisticsDisplayState.size, 'vertical'));
            var updateVisibility = function updateVisibility() {
                var shouldBeVisible = _this5.visibility.visible;
                if (shouldBeVisible !== _this5.visible) {
                    gridContainer.style.visibility = shouldBeVisible ? 'inherit' : 'hidden';
                    _this5.visible = shouldBeVisible;
                }
            };
            updateVisibility();
            this.registerDisposer(this.visibility.changed.add(updateVisibility));
        }
        /**
         * Called once by the constructor to set up event handlers.
         */

    }, {
        key: 'registerEventActionBindings',
        value: function registerEventActionBindings() {
            var element = this.element;

            this.registerDisposer(new KeyboardEventBinder(element, this.inputEventMap));
            this.registerDisposer(new AutomaticallyFocusedElement(element));
        }
    }, {
        key: 'bindAction',
        value: function bindAction(action, handler) {
            this.registerDisposer(registerActionListener(this.element, action, handler));
        }
        /**
         * Called once by the constructor to register the action listeners.
         */

    }, {
        key: 'registerActionListeners',
        value: function registerActionListeners() {
            var _this6 = this;

            var _loop = function _loop(action) {
                _this6.bindAction(action, function () {
                    _this6.layerManager.invokeAction(action);
                });
            };

            var _arr = ['recolor', 'clear-segments'];

            for (var _i = 0; _i < _arr.length; _i++) {
                var action = _arr[_i];
                _loop(action);
            }

            var _loop2 = function _loop2(action) {
                _this6.bindAction(action, function () {
                    _this6.mouseState.updateUnconditionally();
                    _this6.layerManager.invokeAction(action);
                });
            };

            var _arr2 = ['select'];
            for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
                var action = _arr2[_i2];
                _loop2(action);
            }
            this.bindAction('help', function () {
                return _this6.showHelpDialog();
            });

            var _loop3 = function _loop3(i) {
                _this6.bindAction('toggle-layer-' + i, function () {
                    var layerIndex = i - 1;
                    var layers = _this6.layerManager.managedLayers;
                    if (layerIndex < layers.length) {
                        var layer = layers[layerIndex];
                        layer.setVisible(!layer.visible);
                    }
                });
                _this6.bindAction('select-layer-' + i, function () {
                    var layerIndex = i - 1;
                    var layers = _this6.layerManager.managedLayers;
                    if (layerIndex < layers.length) {
                        var layer = layers[layerIndex];
                        _this6.selectedLayer.layer = layer;
                        _this6.selectedLayer.visible = true;
                    }
                });
            };

            for (var i = 1; i <= 9; ++i) {
                _loop3(i);
            }
            this.bindAction('annotate', function () {
                var selectedLayer = _this6.selectedLayer.layer;
                if (selectedLayer === undefined) {
                    StatusMessage.showTemporaryMessage('The annotate command requires a layer to be selected.');
                    return;
                }
                var userLayer = selectedLayer.layer;
                if (userLayer === null || userLayer.tool.value === undefined) {
                    StatusMessage.showTemporaryMessage('The selected layer (' + _JSON$stringify(selectedLayer.name) + ') does not have an active annotation tool.');
                    return;
                }
                userLayer.tool.value.trigger(_this6.mouseState);
            });
            this.bindAction('toggle-axis-lines', function () {
                return _this6.showAxisLines.toggle();
            });
            this.bindAction('toggle-scale-bar', function () {
                return _this6.showScaleBar.toggle();
            });
            this.bindAction('toggle-default-annotations', function () {
                return _this6.showDefaultAnnotations.toggle();
            });
            this.bindAction('toggle-show-slices', function () {
                return _this6.showPerspectiveSliceViews.toggle();
            });
            this.bindAction('toggle-show-statistics', function () {
                return _this6.showStatistics();
            });
        }
    }, {
        key: 'showHelpDialog',
        value: function showHelpDialog() {
            var inputEventBindings = this.inputEventBindings;

            new InputEventBindingHelpDialog([['Global', inputEventBindings.global], ['Slice View', inputEventBindings.sliceView], ['Perspective View', inputEventBindings.perspectiveView]]);
        }
    }, {
        key: 'editJsonState',
        value: function editJsonState() {
            new StateEditorDialog(this);
        }
    }, {
        key: 'showStatistics',
        value: function showStatistics() {
            var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

            if (value === undefined) {
                value = !this.statisticsDisplayState.visible.value;
            }
            this.statisticsDisplayState.visible.value = value;
        }
    }, {
        key: 'onUpdateDisplay',
        value: function onUpdateDisplay() {
            if (this.visible) {
                this.dataContext.chunkQueueManager.chunkUpdateDeadline = null;
            }
        }
    }, {
        key: 'handleNavigationStateChanged',
        value: function handleNavigationStateChanged() {
            if (this.visible) {
                var chunkQueueManager = this.dataContext.chunkQueueManager;

                if (chunkQueueManager.chunkUpdateDeadline === null) {
                    chunkQueueManager.chunkUpdateDeadline = Date.now() + 10;
                }
            }
        }
    }, {
        key: 'chunkManager',
        get: function get() {
            return this.dataContext.chunkManager;
        }
    }, {
        key: 'chunkQueueManager',
        get: function get() {
            return this.dataContext.chunkQueueManager;
        }
    }, {
        key: 'inputEventMap',
        get: function get() {
            return this.inputEventBindings.global;
        }
    }, {
        key: 'gl',
        get: function get() {
            return this.display.gl;
        }
    }]);

    return Viewer;
}(RefCounted);
//# sourceMappingURL=viewer.js.map