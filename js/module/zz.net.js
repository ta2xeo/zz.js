/** -*- coding: utf-8 -*-
 * zz.net.js
 * @copyright     2012 Tatsuji Tsuchiya
 * @author        <a href="mailto:ta2xeo@gmail.com">Tatsuji Tsuchiya</a>
 * @license       The MIT License http://www.opensource.org/licenses/mit-license.php
 * @version       0.0.1
 * @see           <a href="https://bitbucket.org/ta2xeo/zz.js">zz.js</a>
 */
"use strict";
zz.net = new function() {

    /**
     * The data object converts to get parameters.
     */
    function joinQuery(url, data) {
        var params = new Array();
        for (var key in data) {
            params.push(key + "=" + encodeURIComponent(data[key]));
        }
        if (params.length === 0) {
            return url;
        }
        var query = params.join("&");
        if (url.indexOf("?") != -1) {
            url += "&" + query;
        } else {
            url += "?" + query;
        }
        return url;
    }

    /**
     * submit form
     * @param {String} method default is POST
     * The data of arguments is hash object.
     * @example
     * var data = {
     *     "text": "sample",
     *     "id": 1,
     * };
     * same below.
     * <form method="POST" action=[url]>
     *   <input type="hidden" value="sample" name="text" />
     *   <input type="hidden" value="1" name="id" />
     * </form>
     */
    function submitForm(url, method, data) {
        var form = document.createElement('form');
        document.body.appendChild(form);
        for (var key in data) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', data[key]);
            form.appendChild(input);
        }
        form.setAttribute('action', url);
        form.setAttribute('method', method);
        form.submit();
    }

    function submitFormByPOST(url, data) {
        submitForm(url, "POST", data);
    }

    function submitFormByGET(url, data) {
        submitForm(url, "GET", data);
    }

    return zz.modularize(
        {
            joinQuery: joinQuery,
            submitForm: submitForm,
            submitFormByPOST: submitFormByPOST,
            submitFormByGET: submitFormByGET
        }
    );
};
