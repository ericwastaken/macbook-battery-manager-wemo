# macbook-battery-manager-wemo

> When running on a macOs device with a battery (Macbook) that is plugged into a Belkin Wemo switch
> this utility will maintain the Macbook at a certain battery charge percent +/- a tolerance by 
> powering the switch on/off as needed. 

## Disclaimer

I AM NOT A BATTERY EXPERT. THIS UTILITY MIGHT DAMAGE YOUR MACBOOK BATTERY. USE THIS SETUP AT YOUR OWN RISK. 

## Summary

Some laptops from Lenovo and others detect when the device is always plugged into power and give the owner the option of holding 
the battery at a state of partial charge. Lenovo calls it "Conservation Mode" and the purpose is to extend battery life for notebooks
that are always plugged into power.

Apple's own website states that if a device is to be stored long term, the battery should be charged to 50% ("Store it half-charged when you store it long term"), even going as far as
recommending that the device battery be topped off to 50% at least every six months. See [Maximizing Battery Life and Lifespan](https://www.apple.com/batteries/maximizing-performance/).

Despite this recommendation, Macbooks and macOS provide no mechanism to hold a notebook's charge at a certain percent when it's always connected to power.

I've read of some people hacking the charge cable to achieve some charge blocking, but messing with a cable seemed like a bad idea to me, though I admit possibly managing battery by switching power 
on/off very frequently might be equally as bad (maybe worse)!

Enter this command line utility: when running on a Macbook that is also plugged into a Wemo switch, this utility will monitor the notebook's charge and then either flip the Wemo switch on or off to maintain the desired charge +/- a tolerance.

## Installation

To install this utility globally:

```
$ npm install -g macbook-battery-manager-wemo
```

## Config

To begin using this utility, you must first make a copy of the config template provided. You can do that with then following commands in terminal:
```bash
$ cp config-template.js config.js
```

After this, simply edit **config.js** with your favorite editor and set values to suit.

The various configuration options are:
  
  - controlSwitch: The name of the Wemo switch to control. Must match the name in your Wemo app.  
  - percentTarget: The target battery percentage to aim for (this will be maintained within the tolerance).
  - percentTolerance: The battery percent tolerance (battery will be maintained at target +/- tolerance).
  - batteryCheckIntervalMinutes: The interval at which to check the current battery charge (in minutes).
  - verboseLog: When set to true, produces verbose logging (outputs logs on every interval check).

## FAQ

- What configuration is the best?
  - I have no idea. See the **Disclaimer** and **Summary** above. This is something 
you'll need to research and decide for yourself.
- What setting do I use?
  - I wrote this utility for fun and to experiment with Wemo switches doing something useful, so I'm not actually using it 
  regularly because I don't have enough experience nor data! I am publishing
  with the hope that others will also try it (possibly in limited fashion) and provide me feedback. However, if I was going to use it, I would 
  likely keep charge at 70% +/- 10% based on what I've been reading on various posts. 
- What the heck is a Wemo switch?
  - Wemo switches are power outlets made by Belkin that can be controlled via a Belkin supplied app as well as other
  services like IFTTT, Alexa and others. You can basically turn these switches on/off via software! Generally used for lamps, these devices
  have become popular with the *internet of things* revolution.  
  - You can order Wemo switches from Amazon and other places. Here are Amazon links:
    - [Wemo Mini Smart Plug](https://amzn.to/2NaPZkd)
    - [Wemo Insight WiFi Enabled Smart Plug](https://amzn.to/2NHP8EM)
    - [Wemo Switch Smart Plug](https://amzn.to/2NMH1H4)
- Are Wemo devices secure?
  - That's a big question that I'm not going to try to answer fully here. 
  - However, before writing this utility I always thought that Wemo devices sure had some kind of authentication. Yet,
  this utility is able to find these devices on the network and then send instructions to them (turn on / turn off) with zero authentication. So, it seems that any device
  on the network that understands the Wemo protocol can control these. As such, I would only install these in a network that is already controlled
  by other mechanisms. I also would not connect anything of much significance to these switches. For instance, if someone connects to my network
  and messes with my lights, that might not be something of much concern. If you have a WiFi network only, the WiFi security is good enough on most days. However if your network is also wired
  you should consider that anyone can theoretically plug in a notebook to your wired network and control these devices. Sure, ther are ways to protect a wired network to not allow unrecognized devices,
  but most home users (and even small businesses) likely won't have taken the time to do this.
  - Caveat: It's possible that I never bothered to enable device authentication on my Wemo switches, though I honestly don't remember seeing such a thing in any of the Wemo setup wizards or prompts!
  If you know something about the security of these devices, by all means let me know. Open an issue and let me know your thoughts.

## Usage

Once you have setup a **config.js** with parameters to suit your needs simply open a terminal window and run.

```bash
$ ./macbook-battery-manager.js
```

Once the command starts, you'll see output similar to:
```bash
Battery manager starting up...
Looking for your-device-name...
Wemo Switch found: your-device-name. Will maintain 70% +/- 7%.
Switch your-device-name is off
```

Or if you enable verbose:
```bash
Battery manager starting up...
Looking for your-device-name...
Wemo Switch found: your-device-name. Will maintain 70% +/- 7%.
Target: 70% +/- 7%, Current: 92%, Ensuring switch is off.
Switch your-device-name is off
Target: 70% +/- 7%, Current: 89%, Ensuring switch is off.
Target: 70% +/- 7%, Current: 87%, Ensuring switch is off.
```

To stop the utility, simply press **CTRL+C**. Ensure that the Wemo switch is at the desired setting once you stop the utility. All Wemo switches
have an on/off button you can manually press.

## Requirements

This package supports macOS 10.11 or newer. Please report if this works on older versions of macOS via issues so that we can update the requirements check.

## Limitations

At present, the API returns status of the primary device's battery. Are there Macs with multiple batteries? Open an issue and let us know!

## Under the Hood

This package uses the [macos-battery](https://www.npmjs.com/package/macos-battery) package which in turn uses macOs's `pmset -g batt` command to get status from the OS. 

## License

MIT © [Eric A. Soto](https://ericsoto.net/)
