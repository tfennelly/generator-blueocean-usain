const generators = require('yeoman-generator');
const yosay = require('yosay');
var fs = require('fs');
const updateCenter = require('./../js/updateCenter');
const github = require('./../js/github');

const DEFAULT_VERSION = '1.0.0-b09-SNAPSHOT';

const pluginDetails = {};

module.exports = generators.Base.extend({

    initializing: function () {
        var self = this;
        var done = this.async();

        self.log(yosay('Yo there! Lets create a Jenkins Plugin (HPI) for Blue Ocean that contains ' +
            'a simple JavaScript client Extension Point implementation on the Run Details page...'));

        self.log('Looking up latest Blue Ocean release version...');

        // First try getting it from the update centers...
        updateCenter.getPluginVersion(function(version) {
            self.log('    latest version in Update Center is ' + version);
            pluginDetails.blueOceanVersion = version;
            done();
        }, function() {
            // If the update centers fail ... try getting it from github...
            github.getPluginVersion(function(version) {
                self.log('    latest version in GitHub is ' + version + ' (failed to locate in Update Center - default and experimental)');
                pluginDetails.blueOceanVersion = version;
                done();
            }, function() {
                // If everything fails, use the last known good version...
                self.log('    Unable to lookup Blue Ocean version at this time. Last known version is ' + DEFAULT_VERSION);
                pluginDetails.blueOceanVersion = DEFAULT_VERSION;
                done();
            });
        });
    },

    prompting: function () {
        var self = this;

        // TODO: remove the following once 1.0.0-b09 is released
        if (pluginDetails.blueOceanVersion === '1.0.0-b08') {
            self.log("    ------------------------------");
            self.log("    Version 1.0.0-b08 doesn't work with this generator.");
            self.log("    Setting version to 1.0.0-b09-SNAPSHOT.");
            self.log("    Be sure to have a local build of 1.0.0-b09-SNAPSHOT.");
            self.log("    This will go away once 1.0.0-b09 is released.");
            self.log("    ------------------------------");
            pluginDetails.blueOceanVersion = DEFAULT_VERSION;
        }

        this.log('\nPlease enter the maven artifact info for the new plugin:');

        return this.prompt([
            {
                type: 'input',
                name: 'groupId',
                message: 'groupId',
                default: 'io.jenkins.blueocean.plugins'
            },
            {
                type: 'input',
                name: 'artifactId',
                message: 'artifactId',
                default: 'blueocean-usain'
            },
            {
                type: 'input',
                name: 'version',
                message: 'version',
                default: '1.0-SNAPSHOT'
            }
        ]).then(function (answers) {
            if (fs.existsSync(answers.artifactId)){
                self.log("Ooops ... we can't create a plugin project in '" + answers.artifactId + "' because that directory already exists.");
                process.exit(1);
            }
            self.destinationRoot(answers.artifactId);
            pluginDetails.plugin_groupId = answers.groupId;
            pluginDetails.plugin_artifactId = answers.artifactId;
            pluginDetails.plugin_version = answers.version;
        }.bind(this));
    },

    writing: {
        pom_and_package: function() {
            this.fs.copyTpl(
                this.templatePath('pom.xml'),
                this.destinationPath('pom.xml'),
                pluginDetails
            );
            this.fs.copyTpl(
                this.templatePath('package.json'),
                this.destinationPath('package.json'),
                pluginDetails
            );
        },
        src: function() {
            this.fs.copy(
                this.templatePath('src'),
                this.destinationPath('src')
            );
        },
        mvn_exec_node: function() {
            this.fs.copy(
                this.templatePath('.mvn_exec_node'),
                this.destinationPath('.mvn_exec_node')
            );
        }
    },

    install: function () {

        this.log("\nNow let's install some NPM packages...\n");

        // dependencies ...
        this.npmInstall(
            [
                "@jenkins-cd/design-language",
                "@jenkins-cd/js-extensions",
                "@jenkins-cd/blueocean-core-js",
                "@jenkins-cd/js-modules",
                "react@15.1.0",
                "react-dom@15.1.0"
            ],
            {'save': true}
        );

        // devDependencies ...
        this.npmInstall(
            [
                "@jenkins-cd/js-builder",
                "@jenkins-cd/js-test",
                "babel-eslint@6.0.2",
                "babel-plugin-transform-decorators-legacy@1.3.4",
                "babel-polyfill@6.13.0",
                "babel-preset-es2015@6.6.0",
                "babel-preset-react@6.5.0",
                "babel-preset-stage-0@6.5.0",
                "eslint@2.8.0",
                "eslint-plugin-react@5.0.1",
                "gulp@3.9.1"
            ],
            {'save-dev': true}
        );
    },

    end: function() {
        this.log("");
        this.log("*************************************************************************");
        this.log("");
        this.log("And that's it, the plugin is now created.");
        this.log("");
        this.log("Next steps:");
        this.log("  1. Change directory to '" + pluginDetails.plugin_artifactId + "'.");
        this.log("  2. Run 'mvn clean install' to build the plugin (HPI).");
        this.log("  3. Run 'mvn hpi:run' to start the plugin.");
        this.log("  4. Go to http://localhost:8080/jenkins.");
        this.log("  5. Go through the Jenkins install process; install the default");
        this.log("     plugin set.");
        this.log("  6. Create a simple pipeline job. Make sure there's a small sleep");
        this.log("     step in this job (e.g. 10 seconds), stopping it from finishing");
        this.log("     immediately when run.");
        this.log("  7. Go to http://localhost:8080/jenkins/blue and run the job.");
        this.log("  8. Go to the 'Run Details' page of the executing job and see Usain");
        this.log("     Bolt do his thing.");
        this.log("");
        this.log("For more information and other build options, go to");
        this.log("https://www.npmjs.com/package/generator-blueocean-usain");
        this.log("");
        this.log("*************************************************************************");
        this.log("");
    }
});