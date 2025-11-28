const fs = require('fs');

function getRandomNumber(min, max, decimalPlaces = 0) {
    const factor = Math.pow(10, decimalPlaces);
    return (Math.random() * (max - min) + min).toFixed(decimalPlaces);
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

const initialTimestamp = new Date('2024-01-01T00:00:00'); // starting timestamp

let sql = 'INSERT INTO "public".datatable_80 (temperature, humidity, pressure, tvoc, cotwo, created_at, device) VALUES\n';
let currentTimestamp = initialTimestamp;

function getTemperatureAndHumidity(hour) {
    if (hour >= 6 && hour < 18) { // Daytime
        return {
            temperature: getRandomNumber(20, 35, 1),
            humidity: getRandomNumber(60, 80, 1)
        };
    } else { // Nighttime
        return {
            temperature: getRandomNumber(15, 25, 1),
            humidity: getRandomNumber(80, 100, 1)
        };
    }
}

let previousTemperatureHumidity = getTemperatureAndHumidity(currentTimestamp.getHours());
let previousPressure = getRandomNumber(1010, 1019);
let previousTvoc = getRandomNumber(0.01, 3.00, 2);
let previousCotwo = getRandomNumber(2.00, 4.00, 2);

const device = 72; // Constant value for the device column

for (let i = 0; i < 10000; i++) {
    const hour = currentTimestamp.getHours();
    const { temperature: tempBase, humidity: humBase } = getTemperatureAndHumidity(hour);

    const temperature = parseFloat(tempBase) + parseFloat(getRandomNumber(-0.5, 0.5, 1));
    const humidity = parseFloat(humBase) + parseFloat(getRandomNumber(-0.5, 0.5, 1));
    const pressure = parseFloat(previousPressure) + parseFloat(getRandomNumber(-0.5, 0.5, 1));
    const tvoc = parseFloat(previousTvoc) + parseFloat(getRandomNumber(-0.05, 0.05, 2));
    const cotwo = parseFloat(previousCotwo) + parseFloat(getRandomNumber(-0.05, 0.05, 2));

    // Ensuring values are within specified ranges
    previousTemperatureHumidity.temperature = Math.min(Math.max(temperature, tempBase - 1), tempBase + 1);
    previousTemperatureHumidity.humidity = Math.min(Math.max(humidity, humBase - 1), humBase + 1);
    previousPressure = Math.min(Math.max(pressure, 1010), 1019);
    previousTvoc = Math.min(Math.max(tvoc, 0.01), 3.00).toFixed(2);
    previousCotwo = Math.min(Math.max(cotwo, 2.00), 4.00).toFixed(2);

    sql += `(${previousTemperatureHumidity.temperature.toFixed(1)}, ${previousTemperatureHumidity.humidity.toFixed(1)}, ${previousPressure.toFixed(1)}, ${previousTvoc}, ${previousCotwo}, '${currentTimestamp.toISOString().slice(0, 19).replace('T', ' ')}', ${device})`;

    if (i < 9999) {
        sql += ',\n';
    } else {
        sql += ';\n';
    }

    currentTimestamp = addMinutes(currentTimestamp, 10);
}

// Write the SQL statement to a file
fs.writeFileSync('insert_records.sql', sql);

console.log('SQL insert statements have been written to insert_records.sql');
