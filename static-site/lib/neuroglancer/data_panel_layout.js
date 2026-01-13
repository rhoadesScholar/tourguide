import _Object$keys from 'babel-runtime/core-js/object/keys';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Set from 'babel-runtime/core-js/set';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Map from 'babel-runtime/core-js/map';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import * as L from './layout';
import { LinkedOrientationState, LinkedSpatialPosition, LinkedZoomState, NavigationState, OrientationState, Pose } from './navigation_state';
import { PerspectivePanel } from './perspective_view/panel';
import { SliceView } from './sliceview/frontend';
import { SliceViewPanel } from './sliceview/panel';
import { TrackableBoolean } from './trackable_boolean';
import { TrackableValue } from './trackable_value';
import { RefCounted } from './util/disposable';
import { removeChildren, removeFromParent } from './util/dom';
import { EventActionMap, registerActionListener } from './util/event_action_map';
import { quat } from './util/geom';
import { verifyObject, verifyObjectProperty, verifyPositiveInt } from './util/json';
import { NullarySignal } from './util/signal';
import { WatchableMap } from './util/watchable_map';
export var InputEventBindings = function InputEventBindings() {
    _classCallCheck(this, InputEventBindings);

    this.perspectiveView = new EventActionMap();
    this.sliceView = new EventActionMap();
};
var AXES_RELATIVE_ORIENTATION = new _Map([['xy', undefined], ['xz', quat.rotateX(quat.create(), quat.create(), Math.PI / 2)], ['yz', quat.rotateY(quat.create(), quat.create(), Math.PI / 2)]]);
var oneSquareSymbol = '◻';
var LAYOUT_SYMBOLS = new _Map([['4panel', '◱'], ['3d', oneSquareSymbol]]);
export function makeSliceView(viewerState, baseToSelf) {
    var navigationState = void 0;
    if (baseToSelf === undefined) {
        navigationState = viewerState.navigationState;
    } else {
        navigationState = new NavigationState(new Pose(viewerState.navigationState.pose.position, OrientationState.makeRelative(viewerState.navigationState.pose.orientation, baseToSelf)), viewerState.navigationState.zoomFactor);
    }
    return new SliceView(viewerState.chunkManager, viewerState.layerManager, navigationState);
}
export function makeNamedSliceView(viewerState, axes) {
    return makeSliceView(viewerState, AXES_RELATIVE_ORIENTATION.get(axes));
}
export function makeOrthogonalSliceViews(viewerState) {
    return new _Map([['xy', makeNamedSliceView(viewerState, 'xy')], ['xz', makeNamedSliceView(viewerState, 'xz')], ['yz', makeNamedSliceView(viewerState, 'yz')]]);
}
export function getCommonViewerState(viewer) {
    return {
        crossSectionBackgroundColor: viewer.crossSectionBackgroundColor,
        perspectiveViewBackgroundColor: viewer.perspectiveViewBackgroundColor,
        mouseState: viewer.mouseState,
        layerManager: viewer.layerManager,
        showAxisLines: viewer.showAxisLines,
        visibleLayerRoles: viewer.visibleLayerRoles,
        selectedLayer: viewer.selectedLayer,
        visibility: viewer.visibility,
        scaleBarOptions: viewer.scaleBarOptions
    };
}
function getCommonPerspectiveViewerState(container) {
    var viewer = container.viewer;

    return _Object$assign({}, getCommonViewerState(viewer), { navigationState: viewer.perspectiveNavigationState, inputEventMap: viewer.inputEventBindings.perspectiveView, orthographicProjection: container.specification.orthographicProjection, showScaleBar: viewer.showScaleBar, rpc: viewer.chunkManager.rpc });
}
function getCommonSliceViewerState(viewer) {
    return _Object$assign({}, getCommonViewerState(viewer), { navigationState: viewer.navigationState, inputEventMap: viewer.inputEventBindings.sliceView });
}
function registerRelatedLayouts(layout, panel, relatedLayouts) {
    var controls = document.createElement('div');
    controls.className = 'neuroglancer-data-panel-layout-controls';
    layout.registerDisposer(function () {
        return removeFromParent(controls);
    });

    var _loop = function _loop(i) {
        var relatedLayout = relatedLayouts[Math.min(relatedLayouts.length - 1, i)];
        layout.registerDisposer(registerActionListener(panel.element, i === 0 ? 'toggle-layout' : 'toggle-layout-alternative', function (event) {
            layout.container.name = relatedLayout;
            event.stopPropagation();
        }));
    };

    for (var i = 0; i < 2; ++i) {
        _loop(i);
    }

    var _loop2 = function _loop2(_relatedLayout) {
        var button = document.createElement('button');
        var innerDiv = document.createElement('div');
        button.appendChild(innerDiv);
        innerDiv.textContent = LAYOUT_SYMBOLS.get(_relatedLayout);
        button.title = 'Switch to ' + _relatedLayout + ' layout.';
        button.addEventListener('click', function () {
            layout.container.name = _relatedLayout;
        });
        controls.appendChild(button);
    };

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(relatedLayouts), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _relatedLayout = _step.value;

            _loop2(_relatedLayout);
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

    panel.element.appendChild(controls);
}
function makeSliceViewFromSpecification(viewer, specification) {
    var sliceView = new SliceView(viewer.chunkManager, viewer.layerManager, specification.navigationState.addRef());
    var updateViewportSize = function updateViewportSize() {
        sliceView.setViewportSizeDebounced(specification.width.value, specification.height.value);
    };
    sliceView.registerDisposer(specification.width.changed.add(updateViewportSize));
    sliceView.registerDisposer(specification.height.changed.add(updateViewportSize));
    updateViewportSize();
    return sliceView;
}
function addUnconditionalSliceViews(viewer, panel, crossSections) {
    var previouslyAdded = new _Map();
    var update = function update() {
        var currentCrossSections = new _Set();
        // Add missing cross sections.
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = _getIterator(crossSections.values()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var crossSection = _step2.value;

                currentCrossSections.add(crossSection);
                if (previouslyAdded.has(crossSection)) {
                    continue;
                }
                var sliceView = makeSliceViewFromSpecification(viewer, crossSection);
                panel.sliceViews.set(sliceView, true);
                previouslyAdded.set(crossSection, sliceView);
            }
            // Remove extra cross sections.
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
            for (var _iterator3 = _getIterator(previouslyAdded), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _ref = _step3.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var _crossSection = _ref2[0];
                var sliceView = _ref2[1];

                if (currentCrossSections.has(_crossSection)) {
                    continue;
                }
                panel.sliceViews.delete(sliceView);
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
    };
    update();
}
export var FourPanelLayout = function (_RefCounted) {
    _inherits(FourPanelLayout, _RefCounted);

    function FourPanelLayout(container, rootElement, viewer, crossSections) {
        _classCallCheck(this, FourPanelLayout);

        var _this = _possibleConstructorReturn(this, (FourPanelLayout.__proto__ || _Object$getPrototypeOf(FourPanelLayout)).call(this));

        _this.container = container;
        _this.rootElement = rootElement;
        _this.viewer = viewer;
        var sliceViews = makeOrthogonalSliceViews(viewer);
        var display = viewer.display;

        var perspectiveViewerState = _Object$assign({}, getCommonPerspectiveViewerState(container), { showSliceViews: viewer.showPerspectiveSliceViews, showSliceViewsCheckbox: true });
        var sliceViewerState = _Object$assign({}, getCommonSliceViewerState(viewer), { showScaleBar: viewer.showScaleBar });
        var sliceViewerStateWithoutScaleBar = _Object$assign({}, getCommonSliceViewerState(viewer), { showScaleBar: new TrackableBoolean(false, false) });
        var makeSliceViewPanel = function makeSliceViewPanel(axes, element, state) {
            var panel = _this.registerDisposer(new SliceViewPanel(display, element, sliceViews.get(axes), state));
            registerRelatedLayouts(_this, panel, [axes, axes + '-3d']);
            return panel;
        };
        var mainDisplayContents = [L.withFlex(1, L.box('column', [L.withFlex(1, L.box('row', [L.withFlex(1, function (element) {
            makeSliceViewPanel('xy', element, sliceViewerState);
        }), L.withFlex(1, function (element) {
            makeSliceViewPanel('xz', element, sliceViewerStateWithoutScaleBar);
        })])), L.withFlex(1, L.box('row', [L.withFlex(1, function (element) {
            var panel = _this.registerDisposer(new PerspectivePanel(display, element, perspectiveViewerState));
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = _getIterator(sliceViews.values()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var sliceView = _step4.value;

                    panel.sliceViews.set(sliceView.addRef(), false);
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

            addUnconditionalSliceViews(viewer, panel, crossSections);
            registerRelatedLayouts(_this, panel, ['3d']);
        }), L.withFlex(1, function (element) {
            makeSliceViewPanel('yz', element, sliceViewerStateWithoutScaleBar);
        })]))]))];
        L.box('row', mainDisplayContents)(rootElement);
        return _this;
    }

    _createClass(FourPanelLayout, [{
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.rootElement);
            _get(FourPanelLayout.prototype.__proto__ || _Object$getPrototypeOf(FourPanelLayout.prototype), 'disposed', this).call(this);
        }
    }]);

    return FourPanelLayout;
}(RefCounted);
export var SliceViewPerspectiveTwoPanelLayout = function (_RefCounted2) {
    _inherits(SliceViewPerspectiveTwoPanelLayout, _RefCounted2);

    function SliceViewPerspectiveTwoPanelLayout(container, rootElement, viewer, direction, axes, crossSections) {
        _classCallCheck(this, SliceViewPerspectiveTwoPanelLayout);

        var _this2 = _possibleConstructorReturn(this, (SliceViewPerspectiveTwoPanelLayout.__proto__ || _Object$getPrototypeOf(SliceViewPerspectiveTwoPanelLayout)).call(this));

        _this2.container = container;
        _this2.rootElement = rootElement;
        _this2.viewer = viewer;
        _this2.direction = direction;
        var sliceView = makeNamedSliceView(viewer, axes);
        var display = viewer.display;

        var perspectiveViewerState = _Object$assign({}, getCommonPerspectiveViewerState(container), { showSliceViews: viewer.showPerspectiveSliceViews, showSliceViewsCheckbox: true });
        var sliceViewerState = _Object$assign({}, getCommonSliceViewerState(viewer), { showScaleBar: viewer.showScaleBar });
        L.withFlex(1, L.box(direction, [L.withFlex(1, function (element) {
            var panel = _this2.registerDisposer(new SliceViewPanel(display, element, sliceView, sliceViewerState));
            registerRelatedLayouts(_this2, panel, [axes, '4panel']);
        }), L.withFlex(1, function (element) {
            var panel = _this2.registerDisposer(new PerspectivePanel(display, element, perspectiveViewerState));
            panel.sliceViews.set(sliceView.addRef(), false);
            addUnconditionalSliceViews(viewer, panel, crossSections);
            registerRelatedLayouts(_this2, panel, ['3d', '4panel']);
        })]))(rootElement);
        return _this2;
    }

    _createClass(SliceViewPerspectiveTwoPanelLayout, [{
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.rootElement);
            _get(SliceViewPerspectiveTwoPanelLayout.prototype.__proto__ || _Object$getPrototypeOf(SliceViewPerspectiveTwoPanelLayout.prototype), 'disposed', this).call(this);
        }
    }]);

    return SliceViewPerspectiveTwoPanelLayout;
}(RefCounted);
export var SinglePanelLayout = function (_RefCounted3) {
    _inherits(SinglePanelLayout, _RefCounted3);

    function SinglePanelLayout(container, rootElement, viewer, axes) {
        _classCallCheck(this, SinglePanelLayout);

        var _this3 = _possibleConstructorReturn(this, (SinglePanelLayout.__proto__ || _Object$getPrototypeOf(SinglePanelLayout)).call(this));

        _this3.container = container;
        _this3.rootElement = rootElement;
        _this3.viewer = viewer;
        var sliceView = makeNamedSliceView(viewer, axes);
        var sliceViewerState = _Object$assign({}, getCommonSliceViewerState(viewer), { showScaleBar: viewer.showScaleBar });
        L.box('row', [L.withFlex(1, function (element) {
            var panel = _this3.registerDisposer(new SliceViewPanel(viewer.display, element, sliceView, sliceViewerState));
            registerRelatedLayouts(_this3, panel, ['4panel', axes + '-3d']);
        })])(rootElement);
        return _this3;
    }

    _createClass(SinglePanelLayout, [{
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.rootElement);
            _get(SinglePanelLayout.prototype.__proto__ || _Object$getPrototypeOf(SinglePanelLayout.prototype), 'disposed', this).call(this);
        }
    }]);

    return SinglePanelLayout;
}(RefCounted);
export var SinglePerspectiveLayout = function (_RefCounted4) {
    _inherits(SinglePerspectiveLayout, _RefCounted4);

    function SinglePerspectiveLayout(container, rootElement, viewer, crossSections) {
        _classCallCheck(this, SinglePerspectiveLayout);

        var _this4 = _possibleConstructorReturn(this, (SinglePerspectiveLayout.__proto__ || _Object$getPrototypeOf(SinglePerspectiveLayout)).call(this));

        _this4.container = container;
        _this4.rootElement = rootElement;
        _this4.viewer = viewer;
        var perspectiveViewerState = _Object$assign({}, getCommonPerspectiveViewerState(container), { showSliceViews: new TrackableBoolean(false, false) });
        L.box('row', [L.withFlex(1, function (element) {
            var panel = _this4.registerDisposer(new PerspectivePanel(viewer.display, element, perspectiveViewerState));
            addUnconditionalSliceViews(viewer, panel, crossSections);
            registerRelatedLayouts(_this4, panel, ['4panel']);
        })])(rootElement);
        return _this4;
    }

    _createClass(SinglePerspectiveLayout, [{
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.rootElement);
            _get(SinglePerspectiveLayout.prototype.__proto__ || _Object$getPrototypeOf(SinglePerspectiveLayout.prototype), 'disposed', this).call(this);
        }
    }]);

    return SinglePerspectiveLayout;
}(RefCounted);
export var LAYOUTS = new _Map([['4panel', {
    factory: function factory(container, element, viewer, crossSections) {
        return new FourPanelLayout(container, element, viewer, crossSections);
    }
}], ['3d', {
    factory: function factory(container, element, viewer, crossSections) {
        return new SinglePerspectiveLayout(container, element, viewer, crossSections);
    }
}]]);

