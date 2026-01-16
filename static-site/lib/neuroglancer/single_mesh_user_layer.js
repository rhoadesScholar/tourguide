import _Array$from from 'babel-runtime/core-js/array/from';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _get from 'babel-runtime/helpers/get';
import _inherits from 'babel-runtime/helpers/inherits';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _Set from 'babel-runtime/core-js/set';
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
import { UserLayer } from './layer';
import { registerLayerType } from './layer_specification';
import { Overlay } from './overlay';
import { FRAGMENT_MAIN_START, getShaderAttributeType, getSingleMeshSource, SingleMeshDisplayState, SingleMeshLayer } from './single_mesh/frontend';
import { UserLayerWithCoordinateTransformMixin } from './user_layer_with_coordinate_transform';
import { RefCounted } from './util/disposable';
import { removeFromParent } from './util/dom';
import { parseArray, verifyObjectProperty, verifyOptionalString, verifyString } from './util/json';
import { ShaderCodeWidget } from './widget/shader_code_widget';
import { Tab } from './widget/tab_view';

function makeValidIdentifier(x) {
    return x.split(/[^a-zA-Z0-9]+/).filter(function (y) {
        return y;
    }).join('_');
}
function pickAttributeNames(existingNames) {
    var seenNames = new _Set();
    var result = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = _getIterator(existingNames), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var existingName = _step.value;

            var name = makeValidIdentifier(existingName);
            var suffix = '';
            var suffixNumber = 0;
            while (seenNames.has(name + suffix)) {
                suffix = '' + ++suffixNumber;
            }
            result.push(name + suffix);
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

    return result;
}
var BaseUserLayer = UserLayerWithCoordinateTransformMixin(UserLayer);
export var SingleMeshUserLayer = function (_BaseUserLayer) {
    _inherits(SingleMeshUserLayer, _BaseUserLayer);

    function SingleMeshUserLayer(manager, x) {
        _classCallCheck(this, SingleMeshUserLayer);

        var _this = _possibleConstructorReturn(this, (SingleMeshUserLayer.__proto__ || _Object$getPrototypeOf(SingleMeshUserLayer)).call(this, manager, x));

        _this.manager = manager;
        _this.displayState = new SingleMeshDisplayState();
        _this.displayState.objectToDataTransform = _this.transform;
        _this.parameters = {
            meshSourceUrl: verifyObjectProperty(x, 'source', verifyString),
            attributeSourceUrls: verifyObjectProperty(x, 'vertexAttributeSources', function (y) {
                if (y !== undefined) {
                    return parseArray(y, verifyString);
                } else {
                    return [];
                }
            })
        };
        _this.displayState.fragmentMain.restoreState(x['shader']);
        _this.userSpecifiedAttributeNames = verifyObjectProperty(x, 'vertexAttributeNames', function (y) {
            if (y === undefined) {
                return undefined;
            }
            return parseArray(y, function (z) {
                var result = verifyOptionalString(z);
                if (result) {
                    return result;
                }
                return undefined;
            });
        });
        getSingleMeshSource(manager.chunkManager, _this.parameters).then(function (source) {
            if (_this.wasDisposed) {
                return;
            }
            _this.meshSource = source;
            var defaultAttributeNames = _this.defaultAttributeNames = pickAttributeNames(source.info.vertexAttributes.map(function (a) {
                return a.name;
            }));
            var userSpecifiedAttributeNames = _this.userSpecifiedAttributeNames;

            var initialAttributeNames = void 0;
            if (userSpecifiedAttributeNames !== undefined && userSpecifiedAttributeNames.length === defaultAttributeNames.length) {
                initialAttributeNames = userSpecifiedAttributeNames;
                _this.userSpecifiedAttributeNames = undefined;
            } else {
                initialAttributeNames = _Array$from(defaultAttributeNames);
            }
            _this.displayState.attributeNames.value = initialAttributeNames;
            _this.addRenderLayer(new SingleMeshLayer(source, _this.displayState));
            _this.isReady = true;
        });
        _this.registerDisposer(_this.displayState.fragmentMain.changed.add(function () {
            _this.specificationChanged.dispatch();
        }));
        _this.registerDisposer(_this.displayState.attributeNames.changed.add(function () {
            _this.specificationChanged.dispatch();
        }));
        _this.tabs.add('rendering', { label: 'Rendering', order: -100, getter: function getter() {
                return new DisplayOptionsTab(_this);
            } });
        _this.tabs.default = 'rendering';
        return _this;
    }

    _createClass(SingleMeshUserLayer, [{
        key: 'toJSON',
        value: function toJSON() {
            var x = _get(SingleMeshUserLayer.prototype.__proto__ || _Object$getPrototypeOf(SingleMeshUserLayer.prototype), 'toJSON', this).call(this);
            x['type'] = 'mesh';
            var parameters = this.parameters;
            var attributeSourceUrls = parameters.attributeSourceUrls;

            x['source'] = this.parameters.meshSourceUrl;
            if (attributeSourceUrls) {
                x['vertexAttributeSources'] = attributeSourceUrls;
            }
            x['shader'] = this.displayState.fragmentMain.toJSON();
            var persistentAttributeNames = undefined;
            if (this.meshSource === undefined) {
                persistentAttributeNames = this.userSpecifiedAttributeNames;
            } else {
                var defaultAttributeNames = this.defaultAttributeNames;
                var attributeNames = this.displayState.attributeNames.value;
                // Check if equal.
                var equal = true;
                var numAttributes = attributeNames.length;
                for (var i = 0; i < numAttributes; ++i) {
                    if (attributeNames[i] !== defaultAttributeNames[i]) {
                        equal = false;
                        break;
                    }
                }
                if (equal) {
                    persistentAttributeNames = undefined;
                } else {
                    persistentAttributeNames = _Array$from(attributeNames);
                }
            }
            x['vertexAttributeNames'] = persistentAttributeNames;
            return x;
        }
    }]);

    return SingleMeshUserLayer;
}(BaseUserLayer);
function makeShaderCodeWidget(layer) {
    return new ShaderCodeWidget({
        fragmentMain: layer.displayState.fragmentMain,
        shaderError: layer.displayState.shaderError,
        fragmentMainStartLine: FRAGMENT_MAIN_START
    });
}
/**
 * Time in milliseconds during which the input field must not be modified before the shader is
 * recompiled.
 */
