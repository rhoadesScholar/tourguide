import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
/**
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
import { CoordinateTransform } from '../coordinate_transform';
import { RenderLayerRole } from '../layer';
import { TrackableBoolean } from '../trackable_boolean';
import { WatchableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { mat4 } from '../util/geom';
export var AnnotationHoverState = function (_WatchableValue) {
    _inherits(AnnotationHoverState, _WatchableValue);

    function AnnotationHoverState() {
        _classCallCheck(this, AnnotationHoverState);

        return _possibleConstructorReturn(this, (AnnotationHoverState.__proto__ || _Object$getPrototypeOf(AnnotationHoverState)).apply(this, arguments));
    }

    return AnnotationHoverState;
}(WatchableValue);
export var AnnotationLayerState = function (_RefCounted) {
    _inherits(AnnotationLayerState, _RefCounted);

    function AnnotationLayerState(options) {
        _classCallCheck(this, AnnotationLayerState);

        var _this2 = _possibleConstructorReturn(this, (AnnotationLayerState.__proto__ || _Object$getPrototypeOf(AnnotationLayerState)).call(this));

        _this2.transformCacheGeneration = -1;
        _this2.cachedObjectToGlobal = mat4.create();
        _this2.cachedGlobalToObject = mat4.create();
        var _options$transform = options.transform,
            transform = _options$transform === undefined ? new CoordinateTransform() : _options$transform,
            source = options.source,
            _options$hoverState = options.hoverState,
            hoverState = _options$hoverState === undefined ? new AnnotationHoverState(undefined) : _options$hoverState,
            _options$role = options.role,
            role = _options$role === undefined ? RenderLayerRole.ANNOTATION : _options$role,
            color = options.color,
            fillOpacity = options.fillOpacity,
            _options$segmentation = options.segmentationState,
            segmentationState = _options$segmentation === undefined ? new WatchableValue(null) : _options$segmentation,
            _options$filterBySegm = options.filterBySegmentation,
            filterBySegmentation = _options$filterBySegm === undefined ? new TrackableBoolean(false) : _options$filterBySegm;

        _this2.transform = transform;
        _this2.source = _this2.registerDisposer(source);
        _this2.hoverState = hoverState;
        _this2.role = role;
        _this2.color = color;
        _this2.fillOpacity = fillOpacity;
        _this2.segmentationState = segmentationState;
        _this2.filterBySegmentation = filterBySegmentation;
        return _this2;
    }

    _createClass(AnnotationLayerState, [{
        key: 'updateTransforms',
        value: function updateTransforms() {
            var transform = this.transform,
                transformCacheGeneration = this.transformCacheGeneration;

            var generation = transform.changed.count;
            if (generation === transformCacheGeneration) {
                return;
            }
            var cachedObjectToGlobal = this.cachedObjectToGlobal;

            mat4.multiply(cachedObjectToGlobal, this.transform.transform, this.source.objectToLocal);
            mat4.invert(this.cachedGlobalToObject, cachedObjectToGlobal);
        }
    }, {
        key: 'objectToGlobal',
        get: function get() {
            this.updateTransforms();
            return this.cachedObjectToGlobal;
        }
    }, {
        key: 'globalToObject',
        get: function get() {
            this.updateTransforms();
            return this.cachedGlobalToObject;
        }
    }]);

    return AnnotationLayerState;
}(RefCounted);
//# sourceMappingURL=annotation_layer_state.js.map