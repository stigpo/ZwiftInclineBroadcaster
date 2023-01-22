console.log('Require: ZwiftMemoryMonitor')
const ZwiftMemoryMonitor = require('@zwfthcks/zwift-memory-monitor');
const zmm = new ZwiftMemoryMonitor(
    {
        // zwiftapp: 'zwiftapp.exe'
        retry: true,
        keepalive: true,
        log: console.log,
        timeout: 250
    });

const ip = require('ip')
const dgram = require('dgram')

var publicIp = "127.0.0.1";
var broadcastMask = "0.0.0.255";
if (process.argv.length > 2) {
    publicIp = process.argv[2];
}
else {
    publicIp = ip.address("public");
}

if (process.argv.length > 3) {
    broadcastMask = process.argv[3];
}

var broadIp = ip.or(publicIp, broadcastMask);
console.log("Ip:" + publicIp + " bip:" + broadIp);

try {
      var PORT = 12340;
      var BROADCAST_ADDR = broadIp;
      var server = dgram.createSocket("udp4");
      server.bind(function() {
          server.setBroadcast(true);
      });
} catch(e) {
    console.log(e)
}

function getRandomGrade(max) {
    return Math.round((Math.random() - 0.5) * max *10)/10;
}

var broadCastGrade = 0;
function broadcastNew() {
    broadCastGrade += getRandomGrade(1);
    callbackInclineChanged(broadCastGrade);
}

function simple_moving_averager(period) {
    var nums = [];
    return function(num) {
        nums.push(num);
        if (nums.length > period)
            nums.splice(0,1);
        var sum = 0;
        for (var i in nums)
            sum += nums[i];
        var n = period;
        if (nums.length < period)
            n = nums.length;
        return(sum/n);
    }
}

var buffer = require('buffer');
function callbackInclineChanged(grade, playerId) {
    try {
        console.log('Grade changed: ', grade.toFixed(1));
        var payload = {
            playerid: playerId,
            grade: Math.round(grade * 10),
            seq: Date.now()
        };
        var dataStr = JSON.stringify(payload);
        var data = Buffer.from(dataStr);
        server.send(data, 0, data.length, PORT, BROADCAST_ADDR, function () {
        //console.log("Sent '" + data + "'");
        });
    } catch (e) {
        console.log(e)
    }
}

class World {
    static Watopia = new World(1);
    static Richmond = new World(2);
    static London = new World(3);
    static NewYork = new World(4);
    static Innsbruck = new World(5);
    static Yorkshire = new World(7); 
    static Makuri = new World(9); 
    static France = new World(10); 
    static Paris = new World(11); 

    static get(intValue) {
        var values = Object.values(World);
        for (var n = 0; n < values.length; n++) { 
            if (values[n].id == intValue) {
                return values[n];
            }
        }

        return undefined;
    }

    id; 
    constructor(id)
    {
        this.id = id;
    }
}

// moving average class
var m_sma = simple_moving_averager(3);
const FeetToMeter = 0.3048;
const WatopianFeetToMeter = 0.5;
const WorldAltitudeToMetersFactor = new Map([
    [World.Watopia.id, WatopianFeetToMeter],
    [World.Richmond.id, 1],
    [World.London.id, 1],
    [World.NewYork.id, 1],
    [World.Innsbruck.id, 1],
    [6, 1],
    [World.Yorkshire.id, 1],
    [8, 1],
    [World.Makuri.id, 1],
    [World.France.id, 1],
    [World.Paris.id, 0.5],
]);

const WorldAltitudeToMetersOffset = new Map([
    [World.Watopia.id,    -4500],
    [World.Richmond.id,   -9000],
    [World.London.id,    -10000],
    [World.NewYork.id,   -10000],
    [World.Innsbruck.id, +13500],
    [6, 0],
    [World.Yorkshire.id,  -9000],
    [8, 0],
    [World.Makuri.id,    -15000], 
    [World.France.id,     -9000],
    [World.Paris.id,      -4500],
]);

