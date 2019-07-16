# helm
Quickly switch between your development artifacts.


## Installation

Presently Helm uses [ActivityWatch]() to collect desktop interaction data.
To install it, please follow the [guide](https://activitywatch.readthedocs.io/en/latest/installing-from-source.html) **except** replace the first step with
```sh
git clone --recursive https://github.com/nickbradley/activitywatch.git
```
to clone my forked version of the project.

## Configuration

1. Create a config file in ...
2. Make sure you can [open a file from the command line in IntelliJ](https://www.jetbrains.com/help/idea/opening-files-from-command-line.html) 
3. Make sure you can [open a file from the command line in VS Code](https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line)

## Misc

Changes to `/opt/activitywatch/aw_watcher_window/printAppTitle.scpt`:
```
global frontApp, frontAppName, windowTitle

set windowTitle to ""
tell application "System Events"
	set frontApp to first application process whose frontmost is true
	set frontAppName to name of frontApp
	set processBID to get the bundle identifier of frontApp
	tell process frontAppName
		try
			tell (1st window whose value of attribute "AXMain" is true)
				set windowTitle to value of attribute "AXTitle"
			end tell
		end try
	end tell
end tell

#do shell script "echo " & "\"\\\"" & frontAppName & "\\\",\\\"" & windowTitle & "\\\"\""
do shell script "echo " & "\"\\\"" & processBID & "\\\",\\\"" & windowTitle & "\\\"\""

```
  
## Bibliography
- search bar by un·delivered from the Noun Project
- helm by Olena Panasovska from the Noun Project