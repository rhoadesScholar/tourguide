import _Object$assign from 'babel-runtime/core-js/object/assign';
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
import { AnnotationType, LocalAnnotationSource } from './index';
import { AnnotationLayerState } from './frontend';
import { CoordinateTransform, makeDerivedCoordinateTransform } from '../coordinate_transform';
import { LayerReference, UserLayer } from '../layer';
import { registerLayerType } from '../layer_specification';
import { VoxelSize } from '../navigation_state';
import { SegmentationUserLayer } from '../segmentation_user_layer';
import { StatusMessage } from '../status';
import { ElementVisibilityFromTrackableBoolean, TrackableBoolean, TrackableBooleanCheckbox } from '../trackable_boolean';
import { makeDerivedWatchableValue, WatchableValue } from '../trackable_value';
import { getAnnotationRenderOptions as _getAnnotationRenderOptions, UserLayerWithAnnotationsMixin } from '../ui/annotations';
import { UserLayerWithCoordinateTransformMixin } from '../user_layer_with_coordinate_transform';
import { mat4, vec3 } from '../util/geom';
import { parseArray, verify3dVec } from '../util/json';
import { LayerReferenceWidget } from '../widget/layer_reference';

var POINTS_JSON_KEY = 'points';
var ANNOTATIONS_JSON_KEY = 'annotations';
function addPointAnnotations(annotations, obj) {
    if (obj === undefined) {
        return;
    }
    parseArray(obj, function (x, i) {
        annotations.add({
            type: AnnotationType.POINT,
            id: '' + i,
            point: verify3dVec(x)
        });
    });
}
function isValidLinkedSegmentationLayer(layer) {
    var userLayer = layer.layer;
    if (userLayer === null) {
        return true;
    }
    if (userLayer instanceof SegmentationUserLayer) {
        return true;
    }
    return false;
}
function getSegmentationDisplayState(layer) {
    if (layer === undefined) {
        return undefined;
    }
    var userLayer = layer.layer;
    if (userLayer === null) {
        return undefined;
    }
    if (!(userLayer instanceof SegmentationUserLayer)) {
        return undefined;
    }
    return userLayer.displayState;
}
var VOXEL_SIZE_JSON_KEY = 'voxelSize';
var SOURCE_JSON_KEY = 'source';
var LINKED_SEGMENTATION_LAYER_JSON_KEY = 'linkedSegmentationLayer';
var FILTER_BY_SEGMENTATION_JSON_KEY = 'filterBySegmentation';
var Base = UserLayerWithAnnotationsMixin(UserLayerWithCoordinateTransformMixin(UserLayer));
export var AnnotationUserLayer = function (_Base) {
    _inherits(AnnotationUserLayer, _Base);

    function AnnotationUserLayer(manager, specification) {
        _classCallCheck(this, AnnotationUserLayer);

        var _this = _possibleConstructorReturn(this, (AnnotationUserLayer.__proto__ || _Object$getPrototypeOf(AnnotationUserLayer)).call(this, manager, specification));

        _this.localAnnotations = _this.registerDisposer(new LocalAnnotationSource());
        _this.voxelSize = new VoxelSize();
        _this.linkedSegmentationLayer = _this.registerDisposer(new LayerReference(_this.manager.rootLayers.addRef(), isValidLinkedSegmentationLayer));
        _this.filterBySegmentation = new TrackableBoolean(false);
        var sourceUrl = _this.sourceUrl = specification[SOURCE_JSON_KEY];
        _this.linkedSegmentationLayer.restoreState(specification[LINKED_SEGMENTATION_LAYER_JSON_KEY]);
        _this.filterBySegmentation.restoreState(specification[FILTER_BY_SEGMENTATION_JSON_KEY]);
        if (sourceUrl === undefined) {
            _this.isReady = true;
            _this.voxelSize.restoreState(specification[VOXEL_SIZE_JSON_KEY]);
            _this.localAnnotations.restoreState(specification[ANNOTATIONS_JSON_KEY]);
            // Handle legacy "points" property.
            addPointAnnotations(_this.localAnnotations, specification[POINTS_JSON_KEY]);
            var voxelSizeValid = false;
            var handleVoxelSizeChanged = function handleVoxelSizeChanged() {
                if (!_this.voxelSize.valid && manager.voxelSize.valid) {
                    vec3.copy(_this.voxelSize.size, manager.voxelSize.size);
                    _this.voxelSize.setValid();
                }
                if (_this.voxelSize.valid && voxelSizeValid === false) {
                    var derivedTransform = new CoordinateTransform();
                    _this.registerDisposer(makeDerivedCoordinateTransform(derivedTransform, _this.transform, function (output, input) {
                        var voxelScalingMatrix = mat4.fromScaling(mat4.create(), _this.voxelSize.size);
                        mat4.multiply(output, input, voxelScalingMatrix);
                    }));
                    _this.annotationLayerState.value = new AnnotationLayerState(_Object$assign({ transform: derivedTransform, source: _this.localAnnotations.addRef() }, _this.getAnnotationRenderOptions()));
                    voxelSizeValid = true;
                }
            };
            _this.registerDisposer(_this.localAnnotations.changed.add(_this.specificationChanged.dispatch));
            _this.registerDisposer(_this.voxelSize.changed.add(_this.specificationChanged.dispatch));
            _this.registerDisposer(_this.filterBySegmentation.changed.add(_this.specificationChanged.dispatch));
            _this.registerDisposer(_this.voxelSize.changed.add(handleVoxelSizeChanged));
            _this.registerDisposer(_this.manager.voxelSize.changed.add(handleVoxelSizeChanged));
            handleVoxelSizeChanged();
        } else {
            StatusMessage.forPromise(_this.manager.dataSourceProvider.getAnnotationSource(_this.manager.chunkManager, sourceUrl), {
                initialMessage: 'Retrieving metadata for volume ' + sourceUrl + '.',
                delay: true,
                errorPrefix: 'Error retrieving metadata for volume ' + sourceUrl + ': '
            }).then(function (source) {
                if (_this.wasDisposed) {
                    return;
                }
                _this.annotationLayerState.value = new AnnotationLayerState(_Object$assign({ transform: _this.transform, source: source }, _this.getAnnotationRenderOptions()));
                _this.isReady = true;
            });
        }
        _this.tabs.default = 'annotations';
        return _this;
    }

    _createClass(AnnotationUserLayer, [{
        key: 'getAnnotationRenderOptions',
        value: function getAnnotationRenderOptions() {
            var _this2 = this;

            var segmentationState = new WatchableValue(undefined);
            var setSegmentationState = function setSegmentationState() {
                var linkedSegmentationLayer = _this2.linkedSegmentationLayer;

                if (linkedSegmentationLayer.layerName === undefined) {
                    segmentationState.value = null;
                } else {
                    var layer = linkedSegmentationLayer.layer;

                    segmentationState.value = getSegmentationDisplayState(layer);
                }
            };
            this.registerDisposer(this.linkedSegmentationLayer.changed.add(setSegmentationState));
            setSegmentationState();
            return _Object$assign({ segmentationState: segmentationState, filterBySegmentation: this.filterBySegmentation }, _getAnnotationRenderOptions(this));
        }
    }, {
        key: 'initializeAnnotationLayerViewTab',
        value: function initializeAnnotationLayerViewTab(tab) {
            var widget = tab.registerDisposer(new LayerReferenceWidget(this.linkedSegmentationLayer));
            widget.element.insertBefore(document.createTextNode('Linked segmentation: '), widget.element.firstChild);
            tab.element.appendChild(widget.element);
            {
                var checkboxWidget = this.registerDisposer(new TrackableBooleanCheckbox(tab.annotationLayer.filterBySegmentation));
                var label = document.createElement('label');
                label.textContent = 'Filter by segmentation: ';
                label.appendChild(checkboxWidget.element);
                tab.element.appendChild(label);
                tab.registerDisposer(new ElementVisibilityFromTrackableBoolean(this.registerDisposer(makeDerivedWatchableValue(function (v) {
                    return v !== undefined;
                }, tab.annotationLayer.segmentationState)), label));
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var x = _get(AnnotationUserLayer.prototype.__proto__ || _Object$getPrototypeOf(AnnotationUserLayer.prototype), 'toJSON', this).call(this);
            x['type'] = 'annotation';
            x[SOURCE_JSON_KEY] = this.sourceUrl;
            if (this.sourceUrl === undefined) {
                x[ANNOTATIONS_JSON_KEY] = this.localAnnotations.toJSON();
                x[VOXEL_SIZE_JSON_KEY] = this.voxelSize.toJSON();
            }
            x[LINKED_SEGMENTATION_LAYER_JSON_KEY] = this.linkedSegmentationLayer.toJSON();
            x[FILTER_BY_SEGMENTATION_JSON_KEY] = this.filterBySegmentation.toJSON();
            return x;
        }
    }]);

    return AnnotationUserLayer;
}(Base);
registerLayerType('annotation', AnnotationUserLayer);
registerLayerType('pointAnnotation', AnnotationUserLayer);
//# sourceMappingURL=user_layer.js.map