var prevDist = 0;
var prevAlt = 0;
var prevInstantAlt = 0;
var prevInstantDist = 0;
var curGrade = 0;
var prevGrade = -10000;
var prevWorld = 0;
var first = true;
var iter = 0;
var accElevationGain = 0;
var accElevationLoss = 0;

function CalcSnr(absDeltaAlt, deltaDist) {
    var low = 1.0 / (deltaDist - 0.5);
    var mid = 1.0 / deltaDist;

    var noise = (low / mid) - 1;
    var nr = 1.0 / noise;
    var snr = absDeltaAlt * nr;
    return snr;
}

function SendGrade(grade, playerId) {
    if (Math.abs(grade) < 200) {
        grade = Round10th(grade);
        if (prevGrade != grade) {
            prevGrade = grade;
            if (callbackInclineChanged != null) {
                callbackInclineChanged(grade, playerId);
            }
        }
    }
}

function Round10th(num) {
    return Math.round((num + Number.EPSILON) * 10) / 10.0;
}

var running = true;
function KillProcess() {
    console.log('KillProcess called');
    running = false;
}

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on('SIGTERM', KillProcess);
process.on('SIGINT', KillProcess);
process.on('uncaughtException', function(e) {
    console.log('Uncaught exception:', e);
    KillProcess();
});

var lastZmmError = null;
function KeepRunning() {
    setTimeout(function () {
        if (zmm) {
            if (zmm.lasterror) {
                if (lastZmmError != zmm.lasterror) {
                    console.log('ZMM last error:', zmm.lasterror);
                }

                lastZmmError = zmm.lasterror;
            }
        } else {
            console.log('ZMM not defined');
            KillProcess();
        }
        
        if (running) {
            KeepRunning();
        } else {
            process.exit();
        }
    }, 5000);
}

