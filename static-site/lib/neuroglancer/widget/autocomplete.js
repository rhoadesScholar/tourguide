import _regeneratorRuntime from 'babel-runtime/regenerator';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _Symbol from 'babel-runtime/core-js/symbol';
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
import debounce from 'lodash/debounce';
import { CancellationTokenSource } from '../util/cancellation';
import { RefCounted } from '../util/disposable';
import { removeChildren, removeFromParent } from '../util/dom';
import { positionDropdown } from '../util/dropdown';
import { EventActionMap, KeyboardEventBinder, registerActionListener } from '../util/keyboard_bindings';
import { longestCommonPrefix } from '../util/longest_common_prefix';
import { scrollIntoViewIfNeeded } from '../util/scroll_into_view';
import { Signal } from '../util/signal';
import { associateLabelWithElement } from './associate_label';

var ACTIVE_COMPLETION_CLASS_NAME = 'autocomplete-completion-active';
var AUTOCOMPLETE_INDEX_SYMBOL = _Symbol('autocompleteIndex');
export function makeDefaultCompletionElement(completion) {
    var element = document.createElement('div');
    element.textContent = completion.value;
    return element;
}
export function makeCompletionElementWithDescription(completion) {
    var element = document.createElement('div');
    element.className = 'autocomplete-completion-with-description';
    element.textContent = completion.value;
    var descriptionElement = document.createElement('div');
    descriptionElement.className = 'autocomplete-completion-description';
    descriptionElement.textContent = completion.description || '';
    element.appendChild(descriptionElement);
    return element;
}
var keyMap = EventActionMap.fromObject({
    'arrowdown': { action: 'cycle-next-active-completion' },
    'arrowup': { action: 'cycle-prev-active-completion' },
    'tab': { action: 'choose-active-completion-or-prefix', preventDefault: false },
    'enter': { action: 'choose-active-completion', preventDefault: false },
    'escape': { action: 'cancel', preventDefault: false, stopPropagation: false }
});
var DEFAULT_COMPLETION_DELAY = 200; // milliseconds
export var AutocompleteTextInput = function (_RefCounted) {
    _inherits(AutocompleteTextInput, _RefCounted);

    function AutocompleteTextInput(options) {
        _classCallCheck(this, AutocompleteTextInput);

        var _this = _possibleConstructorReturn(this, (AutocompleteTextInput.__proto__ || _Object$getPrototypeOf(AutocompleteTextInput)).call(this));

        _this.inputChanged = new Signal();
        _this.prevInputValue = '';
        _this.completionsVisible = false;
        _this.activeCompletionPromise = null;
        _this.activeCompletionCancellationToken = undefined;
        _this.hasFocus = false;
        _this.completionResult = null;
        _this.dropdownContentsStale = true;
        _this.updateHintScrollPositionTimer = null;
        _this.completionElements = null;
        _this.hasResultForDropdown = false;
        _this.commonPrefix = '';
        /**
         * Index of the active completion.  The active completion is displayed as the hint text and is
         * highlighted in the dropdown.
         */
        _this.activeIndex = -1;
        _this.dropdownStyleStale = true;
        _this.completer = options.completer;
        var _options$delay = options.delay,
            delay = _options$delay === undefined ? DEFAULT_COMPLETION_DELAY : _options$delay;

        var debouncedCompleter = _this.scheduleUpdateCompletions = debounce(function () {
            var cancellationToken = _this.activeCompletionCancellationToken = new CancellationTokenSource();
            var activeCompletionPromise = _this.activeCompletionPromise = _this.completer(_this.value, cancellationToken);
            if (activeCompletionPromise !== null) {
                activeCompletionPromise.then(function (completionResult) {
                    if (_this.activeCompletionPromise === activeCompletionPromise) {
                        _this.setCompletions(completionResult);
                        _this.activeCompletionPromise = null;
                    }
                });
            }
        }, delay);
        _this.registerDisposer(function () {
            debouncedCompleter.cancel();
        });
        var element = _this.element = document.createElement('div');
        element.className = 'autocomplete';
        var dropdownAndInputWrapper = document.createElement('div');
        dropdownAndInputWrapper.className = 'autocomplete-dropdown-wrapper';
        var dropdownElement = _this.dropdownElement = document.createElement('div');
        dropdownElement.className = 'autocomplete-dropdown';
        var promptElement = _this.promptElement = document.createElement('label');
        promptElement.className = 'autocomplete-prompt';
        var inputWrapperElement = _this.inputWrapperElement = document.createElement('div');
        inputWrapperElement.className = 'autocomplete-input-wrapper';
        element.appendChild(promptElement);
        var inputElement = _this.inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.autocomplete = 'off';
        inputElement.spellcheck = false;
        inputElement.className = 'autocomplete-input';
        associateLabelWithElement(promptElement, inputElement);
        var hintElement = _this.hintElement = document.createElement('input');
        hintElement.type = 'text';
        hintElement.spellcheck = false;
        hintElement.className = 'autocomplete-hint';
        hintElement.disabled = true;
        inputWrapperElement.appendChild(hintElement);
        inputWrapperElement.appendChild(inputElement);
        dropdownAndInputWrapper.appendChild(inputWrapperElement);
        dropdownAndInputWrapper.appendChild(dropdownElement);
        element.appendChild(dropdownAndInputWrapper);
        _this.registerInputHandler();
        _this.handleInputChanged('');
        _this.registerEventListener(_this.inputElement, 'focus', function () {
            if (!_this.hasFocus) {
                _this.hasFocus = true;
                _this.dropdownStyleStale = true;
                _this.updateDropdown();
            }
        });
        _this.registerEventListener(_this.inputElement, 'blur', function () {
            if (_this.hasFocus) {
                _this.hasFocus = false;
                _this.updateDropdown();
            }
        });
        _this.registerEventListener(element.ownerDocument.defaultView, 'resize', function () {
            _this.dropdownStyleStale = true;
        });
        _this.registerEventListener(element.ownerDocument.defaultView, 'scroll', function () {
            _this.dropdownStyleStale = true;
        });
        _this.registerEventListener(_this.dropdownElement, 'mousedown', _this.handleDropdownMousedown.bind(_this));
        _this.registerEventListener(_this.inputElement, 'keydown', function () {
            // User may have used a keyboard shortcut to scroll the input.
            _this.hintScrollPositionMayBeStale();
        });
        _this.registerEventListener(_this.inputElement, 'mousemove', function (event) {
            if (event.buttons !== 0) {
                // May be dragging the text, which could cause scrolling.  This is not perfect, because we
                // don't detect mouse movements outside of the input box.
                _this.hintScrollPositionMayBeStale();
            }
        });
        var keyboardHandler = _this.registerDisposer(new KeyboardEventBinder(inputElement, keyMap));
        keyboardHandler.allShortcutsAreGlobal = true;
        registerActionListener(inputElement, 'cycle-next-active-completion', function () {
            _this.cycleActiveCompletion(+1);
        });
        registerActionListener(inputElement, 'cycle-prev-active-completion', function () {
            _this.cycleActiveCompletion(-1);
        });
        registerActionListener(inputElement, 'choose-active-completion-or-prefix', function (event) {
            if (_this.selectActiveCompletion( /*allowPrefix=*/true)) {
                event.preventDefault();
            }
        });
        registerActionListener(inputElement, 'choose-active-completion', function (event) {
            if (_this.selectActiveCompletion( /*allowPrefix=*/false)) {
                event.preventDefault();
            }
        });
        registerActionListener(inputElement, 'cancel', function (event) {
            event.stopPropagation();
            if (_this.cancel()) {
                event.detail.preventDefault();
                event.detail.stopPropagation();
            }
        });
        return _this;
    }

    _createClass(AutocompleteTextInput, [{
        key: 'hintScrollPositionMayBeStale',
        value: function hintScrollPositionMayBeStale() {
            if (this.hintElement.value !== '') {
                this.scheduleUpdateHintScrollPosition();
            }
        }
    }, {
        key: 'handleDropdownMousedown',
        value: function handleDropdownMousedown(event) {
            this.inputElement.focus();
            var dropdownElement = this.dropdownElement;

            for (var target = event.target; target instanceof HTMLElement; target = target.parentElement) {
                var index = target[AUTOCOMPLETE_INDEX_SYMBOL];
                if (index !== undefined) {
                    this.selectCompletion(index);
                    break;
                }
                if (target === dropdownElement) {
                    break;
                }
            }
            event.preventDefault();
        }
    }, {
        key: 'cycleActiveCompletion',
        value: function cycleActiveCompletion(delta) {
            if (this.completionResult === null) {
                return;
            }
            var activeIndex = this.activeIndex;

            var numCompletions = this.completionResult.completions.length;
            if (activeIndex === -1) {
                if (delta > 0) {
                    activeIndex = 0;
                } else {
                    activeIndex = numCompletions - 1;
                }
            } else {
                activeIndex = (activeIndex + delta + numCompletions) % numCompletions;
            }
            this.setActiveIndex(activeIndex);
        }
    }, {
        key: 'registerInputHandler',
        value: function registerInputHandler() {
            var _this2 = this;

            var handler = function handler(_event) {
                var value = _this2.inputElement.value;
                if (value !== _this2.prevInputValue) {
                    _this2.prevInputValue = value;
                    _this2.handleInputChanged(value);
                }
            };
            var _arr = ['input'];
            for (var _i = 0; _i < _arr.length; _i++) {
                var eventType = _arr[_i];
                this.registerEventListener(this.inputElement, eventType, handler, /*useCapture=*/false);
            }
        }
    }, {
        key: 'shouldShowDropdown',
        value: function shouldShowDropdown() {
            var completionResult = this.completionResult;

            if (completionResult === null || !this.hasFocus) {
                return false;
            }
            return this.hasResultForDropdown;
        }
    }, {
        key: 'updateDropdownStyle',
        value: function updateDropdownStyle() {
            var dropdownElement = this.dropdownElement,
                inputElement = this.inputElement;

            positionDropdown(dropdownElement, inputElement, { horizontal: false });
            this.dropdownStyleStale = false;
        }
    }, {
        key: 'updateDropdown',
        value: function updateDropdown() {
            if (this.shouldShowDropdown()) {
                var dropdownElement = this.dropdownElement;
                var activeIndex = this.activeIndex;

                if (this.dropdownContentsStale) {
                    var completionResult = this.completionResult;
                    var _completionResult$mak = completionResult.makeElement,
                        makeElement = _completionResult$mak === undefined ? makeDefaultCompletionElement : _completionResult$mak;

                    this.completionElements = completionResult.completions.map(function (completion, index) {
                        var completionElement = makeElement.call(completionResult, completion);
                        completionElement[AUTOCOMPLETE_INDEX_SYMBOL] = index;
                        completionElement.classList.add('autocomplete-completion');
                        if (activeIndex === index) {
                            completionElement.classList.add(ACTIVE_COMPLETION_CLASS_NAME);
                        }
                        dropdownElement.appendChild(completionElement);
                        return completionElement;
                    });
                    this.dropdownContentsStale = false;
                }
                if (this.dropdownStyleStale) {
                    this.updateDropdownStyle();
                }
                if (!this.completionsVisible) {
                    dropdownElement.style.display = 'block';
                    this.completionsVisible = true;
                }
                if (activeIndex !== -1) {
                    var completionElement = this.completionElements[activeIndex];
                    scrollIntoViewIfNeeded(completionElement);
                }
            } else if (this.completionsVisible) {
                this.dropdownElement.style.display = 'none';
                this.completionsVisible = false;
            }
        }
    }, {
        key: 'setCompletions',
        value: function setCompletions(completionResult) {
            this.clearCompletions();
            var completions = completionResult.completions;

            if (completions.length === 0) {
                return;
            }
            this.completionResult = completionResult;
            if (completions.length === 1) {
                var completion = completions[0];
                if (completionResult.showSingleResult) {
                    this.hasResultForDropdown = true;
                } else {
                    var value = this.prevInputValue;
                    if (!completion.value.startsWith(value)) {
                        this.hasResultForDropdown = true;
                    } else {
                        this.hasResultForDropdown = false;
                    }
                }
                if (completionResult.selectSingleResult) {
                    this.setActiveIndex(0);
                } else {
                    this.setHintValue(this.getCompletedValueByIndex(0));
                }
            } else {
                this.hasResultForDropdown = true;
                // Check for a common prefix.
                var commonResultPrefix = longestCommonPrefix( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _completion;

                    return _regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    _iteratorNormalCompletion = true;
                                    _didIteratorError = false;
                                    _iteratorError = undefined;
                                    _context.prev = 3;
                                    _iterator = _getIterator(completionResult.completions);

                                case 5:
                                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                                        _context.next = 12;
                                        break;
                                    }

                                    _completion = _step.value;
                                    _context.next = 9;
                                    return _completion.value;

                                case 9:
                                    _iteratorNormalCompletion = true;
                                    _context.next = 5;
                                    break;

                                case 12:
                                    _context.next = 18;
                                    break;

                                case 14:
                                    _context.prev = 14;
                                    _context.t0 = _context['catch'](3);
                                    _didIteratorError = true;
                                    _iteratorError = _context.t0;

                                case 18:
                                    _context.prev = 18;
                                    _context.prev = 19;

                                    if (!_iteratorNormalCompletion && _iterator.return) {
                                        _iterator.return();
                                    }

                                case 21:
                                    _context.prev = 21;

                                    if (!_didIteratorError) {
                                        _context.next = 24;
                                        break;
                                    }

                                    throw _iteratorError;

                                case 24:
                                    return _context.finish(21);

                                case 25:
                                    return _context.finish(18);

                                case 26:
                                case 'end':
                                    return _context.stop();
                            }
                        }
                    }, _callee, this, [[3, 14, 18, 26], [19,, 21, 25]]);
                })());
                var commonPrefix = this.getCompletedValue(commonResultPrefix);
                var _value = this.prevInputValue;
                if (commonPrefix.startsWith(_value)) {
                    this.commonPrefix = commonPrefix;
                    this.setHintValue(commonPrefix);
                }
            }
            this.updateDropdown();
        }
    }, {
        key: 'scheduleUpdateHintScrollPosition',
        value: function scheduleUpdateHintScrollPosition() {
            var _this3 = this;

            if (this.updateHintScrollPositionTimer === null) {
                this.updateHintScrollPositionTimer = setTimeout(function () {
                    _this3.updateHintScrollPosition();
                }, 0);
            }
        }
    }, {
        key: 'setHintValue',
        value: function setHintValue(hintValue) {
            var value = this.prevInputValue;
            if (hintValue === value || !hintValue.startsWith(value)) {
                // If the hint value is identical to the current value, there is no need to show it.  Also,
                // if it is not a prefix of the current value, then we cannot show it either.
                hintValue = '';
            }
            this.hintElement.value = hintValue;
            this.scheduleUpdateHintScrollPosition();
        }
        /**
         * This sets the active completion, which causes it to be highlighted and displayed as the hint.
         * Additionally, if the user hits tab then it is chosen.
         */

    }, {
        key: 'setActiveIndex',
        value: function setActiveIndex(index) {
            if (!this.dropdownContentsStale) {
                var activeIndex = this.activeIndex;

                if (activeIndex !== -1) {
                    this.completionElements[activeIndex].classList.remove(ACTIVE_COMPLETION_CLASS_NAME);
                }
                if (index !== -1) {
                    var completionElement = this.completionElements[index];
                    completionElement.classList.add(ACTIVE_COMPLETION_CLASS_NAME);
                    scrollIntoViewIfNeeded(completionElement);
                }
            }
            if (index !== -1) {
                this.setHintValue(this.getCompletedValueByIndex(index));
            }
            this.activeIndex = index;
        }
    }, {
        key: 'getCompletedValueByIndex',
        value: function getCompletedValueByIndex(index) {
            return this.getCompletedValue(this.completionResult.completions[index].value);
        }
    }, {
        key: 'getCompletedValue',
        value: function getCompletedValue(completionValue) {
            var completionResult = this.completionResult;
            var value = this.prevInputValue;
            return value.substring(0, completionResult.offset) + completionValue;
        }
    }, {
        key: 'selectActiveCompletion',
        value: function selectActiveCompletion(allowPrefix) {
            var activeIndex = this.activeIndex;

            if (activeIndex === -1) {
                if (!allowPrefix) {
                    return false;
                }
                var completionResult = this.completionResult;

                if (completionResult !== null && completionResult.completions.length === 1) {
                    activeIndex = 0;
                } else {
                    var commonPrefix = this.commonPrefix;

                    if (commonPrefix.length > this.value.length) {
                        this.value = commonPrefix;
                        return true;
                    }
                    return false;
                }
            }
            var newValue = this.getCompletedValueByIndex(activeIndex);
            if (this.value === newValue) {
                return false;
            }
            this.value = newValue;
            return true;
        }
    }, {
        key: 'selectCompletion',
        value: function selectCompletion(index) {
            this.value = this.getCompletedValueByIndex(index);
        }
        /**
         * Called when user presses escape.  Does nothing here, but may be overridden in a subclass.
         */

    }, {
        key: 'cancel',
        value: function cancel() {
            return false;
        }
        /**
         * Updates the hintElement scroll position to match the scroll position of inputElement.
         *
         * This is called asynchronously after the input changes because automatic scrolling appears to
         * take place after the 'input' event fires.
         */

    }, {
        key: 'updateHintScrollPosition',
        value: function updateHintScrollPosition() {
            this.updateHintScrollPositionTimer = null;
            this.hintElement.scrollLeft = this.inputElement.scrollLeft;
        }
    }, {
        key: 'cancelActiveCompletion',
        value: function cancelActiveCompletion() {
            var token = this.activeCompletionCancellationToken;
            if (token !== undefined) {
                token.cancel();
            }
            this.activeCompletionCancellationToken = undefined;
            this.activeCompletionPromise = null;
        }
    }, {
        key: 'handleInputChanged',
        value: function handleInputChanged(value) {
            this.cancelActiveCompletion();
            this.hintElement.value = '';
            this.clearCompletions();
            this.inputChanged.dispatch(value);
            this.scheduleUpdateCompletions();
        }
    }, {
        key: 'clearCompletions',
        value: function clearCompletions() {
            if (this.completionResult !== null) {
                this.activeIndex = -1;
                this.completionResult = null;
                this.completionElements = null;
                this.dropdownContentsStale = true;
                this.dropdownStyleStale = true;
                this.commonPrefix = '';
                removeChildren(this.dropdownElement);
                this.updateDropdown();
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            this.cancelActiveCompletion();
            if (this.updateHintScrollPositionTimer !== null) {
                clearTimeout(this.updateHintScrollPositionTimer);
                this.updateHintScrollPositionTimer = null;
            }
            _get(AutocompleteTextInput.prototype.__proto__ || _Object$getPrototypeOf(AutocompleteTextInput.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'disabled',
        get: function get() {
            return this.inputElement.readOnly;
        },
        set: function set(value) {
            this.inputElement.readOnly = value;
        }
    }, {
        key: 'value',
        get: function get() {
            return this.prevInputValue;
        },
        set: function set(value) {
            if (value !== this.prevInputValue) {
                this.inputElement.value = value;
                this.prevInputValue = value;
                this.handleInputChanged(value);
            }
        }
    }]);

    return AutocompleteTextInput;
}(RefCounted);
//# sourceMappingURL=autocomplete.js.map