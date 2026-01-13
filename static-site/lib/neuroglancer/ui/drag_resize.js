import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';

import { RefCounted } from '../util/disposable'; /**
                                                  * @license
                                                  * Copyright 2019 Google Inc.
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

import { removeFromParent } from '../util/dom';
import { startRelativeMouseDrag } from '../util/mouse_drag';
export var DragResizablePanel = function (_RefCounted) {
    _inherits(DragResizablePanel, _RefCounted);

    function DragResizablePanel(element, visible, size, direction) {
        var minSize = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

        _classCallCheck(this, DragResizablePanel);

        var _this = _possibleConstructorReturn(this, (DragResizablePanel.__proto__ || _Object$getPrototypeOf(DragResizablePanel)).call(this));

        _this.element = element;
        _this.visible = visible;
        _this.size = size;
        _this.direction = direction;
        _this.minSize = minSize;
        _this.gutter = document.createElement('div');
        _this.sizeProp = _this.direction === 'horizontal' ? 'width' : 'height';
        var gutter = _this.gutter;

        gutter.className = 'neuroglancer-resize-gutter-' + direction;
        element.insertAdjacentElement('beforebegin', gutter);
        _this.registerDisposer(visible.changed.add(function () {
            return _this.updateView();
        }));
        _this.registerDisposer(size.changed.add(function () {
            return _this.updateView();
        }));
        var dragStart = function dragStart(event) {
            if ('button' in event && event.button !== 0) {
                return;
            }
            event.preventDefault();
            // Get initial size
            var initialRect = element.getBoundingClientRect();
            var size = initialRect[_this.sizeProp];
            var visibleCutoff = _this.minSize / 2;
            startRelativeMouseDrag(event, function (_event, deltaX, deltaY) {
                size -= direction === 'horizontal' ? deltaX : deltaY;
                if (size < visibleCutoff) {
                    _this.visible.value = false;
                } else if (_this.visible.value === false && size > visibleCutoff) {
                    _this.visible.value = true;
                }
                _this.size.value = Math.max(_this.minSize, size);
            });
        };
        _this.registerEventListener(gutter, 'pointerdown', dragStart);
        _this.updateView();
        return _this;
    }

    _createClass(DragResizablePanel, [{
        key: 'updateView',
        value: function updateView() {
            var element = this.element,
                gutter = this.gutter;
            var visible = this.visible;

            if (!visible.value) {
                element.style.display = 'none';
                gutter.style.display = 'none';
                return;
            }
            element.style.display = '';
            gutter.style.display = '';
            element.style[this.sizeProp] = Math.max(this.minSize, this.size.value) + 'px';
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.gutter);
            _get(DragResizablePanel.prototype.__proto__ || _Object$getPrototypeOf(DragResizablePanel.prototype), 'disposed', this).call(this);
        }
    }]);

    return DragResizablePanel;
}(RefCounted);
//# sourceMappingURL=drag_resize.js.map