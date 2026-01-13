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
import { RefCounted } from '../util/disposable';
import { removeFromParent } from '../util/dom';

export var RangeWidget = function (_RefCounted) {
    _inherits(RangeWidget, _RefCounted);

    function RangeWidget(value) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$min = _ref.min,
            min = _ref$min === undefined ? 0 : _ref$min,
            _ref$max = _ref.max,
            max = _ref$max === undefined ? 1 : _ref$max,
            _ref$step = _ref.step,
            step = _ref$step === undefined ? 0.01 : _ref$step;

        _classCallCheck(this, RangeWidget);

        var _this = _possibleConstructorReturn(this, (RangeWidget.__proto__ || _Object$getPrototypeOf(RangeWidget)).call(this));

        _this.value = value;
        _this.element = document.createElement('label');
        _this.promptElement = document.createElement('span');
        _this.inputElement = document.createElement('input');
        var element = _this.element,
            promptElement = _this.promptElement,
            inputElement = _this.inputElement;

        element.className = 'range-slider';
        promptElement.className = 'range-prompt';
        inputElement.type = 'range';
        inputElement.min = '' + min;
        inputElement.max = '' + max;
        inputElement.step = '' + step;
        inputElement.valueAsNumber = _this.value.value;
        element.appendChild(promptElement);
        element.appendChild(inputElement);
        var inputValueChanged = function inputValueChanged() {
            _this.value.value = _this.inputElement.valueAsNumber;
        };
        _this.registerEventListener(inputElement, 'change', inputValueChanged);
        _this.registerEventListener(inputElement, 'input', inputValueChanged);
        _this.registerEventListener(inputElement, 'wheel', function (event) {
            var deltaY = event.deltaY;

            if (deltaY > 0) {
                _this.inputElement.stepUp();
                inputValueChanged();
            } else if (deltaY < 0) {
                _this.inputElement.stepDown();
                inputValueChanged();
            }
        });
        value.changed.add(function () {
            _this.inputElement.valueAsNumber = _this.value.value;
        });
        return _this;
    }

    _createClass(RangeWidget, [{
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(RangeWidget.prototype.__proto__ || _Object$getPrototypeOf(RangeWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return RangeWidget;
}(RefCounted);
//# sourceMappingURL=range.js.map