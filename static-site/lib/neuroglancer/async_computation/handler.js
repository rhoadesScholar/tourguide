import _toConsumableArray from "babel-runtime/helpers/toConsumableArray";
import _Map from "babel-runtime/core-js/map";
/**
 * @license
 * Copyright 2019 Google Inc.
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
var handlers = new _Map();
self.onmessage = function (msg) {
    var _msg$data = msg.data,
        t = _msg$data.t,
        id = _msg$data.id,
        args = _msg$data.args;

    var handler = handlers.get(t);
    handler.apply(undefined, _toConsumableArray(args)).then(function (_ref) {
        var value = _ref.value,
            transfer = _ref.transfer;
        return self.postMessage({ id: id, value: value }, transfer);
    }, function (error) {
        return self.postMessage({ id: id, error: error.message });
    });
};
export function registerAsyncComputation(request, handler) {
    handlers.set(request.id, handler);
}
//# sourceMappingURL=handler.js.map