import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
/**
 * @license
 * Copyright 2019 Google Inc.
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
import { uncancelableToken } from '../util/cancellation';
import { cancellableFetchOk, HttpError } from '../util/http_request';
export var fetchWithCredentials = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(credentialsProvider, input, init, transformResponse, applyCredentials, errorHandler) {
        var cancellationToken = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : uncancelableToken;
        var credentials;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        credentials = void 0;

                    case 1:
                        if (!true) {
                            _context.next = 23;
                            break;
                        }

                        _context.next = 4;
                        return credentialsProvider.get(credentials, cancellationToken);

                    case 4:
                        credentials = _context.sent;

                    case 5:
                        if (!true) {
                            _context.next = 21;
                            break;
                        }

                        _context.prev = 6;
                        _context.next = 9;
                        return cancellableFetchOk(input, applyCredentials(credentials.credentials, init), transformResponse, cancellationToken);

                    case 9:
                        return _context.abrupt('return', _context.sent);

                    case 12:
                        _context.prev = 12;
                        _context.t0 = _context['catch'](6);

                        if (!(_context.t0 instanceof HttpError)) {
                            _context.next = 18;
                            break;
                        }

                        if (!(errorHandler(_context.t0) === 'refresh')) {
                            _context.next = 17;
                            break;
                        }

                        return _context.abrupt('continue', 1);

                    case 17:
                        return _context.abrupt('continue', 5);

                    case 18:
                        throw _context.t0;

                    case 19:
                        _context.next = 5;
                        break;

                    case 21:
                        _context.next = 1;
                        break;

                    case 23:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[6, 12]]);
    }));

    return function fetchWithCredentials(_x2, _x3, _x4, _x5, _x6, _x7) {
        return _ref.apply(this, arguments);
    };
}();
//# sourceMappingURL=http_request.js.map