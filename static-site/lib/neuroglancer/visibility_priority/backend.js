import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
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
import '../shared_watchable_value';
import { ChunkPriorityTier, PREFETCH_PRIORITY_MULTIPLIER } from '../chunk_manager/base';
/**
 * Mixin for adding a visibility shared property to a ChunkRequester.  Calls
 * `this.chunkManager.scheduleUpdateChunkPriorities()` when visibility changes.
 */
export function withSharedVisibility(Base) {
    return function (_Base) {
        _inherits(_class, _Base);

        function _class() {
            var _ref;

            _classCallCheck(this, _class);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var _this = _possibleConstructorReturn(this, (_ref = _class.__proto__ || _Object$getPrototypeOf(_class)).call.apply(_ref, [this].concat(args)));

            var rpc = args[0];
            var options = args[1];
            _this.visibility = rpc.get(options['visibility']);
            _this.registerDisposer(_this.visibility.changed.add(function () {
                return _this.chunkManager.scheduleUpdateChunkPriorities();
            }));
            return _this;
        }

        return _class;
    }(Base);
}
/**
 * Computes the ChunkPriorityTier for the given `visibility` value.
 *
 * A value of `Number.POSITIVE_INFINITY` means `VISIBLE`.  Any other value means `PREFETCH`.
 */
export function getPriorityTier(visibility) {
    return visibility === Number.POSITIVE_INFINITY ? ChunkPriorityTier.VISIBLE : ChunkPriorityTier.PREFETCH;
}
/**
 * Computes the base priority for the given `visibility` value.  If the value is
 * `Number.POSTIVE_INFINITY`, corresponding to actual visibility, the base priority is 0.
 * Otherwise, the value is interpreted as the prefetch priority (higher means higher priority), and
 * the base priority is equal to the product of this value and `PREFETCH_PRIORITY_MULTIPLIER`.
 */
export function getBasePriority(visibility) {
    return visibility === Number.POSITIVE_INFINITY ? 0 : visibility * PREFETCH_PRIORITY_MULTIPLIER;
}
//# sourceMappingURL=backend.js.map