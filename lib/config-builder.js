/*
 * Config builder
 * Copyright(c) 2022 Intel Corporation
 * MIT Licensed
 */

'use strict';

var fs = require('fs'),
    _ = require('lodash'),
    resolve = require('path').resolve,
    configsCache = {};

// name of the folder with default settings
const ENV_DEFAULTS = "__defaults__";

var configBuilder = function (opts) {
    // Path where to find config files for all environments
    this.configPath = opts.path;

    // Name of the folder containging the default values for all environments
    this.defaults = opts.defaults ? opts.defaults : ENV_DEFAULTS;

    // Indicates whether to freeze the returned config object or not. Defaults to true.
    this.freeze = (opts.freeze === null || opts.freeze === undefined) ? true : opts.freeze;

    // Indicates whether to use a cache. Defaults to true.
    this.cache = (opts.cache === null || opts.cache === undefined) ? true : opts.cache;
};

// build the config object
configBuilder.prototype.build = function(env) {
    var me = this;
    var config = {
        ENV: env
    };

    // check if we have built a config for this environment already
    // this prevents going back to the filesystem again, if not needed.
    if(this.cache && configsCache[env]) {
        return configsCache[env];
    }

    // read .env file if exists
    createEnvVariables(me.configPath);

    // read all the default settings
    applySettings(config, me.configPath, me.defaults, true);

    // read the settings for the selected environment
    applySettings(config, me.configPath, env, false);

    // reads a file (sync) from the config directory if exits,
    // otherwise reads it from the default config
    config.readEnvFile = function (filename) {
        var path = resolve(me.configPath, 'envs', env, filename);
        var def = resolve(me.configPath, 'envs', me.defaults, filename);
        try {
            return fs.existsSync(path)
                ? fs.readFileSync(path).toString()
                : fs.readFileSync(def).toString();
        } catch(e) {
            throw new Error(`Unable to read file from config: '${filename}'`);
        }
    }

    // store generated config for later use
    configsCache[env] = config;

    // freeze the config to prevent changes
    if(this.freeze) {
        deepFreeze(config);
    }

    return config;
}

// reads all json files on a subdirectory and sets
// the keys on the config object
function applySettings(config, configPath, src, isDefault) {
    var path = resolve(configPath, 'envs', src);

    if (!fs.existsSync(path) || !src) {
        throw new Error(`Unknown environment '${src}'`);
    }

    try {
        var files = fs.readdirSync(path);
    } catch(e) {
        throw new Error(`Unable to read environments config directory: '${path}'`);
    }

    files.forEach(function (file) {
        var name = file.split('.')[0];
        var ext = file.split('.')[1];

        if (ext === 'json') {
            var c = parseConfigFile(resolve(path, file));
            var fieldsMap = deepParse(c);

            if (name === 'config') {
                // keys defined on 'config.json' are set at the root level
                Object.assign(config, fieldsMap);
            } else {
                // keys defined on any other files are set to their own section
                // all sections must be defined on the defaults folder. 
                var keyName = name + 'Config';
                if (!config[keyName]) {
                    if(isDefault) {
                        config[keyName] = {};
                    } else {
                        throw new Error(`Unknown config section '${name}' in environment '${src}'`);
                    }
                }
                Object.assign(config[keyName], fieldsMap);
            }
        }
    });
}

function parseConfigFile(pathToFile) {
    // reads a file from the given path and
    // parses it as a JSON object, if not json
    // then throws a more descriptive error
    try {
        var str = fs.readFileSync(pathToFile);
        return JSON.parse(str);
    } catch(e) {
        throw new Error(`${pathToFile} is not a valid JSON file`);
    }
}

function createEnvVariables(configPath){
    var path = resolve(configPath);
    var filePath = resolve(path,".env");
    // Check that the file exists locally
    if(fs.existsSync(filePath)) {
        var fields = parseConfigFile(filePath);
        for (var key in fields) {
            if (fields.hasOwnProperty(key)) {
                process.env[key] = fields[key];
            }
        }
    }
}

function deepParse(obj) {

    // Arrays need to be handled a little differently than other objects to avoid converting them to key/value pairs
    if(Array.isArray(obj)) {
        return obj.map((item) => {
            if (typeof item === 'object') {
                return deepParse(item);
            } else {
                return interpolate(item)
            }
        })
    }

    return _.mapValues(obj, function(item){
        if(typeof item === 'object') {
            return deepParse(item);
        } else {
            return interpolate(item)
        }
    });
}

function interpolate(string) {
    var fieldName = string.toString().split(":");
    if (fieldName[0] === "$env") {
        return process.env[fieldName[1]];// split the field[item]
    }
    return string;
}

// Object.freeze() is not recursive. This allows for that.
function deepFreeze(object) {
    // Retrieve the property names defined on object
    const propNames = Object.getOwnPropertyNames(object);

    // Freeze properties before freezing self
    for (const name of propNames) {
        const value = object[name];

        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }

    return Object.freeze(object);
}

module.exports = configBuilder;
