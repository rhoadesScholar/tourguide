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
import { vec3 } from './util/geom';
import { verify3dVec } from './util/json';
import { NullarySignal } from './util/signal';
export function trackableVec3() {
    var defaultValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : vec3.create();

    return new TrackableVec3(defaultValue, defaultValue);
}
export var TrackableVec3 = function () {
    function TrackableVec3(value_, defaultValue) {
        _classCallCheck(this, TrackableVec3);

        this.value_ = value_;
        this.defaultValue = defaultValue;
        this.changed = new NullarySignal();
    }

    _createClass(TrackableVec3, [{
        key: 'toJSON',
        value: function toJSON() {
            var value_ = this.value_;

            if (value_ === this.defaultValue) {
                return undefined;
            }
            return this.value_.toString();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(x) {
            try {
                this.value = verify3dVec(x.split(','));
            } catch (e) {
                this.value = this.defaultValue;
            }
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

    return TrackableVec3;
}();
//# sourceMappingURL=trackable_vec3.js.map