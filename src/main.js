var React = require('react');
var ReactDOM = require('react-dom');
var SignIn = require('./jsx/signin.js')
var Profile = require('./jsx/profile.js')
var fs = require('fs')
var SharedContext = require('../common/SharedContext.js')
var util  = require('util'), spawn = require('child_process').spawn;
const EventEmitter = require('events');
var sudo = require('sudo-prompt');
var _ = require('lodash')
var async = require('async')
var portfinder = require('portfinder')
const Components = exports.components = {

};

function platformInitialize() {
    let platform = process.platform;
    if (platform == 'darwin') {
        var options = {
            name: 'SSClient'
        };

        fs.exists('/Library/Application Support/SSClient/proxy_conf_helper', function(exist) {
           if (!exist) {
               sudo.exec('mkdir -p "/Library/Application Support/SSClient/" ' +
                   ' && cp lib/shadowsocks/proxy_conf_helper \'/Library/Application Support/SSClient/\' ' +
                   ' && chown root:admin "/Library/Application Support/SSClient/proxy_conf_helper" ' +
                   ' && chmod a+rx "/Library/Application Support/SSClient/proxy_conf_helper" ' +
                   ' && chmod +s "/Library/Application Support/SSClient/proxy_conf_helper"', options,
                   function(error, stdout, stderr) {
                       if (error) throw error;
                       console.log('stdout: ' + stdout);
                   }
               );
           }
        });
    }
}

platformInitialize()

if (pageRoute == 'signin') {
    ReactDOM.render(
        <div>
            <SignIn/>
        </div>
        ,
        document.getElementById('root')
    );
}
else if (pageRoute == 'profile') {
    console.log(SharedContext)
    ReactDOM.render(
        <div>
            <Profile user={global.SharedInfo.user}/>
        </div>
        ,
        document.getElementById('root')
    );
}

const Bus = global.CommonEventBus = new EventEmitter();

Bus.on('Disconnect', function(){
    if (global.currentPort) {
        process.stdout.write('ON Disconnect');
        spawn('/Library/Application Support/SSClient/proxy_conf_helper', ['--mode', 'off', '--port', global.currentPort]);
    }
});

Bus.on('Connect', async function(port){
    process.stdout.write('ON Connect');
    spawn('/Library/Application Support/SSClient/proxy_conf_helper', ['--mode', 'global', '--port', global.currentPort]);

    if (process.platform == 'win32') {
        let httpProxtPort = await portfinder.getPortPromise();
        var cmd = './node_modules/.bin/hpts -s 127.0.0.1:' + httpProxtPort + ' -p ' + port;
        sudo.exec(cmd, {name: 'HTTP Auth'})
        console.log('http-cmd: ', cmd)
    }
});

process.on('exit', ()=>{
    Bus.emit('Disconnect')
})