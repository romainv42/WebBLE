(function (document) {
    'use strict';

    var logpre = document.getElementById('log'),
        logger = {
            write: function (txt) {
                console.log(logpre.innerText);
                if (logpre) {
                    logpre.innerText += txt + "\n";
                }
                this.send(txt, 'log');
            },
            reset: function () {
                if (logpre) {
                    logpre.innerText = '';
                }
            },
            send: function (txt, type) {
                let req = new XMLHttpRequest();
                req.open('POST', '/log');
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                req.send(type + '=' + encodeURIComponent(type === 'obj' ? JSON.stringify(txt) : txt));
            }
        },
        server,
        shortSignedAtOffset = function (data, offset) {
            let lvalue = data.getUint8(offset);
            let uvalue = data.getInt8(offset + 1);
            return ((uvalue << 8) / lvalue);
        },
        shortUnsignedAtOffset = function (data, offset) {
            console.log(data);
            let lvalue = data.getUint8(offset);
            console.log(lvalue);
            let uvalue = data.getUint8(offset + 1);
            console.log(uvalue);
            return ((uvalue << 8) / lvalue);
        };

    let services = {
        'temp' : {
            instanceService: null,
            instanceCharacteristic: null,
            uuid: 'F000AA00-0451-4000-B000-000000000000'.toLowerCase(),
            data: 'F000AA01-0451-4000-B000-000000000000'.toLowerCase(),
            start: 'F000AA02-0451-4000-B000-000000000000'.toLowerCase(),
            mode: 'oneshot',
            convert: function (buffer, cb) {
                let data = new DataView(buffer);
                var value = shortUnsignedAtOffset(data, 2);
                //var value = data.getInt16(2);
                console.log('value:' + value);
                cb(value / 128.0);
            }
        }
    };

    document.getElementById('btnconnect').addEventListener('click', function () {
        logger.write('Trying to connect...');

        server = new BluetoothGATTServer(logger, [{name: "Withings"}]);

        server.connect(function() {
            document.getElementById('list').className = "connected";
        });
    });

    var activeEvent = new Event('activate'),
        inactiveEvent = new Event('inactivate'),
        btns = document.querySelectorAll('.btn');

    for (let i = 0; i < btns.length; i += 1) {
        btns[i].addEventListener('click', event => {
            var btn = event.srcElement;
            if (btn.className.indexOf('on') >= 0) {
                // btn.className = btn.className.replace('on', 'off');
                btn.dispatchEvent(inactiveEvent);
            } else if (btn.className.indexOf('off') >= 0) {
                // btn.className = btn.className.replace('off', 'on');
                btn.dispatchEvent(activeEvent);
            }
        });
        btns[i].addEventListener('activate', event => {
            if (!server) {
                return;
            }
            var btn = event.srcElement;
            btn.className = btn.className.replace('off', 'on');
            let service = services[btn.getAttribute('data-service')];
            if (!service) {
                console.error('lol Noob !');
                return;
            }

            if (service.hasOwnProperty('before')) {
                server.startService(services[service.before], cal => {
                    console.log("calibration >>");
                    console.log(cal);

                    service.calib = cal;

                    server.startService(service, data => {
                        console.log("received: " + data);
                        document.getElementById(btn.getAttribute('data-display')).innerText = data;
                        btn.dispatchEvent(inactiveEvent);
                    });                
                });                                
            } else {
                server.startService(service, data => {
                    console.log("received: " + data);
                    document.getElementById(btn.getAttribute('data-display')).innerText = data ;
                    btn.dispatchEvent(inactiveEvent);
                });                
            }

        });
        btns[i].addEventListener('inactivate', event => {
            if (!server) {
                return;
            }
            var btn = event.srcElement;
            btn.className = btn.className.replace('on', 'off');
        });
    }

})(document);