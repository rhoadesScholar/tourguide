import _Number$isNaN from 'babel-runtime/core-js/number/is-nan';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { TrackableValue } from '../trackable_value';
import { RefCounted } from '../util/disposable';
import { removeFromParent } from '../util/dom';
export var NumberInputWidget = function (_RefCounted) {
    _inherits(NumberInputWidget, _RefCounted);

    function NumberInputWidget(model) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, NumberInputWidget);

        var _this = _possibleConstructorReturn(this, (NumberInputWidget.__proto__ || _Object$getPrototypeOf(NumberInputWidget)).call(this));

        _this.model = model;
        _this.element = document.createElement('label');
        _this.inputElement = document.createElement('input');
        var validator = options.validator,
            label = options.label;
        var element = _this.element,
            inputElement = _this.inputElement;

        if (validator === undefined) {
            if (model instanceof TrackableValue) {
                validator = model.validator;
            } else {
                validator = function validator(x) {
                    return x;
                };
            }
        }
        _this.validator = validator;
        if (label !== undefined) {
            element.textContent = label;
        }
        element.appendChild(inputElement);
        element.className = 'neuroglancer-number-input';
        inputElement.type = 'input';
        _this.registerDisposer(_this.model.changed.add(function () {
            return _this.updateView();
        }));
        _this.registerEventListener(inputElement, 'change', function () {
            return _this.updateModel();
        });
        _this.updateView();
        return _this;
    }

    _createClass(NumberInputWidget, [{
        key: 'updateView',
        value: function updateView() {
            this.inputElement.value = '' + this.model.value;
        }
    }, {
        key: 'updateModel',
        value: function updateModel() {
            var value = parseFloat(this.inputElement.value.trim());
            if (_Number$isNaN(value)) {
                this.updateView();
                return;
            }
            try {
                value = this.validator(value);
                this.model.value = value;
            } catch (_a) {
                this.updateView();
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(NumberInputWidget.prototype.__proto__ || _Object$getPrototypeOf(NumberInputWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return NumberInputWidget;
}(RefCounted);
//# sourceMappingURL=number_input_widget.js.map