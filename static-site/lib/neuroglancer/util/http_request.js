import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _JSON$stringify from 'babel-runtime/core-js/json/stringify';
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
import { uncancelableToken } from './cancellation';
import { Uint64 } from './uint64';
export var HttpError = function (_Error) {
    _inherits(HttpError, _Error);

    function HttpError(url, status, statusText) {
        _classCallCheck(this, HttpError);

        var message = 'Fetching ' + _JSON$stringify(url) + ' resulted in HTTP error ' + status;
        if (statusText) {
            message += ': ' + statusText;
        }
        message += '.';

        var _this = _possibleConstructorReturn(this, (HttpError.__proto__ || _Object$getPrototypeOf(HttpError)).call(this, message));

        _this.name = 'HttpError';
        _this.message = message;
        _this.url = url;
        _this.status = status;
        _this.statusText = statusText;
        return _this;
    }

    _createClass(HttpError, null, [{
        key: 'fromResponse',
        value: function fromResponse(response) {
            return new HttpError(response.url, response.status, response.statusText);
        }
    }]);

    return HttpError;
}(Error);
/**
 * Issues a `fetch` request.
 *
 * If the request fails due to an HTTP status outside `[200, 300)`, throws an `HttpError`.  If the
 * request fails due to a network or CORS restriction, throws an `HttpError` with a `status` of `0`.
 */
export var fetchOk = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(input, init) {
        var response;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        response = void 0;
                        _context.prev = 1;
                        _context.next = 4;
                        return fetch(input, init);

                    case 4:
                        response = _context.sent;
                        _context.next = 12;
                        break;

                    case 7:
                        _context.prev = 7;
                        _context.t0 = _context['catch'](1);

                        if (!(_context.t0 instanceof TypeError)) {
                            _context.next = 11;
                            break;
                        }

                        throw new HttpError('', 0, '');

                    case 11:
                        throw _context.t0;

                    case 12:
                        if (response.ok) {
                            _context.next = 14;
                            break;
                        }

                        throw HttpError.fromResponse(response);

                    case 14:
                        return _context.abrupt('return', response);

                    case 15:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[1, 7]]);
    }));

    return function fetchOk(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();
export function responseArrayBuffer(response) {
    return response.arrayBuffer();
}
export function responseJson(response) {
    return response.json();
}
/**
 * Issues a `fetch` request in the same way as `fetchOk`, and returns the result of the promise
 * returned by `transformResponse`.
 *
 * Additionally, the request may be cancelled through `cancellationToken`.
 *
 * The `transformResponse` function should not do anything with the `Response` object after its
 * result becomes ready; otherwise, cancellation may not work as expected.
 */
export var cancellableFetchOk = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(input, init, transformResponse) {
        var cancellationToken = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : uncancelableToken;

        var response, abortController, unregisterCancellation, _response;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(cancellationToken === uncancelableToken)) {
                            _context2.next = 7;
                            break;
                        }

                        _context2.next = 3;
                        return fetchOk(input, init);

                    case 3:
                        response = _context2.sent;
                        _context2.next = 6;
                        return transformResponse(response);

                    case 6:
                        return _context2.abrupt('return', _context2.sent);

                    case 7:
                        abortController = new AbortController();
                        unregisterCancellation = cancellationToken.add(function () {
                            return abortController.abort();
                        });
                        _context2.prev = 9;
                        _context2.next = 12;
                        return fetchOk(input, init);

                    case 12:
                        _response = _context2.sent;
                        _context2.next = 15;
                        return transformResponse(_response);

                    case 15:
                        return _context2.abrupt('return', _context2.sent);

                    case 16:
                        _context2.prev = 16;

                        unregisterCancellation();
                        return _context2.finish(16);

                    case 19:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[9,, 16, 19]]);
    }));

    return function cancellableFetchOk(_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
}();
var tempUint64 = new Uint64();
export function getByteRangeHeader(startOffset, endOffset) {
    var endOffsetStr = void 0;
    if (typeof endOffset === 'number') {
        endOffsetStr = '' + (endOffset - 1);
    } else {
        Uint64.decrement(tempUint64, endOffset);
        endOffsetStr = tempUint64.toString();
    }
    return { 'Range': 'bytes=' + startOffset + '-' + endOffsetStr };
}
/**
 * Parses a URL that may have a special protocol designation into a real URL.
 *
 * If the protocol is 'http' or 'https', the input string is returned as is.
 *
 * The special 'gs://bucket/path' syntax is supported for accessing Google Storage buckets.
 */
export function parseSpecialUrl(url) {
    var urlProtocolPattern = /^([^:\/]+):\/\/([^\/]+)(\/.*)?$/;
    var match = url.match(urlProtocolPattern);
    if (match === null) {
        throw new Error('Invalid URL: ' + _JSON$stringify(url));
    }
    var protocol = match[1];
    if (protocol === 'gs') {
        var bucket = match[2];
        var path = match[3];
        if (path === undefined) path = '';
        return 'https://storage.googleapis.com/' + bucket + path;
    }
    return url;
}
//# sourceMappingURL=http_request.js.map