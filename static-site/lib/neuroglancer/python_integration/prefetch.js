import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Set from 'babel-runtime/core-js/set';
import _Map from 'babel-runtime/core-js/map';
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
/**
 * @file
 * Python-initiated prefetch support.
 */
import debounce from 'lodash/debounce';
import { RefCounted } from '../util/disposable';
import { parseArray, verifyInt, verifyObject, verifyObjectProperty } from '../util/json';
import { NullarySignal } from '../util/signal';
import { Viewer } from '../viewer';
import { WatchableVisibilityPriority } from '../visibility_priority/frontend';
export var PrefetchManager = function (_RefCounted) {
    _inherits(PrefetchManager, _RefCounted);

    function PrefetchManager(display, dataSourceProvider, dataContext, uiConfiguration) {
        _classCallCheck(this, PrefetchManager);

        var _this = _possibleConstructorReturn(this, (PrefetchManager.__proto__ || _Object$getPrototypeOf(PrefetchManager)).call(this));

        _this.display = display;
        _this.dataSourceProvider = dataSourceProvider;
        _this.dataContext = dataContext;
        _this.uiConfiguration = uiConfiguration;
        _this.prefetchStates = new _Map();
        _this.changed = new NullarySignal();
        _this.specification = [];
        _this.updatePrefetchStates = _this.registerCancellable(debounce(function () {
            var specification = _this.specification,
                prefetchStates = _this.prefetchStates;

            var newStates = new _Set();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(specification), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _ref = _step.value;
                    var state = _ref.state;
                    var priority = _ref.priority;

                    var key = _JSON$stringify(state);
                    newStates.add(key);
                    var viewer = prefetchStates.get(key);
                    if (viewer === undefined) {
                        viewer = _this.makePrefetchState(state, priority);
                        prefetchStates.set(key, viewer);
                    } else {
                        viewer.visibility.value = priority;
                    }
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

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(prefetchStates), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref2 = _step2.value;

                    var _ref3 = _slicedToArray(_ref2, 2);

                    var key = _ref3[0];
                    var viewer = _ref3[1];

                    if (!newStates.has(key)) {
                        prefetchStates.delete(key);
                        viewer.dispose();
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }, 0));
        _this.registerDisposer(dataContext);
        return _this;
    }

    _createClass(PrefetchManager, [{
        key: 'makePrefetchState',
        value: function makePrefetchState(state, priority) {
            var viewer = new Viewer(this.display, {
                showLayerDialog: false,
                resetStateWhenEmpty: false,
                dataSourceProvider: this.dataSourceProvider,
                dataContext: this.dataContext.addRef(),
                visibility: new WatchableVisibilityPriority(priority),
                uiConfiguration: this.uiConfiguration
            });
            try {
                viewer.state.restoreState(state);
            } catch (restoreError) {
                console.log('Error setting prefetch state: ' + restoreError.message);
            }
            return viewer;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.specification = [];
            this.changed.dispatch();
            this.updatePrefetchStates();
        }
    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            this.specification = parseArray(obj, function (x) {
                verifyObject(x);
                var state = verifyObjectProperty(x, 'state', verifyObject);
                var priority = verifyObjectProperty(x, 'priority', function (y) {
                    return y === undefined ? 0 : verifyInt(y);
                });
                return { state: state, priority: priority };
            });
            this.changed.dispatch();
            this.updatePrefetchStates();
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var specification = this.specification;

            return specification.length === 0 ? undefined : this.specification;
        }
    }]);

    return PrefetchManager;
}(RefCounted);
//# sourceMappingURL=prefetch.js.map