var _loop3 = function _loop3(axes) {
    LAYOUTS.set(axes, {
        factory: function factory(container, element, viewer) {
            return new SinglePanelLayout(container, element, viewer, axes);
        }
    });
    var splitLayout = axes + '-3d';
    LAYOUT_SYMBOLS.set(axes, oneSquareSymbol);
    LAYOUT_SYMBOLS.set(splitLayout, '◫');
    LAYOUTS.set(splitLayout, {
        factory: function factory(container, element, viewer, crossSections) {
            return new SliceViewPerspectiveTwoPanelLayout(container, element, viewer, 'row', axes, crossSections);
        }
    });
};

var _iteratorNormalCompletion5 = true;
var _didIteratorError5 = false;
var _iteratorError5 = undefined;

try {
    for (var _iterator5 = _getIterator(AXES_RELATIVE_ORIENTATION.keys()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var axes = _step5.value;

        _loop3(axes);
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

export function getLayoutByName(obj) {
    var layout = LAYOUTS.get(obj);
    if (layout === undefined) {
        throw new Error('Invalid layout name: ' + _JSON$stringify(obj) + '.');
    }
    return layout;
}
export function validateLayoutName(obj) {
    getLayoutByName(obj);
    return obj;
}
export var CrossSectionSpecification = function (_RefCounted5) {
    _inherits(CrossSectionSpecification, _RefCounted5);

    function CrossSectionSpecification(parent) {
        _classCallCheck(this, CrossSectionSpecification);

        var _this5 = _possibleConstructorReturn(this, (CrossSectionSpecification.__proto__ || _Object$getPrototypeOf(CrossSectionSpecification)).call(this));

        _this5.width = new TrackableValue(1000, verifyPositiveInt);
        _this5.height = new TrackableValue(1000, verifyPositiveInt);
        _this5.changed = new NullarySignal();
        _this5.position = new LinkedSpatialPosition(parent.position.addRef());
        _this5.position.changed.add(_this5.changed.dispatch);
        _this5.orientation = new LinkedOrientationState(parent.pose.orientation.addRef());
        _this5.orientation.changed.add(_this5.changed.dispatch);
        _this5.width.changed.add(_this5.changed.dispatch);
        _this5.height.changed.add(_this5.changed.dispatch);
        _this5.zoom = new LinkedZoomState(parent.zoomFactor.addRef());
        _this5.zoom.changed.add(_this5.changed.dispatch);
        _this5.navigationState = _this5.registerDisposer(new NavigationState(new Pose(_this5.position.value, _this5.orientation.value), _this5.zoom.value));
        return _this5;
    }

    _createClass(CrossSectionSpecification, [{
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this6 = this;

            verifyObject(obj);
            verifyObjectProperty(obj, 'width', function (x) {
                return x !== undefined && _this6.width.restoreState(x);
            });
            verifyObjectProperty(obj, 'height', function (x) {
                return x !== undefined && _this6.height.restoreState(x);
            });
            verifyObjectProperty(obj, 'position', function (x) {
                return x !== undefined && _this6.position.restoreState(x);
            });
            verifyObjectProperty(obj, 'orientation', function (x) {
                return x !== undefined && _this6.orientation.restoreState(x);
            });
            verifyObjectProperty(obj, 'zoom', function (x) {
                return x !== undefined && _this6.zoom.restoreState(x);
            });
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.width.reset();
            this.height.reset();
            this.position.reset();
            this.orientation.reset();
            this.zoom.reset();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return {
                width: this.width.toJSON(),
                height: this.height.toJSON(),
                position: this.position.toJSON(),
                orientation: this.orientation.toJSON(),
                zoom: this.zoom.toJSON()
            };
        }
    }]);

    return CrossSectionSpecification;
}(RefCounted);
export var CrossSectionSpecificationMap = function (_WatchableMap) {
    _inherits(CrossSectionSpecificationMap, _WatchableMap);

    function CrossSectionSpecificationMap(parentNavigationState) {
        _classCallCheck(this, CrossSectionSpecificationMap);

        var _this7 = _possibleConstructorReturn(this, (CrossSectionSpecificationMap.__proto__ || _Object$getPrototypeOf(CrossSectionSpecificationMap)).call(this, function (v) {
            return _this7.registerDisposer(_this7.registerDisposer(v).changed.add(_this7.changed.dispatch));
        }, function (v) {
            v.changed.remove(_this7.changed.dispatch);
            v.dispose();
        }));

        _this7.parentNavigationState = parentNavigationState;
        _this7.registerDisposer(parentNavigationState);
        return _this7;
    }

    _createClass(CrossSectionSpecificationMap, [{
        key: 'restoreState',
        value: function restoreState(obj) {
            verifyObject(obj);
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = _getIterator(_Object$keys(obj)), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var key = _step6.value;

                    var state = new CrossSectionSpecification(this.parentNavigationState);
                    try {
                        this.set(key, state.addRef());
                        state.restoreState(obj[key]);
                    } finally {
                        state.dispose();
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
        key: 'reset',
        value: function reset() {
            this.clear();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            if (this.size === 0) return undefined;
            var obj = {};
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = _getIterator(this), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var _ref3 = _step7.value;

                    var _ref4 = _slicedToArray(_ref3, 2);

                    var k = _ref4[0];
                    var v = _ref4[1];

                    obj[k] = v.toJSON();
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

            return obj;
        }
    }]);

    return CrossSectionSpecificationMap;
}(WatchableMap);
export var DataPanelLayoutSpecification = function (_RefCounted6) {
    _inherits(DataPanelLayoutSpecification, _RefCounted6);

    function DataPanelLayoutSpecification(parentNavigationState, defaultLayout) {
        _classCallCheck(this, DataPanelLayoutSpecification);

        var _this8 = _possibleConstructorReturn(this, (DataPanelLayoutSpecification.__proto__ || _Object$getPrototypeOf(DataPanelLayoutSpecification)).call(this));

        _this8.changed = new NullarySignal();
        _this8.orthographicProjection = new TrackableBoolean(false);
        _this8.type = new TrackableValue(defaultLayout, validateLayoutName);
        _this8.type.changed.add(_this8.changed.dispatch);
        _this8.crossSections = _this8.registerDisposer(new CrossSectionSpecificationMap(parentNavigationState));
        _this8.crossSections.changed.add(_this8.changed.dispatch);
        _this8.orthographicProjection.changed.add(_this8.changed.dispatch);
        _this8.registerDisposer(parentNavigationState);
        return _this8;
    }

    _createClass(DataPanelLayoutSpecification, [{
        key: 'reset',
        value: function reset() {
            this.crossSections.clear();
            this.orthographicProjection.reset();
            this.type.reset();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            var _this9 = this;

            this.crossSections.clear();
            this.orthographicProjection.reset();
            if (typeof obj === 'string') {
                this.type.restoreState(obj);
            } else {
                verifyObject(obj);
                verifyObjectProperty(obj, 'type', function (x) {
                    return _this9.type.restoreState(x);
                });
                verifyObjectProperty(obj, 'orthographicProjection', function (x) {
                    return _this9.orthographicProjection.restoreState(x);
                });
                verifyObjectProperty(obj, 'crossSections', function (x) {
                    return x !== undefined && _this9.crossSections.restoreState(x);
                });
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var type = this.type,
                crossSections = this.crossSections,
                orthographicProjection = this.orthographicProjection;

            var orthographicProjectionJson = orthographicProjection.toJSON();
            if (crossSections.size === 0 && orthographicProjectionJson === undefined) {
                return type.value;
            }
            return {
                type: type.value,
                crossSections: crossSections.toJSON(),
                orthographicProjection: orthographicProjectionJson
            };
        }
    }]);

    return DataPanelLayoutSpecification;
}(RefCounted);
export var DataPanelLayoutContainer = function (_RefCounted7) {
    _inherits(DataPanelLayoutContainer, _RefCounted7);

    function DataPanelLayoutContainer(viewer, defaultLayout) {
        _classCallCheck(this, DataPanelLayoutContainer);

        var _this10 = _possibleConstructorReturn(this, (DataPanelLayoutContainer.__proto__ || _Object$getPrototypeOf(DataPanelLayoutContainer)).call(this));

        _this10.viewer = viewer;
        _this10.element = document.createElement('div');
        _this10.specification = _this10.registerDisposer(new DataPanelLayoutSpecification(_this10.viewer.navigationState.addRef(), defaultLayout));
        _this10.element.style.flex = '1';
        var scheduleUpdateLayout = _this10.registerCancellable(debounce(function () {
            return _this10.updateLayout();
        }, 0));
        _this10.specification.type.changed.add(scheduleUpdateLayout);
        registerActionListener(_this10.element, 'toggle-orthographic-projection', function () {
            return _this10.specification.orthographicProjection.toggle();
        });
        // Ensure the layout is updated before drawing begins to avoid flicker.
        _this10.registerDisposer(_this10.viewer.display.updateStarted.add(function () {
            return scheduleUpdateLayout.flush();
        }));
        scheduleUpdateLayout();
        return _this10;
    }

    _createClass(DataPanelLayoutContainer, [{
        key: 'toJSON',
        value: function toJSON() {
            return this.specification.toJSON();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            this.specification.restoreState(obj);
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.specification.reset();
        }
    }, {
        key: 'disposeLayout',
        value: function disposeLayout() {
            var layout = this.layout;

            if (layout !== undefined) {
                layout.dispose();
                this.layout = undefined;
            }
        }
    }, {
        key: 'updateLayout',
        value: function updateLayout() {
            this.disposeLayout();
            this.layout = getLayoutByName(this.name).factory(this, this.element, this.viewer, this.specification.crossSections);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.disposeLayout();
            _get(DataPanelLayoutContainer.prototype.__proto__ || _Object$getPrototypeOf(DataPanelLayoutContainer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'name',
        get: function get() {
            return this.specification.type.value;
        },
        set: function set(value) {
            this.specification.type.value = value;
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.specification.changed;
        }
    }]);

    return DataPanelLayoutContainer;
}(RefCounted);
//# sourceMappingURL=data_panel_layout.js.map