var SHADER_UPDATE_DELAY = 500;

var VertexAttributeWidget = function (_RefCounted) {
    _inherits(VertexAttributeWidget, _RefCounted);

    function VertexAttributeWidget(attributeNames, getAttributeInfo) {
        _classCallCheck(this, VertexAttributeWidget);

        var _this2 = _possibleConstructorReturn(this, (VertexAttributeWidget.__proto__ || _Object$getPrototypeOf(VertexAttributeWidget)).call(this));

        _this2.attributeNames = attributeNames;
        _this2.getAttributeInfo = getAttributeInfo;
        _this2.element = document.createElement('div');
        _this2.debouncedValueUpdater = debounce(function () {
            _this2.updateAttributeNames();
        }, SHADER_UPDATE_DELAY);
        _this2.element.className = 'neuroglancer-single-mesh-attribute-widget';
        _this2.updateInputElements();
        _this2.registerDisposer(attributeNames.changed.add(function () {
            _this2.updateInputElements();
        }));
        return _this2;
    }

    _createClass(VertexAttributeWidget, [{
        key: 'updateInputElements',
        value: function updateInputElements() {
            var attributeNames = this.attributeNames;
            var attributeNameElements = this.attributeNameElements;

            if (attributeNameElements === undefined) {
                var attributeInfo = this.getAttributeInfo();
                if (attributeInfo === undefined) {
                    return;
                }
                attributeNameElements = this.attributeNameElements = new Array();
                var previousSource = undefined;
                var numAttributes = attributeNames.value.length;
                var element = this.element;

                for (var i = 0; i < numAttributes; ++i) {
                    var info = attributeInfo[i];
                    var source = info.source;

                    if (source !== previousSource && source !== undefined) {
                        previousSource = source;
                        var _div = document.createElement('div');
                        _div.className = 'neuroglancer-single-mesh-source-header';
                        _div.textContent = source;
                        element.appendChild(_div);
                    }
                    var div = document.createElement('div');
                    div.className = 'neuroglancer-single-mesh-attribute';
                    var input = document.createElement('input');
                    input.title = info.name;
                    this.registerEventListener(input, 'input', this.debouncedValueUpdater);
                    input.type = 'text';
                    div.textContent = getShaderAttributeType(info);
                    div.appendChild(input);
                    if (info.min !== undefined && info.max !== undefined) {
                        var minMaxText = document.createElement('span');
                        minMaxText.className = 'neuroglancer-single-mesh-attribute-range';
                        minMaxText.textContent = '[' + info.min.toPrecision(6) + ', ' + info.max.toPrecision(6) + ']';
                        div.appendChild(minMaxText);
                    }
                    attributeNameElements[i] = input;
                    element.appendChild(div);
                }
            }
            var attributeNamesValue = attributeNames.value;
            attributeNamesValue.forEach(function (name, i) {
                attributeNameElements[i].value = name || '';
            });
        }
    }, {
        key: 'disposed',
        value: function disposed() {
            removeFromParent(this.element);
        }
    }, {
        key: 'updateAttributeNames',
        value: function updateAttributeNames() {
            var attributeNames = this.attributeNames.value;
            var attributeNameElements = this.attributeNameElements;
            var changed = false;
            attributeNames.forEach(function (name, i) {
                var newName = attributeNameElements[i].value;
                if (!newName) {
                    newName = undefined;
                }
                if (newName !== name) {
                    changed = true;
                    attributeNames[i] = newName;
                }
            });
            if (changed) {
                this.attributeNames.changed.dispatch();
            }
        }
    }]);

    return VertexAttributeWidget;
}(RefCounted);

