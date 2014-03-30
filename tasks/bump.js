/*
 * Increase version number
 *
 * grunt bump
 * grunt bump:svn
 * grunt bump:patch
 * grunt bump:minor
 * grunt bump:major
 *
 * @author Vojta Jina <vojta.jina@gmail.com>
 * @author Mathias Paumgarten <mail@mathias-paumgarten.com>
 * @author Adam Biggs <email@adambig.gs>
 * @author Jakub Nesnídal <arakir@seznam.cz>
 */
var semver = require('semver');
var svn_info = require('svn-info');
var exec = require('child_process').exec;

module.exports = function(grunt) {

  var DESC = 'Increment the version, commit and tag';
  grunt.registerTask('bump', DESC, function(versionType, incOrCommitOnly) {
    var opts = this.options({
      bumpVersion: true,
      files: ['package.json'],
      updateConfigs: [], // array of config properties to update (with files)
      commit: true,
      commitMessage: 'Release v%VERSION%',
      commitFiles: ['package.json'], // '-a' for all files
      createTag: true,
      tagName: 'v%VERSION%',
      tagMessage: 'Version %VERSION%',
      tagLocation: ''
    });

    if (incOrCommitOnly === 'bump-only') {
      grunt.verbose.writeln('Only incrementing the version.');

      opts.commit = false;
      opts.createTag = false;
    }

    if (incOrCommitOnly === 'commit-only') {
      grunt.verbose.writeln('Only commiting/taggin.');

      opts.bumpVersion = false;
    }

    var exactVersionToSet = grunt.option('setversion');
    if (!semver.valid(exactVersionToSet)) {
        exactVersionToSet = false;
    }

    var done = this.async();
    var queue = [];
    var next = function() {
      if (!queue.length) {
        return done();
      }
      queue.shift()();
    };
    var runIf = function(condition, behavior) {
      if (condition) {
        queue.push(behavior);
      }
    };

    var globalVersion; // when bumping multiple files
    var svnVersion;    // when bumping using `svn info`
    var VERSION_REGEXP = /([\'|\"]?version[\'|\"]?[ ]*:[ ]*[\'|\"]?)([\d||A-a|.|-]*)([\'|\"]?)/i;

    // GET SVN INFO
    var svnInfo;
    var getSvnInfo = function(prop){
      if (!svnInfo) {
        svnInfo = svn_info.sync();
      }
      return prop ? svnInfo[prop] : svnInfo;
    };


    // GET VERSION FROM SVN
    runIf(opts.bumpVersion && versionType === 'svn', function(){
      svnVersion = svn_info.sync(getSvnInfo('url'))['revision'];
      next();
    });


    // BUMP ALL FILES
    runIf(opts.bumpVersion, function(){
      opts.files.forEach(function(file, idx) {
        var version = null;
        var content = grunt.file.read(file).replace(VERSION_REGEXP, function(match, prefix, parsedVersion, suffix) {
          svnVersion = svnVersion && parsedVersion + '-' + svnVersion;
          version = exactVersionToSet || svnVersion || semver.inc(parsedVersion, versionType || 'patch');
          return prefix + version + suffix;
        });

        if (!version) {
          grunt.fatal('Can not find a version to bump in ' + file);
        }

        grunt.file.write(file, content);
        grunt.log.ok('Version bumped to ' + version + (opts.files.length > 1 ? ' (in ' + file + ')' : ''));

        if (!globalVersion) {
          globalVersion = version;
        } else if (globalVersion !== version) {
          grunt.warn('Bumping multiple files with different versions!');
        }

        var configProperty = opts.updateConfigs[idx];
        if (!configProperty) {
          return;
        }

        var cfg = grunt.config(configProperty);
        if (!cfg) {
          return grunt.warn('Can not update "' + configProperty + '" config, it does not exist!');
        }

        cfg.version = version;
        grunt.config(configProperty, cfg);
        grunt.log.ok(configProperty + '\'s version updated');
      });
      next();
    });


    // when only commiting, read the version from package.json / pkg config
    runIf(!opts.bumpVersion, function() {
      if (opts.updateConfigs.length) {
        globalVersion = grunt.config(opts.updateConfigs[0]).version;
      } else {
        globalVersion = grunt.file.readJSON(opts.files[0]).version;
      }

      next();
    });


    // COMMIT
    runIf(opts.commit, function() {
      var commitMessage = opts.commitMessage.replace('%VERSION%', globalVersion);

      exec('svn commit ' + opts.commitFiles.join(' ') + ' -m "' + commitMessage + '"', function(err, stdout, stderr) {
        if (err) {
          grunt.fatal('Can not create the commit:\n  ' + stderr);
        }
        grunt.log.ok('Committed as "' + commitMessage + '"');
        next();
      });
    });


    // CREATE TAG
    runIf(opts.createTag, function(){
      var tagName = opts.tagName.replace('%VERSION%', globalVersion);
      var tagMessage = opts.tagMessage.replace('%VERSION%', globalVersion);
      var toUrl;
      var fromUrl = getSvnInfo('url');
      var tagLocation = opts.tagLocation.replace(/\/$/,'');


      if (!tagLocation) {
        grunt.verbose.writeln('Trying to find tags location from: ' + fromUrl);
        ['trunk','branches'].some(function(dir){
          tagLocation = fromUrl.substring(0,fromUrl.lastIndexOf(dir));
          tagLocation += tagLocation && 'tags';
          return tagLocation;
        });
      }

      grunt.verbose.writeln('Resolved tags location: ' + tagLocation);

      if (!tagLocation) {
        grunt.fatal('Can not resolve tags location');
      }

      toUrl = tagLocation + '/' + tagName;

      exec('svn copy "' + fromUrl + '" "' + toUrl + '" -m "' + tagMessage + '"' , function(err, stdout, stderr) {
        if (err) {
          grunt.fatal('Can not create the tag:\n  ' + stderr);
        }
        grunt.log.ok('Tagged as "' + tagName + '"');
        next();
      });
    });

    next();
  });


  // ALIASES
  DESC = 'Increment the version only.';
  grunt.registerTask('bump-only', DESC, function(versionType) {
    grunt.task.run('bump:' + (versionType || '') + ':bump-only');
  });

  DESC = 'Commit, tag, push without incrementing the version.';
  grunt.registerTask('bump-commit', DESC, 'bump::commit-only');
};

