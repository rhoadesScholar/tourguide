import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Map from 'babel-runtime/core-js/map';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
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
import { RefCounted } from '../util/disposable';
import { Uint64 } from '../util/uint64';

var temp = new Uint64();
export var SegmentSetWidget = function (_RefCounted) {
    _inherits(SegmentSetWidget, _RefCounted);

    function SegmentSetWidget(displayState) {
        _classCallCheck(this, SegmentSetWidget);

        var _this = _possibleConstructorReturn(this, (SegmentSetWidget.__proto__ || _Object$getPrototypeOf(SegmentSetWidget)).call(this));

        _this.displayState = displayState;
        _this.element = document.createElement('div');
        _this.clearButton = document.createElement('button');
        _this.itemContainer = document.createElement('span');
        _this.items = new _Map();
        var element = _this.element,
            clearButton = _this.clearButton,
            itemContainer = _this.itemContainer;

        element.className = 'segment-set-widget neuroglancer-noselect';
        clearButton.className = 'clear-button';
        clearButton.title = 'Remove all segment IDs';
        _this.registerEventListener(clearButton, 'click', function () {
            _this.visibleSegments.clear();
        });
        itemContainer.className = 'item-container';
        element.appendChild(itemContainer);
        itemContainer.appendChild(clearButton);
        _this.registerDisposer(displayState.visibleSegments.changed.add(function (x, add) {
            _this.handleSetChanged(x, add);
        }));
        _this.registerDisposer(displayState.segmentColorHash.changed.add(function () {
            _this.handleColorChanged();
        }));
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(displayState.visibleSegments), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var x = _step.value;

                _this.addElement(x.toString());
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

        _this.updateClearButtonVisibility();
        return _this;
    }

    _createClass(SegmentSetWidget, [{
        key: 'updateClearButtonVisibility',
        value: function updateClearButtonVisibility() {
            var clearButton = this.clearButton;

            clearButton.style.display = this.displayState.visibleSegments.size > 0 ? '' : 'none';
        }
    }, {
        key: 'handleSetChanged',
        value: function handleSetChanged(x, added) {
            this.updateClearButtonVisibility();
            var items = this.items;

            if (x === null) {
                // Cleared.
                var itemContainer = this.itemContainer,
                    clearButton = this.clearButton;

                while (true) {
                    var lastElement = itemContainer.lastElementChild;
                    if (lastElement === clearButton) {
                        break;
                    }
                    itemContainer.removeChild(lastElement);
                }
                items.clear();
            } else if (added) {
                this.addElement(x.toString());
            } else {
                var s = x.toString();
                var itemElement = items.get(s);
                itemElement.parentElement.removeChild(itemElement);
                items.delete(s);
            }
        }
    }, {
        key: 'addElement',
        value: function addElement(s) {
            var itemElement = document.createElement('button');
            itemElement.className = 'segment-button';
            itemElement.textContent = s;
            itemElement.title = 'Remove segment ID ' + s;
            var widget = this;
            itemElement.addEventListener('click', function () {
                temp.tryParseString(this.textContent);
                widget.visibleSegments.delete(temp);
            });
            itemElement.addEventListener('mouseenter', function () {
                temp.tryParseString(this.textContent);
                widget.segmentSelectionState.set(temp);
            });
            itemElement.addEventListener('mouseleave', function () {
                temp.tryParseString(this.textContent);
                widget.segmentSelectionState.set(null);
            });
            this.setItemColor(itemElement);
            this.itemContainer.appendChild(itemElement);
            this.items.set(s, itemElement);
        }
    }, {
        key: 'setItemColor',
        value: function setItemColor(itemElement) {
            temp.tryParseString(itemElement.textContent);
            itemElement.style.backgroundColor = this.segmentColorHash.computeCssColor(temp);
        }
    }, {
        key: 'handleColorChanged',
        value: function handleColorChanged() {
            var _this2 = this;

            this.items.forEach(function (itemElement) {
                _this2.setItemColor(itemElement);
            });
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            var element = this.element;
            var parentElement = element.parentElement;

            if (parentElement) {
                parentElement.removeChild(element);
            }
            _get(SegmentSetWidget.prototype.__proto__ || _Object$getPrototypeOf(SegmentSetWidget.prototype), 'disposed', this).call(this);
        }
    }, {
        key: 'visibleSegments',
        get: function get() {
            return this.displayState.visibleSegments;
        }
    }, {
        key: 'segmentColorHash',
        get: function get() {
            return this.displayState.segmentColorHash;
        }
    }, {
        key: 'segmentSelectionState',
        get: function get() {
            return this.displayState.segmentSelectionState;
        }
    }]);

    return SegmentSetWidget;
}(RefCounted);
//# sourceMappingURL=segment_set_widget.js.map