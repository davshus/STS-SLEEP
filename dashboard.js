MAX_POINTS = 100000;
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
