import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
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
import { verifyEnumString } from './json';
import { NullarySignal } from './signal';
export var TrackableEnum = function () {
    function TrackableEnum(enumType, value_) {
        var defaultValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : value_;

        _classCallCheck(this, TrackableEnum);

        this.enumType = enumType;
        this.value_ = value_;
        this.defaultValue = defaultValue;
        this.changed = new NullarySignal();
    }

    _createClass(TrackableEnum, [{
        key: 'reset',
        value: function reset() {
            this.value = this.defaultValue;
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            this.value = verifyEnumString(obj, this.enumType);
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            return this.enumType[this.value_].toLowerCase();
        }
    }, {
        key: 'value',
        set: function set(value) {
            if (this.value_ !== value) {
                this.value_ = value;
                this.changed.dispatch();
            }
        },
        get: function get() {
            return this.value_;
        }
    }]);

    return TrackableEnum;
}();
//# sourceMappingURL=trackable_enum.js.map