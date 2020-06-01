const MAX_POINTS = 100000;
const MISSION_POINTS = MAX_POINTS * 10;
const WAKE_UP_MESSAGE = 'Roger.'
const SLEEP_MESSAGE = 'Over, out.'
let awake;
let total_points;
let points_escrow;
let last_bedtime, last_wake, time;
const reset = false;
storageSyncPromise(['last_bedtime', 'last_wake', 'awake', 'total_points', 'points_escrow']).then(function(result) {
    console.log(result);
    if (reset || !('awake' in result)) {
        chrome.storage.sync.set({awake: true});
        awake = true;
    } else {
        awake = result.awake;
    }
    if (reset || !('total_points' in result)) {
        chrome.storage.sync.set({total_points: 0});
        total_points = 0;
    } else {
        total_points = result.total_points;
    }
    if (reset || !('points_escrow' in result)) {
        let escrow = pointsEarned(0, 0);
        chrome.storage.sync.set({points_escrow: escrow});
        points_escrow = escrow;
    } else {
        points_escrow = result.points_escrow;
    }
    if (awake) {
        document.querySelector('.button.sleep').innerText = SLEEP_MESSAGE;
    } else {
        document.querySelector('.button.sleep').innerText = WAKE_UP_MESSAGE;
    }
    let draw = SVG().addTo('body');
    draw.line(0, 0, 0, 0).stroke({
        width: 1,
        color: '#fff',
        dasharray: '5',
        linecap: 'round'
    }).addClass('path');
    last_bedtime = parseInt(result.last_bedtime);
    last_wake = parseInt(result.last_wake);
    time = Date.now();
    document.querySelector('.score').innerText = `${total_points + pointsNow(points_escrow, time, last_wake, last_bedtime)}/${MISSION_POINTS}`
    redrawIndicator();
    window.addEventListener('resize', redrawIndicator);
    document.querySelector('.button.sleep').style = '';
})

function pointsEarned(deltaHoursOfSleep, deltaHoursFromRhythm) {
    // deltaHoursOfSleep is the difference between goal sleep and actual sleep time (more sleep positive)
    // delta hours from rhythm is the difference from goal time to go to sleep from actual
    adjSleep = deltaHoursOfSleep < 0 ? 1 : 0.35;
    return MAX_POINTS * Math.exp(-adjSleep * deltaHoursOfSleep * deltaHoursOfSleep) * Math.exp(-0.5 * deltaHoursFromRhythm * deltaHoursFromRhythm)
}

function pointsAtTime(totalPoints, timeOfDay) {
    // timeOfDay is from 0 to 1 depending on the timing of the user's sleep rhythm
    // totalPoints is the points that the user earned from the night before
    return Math.atan(timeOfDay*Math.PI/2)*totalPoints;
}
function storageSyncPromise(keys) { //local? idk lmao
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(keys, function(result) {
            resolve(result);
        });
    });
}
function wakeUp() {
    storageSyncPromise(['last_bedtime', 'last_wake', 'total_score']).then(function(result) {
        let curr = new Date();
        let now = curr.getTime();
        let millisecondsSlept = now - result.last_bedtime;
        let hoursSlept = millisecondsSlept / (1000 * 60 * 60);
        let targetSleep = 8;
        let lastWake = new Date(parseInt(result.last_wake) + 86400000); //last wake + 1 day
        let driftMilliseconds = Math.abs(curr - lastWake);
        let drift = driftMilliseconds / (1000 * 60 * 60);
        console.log("Drift: " + drift);
        console.log("Slept: " + hoursSlept);
        let points = pointsEarned(hoursSlept - targetSleep, drift);
        chrome.storage.sync.set({
            last_wake: now,
            points_escrow: points,
            awake: true
        }, function() {
            document.querySelector('.button.sleep').innerText = SLEEP_MESSAGE;
            awake = true;
            chrome.runtime.sendMessage('WAKE', function() {
                console.log('Completed wake up procedure');
            });
        });
    })
}
function pointsNow(total_points, now, last_wake, last_bedtime) {
    return pointsAtTime(
        total_points,
        Math.max(
            1,
            (now - last_wake) / (last_bedtime - last_wake)
        )
    );
}
function goToSleep() {
    storageSyncPromise(['last_bedtime', 'total_score', 'points_escrow', 'last_wake']).then(function(result) {
        let now = Date.now();
        chrome.storage.sync.set({
            last_bedtime: now,
            total_score: pointsNow(
                parseInt(result.points_escrow),
                now,
                result.last_wake,
                result.last_bedtime
            ) + parseInt(result.total_score),
            awake: false
        }, function() {
            document.querySelector('.button.sleep').innerText = WAKE_UP_MESSAGE;
            awake = false;
            chrome.runtime.sendMessage('SLEEP', function() {
                console.log('Completed sleep procedure');
            });
        });
    });
}

function toggleSleepAction() {
    if (awake) {
        goToSleep();
    } else {
        wakeUp();
    }
}

document.querySelector('.button.sleep').addEventListener('click', toggleSleepAction);

//literally one mission

function redrawIndicator() {
    let earthBound = document.querySelector('.planet.earth').getBoundingClientRect();
    let earthPositionX = (earthBound.left + earthBound.right) / 2;
    let earthPositionY = (earthBound.top + earthBound.bottom) / 2;
    let neptuneBound = document.querySelector('.planet.neptune').getBoundingClientRect();
    let neptunePositionX = (neptuneBound.left + neptuneBound.right) / 2;
    let neptunePositionY = (neptuneBound.top + neptuneBound.bottom) / 2;
    let path = SVG('.path');
    path.attr({
        x1: earthPositionX,
        y1: earthPositionY,
        x2: neptunePositionX,
        y2: neptunePositionY
    });
    const progress = (total_points + pointsNow(points_escrow, time, last_wake, last_bedtime)) / MISSION_POINTS;
    const x = (1 - progress) * earthPositionX + progress * neptunePositionX;
    const y = (1 - progress) * earthPositionY + progress * neptunePositionY;
    document.querySelector('.spaceship-indicator').style = `left: ${x}px; top: ${y}px;`;
}