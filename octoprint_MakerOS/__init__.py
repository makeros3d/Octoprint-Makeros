# coding=utf-8
from __future__ import absolute_import, unicode_literals

### (Don't forget to remove me)
# This is a basic skeleton for your plugin's __init__.py. You probably want to adjust the class name of your plugin
# as well as the plugin mixins it's subclassing from. This is really just a basic skeleton to get you started,
# defining your plugin as a template plugin, settings and asset plugin. Feel free to add or remove mixins
# as necessary.
#
# Take a look at the documentation on what other plugin mixins are available.

import octoprint.plugin
import flask

class MakerosPlugin(octoprint.plugin.SettingsPlugin,
                    octoprint.plugin.AssetPlugin,
                    octoprint.plugin.TemplatePlugin,
                    octoprint.plugin.SimpleApiPlugin,
                    octoprint.plugin.EventHandlerPlugin):

        ##~~ SettingsPlugin mixin

        def get_settings_defaults(self):
            return dict(api_settings=dict(
                apiBaseUrl="https://demo-api.makeros.com/api/v1/",
                apiKey="--------------------------------",
                apiId="--------------------------------"
            ))

        def get_settings_restricted_paths(self):
            return dict(admin=[["api_settings"]])

        ##~~ TemplatePlugin mixins

        def get_template_configs(self):
            return [
                dict(type="settings", custom_bindings=False),
                dict(type="tab", custom_bindings=True)
            ]

        def get_template_vars(self):
            return dict(
                baseUrl = self._settings.get(["api_settings", "apiBaseUrl"]),
                apiKey = self._settings.get(["api_settings", "apiKey"]),
                apiId = self._settings.get(["api_settings", "apiId"])
             )

        ##~~ ApiPlugin mixins
        def get_api_commands(self):
            return dict(
                projects_index=[],
                projects_show=["project"],
                download_file=["url"],
            )

        def on_api_command(self, command, data):
            import os
            import requests
            uploads = self._settings.global_get_basefolder("uploads")
            if not os.path.isdir("{}/MakerOS".format(uploads)):
                os.mkdir("{}/MakerOS".format(uploads), 0o755)
            base_url = self._settings.get(["api_settings", "apiBaseUrl"])
            key = self._settings.get(["api_settings", "apiKey"])
            provider_id = self._settings.get(["api_settings", "apiId"])
            uploads = self._settings.global_get_basefolder("uploads")
            mkros_dir = "{}/MakerOS".format(uploads)
            if command == "projects_index":
                if self._settings.get(["api_settings", "apiBaseUrl"]) == \
                        "https://demo-api.makeros.com/api/v1":
                    return "The API Base URL needs to be properly set"
                if self._settings.get(["api_settings", "apiKey"]) == \
                        "--------------------------------":
                    return "The API Key needs to be properly set"
                if self._settings.get(["api_settings", "apiId"]) == \
                        "--------------------------------":
                    return "The Provider ID needs to be properly set"
                try:
                    self._logger.info(
                        "Attempting to pull projects for MakerOS Plugin " + \
                        "from {}projects".format(base_url)
                    )
                    r = requests.get(
                        "{}projects".format(base_url),
                        params={"key": key, "provider_id": provider_id}
                    )
                    if r.status_code == 200:
                        if r.headers.get('content-type') == 'application/json':
                            return r.text
                        else:
                            return "There was an error fetching your projects " + \
                                    "please review your settings and try again."
                    else:
                        return "There was an error fetching your projects " + \
                                "please review your settings and try again."
                except:
                        self._logger.error("There was an issue fetching " + \
                                           "MakerOS projects.")

            if command == "projects_show":
                try:
                    self._logger.info(
                        "Attempting to fetch project {project} from MakerOS" \
                            .format(**data)
                    )
                    r = requests.get(
                        "{}projects/{project}".format(base_url, **data),
                        params={"key": key, "provider_id": provider_id}
                    )
                    if r.status_code == 200:
                        if r.headers.get('content-type') == 'application/json':
                            return r.text
                        else:
                            return "There was an error fetching your project " + \
                                    "please review your settings and try again."
                    else:
                        return "There was an error fetching your project " + \
                                "please review your settings and try again."
                except:
                        self._logger.error("There was an issue fetching " + \
                                           "MakerOS projects.")

            if command == "download_file":
                url = "{url}".format(**data)
                project_dir = "{project_title}".format(**data)
                file_name = "{name}".format(**data)
                try:
                    self._logger.info(
                        "Attempting to download file from MakerOS"
                    )
                    project_dir = project_dir.split(" ")
                    project_dir = "_".join(project_dir)
                    project_dir = "{}/{}".format(mkros_dir, project_dir)
                    if not os.path.exists(project_dir):
                        os.mkdir(project_dir)
                    file_write = os.path.join(project_dir, file_name)
                    with requests.get(url, stream=True) as r:
                        r.raise_for_status()
                        with open(file_write, 'wb') as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                f.write(chunk)
                    self._logger.info("Successfully downloaded {}".format(filename))
                except:
                        self._logger.error("There was an issue fetching " + \
                                           "MakerOS files.")

        ##~~ AssetPlugin mixin

        def get_assets(self):
                # Define your plugin's asset files to automatically include in the
                # core UI here.
                return dict(
                        js=["js/MakerOS.js"],
                        css=["css/MakerOS.css"],
                        less=["less/MakerOS.less"]
                )

        ##~~ Softwareupdate hook

        def get_update_information(*args, **kwargs):
                # Define the configuration for your plugin to use with the Software Update
                # Plugin here. See https://docs.octoprint.org/en/master/bundledplugins/softwareupdate.html
                # for details.
                return dict(
                        MakerOS=dict(
                                displayName=self._plugin_name,
                                displayVersion=self._plugin_version,

                                # version check: github repository
                                type="github_release",
                                user="makeros3d",
                                repo="OctoPrint-Makeros",
                                current=self._plugin_version,

                                # update method: pip
                                pip="https://github.com/makeros3d/OctoPrint-Makeros/archive/{target_version}.zip"
                        )
                )

__plugin_pythoncompat__ = ">=2.7,<4"

# If you want your plugin to be registered within OctoPrint under a different name than what you defined in setup.py
# ("OctoPrint-PluginSkeleton"), you may define that here. Same goes for the other metadata derived from setup.py that
# can be overwritten via __plugin_xyz__ control properties. See the documentation for that.
__plugin_name__ = "MakerOS"

# Starting with OctoPrint 1.4.0 OctoPrint will also support to run under Python 3 in addition to the deprecated
# Python 2. New plugins should make sure to run under both versions for now. Uncomment one of the following
# compatibility flags according to what Python versions your plugin supports!
#__plugin_pythoncompat__ = ">=2.7,<3" # only python 2
#__plugin_pythoncompat__ = ">=3,<4" # only python 3
#__plugin_pythoncompat__ = ">=2.7,<4" # python 2 and 3

def __plugin_load__():
        global __plugin_implementation__
        __plugin_implementation__ = MakerosPlugin()

        global __plugin_hooks__
        __plugin_hooks__ = {
                "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
        }

