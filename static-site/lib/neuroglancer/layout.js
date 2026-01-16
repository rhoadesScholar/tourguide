import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$assign from 'babel-runtime/core-js/object/assign';
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
export function withFlex(value, handler) {
    return function (element) {
        element.style.flex = value;
        handler(element);
    };
}
export function withStyle(style, handler) {
    return function (element) {
        _Object$assign(element.style, style);
        handler(element);
    };
}
export function withAttributes(attributes, handler) {
    return function (element) {
        _Object$assign(element, attributes);
        handler(element);
    };
}
export function box(flexDirection, spec) {
    return function (container) {
        container.style.display = 'flex';
        container.style.flexDirection = flexDirection;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(spec), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var handler = _step.value;

                var element = container.ownerDocument.createElement('div');
                container.appendChild(element);
                handler(element);
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
    };
}
//# sourceMappingURL=layout.js.map