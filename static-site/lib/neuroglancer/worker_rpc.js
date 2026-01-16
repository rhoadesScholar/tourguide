import _get2 from 'babel-runtime/helpers/get';
import _createClass from 'babel-runtime/helpers/createClass';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import _Map from 'babel-runtime/core-js/map';
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
import { CANCELED, CancellationTokenSource, makeCancelablePromise, uncancelableToken } from './util/cancellation';
import { RefCounted } from './util/disposable';
var IS_WORKER = !(typeof Window !== 'undefined' && self instanceof Window);
var DEBUG = false;
var DEBUG_MESSAGES = false;
var PROMISE_RESPONSE_ID = 'rpc.promise.response';
var PROMISE_CANCEL_ID = 'rpc.promise.cancel';
var handlers = new _Map();
export function registerRPC(key, handler) {
    handlers.set(key, handler);
}
export var RPCError = function (_Error) {
    _inherits(RPCError, _Error);

    function RPCError(name, message) {
        _classCallCheck(this, RPCError);

        var _this = _possibleConstructorReturn(this, (RPCError.__proto__ || _Object$getPrototypeOf(RPCError)).call(this, message));

        _this.name = name;
        _this.message = message;
        return _this;
    }

    return RPCError;
}(Error);
export function registerPromiseRPC(key, handler) {
    registerRPC(key, function (x) {
        var _this2 = this;

        var id = x['id'];
        var cancellationToken = new CancellationTokenSource();
        var promise = handler.call(this, x, cancellationToken);
        this.set(id, { promise: promise, cancellationToken: cancellationToken });
        promise.then(function (_ref) {
            var value = _ref.value,
                transfers = _ref.transfers;

            _this2.delete(id);
            _this2.invoke(PROMISE_RESPONSE_ID, { 'id': id, 'value': value }, transfers);
        }, function (error) {
            _this2.delete(id);
            _this2.invoke(PROMISE_RESPONSE_ID, { 'id': id, 'error': error.message, 'errorName': error.name });
        });
    });
}
registerRPC(PROMISE_CANCEL_ID, function (x) {
    var id = x['id'];
    var request = this.get(id);
    if (request !== undefined) {
        var cancellationToken = request.cancellationToken;

        cancellationToken.cancel();
    }
});
registerRPC(PROMISE_RESPONSE_ID, function (x) {
    var id = x['id'];

    var _get = this.get(id),
        resolve = _get.resolve,
        reject = _get.reject;

    this.delete(id);
    if (x.hasOwnProperty('value')) {
        resolve(x['value']);
    } else {
        var errorName = x['errorName'];
        if (errorName === CANCELED.name) {
            reject(CANCELED);
        } else {
            reject(new RPCError(x['errorName'], x['error']));
        }
    }
});
var INITIAL_RPC_ID = IS_WORKER ? -1 : 0;
export var RPC = function () {
    function RPC(target) {
        var _this3 = this;

        _classCallCheck(this, RPC);

        this.target = target;
        this.objects = new _Map();
        this.nextId = INITIAL_RPC_ID;
        target.onmessage = function (e) {
            var data = e.data;
            if (DEBUG_MESSAGES) {
                console.log('Received message', data);
            }
            handlers.get(data.functionName).call(_this3, data);
        };
    }

    _createClass(RPC, [{
        key: 'set',
        value: function set(id, value) {
            this.objects.set(id, value);
        }
    }, {
        key: 'delete',
        value: function _delete(id) {
            this.objects.delete(id);
        }
    }, {
        key: 'get',
        value: function get(id) {
            return this.objects.get(id);
        }
    }, {
        key: 'getRef',
        value: function getRef(x) {
            var rpcId = x['id'];
            var obj = this.get(rpcId);
            obj.referencedGeneration = x['gen'];
            obj.addRef();
            return obj;
        }
    }, {
        key: 'invoke',
        value: function invoke(name, x, transfers) {
            x.functionName = name;
            if (DEBUG_MESSAGES) {
                console.trace('Sending message', x);
            }
            this.target.postMessage(x, transfers);
        }
    }, {
        key: 'promiseInvoke',
        value: function promiseInvoke(name, x) {
            var _this4 = this;

            var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;
            var transfers = arguments[3];

            return makeCancelablePromise(cancellationToken, function (resolve, reject, token) {
                var id = x['id'] = _this4.newId();
                _this4.set(id, { resolve: resolve, reject: reject });
                _this4.invoke(name, x, transfers);
                token.add(function () {
                    _this4.invoke(PROMISE_CANCEL_ID, { 'id': id });
                });
            });
        }
    }, {
        key: 'newId',
        value: function newId() {
            return IS_WORKER ? this.nextId-- : this.nextId++;
        }
    }, {
        key: 'numObjects',
        get: function get() {
            return this.objects.size;
        }
    }]);

    return RPC;
}();
export var SharedObject = function (_RefCounted) {
    _inherits(SharedObject, _RefCounted);

    function SharedObject() {
        _classCallCheck(this, SharedObject);

        var _this5 = _possibleConstructorReturn(this, (SharedObject.__proto__ || _Object$getPrototypeOf(SharedObject)).apply(this, arguments));

        _this5.rpc = null;
        _this5.rpcId = null;
        return _this5;
    }

    _createClass(SharedObject, [{
        key: 'initializeSharedObject',
        value: function initializeSharedObject(rpc) {
            var rpcId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : rpc.newId();

            this.rpc = rpc;
            this.rpcId = rpcId;
            this.isOwner = false;
            rpc.set(rpcId, this);
        }
    }, {
        key: 'initializeCounterpart',
        value: function initializeCounterpart(rpc) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            this.initializeSharedObject(rpc);
            this.unreferencedGeneration = 0;
            this.referencedGeneration = 0;
            this.isOwner = true;
            options['id'] = this.rpcId;
            options['type'] = this.RPC_TYPE_ID;
            rpc.invoke('SharedObject.new', options);
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            _get2(SharedObject.prototype.__proto__ || _Object$getPrototypeOf(SharedObject.prototype), 'dispose', this).call(this);
        }
        /**
         * Precondition: this.isOwner === true.
         */

    }, {
        key: 'addCounterpartRef',
        value: function addCounterpartRef() {
            return { 'id': this.rpcId, 'gen': ++this.referencedGeneration };
        }
    }, {
        key: 'refCountReachedZero',
        value: function refCountReachedZero() {
            if (this.isOwner === true) {
                if (this.referencedGeneration === this.unreferencedGeneration) {
                    this.ownerDispose();
                } else {
                    console.log('ref diff:', this.referencedGeneration, this.unreferencedGeneration);
                }
            } else if (this.isOwner === false) {
                this.rpc.invoke('SharedObject.refCountReachedZero', { 'id': this.rpcId, 'gen': this.referencedGeneration });
            } else {
                _get2(SharedObject.prototype.__proto__ || _Object$getPrototypeOf(SharedObject.prototype), 'refCountReachedZero', this).call(this);
            }
        }
        /**
         * Precondition: this.isOwner === true.
         */

    }, {
        key: 'ownerDispose',
        value: function ownerDispose() {
            if (DEBUG) {
                console.log('[' + IS_WORKER + '] #rpc object = ' + this.rpc.numObjects);
            }
            var rpc = this.rpc,
                rpcId = this.rpcId;

            _get2(SharedObject.prototype.__proto__ || _Object$getPrototypeOf(SharedObject.prototype), 'refCountReachedZero', this).call(this);
            rpc.delete(rpcId);
            rpc.invoke('SharedObject.dispose', { 'id': rpcId });
        }
        /**
         * Precondition: this.isOwner === true.
         *
         * This should be called when the counterpart's refCount is decremented and reaches zero.
         */

    }, {
        key: 'counterpartRefCountReachedZero',
        value: function counterpartRefCountReachedZero(generation) {
            this.unreferencedGeneration = generation;
            if (this.refCount === 0 && generation === this.referencedGeneration) {
                this.ownerDispose();
            }
        }
    }]);

    return SharedObject;
}(RefCounted);
export function initializeSharedObjectCounterpart(obj, rpc) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (rpc != null) {
        obj.initializeSharedObject(rpc, options['id']);
    }
}
/**
 * Base class for defining a SharedObject type that will never be owned.
 */
