import _Map from 'babel-runtime/core-js/map';
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
import { TrackableValue } from './trackable_value';
import { verifyEnumString, verifyString } from './util/json';
export var BLEND_MODES;
(function (BLEND_MODES) {
    BLEND_MODES[BLEND_MODES["DEFAULT"] = 0] = "DEFAULT";
    BLEND_MODES[BLEND_MODES["ADDITIVE"] = 1] = "ADDITIVE";
})(BLEND_MODES || (BLEND_MODES = {}));
export var BLEND_FUNCTIONS = new _Map();
BLEND_FUNCTIONS.set(BLEND_MODES.DEFAULT, function (gl) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
});
BLEND_FUNCTIONS.set(BLEND_MODES.ADDITIVE, function (gl) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
});
function blendModeValidator(obj) {
    if (verifyEnumString(obj, BLEND_MODES)) {
        return verifyString(obj);
    } else {
        throw new Error();
    }
}
export function trackableBlendModeValue() {
    var initialValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'default';

    return new TrackableValue(initialValue, blendModeValidator);
}
//# sourceMappingURL=trackable_blend.js.map