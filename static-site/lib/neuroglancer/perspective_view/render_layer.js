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
import { VisibilityTrackedRenderLayer } from '../layer';
export var PerspectiveViewRenderLayer = function (_VisibilityTrackedRen) {
    _inherits(PerspectiveViewRenderLayer, _VisibilityTrackedRen);

    function PerspectiveViewRenderLayer() {
        _classCallCheck(this, PerspectiveViewRenderLayer);

        return _possibleConstructorReturn(this, (PerspectiveViewRenderLayer.__proto__ || _Object$getPrototypeOf(PerspectiveViewRenderLayer)).apply(this, arguments));
    }

    _createClass(PerspectiveViewRenderLayer, [{
        key: 'draw',
        value: function draw(_renderContext) {
            // Must be overridden by subclasses.
        }
    }, {
        key: 'isReady',
        value: function isReady(_renderContext) {
            return true;
        }
    }]);

    return PerspectiveViewRenderLayer;
}(VisibilityTrackedRenderLayer);
//# sourceMappingURL=render_layer.js.map