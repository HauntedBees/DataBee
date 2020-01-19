# DataBee

## wut
It's basically just a checklist and very basic notes app.

## why
There's a checklist app I use that I really like, but it keeps asking me to create an account and put my checklists in *the cloud* and I can't stop it from begging me to do that, so I made my own checklist app that's essentially that app, but minus the cloud garbage, minus 90% of the features since I don't use them, and plus a few tweaks for my own convenience.

Then I thought "hey, I also use the Samsung Notes app a lot, can I rip that off a bit, too?" The answer was yes. But I didn't want to make a WYSIWYG because I love myself, so it only has very basic formatting support with a tiny subset of Markdown. Still, two apps I use a lot in one, so, that's pretty chill.

## license
DataBee's source code is licensed with the [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html). All media assets are licensed with the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) license.

## dependencies
The following third-party files and versions (or any compatible versions) are required for this project:
* [Skeleton v2.0.4](http://getskeleton.com/) ([MIT License](https://opensource.org/licenses/MIT)) as **css/skeleton.css** and **css/normalize.css**.
* [Material Icons v3.0.1](https://material.io/resources/icons/) ([Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)) in **fonts/**.
* [jQuery v3.4.1](https://code.jquery.com/) ([MIT License](https://opensource.org/licenses/MIT)) as **js/jquery.js**.
* [jQuery UI v1.2.1](https://code.jquery.com/) ([MIT License](https://opensource.org/licenses/MIT)) as **js/jquery-ui.js**.
* [jQuery UI Touch Punch v0.2.3](http://touchpunch.furf.com/) ([MIT License](https://opensource.org/licenses/MIT)) as **js/jquery.ui.touch-punch.js**.
* [PouchDB v7.1.1](https://pouchdb.com/download.html) ([Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)) as **js/pouchdb.js**.

Additionally, [Cordova v9.0.0](https://cordova.apache.org/) ([Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)) is required to build the project to a native mobile app.

If running the app in your browser, Cordova isn't needed, but not all features may not be fully functional.

The Cordova project files are not included in this repository, but creating a new project and putting the contents of this repo in the **www** path should get the job done.

## want to make changes?
Go for it, yo. Please use any GPL-compatible license for your contributions, although GNU AGPLv3 is preferred. There is no guarantee that changes made to this project will be included in any official builds.