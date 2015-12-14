var BluetoothGATTServer = function (logger, filters) {
    'use strict';

    if (!filters) {
        console.error('Filter missing');
        if (this.logger) {
            this.logger.write('Filter missing');
        }
        return;
    }

    this.filters = filters;
    this.logger = logger;

    if (!navigator.bluetooth) {
        console.error('Bluetooth Web API not available');
        if (this.logger) {
            this.logger.write('Bluetooth Web API not available');
        }
        return;
    }




    this.connect = function (callback) {
        navigator.bluetooth.requestDevice({filters: this.filters})
            .then(device => {
                if (this.logger) {
                    this.logger.write("Device Found");
                }
                console.log("Device Found");

                return device.connectGATT();
            })
            .then(server => {
                if (this.logger) {
                    this.logger.write("Server connected");
                }

                this.server = server;
                callback();
            })
            .catch(error => {
                console.error('Error occured: ' + error);
                if (this.logger) {
                    this.logger.write('Error occured: ' + error);
                }
            });
    };

    this.isConnected = function () {
        return (this.device && this.server && this.server.connected);
    };

    let oneshot = function (server, serv, notifCallback) {
        (s => {
            console.log('Get Service');
            return s.getPrimaryService(serv.uuid);
        })(server)
            .then(service => {
                console.log('Get Characteristic');
                serv.instanceService = service;
                // return service.getCharacteristic(services[serv].activ);
                return service.getCharacteristic(serv.start);
            })
            .then(characteristic => {
                console.log('Start measurements');
                var u8 = new Uint8Array(1);
                u8[0] = 0x01;

                return characteristic.writeValue(u8);
            })
            .then(() => {
                return serv.instanceService.getCharacteristic(serv.data);
            })
            .then(characteristic => {
                serv.instanceCharacteristic = characteristic;
                return characteristic.readValue();
            })
            .then(buffer => {
                console.log(buffer);
                serv.convert(buffer, notifCallback);
            })
            .catch(error => {
                console.error(error);
            });
    };

    let notif = function (server, serv, notifCallback) {
        (s => {
            console.log('Get Service');
            return s.getPrimaryService(serv.uuid);
        })(server)
            .then(service => {
                console.log('Get Characteristic');
                serv.instanceService = service;
                // return service.getCharacteristic(services[serv].activ);
                return service.getCharacteristic(serv.start);
            })
            .then(characteristic => {
                console.log('Start measurements');
                var u8 = new Uint8Array(1);
                u8[0] = 0x01;

                return characteristic.writeValue(u8);
            })
            .then(() => {
                return serv.instanceService.getCharacteristic(serv.data);
            })
            .then(characteristic => {
                console.log('Start Notifs');

                serv.instanceCharacteristic = characteristic;
                characteristic.addEventListener('characteristicvaluechanged', notifCallback);
                return characteristic.startNotifications().then(() => {
                    console.log('Notifications Started');
                    serv.instanceCharacteristic.addEventListener('characteristicvaluechanged', event => {
                        console.log("Notified !");
                        serv.convert(event.target.value, notifCallback);
                    });
                });
                
                // return characteristic.readValue();
            })
            // .then(buffer => {
            //     notifCallback(serv.convert(buffer));
            // })
            .catch(error => {
                console.error(error);
            });
    };

    this.startService = function (serv, notifCallback) {

        if (!serv) {
            console.error('Unavailable Service');
            return;
        }

        if (!serv.mode || serv.mode === 'oneshot') {
            oneshot(this.server, serv, notifCallback);
        } else {
            notif(this.server, serv, notifCallback);
        }
    };

    this.stopService = function (serv) {
        if (!serv || !services.hasOwnProperty(serv)) {
            console.error('Unavailable Service');
            return;
        }
    };
};
