import _Math$sign from 'babel-runtime/core-js/math/sign';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { StatusMessage } from '../status';
import { animationFrameDebounce } from '../util/animation_frame_debounce';
import { setClipboard } from '../util/clipboard';
import { RefCounted } from '../util/disposable';
import { removeChildren, removeFromParent } from '../util/dom';
import { EventActionMap, registerActionListener } from '../util/event_action_map';
import { vec3 } from '../util/geom';
import { KeyboardEventBinder } from '../util/keyboard_bindings';
import { MouseEventBinder } from '../util/mouse_bindings';
import { numberToStringFixed } from '../util/number_to_string';
import { pickLengthUnit } from './scale_bar';

export var positionDragType = 'neuroglancer-position';
var inputEventMap = EventActionMap.fromObject({
    'tab': { action: 'tab-forward', preventDefault: false },
    'arrowup': { action: 'adjust-up' },
    'arrowdown': { action: 'adjust-down' },
    'wheel': { action: 'adjust-via-wheel' },
    'shift+tab': { action: 'tab-backward', preventDefault: false },
    'backspace': { action: 'delete-backward', preventDefault: false },
    'escape': { action: 'cancel' },
    'mouseup0': { action: 'select-all-if-was-not-focused', preventDefault: false }
});
var normalizedPrefixString = '  ';
var normalizedSeparatorString = ',   ';
export var PositionWidget = function (_RefCounted) {
    _inherits(PositionWidget, _RefCounted);

    function PositionWidget(position) {
        var maxNumberWidth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;

        _classCallCheck(this, PositionWidget);

        var _this = _possibleConstructorReturn(this, (PositionWidget.__proto__ || _Object$getPrototypeOf(PositionWidget)).call(this));

        _this.position = position;
        _this.maxNumberWidth = maxNumberWidth;
        _this.element = document.createElement('div');
        _this.inputContainer = document.createElement('div');
        _this.inputElement = document.createElement('input');
        _this.hintElement = document.createElement('input');
        _this.tempPosition = vec3.create();
        _this.updateHintScrollPosition = _this.registerCancellable(animationFrameDebounce(function () {
            _this.hintElement.scrollLeft = _this.inputElement.scrollLeft;
        }));
        var element = _this.element,
            inputElement = _this.inputElement,
            hintElement = _this.hintElement,
            inputContainer = _this.inputContainer;

        inputContainer.className = 'neuroglancer-position-widget-input-container';
        inputElement.className = 'neuroglancer-position-widget-input';
        hintElement.className = 'neuroglancer-position-widget-hint';
        _this.inputFieldWidth = maxNumberWidth * 3 + normalizedPrefixString.length + normalizedSeparatorString.length * 2 + 1;
        var _arr = [inputElement, hintElement];
        for (var _i = 0; _i < _arr.length; _i++) {
            var x = _arr[_i];
            x.spellcheck = false;
            x.autocomplete = 'off';
            x.type = 'text';
            x.style.width = _this.inputFieldWidth + 'ch';
        }
        hintElement.disabled = true;
        var copyButton = document.createElement('div');
        copyButton.textContent = '⧉';
        copyButton.className = 'neuroglancer-copy-button neuroglancer-button';
        copyButton.title = 'Copy position to clipboard';
        copyButton.addEventListener('click', function () {
            var result = setClipboard(_this.getPositionText());
            StatusMessage.showTemporaryMessage(result ? 'Position copied to clipboard' : 'Failed to copy position to clipboard');
        });
        copyButton.addEventListener('dragstart', function (event) {
            event.dataTransfer.setData(positionDragType, _JSON$stringify(position.toJSON()));
            event.dataTransfer.setData('text', _this.getPositionText());
            event.stopPropagation();
        });
        copyButton.draggable = true;
        element.appendChild(copyButton);
        element.appendChild(inputContainer);
        inputContainer.appendChild(inputElement);
        inputContainer.appendChild(hintElement);
        element.className = 'neuroglancer-position-widget';
        _this.registerDisposer(position.changed.add(_this.registerCancellable(animationFrameDebounce(function () {
            return _this.updateView();
        }))));
        var keyboardHandler = _this.registerDisposer(new KeyboardEventBinder(inputElement, inputEventMap));
        keyboardHandler.allShortcutsAreGlobal = true;
        _this.registerDisposer(new MouseEventBinder(inputElement, inputEventMap));
        _this.registerEventListener(inputElement, 'change', function () {
            return _this.updatePosition();
        });
        _this.registerEventListener(inputElement, 'blur', function () {
            return _this.updatePosition();
        });
        _this.registerEventListener(inputElement, 'input', function () {
            return _this.cleanInput();
        });
        _this.registerEventListener(inputElement, 'keydown', _this.updateHintScrollPosition);
        _this.registerEventListener(inputElement, 'copy', function (event) {
            var selectionStart = inputElement.selectionStart,
                selectionEnd = inputElement.selectionEnd;

            var selection = inputElement.value.substring(selectionStart || 0, selectionEnd || 0);
            selection = selection.trim().replace(/\s+/g, ' ');
            var clipboardData = event.clipboardData;

            if (clipboardData !== null) {
                clipboardData.setData('text/plain', selection);
            }
            event.stopPropagation();
            event.preventDefault();
        });
        var wasFocused = false;
        _this.registerEventListener(inputElement, 'mousedown', function () {
            wasFocused = document.activeElement === inputElement;
        });
        _this.registerDisposer(registerActionListener(inputElement, 'select-all-if-was-not-focused', function (event) {
            if (wasFocused) {
                return;
            }
            inputElement.selectionStart = 0;
            inputElement.selectionEnd = inputElement.value.length;
            inputElement.selectionDirection = 'forward';
            event.preventDefault();
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'tab-forward', function (event) {
            var selectionStart = Math.min(inputElement.selectionStart || 0, inputElement.selectionEnd || 0);
            var valueSubstring = inputElement.value.substring(selectionStart);
            var match = valueSubstring.match(/^([^,\s]*)((?:\s+)|(?:\s*,\s*))?([^,\s]*)/);
            if (match !== null) {
                // Already on a field.  Pick the next field.
                if (match[2] !== undefined) {
                    inputElement.selectionStart = selectionStart + match[1].length + match[2].length;
                    inputElement.selectionEnd = inputElement.selectionStart + match[3].length;
                    inputElement.selectionDirection = 'forward';
                    event.preventDefault();
                    return;
                }
            }
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'tab-backward', function (event) {
            var selectionEnd = Math.max(inputElement.selectionStart || 0, inputElement.selectionEnd || 0);
            var valueSubstring = inputElement.value.substring(0, selectionEnd);
            var match = valueSubstring.match(/([^,\s]*)((?:\s+)|(?:\s*,\s*))?([^,\s]*)$/);
            if (match !== null) {
                // Already on a field.  Pick the previous field.
                if (match[2] !== undefined) {
                    inputElement.selectionStart = match.index;
                    inputElement.selectionEnd = inputElement.selectionStart + match[1].length;
                    inputElement.selectionDirection = 'forward';
                    event.preventDefault();
                    return;
                }
            }
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'delete-backward', function (event) {
            if (inputElement.selectionStart === inputElement.selectionEnd && inputElement.selectionStart === inputElement.value.length) {
                var match = inputElement.value.match(/^(.*)(?![\s])(?:(?:\s+)|(?:\s*,\s*))$/);
                if (match !== null) {
                    inputElement.value = match[1];
                    _this.cleanInput();
                    event.preventDefault();
                    return;
                }
            }
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'cancel', function () {
            _this.updateView();
            _this.inputElement.blur();
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'adjust-via-wheel', function (actionEvent) {
            var event = actionEvent.detail;
            var deltaY = event.deltaY;

            if (deltaY === 0) {
                return;
            }
            var mouseCursorPosition = Math.ceil((inputElement.scrollLeft + event.offsetX - inputElement.clientLeft) / (inputElement.scrollWidth / _this.inputFieldWidth));
            _this.adjustFromCursor(mouseCursorPosition, -_Math$sign(deltaY));
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'adjust-up', function () {
            _this.adjustFromCursor(undefined, 1);
        }));
        _this.registerDisposer(registerActionListener(inputElement, 'adjust-down', function () {
            _this.adjustFromCursor(undefined, -1);
        }));
        _this.updateView();
        return _this;
    }

    _createClass(PositionWidget, [{
        key: 'adjustFromCursor',
        value: function adjustFromCursor(cursorPosition, adjustment) {
            var inputElement = this.inputElement;

            if (cursorPosition === undefined) {
                cursorPosition = (inputElement.selectionDirection === 'forward' ? inputElement.selectionEnd : inputElement.selectionStart) || 0;
            }
            if (this.cleanInput() === undefined) {
                return;
            }
            var substring = inputElement.value.substring(0, cursorPosition);
            var axisIndex = substring.split(',').length - 1;
            this.updatePosition();
            var voxelCoordinates = this.tempPosition;
            if (this.position.getVoxelCoordinates(voxelCoordinates)) {
                voxelCoordinates[axisIndex] += adjustment;
                this.position.setVoxelCoordinates(voxelCoordinates);
                this.updateView();
            }
        }
    }, {
        key: 'cleanInput',
        value: function cleanInput() {
            var s = this.inputElement.value;
            var cursorPosition = this.inputElement.selectionStart || 0;
            var numberPattern = /(-?\d+(?:\.(?:\d+)?)?)/.source;
            var separatorPattern = /((?:\s+(?![\s,]))|(?:\s*,\s*))/.source;
            var startAndEndPattern = /([\[\]{}()\s]*)/.source;
            var pattern = new RegExp('^' + startAndEndPattern + '(?![\\s])' + numberPattern + '?' + ('(?:' + separatorPattern + numberPattern + '?(?:' + separatorPattern + numberPattern + '?)?)?') + (startAndEndPattern + '$'));
            var match = s.match(pattern);
            if (match !== null) {
                var cleanInput = normalizedPrefixString;
                var hint = 'x ';
                var cleanCursor = 2;
                var curFieldStart = match[1].length;
                var processField = function processField(matchText) {
                    var replacementText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
                    var hintText = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

                    if (matchText === undefined) {
                        return;
                    }
                    var curFieldEnd = curFieldStart + matchText.length;
                    if (replacementText === undefined) {
                        replacementText = matchText;
                        hintText = ' '.repeat(replacementText.length);
                    }
                    if (cursorPosition >= curFieldStart) {
                        if (cursorPosition === curFieldEnd) {
                            cleanCursor = cleanInput.length + replacementText.length;
                        } else {
                            cleanCursor = cleanInput.length + Math.min(replacementText.length, cursorPosition - curFieldStart);
                        }
                    }
                    cleanInput += replacementText;
                    hint += hintText;
                    curFieldStart = curFieldEnd;
                };
                processField(match[2]);
                processField(match[3], normalizedSeparatorString, '  y ');
                processField(match[4]);
                processField(match[5], normalizedSeparatorString, '  z ');
                processField(match[6]);
                this.hintElement.value = hint;
                if (this.inputElement.value !== cleanInput) {
                    this.inputElement.value = cleanInput;
                    this.inputElement.selectionEnd = cleanCursor;
                    this.inputElement.selectionStart = cleanCursor;
                }
                this.updateHintScrollPosition();
                if (match[2] !== undefined && match[4] !== undefined && match[6] !== undefined) {
                    return {
                        position: vec3.set(this.tempPosition, parseFloat(match[2]), parseFloat(match[4]), parseFloat(match[6]))
                    };
                }
                return {};
            } else {
                this.hintElement.value = '';
            }
            return undefined;
        }
    }, {
        key: 'updatePosition',
        value: function updatePosition() {
            var cleanResult = this.cleanInput();
            if (cleanResult !== undefined && cleanResult.position !== undefined) {
                this.position.setVoxelCoordinates(cleanResult.position);
            }
        }
    }, {
        key: 'getPositionText',
        value: function getPositionText() {
            var position = this.position;

            var voxelPosition = this.tempPosition;
            if (position.getVoxelCoordinates(voxelPosition)) {
                return Math.floor(voxelPosition[0]) + ', ' + Math.floor(voxelPosition[1]) + ', ' + Math.floor(voxelPosition[2]);
            } else {
                return '<unspecified position>';
            }
        }
    }, {
        key: 'updateView',
        value: function updateView() {
            var position = this.position;

            var voxelPosition = this.tempPosition;
            if (position.getVoxelCoordinates(voxelPosition)) {
                var _inputElement = this.inputElement;

                var inputText = '  ' + Math.floor(voxelPosition[0]) + ',   ' + Math.floor(voxelPosition[1]) + ',   ' + Math.floor(voxelPosition[2]);
                var firstComma = inputText.indexOf(',');
                var secondComma = inputText.indexOf(',', firstComma + 1);
                var xLen = firstComma - 2;
                var yLen = secondComma - firstComma - 4;
                var hintText = 'x ' + ' '.repeat(xLen) + '  y ' + ' '.repeat(yLen) + '  z';
                var prevSelectionStart = _inputElement.selectionStart || 0;
                var prevSelectionEnd = _inputElement.selectionEnd || 0;
                var prevSelectionDirection = _inputElement.selectionDirection || undefined;
                _inputElement.value = inputText;
                _inputElement.setSelectionRange(prevSelectionStart, prevSelectionEnd, prevSelectionDirection);
                this.hintElement.value = hintText + ' '.repeat(inputText.length - hintText.length);
                this.updateHintScrollPosition();
            } else {
                this.inputElement.value = '';
                this.hintElement.value = '';
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(PositionWidget.prototype.__proto__ || _Object$getPrototypeOf(PositionWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return PositionWidget;
}(RefCounted);
export var VoxelSizeWidget = function (_RefCounted2) {
    _inherits(VoxelSizeWidget, _RefCounted2);

    function VoxelSizeWidget(element, voxelSize) {
        _classCallCheck(this, VoxelSizeWidget);

        var _this2 = _possibleConstructorReturn(this, (VoxelSizeWidget.__proto__ || _Object$getPrototypeOf(VoxelSizeWidget)).call(this));

        _this2.element = element;
        _this2.voxelSize = voxelSize;
        _this2.dimensionsContainer = document.createElement('span');
        _this2.unitsElement = document.createElement('span');
        var dimensionsContainer = _this2.dimensionsContainer,
            unitsElement = _this2.unitsElement;

        element.className = 'neuroglancer-voxel-size-widget';
        element.title = 'Voxel size';
        dimensionsContainer.className = 'neuroglancer-voxel-size-dimensions-container';
        element.appendChild(dimensionsContainer);
        element.appendChild(unitsElement);
        unitsElement.className = 'neuroglancer-voxel-size-units';
        _this2.registerDisposer(voxelSize.changed.add(_this2.registerCancellable(animationFrameDebounce(function () {
            return _this2.updateView();
        }))));
        _this2.updateView();
        return _this2;
    }

    _createClass(VoxelSizeWidget, [{
        key: 'updateView',
        value: function updateView() {
            var dimensionsContainer = this.dimensionsContainer,
                unitsElement = this.unitsElement;

            removeChildren(dimensionsContainer);
            if (!this.voxelSize.valid) {
                this.element.style.display = 'none';
            } else {
                this.element.style.display = null;
            }
            var size = this.voxelSize.size;

            var minVoxelSize = Math.min(size[0], size[1], size[2]);
            var unit = pickLengthUnit(minVoxelSize);
            unitsElement.textContent = unit.unit;
            for (var i = 0; i < 3; ++i) {
                var s = numberToStringFixed(size[i] / unit.lengthInNanometers, 2);
                var dimElement = document.createElement('span');
                dimElement.className = 'neuroglancer-voxel-size-dimension';
                dimElement.textContent = s;
                dimensionsContainer.appendChild(dimElement);
            }
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(VoxelSizeWidget.prototype.__proto__ || _Object$getPrototypeOf(VoxelSizeWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return VoxelSizeWidget;
}(RefCounted);
export var MousePositionWidget = function (_RefCounted3) {
    _inherits(MousePositionWidget, _RefCounted3);

    function MousePositionWidget(element, mouseState, voxelSize) {
        _classCallCheck(this, MousePositionWidget);

        var _this3 = _possibleConstructorReturn(this, (MousePositionWidget.__proto__ || _Object$getPrototypeOf(MousePositionWidget)).call(this));

        _this3.element = element;
        _this3.mouseState = mouseState;
        _this3.voxelSize = voxelSize;
        _this3.tempPosition = vec3.create();
        element.className = 'neuroglancer-mouse-position-widget';
        var updateViewFunction = _this3.registerCancellable(animationFrameDebounce(function () {
            return _this3.updateView();
        }));
        _this3.registerDisposer(mouseState.changed.add(updateViewFunction));
        _this3.registerDisposer(voxelSize.changed.add(updateViewFunction));
        return _this3;
    }

    _createClass(MousePositionWidget, [{
        key: 'updateView',
        value: function updateView() {
            var text = '';
            var mouseState = this.mouseState,
                voxelSize = this.voxelSize;

            if (mouseState.active && voxelSize.valid) {
                var p = this.tempPosition;
                voxelSize.voxelFromSpatial(p, mouseState.position);
                text = 'x ' + Math.floor(p[0]) + ',  y ' + Math.floor(p[1]) + ',  z ' + Math.floor(p[2]);
            }
            this.element.textContent = text;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(MousePositionWidget.prototype.__proto__ || _Object$getPrototypeOf(MousePositionWidget.prototype), 'disposed', this).call(this);
        }
    }]);

    return MousePositionWidget;
}(RefCounted);
//# sourceMappingURL=position_widget.js.map