import _typeof from 'babel-runtime/helpers/typeof';
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
import { identityMat4, kOneVec, kZeroVec, mat4, quat, vec3 } from './util/geom';
import { parseFiniteVec } from './util/json';
import { NullarySignal } from './util/signal';
/**
 * Class for representing a coordinate transform specified by a user.
 *
 * Typically it represents a transform from a local coordinate space to a global coordinate space.
 */
export var CoordinateTransform = function () {
    function CoordinateTransform() {
        var transform = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : mat4.create();

        _classCallCheck(this, CoordinateTransform);

        this.transform = transform;
        this.changed = new NullarySignal();
    }

    _createClass(CoordinateTransform, [{
        key: 'reset',

        /**
         * Resets to the identity transform.
         */
        value: function reset() {
            mat4.copy(this.transform, identityMat4);
            this.changed.dispatch();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            if (mat4.equals(identityMat4, this.transform)) {
                return undefined;
            }
            var m = this.transform;
            return [[m[0], m[4], m[8], m[12]], [m[1], m[5], m[9], m[13]], [m[2], m[6], m[10], m[14]], [m[3], m[7], m[11], m[15]]];
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            if (obj == null) {
                this.reset();
                return;
            }
            if (Array.isArray(obj)) {
                if (obj.length === 4) {
                    try {
                        for (var i = 0; i < 4; ++i) {
                            parseFiniteVec(this.transform.subarray(i * 4, (i + 1) * 4), obj[i]);
                        }
                        mat4.transpose(this.transform, this.transform);
                    } catch (ignoredError) {
                        this.reset();
                    }
                    return;
                }
                if (obj.length === 16) {
                    try {
                        parseFiniteVec(this.transform, obj);
                        mat4.transpose(this.transform, this.transform);
                    } catch (ignoredError) {
                        this.reset();
                    }
                    return;
                }
                // Invalid size.
                this.reset();
                return;
            }
            if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
                var rotation = quat.create();
                var translation = vec3.create();
                var scale = vec3.fromValues(1, 1, 1);
                try {
                    parseFiniteVec(rotation, obj['rotation']);
                    quat.normalize(rotation, rotation);
                } catch (ignoredError) {
                    quat.identity(rotation);
                }
                try {
                    parseFiniteVec(translation, obj['translation']);
                } catch (ignoredError) {
                    vec3.copy(translation, kZeroVec);
                }
                try {
                    parseFiniteVec(scale, obj['scale']);
                } catch (ignoredError) {
                    vec3.copy(scale, kOneVec);
                }
                mat4.fromRotationTranslationScale(this.transform, rotation, translation, scale);
                this.changed.dispatch();
            } else {
                this.reset();
            }
        }
    }, {
        key: 'clone',
        value: function clone() {
            return new CoordinateTransform(mat4.clone(this.transform));
        }
    }, {
        key: 'value',
        get: function get() {
            return this.transform;
        }
    }]);

    return CoordinateTransform;
}();
export function makeDerivedCoordinateTransform(derivedTransform, baseTransform, update) {
    update(derivedTransform.transform, baseTransform.transform);
    return baseTransform.changed.add(function () {
        update(derivedTransform.transform, baseTransform.transform);
        derivedTransform.changed.dispatch();
    });
}
//# sourceMappingURL=coordinate_transform.js.map