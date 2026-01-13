import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _typeof from 'babel-runtime/helpers/typeof';
export { _registerEventListener as registerEventListener };
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
export function invokeDisposer(disposer) {
    if ((typeof disposer === 'undefined' ? 'undefined' : _typeof(disposer)) === 'object') {
        disposer.dispose();
    } else {
        disposer();
    }
}
export function invokeDisposers(disposers) {
    for (var i = disposers.length; i > 0; --i) {
        invokeDisposer(disposers[i - 1]);
    }
}
function _registerEventListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    return function () {
        return target.removeEventListener(type, listener, options);
    };
}
export var RefCounted = function () {
    function RefCounted() {
        _classCallCheck(this, RefCounted);

        this.refCount = 1;
    }

    _createClass(RefCounted, [{
        key: 'addRef',
        value: function addRef() {
            ++this.refCount;
            return this;
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (--this.refCount !== 0) {
                return;
            }
            this.refCountReachedZero();
        }
    }, {
        key: 'refCountReachedZero',
        value: function refCountReachedZero() {
            this.disposed();
            var disposers = this.disposers;

            if (disposers !== undefined) {
                invokeDisposers(disposers);
                this.disposers = undefined;
            }
            this.wasDisposed = true;
        }
    }, {
        key: 'disposed',
        value: function disposed() {}
    }, {
        key: 'registerDisposer',
        value: function registerDisposer(f) {
            var disposers = this.disposers;

            if (disposers == null) {
                this.disposers = [f];
            } else {
                disposers.push(f);
            }
            return f;
        }
    }, {
        key: 'unregisterDisposer',
        value: function unregisterDisposer(f) {
            var disposers = this.disposers;

            if (disposers != null) {
                var index = disposers.indexOf(f);
                if (index !== -1) {
                    disposers.splice(index, 1);
                }
            }
            return f;
        }
    }, {
        key: 'registerEventListener',
        value: function registerEventListener(target, type, listener, options) {
            this.registerDisposer(_registerEventListener(target, type, listener, options));
        }
    }, {
        key: 'registerCancellable',
        value: function registerCancellable(cancellable) {
            this.registerDisposer(function () {
                cancellable.cancel();
            });
            return cancellable;
        }
    }]);

    return RefCounted;
}();
export var RefCountedValue = function (_RefCounted) {
    _inherits(RefCountedValue, _RefCounted);

    function RefCountedValue(value) {
        _classCallCheck(this, RefCountedValue);

        var _this = _possibleConstructorReturn(this, (RefCountedValue.__proto__ || _Object$getPrototypeOf(RefCountedValue)).call(this));

        _this.value = value;
        return _this;
    }

    return RefCountedValue;
}(RefCounted);
//# sourceMappingURL=disposable.js.map