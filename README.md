# ZwiftInclineBroadcaster

This is just a simple wrapper on top of [Zwift-Memory-Monitor](https://github.com/zwfthcks/zwift-memory-monitor) by zwfthcks. I use it in my phone app for controlling the incline of my treadmill based on the world incline as an alternative to the BLE/FTMS method, since this method has no setup cost after the initial installation. It can run in the background between sessions and just works all the time

Please note that this tool only broadcasts the incline over UDP on the local network. There are no known public clients using this data (I have not release the code for my app yet), so it is just a starting point for developers at this point. Feel free to contact me if you would like more details.

If you want information on the BLE/FTMS approach you can have a look at [How to connect an FTMS App to Zwift](https://1drv.ms/w/s!An3xkqoDsGqcp8Z0xYOxR-Rdak3UvA?e=o4Get4)

## Installing

Download [node.js](https://nodejs.org/en/download/current/)\
During the installation process you must tick the option to install additional tools for Native Modules (Chocolatey)\
![Image of Tools for Native Modules installer page](/images/NodeInstallNativeTools.png)


```
mkdir zib
cd zib

git clone https://github.com/stigpo/ZwiftInclineBroadcaster.git
cd .\ZwiftInclineBroadcaster\

npm install
node .\src\Broadcaster.js

```

## Running

Needs to run with admin priviledges for ZMM to work.
```
node .\src\Broadcaster.js
```

## Supported

- Node >=14.18.0 (but only tested w/Node >=19)
