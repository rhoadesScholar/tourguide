import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
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
import { DataSourceProvider } from './index';
var providerFactories = new _Map();
export function registerProvider(name, factory) {
    providerFactories.set(name, factory);
}
export function getDefaultDataSourceProvider(options) {
    var provider = new DataSourceProvider();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(providerFactories), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _ref = _step.value;

            var _ref2 = _slicedToArray(_ref, 2);

            var name = _ref2[0];
            var factory = _ref2[1];

            provider.register(name, factory(options));
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

    return provider;
}
//# sourceMappingURL=default_provider.js.map