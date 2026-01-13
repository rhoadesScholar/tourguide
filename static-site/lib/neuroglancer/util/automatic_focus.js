import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
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
import debounce from 'lodash/debounce';
import { RefCounted } from './disposable';
import LinkedListOperations from './linked_list.0';

var AutomaticFocusList = function AutomaticFocusList() {
    _classCallCheck(this, AutomaticFocusList);

    LinkedListOperations.initializeHead(this);
};

var automaticFocusList = new AutomaticFocusList();
var maybeUpdateFocus = debounce(function () {
    var _document = document,
        activeElement = _document.activeElement;

    if (activeElement === null || activeElement === document.body) {
        var node = LinkedListOperations.front(automaticFocusList);
        if (node !== null) {
            node.element.focus();
        }
    }
});
window.addEventListener('focus', function () {
    maybeUpdateFocus();
}, true);
window.addEventListener('blur', function () {
    maybeUpdateFocus();
}, true);
export var AutomaticallyFocusedElement = function (_RefCounted) {
    _inherits(AutomaticallyFocusedElement, _RefCounted);

    function AutomaticallyFocusedElement(element) {
        _classCallCheck(this, AutomaticallyFocusedElement);

        var _this = _possibleConstructorReturn(this, (AutomaticallyFocusedElement.__proto__ || _Object$getPrototypeOf(AutomaticallyFocusedElement)).call(this));

        _this.element = element;
        _this.prev0 = null;
        _this.next0 = null;
        _this.lastFocusedElement = null;
        _this.scheduleUpdateFocus = _this.registerCancellable(debounce(function () {
            var _document2 = document,
                activeElement = _document2.activeElement;
            var element = _this.element;

            if (element.contains(activeElement)) {
                // Never steal focus from descendant.
                return;
            }
            if (activeElement != null && (activeElement === _this.lastFocusedElement || activeElement.contains(element))) {
                _this.element.focus();
            }
            _this.lastFocusedElement = null;
        }, 0));
        element.tabIndex = -1;
        _this.registerEventListener(element, 'mouseenter', function () {
            _this.lastFocusedElement = document.activeElement;
            _this.scheduleUpdateFocus();
        });
        _this.registerEventListener(element, 'mouseleave', function () {
            _this.scheduleUpdateFocus.cancel();
        });
        // Insert at the end of the list.
        LinkedListOperations.insertBefore(automaticFocusList, _this);
        _this.registerEventListener(element, 'focus', function () {
            // Move to the beginning of the list.
            LinkedListOperations.pop(_this);
            LinkedListOperations.insertAfter(automaticFocusList, _this);
        });
        maybeUpdateFocus();
        return _this;
    }

    _createClass(AutomaticallyFocusedElement, [{
        key: 'disposed',
        value: function disposed() {
            LinkedListOperations.pop(this);
            _get(AutomaticallyFocusedElement.prototype.__proto__ || _Object$getPrototypeOf(AutomaticallyFocusedElement.prototype), 'disposed', this).call(this);
        }
    }]);

    return AutomaticallyFocusedElement;
}(RefCounted);
//# sourceMappingURL=automatic_focus.js.map