# grunt-bump-svn

**Bump package version, create tag, commit...**

## Installation

Install npm package, next to your project's `Gruntfile.js` file:

    npm install grunt-bump-svn --save-dev

Add this line to your project's `Gruntfile.js`:

    grunt.loadNpmTasks('grunt-bump-svn');


## Usage

Let's say current version is `0.0.1`.

````
$ grunt bump
>> Version bumped to 0.0.2
>> Committed as "Release v0.0.2"
>> Tagged as "v0.0.2"

$ grunt bump:patch
>> Version bumped to 0.0.3
>> Committed as "Release v0.0.3"
>> Tagged as "v0.0.3"

$ grunt bump:minor
>> Version bumped to 0.1.0
>> Committed as "Release v0.1.0"
>> Tagged as "v0.1.0"

$ grunt bump:major
>> Version bumped to 1.0.0
>> Committed as "Release v1.0.0"
>> Tagged as "v1.0.0"

$ grunt bump:build
>> Version bumped to 1.0.0-1
>> Committed as "Release v1.0.0-1"
>> Tagged as "v1.0.0-1"

$ grunt bump:svn
>> Version bumped to 1.0.0-1-17354
>> Committed as "Release v1.0.0-1-17354"
>> Tagged as "v1.0.0-1-17354"
````

If you want to jump to an exact version, you can use the ```setversion``` tag in the command line.

```
$ grunt bump --setversion=2.0.1
>> Version bumped to 2.0.1
>> Committed as "Release v2.0.1"
>> Tagged as "v2.0.1"
```

Sometimes you want to run another task between bumping the version and commiting, for instance generate changelog. You can use `bump-only` and `bump-commit` to achieve that:

```bash
$ grunt bump-only:minor
$ grunt changelog
$ grunt bump-commit
```

## Configuration

This shows all the available config options with their default values.

```js
bump: {
  options: {
    files: ['package.json'],
    updateConfigs: [],
    commit: true,
    commitMessage: 'Release v%VERSION%',
    commitFiles: ['package.json'], // '-a' for all files
    createTag: true,
    tagName: 'v%VERSION%',
    tagLocation: '',
    tagMessage: 'Version %VERSION%',
  }
}
```

### files
List of files to bump. Maybe you wanna bump 'component.json' as well ?

### updateConfigs
Sometimes you load the content of `package.json` into a grunt config. This will update the config property, so that even tasks running in the same grunt process see the updated value.

```js
bump: {
  files:         ['package.json', 'component.json'],
  updateConfigs: ['pkg',          'component']
}
```

### commit
Do you wanna commit the changes ?

### commitMessage
If so, what is the commit message ? You can use `%VERSION%` which will get replaced with the new version.

### commitFiles
An array of files that you wanna commit. You can use `['-a']` to commit all files.

### createTag
Do you wanna create a tag ?

### tagName
If so, this is the name of that tag (`%VERSION%` placeholder is available).

### tagLocation
If so, this is the location of a folder where will be created that tag. By default it's resolved from your working copy URL.

### tagMessage
Yep, you guessed right, it's the message of that tag - description (`%VERSION%` placeholder is available).
