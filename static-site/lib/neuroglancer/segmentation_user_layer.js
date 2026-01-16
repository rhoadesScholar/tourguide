import _Object$keys from 'babel-runtime/core-js/object/keys';
import _Promise from 'babel-runtime/core-js/promise';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
import { UserLayer } from './layer';
import { registerLayerType, registerVolumeLayerType } from './layer_specification';
import { MeshSource, MultiscaleMeshSource } from './mesh/frontend';
import { MeshLayer, MultiscaleMeshLayer } from './mesh/frontend';
import { Overlay } from './overlay';
import { RenderScaleHistogram, trackableRenderScaleTarget } from './render_scale_statistics';
import { SegmentColorHash } from './segment_color';
import { SegmentSelectionState, Uint64MapEntry } from './segmentation_display_state/frontend';
import { SharedDisjointUint64Sets } from './shared_disjoint_sets';
import { FRAGMENT_MAIN_START as SKELETON_FRAGMENT_MAIN_START, PerspectiveViewSkeletonLayer, SkeletonLayer, SkeletonRenderingOptions, SkeletonSource, SliceViewPanelSkeletonLayer } from './skeleton/frontend';
import { VolumeType } from './sliceview/volume/base';
import { SegmentationRenderLayer } from './sliceview/volume/segmentation_renderlayer';
import { trackableAlphaValue } from './trackable_alpha';
import { ElementVisibilityFromTrackableBoolean, TrackableBoolean, TrackableBooleanCheckbox } from './trackable_boolean';
import { ComputedWatchableValue } from './trackable_value';
import { Uint64Set } from './uint64_set';
import { Uint64Map } from './uint64_map';
import { UserLayerWithVolumeSourceMixin } from './user_layer_with_volume_source';
import { parseRGBColorSpecification, packColor } from './util/color';
import { parseArray, verifyObjectProperty, verifyOptionalString, verifyObjectAsMap } from './util/json';
import { NullarySignal } from './util/signal';
import { Uint64 } from './util/uint64';
import { makeWatchableShaderError } from './webgl/dynamic_shader';
import { EnumSelectWidget } from './widget/enum_widget';
import { RangeWidget } from './widget/range';
import { RenderScaleWidget } from './widget/render_scale_widget';
import { SegmentSetWidget } from './widget/segment_set_widget';
import { ShaderCodeWidget } from './widget/shader_code_widget';
import { Tab } from './widget/tab_view';
import { Uint64EntryWidget } from './widget/uint64_entry_widget';

