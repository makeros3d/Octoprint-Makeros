# Octoprint-Makeros

#### An Octoprint plugin integration with the MakerOS Platform API
---

Using this plugin will allow you to interface with your MakerOS projects.
Once installed you will be able to query your projects and download both .gcode
and .STL files from your projects to your OctoPrint instance.

On the initial call to the MakerOS API a MakerOS folder will be created in your
files. From there, upon downloading a file, a project specific folder will be 
created for you within the MakerOS folder.

![MakerOS plugin projects](assets/Octoprint-Makeros-projects.png)
![MakerOS plugin project](assets/Octoprint-Makeros-project.png)

> Please note that downloading .STL files will require you to install the
CuraEngine Legacy plugin which can be installed in the same way as you
installed the MakerOS plugin.

## Setup

Install via the bundled [Plugin Manager](https://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html)
or manually using this URL:

    https://github.com/makeros3d/Octoprint-Makeros/archive/master.zip

## Configuration

#### Configuring the MakerOS plugin
---

Find the settings in the plugin settings
section of OctoPrint and add your API URL, API Key, and Provider ID
in the given fields.

![MakerOS plugin settings](assets/Octoprint-Makeros-settings.png)

