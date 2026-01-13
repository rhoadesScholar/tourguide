import _getIterator from 'babel-runtime/core-js/get-iterator';
import _get from 'babel-runtime/helpers/get';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
 * @file Side panel for displaying/editing layer details.
 */

import { removeFromParent } from '../util/dom';
import { WatchableVisibilityPriority } from '../visibility_priority/frontend';
import { makeCloseButton } from '../widget/close_button';
import { StackView, Tab, TabView } from '../widget/tab_view';

var UserLayerInfoPanel = function (_Tab) {
    _inherits(UserLayerInfoPanel, _Tab);

    function UserLayerInfoPanel(layer) {
        _classCallCheck(this, UserLayerInfoPanel);

        var _this = _possibleConstructorReturn(this, (UserLayerInfoPanel.__proto__ || _Object$getPrototypeOf(UserLayerInfoPanel)).call(this));

        _this.layer = layer;
        _this.tabView = new TabView(_this.layer.tabs.addRef(), _this.visibility);
        _this.element.appendChild(_this.tabView.element);
        _this.element.classList.add('neuroglancer-layer-side-panel-info-panel');
        _this.tabView.element.style.flex = '1';
        return _this;
    }

    return UserLayerInfoPanel;
}(Tab);

var EmptyUserLayerInfoPanel = function (_Tab2) {
    _inherits(EmptyUserLayerInfoPanel, _Tab2);

    _createClass(EmptyUserLayerInfoPanel, [{
        key: 'layer',
        get: function get() {
            return null;
        }
    }]);

    function EmptyUserLayerInfoPanel() {
        _classCallCheck(this, EmptyUserLayerInfoPanel);

        var _this2 = _possibleConstructorReturn(this, (EmptyUserLayerInfoPanel.__proto__ || _Object$getPrototypeOf(EmptyUserLayerInfoPanel)).call(this));

        _this2.element.classList.add('neuroglancer-layer-side-panel-info-panel-empty');
        _this2.element.textContent = 'Information about this layer will be available once it finishes loading.';
        return _this2;
    }

    return EmptyUserLayerInfoPanel;
}(Tab);

var ManagedUserLayerInfoPanel = function (_Tab3) {
    _inherits(ManagedUserLayerInfoPanel, _Tab3);

    function ManagedUserLayerInfoPanel(layer, layerManager, collapse) {
        _classCallCheck(this, ManagedUserLayerInfoPanel);

        var _this3 = _possibleConstructorReturn(this, (ManagedUserLayerInfoPanel.__proto__ || _Object$getPrototypeOf(ManagedUserLayerInfoPanel)).call(this));

        _this3.layer = layer;
        _this3.layerManager = layerManager;
        _this3.collapse = collapse;
        _this3.element = document.createElement('div');
        _this3.title = document.createElement('div');
        _this3.layerName = document.createElement('input');
        _this3.stack = _this3.registerDisposer(new StackView(function (userLayer) {
            if (userLayer === null) {
                return new EmptyUserLayerInfoPanel();
            } else {
                return new UserLayerInfoPanel(userLayer);
            }
        }, _this3.visibility));
        var element = _this3.element,
            title = _this3.title,
            layerName = _this3.layerName,
            stack = _this3.stack;

        element.className = 'neuroglancer-managed-user-layer-info-panel';
        title.className = 'neuroglancer-layer-side-panel-title';
        stack.element.classList.add('neuroglancer-layer-side-panel-content-container');
        element.appendChild(title);
        element.appendChild(stack.element);
        var collapseButton = makeCloseButton();
        collapseButton.title = 'Close side panel';
        collapseButton.addEventListener('click', function () {
            _this3.collapse();
        });
        title.appendChild(layerName);
        layerName.spellcheck = false;
        layerName.title = 'Rename layer';
        title.appendChild(collapseButton);
        layerName.addEventListener('change', function () {
            return _this3.handleLayerNameViewChanged();
        });
        layerName.addEventListener('blur', function () {
            return _this3.handleLayerNameViewChanged();
        });
        _this3.registerDisposer(layer.layerChanged.add(function () {
            return _this3.handleLayerNameModelChanged();
        }));
        _this3.handleUserLayerChanged();
        _this3.handleLayerNameModelChanged();
        return _this3;
    }

    _createClass(ManagedUserLayerInfoPanel, [{
        key: 'handleUserLayerChanged',
        value: function handleUserLayerChanged() {
            if (this.stack.selected !== this.layer.layer) {
                this.stack.invalidateAll();
                this.stack.selected = this.layer.layer;
            }
        }
    }, {
        key: 'handleLayerNameModelChanged',
        value: function handleLayerNameModelChanged() {
            this.layerName.value = this.layer.name;
        }
    }, {
        key: 'handleLayerNameViewChanged',
        value: function handleLayerNameViewChanged() {
            var layer = this.layer;

            if (layer !== undefined) {
                var newName = this.layerName.value;
                if (newName !== layer.name) {
                    newName = this.layerManager.getUniqueLayerName(newName);
                    this.layerName.value = newName;
                    layer.name = newName;
                    layer.layerChanged.dispatch();
                }
            }
        }
    }]);

    return ManagedUserLayerInfoPanel;
}(Tab);

export var LayerInfoPanelContainer = function (_RefCounted) {
    _inherits(LayerInfoPanelContainer, _RefCounted);

    function LayerInfoPanelContainer(state) {
        _classCallCheck(this, LayerInfoPanelContainer);

        var _this4 = _possibleConstructorReturn(this, (LayerInfoPanelContainer.__proto__ || _Object$getPrototypeOf(LayerInfoPanelContainer)).call(this));

        _this4.state = state;
        _this4.element = document.createElement('div');
        _this4.stack = _this4.registerDisposer(new StackView(function (layer) {
            return new ManagedUserLayerInfoPanel(layer, _this4.state.layerManager, _this4.collapse.bind(_this4));
        }));
        var element = _this4.element,
            stack = _this4.stack;

        element.className = 'neuroglancer-layer-side-panel';
        stack.element.classList.add('neuroglancer-layer-info-panel-container');
        element.appendChild(stack.element);
        _this4.registerDisposer(state.changed.add(function () {
            return _this4.handleStateChanged();
        }));
        _this4.registerDisposer(state.layerManager.layersChanged.add(function () {
            return _this4.handleLayersChanged();
        }));
        _this4.handleStateChanged();
        return _this4;
    }

    _createClass(LayerInfoPanelContainer, [{
        key: 'handleLayersChanged',
        value: function handleLayersChanged() {
            var layerManager = this.state.layerManager;
            var stack = this.stack;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _getIterator(stack.tabs.keys()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var layer = _step.value;

                    if (!layerManager.has(layer)) {
                        stack.invalidate(layer);
                    }
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
        }
    }, {
        key: 'collapse',
        value: function collapse() {
            var state = this.state;

            if (state.visible === true) {
                this.state.visible = false;
                this.state.changed.dispatch();
            }
        }
    }, {
        key: 'handleStateChanged',
        value: function handleStateChanged() {
            var state = this.state;
            var visible = state.visible;

            this.element.style.display = visible ? null : 'none';
            this.stack.visibility.value = visible ? WatchableVisibilityPriority.VISIBLE : WatchableVisibilityPriority.IGNORED;
            this.stack.selected = state.layer;
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
            _get(LayerInfoPanelContainer.prototype.__proto__ || _Object$getPrototypeOf(LayerInfoPanelContainer.prototype), 'disposed', this).call(this);
        }
    }]);

    return LayerInfoPanelContainer;
}(RefCounted);
//# sourceMappingURL=layer_side_panel.js.map