import _getIterator from 'babel-runtime/core-js/get-iterator';
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
import { Signal } from '../util/signal';
import { Uint64 } from '../util/uint64';

export var Uint64EntryWidget = function (_RefCounted) {
    _inherits(Uint64EntryWidget, _RefCounted);

    function Uint64EntryWidget() {
        _classCallCheck(this, Uint64EntryWidget);

        var _this = _possibleConstructorReturn(this, (Uint64EntryWidget.__proto__ || _Object$getPrototypeOf(Uint64EntryWidget)).call(this));

        _this.element = document.createElement('form');
        _this.label = document.createElement('label');
        _this.input = document.createElement('input');
        _this.valuesEntered = new Signal();
        var element = _this.element,
            label = _this.label,
            input = _this.input;

        element.className = 'uint64-entry neuroglancer-noselect';
        element.appendChild(label);
        label.appendChild(input);
        _this.registerEventListener(element, 'submit', function (event) {
            event.preventDefault();
            var values = _this.validateInput();
            if (values !== undefined) {
                _this.input.value = '';
                _this.input.classList.remove('valid-input', 'invalid-input');
                _this.valuesEntered.dispatch(values);
            }
        });
        _this.registerEventListener(element, 'input', function () {
            if (_this.input.value === '') {
                _this.input.classList.remove('valid-input', 'invalid-input');
                return;
            }
            if (_this.validateInput()) {
                _this.input.classList.remove('invalid-input');
            } else {
                _this.input.classList.add('invalid-input');
            }
        });
        return _this;
    }

    _createClass(Uint64EntryWidget, [{
        key: 'validateInput',
        value: function validateInput() {
            var value = this.input.value;
            value = value.replace(/[\s,\(\)\[\]\{\};]+/g, ' ');
            value = value.trim();
            var parts = value.split(' ');
            if (parts.length === 0) {
                return undefined;
            }
            var results = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(parts), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var part = _step.value;

                    var x = new Uint64();
                    if (!x.tryParseString(part)) {
                        return undefined;
                    }
                    results.push(x);
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

            return results;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(Uint64EntryWidget.prototype.__proto__ || _Object$getPrototypeOf(Uint64EntryWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return Uint64EntryWidget;
}(RefCounted);
//# sourceMappingURL=uint64_entry_widget.js.map