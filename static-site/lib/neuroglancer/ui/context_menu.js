import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { RefCounted, registerEventListener } from '../util/disposable';
import { removeFromParent } from '../util/dom';
import { NullarySignal } from '../util/signal';

export function positionContextMenu(menu, event) {
    var offsetWidth = menu.offsetWidth,
        offsetHeight = menu.offsetHeight;

    var viewportWidth = document.documentElement.clientWidth;
    var viewportHeight = document.documentElement.clientHeight;
    var posX = document.documentElement.scrollLeft + Math.min(viewportWidth - offsetWidth, event.clientX);
    var posY = document.documentElement.scrollTop + Math.min(viewportHeight - offsetHeight, event.clientY);
    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
    menu.style.visibility = null;
}
export var ContextMenu = function (_RefCounted) {
    _inherits(ContextMenu, _RefCounted);

    function ContextMenu(parent) {
        _classCallCheck(this, ContextMenu);

        var _this = _possibleConstructorReturn(this, (ContextMenu.__proto__ || _Object$getPrototypeOf(ContextMenu)).call(this));

        _this.element = document.createElement('div');
        _this.parentDisposers = new _Map();
        _this.disabledValue = false;
        _this.opened = new NullarySignal();
        _this.closed = new NullarySignal();
        var element = _this.element;

        element.className = 'neuroglancer-context-menu';
        element.style.visibility = 'hidden';
        element.tabIndex = -1;
        var el = document.getElementById('neuroglancer-container');
        if (el) {
            el.appendChild(element);
        } else {
            document.body.appendChild(element);
        }
        if (parent !== undefined) {
            _this.registerParent(parent);
        }
        return _this;
    }

    _createClass(ContextMenu, [{
        key: 'registerParent',
        value: function registerParent(parent) {
            var _this2 = this;

            var parentDisposers = this.parentDisposers;

            if (parentDisposers.has(parent)) {
                return;
            }
            parentDisposers.set(parent, registerEventListener(parent, 'contextmenu', function (event) {
                _this2.show(event);
                event.stopPropagation();
                event.preventDefault();
            }));
        }
    }, {
        key: 'show',
        value: function show(originalEvent) {
            var _this3 = this;

            if (this.disabledValue) {
                return;
            }
            this.hide();
            var element = this.element;

            var mousedownDisposer = registerEventListener(document, 'mousedown', function (event) {
                if (event.target instanceof Node && !element.contains(event.target)) {
                    _this3.hide();
                }
            }, /*capture=*/true);
            var keydownDisposer = registerEventListener(document, 'keydown', function (event) {
                if (event.code === 'Escape') {
                    _this3.hide();
                }
            }, /*capture=*/true);
            var menuDisposer = function menuDisposer() {
                keydownDisposer();
                mousedownDisposer();
                element.style.display = 'none';
            };
            element.style.display = null;
            element.style.visibility = 'hidden';
            this.opened.dispatch();
            positionContextMenu(element, originalEvent);
            this.menuDisposer = menuDisposer;
        }
    }, {
        key: 'unregisterParent',
        value: function unregisterParent(parent) {
            var parentDisposers = this.parentDisposers;

            var disposer = parentDisposers.get(parent);
            if (disposer !== undefined) {
                disposer();
                parentDisposers.delete(parent);
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var parentDisposers = this.parentDisposers;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(parentDisposers.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var disposer = _step.value;

                    disposer();
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

            parentDisposers.clear();
            removeFromParent(this.element);
        }
    }, {
        key: 'hide',
        value: function hide() {
            if (this.menuDisposer !== undefined) {
                this.menuDisposer();
                this.menuDisposer = undefined;
                this.closed.dispatch();
            }
        }
    }, {
        key: 'disabled',
        get: function get() {
            return this.disabledValue;
        },
        set: function set(value) {
            if (this.disabledValue !== value) {
                this.disabledValue = value;
                if (value) {
                    this.hide();
                }
            }
        }
    }, {
        key: 'open',
        get: function get() {
            return this.menuDisposer !== undefined;
        }
    }]);

    return ContextMenu;
}(RefCounted);
//# sourceMappingURL=context_menu.js.map