function makeVertexAttributeWidget(layer) {
    return new VertexAttributeWidget(layer.displayState.attributeNames, function () {
        return layer.meshSource && layer.meshSource.info.vertexAttributes;
    });
}

var DisplayOptionsTab = function (_Tab) {
    _inherits(DisplayOptionsTab, _Tab);

    function DisplayOptionsTab(layer) {
        _classCallCheck(this, DisplayOptionsTab);

        var _this3 = _possibleConstructorReturn(this, (DisplayOptionsTab.__proto__ || _Object$getPrototypeOf(DisplayOptionsTab)).call(this));

        _this3.layer = layer;
        _this3.attributeWidget = _this3.registerDisposer(makeVertexAttributeWidget(_this3.layer));
        _this3.codeWidget = _this3.registerDisposer(makeShaderCodeWidget(_this3.layer));
        var element = _this3.element;

        element.classList.add('neuroglancer-single-mesh-dropdown');
        var topRow = document.createElement('div');
        topRow.className = 'neuroglancer-single-mesh-dropdown-top-row';
        var spacer = document.createElement('div');
        spacer.style.flex = '1';
        var helpLink = document.createElement('a');
        var helpButton = document.createElement('button');
        helpButton.type = 'button';
        helpButton.textContent = '?';
        helpButton.className = 'help-link';
        helpLink.appendChild(helpButton);
        helpLink.title = 'Documentation on single mesh layer rendering';
        helpLink.target = '_blank';
        helpLink.href = 'https://github.com/google/neuroglancer/blob/master/src/neuroglancer/sliceview/image_layer_rendering.md';
        var maximizeButton = document.createElement('button');
        maximizeButton.innerHTML = '&square;';
        maximizeButton.className = 'maximize-button';
        maximizeButton.title = 'Show larger editor view';
        _this3.registerEventListener(maximizeButton, 'click', function () {
            new ShaderCodeOverlay(_this3.layer);
        });
        topRow.appendChild(spacer);
        topRow.appendChild(maximizeButton);
        topRow.appendChild(helpLink);
        element.appendChild(topRow);
        element.appendChild(_this3.attributeWidget.element);
        element.appendChild(_this3.codeWidget.element);
        _this3.codeWidget.textEditor.refresh();
        _this3.visibility.changed.add(function () {
            if (_this3.visible) {
                _this3.codeWidget.textEditor.refresh();
            }
        });
        return _this3;
    }

    return DisplayOptionsTab;
}(Tab);

var ShaderCodeOverlay = function (_Overlay) {
    _inherits(ShaderCodeOverlay, _Overlay);

    function ShaderCodeOverlay(layer) {
        _classCallCheck(this, ShaderCodeOverlay);

        var _this4 = _possibleConstructorReturn(this, (ShaderCodeOverlay.__proto__ || _Object$getPrototypeOf(ShaderCodeOverlay)).call(this));

        _this4.layer = layer;
        _this4.attributeWidget = _this4.registerDisposer(makeVertexAttributeWidget(_this4.layer));
        _this4.codeWidget = _this4.registerDisposer(makeShaderCodeWidget(_this4.layer));
        _this4.content.classList.add('neuroglancer-single-mesh-layer-shader-overlay');
        _this4.content.appendChild(_this4.attributeWidget.element);
        _this4.content.appendChild(_this4.codeWidget.element);
        _this4.codeWidget.textEditor.refresh();
        return _this4;
    }

    return ShaderCodeOverlay;
}(Overlay);

registerLayerType('mesh', SingleMeshUserLayer);
//# sourceMappingURL=single_mesh_user_layer.js.map