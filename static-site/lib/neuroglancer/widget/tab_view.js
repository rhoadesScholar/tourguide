import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Array$from from 'babel-runtime/core-js/array/from';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';

import { RefCounted } from '../util/disposable'; /**
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
 * @file Tabbed view widget.
 */

import { removeChildren, removeFromParent } from '../util/dom';
import { NullarySignal, Signal } from '../util/signal';
import { WatchableVisibilityPriority } from '../visibility_priority/frontend';
export var Tab = function (_RefCounted) {
    _inherits(Tab, _RefCounted);

    function Tab() {
        var visibility = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new WatchableVisibilityPriority();

        _classCallCheck(this, Tab);

        var _this = _possibleConstructorReturn(this, (Tab.__proto__ || _Object$getPrototypeOf(Tab)).call(this));

        _this.visibility = visibility;
        _this.element = document.createElement('div');
        var element = _this.element;

        element.classList.add('neuroglancer-tab-content');
        return _this;
    }

    _createClass(Tab, [{
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(Tab.prototype.__proto__ || _Object$getPrototypeOf(Tab.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'visible',
        get: function get() {
            return this.visibility.visible;
        }
    }]);

    return Tab;
}(RefCounted);
export var OptionSpecification = function (_RefCounted2) {
    _inherits(OptionSpecification, _RefCounted2);

    function OptionSpecification() {
        _classCallCheck(this, OptionSpecification);

        var _this2 = _possibleConstructorReturn(this, (OptionSpecification.__proto__ || _Object$getPrototypeOf(OptionSpecification)).apply(this, arguments));

        _this2.changed = new NullarySignal();
        _this2.options = new _Map();
        _this2.optionsChanged = new NullarySignal();
        _this2.selectedValue = undefined;
        _this2.defaultValue = undefined;
        _this2.ready_ = true;
        return _this2;
    }

    _createClass(OptionSpecification, [{
        key: 'add',
        value: function add(id, value) {
            var options = this.options;

            if (options.has(id)) {
                throw new Error('Option already defined: ' + _JSON$stringify(id) + '.');
            }
            options.set(id, value);
            this.optionsChanged.dispatch();
            if (this.defaultValue === undefined) {
                this.default = id;
            }
        }
    }, {
        key: 'toJSON',
        value: function toJSON() {
            var value = this.value,
                defaultValue = this.defaultValue;

            if (value === defaultValue) {
                return undefined;
            }
            return value;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.value = undefined;
        }
        /**
         * When `ready` is `false`, the selected `value` may be set to an unknown option.
         */

    }, {
        key: 'restoreState',
        value: function restoreState(obj) {
            if (typeof obj !== 'string') {
                obj = undefined;
            }
            this.value = obj;
        }
    }, {
        key: 'value',
        get: function get() {
            var selectedValue = this.selectedValue;

            if (selectedValue !== undefined) {
                return selectedValue;
            }
            return this.defaultValue;
        },
        set: function set(value) {
            if (value !== undefined && this.ready_ && !this.options.has(value)) {
                value = undefined;
            }
            var selectedValue = this.selectedValue;

            if (selectedValue !== value) {
                this.selectedValue = value;
                this.changed.dispatch();
            }
        }
    }, {
        key: 'default',
        set: function set(value) {
            if (this.defaultValue !== value) {
                this.defaultValue = value;
                this.changed.dispatch();
            }
        },
        get: function get() {
            return this.defaultValue;
        }
    }, {
        key: 'validValue',
        get: function get() {
            var value = this.selectedValue;
            if (value === undefined || !this.options.has(value)) {
                return this.defaultValue;
            }
            return value;
        }
    }, {
        key: 'ready',
        get: function get() {
            return this.ready_;
        },
        set: function set(value) {
            if (value !== this.ready_) {
                this.ready_ = value;
                if (value) {
                    this.value = this.value;
                }
                this.changed.dispatch();
            }
        }
    }]);

    return OptionSpecification;
}(RefCounted);
export var StackView = function (_RefCounted3) {
    _inherits(StackView, _RefCounted3);

    function StackView(getter) {
        var visibility = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new WatchableVisibilityPriority();

        _classCallCheck(this, StackView);

        var _this3 = _possibleConstructorReturn(this, (StackView.__proto__ || _Object$getPrototypeOf(StackView)).call(this));

        _this3.getter = getter;
        _this3.visibility = visibility;
        _this3.element = document.createElement('div');
        _this3.tabs = new _Map();
        _this3.tabVisibilityChanged = new Signal();
        var element = _this3.element;

        element.className = 'neuroglancer-stack-view';
        _this3.registerDisposer(visibility.changed.add(function () {
            return _this3.updateSelectedTab();
        }));
        _this3.updateSelectedTab();
        return _this3;
    }

    _createClass(StackView, [{
        key: 'invalidate',
        value: function invalidate(id) {
            var tabs = this.tabs;

            var tab = tabs.get(id);
            if (tab === undefined) {
                return;
            }
            tab.dispose();
            tabs.delete(id);
            if (id === this.displayedTab) {
                this.displayedTab = undefined;
                this.updateSelectedTab();
            }
        }
    }, {
        key: 'hideTab',
        value: function hideTab(id) {
            var tab = this.tabs.get(id);
            if (tab !== undefined) {
                tab.visibility.value = WatchableVisibilityPriority.IGNORED;
                tab.element.style.display = 'none';
            }
            this.tabVisibilityChanged.dispatch(id, false);
        }
    }, {
        key: 'showTab',
        value: function showTab(id) {
            var tabs = this.tabs;

            var tab = tabs.get(id);
            if (tab === undefined) {
                tab = this.getter(id);
                this.element.appendChild(tab.element);
                tabs.set(id, tab);
            }
            tab.element.style.display = null;
            tab.visibility.value = WatchableVisibilityPriority.VISIBLE;
            this.tabVisibilityChanged.dispatch(id, true);
        }
    }, {
        key: 'updateSelectedTab',
        value: function updateSelectedTab() {
            var displayedTab = this.displayedTab;

            var newTab = this.visible ? this.selectedTabValue : undefined;
            if (newTab === displayedTab) {
                return;
            }
            if (displayedTab !== undefined) {
                this.hideTab(displayedTab);
            }
            this.displayedTab = newTab;
            if (newTab === undefined) {
                return;
            }
            this.showTab(newTab);
        }
    }, {
        key: 'invalidateAll',
        value: function invalidateAll() {
            var tabs = this.tabs;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(tabs.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var tab = _step.value;

                    tab.dispose();
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

            tabs.clear();
            this.updateSelectedTab();
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            this.selectedTabValue = undefined;
            this.invalidateAll();
            removeFromParent(this.element);
            _get(StackView.prototype.__proto__ || _Object$getPrototypeOf(StackView.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'visible',
        get: function get() {
            return this.visibility.visible;
        }
    }, {
        key: 'selected',
        get: function get() {
            return this.selectedTabValue;
        },
        set: function set(id) {
            this.selectedTabValue = id;
            this.updateSelectedTab();
        }
    }]);

    return StackView;
}(RefCounted);
export var TabSpecification = function (_OptionSpecification) {
    _inherits(TabSpecification, _OptionSpecification);

    function TabSpecification() {
        _classCallCheck(this, TabSpecification);

        return _possibleConstructorReturn(this, (TabSpecification.__proto__ || _Object$getPrototypeOf(TabSpecification)).apply(this, arguments));
    }

    return TabSpecification;
}(OptionSpecification);
export var TabView = function (_RefCounted4) {
    _inherits(TabView, _RefCounted4);

    function TabView(state) {
        var visibility = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new WatchableVisibilityPriority();

        _classCallCheck(this, TabView);

        var _this5 = _possibleConstructorReturn(this, (TabView.__proto__ || _Object$getPrototypeOf(TabView)).call(this));

        _this5.state = state;
        _this5.visibility = visibility;
        _this5.element = document.createElement('div');
        _this5.tabBar = document.createElement('div');
        _this5.tabLabels = new _Map();
        _this5.tabsGeneration = -1;
        var element = _this5.element,
            tabBar = _this5.tabBar;

        element.className = 'neuroglancer-tab-view';
        tabBar.className = 'neuroglancer-tab-view-bar';
        element.appendChild(tabBar);
        // It is important to register our visibility changed handler before the StackView registers its
        // visibility changed handler, so that tab labels are created before tabVisibilityChanged
        // signals are received.
        _this5.registerDisposer(visibility.changed.add(function () {
            _this5.updateTabs();
        }));
        var stack = _this5.stack = _this5.registerDisposer(new StackView(function (id) {
            return _this5.state.options.get(id).getter();
        }, _this5.visibility));
        element.appendChild(stack.element);
        _this5.registerDisposer(_this5.state.changed.add(function () {
            return _this5.updateSelectedTab();
        }));
        _this5.registerDisposer(_this5.state.optionsChanged.add(function () {
            return _this5.updateTabs();
        }));
        _this5.stack.tabVisibilityChanged.add(function (id, visible) {
            var labelElement = _this5.tabLabels.get(id);
            var className = 'neuroglancer-selected-tab-label';
            if (visible) {
                labelElement.classList.add(className);
            } else {
                labelElement.classList.remove(className);
            }
        });
        _this5.updateTabs();
        return _this5;
    }

    _createClass(TabView, [{
        key: 'updateTabs',
        value: function updateTabs() {
            if (this.tabsGeneration !== this.state.optionsChanged.count) {
                this.destroyTabs();
                if (this.visible) {
                    this.makeTabs();
                }
                this.updateSelectedTab();
            }
        }
    }, {
        key: 'updateSelectedTab',
        value: function updateSelectedTab() {
            this.stack.selected = this.state.value;
        }
    }, {
        key: 'destroyTabs',
        value: function destroyTabs() {
            if (this.tabsGeneration === -1) {
                return;
            }
            this.stack.selected = undefined;
            this.tabLabels.clear();
            removeChildren(this.tabBar);
            this.tabsGeneration = -1;
            this.stack.invalidateAll();
        }
    }, {
        key: 'makeTabs',
        value: function makeTabs() {
            var _this6 = this;

            var tabBar = this.tabBar,
                tabLabels = this.tabLabels;

            var optionsArray = _Array$from(this.state.options);
            optionsArray.sort(function (_ref, _ref2) {
                var _ref4 = _slicedToArray(_ref, 2),
                    _ref4$1$order = _ref4[1].order,
                    aOrder = _ref4$1$order === undefined ? 0 : _ref4$1$order;

                var _ref3 = _slicedToArray(_ref2, 2),
                    _ref3$1$order = _ref3[1].order,
                    bOrder = _ref3$1$order === undefined ? 0 : _ref3$1$order;

                return aOrder - bOrder;
            });

            var _loop = function _loop(id, label) {
                var labelElement = document.createElement('div');
                labelElement.classList.add('neuroglancer-tab-label');
                labelElement.textContent = label;
                labelElement.addEventListener('click', function () {
                    _this6.state.value = id;
                });
                tabLabels.set(id, labelElement);
                tabBar.appendChild(labelElement);
            };

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(optionsArray), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _ref5 = _step2.value;

                    var _ref6 = _slicedToArray(_ref5, 2);

                    var id = _ref6[0];
                    var label = _ref6[1].label;

                    _loop(id, label);
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

            this.tabsGeneration = this.state.optionsChanged.count;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeChildren(this.tabBar);
            this.tabLabels.clear();
            removeFromParent(this.element);
            _get(TabView.prototype.__proto__ || _Object$getPrototypeOf(TabView.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'visible',
        get: function get() {
            return this.visibility.visible;
        }
    }]);

    return TabView;
}(RefCounted);
//# sourceMappingURL=tab_view.js.map