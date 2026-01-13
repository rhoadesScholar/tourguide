import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
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
import { SharedCredentialsProvider } from './shared';
import { getObjectId } from '../util/object_id';
/**
 * Returns a counterpart ref to be sent to the backend to retrieve a
 * SharedCredentialsProviderCounterpart that forwards to `credentialsProvider`.
 */
export function getCredentialsProviderCounterpart(chunkManager, credentialsProvider) {
    var sharedCredentialsProvider = chunkManager.memoize.get({ type: 'getSharedCredentialsProvider', credentialsProvider: getObjectId(credentialsProvider) }, function () {
        return new SharedCredentialsProvider(credentialsProvider.addRef(), chunkManager.rpc);
    });
    var counterpartRef = sharedCredentialsProvider.addCounterpartRef();
    sharedCredentialsProvider.dispose();
    return counterpartRef;
}
/**
 * Mixin for adding a credentialsProvider member to a ChunkSource.
 */
export function WithCredentialsProvider() {
    return function (Base) {
        return function (_Base) {
            _inherits(_class, _Base);

            function _class() {
                var _ref;

                _classCallCheck(this, _class);

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                var _this = _possibleConstructorReturn(this, (_ref = _class.__proto__ || _Object$getPrototypeOf(_class)).call.apply(_ref, [this].concat(args)));

                var options = args[1];
                _this.credentialsProvider = options.credentialsProvider.addRef();
                return _this;
            }

            _createClass(_class, [{
                key: 'initializeCounterpart',
                value: function initializeCounterpart(rpc, options) {
                    options['credentialsProvider'] = getCredentialsProviderCounterpart(this.chunkManager, this.credentialsProvider);
                    _get(_class.prototype.__proto__ || _Object$getPrototypeOf(_class.prototype), 'initializeCounterpart', this).call(this, rpc, options);
                }
            }], [{
                key: 'encodeOptions',
                value: function encodeOptions(options) {
                    var encoding = _get(_class.__proto__ || _Object$getPrototypeOf(_class), 'encodeOptions', this).call(this, options);
                    encoding.credentialsProvider = getObjectId(options.credentialsProvider);
                    return encoding;
                }
            }]);

            return _class;
        }(Base);
    };
}
//# sourceMappingURL=chunk_source_frontend.js.map