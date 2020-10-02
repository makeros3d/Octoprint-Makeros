/*
 * View model for OctoPrint-Makeros
 *
 * Author: You
 * License: AGPLv3
 */
$(function() {
    function MakerosViewModel(parameters) {
        var global = this;

        global.settings = parameters[0];
        global.search = ko.observable("");
        global.hasCura = ko.observable(false);
        global.onBeforeBinding = function() {
            if (global.settings.settings.plugins.curalegacy) {
                return global.hasCura(true);
            }
        }
        global.projects = ko.observable([]);
        global.projectsFetched = ko.observable(false);
        global.showProject = ko.observable(false);
        global.search = ko.observable("");
        global.searchedProjects = ko.computed(function() {
            if (!global.search()) {
                return global.projects();
            } else {
                return ko.utils.arrayFilter(global.projects(), function(project) {
                    return project.title.toLowerCase().includes(global.search().toLowerCase())
                });
            }
        });
        global.perPage = 20;
        global.totalPages = ko.computed(function() {
            let pages = Math.floor(global.searchedProjects().length / global.perPage);
            pages += global.searchedProjects().length % global.perPage > 0 ? 1 : 0;
            return pages > 0 ? pages : 0
        });
        global.currentPage = ko.observable(0);
        global.splitByPage = ko.computed(function() {
            if (global.totalPages() <= global.currentPage()) {
                global.currentPage(global.totalPages());
                return global.currentPage(); 
            }

            if (!global.currentPage()) {
                global.currentPage(0);
            }

            return global.currentPage();
        });
        global.pageList = ko.computed(function() {
            var limit = 5
            var start = Math.max((global.splitByPage() - Math.floor(limit / 2)), 1);
            var min = (global.splitByPage() - Math.floor(limit / 2)) > 0 ? 0 : Math.ceil(limit / 2) - global.splitByPage()
            var end = Math.min((global.splitByPage() + (Math.floor(limit / 2) + min)), global.totalPages())
            var max = global.totalPages() - (global.splitByPage() + Math.floor(limit / 2) + min) >= 0 ? 0 : (Math.floor(limit / 2) - (global.totalPages() - global.splitByPage()))
            start = Math.max((global.splitByPage() - (Math.floor(limit / 2) + max)), 1);
            if (end < 1) {
                return ko.observable(Array(1 - start + 1).fill(start).map((a, b) => { return a + b }).filter(i => i >= start))
            }
            return ko.observable(Array(end - start + 1).fill(start).map((a, b) => { return a + b }).filter(i => i >= start))
        });
        global.changePage = function(page) {
            global.currentPage(page - 1);
        }
        global.firstPage = function() {
            global.currentPage(0);
        }
        global.prevPage = function() {
            if (global.currentPage() > 0) {
                global.currentPage(global.currentPage() - 1);
            }  
        }
        global.nextPage = function() {
            if (global.currentPage() < (global.totalPages() - 1))  {
                global.currentPage(global.currentPage() + 1);
            } 
        }
        global.lastPage = function() {
            let last = global.totalPages() - 1;
            global.currentPage(last);
        }
        global.splitProjects = ko.computed(function () {
            let start = global.currentPage() * global.perPage;
            return global.searchedProjects().slice(start, start + global.perPage);
        });

        function File(id, name, type, url, created) {
            var self = this;

            self.id = id;
            self.name = name;
            self.type = type;
            self.url = url;
            let createdAt = new Date(created).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            });
            self.created = createdAt;
        }

        function Project(id, title, desc, prog, created, updated, files = null) {
            var self = this;
            
            self.id = id;
            let substrTitle = `${title.substring(0, 40)}...`;
            if (title.length > 40) {
                self.title = substrTitle;
            } else {
                self.title = title;
            }
            self.desc = desc;
            self.prog = `${prog}%`;
            let createdAt = new Date(created).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            });
            self.created = createdAt;
            let updatedAt = new Date(updated).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            });
            self.updated = updatedAt;
            if (files != null) {
                var fileList = [];
                let validExt = ["stl", "g", "gcode"]
                self.files = ko.observable([]);
                files.forEach(function(file) {
                    let ext = file.name.toLowerCase().split('.').pop();
                    if (validExt.includes(ext)) {
                        fileList.push(new File(
                            file.id,
                            file.name,
                            file.filetype,
                            file.download_url,
                            file.created_at
                        ));
                    }
                })
                self.files(fileList);
            }

            self.getProject = function(project) {
                $.ajax({
                    url: "/api/plugin/MakerOS",
                    type: "POST",
                    contentType: "application/json",
                    dataType: "json",
                    headers: {"X-Api-Key": UI_API_KEY},
                    data: JSON.stringify({
                        "command": "projects_show", 
                        "project": project
                    }),
                    error: function(response) {
                        new PNotify({
                            title: "MakerOS Error",
                            text: response.responseText,
                            type: "failure"
                        });
                    },
                    success: function(response) {
                        global.currentProject = new Project(
                            response.data.id,
                            response.data.title,
                            response.data.description,
                            response.data.progress,
                            response.data.created_at,
                            response.data.updated_at,
                            response.data.files,
                        )
                        global.showProject(true);
                    }
                });
            }
        } 

        global.checkStl = function() {
            let count = 0;
            global.currentProject.files.forEach(f => {
                if (count < 1) {
                    let ext = f.name.toLowerCase().split('.').pop();
                    if (ext == 'stl') {
                        count += 1;
                    }
                }
            });

            if (count > 0) {
                return true;
            }

            return false;
        }

        global.getProjects = function() {
            if (global.projects().length > 0) {
                global.projectsFetched(true);
                global.showProject(false);
                return
            }

            $.ajax({
                url: "/api/plugin/MakerOS",
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                headers: {"X-Api-Key": UI_API_KEY},
                data: JSON.stringify({
                    "command": "projects_index", 
                }),
                error: function(response) {
                    new PNotify({
                        title: "MakerOS Error",
                        text: response.responseText,
                        type: "failure"
                    });
                },
                success: function(response) {
                    var allProjects = [];
                    for (var proj of response.data) {
                        allProjects.push(
                            new Project(proj.id, proj.title, proj.description, proj.progress, proj.created_at, proj.updated_at)
                        );
                    }
                    global.projects(allProjects);
                    global.projectsFetched(true);
                },
            }); 
        }    

        global.downloadFile = function(file) {
            $.ajax({
                url: "/api/plugin/MakerOS",
                type: "POST",
                contentType: "application/json",
                dataType: "json",
                headers: {"X-Api-Key": UI_API_KEY},
                data: JSON.stringify({
                    "command": "download_file", 
                    "project_title": global.currentProject.title,
                    "url": file.url,
                    "name": file.name,
                }),
                success: function() {
                    new PNotify({
                        title: "Download Complete",
                        text: `Successfully downloaded ${file.name}`,
                        type: "success"
                    });
                }
            });
        }
    }

    /* view model class, parameters for constructor, container to bind to
     * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
     * and a full list of the available options.
     */
    OCTOPRINT_VIEWMODELS.push({
        construct: MakerosViewModel,
        // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
        dependencies: ["settingsViewModel"],
        // Elements to bind to, e.g. #settings_plugin_MakerOS, #tab_plugin_MakerOS, ...
        elements: ['#tab_plugin_MakerOS']
    });
});
