var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Choose your BLE device' });
});

router.get('/sensortag', function (req, res) {
    res.render('sensor', { title: 'TI Sensor Tag' });
});

router.get('/withings', function (req, res) {
    res.render('withings', { title: 'Withings' });
});

router.post('/log', function (req, res) {
    var logs = req.body;
    if (!logs) {
        res.send();
        return;
    }
    if (logs.err) {
        console.err(logs.err);
    }
    if (logs.log) {
        console.log(logs.log);
    }
    if (logs.warn) {
        console.log(logs.warn);
    }
    if (logs.obj) {
        console.log(JSON.parse(logs.obj));
    }
    res.send();
});

module.exports = router;
