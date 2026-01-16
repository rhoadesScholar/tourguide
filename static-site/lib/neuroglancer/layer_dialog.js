import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
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
import { ManagedUserLayerWithSpecification } from './layer_specification';
import { Overlay } from './overlay';
import { DataType, VolumeType } from './sliceview/volume/base';
import { CancellationTokenSource } from './util/cancellation';
import { associateLabelWithElement } from './widget/associate_label';
import { AutocompleteTextInput, makeCompletionElementWithDescription } from './widget/autocomplete';
import { makeHiddenSubmitButton } from './widget/hidden_submit_button';

export var LayerDialog = function (_Overlay) {
    _inherits(LayerDialog, _Overlay);

    function LayerDialog(manager, existingLayer) {
        _classCallCheck(this, LayerDialog);

        var _this = _possibleConstructorReturn(this, (LayerDialog.__proto__ || _Object$getPrototypeOf(LayerDialog)).call(this));

        _this.manager = manager;
        _this.existingLayer = existingLayer;
        /**
         * Used for displaying status information.
         */
        _this.statusElement = document.createElement('div');
        _this.submitElement = document.createElement('button');
        _this.namePromptElement = document.createElement('label');
        _this.nameInputElement = document.createElement('input');
        _this.volumeCancellationSource = undefined;
        _this.sourceValid = false;
        _this.nameValid = true;
        var dialogElement = _this.content;
        dialogElement.classList.add('add-layer-overlay');
        var sourceCompleter = function sourceCompleter(value, cancellationToken) {
            return _this.manager.dataSourceProvider.volumeCompleter(value, _this.manager.chunkManager, cancellationToken).then(function (originalResult) {
                return {
                    completions: originalResult.completions,
                    makeElement: makeCompletionElementWithDescription,
                    offset: originalResult.offset,
                    showSingleResult: true
                };
            });
        };
        var sourceForm = document.createElement('form');
        sourceForm.className = 'source-form';
        _this.registerEventListener(sourceForm, 'submit', function (event) {
            event.preventDefault();
            _this.validateSource( /*focusName=*/true);
        });
        var sourcePrompt = document.createElement('label');
        sourcePrompt.textContent = 'Source:';
        var sourceInput = _this.sourceInput = _this.registerDisposer(new AutocompleteTextInput({ completer: sourceCompleter, delay: 0 }));
        sourceInput.element.classList.add('add-layer-source');
        sourceInput.inputElement.addEventListener('blur', function () {
            _this.validateSource( /*focusName=*/false);
        });
        _this.submitElement.disabled = true;
        sourceInput.inputChanged.add(function () {
            var volumeCancellationSource = _this.volumeCancellationSource;

            if (volumeCancellationSource !== undefined) {
                volumeCancellationSource.cancel();
                _this.volumeCancellationSource = undefined;
            }
            _this.sourceValid = false;
            _this.submitElement.disabled = true;
            _this.statusElement.textContent = '';
        });
        sourceForm.appendChild(sourcePrompt);
        sourceForm.appendChild(sourceInput.element);
        associateLabelWithElement(sourcePrompt, sourceInput.inputElement);
        var hiddenSourceSubmit = makeHiddenSubmitButton();
        sourceForm.appendChild(hiddenSourceSubmit);
        dialogElement.appendChild(sourceForm);
        var statusElement = _this.statusElement,
            namePromptElement = _this.namePromptElement,
            nameInputElement = _this.nameInputElement,
            submitElement = _this.submitElement;

        statusElement.className = 'dialog-status';
        var nameForm = document.createElement('form');
        nameForm.className = 'name-form';
        namePromptElement.textContent = 'Name:';
        nameInputElement.className = 'add-layer-name';
        nameInputElement.autocomplete = 'off';
        nameInputElement.spellcheck = false;
        nameInputElement.type = 'text';
        _this.registerEventListener(nameInputElement, 'input', function () {
            _this.validateName();
        });
        submitElement.type = 'submit';
        associateLabelWithElement(namePromptElement, nameInputElement);
        nameForm.appendChild(namePromptElement);
        nameForm.appendChild(nameInputElement);
        nameForm.appendChild(submitElement);
        dialogElement.appendChild(nameForm);
        dialogElement.appendChild(statusElement);
        if (existingLayer !== undefined) {
            if (existingLayer.sourceUrl !== undefined) {
                sourceInput.value = existingLayer.sourceUrl;
                _this.validateSource();
            } else {
                _this.sourceValid = true;
            }
            sourceInput.disabled = true;
            nameInputElement.value = existingLayer.name;
            _this.validateName();
            submitElement.textContent = 'Save';
            nameInputElement.focus();
        } else {
            var managedLayers = _this.manager.layerManager.managedLayers;

            for (var hintLayerIndex = managedLayers.length - 1; hintLayerIndex >= 0; --hintLayerIndex) {
                var hintLayer = managedLayers[hintLayerIndex];
                if (!(hintLayer instanceof ManagedUserLayerWithSpecification)) continue;
                var sourceUrl = hintLayer.sourceUrl;

                if (sourceUrl === undefined) continue;
                try {
                    var groupIndex = _this.manager.dataSourceProvider.findSourceGroup(sourceUrl);
                    sourceInput.value = sourceUrl.substring(0, groupIndex);
                    sourceInput.inputElement.setSelectionRange(0, groupIndex);
                    break;
                } catch (_a) {}
            }
            sourceInput.inputElement.focus();
            submitElement.textContent = 'Add Layer';
        }
        _this.registerEventListener(nameForm, 'submit', function (event) {
            event.preventDefault();
            _this.submit();
        });
        return _this;
    }

    _createClass(LayerDialog, [{
        key: 'isNameValid',
        value: function isNameValid() {
            var name = this.nameInputElement.value;
            if (name === '') {
                return false;
            }
            var otherLayer = this.manager.layerManager.getLayerByName(name);
            return otherLayer === undefined || otherLayer === this.existingLayer;
        }
    }, {
        key: 'submit',
        value: function submit() {
            if (this.sourceValid && this.isNameValid()) {
                if (this.existingLayer) {
                    this.existingLayer.name = this.nameInputElement.value;
                    this.manager.layerManager.layersChanged.dispatch();
                } else {
                    this.manager.add(this.manager.getLayer(this.nameInputElement.value, this.sourceInput.value));
                }
                this.dispose();
            }
        }
    }, {
        key: 'validateName',
        value: function validateName() {
            var nameInputElement = this.nameInputElement;

            var nameValid = this.nameValid = this.isNameValid();
            if (nameValid) {
                nameInputElement.classList.add('valid-input');
                nameInputElement.classList.remove('invalid-input');
            } else {
                nameInputElement.classList.remove('valid-input');
                nameInputElement.classList.add('invalid-input');
            }
            this.validityChanged();
        }
    }, {
        key: 'validityChanged',
        value: function validityChanged() {
            this.submitElement.disabled = !(this.nameValid && this.sourceValid);
        }
    }, {
        key: 'validateSource',
        value: function validateSource() {
            var _this2 = this;

            var focusName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            var url = this.sourceInput.value;
            if (url === '') {
                return;
            }
            try {
                var baseSuggestedName = this.manager.dataSourceProvider.suggestLayerName(url);
                var nameInputElement = this.nameInputElement;

                if (this.nameInputElement.value === '') {
                    var suggestedName = this.manager.layerManager.getUniqueLayerName(baseSuggestedName);
                    nameInputElement.value = suggestedName;
                    nameInputElement.setSelectionRange(0, suggestedName.length);
                    this.validateName();
                }
                if (focusName) {
                    nameInputElement.focus();
                }
            } catch (error) {
                this.setError(error.message);
                return;
            }
            this.setInfo('Validating volume source...');
            var token = this.volumeCancellationSource = new CancellationTokenSource();
            this.manager.dataSourceProvider.getVolume(this.manager.chunkManager, url, /*options=*/undefined, token).then(function (source) {
                if (token.isCanceled) {
                    return;
                }
                _this2.volumeCancellationSource = undefined;
                _this2.sourceValid = true;
                _this2.setInfo(VolumeType[source.volumeType].toLowerCase() + ': ' + (source.numChannels + '-channel ' + DataType[source.dataType].toLowerCase()));
                _this2.validityChanged();
            }).catch(function (reason) {
                if (token.isCanceled) {
                    return;
                }
                _this2.volumeCancellationSource = undefined;
                _this2.setError(reason.message);
            });
        }
    }, {
        key: 'setInfo',
        value: function setInfo(message) {
            this.statusElement.className = 'dialog-status dialog-status-info';
            this.statusElement.textContent = message;
        }
    }, {
        key: 'setError',
        value: function setError(message) {
            this.statusElement.className = 'dialog-status dialog-status-error';
            this.statusElement.textContent = message;
        }
    }]);

    return LayerDialog;
}(Overlay);
//# sourceMappingURL=layer_dialog.js.map