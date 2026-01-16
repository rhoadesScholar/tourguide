import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _get from 'babel-runtime/helpers/get';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';

import debounce from 'lodash/debounce'; /**
                                         * @license
                                         * Copyright 2018 Google Inc.
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
 * @file User interface for display and editing annotations.
 */

import { AnnotationType, getAnnotationTypeHandler } from '../annotation';
import { AnnotationLayer, PerspectiveViewAnnotationLayer, SliceViewAnnotationLayer } from '../annotation/frontend';
import { DataFetchSliceViewRenderLayer, MultiscaleAnnotationSource } from '../annotation/frontend_source';
import { setAnnotationHoverStateFromMouseState } from '../annotation/selection';
import { trackableAlphaValue } from '../trackable_alpha';
import { registerNested, WatchableRefCounted } from '../trackable_value';
import { registerTool, Tool } from './tool';
import { TrackableRGB } from '../util/color';
import { RefCounted } from '../util/disposable';
import { removeChildren, removeFromParent } from '../util/dom';
import { mat3, mat3FromMat4, transformVectorByMat4, vec3 } from '../util/geom';
import { verifyObject, verifyObjectProperty, verifyOptionalInt, verifyOptionalString, verifyString } from '../util/json';
import { NullarySignal } from '../util/signal';
import { formatBoundingBoxVolume, formatIntegerBounds, formatIntegerPoint, formatLength } from '../util/spatial_units';
import { Uint64 } from '../util/uint64';
import { WatchableVisibilityPriority } from '../visibility_priority/frontend';
import { makeCloseButton } from '../widget/close_button';
import { ColorWidget } from '../widget/color';
import { RangeWidget } from '../widget/range';
import { StackView, Tab } from '../widget/tab_view';
import { makeTextIconButton } from '../widget/text_icon_button';
import { Uint64EntryWidget } from '../widget/uint64_entry_widget';
export var AnnotationSegmentListWidget = function (_RefCounted) {
    _inherits(AnnotationSegmentListWidget, _RefCounted);

    function AnnotationSegmentListWidget(reference, annotationLayer) {
        _classCallCheck(this, AnnotationSegmentListWidget);

        var _this = _possibleConstructorReturn(this, (AnnotationSegmentListWidget.__proto__ || _Object$getPrototypeOf(AnnotationSegmentListWidget)).call(this));

        _this.reference = reference;
        _this.annotationLayer = annotationLayer;
        _this.element = document.createElement('div');
        _this.addSegmentWidget = _this.registerDisposer(new Uint64EntryWidget());
        _this.debouncedUpdateView = debounce(function () {
            return _this.updateView();
        }, 0);
        _this.element.className = 'neuroglancer-annotation-segment-list';
        var addSegmentWidget = _this.addSegmentWidget;

        addSegmentWidget.element.style.display = 'inline-block';
        addSegmentWidget.element.title = 'Associate segments';
        _this.element.appendChild(addSegmentWidget.element);
        _this.registerDisposer(annotationLayer.segmentationState.changed.add(_this.debouncedUpdateView));
        _this.registerDisposer(function () {
            return _this.unregisterSegmentationState();
        });
        _this.registerDisposer(_this.addSegmentWidget.valuesEntered.add(function (values) {
            var annotation = _this.reference.value;
            if (annotation == null) {
                return;
            }
            var existingSegments = annotation.segments;
            var segments = [].concat(_toConsumableArray(existingSegments || []), _toConsumableArray(values));
            var newAnnotation = _Object$assign({}, annotation, { segments: segments });
            _this.annotationLayer.source.update(_this.reference, newAnnotation);
            _this.annotationLayer.source.commit(_this.reference);
        }));
        _this.registerDisposer(reference.changed.add(_this.debouncedUpdateView));
        _this.updateView();
        return _this;
    }

    _createClass(AnnotationSegmentListWidget, [{
        key: 'unregisterSegmentationState',
        value: function unregisterSegmentationState() {
            var segmentationState = this.segmentationState;

            if (segmentationState != null) {
                segmentationState.visibleSegments.changed.remove(this.debouncedUpdateView);
                segmentationState.segmentColorHash.changed.remove(this.debouncedUpdateView);
                segmentationState.segmentSelectionState.changed.remove(this.debouncedUpdateView);
                this.segmentationState = undefined;
            }
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            var _this2 = this;

            var segmentationState = this.annotationLayer.segmentationState.value;
            if (segmentationState !== this.segmentationState) {
                this.unregisterSegmentationState();
                this.segmentationState = segmentationState;
                if (segmentationState != null) {
                    segmentationState.visibleSegments.changed.add(this.debouncedUpdateView);
                    segmentationState.segmentColorHash.changed.add(this.debouncedUpdateView);
                    segmentationState.segmentSelectionState.changed.add(this.debouncedUpdateView);
                }
            }
            var element = this.element;
            // Remove existing segment representations.

            for (var child = this.addSegmentWidget.element.nextElementSibling; child !== null;) {
                var next = child.nextElementSibling;
                element.removeChild(child);
                child = next;
            }
            element.style.display = 'none';
            var annotation = this.reference.value;
            if (annotation == null) {
                return;
            }
            var segments = annotation.segments;
            if (segmentationState === null) {
                return;
            }
            element.style.display = '';
            if (segments === undefined || segments.length === 0) {
                return;
            }
            var segmentColorHash = segmentationState ? segmentationState.segmentColorHash : undefined;
            segments.forEach(function (segment, index) {
                if (index !== 0) {
                    element.appendChild(document.createTextNode(' '));
                }
                var child = document.createElement('span');
                child.title = 'Double click to toggle segment visibility, control+click to disassociate segment from annotation.';
                child.className = 'neuroglancer-annotation-segment-item';
                child.textContent = segment.toString();
                if (segmentationState !== undefined) {
                    child.style.backgroundColor = segmentColorHash.computeCssColor(segment);
                    child.addEventListener('mouseenter', function () {
                        segmentationState.segmentSelectionState.set(segment);
                    });
                    child.addEventListener('mouseleave', function () {
                        segmentationState.segmentSelectionState.set(null);
                    });
                    child.addEventListener('dblclick', function (event) {
                        if (event.ctrlKey) {
                            return;
                        }
                        if (segmentationState.visibleSegments.has(segment)) {
                            segmentationState.visibleSegments.delete(segment);
                        } else {
                            segmentationState.visibleSegments.add(segment);
                        }
                    });
                }
                child.addEventListener('click', function (event) {
                    if (!event.ctrlKey) {
                        return;
                    }
                    var existingSegments = annotation.segments || [];
                    var newSegments = existingSegments.filter(function (x) {
                        return !Uint64.equal(segment, x);
                    });
                    var newAnnotation = _Object$assign({}, annotation, { segments: newSegments ? newSegments : undefined });
                    _this2.annotationLayer.source.update(_this2.reference, newAnnotation);
                    _this2.annotationLayer.source.commit(_this2.reference);
                });
                element.appendChild(child);
            });
        }
    }]);

    return AnnotationSegmentListWidget;
}(RefCounted);
export var SelectedAnnotationState = function (_RefCounted2) {
    _inherits(SelectedAnnotationState, _RefCounted2);

    function SelectedAnnotationState(annotationLayerState) {
        _classCallCheck(this, SelectedAnnotationState);

        var _this3 = _possibleConstructorReturn(this, (SelectedAnnotationState.__proto__ || _Object$getPrototypeOf(SelectedAnnotationState)).call(this));

        _this3.annotationLayerState = annotationLayerState;
        _this3.changed = new NullarySignal();
        _this3.referenceChanged = function () {
            _this3.validate();
            _this3.changed.dispatch();
        };
        _this3.validate = function () {
            var updatedLayer = _this3.updateAnnotationLayer();
            var annotationLayer = _this3.annotationLayer;

            if (annotationLayer !== undefined) {
                var value = _this3.value_;
                if (value !== undefined) {
                    var reference = _this3.reference_;
                    if (reference !== undefined && reference.id !== value.id) {
                        // Id changed.
                        value.id = reference.id;
                    } else if (reference === undefined) {
                        reference = _this3.reference_ = annotationLayer.source.getReference(value.id);
                        reference.changed.add(_this3.referenceChanged);
                    }
                    if (reference.value === null) {
                        _this3.unbindReference();
                        _this3.value = undefined;
                        return;
                    }
                } else {
                    _this3.unbindReference();
                }
            }
            if (updatedLayer) {
                _this3.changed.dispatch();
            }
        };
        _this3.registerDisposer(annotationLayerState);
        _this3.registerDisposer(annotationLayerState.changed.add(_this3.validate));
        _this3.updateAnnotationLayer();
        _this3.reference_ = undefined;
        _this3.value_ = undefined;
        return _this3;
    }

    _createClass(SelectedAnnotationState, [{
        key: 'updateAnnotationLayer',
        value: function updateAnnotationLayer() {
            var annotationLayer = this.annotationLayerState.value;
            if (annotationLayer === this.annotationLayer) {
                return false;
            }
            this.unbindLayer();
            this.annotationLayer = annotationLayer;
            if (annotationLayer !== undefined) {
                annotationLayer.source.changed.add(this.validate);
            }
            return true;
        }
    }, {
        key: 'unbindLayer',
        value: function unbindLayer() {
            if (this.annotationLayer !== undefined) {
                this.annotationLayer.source.changed.remove(this.validate);
                this.annotationLayer = undefined;
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.unbindLayer();
            this.unbindReference();
            _get(SelectedAnnotationState.prototype.__proto__ || _Object$getPrototypeOf(SelectedAnnotationState.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'unbindReference',
        value: function unbindReference() {
            var reference = this.reference_;
            if (reference !== undefined) {
                reference.changed.remove(this.referenceChanged);
                this.reference_ = undefined;
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var value = this.value_;
            if (value === undefined) {
                return undefined;
            }
            if (value.partIndex === 0) {
                return value.id;
            }
            return value;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = undefined;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            if (x === undefined) {
                this.value = undefined;
                return;
            }
            if (typeof x === 'string') {
                this.value = { 'id': x, 'partIndex': 0 };
                return;
            }
            verifyObject(x);
            this.value = {
                'id': verifyObjectProperty(x, 'id', verifyString),
                'partIndex': verifyObjectProperty(x, 'partIndex', verifyOptionalInt)
            };
        }
    }, {
        key: 'reference',
        get: function get() {
            return this.reference_;
        }
    }, {
        key: 'value',
        get: function get() {
            return this.value_;
        },
        set: function set(value) {
            this.value_ = value;
            var reference = this.reference_;
            if (reference !== undefined) {
                if (value === undefined || reference.id !== value.id) {
                    this.unbindReference();
                }
            }
            this.validate();
            this.changed.dispatch();
        }
    }, {
        key: 'validValue',
        get: function get() {
            return this.annotationLayer && this.value_;
        }
    }]);

    return SelectedAnnotationState;
}(RefCounted);
var tempVec3 = vec3.create();
function makePointLink(point, transform, voxelSize, setSpatialCoordinates) {
    var spatialPoint = vec3.transformMat4(vec3.create(), point, transform);
    var positionText = formatIntegerPoint(voxelSize.voxelFromSpatial(tempVec3, spatialPoint));
    if (setSpatialCoordinates !== undefined) {
        var element = document.createElement('span');
        element.className = 'neuroglancer-voxel-coordinates-link';
        element.textContent = positionText;
        element.title = 'Center view on voxel coordinates ' + positionText + '.';
        element.addEventListener('click', function () {
            setSpatialCoordinates(spatialPoint);
        });
        return element;
    } else {
        return document.createTextNode(positionText);
    }
}
export function getPositionSummary(element, annotation, transform, voxelSize, setSpatialCoordinates) {
    var makePointLinkWithTransform = function makePointLinkWithTransform(point) {
        return makePointLink(point, transform, voxelSize, setSpatialCoordinates);
    };
    switch (annotation.type) {
        case AnnotationType.AXIS_ALIGNED_BOUNDING_BOX:
        case AnnotationType.LINE:
            element.appendChild(makePointLinkWithTransform(annotation.pointA));
            element.appendChild(document.createTextNode('–'));
            element.appendChild(makePointLinkWithTransform(annotation.pointB));
            break;
        case AnnotationType.POINT:
            element.appendChild(makePointLinkWithTransform(annotation.point));
            break;
        case AnnotationType.ELLIPSOID:
            element.appendChild(makePointLinkWithTransform(annotation.center));
            var transformedRadii = transformVectorByMat4(tempVec3, annotation.radii, transform);
            voxelSize.voxelFromSpatial(transformedRadii, transformedRadii);
            element.appendChild(document.createTextNode('±' + formatIntegerBounds(transformedRadii)));
            break;
    }
}
function getCenterPosition(annotation, transform) {
    var center = vec3.create();
    switch (annotation.type) {
        case AnnotationType.AXIS_ALIGNED_BOUNDING_BOX:
        case AnnotationType.LINE:
            vec3.add(center, annotation.pointA, annotation.pointB);
            vec3.scale(center, center, 0.5);
            break;
        case AnnotationType.POINT:
            vec3.copy(center, annotation.point);
            break;
        case AnnotationType.ELLIPSOID:
            vec3.copy(center, annotation.center);
            break;
    }
    return vec3.transformMat4(center, center, transform);
}
export var AnnotationLayerView = function (_Tab) {
    _inherits(AnnotationLayerView, _Tab);

    function AnnotationLayerView(layer, state, annotationLayer, voxelSize, setSpatialCoordinates) {
        _classCallCheck(this, AnnotationLayerView);

        var _this4 = _possibleConstructorReturn(this, (AnnotationLayerView.__proto__ || _Object$getPrototypeOf(AnnotationLayerView)).call(this));

        _this4.layer = layer;
        _this4.state = state;
        _this4.annotationLayer = annotationLayer;
        _this4.voxelSize = voxelSize;
        _this4.setSpatialCoordinates = setSpatialCoordinates;
        _this4.annotationListContainer = document.createElement('ul');
        _this4.annotationListElements = new _Map();
        _this4.updated = false;
        _this4.element.classList.add('neuroglancer-annotation-layer-view');
        _this4.annotationListContainer.classList.add('neuroglancer-annotation-list');
        _this4.registerDisposer(state);
        _this4.registerDisposer(voxelSize);
        _this4.registerDisposer(annotationLayer);
        var source = annotationLayer.source;

        var updateView = function updateView() {
            _this4.updated = false;
            _this4.updateView();
        };
        _this4.registerDisposer(source.childAdded.add(function (annotation) {
            return _this4.addAnnotationElement(annotation);
        }));
        _this4.registerDisposer(source.childUpdated.add(function (annotation) {
            return _this4.updateAnnotationElement(annotation);
        }));
        _this4.registerDisposer(source.childDeleted.add(function (annotationId) {
            return _this4.deleteAnnotationElement(annotationId);
        }));
        _this4.registerDisposer(_this4.visibility.changed.add(function () {
            return _this4.updateView();
        }));
        _this4.registerDisposer(annotationLayer.transform.changed.add(updateView));
        _this4.updateView();
        var toolbox = document.createElement('div');
        toolbox.className = 'neuroglancer-annotation-toolbox';
        layer.initializeAnnotationLayerViewTab(_this4);
        {
            var widget = _this4.registerDisposer(new RangeWidget(_this4.annotationLayer.fillOpacity));
            widget.promptElement.textContent = 'Fill opacity';
            _this4.element.appendChild(widget.element);
        }
        var colorPicker = _this4.registerDisposer(new ColorWidget(_this4.annotationLayer.color));
        colorPicker.element.title = 'Change annotation display color';
        toolbox.appendChild(colorPicker.element);
        if (!annotationLayer.source.readonly) {
            var pointButton = document.createElement('button');
            pointButton.textContent = getAnnotationTypeHandler(AnnotationType.POINT).icon;
            pointButton.title = 'Annotate integer point';
            pointButton.addEventListener('click', function () {
                _this4.layer.tool.value = new PlaceIntPointTool(_this4.layer, {});
            });
            toolbox.appendChild(pointButton);
            var boundingBoxButton = document.createElement('button');
            boundingBoxButton.textContent = getAnnotationTypeHandler(AnnotationType.AXIS_ALIGNED_BOUNDING_BOX).icon;
            boundingBoxButton.title = 'Annotate bounding box';
            boundingBoxButton.addEventListener('click', function () {
                _this4.layer.tool.value = new PlaceBoundingBoxTool(_this4.layer, {});
            });
            toolbox.appendChild(boundingBoxButton);
            var lineButton = document.createElement('button');
            lineButton.textContent = getAnnotationTypeHandler(AnnotationType.LINE).icon;
            lineButton.title = 'Annotate line';
            lineButton.addEventListener('click', function () {
                _this4.layer.tool.value = new PlaceLineTool(_this4.layer, {});
            });
            toolbox.appendChild(lineButton);
            var ellipsoidButton = document.createElement('button');
            ellipsoidButton.textContent = getAnnotationTypeHandler(AnnotationType.ELLIPSOID).icon;
            ellipsoidButton.title = 'Annotate ellipsoid';
            ellipsoidButton.addEventListener('click', function () {
                _this4.layer.tool.value = new PlaceSphereTool(_this4.layer, {});
            });
            toolbox.appendChild(ellipsoidButton);
        }
        _this4.element.appendChild(toolbox);
        _this4.element.appendChild(_this4.annotationListContainer);
        _this4.annotationListContainer.addEventListener('mouseleave', function () {
            _this4.annotationLayer.hoverState.value = undefined;
        });
        _this4.registerDisposer(_this4.annotationLayer.hoverState.changed.add(function () {
            return _this4.updateHoverView();
        }));
        _this4.registerDisposer(_this4.state.changed.add(function () {
            return _this4.updateSelectionView();
        }));
        return _this4;
    }

    _createClass(AnnotationLayerView, [{
        key: 'updateSelectionView',
        value: function updateSelectionView() {
            var selectedValue = this.state.value;
            var newSelectedId = void 0;
            if (selectedValue !== undefined) {
                newSelectedId = selectedValue.id;
            }
            var previousSelectedId = this.previousSelectedId;

            if (newSelectedId === previousSelectedId) {
                return;
            }
            if (previousSelectedId !== undefined) {
                var element = this.annotationListElements.get(previousSelectedId);
                if (element !== undefined) {
                    element.classList.remove('neuroglancer-annotation-selected');
                }
            }
            if (newSelectedId !== undefined) {
                var _element = this.annotationListElements.get(newSelectedId);
                if (_element !== undefined) {
                    _element.classList.add('neuroglancer-annotation-selected');
                    _element.scrollIntoView();
                }
            }
            this.previousSelectedId = newSelectedId;
        }
    }, {
        key: 'updateHoverView',
        value: function updateHoverView() {
            var selectedValue = this.annotationLayer.hoverState.value;
            var newHoverId = void 0;
            if (selectedValue !== undefined) {
                newHoverId = selectedValue.id;
            }
            var previousHoverId = this.previousHoverId;

            if (newHoverId === previousHoverId) {
                return;
            }
            if (previousHoverId !== undefined) {
                var element = this.annotationListElements.get(previousHoverId);
                if (element !== undefined) {
                    element.classList.remove('neuroglancer-annotation-hover');
                }
            }
            if (newHoverId !== undefined) {
                var _element2 = this.annotationListElements.get(newHoverId);
                if (_element2 !== undefined) {
                    _element2.classList.add('neuroglancer-annotation-hover');
                }
            }
            this.previousHoverId = newHoverId;
        }
    }, {
        key: 'addAnnotationElementHelper',
        value: function addAnnotationElementHelper(annotation) {
            var _this5 = this;

            var annotationLayer = this.annotationLayer,
                annotationListContainer = this.annotationListContainer,
                annotationListElements = this.annotationListElements;
            var objectToGlobal = annotationLayer.objectToGlobal;

            var element = this.makeAnnotationListElement(annotation, objectToGlobal);
            annotationListContainer.appendChild(element);
            annotationListElements.set(annotation.id, element);
            element.addEventListener('mouseenter', function () {
                _this5.annotationLayer.hoverState.value = { id: annotation.id, partIndex: 0 };
            });
            element.addEventListener('click', function () {
                _this5.state.value = { id: annotation.id, partIndex: 0 };
            });
            element.addEventListener('mouseup', function (event) {
                if (event.button === 2) {
                    _this5.setSpatialCoordinates(getCenterPosition(annotation, _this5.annotationLayer.objectToGlobal));
                }
            });
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            if (!this.visible) {
                return;
            }
            if (this.updated) {
                return;
            }
            var annotationLayer = this.annotationLayer,
                annotationListContainer = this.annotationListContainer,
                annotationListElements = this.annotationListElements;
            var source = annotationLayer.source;

            removeChildren(annotationListContainer);
            annotationListElements.clear();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(source), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var annotation = _step.value;

                    this.addAnnotationElementHelper(annotation);
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

            this.resetOnUpdate();
        }
    }, {
        key: 'addAnnotationElement',
        value: function addAnnotationElement(annotation) {
            if (!this.visible) {
                return;
            }
            this.addAnnotationElementHelper(annotation);
            this.resetOnUpdate();
        }
    }, {
        key: 'updateAnnotationElement',
        value: function updateAnnotationElement(annotation) {
            if (!this.visible) {
                return;
            }
            var element = this.annotationListElements.get(annotation.id);
            if (!element) {
                return;
            }
            if (element.lastElementChild && element.children.length === 3) {
                if (!annotation.description) {
                    element.removeChild(element.lastElementChild);
                } else {
                    element.lastElementChild.innerHTML = annotation.description;
                }
            } else {
                var description = document.createElement('div');
                description.className = 'neuroglancer-annotation-description';
                description.textContent = annotation.description || '';
                element.appendChild(description);
            }
            this.resetOnUpdate();
        }
    }, {
        key: 'deleteAnnotationElement',
        value: function deleteAnnotationElement(annotationId) {
            if (!this.visible) {
                return;
            }
            var element = this.annotationListElements.get(annotationId);
            if (element) {
                removeFromParent(element);
                this.annotationListElements.delete(annotationId);
            }
            this.resetOnUpdate();
        }
    }, {
        key: 'resetOnUpdate',
        value: function resetOnUpdate() {
            this.previousSelectedId = undefined;
            this.previousHoverId = undefined;
            this.updated = true;
            this.updateHoverView();
            this.updateSelectionView();
        }
    }, {
        key: 'makeAnnotationListElement',
        value: function makeAnnotationListElement(annotation, transform) {
            var element = document.createElement('li');
            element.title = 'Click to select, right click to recenter view.';
            var icon = document.createElement('div');
            icon.className = 'neuroglancer-annotation-icon';
            icon.textContent = getAnnotationTypeHandler(annotation.type).icon;
            element.appendChild(icon);
            var position = document.createElement('div');
            position.className = 'neuroglancer-annotation-position';
            getPositionSummary(position, annotation, transform, this.voxelSize, this.setSpatialCoordinates);
            element.appendChild(position);
            if (annotation.description) {
                var description = document.createElement('div');
                description.className = 'neuroglancer-annotation-description';
                description.textContent = annotation.description;
                element.appendChild(description);
            }
            return element;
        }
    }]);

    return AnnotationLayerView;
}(Tab);
export var AnnotationDetailsTab = function (_Tab2) {
    _inherits(AnnotationDetailsTab, _Tab2);

    function AnnotationDetailsTab(state, voxelSize, setSpatialCoordinates) {
        _classCallCheck(this, AnnotationDetailsTab);

        var _this6 = _possibleConstructorReturn(this, (AnnotationDetailsTab.__proto__ || _Object$getPrototypeOf(AnnotationDetailsTab)).call(this));

        _this6.state = state;
        _this6.voxelSize = voxelSize;
        _this6.setSpatialCoordinates = setSpatialCoordinates;
        _this6.valid = false;
        _this6.mouseEntered = false;
        _this6.element.classList.add('neuroglancer-annotation-details');
        _this6.registerDisposer(state);
        _this6.registerDisposer(voxelSize);
        _this6.registerDisposer(_this6.state.changed.add(function () {
            _this6.valid = false;
            _this6.updateView();
        }));
        _this6.registerDisposer(_this6.visibility.changed.add(function () {
            return _this6.updateView();
        }));
        _this6.state.changed.add(function () {
            _this6.valid = false;
            _this6.updateView();
        });
        _this6.element.addEventListener('mouseenter', function () {
            _this6.mouseEntered = true;
            if (_this6.hoverState !== undefined) {
                _this6.hoverState.value = _this6.state.value;
            }
        });
        _this6.element.addEventListener('mouseleave', function () {
            _this6.mouseEntered = false;
            if (_this6.hoverState !== undefined) {
                _this6.hoverState.value = undefined;
            }
        });
        _this6.updateView();
        return _this6;
    }

    _createClass(AnnotationDetailsTab, [{
        key: 'updateView',
        value: function updateView() {
            var _this7 = this;

            if (!this.visible) {
                this.element.style.display = 'none';
                this.hoverState = undefined;
                return;
            }
            this.element.style.display = null;
            if (this.valid) {
                return;
            }
            var element = this.element;

            removeChildren(element);
            this.valid = true;
            var reference = this.state.reference;

            if (reference === undefined) {
                return;
            }
            var value = this.state.value;
            var annotation = reference.value;
            if (annotation == null) {
                return;
            }
            var annotationLayer = this.state.annotationLayerState.value;
            this.hoverState = annotationLayer.hoverState;
            if (this.mouseEntered) {
                this.hoverState.value = value;
            }
            var objectToGlobal = annotationLayer.objectToGlobal;
            var voxelSize = this.voxelSize;

            var handler = getAnnotationTypeHandler(annotation.type);
            var title = document.createElement('div');
            title.className = 'neuroglancer-annotation-details-title';
            var icon = document.createElement('div');
            icon.className = 'neuroglancer-annotation-details-icon';
            icon.textContent = handler.icon;
            var titleText = document.createElement('div');
            titleText.className = 'neuroglancer-annotation-details-title-text';
            titleText.textContent = '' + handler.description;
            title.appendChild(icon);
            title.appendChild(titleText);
            if (!annotationLayer.source.readonly) {
                var deleteButton = makeTextIconButton('🗑', 'Delete annotation');
                deleteButton.addEventListener('click', function () {
                    var ref = annotationLayer.source.getReference(value.id);
                    try {
                        annotationLayer.source.delete(ref);
                    } finally {
                        ref.dispose();
                    }
                });
                title.appendChild(deleteButton);
            }
            var closeButton = makeCloseButton();
            closeButton.title = 'Hide annotation details';
            closeButton.addEventListener('click', function () {
                _this7.state.value = undefined;
            });
            title.appendChild(closeButton);
            element.appendChild(title);
            var position = document.createElement('div');
            position.className = 'neuroglancer-annotation-details-position';
            getPositionSummary(position, annotation, objectToGlobal, voxelSize, this.setSpatialCoordinates);
            element.appendChild(position);
            if (annotation.type === AnnotationType.AXIS_ALIGNED_BOUNDING_BOX) {
                var volume = document.createElement('div');
                volume.className = 'neuroglancer-annotation-details-volume';
                volume.textContent = formatBoundingBoxVolume(annotation.pointA, annotation.pointB, objectToGlobal);
                element.appendChild(volume);
                // FIXME: only do this if it is axis aligned
                var spatialOffset = transformVectorByMat4(tempVec3, vec3.subtract(tempVec3, annotation.pointA, annotation.pointB), objectToGlobal);
                var voxelVolume = document.createElement('div');
                voxelVolume.className = 'neuroglancer-annotation-details-volume-in-voxels';
                var voxelOffset = voxelSize.voxelFromSpatial(tempVec3, spatialOffset);
                voxelVolume.textContent = '' + formatIntegerBounds(voxelOffset);
                element.appendChild(voxelVolume);
            } else if (annotation.type === AnnotationType.LINE) {
                var _spatialOffset = transformVectorByMat4(tempVec3, vec3.subtract(tempVec3, annotation.pointA, annotation.pointB), objectToGlobal);
                var length = document.createElement('div');
                length.className = 'neuroglancer-annotation-details-length';
                var spatialLengthText = formatLength(vec3.length(_spatialOffset));
                var voxelLengthText = '';
                if (voxelSize.valid) {
                    var voxelLength = vec3.length(voxelSize.voxelFromSpatial(tempVec3, _spatialOffset));
                    voxelLengthText = ', ' + Math.round(voxelLength) + ' vx';
                }
                length.textContent = spatialLengthText + voxelLengthText;
                element.appendChild(length);
            }
            var segmentListWidget = this.segmentListWidget;

            if (segmentListWidget !== undefined) {
                if (segmentListWidget.reference !== reference) {
                    segmentListWidget.dispose();
                    this.unregisterDisposer(segmentListWidget);
                    segmentListWidget = this.segmentListWidget = undefined;
                }
            }
            if (segmentListWidget === undefined) {
                this.segmentListWidget = segmentListWidget = this.registerDisposer(new AnnotationSegmentListWidget(reference, annotationLayer));
            }
            element.appendChild(segmentListWidget.element);
            var description = document.createElement('textarea');
            description.value = annotation.description || '';
            description.rows = 3;
            description.className = 'neuroglancer-annotation-details-description';
            description.placeholder = 'Description';
            if (annotationLayer.source.readonly) {
                description.readOnly = true;
            } else {
                description.addEventListener('change', function () {
                    var x = description.value;
                    annotationLayer.source.update(reference, _Object$assign({}, annotation, { description: x ? x : undefined }));
                    annotationLayer.source.commit(reference);
                });
            }
            element.appendChild(description);
        }
    }]);

    return AnnotationDetailsTab;
}(Tab);
export var AnnotationTab = function (_Tab3) {
    _inherits(AnnotationTab, _Tab3);

    function AnnotationTab(layer, state, voxelSize, setSpatialCoordinates) {
        _classCallCheck(this, AnnotationTab);

        var _this8 = _possibleConstructorReturn(this, (AnnotationTab.__proto__ || _Object$getPrototypeOf(AnnotationTab)).call(this));

        _this8.layer = layer;
        _this8.state = state;
        _this8.voxelSize = voxelSize;
        _this8.setSpatialCoordinates = setSpatialCoordinates;
        _this8.stack = _this8.registerDisposer(new StackView(function (annotationLayerState) {
            return new AnnotationLayerView(_this8.layer, _this8.state.addRef(), annotationLayerState.addRef(), _this8.voxelSize.addRef(), _this8.setSpatialCoordinates);
        }, _this8.visibility));
        _this8.detailsTab = _this8.registerDisposer(new AnnotationDetailsTab(_this8.state, _this8.voxelSize.addRef(), _this8.setSpatialCoordinates));
        _this8.registerDisposer(state);
        _this8.registerDisposer(voxelSize);
        var element = _this8.element;

        element.classList.add('neuroglancer-annotations-tab');
        _this8.stack.element.classList.add('neuroglancer-annotations-stack');
        element.appendChild(_this8.stack.element);
        element.appendChild(_this8.detailsTab.element);
        var updateDetailsVisibility = function updateDetailsVisibility() {
            _this8.detailsTab.visibility.value = _this8.state.validValue !== undefined && _this8.visible ? WatchableVisibilityPriority.VISIBLE : WatchableVisibilityPriority.IGNORED;
        };
        _this8.registerDisposer(_this8.state.changed.add(updateDetailsVisibility));
        _this8.registerDisposer(_this8.visibility.changed.add(updateDetailsVisibility));
        var setAnnotationLayerView = function setAnnotationLayerView() {
            _this8.stack.selected = _this8.state.annotationLayerState.value;
        };
        _this8.registerDisposer(_this8.state.annotationLayerState.changed.add(setAnnotationLayerView));
        setAnnotationLayerView();
        return _this8;
    }

    return AnnotationTab;
}(Tab);
function getSelectedAssocatedSegment(annotationLayer) {
    var segments = void 0;
    var segmentationState = annotationLayer.segmentationState.value;
    if (segmentationState != null) {
        if (segmentationState.segmentSelectionState.hasSelectedSegment) {
            segments = [segmentationState.segmentSelectionState.selectedSegment.clone()];
        }
    }
    return segments;
}

var PlaceAnnotationTool = function (_Tool) {
    _inherits(PlaceAnnotationTool, _Tool);

    function PlaceAnnotationTool(layer, options) {
        _classCallCheck(this, PlaceAnnotationTool);

        var _this9 = _possibleConstructorReturn(this, (PlaceAnnotationTool.__proto__ || _Object$getPrototypeOf(PlaceAnnotationTool)).call(this));

        _this9.layer = layer;
        if (layer.annotationLayerState === undefined) {
            throw new Error('Invalid layer for annotation tool.');
        }
        _this9.annotationDescription = verifyObjectProperty(options, 'description', verifyOptionalString);
        return _this9;
    }

    _createClass(PlaceAnnotationTool, [{
        key: 'annotationLayer',
        get: function get() {
            return this.layer.annotationLayerState.value;
        }
    }]);

    return PlaceAnnotationTool;
}(Tool);

var ANNOTATE_INT_POINT_TOOL_ID = 'annotateIntPoint';
var ANNOTATE_POINT_TOOL_ID = 'annotatePoint';
var ANNOTATE_LINE_TOOL_ID = 'annotateLine';
var ANNOTATE_BOUNDING_BOX_TOOL_ID = 'annotateBoundingBox';
var ANNOTATE_ELLIPSOID_TOOL_ID = 'annotateSphere';
export var PlacePointTool = function (_PlaceAnnotationTool) {
    _inherits(PlacePointTool, _PlaceAnnotationTool);

    function PlacePointTool(layer, options) {
        _classCallCheck(this, PlacePointTool);

        return _possibleConstructorReturn(this, (PlacePointTool.__proto__ || _Object$getPrototypeOf(PlacePointTool)).call(this, layer, options));
    }

    _createClass(PlacePointTool, [{
        key: 'trigger',
        value: function trigger(mouseState) {
            var annotationLayer = this.annotationLayer;

            if (annotationLayer === undefined) {
                // Not yet ready.
                return;
            }
            if (mouseState.active) {
                var annotation = {
                    id: '',
                    description: '',
                    segments: getSelectedAssocatedSegment(annotationLayer),
                    point: vec3.transformMat4(vec3.create(), mouseState.position, annotationLayer.globalToObject),
                    type: AnnotationType.POINT
                };
                var reference = annotationLayer.source.add(annotation, /*commit=*/true);
                this.layer.selectedAnnotation.value = { id: reference.id };
                reference.dispose();
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return ANNOTATE_POINT_TOOL_ID;
        }
    }, {
        key: 'description',
        get: function get() {
            return 'annotate point';
        }
    }]);

    return PlacePointTool;
}(PlaceAnnotationTool);
export var PlaceIntPointTool = function (_PlaceAnnotationTool2) {
    _inherits(PlaceIntPointTool, _PlaceAnnotationTool2);

    function PlaceIntPointTool(layer, options) {
        _classCallCheck(this, PlaceIntPointTool);

        return _possibleConstructorReturn(this, (PlaceIntPointTool.__proto__ || _Object$getPrototypeOf(PlaceIntPointTool)).call(this, layer, options));
    }

    _createClass(PlaceIntPointTool, [{
        key: 'trigger',
        value: function trigger(mouseState) {
            var annotationLayer = this.annotationLayer;

            if (annotationLayer === undefined) {
                // Not yet ready.
                return;
            }
            if (mouseState.active) {
                var annotation = {
                    id: '',
                    description: '',
                    segments: getSelectedAssocatedSegment(annotationLayer),
                    point: vec3.round(vec3.create(), vec3.transformMat4(vec3.create(), mouseState.position, annotationLayer.globalToObject)),
                    type: AnnotationType.POINT,
                    property: {
                        custom: "1"
                    }
                };
                var reference = annotationLayer.source.add(annotation, /*commit=*/true);
                this.layer.selectedAnnotation.value = { id: reference.id };
                reference.dispose();
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return ANNOTATE_INT_POINT_TOOL_ID;
        }
    }, {
        key: 'description',
        get: function get() {
            return 'annotate integer point';
        }
    }]);

    return PlaceIntPointTool;
}(PlaceAnnotationTool);
function getMousePositionInAnnotationCoordinates(mouseState, annotationLayer) {
    return vec3.transformMat4(vec3.create(), mouseState.position, annotationLayer.globalToObject);
}

var TwoStepAnnotationTool = function (_PlaceAnnotationTool3) {
    _inherits(TwoStepAnnotationTool, _PlaceAnnotationTool3);

    function TwoStepAnnotationTool() {
        _classCallCheck(this, TwoStepAnnotationTool);

        return _possibleConstructorReturn(this, (TwoStepAnnotationTool.__proto__ || _Object$getPrototypeOf(TwoStepAnnotationTool)).apply(this, arguments));
    }

    _createClass(TwoStepAnnotationTool, [{
        key: 'trigger',
        value: function trigger(mouseState) {
            var _this13 = this;

            var annotationLayer = this.annotationLayer;

            if (annotationLayer === undefined) {
                // Not yet ready.
                return;
            }
            if (mouseState.active) {
                var updatePointB = function updatePointB() {
                    var state = _this13.inProgressAnnotation;
                    var reference = state.reference;
                    var newAnnotation = _this13.getUpdatedAnnotation(reference.value, mouseState, annotationLayer);
                    state.annotationLayer.source.update(reference, newAnnotation);
                    _this13.layer.selectedAnnotation.value = { id: reference.id };
                };
                if (this.inProgressAnnotation === undefined) {
                    var reference = annotationLayer.source.add(this.getInitialAnnotation(mouseState, annotationLayer), /*commit=*/false);
                    this.layer.selectedAnnotation.value = { id: reference.id };
                    var mouseDisposer = mouseState.changed.add(updatePointB);
                    var disposer = function disposer() {
                        mouseDisposer();
                        reference.dispose();
                    };
                    this.inProgressAnnotation = {
                        annotationLayer: annotationLayer,
                        reference: reference,
                        disposer: disposer
                    };
                } else {
                    updatePointB();
                    this.inProgressAnnotation.annotationLayer.source.commit(this.inProgressAnnotation.reference);
                    this.inProgressAnnotation.disposer();
                    this.inProgressAnnotation = undefined;
                }
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.deactivate();
            _get(TwoStepAnnotationTool.prototype.__proto__ || _Object$getPrototypeOf(TwoStepAnnotationTool.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'deactivate',
        value: function deactivate() {
            if (this.inProgressAnnotation !== undefined) {
                this.inProgressAnnotation.annotationLayer.source.delete(this.inProgressAnnotation.reference);
                this.inProgressAnnotation.disposer();
                this.inProgressAnnotation = undefined;
            }
        }
    }]);

    return TwoStepAnnotationTool;
}(PlaceAnnotationTool);

var PlaceTwoCornerAnnotationTool = function (_TwoStepAnnotationToo) {
    _inherits(PlaceTwoCornerAnnotationTool, _TwoStepAnnotationToo);

    function PlaceTwoCornerAnnotationTool() {
        _classCallCheck(this, PlaceTwoCornerAnnotationTool);

        return _possibleConstructorReturn(this, (PlaceTwoCornerAnnotationTool.__proto__ || _Object$getPrototypeOf(PlaceTwoCornerAnnotationTool)).apply(this, arguments));
    }

    _createClass(PlaceTwoCornerAnnotationTool, [{
        key: 'getInitialAnnotation',
        value: function getInitialAnnotation(mouseState, annotationLayer) {
            var point = getMousePositionInAnnotationCoordinates(mouseState, annotationLayer);
            return {
                id: '',
                type: this.annotationType,
                description: '',
                pointA: point,
                pointB: point
            };
        }
    }, {
        key: 'getUpdatedAnnotation',
        value: function getUpdatedAnnotation(oldAnnotation, mouseState, annotationLayer) {
            var point = getMousePositionInAnnotationCoordinates(mouseState, annotationLayer);
            return _Object$assign({}, oldAnnotation, { pointB: point });
        }
    }]);

    return PlaceTwoCornerAnnotationTool;
}(TwoStepAnnotationTool);

export var PlaceBoundingBoxTool = function (_PlaceTwoCornerAnnota) {
    _inherits(PlaceBoundingBoxTool, _PlaceTwoCornerAnnota);

    function PlaceBoundingBoxTool() {
        _classCallCheck(this, PlaceBoundingBoxTool);

        return _possibleConstructorReturn(this, (PlaceBoundingBoxTool.__proto__ || _Object$getPrototypeOf(PlaceBoundingBoxTool)).apply(this, arguments));
    }

    _createClass(PlaceBoundingBoxTool, [{
        key: 'toJSON',
        value: function toJSON() {
            return ANNOTATE_BOUNDING_BOX_TOOL_ID;
        }
    }, {
        key: 'description',
        get: function get() {
            return 'annotate bounding box';
        }
    }]);

    return PlaceBoundingBoxTool;
}(PlaceTwoCornerAnnotationTool);
PlaceBoundingBoxTool.prototype.annotationType = AnnotationType.AXIS_ALIGNED_BOUNDING_BOX;
export var PlaceLineTool = function (_PlaceTwoCornerAnnota2) {
    _inherits(PlaceLineTool, _PlaceTwoCornerAnnota2);

    function PlaceLineTool() {
        _classCallCheck(this, PlaceLineTool);

        return _possibleConstructorReturn(this, (PlaceLineTool.__proto__ || _Object$getPrototypeOf(PlaceLineTool)).apply(this, arguments));
    }

    _createClass(PlaceLineTool, [{
        key: 'getInitialAnnotation',
        value: function getInitialAnnotation(mouseState, annotationLayer) {
            var result = _get(PlaceLineTool.prototype.__proto__ || _Object$getPrototypeOf(PlaceLineTool.prototype), 'getInitialAnnotation', this).call(this, mouseState, annotationLayer);
            result.segments = getSelectedAssocatedSegment(annotationLayer);
            return result;
        }
    }, {
        key: 'getUpdatedAnnotation',
        value: function getUpdatedAnnotation(oldAnnotation, mouseState, annotationLayer) {
            var result = _get(PlaceLineTool.prototype.__proto__ || _Object$getPrototypeOf(PlaceLineTool.prototype), 'getUpdatedAnnotation', this).call(this, oldAnnotation, mouseState, annotationLayer);
            var segments = result.segments;
            if (segments !== undefined && segments.length > 0) {
                segments.length = 1;
            }
            var newSegments = getSelectedAssocatedSegment(annotationLayer);
            if (newSegments && segments) {
                newSegments = newSegments.filter(function (x) {
                    return segments.findIndex(function (y) {
                        return Uint64.equal(x, y);
                    }) === -1;
                });
            }
            result.segments = [].concat(_toConsumableArray(segments || []), _toConsumableArray(newSegments || [])) || undefined;
            return result;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return ANNOTATE_LINE_TOOL_ID;
        }
    }, {
        key: 'description',
        get: function get() {
            return 'annotate line';
        }
    }]);

    return PlaceLineTool;
}(PlaceTwoCornerAnnotationTool);
PlaceLineTool.prototype.annotationType = AnnotationType.LINE;

var PlaceSphereTool = function (_TwoStepAnnotationToo2) {
    _inherits(PlaceSphereTool, _TwoStepAnnotationToo2);

    function PlaceSphereTool() {
        _classCallCheck(this, PlaceSphereTool);

        return _possibleConstructorReturn(this, (PlaceSphereTool.__proto__ || _Object$getPrototypeOf(PlaceSphereTool)).apply(this, arguments));
    }

    _createClass(PlaceSphereTool, [{
        key: 'getInitialAnnotation',
        value: function getInitialAnnotation(mouseState, annotationLayer) {
            var point = getMousePositionInAnnotationCoordinates(mouseState, annotationLayer);
            return {
                type: AnnotationType.ELLIPSOID,
                id: '',
                description: '',
                segments: getSelectedAssocatedSegment(annotationLayer),
                center: point,
                radii: vec3.fromValues(0, 0, 0)
            };
        }
    }, {
        key: 'getUpdatedAnnotation',
        value: function getUpdatedAnnotation(oldAnnotation, mouseState, annotationLayer) {
            var spatialCenter = vec3.transformMat4(vec3.create(), oldAnnotation.center, annotationLayer.objectToGlobal);
            var radius = vec3.distance(spatialCenter, mouseState.position);
            var tempMatrix = mat3.create();
            tempMatrix[0] = tempMatrix[4] = tempMatrix[8] = 1 / (radius * radius);
            var objectToGlobalLinearTransform = mat3FromMat4(mat3.create(), annotationLayer.objectToGlobal);
            mat3.multiply(tempMatrix, tempMatrix, objectToGlobalLinearTransform);
            mat3.transpose(objectToGlobalLinearTransform, objectToGlobalLinearTransform);
            mat3.multiply(tempMatrix, objectToGlobalLinearTransform, tempMatrix);
            return _Object$assign({}, oldAnnotation, { radii: vec3.fromValues(1 / Math.sqrt(tempMatrix[0]), 1 / Math.sqrt(tempMatrix[4]), 1 / Math.sqrt(tempMatrix[8])) });
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return ANNOTATE_ELLIPSOID_TOOL_ID;
        }
    }, {
        key: 'description',
        get: function get() {
            return 'annotate ellipsoid';
        }
    }]);

    return PlaceSphereTool;
}(TwoStepAnnotationTool);

registerTool(ANNOTATE_POINT_TOOL_ID, function (layer, options) {
    return new PlacePointTool(layer, options);
});
registerTool(ANNOTATE_INT_POINT_TOOL_ID, function (layer, options) {
    return new PlaceIntPointTool(layer, options);
});
registerTool(ANNOTATE_BOUNDING_BOX_TOOL_ID, function (layer, options) {
    return new PlaceBoundingBoxTool(layer, options);
});
registerTool(ANNOTATE_LINE_TOOL_ID, function (layer, options) {
    return new PlaceLineTool(layer, options);
});
registerTool(ANNOTATE_ELLIPSOID_TOOL_ID, function (layer, options) {
    return new PlaceSphereTool(layer, options);
});
export function getAnnotationRenderOptions(userLayer) {
    return { color: userLayer.annotationColor, fillOpacity: userLayer.annotationFillOpacity };
}
var SELECTED_ANNOTATION_JSON_KEY = 'selectedAnnotation';
var ANNOTATION_COLOR_JSON_KEY = 'annotationColor';
var ANNOTATION_FILL_OPACITY_JSON_KEY = 'annotationFillOpacity';
export function UserLayerWithAnnotationsMixin(Base) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this18 = _possibleConstructorReturn(this, (_ref = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref, [this].concat(args)));

            _this18.annotationLayerState = _this18.registerDisposer(new WatchableRefCounted());
            _this18.selectedAnnotation = _this18.registerDisposer(new SelectedAnnotationState(_this18.annotationLayerState.addRef()));
            _this18.annotationColor = new TrackableRGB(vec3.fromValues(1, 1, 0));
            _this18.annotationFillOpacity = trackableAlphaValue(0.0);
            _this18.selectedAnnotation.changed.add(_this18.specificationChanged.dispatch);
            _this18.annotationColor.changed.add(_this18.specificationChanged.dispatch);
            _this18.annotationFillOpacity.changed.add(_this18.specificationChanged.dispatch);
            _this18.tabs.add('annotations', {
                label: 'Annotations',
                order: 10,
                getter: function getter() {
                    return new AnnotationTab(_this18, _this18.selectedAnnotation.addRef(), _this18.manager.voxelSize.addRef(), function (point) {
                        return _this18.manager.setSpatialCoordinates(point);
                    });
                }
            });
            _this18.annotationLayerState.changed.add(function () {
                var state = _this18.annotationLayerState.value;
                if (state !== undefined) {
                    var annotationLayer = new AnnotationLayer(_this18.manager.chunkManager, state.addRef());
                    setAnnotationHoverStateFromMouseState(state, _this18.manager.layerSelectedValues.mouseState);
                    _this18.addRenderLayer(new SliceViewAnnotationLayer(annotationLayer));
                    _this18.addRenderLayer(new PerspectiveViewAnnotationLayer(annotationLayer.addRef()));
                    if (annotationLayer.source instanceof MultiscaleAnnotationSource) {
                        var dataFetchLayer = _this18.registerDisposer(new DataFetchSliceViewRenderLayer(annotationLayer.source.addRef()));
                        _this18.registerDisposer(registerNested(state.filterBySegmentation, function (context, value) {
                            if (!value) {
                                _this18.addRenderLayer(dataFetchLayer.addRef());
                                context.registerDisposer(function () {
                                    return _this18.removeRenderLayer(dataFetchLayer);
                                });
                            }
                        }));
                    }
                }
            });
            return _this18;
        }

        _createClass(C, [{
            key: 'restoreState',
            value: function restoreState(specification) {
                _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), 'restoreState', this).call(this, specification);
                this.selectedAnnotation.restoreState(specification[SELECTED_ANNOTATION_JSON_KEY]);
                this.annotationColor.restoreState(specification[ANNOTATION_COLOR_JSON_KEY]);
                this.annotationFillOpacity.restoreState(specification[ANNOTATION_FILL_OPACITY_JSON_KEY]);
            }
        }, {
            key: 'toJSON',
            value: function toJSON() {
                var x = _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), 'toJSON', this).call(this);
                x[SELECTED_ANNOTATION_JSON_KEY] = this.selectedAnnotation.toJSON();
                x[ANNOTATION_COLOR_JSON_KEY] = this.annotationColor.toJSON();
                x[ANNOTATION_FILL_OPACITY_JSON_KEY] = this.annotationFillOpacity.toJSON();
                return x;
            }
        }, {
            key: 'initializeAnnotationLayerViewTab',
            value: function initializeAnnotationLayerViewTab(tab) {
                tab;
            }
        }]);

        return C;
    }(Base);

    return C;
}
//# sourceMappingURL=annotations.js.map