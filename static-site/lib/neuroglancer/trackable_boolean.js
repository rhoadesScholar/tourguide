import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import debounce from 'lodash/debounce';
import { RefCounted } from './util/disposable';
import { NullarySignal } from './util/signal';
export var TrackableBoolean = function () {
    function TrackableBoolean(value_) {
        var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : value_;

        _classCallCheck(this, TrackableBoolean);

        this.value_ = value_;
        this.defaultValue = defaultValue;
        this.changed = new NullarySignal();
    }

    _createClass(TrackableBoolean, [{
        key: 'toggle',
        value: function toggle() {
            this.value = !this.value;
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var value_ = this.value_;

            if (value_ === this.defaultValue) {
                return undefined;
            }
            return this.value_;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            if (x === true || x === false) {
                this.value = x;
                return;
            }
            this.value = this.defaultValue;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = this.defaultValue;
        }
    }, {
        key: 'value',
        get: function get() {
            return this.value_;
        },
        set: function set(newValue) {
            if (newValue !== this.value_) {
                this.value_ = newValue;
                this.changed.dispatch();
            }
        }
    }]);

    return TrackableBoolean;
}();
export var TrackableBooleanCheckbox = function (_RefCounted) {
    _inherits(TrackableBooleanCheckbox, _RefCounted);

    function TrackableBooleanCheckbox(model) {
        _classCallCheck(this, TrackableBooleanCheckbox);

        var _this = _possibleConstructorReturn(this, (TrackableBooleanCheckbox.__proto__ || _Object$getPrototypeOf(TrackableBooleanCheckbox)).call(this));

        _this.model = model;
        _this.element = document.createElement('input');
        var element = _this.element;

        element.type = 'checkbox';
        _this.registerDisposer(model.changed.add(function () {
            _this.updateCheckbox();
        }));
        _this.updateCheckbox();
        _this.registerEventListener(element, 'change', function (_e) {
            model.value = this.checked;
        });
        // Prevent the checkbox from becoming focused.
        element.addEventListener('mousedown', function (event) {
            event.preventDefault();
        });
        return _this;
    }

    _createClass(TrackableBooleanCheckbox, [{
        key: 'updateCheckbox',
        value: function updateCheckbox() {
            this.element.checked = this.model.value;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var element = this.element;
            var parentElement = element.parentElement;

            if (parentElement) {
                parentElement.removeChild(element);
            }
            _get(TrackableBooleanCheckbox.prototype.__proto__ || _Object$getPrototypeOf(TrackableBooleanCheckbox.prototype), 'disposed', this).call(this);
        }
    }]);

    return TrackableBooleanCheckbox;
}(RefCounted);
export var ElementVisibilityFromTrackableBoolean = function (_RefCounted2) {
    _inherits(ElementVisibilityFromTrackableBoolean, _RefCounted2);

    function ElementVisibilityFromTrackableBoolean(model, element) {
        _classCallCheck(this, ElementVisibilityFromTrackableBoolean);

        var _this2 = _possibleConstructorReturn(this, (ElementVisibilityFromTrackableBoolean.__proto__ || _Object$getPrototypeOf(ElementVisibilityFromTrackableBoolean)).call(this));

        _this2.model = model;
        _this2.element = element;
        _this2.initialDisplay = _this2.element.style.display;
        _this2.updateVisibility();
        _this2.registerDisposer(model.changed.add(_this2.registerCancellable(debounce(function () {
            return _this2.updateVisibility();
        }, 0))));
        return _this2;
    }

    _createClass(ElementVisibilityFromTrackableBoolean, [{
        key: 'updateVisibility',
        value: function updateVisibility() {
            this.element.style.display = this.model.value ? this.initialDisplay : 'none';
        }
    }]);

    return ElementVisibilityFromTrackableBoolean;
}(RefCounted);
//# sourceMappingURL=trackable_boolean.js.map