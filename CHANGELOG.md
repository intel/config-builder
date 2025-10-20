___
Version 2.1.0
* Added providing a default value when using env variables references and the variable does not exist
* Added support for self-referencing values. When a property value starts with "$cfg:" the remaining can
be the dotted path to another entry in config.
* Updated dependency packages
___
Version 2.0.0

CAUTION:  Updating to this version will break old configs that utilized array values since the resulting data structure is no longer the same.

* Fixed array handling in config files.  Arrays are no longer converted to objects with index keys and element values.
___