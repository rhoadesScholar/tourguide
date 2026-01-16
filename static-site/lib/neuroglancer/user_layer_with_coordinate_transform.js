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
import { CoordinateTransform } from './coordinate_transform';
import { CoordinateTransformTab } from './widget/coordinate_transform';
var TRANSFORM_JSON_KEY = 'transform';
/**
 * Mixin that adds a `transform` property to a user layer.
 */
export function UserLayerWithCoordinateTransformMixin(Base) {
    var C = function (_Base) {
        _inherits(C, _Base);

        function C() {
            var _ref;

            _classCallCheck(this, C);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = _possibleConstructorReturn(this, (_ref = C.__proto__ || _Object$getPrototypeOf(C)).call.apply(_ref, [this].concat(args)));

            _this.transform = new CoordinateTransform();
            _this.transform.changed.add(_this.specificationChanged.dispatch);
            _this.tabs.add('transform', {
                label: 'Transform',
                order: 100,
                getter: function getter() {
                    return new CoordinateTransformTab(_this.transform);
                }
            });
            var specification = args[1];
            _this.transform.restoreState(specification[TRANSFORM_JSON_KEY]);
            return _this;
        }

        _createClass(C, [{
            key: 'toJSON',
            value: function toJSON() {
                var x = _get(C.prototype.__proto__ || _Object$getPrototypeOf(C.prototype), 'toJSON', this).call(this);
                x[TRANSFORM_JSON_KEY] = this.transform.toJSON();
                return x;
            }
        }]);

        return C;
    }(Base);

    return C;
}
//# sourceMappingURL=user_layer_with_coordinate_transform.js.map