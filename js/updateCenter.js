const request = require('request');

const DEFAULT_UC_JSON      = "/update-center.json";
const EXPERIMENTAL_UC_JSON = "/experimental/update-center.json";

exports.getPluginVersion = function(onsuccess, onfail) {
    get(DEFAULT_UC_JSON, onsuccess, function (){
        get(EXPERIMENTAL_UC_JSON, onsuccess, onfail);
    });
};

function get(updateCenterJSON, onsuccess, onfail) {
    request({
        url: 'http://updates.jenkins-ci.org' + updateCenterJSON,
        followAllRedirects: true
    }, function (error, response, body) {
        if (error) {
            onfail(error);
        } else {
            try {
                //
                // The update center returns JSONP. Nice :) So, we need to gather
                // that and strip off the JSONP poop we don't want before parsing the rest.
                //
                var ucJSONP = body;
                var ucJSON;

                // Strip off the JSONP poop from the star and end
                ucJSON = ucJSONP.replace(/^(updateCenter.post\()/, ""); // Removing leading "updateCenter.post("
                ucJSON = ucJSON.replace(/(\);)$/, ""); // Removing trailing ");"

                var jsonObj = JSON.parse(ucJSON);
                if (jsonObj.plugins && jsonObj.plugins.blueocean) {
                    onsuccess(jsonObj.plugins.blueocean.version);
                } else {
                    onfail();
                }
            } catch (e) {
                onfail(e);
            }
        }
    });
}