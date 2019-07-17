import { ActiveProject } from "./entities/ActiveProject";
import { getRepository } from "typeorm";
import Log from "electron-log";

export class ProjectWatcher {
  public readonly projectNames: string[];
  public readonly lagtime: number;  // milliseconds
  private _activeProject: ActiveProject | undefined;

  constructor(projectNames: string[], lagtime: number = 600000) {
    Log.info(`ProjectWatcher(..) - Params: [projectNames: ${projectNames}, lagtime: ${lagtime}]`);
    this.projectNames = projectNames;
    this.lagtime = lagtime;
    // TODO This should come from the database
    this._activeProject = undefined;
  }

  public get activeProject() {
    return this._activeProject;
  }


  /**
   *
   * @param projectName
   * @param timestamp
   * @param duration Should be in milliseconds.
   */
  public async update(projectName: string, timestamp: Date, duration: number) {
    Log.info(`ProjectWatcher::update(..) - Params [projectName: ${projectName}, timestamp: ${timestamp}, duration: ${duration}]`);
    Log.debug(`ProjectWatcher::update(..) - Current project: ${JSON.stringify(this._activeProject)}`);

    if (!this.projectNames.includes(projectName)) {
      throw new Error("Only watched projects can be set active.");
    }

    if (this._activeProject && projectName === this._activeProject.name && timestamp <= this._activeProject.end) {
      const newEnd = new Date(timestamp.getTime() + duration + this.lagtime);
      Log.debug(`ProjectWatcher::update(..) - Updating active project end date from ${this._activeProject.end} to ${newEnd}.`);
      this._activeProject.end = newEnd;
    } else {
      if (this._activeProject) {
        const actualEnd = new Date(timestamp.getTime() - 1);
        Log.info(`ProjectWatcher::update(..) - Setting new project. Updating end time from ${this._activeProject.end} to ${actualEnd}`);
        // Update current active project to end 1 ms before new active project
        this._activeProject.end = actualEnd;
        await getRepository(ActiveProject).save(this._activeProject);
      }

      const newProject = {
        name: projectName,
        start: timestamp,
        end: new Date(timestamp.getTime() + duration + this.lagtime)
      };
      Log.debug(`ProjectWatcher::update(..) - Inserting new active project: ${JSON.stringify(newProject)}`);
      this._activeProject = ActiveProject.create(newProject);
    }
    // TODO emit event
    return getRepository(ActiveProject).save(this._activeProject);

  }

  public extractProjectFromUrl(url: string) {
    if (url && url.startsWith("https://github.com/")) {
      for (const name of this.projectNames) {
        if (url.includes(name, 18)) {
          return name;
        }
      }
    }
    return undefined;
  }

  public extractProjectFromPath(path: string) {
    if (path) {
      for (const name of this.projectNames) {
        if (path.includes(name)) {
          return name;
        }
      }
    }
    return undefined;
  }
}