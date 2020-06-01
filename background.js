function storageSyncPromise(keys) { //local? idk lmao
    return new Promise(function(resolve, reject) {
        chrome.storage.sync.get(keys, function(result) {
            resolve(result);
        });
    });
}
const reset = false;
storageSyncPromise(['last_bedtime', 'last_wake'])
    .then(function(result) {
        console.log(result);
        if (reset || !('last_bedtime' in result)) {
            let date = new Date();
            date.setDate(date.getDate() - 1);
            date.setHours(21, 0, 0, 0);
            console.log('Setting bedtime to ' + date);
            chrome.storage.sync.set({last_bedtime: date.getTime()});
        }
        if (reset || !('last_wake' in result)) {
            let date2 = new Date();
            date2.setDate(date2.getDate() - 1);
            date2.setHours(6, 0, 0, 0);
            chrome.storage.sync.set({last_wake: date2.getTime()});
        }
    });
const sleepIncentives = [
    'The pandemic and social isolation has impacted sleep negatively. In one study, 57.1% of the participants reported poor sleep quality, and more than 25% experienced abnormalities in sleep rhythm. Astronauts in quarantine on the ISS also face the same problems and struggle with sleep.',,
    'Many studies have correlated poor sleep, especially sleep that does not coincide with the body’s natural rhythm, to adverse mental health affects, including depression and cognitive impairment. Small mistakes crash rockets.',
    'During circadian misaligned sleep, astronauts’ average sleep duration is shorter, and they ranked the sleep quality worse. So, like astronauts, maintaining a steady schedule is important to be productive and healthy.',
    'Even astronauts need a pick me up, but even a little caffeine a few hours before bed can disrupt our body’s circadian rhythm and mess with sleep. Try to limit the amount of tea, coffee or energy drinks.',
    'The International Space Station uses led’s to artificially simulate a light/dark pattern to keep astronauts’ circadian rhythm steady. To avoid resetting our own rhythms, try using blue light filters on screens and limit device usage at night.',
    'Setting a schedule and sticking to it is a huge factor in keeping astronauts successful in quarantine on the ISS. Exercise, steady eating patterns, and strict sleeping schedules keep them happy and healthy, and they can work for you, too!',
    'Bright screens and excess blue light trick your body into thinking it’s morning, resetting your circadian rhythm. A misaligned circadian rhythm leads to less overall sleep. This is especially a difficult situation for astronauts, as the light/dark cycle is 90 minutes in orbit.'
]
chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log('Alarm triggered: ' + alarm.name);
    switch(alarm.name) {
        case 'WARNING':
            chrome.notifications.create({
                type: 'basic',
                title: 'Radio from Mission Control',
                iconUrl: "img/shuttle-neutral.png",
                message: 'Great work today, Commander! Remember, you\'ll have to enter stasis in an hour to prepare for tomorrow.'
            });
            break;
        case 'BEDTIME':
            chrome.notifications.create({
                type: 'basic',
                title: 'Radio from Mission Control',
                iconUrl: "img/shuttle-neutral.png",
                message: 'Time to sleep, Commander. Good night, over.'
            });
            break;
        case 'OVERTIME':
        case 'DOUBLE_OVERTIME':
            chrome.notifications.create({
                type: 'basic',
                title: 'Radio from Mission Control',
                iconUrl: "img/shuttle-neutral.png",
                message: 'Commander, it is past your time to sleep! ' + sleepIncentives[Math.floor(Math.random() * sleepIncentives.length)]
            });
            break;
    }
})
chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.match(/WAKE/)) {
        console.log(msg);
        storageSyncPromise(['last_bedtime', 'last_wake']).then(function(result) {
            console.log(result);
            let last_bedtime = new Date(parseInt(result.last_bedtime)); //time in milliseconds?
            let last_wake = new Date(parseInt(result.last_wake));
            let bedtime = new Date();
            bedtime.setHours(last_bedtime.getHours());
            bedtime.setMinutes(last_bedtime.getMinutes());
            bedtime.setSeconds(last_bedtime.getSeconds());
            console.log('Time: ' + bedtime);
            chrome.alarms.create('BEDTIME', {
                when: bedtime.getTime()
            });
            chrome.alarms.create('WARNING', {
                when: bedtime.getTime() - 60 * 60 * 1000 // T - 1h
            });
            chrome.alarms.create('OVERTIME', {
                when: bedtime.getTime() + 15 * 60 * 1000 // T + 15m
            });
            chrome.alarms.create('DOUBLE_OVERTIME', {
                when: bedtime.getTime() + 30 * 60 * 1000 // T + 30m
            });
        })
    } else if (msg.match(/SLEEP/)) {

    }
    return true;
})