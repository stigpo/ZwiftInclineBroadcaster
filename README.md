# ZwiftInclineBroadcaster

This is just a simple wrapper on top of [Zwift-Memory-Monitor](https://github.com/zwfthcks/zwift-memory-monitor) by zwfthcks. I use it in my phone app for controlling the incline of my treadmill based on the world incline as an alternative to the BLE/FTMS method, since this method has no setup cost after the initial installation. It can run in the background between sessions and just works all the time

Please note that this tool only broadcasts the incline over UDP on the local network. There are no known public clients using this data (I have not release the code for my app yet), so it is just a starting point for developers at this point. Feel free to contact me if you would like more details.

If you want information on the BLE/FTMS approach you can have a look at [How to connect an FTMS App to Zwift](https://1drv.ms/w/s!An3xkqoDsGqcp8Z0xYOxR-Rdak3UvA?e=o4Get4)

## Installing

Download [node.js](https://nodejs.org/en/download/current/)\
I have tested with the 64-bit version. I think you would need the bitness of the OS (which I guess for most is 64-bit these days).\
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

```
node .\src\Broadcaster.js
```

If for some reason the IP address calculated by the script is not correct (it should be your LAN address), you can override it
```
node .\src\Broadcaster.js [<ip> [<mask>]]
```

Note: There is a bug in the Zwift Installer that will cause the Zwift Launcher to inherit the elevation of the installer. This means that if you just updated and had to elevate in order to upgrade, your Zwift Launcher and subsequently the ZwiftApp will be running elevated. This will make the Zwift Memory Monitor unable to read the memory. I suggest that you restart the Zwift Launcher (from the windows tray) to make it run with normal privileges. The worse alternative is to elevate the ZwiftInclineBroadcaster (i.e. run PowerShell as administrator), but I would avoid that.

## Supported
- Last tested with: Zwift version 1.49.0
- Works with Zwift >= 1.32.0
- Node >=14.18.0 (but only tested w/Node >=19)
