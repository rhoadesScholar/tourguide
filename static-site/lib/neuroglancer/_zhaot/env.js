import _Promise from 'babel-runtime/core-js/promise';
import * as Cookies from 'es-cookie';
export var Env = {
    getUser: function getUser() {
        return Cookies.get('user');
    }
};
export function login(user) {
    return new _Promise(function (resolve, reject) {
        if (user) {
            Cookies.set('user', user);
            resolve(user);
        } else {
            reject(new Error('Invalid user: ' + user));
        }
    });
}
//# sourceMappingURL=env.js.map