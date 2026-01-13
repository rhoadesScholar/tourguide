import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _Symbol$iterator from 'babel-runtime/core-js/symbol/iterator';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Set from 'babel-runtime/core-js/set';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _Symbol from 'babel-runtime/core-js/symbol';
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
 * @file Facilities for laying out multiple LayerGroupViewer instances.
 */
import debounce from 'lodash/debounce';
import { getViewerDropEffect, hasViewerDrag, LayerGroupViewer, viewerDragType } from './layer_group_viewer';
import { LayerSubsetSpecification } from './layer_specification';
import { endLayerDrag, getDropLayers, getLayerDragInfo, updateLayerDropEffect } from './ui/layer_drag_and_drop';
import { RefCounted, registerEventListener } from './util/disposable';
import { removeFromParent } from './util/dom';
import { getDropEffect, setDropEffect } from './util/drag_and_drop';
import { parseArray, verifyObject, verifyObjectProperty, verifyString } from './util/json';
import { NullarySignal } from './util/signal';

var layoutComponentContainerSymbol = _Symbol('layoutComponentContainer');
/**
 * Container for a LayoutComponent.  The contained LayoutComponent may change.
 */
export var LayoutComponentContainer = function (_RefCounted) {
    _inherits(LayoutComponentContainer, _RefCounted);

    function LayoutComponentContainer(viewer, spec, parent) {
        _classCallCheck(this, LayoutComponentContainer);

        var _this = _possibleConstructorReturn(this, (LayoutComponentContainer.__proto__ || _Object$getPrototypeOf(LayoutComponentContainer)).call(this));

        _this.viewer = viewer;
        _this.parent = parent;
        _this.changed = new NullarySignal();
        _this.element = document.createElement('div');
        var element = _this.element;

        element.style.display = 'flex';
        element.style.flex = '1';
        element.style.position = 'relative';
        element.style.alignItems = 'stretch';
        element.foo = 'hello';
        element[layoutComponentContainerSymbol] = _this;
        _this.setSpecification(spec);
        var dropZones = [];
        var makeDropZone = function makeDropZone(name) {
            var dropZone = document.createElement('div');
            dropZone.className = 'neuroglancer-layout-split-drop-zone';
            var direction = void 0;
            dropZone.style[name] = '0';
            switch (name) {
                case 'left':
                case 'right':
                    direction = 'row';
                    dropZone.style.width = '10px';
                    dropZone.style.height = '100%';
                    break;
                case 'top':
                case 'bottom':
                    direction = 'column';
                    dropZone.style.height = '10px';
                    dropZone.style.width = '100%';
                    break;
            }
            dropZone.style.display = 'none';
            dropZones.push({ element: dropZone, direction: direction, orientation: name });
            element.appendChild(dropZone);
            _this.registerDisposer(setupDropZone(dropZone, _this.viewer.layerSpecification, function () {
                return _this.split(name).newContainer.component;
            }));
        };
        makeDropZone('left');
        makeDropZone('right');
        makeDropZone('top');
        makeDropZone('bottom');
        var dropZonesVisible = false;
        _this.registerEventListener(element, 'dragenter', function (event) {
            if (dropZonesVisible) {
                return;
            }
            if (getLayerDragInfo(event) === undefined) {
                return;
            }
            dropZonesVisible = true;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(dropZones), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;
                    var dropZone = _ref.element;
                    var direction = _ref.direction;
                    var orientation = _ref.orientation;

                    if (parent !== undefined && direction === parent.direction) {
                        if ((orientation === 'left' || orientation === 'top') && parent.get(0) !== _this || (orientation === 'bottom' || orientation === 'right') && parent.get(parent.length - 1) !== _this) {
                            continue;
                        }
                    }
                    var component = _this.component;

                    if (component instanceof StackLayoutComponent && component.direction === direction) {
                        continue;
                    }
                    dropZone.style.display = 'block';
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
        }, true);
        _this.registerEventListener(element, 'drop', function (_event) {
            if (!dropZonesVisible) {
                return;
            }
            dropZonesVisible = false;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(dropZones), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref2 = _step2.value;
                    var dropZone = _ref2.element;

                    dropZone.style.display = 'none';
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
        });
        _this.registerEventListener(element, 'dragleave', function (event) {
            var relatedTarget = event.relatedTarget;

            if (!dropZonesVisible) {
                return;
            }
            if (relatedTarget instanceof HTMLElement && _this.element.contains(relatedTarget)) {
                return;
            }
            dropZonesVisible = false;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(dropZones), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _ref3 = _step3.value;
                    var dropZone = _ref3.element;

                    dropZone.style.display = 'none';
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
        }, true);
        return _this;
    }

    _createClass(LayoutComponentContainer, [{
        key: 'unsetComponent',
        value: function unsetComponent() {
            var oldComponent = this.componentValue;
            if (oldComponent !== undefined) {
                oldComponent.changed.remove(this.changed.dispatch);
                this.element.removeChild(oldComponent.element);
                oldComponent.dispose();
            }
        }
    }, {
        key: 'setComponent',
        value: function setComponent(component) {
            var _this2 = this;

            this.unsetComponent();
            this.componentValue = component;
            component.changed.add(this.changed.dispatch);
            this.element.appendChild(component.element);
            if (component instanceof LayerGroupViewer) {
                var layerManager = component.layerManager;

                var scheduleMaybeDelete = component.registerCancellable(debounce(function () {
                    if (layerManager.managedLayers.length === 0) {
                        _this2.dispose();
                    }
                }, 0));
                component.registerDisposer(layerManager.layersChanged.add(function () {
                    if (layerManager.managedLayers.length === 0) {
                        scheduleMaybeDelete();
                    }
                }));
                scheduleMaybeDelete();
            } else if (component instanceof StackLayoutComponent) {
                var _scheduleMaybeDelete = component.registerCancellable(debounce(function () {
                    var length = component.length;

                    if (length === 0 && _this2.parent !== undefined) {
                        _this2.dispose();
                    } else if (length === 1) {
                        var childComponent = component.get(0).component;
                        var spec = void 0;
                        if (_this2.parent === undefined && childComponent instanceof LayerGroupViewer) {
                            spec = childComponent.layout.specification.toJSON();
                            childComponent.viewerNavigationState.copyToParent();
                            var layersToKeep = new _Set(childComponent.layerManager.managedLayers);
                            var layerSpecification = childComponent.layerSpecification;

                            layerSpecification.rootLayers.filter(function (layer) {
                                return layersToKeep.has(layer);
                            });
                            layerSpecification.rootLayers.managedLayers = _Array$from(childComponent.layerManager.managedLayers);
                            layerSpecification.rootLayers.layersChanged.dispatch();
                        } else {
                            spec = childComponent.toJSON();
                        }
                        _this2.setSpecification(spec);
                    }
                }, 0));
                component.registerDisposer(component.changed.add(function () {
                    if (component.length < 2) {
                        _scheduleMaybeDelete();
                    }
                }));
                _scheduleMaybeDelete();
            }
            this.changed.dispatch();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.component.toJSON();
        }
    }, {
        key: 'setSpecification',
        value: function setSpecification(spec) {
            this.setComponent(makeComponent(this, spec));
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.unsetComponent();
            this.componentValue = undefined;
            _get(LayoutComponentContainer.prototype.__proto__ || _Object$getPrototypeOf(LayoutComponentContainer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'split',
        value: function split(side) {
            var newComponentSpec = {
                type: 'viewer'
            };
            var parent = this.parent;

            if (parent !== undefined) {
                if (side === 'left' && parent.direction === 'row' || side === 'top' && parent.direction === 'column') {
                    return { newContainer: parent.insertChild(newComponentSpec, this), existingContainer: this };
                } else if (side === 'right' && parent.direction === 'row' || side === 'bottom' && parent.direction === 'column') {
                    return { newContainer: parent.insertChild(newComponentSpec), existingContainer: this };
                }
            }
            var existingComponentSpec = void 0;
            var existingComponent = this.component;
            if (existingComponent instanceof SingletonLayerGroupViewer) {
                existingComponentSpec = existingComponent.layerGroupViewer.toJSON();
            } else {
                existingComponentSpec = existingComponent.toJSON();
            }
            var spec = void 0;
            var newIndex = void 0;
            var direction = side === 'left' || side === 'right' ? 'row' : 'column';
            switch (side) {
                case 'left':
                case 'top':
                    spec = { type: direction, children: [newComponentSpec, existingComponentSpec] };
                    newIndex = 0;
                    break;
                case 'right':
                case 'bottom':
                    spec = { type: direction, children: [existingComponentSpec, newComponentSpec] };
                    newIndex = 1;
                    break;
            }
            this.setSpecification(spec);
            var stackComponent = this.component;
            return {
                newContainer: stackComponent.get(newIndex),
                existingContainer: stackComponent.get(1 - newIndex)
            };
        }
    }, {
        key: 'component',
        get: function get() {
            return this.componentValue;
        }
    }], [{
        key: 'getFromElement',
        value: function getFromElement(element) {
            return element[layoutComponentContainerSymbol];
        }
    }]);

    return LayoutComponentContainer;
}(RefCounted);
function getCommonViewerState(viewer) {
    return {
        mouseState: viewer.mouseState,
        showAxisLines: viewer.showAxisLines,
        showScaleBar: viewer.showScaleBar,
        scaleBarOptions: viewer.scaleBarOptions,
        showPerspectiveSliceViews: viewer.showPerspectiveSliceViews,
        inputEventBindings: viewer.inputEventBindings,
        visibility: viewer.visibility,
        selectedLayer: viewer.selectedLayer,
        visibleLayerRoles: viewer.visibleLayerRoles,
        navigationState: viewer.navigationState.addRef(),
        perspectiveNavigationState: viewer.perspectiveNavigationState.addRef(),
        crossSectionBackgroundColor: viewer.crossSectionBackgroundColor,
        perspectiveViewBackgroundColor: viewer.perspectiveViewBackgroundColor
    };
}
export var SingletonLayerGroupViewer = function (_RefCounted2) {
    _inherits(SingletonLayerGroupViewer, _RefCounted2);

    function SingletonLayerGroupViewer(element, layout, viewer) {
        _classCallCheck(this, SingletonLayerGroupViewer);

        var _this3 = _possibleConstructorReturn(this, (SingletonLayerGroupViewer.__proto__ || _Object$getPrototypeOf(SingletonLayerGroupViewer)).call(this));

        _this3.element = element;
        _this3.layerGroupViewer = _this3.registerDisposer(new LayerGroupViewer(element, _Object$assign({ display: viewer.display, layerSpecification: viewer.layerSpecification.addRef() }, getCommonViewerState(viewer)), { showLayerPanel: viewer.uiControlVisibility.showLayerPanel, showViewerMenu: false }));
        _this3.layerGroupViewer.layout.restoreState(layout);
        return _this3;
    }

    _createClass(SingletonLayerGroupViewer, [{
        key: 'toJSON',
        value: function toJSON() {
            return this.layerGroupViewer.layout.specification.toJSON();
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.layerGroupViewer.layout.changed;
        }
    }]);

    return SingletonLayerGroupViewer;
}(RefCounted);
function setupDropZone(dropZone, manager, makeLayerGroupViewer) {
    var enterDisposer = registerEventListener(dropZone, 'dragenter', function (event) {
        if (getLayerDragInfo(event) === undefined) {
            return;
        }
        dropZone.classList.add('neuroglancer-drag-over');
    });
    var leaveDisposer = registerEventListener(dropZone, 'dragleave', function () {
        dropZone.classList.remove('neuroglancer-drag-over');
    });
    var overDisposer = registerEventListener(dropZone, 'dragover', function (event) {
        if (hasViewerDrag(event)) {
            setDropEffect(event, getViewerDropEffect(event, manager));
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        if (getLayerDragInfo(event) !== undefined) {
            updateLayerDropEffect(event, manager, /*newTarget=*/true);
            event.stopPropagation();
            event.preventDefault();
            return;
        }
    });
    var dropDisposer = registerEventListener(dropZone, 'drop', function (event) {
        dropZone.classList.remove('neuroglancer-drag-over');
        if (hasViewerDrag(event)) {
            event.stopPropagation();
            var dropState = void 0;
            try {
                dropState = JSON.parse(event.dataTransfer.getData(viewerDragType));
            } catch (e) {
                return;
            }
            var dropLayers = getDropLayers(event, manager, /*forceCopy=*/false, /*allowMove=*/false,
            /*newTarget=*/true);
            if (dropLayers !== undefined && dropLayers.finalize(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = getDropEffect();
                endLayerDrag(event);
                var layerGroupViewer = makeLayerGroupViewer();
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = _getIterator(dropLayers.layers.keys()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var newLayer = _step4.value;

                        layerGroupViewer.layerSpecification.add(newLayer);
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

                try {
                    layerGroupViewer.restoreState(dropState);
                } catch (_a) {}
            }
        } else {
            var _dropLayers = getDropLayers(event, manager, /*forceCopy=*/getDropEffect() === 'copy',
            /*allowMove=*/false,
            /*newTarget=*/true);
            if (_dropLayers !== undefined && _dropLayers.finalize(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = getDropEffect();
                endLayerDrag(event);
                var _layerGroupViewer = makeLayerGroupViewer();
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = _getIterator(_dropLayers.layers.keys()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var _newLayer = _step5.value;

                        _layerGroupViewer.layerSpecification.add(_newLayer);
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

                try {
                    _layerGroupViewer.layout.restoreState(_dropLayers.layoutSpec);
                } catch (_b) {
                    _layerGroupViewer.layout.reset();
                    // Ignore error restoring layout.
                }
                return;
            }
        }
    });
    return function () {
        dropDisposer();
        overDisposer();
        leaveDisposer();
        enterDisposer();
    };
}
export var StackLayoutComponent = function (_RefCounted3) {
    _inherits(StackLayoutComponent, _RefCounted3);

    function StackLayoutComponent(element, direction, children, container) {
        _classCallCheck(this, StackLayoutComponent);

        var _this4 = _possibleConstructorReturn(this, (StackLayoutComponent.__proto__ || _Object$getPrototypeOf(StackLayoutComponent)).call(this));

        _this4.element = element;
        _this4.direction = direction;
        _this4.container = container;
        _this4.changed = new NullarySignal();
        element.classList.add('neuroglancer-stack-layout');
        element.classList.add('neuroglancer-stack-layout-' + direction);
        element.style.display = 'flex';
        element.style.flexDirection = direction;
        element.appendChild(_this4.makeDropPlaceholder(_this4));
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
            for (var _iterator6 = _getIterator(children), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var childSpec = _step6.value;

                _this4.insertChild(childSpec);
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

        return _this4;
    }

    _createClass(StackLayoutComponent, [{
        key: 'makeDropPlaceholder',
        value: function makeDropPlaceholder(refCounted) {
            var _this5 = this;

            var dropZone = document.createElement('div');
            dropZone.className = 'neuroglancer-stack-layout-drop-placeholder';
            refCounted.registerDisposer(setupDropZone(dropZone, this.viewer.layerSpecification, function () {
                var nextElement = dropZone.nextElementSibling;
                var nextChild = void 0;
                if (nextElement !== null) {
                    nextChild = LayoutComponentContainer.getFromElement(nextElement);
                }
                var newChild = _this5.insertChild({ type: 'viewer', layers: [] }, nextChild);
                return newChild.component;
            }));
            refCounted.registerDisposer(function () {
                removeFromParent(dropZone);
            });
            return dropZone;
        }
    }, {
        key: 'get',
        value: function get(index) {
            return LayoutComponentContainer.getFromElement(this.element.children[index * 2 + 1]);
        }
    }, {
        key: 'insertChild',
        value: function insertChild(spec, before) {
            var _this6 = this;

            var child = new LayoutComponentContainer(this.viewer, spec, this);
            var dropZone = this.makeDropPlaceholder(child);
            child.element.classList.add('neuroglancer-stack-layout-child');
            child.registerDisposer(child.changed.add(this.changed.dispatch));
            child.registerDisposer(function () {
                _this6.element.removeChild(child.element);
                _this6.changed.dispatch();
            });
            var beforeElement = before !== undefined ? before.element : null;
            this.element.insertBefore(child.element, beforeElement);
            this.element.insertBefore(dropZone, beforeElement);
            this.changed.dispatch();
            return child;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.clear();
            _get(StackLayoutComponent.prototype.__proto__ || _Object$getPrototypeOf(StackLayoutComponent.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'clear',
        value: function clear() {
            while (this.length !== 0) {
                this.get(0).dispose();
            }
        }
    }, {
        key: _Symbol$iterator,
        value: /*#__PURE__*/_regeneratorRuntime.mark(function value() {
            var length, i;
            return _regeneratorRuntime.wrap(function value$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            length = this.length;
                            i = 0;

                        case 2:
                            if (!(i < length)) {
                                _context.next = 8;
                                break;
                            }

                            _context.next = 5;
                            return this.get(i);

                        case 5:
                            ++i;
                            _context.next = 2;
                            break;

                        case 8:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, value, this);
        })
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return {
                type: this.direction,
                children: _Array$from(this).map(function (x) {
                    return x.toJSON();
                })
            };
        }
    }, {
        key: 'length',
        get: function get() {
            return (this.element.childElementCount - 1) / 2;
        }
    }, {
        key: 'viewer',
        get: function get() {
            return this.container.viewer;
        }
    }]);

    return StackLayoutComponent;
}(RefCounted);
function makeComponent(container, spec) {
    var element = document.createElement('div');
    element.style.flex = '1';
    element.style.width = '0px';
    if (typeof spec === 'string') {
        if (container.parent !== undefined) {
            throw new Error('Invalid layout component specification: ' + _JSON$stringify(spec));
        }
        return new SingletonLayerGroupViewer(element, spec, container.viewer);
    }
    verifyObject(spec);
    var componentType = verifyObjectProperty(spec, 'type', verifyString);
    switch (componentType) {
        case 'row':
        case 'column':
            {
                return new StackLayoutComponent(element, componentType, verifyObjectProperty(spec, 'children', function (x) {
                    var children = parseArray(x, function (y) {
                        return y;
                    });
                    if (container.parent === undefined && children.length === 0) {
                        throw new Error('Stack layout requires at least one child.');
                    }
                    return children;
                }), container);
            }
        case 'viewer':
            {
                var viewer = container.viewer;
                var layerSpecification = new LayerSubsetSpecification(viewer.layerSpecification.addRef());
                var layerGroupViewer = new LayerGroupViewer(element, _Object$assign({ display: viewer.display, layerSpecification: layerSpecification }, getCommonViewerState(viewer)), { showLayerPanel: viewer.uiControlVisibility.showLayerPanel, showViewerMenu: true });
                try {
                    layerGroupViewer.restoreState(spec);
                } catch (e) {
                    layerGroupViewer.dispose();
                    throw e;
                }
                return layerGroupViewer;
            }
        default:
            {
                // Treat it as a singleton layer group.
                return new SingletonLayerGroupViewer(element, spec, container.viewer);
            }
    }
}
export var RootLayoutContainer = function (_RefCounted4) {
    _inherits(RootLayoutContainer, _RefCounted4);

    function RootLayoutContainer(viewer, defaultSpecification) {
        _classCallCheck(this, RootLayoutContainer);

        var _this7 = _possibleConstructorReturn(this, (RootLayoutContainer.__proto__ || _Object$getPrototypeOf(RootLayoutContainer)).call(this));

        _this7.viewer = viewer;
        _this7.defaultSpecification = defaultSpecification;
        _this7.container = _this7.registerDisposer(new LayoutComponentContainer(_this7.viewer, _this7.defaultSpecification, undefined));
        return _this7;
    }

    _createClass(RootLayoutContainer, [{
        key: 'reset',
        value: function reset() {
            this.container.setSpecification(this.defaultSpecification);
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            this.container.setSpecification(obj);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            _get(RootLayoutContainer.prototype.__proto__ || _Object$getPrototypeOf(RootLayoutContainer.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.container.toJSON();
        }
    }, {
        key: 'changed',
        get: function get() {
            return this.container.changed;
        }
    }, {
        key: 'element',
        get: function get() {
            return this.container.element;
        }
    }]);

    return RootLayoutContainer;
}(RefCounted);
//# sourceMappingURL=layer_groups_layout.js.map