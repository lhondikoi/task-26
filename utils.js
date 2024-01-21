function checkInteger(n) {
    return Number(n) === n && n % 1 === 0
}

function checkFloat(n) {
    return Number(n) === n && n % 1 !== 0
}

function isDuplicateEntityName(entities, newEntityName) {
    return entities.find(entity => entity.name.toLowerCase() === newEntityName.toLowerCase()) ? true : false
}

function isOverlapping(timeslotA, timeslotB) {
    if  ((timeslotA.start < timeslotB.start && timeslotB.start < timeslotA.end) || 
        (timeslotA.start < timeslotB.end && timeslotB.end  < timeslotA.end) || 
        (timeslotB.start < timeslotA.start && timeslotA.end < timeslotB.end) ||
        (timeslotB.start === timeslotA.start && timeslotA.end === timeslotB.end)) {
        return true
    }
}

module.exports = { checkInteger, checkFloat, isDuplicateEntityName, isOverlapping }