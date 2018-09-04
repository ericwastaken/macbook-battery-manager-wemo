#!/usr/bin/env node

// Startup messaging
console.log(`macbook-battery-manager starting up...`);

// Early Dependencies
const fs = require('fs');
const program = require('commander');
const pkg = require('./package.json');

/**
 * Logs a message and bails out from the node process.
 *
 * @param msg
 */
function bailOut(msg) {
  console.log(`Bailing: `, msg);
  process.exit(-1);
}

// Setup the CL parameters & verify we received what we need
// Note, this method will stop the node process if the CL parameters are not correct!
setupProgramOptions();

// ASSERT, we have the proper CLI arguments.

// Full Dependencies
const Wemo = require('wemo-client');
const macOsBattery = require('macos-battery');

// Initialize wemo-client
const wemo = new Wemo();

// Config mapped into local constants
const controlSwitch = program.switchname;
const percentTarget = program.percent;
const percentTolerance = program.tolerance;
const batteryCheckIntervalMinutes = program.interval;
const verboseLog = program.verbose;

// Globals
let switchState = 'off';
let deviceClient = null;
let intervalHandle = null;

/**
 * Declare Package Methods - START
 */

/**
 * Sets up the CL options and arguments.
 *
 */
function setupProgramOptions() {
  // Setup the various CL arguments
  program
      .version(pkg.version)
      .option(
          '-s, --switchname <"switch name">',`
          The name of the Wemo switch to control. Must match the name in your Wemo app.`
      )
      .option(
          '-p, --percent <n>',`
          The battery target percent to aim for (this will be maintained within the tolerance). 
          Must be between 30 & 90 inclusive.`,
          parseInt
      )
      .option(
          '-t, --tolerance <n>',`
          Battery percent tolerance (battery will be maintained at target percent +/- tolerance). 
          Must be between 1 & 30 inclusive. Percent - tolerance must be >= 20. Percent + tolerance must be <= 90.`,
          parseInt
      )
      .option(
          '-i, --interval <n>',`
          The interval at which to check for battery charge (in minutes). Must be >= 1`,
          parseInt
      )
      .option(
          '-v, --verbose',`
          Produce verbose logging (outputs logs on every interval check).`
      )
      .parse(process.argv);

  // Ensure we received mandatory parameters.
  if (!program.switchname || !program.percent || !program.tolerance || !program.interval) {
    program.outputHelp();
    console.log('');
    process.exit(-1);
  }

  // Sanity Check. No Config? No Cigar!
  if (program.switchname === "" ||
      program.interval < 1 ||
      program.tolerance < 1 ||
      program.tolerance > 30 ||
      program.percent < 30 ||
      program.percent > 90 ||
      program.percent - program.tolerance < 20 ||
      program.percent + program.tolerance > 90
  ) {
    program.outputHelp();
    console.log('');
    process.exit(-1);
  }

}

/**
 * A callback for wemo.discover, this method checks for a specific Wemo switch name
 * and if found, sets up a recurring polling check for battery status. On each check
 * this method turns a wemo switch on/off depending on the desired criteria.
 *
 * @param err
 * @param device
 */
function foundDevice(err, device) {
  if (device.deviceType !== Wemo.DEVICE_TYPE.Switch || device.friendlyName !== controlSwitch) {
    // Not the device we're interested in, so return
    return
  }

  // ASSERT: The device is a switch and matches the name of the device we want to control!

  // Setup the client for the device that matches the desired name
  deviceClient = wemo.client(device);
  // Initial status output
  console.log(`Wemo Switch found: ${device.friendlyName}. Will maintain ${percentTarget}% +/- ${percentTolerance}%.`);
  // First check, then we start polling once that succeeds.
  // Note: We're not catching from this promise because the checkBatteryCharge()
  // itself ends the node process on an error!
  checkBatteryCharge()
    .then(()=>{
      // Listen for switch changed switchState
      deviceClient.on('binaryState', function(value) {
        switchState = (value === '1') ? 'on' : 'off';
        console.log(`Switch ${this.device.friendlyName} is ${switchState}`);
      });
      // Start Polling, but cancel any prior interval
      if (intervalHandle) clearInterval(intervalHandle);
      intervalHandle = setInterval(function() {
        checkBatteryCharge();
      }, batteryCheckIntervalMinutes * 60 * 1000);
    });
}

/**
 * Checks battery charge and decides if a Wemo switch should be switched on or off depending
 * on the desired criteria.
 *
 * Returns a promise once it is done checking. If any errors happen, this method will bailOut
 * of the node process.
 *
 * @return {Promise<any>}
 */
function checkBatteryCharge() {
  return new Promise((resolve,reject) => {
    macOsBattery.getBatteryStateObject()
        .then(batteryState => {
          const percent = batteryState.percent;
          const state = batteryState.state;
          // Can we perform any control?
          if (percent === -1 || state === 'undetermined' || state === 'no battery') {
            // We can't tell, so just ensure on.
            deviceClient.setBinaryState(1);
            bailOut(`Battery Charge State and Percent cannot be accessed. Ensuring switch is on and terminating.`);
          }

          // ASSERT: We have both percent and some battery state, so we can do what need to.

          // Are we over the target and the tolerance? Ensure off.
          // Are we under the target outside the tolerance? Ensure on.
          // Are we charging "up to" the top target and tolerance? Ensure on.
          // Otherwise, we're within the low end and high end, so we can ensure off.
          if (percent >= percentTarget + percentTolerance) {
            // Ensure off
            logVerbose(`Target: ${percentTarget}% +/- ${percentTolerance}%, Current: ${percent}%, Ensuring switch is off.`);
            deviceClient.setBinaryState(0);
          } else if (percent < percentTarget - percentTolerance) {
            // Ensure on
            logVerbose(`Target: ${percentTarget}% +/- ${percentTolerance}%, Current: ${percent}%, Ensuring switch is on.`);
            deviceClient.setBinaryState(1);
          } else if (state === 'charging' && percent < percentTarget + percentTolerance) {
            // Ensure on to push to the upper tolerance
            logVerbose(`Target: ${percentTarget}% +/- ${percentTolerance}%, Current: ${percent}%, Ensuring switch is on.`);
            deviceClient.setBinaryState(1);
          } else {
            // Ensure off
            logVerbose(`Target: ${percentTarget}% +/- ${percentTolerance}%, Current: ${percent}%, Ensuring switch is off.`);
            deviceClient.setBinaryState(0);
          }

          // Signal that we're done...
          resolve()

        })
        .catch(err => {
          // Some error, so we end the node process!
          bailOut(err);
        });
  })
}

/**
 * Logs output, but only if verboseLog == true.
 *
 * @param msg
 */
function logVerbose(msg) {
  if (verboseLog) {
    console.log(msg);
    process.stdout.write(msg + '\n');
  }
}

/**
 * Declare Package Methods - END
 */


/**
 * Fire off the Wemo discover, which starts up the package's loop.
 */

// Discover messaging
console.log(`Looking for ${controlSwitch}...`);

// Wemo discover - enumerates over all Wemo devices and fires the callback for each found device.
// Note this will fire once for a device found, but also might fire again if the device disconnects then reappears.
wemo.discover(foundDevice);

