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
/**
 * @file
 * Utilities for positioning dropdown menus.
 */
export function positionDropdown(dropdownElement, associatedElement) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$horizontal = _ref.horizontal,
        horizontal = _ref$horizontal === undefined ? false : _ref$horizontal,
        _ref$vertical = _ref.vertical,
        vertical = _ref$vertical === undefined ? true : _ref$vertical,
        _ref$topMargin = _ref.topMargin,
        topMargin = _ref$topMargin === undefined ? 6 : _ref$topMargin,
        _ref$bottomMargin = _ref.bottomMargin,
        bottomMargin = _ref$bottomMargin === undefined ? 6 : _ref$bottomMargin,
        _ref$leftMargin = _ref.leftMargin,
        leftMargin = _ref$leftMargin === undefined ? 6 : _ref$leftMargin,
        _ref$rightMargin = _ref.rightMargin,
        rightMargin = _ref$rightMargin === undefined ? 6 : _ref$rightMargin,
        _ref$maxHeight = _ref.maxHeight,
        maxHeight = _ref$maxHeight === undefined ? true : _ref$maxHeight,
        _ref$maxWidth = _ref.maxWidth,
        maxWidth = _ref$maxWidth === undefined ? true : _ref$maxWidth;

    var rect = associatedElement.getBoundingClientRect();
    if (horizontal) {
        var viewportWidth = dropdownElement.ownerDocument.documentElement.clientHeight;
        var distanceLeft = rect.right;
        var distanceRight = viewportWidth - rect.left;
        if (distanceLeft > distanceRight) {
            dropdownElement.style.left = '';
            dropdownElement.style.right = '0';
            if (maxWidth) {
                dropdownElement.style.maxWidth = distanceLeft - leftMargin + 'px';
            }
        } else {
            dropdownElement.style.right = '';
            dropdownElement.style.left = '0';
            if (maxWidth) {
                dropdownElement.style.maxWidth = distanceRight - rightMargin + 'px';
            }
        }
    }
    if (vertical) {
        var viewportHeight = dropdownElement.ownerDocument.documentElement.clientHeight;
        var distanceToTop = rect.top - topMargin;
        var distanceToBottom = viewportHeight - rect.bottom - bottomMargin;
        if (distanceToTop > distanceToBottom * 3) {
            dropdownElement.style.top = '';
            dropdownElement.style.bottom = '100%';
            if (maxHeight) {
                dropdownElement.style.maxHeight = distanceToTop + 'px';
            }
        } else {
            dropdownElement.style.top = '100%';
            dropdownElement.style.bottom = '';
            if (maxHeight) {
                dropdownElement.style.maxHeight = distanceToBottom + 'px';
            }
        }
    }
}
//# sourceMappingURL=dropdown.js.map