const config = {
  // The name of the Wemo switch to control. Must match the name in your Wemo app.
  "controlSwitch": "",
  // The target battery percentage to aim for (this will be maintained within the tolerance)
  "percentTarget": 70,
  // Produce verbose logging (outputs logs on every interval check)
  "verboseLog": false,
  // Battery percent tolerance (battery will be maintained at target +/- tolerance)
  "percentTolerance": 10,
  // The interval at which to check for battery charge (in minutes)
  "batteryCheckIntervalMinutes": 5
};

module.exports = config;




