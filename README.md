# Environment Configuration Builder


## Overview
The Environment Configuration Builder (a.k.a. `config-builder`) is a tool to help store and manage configuration options for application that can support multiple environments (i.e. production, development, test, etc).
Custom environment config works by providing overriding values for settings that only apply on the requested environment.
Settings can be organized in multiple modules or sets (i.e. WebServerConfig, CacheConfig, etc)


## Installation
```
npm install --save @intelcorp/config-builder
```

## API Reference
### cn = new ConfigBuilder(opts)
Creates a new instance of ConfigBuilder.

* `opts.configPath`: Required. Path to the directory where to find the configuration files for all environments.
* `opts.defaults`: Name of the folder containging the default values for all environments. Defaults to `__defaults__`
* `opts.freeze`: Indicates whether to freeze the returned config object or not. Defaults to true.
* `opts.cache`: Indicates whether to use a cache. Defaults to true.

### cfg = cb.build(env)
Returns a map (`cfg`) with configuration settings for the requested environment. The `env` environment must be defined as a subfolder of `opts.configPath`. 

### cfg.readEnvFile(filename)
Reads a file (sync) from the config directory if exists and return its contents. Otherwise reads it from the default config folder.


## Basic Usage
On your application do:
```
var ConfigBuilder = require('@intelcorp/config-builder'),
    cb = new ConfigBuilder({path: PATH_TO_YOUR_CONFIG_FOLDER}),
    config = cb.build(NAME_OF_ENVIRONMENT_TO_LOAD);
```
Where:
`config` will be an object with all the settings for your requested environment.
`config.readEnvFile(filename)` is a helper function to load text files that you want to store with the config.
`config.ENV` is the name of the loaded environment


## Recommended Usage
* Create the following directory structure in your app:
```
/config
   index.js
   /envs
     /__defaults__
        config.json
        otherFile.json
     /dev
        config.json
     /prod
        config.json
```

Where `config/index.js` contains:
```
'use strict';

var env = process.env.NODE_ENV || 'dev',
    ConfigBuilder = require('@intelcorp/config-builder'),
    cb = new ConfigBuilder({path: __dirname}),
    config = cb.build(env);

module.exports = config;
```

Then elsewhere in your application, when you want to use your config, just do:
```
var config = require(`./config`);
```

The `/envs` directory contains one subdirectory for each supported environment.
The `__defaults__` directory is where you define all the baseline/default settings that your application supports. `config.json` will be the main settings file. 

To override any value for a particular environment, just create a new JSON file of the same name under the corresponding environment subdirectory, with *only* the settings you want to override. Any setting not explicitly defined on a particular environment, will use the value defined on the `__defaults__` folder.

Any property defined in a file named `config.json` will be available as `config.someSetting`. Properties defined on files named differently (i.e. `filename.json`) will be available as `filenameConfig.someSetting`.


## Using Environment Variables
For sensitive values, such as passwords and keys, it is not recommended to store them as plain text. In those cases, using environment variables is a more secure alternative.

To use env variables on your config files, define the value of a setting using the format:
```
{
	...
	"MY_PASS": "$env:MY_PASS",
	...
}
```
Where `MY_PASS` is the name of an environment variable on your system.


## Using .env Files
You can also define environment variables using a `.env` file placed on your config path. Whenever this file is present `Config-Builder` will read it an use it to create environment variables that can be used only for the current instance of your application and that can be used in your config files. 
This is specially useful for local development environments where you may want to have more control over the environment variables your application sees.
**It is highly recommented to NEVER commit your `.env` files to your source control repository, as they may contain sensitive values**

Env files should be structured as sinple JSON key/value maps:
```
{
   ...
   "SOME_VAR":"SOME_VALUE"
}
```