function CalculateGrade(playerState) {
    var playerId = playerState.player;
    var dist = playerState.distance;
    var alt = playerState.altitude;
    var altO = alt;

    var altToMeterFactor = WorldAltitudeToMetersFactor.get(playerState.world)
    if (altToMeterFactor !== undefined && altToMeterFactor != 1) {        
        alt = alt * altToMeterFactor;        
    }
    var altToMeterOffset = WorldAltitudeToMetersOffset.get(playerState.world)
    if (altToMeterOffset !== undefined && altToMeterOffset != 0) {
        alt = alt + altToMeterOffset;
    }

    alt = alt / 100.0;
    altO = altO / 100.0;
    var newWorld = playerState.world != prevWorld;
    prevWorld = playerState.world;

    var deltaDist = dist - prevDist;
    if (deltaDist < 0 || dist == 0 || newWorld) {
        prevDist = dist; // Make sure we are not stuck in negative delta
        first = true;
        return;
    }

    if (iter++ < 10)
    {
        var curGrade
        var snr = 0.0;
        var deltaAlt = alt - prevAlt;
        var instantDeltaAlt = alt - prevInstantAlt;
        prevInstantAlt = alt
        var absDeltaAlt = Math.abs(deltaAlt);
        var absInstantDeltaAlt = Math.abs(instantDeltaAlt);
        console.log(`---- ${iter} Dist=${dist} (${deltaDist}) Alt=${alt.toFixed(2)}/AltO=${altO.toFixed(2)} (${deltaAlt.toFixed(3)}) snr=${snr.toFixed(3)} up=${accElevationGain.toFixed(1)} down=${accElevationLoss.toFixed(1)} world=${playerState.world} first=${first} pId=${playerId}`);
    }

    if (first) {
        prevDist = prevInstantDist = dist;
        prevAlt = prevInstantAlt = alt;
        prevGrade = -10000;
        accElevationGain = accElevationLoss = 0;
        first = false;
        iter = 0;
        return;
    }

    var instantDeltaDist = dist - prevInstantDist;
    prevInstantDist = dist;
    if (instantDeltaDist < 1) {
        return;
    }

    var deltaAlt = alt - prevAlt;
    var instantDeltaAlt = alt - prevInstantAlt;
    prevInstantAlt = alt
    var absDeltaAlt = Math.abs(deltaAlt);
    var absInstantDeltaAlt = Math.abs(instantDeltaAlt);
    var snr = CalcSnr(absDeltaAlt, deltaDist);
    if (absInstantDeltaAlt > 0.001 && deltaDist < 11 && prevGrade > -200) {
        // The error at 11m is low enough, so just cache in.
        // If less than 11 we check the SNR.
        if (snr < 3.5) { // consider SNR < 4
            var gradeAvg = m_sma(curGrade);
            //console.log(`---- Dist=${dist} (${deltaDist}) Alt=${alt.toFixed(2)}/AltO=${altO.toFixed(2)} (${deltaAlt.toFixed(3)}) snr=${snr.toFixed(3)} up=${accElevationGain.toFixed(1)} down=${accElevationLoss.toFixed(1)} grade=${curGrade.toFixed(2)}/${curGrade.toFixed(0)} gradeAvg=${gradeAvg.toFixed(2)}/${gradeAvg.toFixed(0)} world=${playerState.world}`);
            SendGrade(curGrade, playerId);
            return;
        }
    }

    if (deltaAlt >= 0) {
        accElevationGain += deltaAlt;
    } else {
        accElevationLoss -= deltaAlt;
    }

    var oldGrade = curGrade;
    curGrade = (deltaAlt / deltaDist) * 100;
    var gradeAvg = m_sma(curGrade);
    if (Round10th(oldGrade) != Round10th(curGrade)) {
        console.log(`++++ Dist=${dist} (${deltaDist}) Alt=${alt.toFixed(2)}/AltO=${altO.toFixed(2)} (${deltaAlt.toFixed(3)}) snr=${snr.toFixed(3)} up=${accElevationGain.toFixed(1)} down=${accElevationLoss.toFixed(1)} grade=${curGrade.toFixed(2)}/${curGrade.toFixed(0)} gradeAvg=${gradeAvg.toFixed(2)}/${gradeAvg.toFixed(0)} world=${playerState.world}`);
    }

    prevDist = dist;
    prevAlt = alt;
    SendGrade(curGrade, playerId);
}

try {
    if (zmm) {
        console.log('ZBI v1.0.0 will be broadcasting on:', publicIp);

        zmm.on('data', (playerState) => {
            try {
                //console.log(playerState)
                //console.log("PlayerState: %j", playerState)
                CalculateGrade(playerState);
            } catch (e) {
                console.log('exception in data', e);
            }
        })

        zmm.on('status.started', (...args) => {
            try {
                console.log('status.started', args)
            } catch (e) {
                console.log('exception in started', e)
            }
        })

        zmm.on('status.stopped', (...args) => {
            try {
                console.log('status.stopped', args)
            } catch (e) {
                console.log('exception in stopped', e)
            }
        })

        zmm.on('status.stopping', (...args) => {
            try {
                console.log('status.stopping', args)
            } catch (e) {
                console.log('exception in stopping', e)
            }
        })

        zmm.on('status.retrying', (...args) => {
            try {
                //console.log('status.retrying', args)
                process.stdout.write('.');
            } catch (e) {
                console.log('exception in retrying', e)
            }
        })

        zmm.once('ready', () => {
            try {
                console.log('Ready, starting ZMM');
                zmm.start()
            } catch (e) {
                console.log('error in zmm.start(): ', zmm.lasterror)
            }
        })
    
        console.log('Intialization done');
        KeepRunning();
    } else {
        console.log('ZMM was not initialized. Check installation of Node and permissions. Remember to add Native Tools when installing Node.');
    }
} catch (e) {
    console.log('exception in startup', e);
}
