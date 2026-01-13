import _Map from 'babel-runtime/core-js/map';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { verifyObject, verifyObjectProperty, verifyString } from '../util/json';
export var Tool = function (_RefCounted) {
    _inherits(Tool, _RefCounted);

    function Tool() {
        _classCallCheck(this, Tool);

        return _possibleConstructorReturn(this, (Tool.__proto__ || _Object$getPrototypeOf(Tool)).apply(this, arguments));
    }

    _createClass(Tool, [{
        key: 'setActive',
        value: function setActive(_value) {}
    }, {
        key: 'deactivate',
        value: function deactivate() {}
    }]);

    return Tool;
}(RefCounted);
export function restoreTool(layer, obj) {
    if (obj === undefined) {
        return undefined;
    }
    if (typeof obj === 'string') {
        obj = { 'type': obj };
    }
    verifyObject(obj);
    var type = verifyObjectProperty(obj, 'type', verifyString);
    var getter = tools.get(type);
    if (getter === undefined) {
        throw new Error('Invalid tool type: ' + _JSON$stringify(obj) + '.');
    }
    return getter(layer, obj);
}
var tools = new _Map();
export function registerTool(type, getter) {
    tools.set(type, getter);
}
//# sourceMappingURL=tool.js.map