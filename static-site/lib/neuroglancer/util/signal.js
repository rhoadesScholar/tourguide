import _Object$getPrototypeOf from "babel-runtime/core-js/object/get-prototype-of";
import _possibleConstructorReturn from "babel-runtime/helpers/possibleConstructorReturn";
import _inherits from "babel-runtime/helpers/inherits";
import _Set from "babel-runtime/core-js/set";
import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _createClass from "babel-runtime/helpers/createClass";
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
 * @file Simple signal dispatch mechanism.
 */
/**
 * This class provides a simple signal dispatch mechanism.  Handlers can be added, and then the
 * `dispatch` method calls all of them.
 *
 * If specified, Callable should be an interface containing only a callable signature returning
 * void.  Due to limitations in TypeScript, any interface containing a callable signature will be
 * accepted by the compiler, but the resultant signature of `dispatch` will not be correct.
 */
export var Signal = function () {
  function Signal() {
    _classCallCheck(this, Signal);

    this.handlers = new _Set();
    /**
     * Count of number of times this signal has been dispatched.  This is incremented each time
     * `dispatch` is called prior to invoking the handlers.
     */
    this.count = 0;
    var obj = this;
    this.dispatch = function () {
      var _this = this,
          _arguments = arguments;

      ++obj.count;
      obj.handlers.forEach(function (handler) {
        handler.apply(_this, _arguments);
      });
    };
  }
  /**
   * Add a handler function.  If `dispatch` is currently be called, then the new handler will be
   * called before `dispatch` returns.
   *
   * @param handler The handler function to add.
   *
   * @return A function that unregisters the handler.
   */


  _createClass(Signal, [{
    key: "add",
    value: function add(handler) {
      var _this2 = this;

      this.handlers.add(handler);
      return function () {
        return _this2.remove(handler);
      };
    }
    /**
     * Remove a handler function.  If `dispatch` is currently be called and the new handler has not
     * yet been called, then it will not be called.
     *
     * @param handler Handler to remove.
     * @return `true` if the handler was present, `false` otherwise.
     */

  }, {
    key: "remove",
    value: function remove(handler) {
      return this.handlers.delete(handler);
    }
    /**
     * Disposes of resources.  No methods, including `dispatch`, may be invoked afterwards.
     */

  }, {
    key: "dispose",
    value: function dispose() {
      this.handlers = undefined;
    }
  }]);

  return Signal;
}();
/**
 * Simple specialization of Signal for the common case of a nullary handler signature.
 */
export var NullarySignal = function (_Signal) {
  _inherits(NullarySignal, _Signal);

  function NullarySignal() {
    _classCallCheck(this, NullarySignal);

    return _possibleConstructorReturn(this, (NullarySignal.__proto__ || _Object$getPrototypeOf(NullarySignal)).apply(this, arguments));
  }

  return NullarySignal;
}(Signal);
//# sourceMappingURL=signal.js.map