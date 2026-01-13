import _Object$assign from 'babel-runtime/core-js/object/assign';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
import { AnnotationLayerState } from './annotation/frontend';
import { RenderLayerRole } from './layer';
import { getVolumeWithStatusMessage } from './layer_specification';
import { RenderScaleHistogram, trackableRenderScaleTarget } from './render_scale_statistics';
import { getAnnotationRenderOptions, UserLayerWithAnnotationsMixin } from './ui/annotations';
import { UserLayerWithCoordinateTransformMixin } from './user_layer_with_coordinate_transform';
import { verifyObjectProperty, verifyOptionalString } from './util/json';
var SOURCE_JSON_KEY = 'source';
var CROSS_SECTION_RENDER_SCALE_JSON_KEY = 'crossSectionRenderScale';
function helper(Base) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            _classCallCheck(this, C);

            var _this = _possibleConstructorReturn(this, (C.__proto__ || _Object$getPrototypeOf(C)).apply(this, arguments));

            _this.sliceViewRenderScaleHistogram = new RenderScaleHistogram();
            _this.sliceViewRenderScaleTarget = function () {
                var target = trackableRenderScaleTarget(1);
                target.changed.add(_this.specificationChanged.dispatch);
                return target;
            }();
            return _this;
        }

        _createClass(C, [{
            key: 'restoreState',
            value: function restoreState(specification) {
                var _this2 = this;

                _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), 'restoreState', this).call(this, specification);
                var volumePath = this.volumePath = verifyObjectProperty(specification, SOURCE_JSON_KEY, verifyOptionalString);
                this.sliceViewRenderScaleTarget.restoreState(specification[CROSS_SECTION_RENDER_SCALE_JSON_KEY]);
                if (volumePath !== undefined) {
                    var multiscaleSource = this.multiscaleSource = getVolumeWithStatusMessage(this.manager.dataSourceProvider, this.manager.chunkManager, volumePath, this.volumeOptions);
                    multiscaleSource.then(function (volume) {
                        if (!_this2.wasDisposed) {
                            var staticAnnotations = volume.getStaticAnnotations && volume.getStaticAnnotations();
                            if (staticAnnotations !== undefined) {
                                _this2.annotationLayerState.value = new AnnotationLayerState(_Object$assign({ transform: _this2.transform, source: staticAnnotations, role: RenderLayerRole.DEFAULT_ANNOTATION }, getAnnotationRenderOptions(_this2)));
                            }
                        }
                    });
                }
            }
        }, {
            key: 'toJSON',
            value: function toJSON() {
                var result = _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), 'toJSON', this).call(this);
                result[SOURCE_JSON_KEY] = this.volumePath;
                result[CROSS_SECTION_RENDER_SCALE_JSON_KEY] = this.sliceViewRenderScaleTarget.toJSON();
                return result;
            }
        }]);

        return C;
    }(Base);

    return C;
}
/**
 * Mixin that adds a `source` property to a user layer.
 */
export function UserLayerWithVolumeSourceMixin(Base) {
    return helper(UserLayerWithAnnotationsMixin(UserLayerWithCoordinateTransformMixin(Base)));
}
//# sourceMappingURL=user_layer_with_volume_source.js.map