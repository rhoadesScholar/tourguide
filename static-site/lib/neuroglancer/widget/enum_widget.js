import _Object$keys from 'babel-runtime/core-js/object/keys';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { RefCounted } from '../util/disposable';
export var EnumSelectWidget = function (_RefCounted) {
    _inherits(EnumSelectWidget, _RefCounted);

    function EnumSelectWidget(model) {
        _classCallCheck(this, EnumSelectWidget);

        var _this = _possibleConstructorReturn(this, (EnumSelectWidget.__proto__ || _Object$getPrototypeOf(EnumSelectWidget)).call(this));

        _this.model = model;
        _this.element = document.createElement('select');
        _this.valueIndexMap = new _Map();
        var element = _this.element,
            valueIndexMap = _this.valueIndexMap;

        var index = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(_Object$keys(model.enumType)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var key = _step.value;

                if (isNaN(Number(key))) {
                    var option = document.createElement('option');
                    option.textContent = option.value = key.toLowerCase();
                    element.appendChild(option);
                    valueIndexMap.set(model.enumType[key], index);
                    ++index;
                }
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

        _this.registerDisposer(model.changed.add(function () {
            return _this.updateView();
        }));
        _this.registerEventListener(element, 'change', function () {
            return _this.updateModel();
        });
        _this.registerEventListener(element, 'wheel', function (event) {
            var deltaY = event.deltaY;

            if (deltaY > 0) {
                element.selectedIndex = (element.options.length + element.selectedIndex - 1) % element.options.length;
                _this.updateModel();
            } else if (deltaY < 0) {
                element.selectedIndex = (element.options.length + element.selectedIndex + 1) % element.options.length;
                _this.updateModel();
            }
        });
        _this.updateView();
        return _this;
    }

    _createClass(EnumSelectWidget, [{
        key: 'updateView',
        value: function updateView() {
            var element = this.element;

            element.selectedIndex = this.valueIndexMap.get(this.model.value);
        }
    }, {
        key: 'updateModel',
        value: function updateModel() {
            this.model.restoreState(this.element.value);
        }
    }]);

    return EnumSelectWidget;
}(RefCounted);
//# sourceMappingURL=enum_widget.js.map