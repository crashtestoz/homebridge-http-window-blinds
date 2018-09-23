# Homebridge HTTP Window Blinds

This is based on an Archived module by @jeffreylanters
A simple [Homebridge](https://github.com/nfarina/homebridge) plugin for controlling window blinds over HTTP. This required a DIY device to move the windows blinds cord.

This plugin handles opening and closing blinds from 0% to 100%. It also updates the current position of the blinds if they moved outside HomeKit with other means e.g manual url request.

## IMPORTANT

- Requires Node.js >= 7.6.0
- If you're seeing errors then please check your node version before creating a new issue: node -v.

## Installation

- Install homebridge: `sudo npm install -g homebridge`
- Install this plugin: `sudo npm install -g homebridge-http-window-blinds`
- Update your configuration file. See config sample below.

## Config sample

```json
{
    // ...
    "accessories": [
        {
            // Required
            "accessory": "HttpWindowCovering",
            "name": "Office Blinds",
            "urlSetTargetPosition": "http://192.168.1.100/blinds?open=%VALUE%",
            "urlGetCurrentPosition": "http://192.168.1.100/status",

            // Optional
            "outputValueMultiplier": 0.8
        }
    ],
    // ...
}
```

## Under the hood

When setting the target position the url from the config will be used. %VALUE% will be replaced will the value passed by your Homekit app. This will be a value between 0 and 100 depending on the status of your window covering. Once the HTTP request was done, the current position will be updated so the Homekit app will complete and can take another request. There is no time-out for this request.

The responce from urlGetCurrentPosition should be json e.g. {"position":"20"} where 20 is 20% open.
