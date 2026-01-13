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
export function scrollIntoViewIfNeeded(element) {
    var parent = element.parentElement;
    var elementLeft = element.offsetLeft - parent.clientLeft;
    var elementTop = element.offsetTop - parent.clientTop;
    var elementRight = elementLeft + element.offsetWidth;
    var elementBottom = elementTop + element.offsetHeight;
    var parentWidth = parent.clientWidth;
    var parentHeight = parent.clientHeight;
    var viewportLeft = parent.scrollLeft;
    var viewportRight = viewportLeft + parentWidth;
    var viewportTop = parent.scrollTop;
    var viewportBottom = viewportTop + parentHeight;
    var scrollLeftDelta = Math.max(0.0, elementRight - viewportRight) || Math.min(0.0, elementLeft - viewportLeft);
    var scrollTopDelta = Math.max(0.0, elementBottom - viewportBottom) || Math.min(0.0, elementTop - viewportTop);
    parent.scrollLeft += scrollLeftDelta;
    parent.scrollTop += scrollTopDelta;
}
//# sourceMappingURL=scroll_into_view.js.map