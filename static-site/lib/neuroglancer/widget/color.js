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
import { RefCounted } from '../util/disposable';
import { removeFromParent } from '../util/dom';
export var ColorWidget = function (_RefCounted) {
    _inherits(ColorWidget, _RefCounted);

    function ColorWidget(model) {
        _classCallCheck(this, ColorWidget);

        var _this = _possibleConstructorReturn(this, (ColorWidget.__proto__ || _Object$getPrototypeOf(ColorWidget)).call(this));

        _this.model = model;
        _this.element = document.createElement('input');
        var element = _this.element;

        element.classList.add('neuroglancer-color-widget');
        element.type = 'color';
        element.addEventListener('change', function () {
            return _this.updateModel();
        });
        _this.registerDisposer(model.changed.add(function () {
            return _this.updateView();
        }));
        _this.updateView();
        return _this;
    }

    _createClass(ColorWidget, [{
        key: 'updateView',
        value: function updateView() {
            this.element.value = this.model.toString();
        }
    }, {
        key: 'updateModel',
        value: function updateModel() {
            this.model.restoreState(this.element.value);
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(ColorWidget.prototype.__proto__ || _Object$getPrototypeOf(ColorWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return ColorWidget;
}(RefCounted);
//# sourceMappingURL=color.js.map