export var SharedObjectCounterpart = function (_SharedObject) {
    _inherits(SharedObjectCounterpart, _SharedObject);

    function SharedObjectCounterpart(rpc) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, SharedObjectCounterpart);

        var _this6 = _possibleConstructorReturn(this, (SharedObjectCounterpart.__proto__ || _Object$getPrototypeOf(SharedObjectCounterpart)).call(this));

        initializeSharedObjectCounterpart(_this6, rpc, options);
        return _this6;
    }

    return SharedObjectCounterpart;
}(SharedObject);
registerRPC('SharedObject.dispose', function (x) {
    var obj = this.get(x['id']);
    if (obj.refCount !== 0) {
        throw new Error('Attempted to dispose object with non-zero reference count.');
    }
    if (DEBUG) {
        console.log('[' + IS_WORKER + '] #rpc objects: ' + this.numObjects);
    }
    obj.disposed();
    this.delete(obj.rpcId);
    obj.rpcId = null;
    obj.rpc = null;
});
registerRPC('SharedObject.refCountReachedZero', function (x) {
    var obj = this.get(x['id']);
    var generation = x['gen'];
    obj.counterpartRefCountReachedZero(generation);
});
var sharedObjectConstructors = new _Map();
/**
 * Register a class as a SharedObject owner type under the specified identifier.
 *
 * This is intended to be used as a decorator.
 */
export function registerSharedObjectOwner(identifier) {
    return function (constructorFunction) {
        constructorFunction.prototype.RPC_TYPE_ID = identifier;
    };
}
/**
 * Register a class as a SharedObject counterpart type under the specified identifier.
 *
 * This is intended to be used as a decorator.
 *
 * Also register the type as a SharedObject owner, which is useful if this type is also used as a
 * SharedObject owner.
 */
export function registerSharedObject(identifier) {
    return function (constructorFunction) {
        if (identifier !== undefined) {
            constructorFunction.prototype.RPC_TYPE_ID = identifier;
        } else {
            identifier = constructorFunction.prototype.RPC_TYPE_ID;
            if (identifier === undefined) {
                throw new Error('RPC_TYPE_ID should have already been defined');
            }
        }
        sharedObjectConstructors.set(identifier, constructorFunction);
    };
}
registerRPC('SharedObject.new', function (x) {
    var rpc = this;
    var typeName = x['type'];
    var constructorFunction = sharedObjectConstructors.get(typeName);
    var obj = new constructorFunction(rpc, x);
    // Counterpart objects start with a reference count of zero.
    --obj.refCount;
});
//# sourceMappingURL=worker_rpc.js.map