import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';

import { RefCounted } from '../util/disposable'; /**
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
/**
 * @file Facilities for creating tooltips.
 */

import { removeFromParent } from '../util/dom';
export var Tooltip = function (_RefCounted) {
    _inherits(Tooltip, _RefCounted);

    function Tooltip() {
        _classCallCheck(this, Tooltip);

        var _this = _possibleConstructorReturn(this, (Tooltip.__proto__ || _Object$getPrototypeOf(Tooltip)).call(this));

        _this.element = document.createElement('div');
        var element = _this.element;

        element.className = 'neuroglancer-tooltip';
        element.style.visibility = 'hidden';
        document.body.appendChild(element);
        return _this;
    }

    _createClass(Tooltip, [{
        key: 'updatePosition',
        value: function updatePosition(pageX, pageY) {
            var element = this.element;

            element.style.left = pageX + 'px';
            element.style.top = pageY + 'px';
            element.style.visibility = 'inherit';
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(Tooltip.prototype.__proto__ || _Object$getPrototypeOf(Tooltip.prototype), 'disposed', this).call(this);
        }
    }]);

    return Tooltip;
}(RefCounted);
//# sourceMappingURL=tooltip.js.map