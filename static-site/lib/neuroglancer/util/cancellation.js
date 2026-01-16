import _Promise from 'babel-runtime/core-js/promise';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Set from 'babel-runtime/core-js/set';
import _getIterator from 'babel-runtime/core-js/get-iterator';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';

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
var CancellationError = function () {
    function CancellationError() {
        _classCallCheck(this, CancellationError);

        this.name = 'CancellationError';
        this.message = 'CANCELED';
    }

    _createClass(CancellationError, [{
        key: 'toString',
        value: function toString() {
            return 'CANCELED';
        }
    }]);

    return CancellationError;
}();
/**
 * Singleton instance of CancellationError thrown to indicate cancellation.
 */


export var CANCELED = new CancellationError();
/**
 * Throws CANCELED if token.isCanceled === true.
 */
export function throwIfCanceled(token) {
    if (token.isCanceled === true) {
        throw CANCELED;
    }
}
var noopFunction = function noopFunction() {};
/**
 * CancellationToken that cannot be canceled.  This can be passed to operations that require a
 * CancellationToken but will not need to be canceled.
 */
export var uncancelableToken = {
    isCanceled: false,
    add: function add() {
        return noopFunction;
    },
    remove: noopFunction
};
/**
 * Class that can be used to trigger cancellation.
 */
export var CancellationTokenSource = function () {
    function CancellationTokenSource() {
        _classCallCheck(this, CancellationTokenSource);
    }

    _createClass(CancellationTokenSource, [{
        key: 'cancel',

        /**
         * Trigger cancellation.
         *
         * If this.isCanceled === false, then each registered cancellation handler is invoked
         * synchronously.
         */
        value: function cancel() {
            var handlers = this.handlers;

            if (handlers !== null) {
                this.handlers = null;
                if (handlers !== undefined) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = _getIterator(handlers), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var handler = _step.value;

                            handler();
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
            }
        }
    }, {
        key: 'add',
        value: function add(handler) {
            var _this = this;

            var handlers = this.handlers;

            if (handlers === null) {
                handler();
                return noopFunction;
            }
            if (handlers === undefined) {
                handlers = this.handlers = new _Set();
            }
            handlers.add(handler);
            return function () {
                _this.remove(handler);
            };
        }
    }, {
        key: 'remove',
        value: function remove(handler) {
            var handlers = this.handlers;

            if (handlers != null) {
                handlers.delete(handler);
            }
        }
    }, {
        key: 'isCanceled',
        get: function get() {
            return this.handlers === null;
        }
    }]);

    return CancellationTokenSource;
}();
/**
 * Creates a CancellationToken corresponding to an asynchronous process with multiple consumers.  It
 * is cancelled only when the cancellation tokens corresponding to all of the consumers have been
 * cancelled.
 */
export var MultipleConsumerCancellationTokenSource = function (_CancellationTokenSou) {
    _inherits(MultipleConsumerCancellationTokenSource, _CancellationTokenSou);

    function MultipleConsumerCancellationTokenSource() {
        _classCallCheck(this, MultipleConsumerCancellationTokenSource);

        var _this2 = _possibleConstructorReturn(this, (MultipleConsumerCancellationTokenSource.__proto__ || _Object$getPrototypeOf(MultipleConsumerCancellationTokenSource)).apply(this, arguments));

        _this2.consumers = new _Set();
        return _this2;
    }

    _createClass(MultipleConsumerCancellationTokenSource, [{
        key: 'addConsumer',
        value: function addConsumer() {
            var _this3 = this;

            var cancellationToken = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : uncancelableToken;
            var consumers = this.consumers;

            if (consumers.has(cancellationToken) || cancellationToken.isCanceled) {
                return;
            }
            consumers.add(cancellationToken);
            cancellationToken.add(function () {
                consumers.delete(cancellationToken);
                if (consumers.size === 0) {
                    _this3.cancel();
                }
            });
        }
    }]);

    return MultipleConsumerCancellationTokenSource;
}(CancellationTokenSource);
/**
 * Creates a promise and a dependent cancellation token.
 *
 * The dependent cancellation token will be canceled if the specified `cancellationToken` is
 * canceled while the promise is pending.
 *
 * @param cancellationToken The token that provides notification of cancellation.
 * @param executor The executor passed the resolve and reject functions for the promise, as well as
 * the dependent cancellation token.  If cancellation occurs after either resolve or reject is
 * called, then the dependent token is not cancelled.
 *
 * @returns A new Promise.
 */
export function makeCancelablePromise(cancellationToken, executor) {
    return new _Promise(function (resolve, reject) {
        if (cancellationToken === uncancelableToken) {
            executor(resolve, reject, uncancelableToken);
            return;
        }
        var scopedToken = new CancellationTokenSource();
        var unregister = cancellationToken.add(function () {
            scopedToken.cancel();
        });
        executor(function (value) {
            unregister();
            resolve(value);
        }, function (error) {
            unregister();
            reject(error);
        }, scopedToken);
    });
}
//# sourceMappingURL=cancellation.js.map