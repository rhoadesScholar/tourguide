import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import { uncancelableToken } from '../../util/cancellation';
import { responseJson, cancellableFetchOk } from '../../util/http_request';
export var DVIDInstance = function () {
    function DVIDInstance(baseUrl, nodeKey) {
        _classCallCheck(this, DVIDInstance);

        this.baseUrl = baseUrl;
        this.nodeKey = nodeKey;
    }

    _createClass(DVIDInstance, [{
        key: 'getNodeApiUrl',
        value: function getNodeApiUrl() {
            return this.baseUrl + '/api/node/' + this.nodeKey;
        }
    }]);

    return DVIDInstance;
}();
function responseText(response) {
    return response.text();
}
export function makeRequest(instance, httpCall) {
    var cancellationToken = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : uncancelableToken;

    var requestInfo = '' + instance.getNodeApiUrl() + httpCall.path;
    var init = { method: httpCall.method, body: httpCall.payload };
    if (httpCall.responseType === '') {
        return cancellableFetchOk(requestInfo, init, responseText, cancellationToken);
    } else {
        return cancellableFetchOk(requestInfo, init, responseJson, cancellationToken);
    }
}
//# sourceMappingURL=api.js.map