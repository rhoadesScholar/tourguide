import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _Map from 'babel-runtime/core-js/map';

import debounce from 'lodash/debounce'; /**
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
 * @file
 * Facility for showing a tooltip based on the mouse selection state.
 */

import { AnnotationType, getAnnotationTypeHandler } from '../annotation';
import { getSelectedAnnotation } from '../annotation/selection';
import { getPositionSummary } from './annotations';
import { RefCounted } from '../util/disposable';
import { removeChildren } from '../util/dom';
import { formatBoundingBoxVolume } from '../util/spatial_units';
import { Tooltip } from '../widget/tooltip';
var annotationTooltipHandlers = new _Map([[AnnotationType.AXIS_ALIGNED_BOUNDING_BOX, function (annotation, element, transform, _voxelSize) {
    var volume = document.createElement('div');
    volume.className = 'neuroglancer-annotation-details-volume';
    volume.textContent = formatBoundingBoxVolume(annotation.pointA, annotation.pointB, transform);
    element.appendChild(volume);
}]]);
var TOOLTIP_DELAY = 500;
export var MouseSelectionStateTooltipManager = function (_RefCounted) {
    _inherits(MouseSelectionStateTooltipManager, _RefCounted);

    function MouseSelectionStateTooltipManager(mouseState, layerManager, voxelSize) {
        _classCallCheck(this, MouseSelectionStateTooltipManager);

        var _this = _possibleConstructorReturn(this, (MouseSelectionStateTooltipManager.__proto__ || _Object$getPrototypeOf(MouseSelectionStateTooltipManager)).call(this));

        _this.mouseState = mouseState;
        _this.layerManager = layerManager;
        _this.voxelSize = voxelSize;
        _this.tooltip = undefined;
        _this.debouncedShowTooltip = _this.registerCancellable(debounce(function () {
            return _this.doCreateTooltip();
        }, TOOLTIP_DELAY));
        _this.debouncedShowTooltip0 = _this.registerCancellable(debounce(function () {
            return _this.doCreateTooltip();
        }, 0));
        _this.doCreateTooltip = function () {
            _this.debouncedShowTooltip.cancel();
            _this.debouncedShowTooltip0.cancel();
            var mouseState = _this.mouseState;

            if (!_this.maybeCreateTooltip()) {
                var tooltip = _this.tooltip;

                if (tooltip !== undefined) {
                    tooltip.dispose();
                    _this.tooltip = undefined;
                }
                _this.setReference(undefined);
                return;
            } else {
                var _tooltip = _this.tooltip;
                _tooltip.updatePosition(mouseState.pageX, mouseState.pageY);
            }
        };
        _this.registerDisposer(mouseState.changed.add(function () {
            return _this.mouseStateChanged();
        }));
        return _this;
    }

    _createClass(MouseSelectionStateTooltipManager, [{
        key: 'setReference',
        value: function setReference(reference) {
            var existing = this.reference;
            if (existing !== undefined) {
                existing.changed.remove(this.debouncedShowTooltip0);
                existing.dispose();
                this.reference = undefined;
            }
            this.reference = reference;
            if (reference !== undefined) {
                reference.changed.add(this.debouncedShowTooltip0);
            }
        }
    }, {
        key: 'maybeCreateTooltip',
        value: function maybeCreateTooltip() {
            var state = getSelectedAnnotation(this.mouseState, this.layerManager);
            if (state === undefined) {
                return false;
            }
            if (!this.voxelSize.valid) {
                return false;
            }
            var tooltip = this.tooltip;

            if (tooltip === undefined) {
                tooltip = this.tooltip = new Tooltip();
                tooltip.element.classList.add('neuroglancer-mouse-selection-tooltip');
            }
            var reference = state.annotationLayer.source.getReference(state.id);
            this.setReference(reference);
            if (reference.value === null) {
                return false;
            }
            removeChildren(tooltip.element);
            var header = document.createElement('div');
            header.className = 'neuroglancer-mouse-selection-tooltip-title';
            header.textContent = '' + state.layer.name;
            var description = document.createElement('div');
            description.className = 'neuroglancer-mouse-selection-tooltip-description';
            var annotation = reference.value;
            if (annotation === undefined) {
                description.textContent = 'Loading...';
            } else {
                description.textContent = annotation.description || '';
            }
            tooltip.element.appendChild(header);
            tooltip.element.appendChild(description);
            if (annotation != null) {
                var segments = annotation.segments;

                if (segments !== undefined && segments.length > 0) {
                    var segmentContainer = document.createElement('div');
                    segmentContainer.className = 'neuroglancer-annotation-segment-list';
                    var segmentationState = state.annotationLayer.segmentationState.value;
                    var segmentColorHash = segmentationState ? segmentationState.segmentColorHash : undefined;
                    segments.forEach(function (segment, index) {
                        if (index !== 0) {
                            segmentContainer.appendChild(document.createTextNode(' '));
                        }
                        var child = document.createElement('span');
                        child.className = 'neuroglancer-annotation-segment-item';
                        child.textContent = segment.toString();
                        if (segmentColorHash !== undefined) {
                            child.style.backgroundColor = segmentColorHash.computeCssColor(segment);
                        }
                        segmentContainer.appendChild(child);
                    });
                    tooltip.element.appendChild(segmentContainer);
                }
                var combinedTransform = state.annotationLayer.objectToGlobal;
                var typeHandler = getAnnotationTypeHandler(annotation.type);
                var positionElement = document.createElement('div');
                positionElement.appendChild(document.createTextNode(typeHandler.icon));
                getPositionSummary(positionElement, annotation, combinedTransform, this.voxelSize);
                positionElement.className = 'neuroglancer-mouse-selection-tooltip-annotation-corners';
                tooltip.element.appendChild(positionElement);
                var handler = annotationTooltipHandlers.get(annotation.type);
                if (handler !== undefined) {
                    handler(annotation, tooltip.element, combinedTransform, this.voxelSize);
                }
            }
            return true;
        }
    }, {
        key: 'mouseStateChanged',
        value: function mouseStateChanged() {
            var tooltip = this.tooltip;

            if (tooltip !== undefined) {
                tooltip.dispose();
                this.tooltip = undefined;
            }
            this.setReference(undefined);
            this.debouncedShowTooltip();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var tooltip = this.tooltip;

            if (tooltip !== undefined) {
                tooltip.dispose();
                this.tooltip = undefined;
            }
            this.setReference(undefined);
            _get(MouseSelectionStateTooltipManager.prototype.__proto__ || _Object$getPrototypeOf(MouseSelectionStateTooltipManager.prototype), 'disposed', this).call(this);
        }
    }]);

    return MouseSelectionStateTooltipManager;
}(RefCounted);
//# sourceMappingURL=mouse_selection_state_tooltip.js.map