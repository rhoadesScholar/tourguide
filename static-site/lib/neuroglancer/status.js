import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';

var statusContainer = null; /**
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

export var DEFAULT_STATUS_DELAY = 200;
export var StatusMessage = function () {
    function StatusMessage() {
        var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        _classCallCheck(this, StatusMessage);

        if (statusContainer === null) {
            statusContainer = document.createElement('ul');
            statusContainer.id = 'statusContainer';
            var el = document.getElementById('neuroglancer-container');
            if (el) {
                el.appendChild(statusContainer);
            } else {
                document.body.appendChild(statusContainer);
            }
        }
        var element = document.createElement('li');
        this.element = element;
        if (delay === true) {
            delay = DEFAULT_STATUS_DELAY;
        }
        if (delay !== false) {
            this.setVisible(false);
            this.timer = setTimeout(this.setVisible.bind(this, true), delay);
        } else {
            this.timer = null;
        }
        statusContainer.appendChild(element);
    }

    _createClass(StatusMessage, [{
        key: 'dispose',
        value: function dispose() {
            statusContainer.removeChild(this.element);
            this.element = undefined;
            if (this.timer !== null) {
                clearTimeout(this.timer);
            }
        }
    }, {
        key: 'setText',
        value: function setText(text, makeVisible) {
            this.element.textContent = text;
            if (makeVisible) {
                this.setVisible(true);
            }
        }
    }, {
        key: 'setHTML',
        value: function setHTML(text, makeVisible) {
            this.element.innerHTML = text;
            if (makeVisible) {
                this.setVisible(true);
            }
        }
    }, {
        key: 'setVisible',
        value: function setVisible(value) {
            if (this.timer !== null) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.element.style.display = value ? 'block' : 'none';
        }
    }, {
        key: 'setErrorMessage',
        value: function setErrorMessage(message) {
            var _this = this;

            this.element.textContent = message + ' ';
            var button = document.createElement('button');
            button.textContent = 'Dismiss';
            button.addEventListener('click', function () {
                _this.dispose();
            });
            this.element.appendChild(button);
        }
    }], [{
        key: 'forPromise',
        value: function forPromise(promise, options) {
            var status = new StatusMessage(options.delay);
            status.setText(options.initialMessage);
            var dispose = status.dispose.bind(status);
            promise.then(dispose, function (reason) {
                var msg = void 0;
                if (reason instanceof Error) {
                    msg = reason.message;
                } else {
                    msg = '' + reason;
                }
                var _options$errorPrefix = options.errorPrefix,
                    errorPrefix = _options$errorPrefix === undefined ? '' : _options$errorPrefix;

                status.setErrorMessage(errorPrefix + msg);
                status.setVisible(true);
            });
            return promise;
        }
    }, {
        key: 'showMessage',
        value: function showMessage(message) {
            var msg = new StatusMessage();
            msg.element.textContent = message;
            msg.setVisible(true);
            return msg;
        }
    }, {
        key: 'showTemporaryMessage',
        value: function showTemporaryMessage(message) {
            var closeAfter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2000;

            var msg = this.showMessage(message);
            setTimeout(function () {
                return msg.dispose();
            }, closeAfter);
            return msg;
        }
    }]);

    return StatusMessage;
}();
//# sourceMappingURL=status.js.map