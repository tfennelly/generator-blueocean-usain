const request = require('request');

exports.getPluginVersion = function(onsuccess, onfail) {
    //
    // TODO change to using the releases API once we are "publishing" releases on github
    //
    request({
        url: 'https://api.github.com/repos/jenkinsci/blueocean-plugin/tags',
        headers: {
            'User-Agent': 'Jenkins'
        }
    }, function (error, response, body) {
        if (error) {
            onfail(error);
        } else {
            try {
                var data = JSON.parse(body);
                var tag = data.shift();
                while(tag) {
                    if (tag.name.indexOf('blueocean-parent-') === 0) {
                        const version = tag.name.substring('blueocean-parent-'.length);
                        onsuccess(version);
                        return;
                    }
                    tag = data.shift();
                }
                onfail();
            } catch (e) {
                onfail(e);
            }
        }
    });
}