import { ProjectWatcher } from "../../src/backend/ProjectWatcher";
import { Database } from "../../src/backend/Database";
import { getRepository, Repository } from "typeorm";
import { ActiveProject } from "../../src/backend/entities/ActiveProject";
import * as fs from "fs-extra";

const projectNames = ["p1", "p2", "p3"];
const dbPath = "/tmp/helm.test.db";

describe("constructor", () => {

  test("set projectNames and lagtime", () => {
    const lagtime = 15;
    const watcher = new ProjectWatcher(projectNames, lagtime);
    expect(watcher.projectNames).toEqual(projectNames);
    expect(watcher.lagtime).toBe(lagtime);
  });

  test("default paramters", () => {
    const defaultLagtime = 600000;
    const watcher = new ProjectWatcher(projectNames);
    expect(watcher.lagtime).toBe(defaultLagtime);
  });
});


describe("extractProjectFromUrl", () => {
  let watcher: ProjectWatcher;
  beforeAll(() => {
    watcher = new ProjectWatcher(projectNames);
  });

  test("gtihub URL with project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromUrl(`https://github.com/user/${name}`);
    expect(project).toBe(name);
  });

  test("github URL without project", () => {
    const project = watcher.extractProjectFromUrl("https://github.com/user");
    expect(project).toBeUndefined();
  });

  test("non-github URL with project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromUrl(`http://example.com/${name}`);
    expect(project).toBeUndefined();
  });
});

describe("extractProjectFromPath", () => {
  let watcher: ProjectWatcher;
  beforeAll(() => {
    watcher = new ProjectWatcher(projectNames);
  });

  test("absolute path ending with project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromPath(`/some/path/to/project/${name}`);
    expect(project).toBe(name);
  });

  test("absolute path starting with project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromPath(`/${name}/project/subdir`);
    expect(project).toBe(name);
  });

  test("absolute path containing project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromPath(`/path/to/${name}/subdir`);
    expect(project).toBe(name);
  });

  test("relative path containing project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromPath(`relative/path/to/${name}`);
    expect(project).toBe(name);
  });

  test("special path containing project", () => {
    const name = projectNames[0];
    const project = watcher.extractProjectFromPath(`~/projects/${name}`);
    expect(project).toBe(name);
  });

  test("path without project", () => {
    const project = watcher.extractProjectFromPath(`/path/without/project/name`);
    expect(project).toBeUndefined();
  });
});


describe("update", () => {
  const lagtime = 60000; // 1 minute
  let watcher: ProjectWatcher;
  let tbl: Repository<ActiveProject>;

  beforeAll(async () => {
    await fs.remove(dbPath);
    await new Database(dbPath).connect();
    tbl = getRepository(ActiveProject);
  });

  beforeEach(async () => {
    await tbl.clear();
    watcher = new ProjectWatcher(projectNames, lagtime);
  });

  test("first project should add record", async () => {
    const name = projectNames[0];
    const timestamp = new Date();
    const duration = 0;
    await watcher.update(name, timestamp, duration);

    const record = await tbl.findOneOrFail({ id: watcher.activeProject!.id });
    expect(record.name).toBe(name);
    expect(record.start).toStrictEqual(timestamp);
    expect(record.end).toStrictEqual(new Date(timestamp.getTime() + duration + watcher.lagtime));
  });

  // same project during arrives during span of active project
  test("extend active project end time", async () => {
    const name = projectNames[0];
    const timestamp = new Date();
    const duration = 0;
    await watcher.update(name, timestamp, duration);

    const nextTimestamp = new Date(timestamp.getTime() + duration + watcher.lagtime);
    const nextDuration = 0;
    await watcher.update(name, nextTimestamp, nextDuration);

    const record = await tbl.findOneOrFail({ id: watcher.activeProject!.id });
    expect(record.name).toBe(name);
    expect(record.start).toStrictEqual(timestamp);
    expect(record.end).toStrictEqual(new Date(nextTimestamp.getTime() + nextDuration + watcher.lagtime));
  });

  // Project with same name as active arrives but after the active project end time
  test("new active project; same project", async () => {
    const name = projectNames[0];
    const timestamp = new Date();
    const duration = 0;
    await watcher.update(name, timestamp, duration);

    // Set the timestamp to 1 ms after end time of previous record
    const nextTimestamp = new Date(timestamp.getTime() + duration + watcher.lagtime + 1);
    const nextDuration = 0;
    await watcher.update(name, nextTimestamp, nextDuration);

    const record = await tbl.findOneOrFail({ id: watcher.activeProject!.id });
    expect(record.name).toBe(name);
    expect(record.start).toStrictEqual(nextTimestamp);
    expect(record.end).toStrictEqual(new Date(nextTimestamp.getTime() + nextDuration + watcher.lagtime));

    const recordCount = await tbl.count();
    expect(recordCount).toBe(2);
  });

  // Switch project while
  test("new active project; different name during current span", async () =>{
    const name = projectNames[0];
    const timestamp = new Date();
    const duration = 0;
    await watcher.update(name, timestamp, duration);
    const oldId = watcher.activeProject!.id;

    const nextName = projectNames[1];
    const nextTimestamp = new Date(timestamp.getTime() + duration + watcher.lagtime);
    const nextDuration = 0;
    await watcher.update(nextName, nextTimestamp, nextDuration);

    const record = await tbl.findOneOrFail({ id: watcher.activeProject!.id });
    expect(record.name).toBe(nextName);
    expect(record.start).toStrictEqual(nextTimestamp);
    expect(record.end).toStrictEqual(new Date(nextTimestamp.getTime() + nextDuration + watcher.lagtime));

    const prevRec = await tbl.findOneOrFail({ id: oldId });
    expect(prevRec.end).toStrictEqual(new Date(record.start.getTime() - 1));
  });

  test("new active project; different name after span");
  test("extend, new, new, extend");
  test("throw exception when try to update non-watched project");
});