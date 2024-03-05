'use strict';

var expect = require('chai').expect,
    resolve = require('path').resolve,
    ConfigBuilder = require('../lib/config-builder.js');

if (process.env.NODE_ENV === 'PROD') throw new Error('testing env should not be PROD');

//Test Suite #1
describe('ConfigBuilder Test Suite', function () {

    it('should find a .env file', function () {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E1");
        expect(process.env).to.have.property("TESTPASSWORD");
        expect(config.testingenv).to.equal(process.env.TEST);
        expect(config.testingenv).to.not.equal(undefined);
    });

    it('should generate a config object', function () {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E1");
        expect(config).to.have.property('settingA');
        expect(config).to.have.property('settingB');
        expect(config).to.have.property('settingC');
    });

    it( 'should properly construct nested config fields', function () {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E_Nested");
        expect(config).to.have.property('nested');
        expect(config.nested).to.deep.equal([
            { "foo": "bar" },
            { "baz": [ "foo", "bar" ] },
            [[1,2,3]]
        ]);
    });

    it('should override top-level config settings for each environment', function () {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        var config = cb.build("E1");
        expect(config.settingA).to.equal('new_value_for_A_on_E1');
        expect(config.settingB).to.equal('default_value_for_B');
        expect(config.settingC).to.equal('default_value_for_C');

        var config = cb.build("E2");
        expect(config.settingA).to.equal('default_value_for_A');
        expect(config.settingB).to.equal('new_value_for_B_on_E2');
        expect(config.settingC).to.equal('default_value_for_C');

    });

    it('should throw an error when requesting a non-existing environment', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        expect( function () { cb.build(""); } ).to.throw("Unknown environment");
        expect( function () { cb.build("WackyTacky"); } ).to.throw("Unknown environment");
    });

    it('should find settings for sub-sections', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        var config = cb.build("E1");    // with override
        expect(config).to.have.property('otherConfig');
        expect(config.otherConfig.settingOtherA).to.equal('value for settingOtherA in E1');
        expect(config.otherConfig.settingOtherB).to.equal('value for settingOtherB');

        var config = cb.build("E2");    // no override
        expect(config).to.have.property('otherConfig');
        expect(config.otherConfig.settingOtherA).to.equal('value for settingOtherA');
        expect(config.otherConfig.settingOtherB).to.equal('value for settingOtherB');
    });

    it('should do variable replacement at the top-level', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E1");
        expect(config.settingEnv).to.equal(process.env.HOME);
    });

    it('should do variable replacement at sub-sections', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E1");
        expect(config.otherConfig.settingOtherEnv).to.equal(process.env.HOME);
    });

    it('should do variable replacement at nested sub-sections', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E1");
        expect(config.otherConfig.nest.settingOtherNestedEnv).to.equal(process.env.HOME);
    });

    it('should do variable replacement in arrays', () => {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });
        var config = cb.build("E_Nested");
        expect(config.nestedAndInterpolated[0][0]).to.equal(process.env.HOME);
    })

    it('should read a data file', function(){
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        var config = cb.build("E1");    // no override
        expect(config.readEnvFile('data.txt')).to.equal('default_data');

        var config = cb.build("E2");    // with override
        expect(config.readEnvFile('data.txt')).to.equal('E2_data');
    });

    it('should prevent changing a config object', function() {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        var config = cb.build("E1");
        expect( function () { config.settingA = "x"; } ).to.throw("Cannot assign to read only property");
    });

    it('should prevent changing a nested config object', function() {
        var cb = new ConfigBuilder({ path: resolve(__dirname, 'config') });

        var config = cb.build("E1");
        expect( function () { config.otherConfig.nest.settingOtherNestedEnv = "x"; } ).to.throw("Cannot assign to read only property");
    });

    it('should allow changing a config object if not using freeze option', function() {
        var cb = new ConfigBuilder({ 
            path: resolve(__dirname, 'config'),
            freeze: false,
            cache: false
        });

        var config = cb.build("E1");
        expect( function () { config.settingA = "x"; } ).to.not.throw("Cannot assign to read only property");
    });

});