var SELECTED_ALPHA_JSON_KEY = 'selectedAlpha';
var NOT_SELECTED_ALPHA_JSON_KEY = 'notSelectedAlpha';
var OBJECT_ALPHA_JSON_KEY = 'objectAlpha';
var SATURATION_JSON_KEY = 'saturation';
var HIDE_SEGMENT_ZERO_JSON_KEY = 'hideSegmentZero';
var MESH_JSON_KEY = 'mesh';
var SKELETONS_JSON_KEY = 'skeletons';
var SEGMENTS_JSON_KEY = 'segments';
var HIGHLIGHTS_JSON_KEY = 'highlights';
var EQUIVALENCES_JSON_KEY = 'equivalences';
var COLOR_SEED_JSON_KEY = 'colorSeed';
var SEGMENT_STATED_COLORS_JSON_KEY = 'segmentColors';
var MESH_RENDER_SCALE_JSON_KEY = 'meshRenderScale';
var SKELETON_RENDERING_JSON_KEY = 'skeletonRendering';
var SKELETON_SHADER_JSON_KEY = 'skeletonShader';
var Base = UserLayerWithVolumeSourceMixin(UserLayer);
export var SegmentationUserLayer = function (_Base) {
    _inherits(SegmentationUserLayer, _Base);

    function SegmentationUserLayer(manager, x) {
        _classCallCheck(this, SegmentationUserLayer);

        var _this = _possibleConstructorReturn(this, (SegmentationUserLayer.__proto__ || _Object$getPrototypeOf(SegmentationUserLayer)).call(this, manager, x));

        _this.manager = manager;
        _this.displayState = {
            segmentColorHash: SegmentColorHash.getDefault(),
            segmentStatedColors: Uint64Map.makeWithCounterpart(_this.manager.worker),
            segmentSelectionState: new SegmentSelectionState(),
            selectedAlpha: trackableAlphaValue(0.5),
            saturation: trackableAlphaValue(1.0),
            notSelectedAlpha: trackableAlphaValue(0),
            objectAlpha: trackableAlphaValue(1.0),
            hideSegmentZero: new TrackableBoolean(true, true),
            visibleSegments: Uint64Set.makeWithCounterpart(_this.manager.worker),
            highlightedSegments: Uint64Set.makeWithCounterpart(_this.manager.worker),
            segmentEquivalences: SharedDisjointUint64Sets.makeWithCounterpart(_this.manager.worker),
            objectToDataTransform: _this.transform,
            skeletonRenderingOptions: new SkeletonRenderingOptions(),
            shaderError: makeWatchableShaderError(),
            renderScaleHistogram: new RenderScaleHistogram(),
            renderScaleTarget: trackableRenderScaleTarget(1)
        };
        // Dispatched when either meshLayer or skeletonLayer changes.
        _this.objectLayerStateChanged = new NullarySignal();
        _this.displayState.visibleSegments.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.segmentEquivalences.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.segmentSelectionState.bindTo(manager.layerSelectedValues, _this);
        _this.displayState.selectedAlpha.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.saturation.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.notSelectedAlpha.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.objectAlpha.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.hideSegmentZero.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.skeletonRenderingOptions.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.segmentColorHash.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.segmentStatedColors.changed.add(_this.specificationChanged.dispatch);
        _this.displayState.renderScaleTarget.changed.add(_this.specificationChanged.dispatch);
        _this.tabs.add('rendering', { label: 'Rendering', order: -100, getter: function getter() {
                return new DisplayOptionsTab(_this);
            } });
        _this.tabs.default = 'rendering';
        return _this;
    }

    _createClass(SegmentationUserLayer, [{
        key: 'restoreState',
        value: function restoreState(specification) {
            var _this2 = this;

            console.log('segmentation layer restore state');
            _get(SegmentationUserLayer.prototype.__proto__ || _Object$getPrototypeOf(SegmentationUserLayer.prototype), 'restoreState', this).call(this, specification);
            this.displayState.selectedAlpha.restoreState(specification[SELECTED_ALPHA_JSON_KEY]);
            this.displayState.saturation.restoreState(specification[SATURATION_JSON_KEY]);
            this.displayState.notSelectedAlpha.restoreState(specification[NOT_SELECTED_ALPHA_JSON_KEY]);
            this.displayState.objectAlpha.restoreState(specification[OBJECT_ALPHA_JSON_KEY]);
            this.displayState.hideSegmentZero.restoreState(specification[HIDE_SEGMENT_ZERO_JSON_KEY]);
            var skeletonRenderingOptions = this.displayState.skeletonRenderingOptions;

            skeletonRenderingOptions.restoreState(specification[SKELETON_RENDERING_JSON_KEY]);
            var skeletonShader = specification[SKELETON_SHADER_JSON_KEY];
            if (skeletonShader !== undefined) {
                skeletonRenderingOptions.shader.restoreState(skeletonShader);
            }
            this.displayState.segmentColorHash.restoreState(specification[COLOR_SEED_JSON_KEY]);
            this.displayState.renderScaleTarget.restoreState(specification[MESH_RENDER_SCALE_JSON_KEY]);
            verifyObjectProperty(specification, EQUIVALENCES_JSON_KEY, function (y) {
                _this2.displayState.segmentEquivalences.restoreState(y);
            });
            var restoreSegmentsList = function restoreSegmentsList(key, segments) {
                verifyObjectProperty(specification, key, function (y) {
                    if (y !== undefined) {
                        var segmentEquivalences = _this2.displayState.segmentEquivalences;

                        parseArray(y, function (value) {
                            var id = Uint64.parseString(String(value), 10);
                            segments.add(segmentEquivalences.get(id));
                        });
                    }
                });
            };
            restoreSegmentsList(SEGMENTS_JSON_KEY, this.displayState.visibleSegments);
            restoreSegmentsList(HIGHLIGHTS_JSON_KEY, this.displayState.highlightedSegments);
            this.displayState.highlightedSegments.changed.add(function () {
                _this2.specificationChanged.dispatch();
            });
            verifyObjectProperty(specification, SEGMENT_STATED_COLORS_JSON_KEY, function (y) {
                if (y !== undefined) {
                    var segmentEquivalences = _this2.displayState.segmentEquivalences;

                    var result = verifyObjectAsMap(y, function (x) {
                        return parseRGBColorSpecification(String(x));
                    });
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = _getIterator(result), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var _ref = _step.value;

                            var _ref2 = _slicedToArray(_ref, 2);

                            var idStr = _ref2[0];
                            var colorVec = _ref2[1];

                            var id = Uint64.parseString(String(idStr));
                            var color = new Uint64(packColor(colorVec));
                            _this2.displayState.segmentStatedColors.set(segmentEquivalences.get(id), color);
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
            });
            var multiscaleSource = this.multiscaleSource;

            var meshPath = this.meshPath = specification[MESH_JSON_KEY] === null ? null : verifyOptionalString(specification[MESH_JSON_KEY]);
            var skeletonsPath = this.skeletonsPath = verifyObjectProperty(specification, SKELETONS_JSON_KEY, verifyOptionalString);
            var remaining = 0;
            if (meshPath != null) {
                ++remaining;
                this.manager.dataSourceProvider.getMeshSource(this.manager.chunkManager, meshPath).then(function (meshSource) {
                    if (!_this2.wasDisposed) {
                        _this2.addMesh(meshSource);
                        if (--remaining === 0) {
                            _this2.isReady = true;
                        }
                    }
                });
            }
            if (skeletonsPath !== undefined) {
                ++remaining;
                this.manager.dataSourceProvider.getSkeletonSource(this.manager.chunkManager, skeletonsPath).then(function (skeletonSource) {
                    if (!_this2.wasDisposed) {
                        _this2.addSkeletonSource(skeletonSource);
                        if (--remaining === 0) {
                            _this2.isReady = true;
                        }
                    }
                });
            }
            if (multiscaleSource !== undefined) {
                ++remaining;
                multiscaleSource.then(function (volume) {
                    if (!_this2.wasDisposed) {
                        var displayState = _this2.displayState;

                        _this2.addRenderLayer(new SegmentationRenderLayer(volume, _Object$assign({}, displayState, { transform: displayState.objectToDataTransform, renderScaleHistogram: _this2.sliceViewRenderScaleHistogram, renderScaleTarget: _this2.sliceViewRenderScaleTarget })));
                        if (meshPath === undefined && skeletonsPath === undefined) {
                            ++remaining;
                            _Promise.resolve(volume.getMeshSource()).then(function (objectSource) {
                                if (_this2.wasDisposed) {
                                    if (objectSource !== null) {
                                        objectSource.dispose();
                                    }
                                    return;
                                }
                                if (--remaining === 0) {
                                    _this2.isReady = true;
                                }
                                if (objectSource instanceof MeshSource || objectSource instanceof MultiscaleMeshSource) {
                                    _this2.addMesh(objectSource);
                                } else if (objectSource instanceof SkeletonSource) {
                                    _this2.addSkeletonSource(objectSource);
                                }
                            });
                        }
                        if (--remaining === 0) {
                            _this2.isReady = true;
                        }
                    }
                });
            }
        }
    }, {
        key: 'addMesh',
        value: function addMesh(meshSource) {
            if (meshSource instanceof MeshSource) {
                this.meshLayer = new MeshLayer(this.manager.chunkManager, meshSource, this.displayState);
            } else {
                this.meshLayer = new MultiscaleMeshLayer(this.manager.chunkManager, meshSource, this.displayState);
            }
            this.addRenderLayer(this.meshLayer);
            this.objectLayerStateChanged.dispatch();
        }
    }, {
        key: 'addSkeletonSource',
        value: function addSkeletonSource(skeletonSource) {
            var base = new SkeletonLayer(this.manager.chunkManager, skeletonSource, this.manager.voxelSize, this.displayState);
            this.skeletonLayer = base;
            this.addRenderLayer(new PerspectiveViewSkeletonLayer(base.addRef()));
            this.addRenderLayer(new SliceViewPanelSkeletonLayer( /* transfer ownership */base));
            this.objectLayerStateChanged.dispatch();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var x = _get(SegmentationUserLayer.prototype.__proto__ || _Object$getPrototypeOf(SegmentationUserLayer.prototype), 'toJSON', this).call(this);
            x['type'] = 'segmentation';
            x[MESH_JSON_KEY] = this.meshPath;
            x[SKELETONS_JSON_KEY] = this.skeletonsPath;
            x[SELECTED_ALPHA_JSON_KEY] = this.displayState.selectedAlpha.toJSON();
            x[NOT_SELECTED_ALPHA_JSON_KEY] = this.displayState.notSelectedAlpha.toJSON();
            x[SATURATION_JSON_KEY] = this.displayState.saturation.toJSON();
            x[OBJECT_ALPHA_JSON_KEY] = this.displayState.objectAlpha.toJSON();
            x[HIDE_SEGMENT_ZERO_JSON_KEY] = this.displayState.hideSegmentZero.toJSON();
            x[COLOR_SEED_JSON_KEY] = this.displayState.segmentColorHash.toJSON();
            var segmentStatedColors = this.displayState.segmentStatedColors;

            if (segmentStatedColors.size > 0) {
                var json = segmentStatedColors.toJSON();
                // Convert colors from decimal integers to CSS "#RRGGBB" format.
                _Object$keys(json).map(function (k) {
                    return json[k] = '#' + parseInt(json[k], 10).toString(16).padStart(6, '0');
                });
                x[SEGMENT_STATED_COLORS_JSON_KEY] = json;
            }
            var visibleSegments = this.displayState.visibleSegments;

            if (visibleSegments.size > 0) {
                x[SEGMENTS_JSON_KEY] = visibleSegments.toJSON();
            }
            var highlightedSegments = this.displayState.highlightedSegments;

            if (highlightedSegments.size > 0) {
                x[HIGHLIGHTS_JSON_KEY] = highlightedSegments.toJSON();
            }
            var segmentEquivalences = this.displayState.segmentEquivalences;

            if (segmentEquivalences.size > 0) {
                x[EQUIVALENCES_JSON_KEY] = segmentEquivalences.toJSON();
            }
            x[SKELETON_RENDERING_JSON_KEY] = this.displayState.skeletonRenderingOptions.toJSON();
            x[MESH_RENDER_SCALE_JSON_KEY] = this.displayState.renderScaleTarget.toJSON();
            return x;
        }
    }, {
        key: 'transformPickedValue',
        value: function transformPickedValue(value) {
            if (value == null) {
                return value;
            }
            var segmentEquivalences = this.displayState.segmentEquivalences;

            if (segmentEquivalences.size === 0) {
                return value;
            }
            if (typeof value === 'number') {
                value = new Uint64(value, 0);
            }
            var mappedValue = segmentEquivalences.get(value);
            if (Uint64.equal(mappedValue, value)) {
                return value;
            }
            return new Uint64MapEntry(value, mappedValue);
        }
    }, {
        key: 'handleAction',
        value: function handleAction(action) {
            switch (action) {
                case 'recolor':
                    {
                        this.displayState.segmentColorHash.randomize();
                        break;
                    }
                case 'clear-segments':
                    {
                        this.displayState.visibleSegments.clear();
                        break;
                    }
                case 'select':
                    {
                        var segmentSelectionState = this.displayState.segmentSelectionState;

                        if (segmentSelectionState.hasSelectedSegment) {
                            var segment = segmentSelectionState.selectedSegment;
                            var visibleSegments = this.displayState.visibleSegments;

                            if (visibleSegments.has(segment)) {
                                visibleSegments.delete(segment);
                            } else {
                                visibleSegments.add(segment);
                            }
                        }
                        break;
                    }
                case 'highlight':
                    {
                        var _segmentSelectionState = this.displayState.segmentSelectionState;

                        if (_segmentSelectionState.hasSelectedSegment) {
                            var _segment = _segmentSelectionState.selectedSegment;
                            var highlightedSegments = this.displayState.highlightedSegments;

                            if (highlightedSegments.has(_segment)) {
                                highlightedSegments.delete(_segment);
                            } else {
                                highlightedSegments.add(_segment);
                            }
                        }
                        break;
                    }
            }
        }
    }, {
        key: 'volumeOptions',
        get: function get() {
            return { volumeType: VolumeType.SEGMENTATION };
        }
    }]);

    return SegmentationUserLayer;
}(Base);
function makeSkeletonShaderCodeWidget(layer) {
    return new ShaderCodeWidget({
        fragmentMain: layer.displayState.skeletonRenderingOptions.shader,
        shaderError: layer.displayState.shaderError,
        fragmentMainStartLine: SKELETON_FRAGMENT_MAIN_START
    });
}

var DisplayOptionsTab = function (_Tab) {
    _inherits(DisplayOptionsTab, _Tab);

    function DisplayOptionsTab(layer) {
        _classCallCheck(this, DisplayOptionsTab);

        var _this3 = _possibleConstructorReturn(this, (DisplayOptionsTab.__proto__ || _Object$getPrototypeOf(DisplayOptionsTab)).call(this));

        _this3.layer = layer;
        _this3.visibleSegmentWidget = _this3.registerDisposer(new SegmentSetWidget(_this3.layer.displayState));
        _this3.addSegmentWidget = _this3.registerDisposer(new Uint64EntryWidget());
        _this3.selectedAlphaWidget = _this3.registerDisposer(new RangeWidget(_this3.layer.displayState.selectedAlpha));
        _this3.notSelectedAlphaWidget = _this3.registerDisposer(new RangeWidget(_this3.layer.displayState.notSelectedAlpha));
        _this3.saturationWidget = _this3.registerDisposer(new RangeWidget(_this3.layer.displayState.saturation));
        _this3.objectAlphaWidget = _this3.registerDisposer(new RangeWidget(_this3.layer.displayState.objectAlpha));
        var element = _this3.element;

        element.classList.add('segmentation-dropdown');
        var selectedAlphaWidget = _this3.selectedAlphaWidget,
            notSelectedAlphaWidget = _this3.notSelectedAlphaWidget,
            saturationWidget = _this3.saturationWidget,
            objectAlphaWidget = _this3.objectAlphaWidget;

        selectedAlphaWidget.promptElement.textContent = 'Opacity (on)';
        notSelectedAlphaWidget.promptElement.textContent = 'Opacity (off)';
        saturationWidget.promptElement.textContent = 'Saturation';
        objectAlphaWidget.promptElement.textContent = 'Opacity (3d)';
        if (_this3.layer.volumePath !== undefined) {
            element.appendChild(_this3.selectedAlphaWidget.element);
            element.appendChild(_this3.notSelectedAlphaWidget.element);
            element.appendChild(_this3.saturationWidget.element);
            {
                var renderScaleWidget = _this3.registerDisposer(new RenderScaleWidget(_this3.layer.sliceViewRenderScaleHistogram, _this3.layer.sliceViewRenderScaleTarget));
                renderScaleWidget.label.textContent = 'Resolution (slice)';
                element.appendChild(renderScaleWidget.element);
            }
        }
        var has3dLayer = _this3.registerDisposer(new ComputedWatchableValue(function () {
            return _this3.layer.meshPath || _this3.layer.meshLayer || _this3.layer.skeletonsPath || _this3.layer.skeletonLayer ? true : false;
        }, _this3.layer.objectLayerStateChanged));
        _this3.registerDisposer(new ElementVisibilityFromTrackableBoolean(has3dLayer, _this3.objectAlphaWidget.element));
        {
            var _renderScaleWidget = _this3.registerDisposer(new RenderScaleWidget(_this3.layer.displayState.renderScaleHistogram, _this3.layer.displayState.renderScaleTarget));
            _renderScaleWidget.label.textContent = 'Resolution (mesh)';
            element.appendChild(_renderScaleWidget.element);
            _this3.registerDisposer(new ElementVisibilityFromTrackableBoolean(has3dLayer, _renderScaleWidget.element));
        }
        element.appendChild(_this3.objectAlphaWidget.element);
        {
            var checkbox = _this3.registerDisposer(new TrackableBooleanCheckbox(layer.displayState.hideSegmentZero));
            checkbox.element.className = 'neuroglancer-segmentation-dropdown-hide-segment-zero neuroglancer-noselect';
            var label = document.createElement('label');
            label.className = 'neuroglancer-segmentation-dropdown-hide-segment-zero neuroglancer-noselect';
            label.appendChild(document.createTextNode('Hide segment ID 0'));
            label.appendChild(checkbox.element);
            element.appendChild(label);
        }
        _this3.addSegmentWidget.element.classList.add('add-segment');
        _this3.addSegmentWidget.element.title = 'Add one or more segment IDs';
        element.appendChild(_this3.registerDisposer(_this3.addSegmentWidget).element);
        _this3.registerDisposer(_this3.addSegmentWidget.valuesEntered.add(function (values) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(values), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var value = _step2.value;

                    _this3.layer.displayState.visibleSegments.add(value);
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
        }));
        element.appendChild(_this3.registerDisposer(_this3.visibleSegmentWidget).element);
        var maybeAddSkeletonShaderUI = function maybeAddSkeletonShaderUI() {
            if (_this3.codeWidget !== undefined) {
                return;
            }
            if (_this3.layer.skeletonsPath === null || _this3.layer.skeletonLayer === undefined) {
                return;
            }
            var addViewSpecificSkeletonRenderingControls = function addViewSpecificSkeletonRenderingControls(options, viewName) {
                {
                    var widget = _this3.registerDisposer(new EnumSelectWidget(options.mode));
                    var _label = document.createElement('label');
                    _label.className = 'neuroglancer-segmentation-dropdown-skeleton-render-mode neuroglancer-noselect';
                    _label.appendChild(document.createTextNode('Skeleton mode (' + viewName + ')'));
                    _label.appendChild(widget.element);
                    element.appendChild(_label);
                }
                {
                    var _widget = _this3.registerDisposer(new RangeWidget(options.lineWidth, { min: 1, max: 40, step: 1 }));
                    _widget.promptElement.textContent = 'Skeleton line width (' + viewName + ')';
                    element.appendChild(_widget.element);
                }
            };
            addViewSpecificSkeletonRenderingControls(layer.displayState.skeletonRenderingOptions.params2d, '2d');
            addViewSpecificSkeletonRenderingControls(layer.displayState.skeletonRenderingOptions.params3d, '3d');
            var topRow = document.createElement('div');
            topRow.className = 'neuroglancer-segmentation-dropdown-skeleton-shader-header';
            var label = document.createElement('div');
            label.style.flex = '1';
            label.textContent = 'Skeleton shader:';
            var helpLink = document.createElement('a');
            var helpButton = document.createElement('button');
            helpButton.type = 'button';
            helpButton.textContent = '?';
            helpButton.className = 'help-link';
            helpLink.appendChild(helpButton);
            helpLink.title = 'Documentation on skeleton rendering';
            helpLink.target = '_blank';
            helpLink.href = 'https://github.com/google/neuroglancer/blob/master/src/neuroglancer/sliceview/image_layer_rendering.md';
            var maximizeButton = document.createElement('button');
            maximizeButton.innerHTML = '&square;';
            maximizeButton.className = 'maximize-button';
            maximizeButton.title = 'Show larger editor view';
            _this3.registerEventListener(maximizeButton, 'click', function () {
                new ShaderCodeOverlay(_this3.layer);
            });
            topRow.appendChild(label);
            topRow.appendChild(maximizeButton);
            topRow.appendChild(helpLink);
            element.appendChild(topRow);
            var codeWidget = _this3.codeWidget = _this3.registerDisposer(makeSkeletonShaderCodeWidget(_this3.layer));
            element.appendChild(codeWidget.element);
            codeWidget.textEditor.refresh();
        };
        _this3.registerDisposer(_this3.layer.objectLayerStateChanged.add(maybeAddSkeletonShaderUI));
        maybeAddSkeletonShaderUI();
        _this3.visibility.changed.add(function () {
            if (_this3.visible) {
                if (_this3.codeWidget !== undefined) {
                    _this3.codeWidget.textEditor.refresh();
                }
            }
        });
        return _this3;
    }

    return DisplayOptionsTab;
}(Tab);

var ShaderCodeOverlay = function (_Overlay) {
    _inherits(ShaderCodeOverlay, _Overlay);

    function ShaderCodeOverlay(layer) {
        _classCallCheck(this, ShaderCodeOverlay);

        var _this4 = _possibleConstructorReturn(this, (ShaderCodeOverlay.__proto__ || _Object$getPrototypeOf(ShaderCodeOverlay)).call(this));

        _this4.layer = layer;
        _this4.codeWidget = _this4.registerDisposer(makeSkeletonShaderCodeWidget(_this4.layer));
        _this4.content.classList.add('neuroglancer-segmentation-layer-skeleton-shader-overlay');
        _this4.content.appendChild(_this4.codeWidget.element);
        _this4.codeWidget.textEditor.refresh();
        return _this4;
    }

    return ShaderCodeOverlay;
}(Overlay);

registerLayerType('segmentation', SegmentationUserLayer);
registerVolumeLayerType(VolumeType.SEGMENTATION, SegmentationUserLayer);
//# sourceMappingURL=segmentation_user_layer.js.map