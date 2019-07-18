import * as restify from "restify";
import * as corsMiddleware from "restify-cors-middleware";
import { Browser } from "./entities/Browser";
import { Editor } from "./entities/Editor";
import { Interaction } from "./entities/Interaction";
import { Shell } from "./entities/Shell";
import { Tracker } from "./entities/Tracker";
import { Window } from "./entities/Window";
import { ObjectLiteral } from "typeorm";
import Log from "electron-log";
import { ProjectWatcher } from "./ProjectWatcher";
import { ContextModel } from "./ContextModel";

export class Server {
  private readonly rest: restify.Server;

  private projectWatcher: ProjectWatcher;
  private contextModel: ContextModel;

  constructor(name: string) {
    Log.info(`Server() - Creating REST server '${name}'`);
    this.rest = restify.createServer({ name });
    this.projectWatcher = new ProjectWatcher(["kanboard", "teammates", "helm"]);
    this.contextModel = new ContextModel({
      helm: {
        root: "/Users/ncbrad/do/helm",
      },
      kanboard: {
        root: "fakepath",
      },
      teammates: {
        root: "jksdfsd",
      },
    });
  }

  public async start(port: number) {
    Log.info(`Server::start() - Starting REST server on port ${port}...`);
    return new Promise(async (resolve, reject) => {
      this.rest.use(restify.plugins.bodyParser());


      const cors = corsMiddleware({
        preflightMaxAge: 5, // Optional
        origins: ["*"],
        allowHeaders: [],
        exposeHeaders: []
      });
      this.rest.pre(cors.preflight);
      this.rest.use(cors.actual);


      this.rest.pre((req: restify.Request, res: restify.Response, next: restify.Next) => {
        // console.log(req.method, req.url);
        return next();
      });

      this.rest.on("uncaughtException", (req: restify.Request, res: restify.Response, route: restify.Route, error: Error) => {
        console.warn(`${route.method} ${route.path} caused exception: ${error.message}`);
      });
      //
      // // server.on('NotFound', function (request, response, cb) {});
      // this.rest.on('MethodNotAllowed', (req: restify.Request, res: restify.Response, next: restify.Next) => {
      //   console.warn(req.method, req.url, "MethodNotAllowed");
      // });


      // Artifact endpoints
      this.rest.get("/api/0/artifacts", restify.plugins.queryParser(), async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        Log.info(`GET /api/0/artifacts - contains: ${req.query.contains}; project: ${req.query.project}`);
        try {
          const contains = req.query.contains || "";
          const project = req.query.project || this.projectWatcher.activeProject!.name;

          const results = await this.contextModel.search({ project, searchTerm: contains });
          res.send(200, results);
        } catch (err) {
          Log.error();
          res.send(400);
        }

        return next();
      });

      // Bucket endpoints

      this.rest.get("/api/0/buckets/", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        const buckets = await Tracker.find();
        res.send(200, buckets);
        return next();
      });

      this.rest.get("/api/0/buckets/:key", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        const bucket = await Tracker.findOne({ key: req.params.key });

        if (bucket) {
          const metadata = {
            id: bucket.key,  // I swapped key and id from what ActivityWatch uses
            name: null,
            type: bucket.type,
            client: bucket.client,
            hostname: bucket.hostname,
            created: bucket.created.toISOString().replace("Z", "000+00:00") // "2019-06-22T12:09:45.569908+00:00" // This is the date format used by ActivityWatch
          };

          res.send(200, metadata);
        } else {
          res.send(404, `There's no bucket named ${req.params.key}`);
        }
        return next();
      });

      this.rest.post("/api/0/buckets/:key", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        const key = req.params.key;
        const bucket = await Tracker.findOne({ key });
        if (bucket) {
          res.send(304);
        } else {
          await Tracker.insert({
            ...{ key, created: new Date() },
            ...req.body
          });
          res.send(200);
        }
        return next();
      });


      // Event endpoints

      this.rest.post("/api/0/buckets/:key/events", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        const key = req.params.key;
        const body = req.body;
        let events = [];

        if (Array.isArray(body)) {
          events = body;
        } else {
          events.push(body);
        }

        try {
          const processedEvents = await this.saveEvents(key, events);
          res.send(200, processedEvents.length === 1 ? processedEvents[0] : null);
        } catch (err) {
          Log.error(`POST /api/0/buckets/:key/event - ${err}`);
          res.send(400, err.message);
        }

        return next();
      });


      // Heartbeat endpoints

      this.rest.post("/api/0/buckets/:key/heartbeat", restify.plugins.queryParser(), async (req: restify.Request, res: restify.Response, next: restify.Next) => {
        // Log.verbose(`Heartbeat params: ${JSON.stringify(req.params)}, query: ${JSON.stringify(req.query)}, body: ${JSON.stringify(req.body)}`);
        const pulsetime = parseFloat(req.query.pulsetime);
        if (isNaN(pulsetime)) {
          res.send(400, "Missing required parameter pulsetime");
          return next();
        }

        const key = req.params.key;
        const data = req.body.data || {};
        const timestamp = new Date(req.body.timestamp) || new Date();
        const duration = req.body.duration || 0;

        try {
          const event = await this.processHeartbeat(key, pulsetime, timestamp, duration, data);
          res.send(200, event);
        } catch (err) {
          Log.error(`POST /api/0/buckets/:key/heartbeat - ${err}`);
          res.send(400, err.message);
        }
        return next();
      });


      this.rest.listen(port, () => {
        Log.info(`Server::start() - SUCCESS.`);
        resolve();
      });

    });
  }

  public async stop() {
    return new Promise((resolve) => this.rest.close(resolve));
  }


  /**
   * Create or update events for a bucket. Can handle both single events and multiple ones.
   * @param key
   * @param events
   */
  private async saveEvents(key: string, events: any[]): Promise<ObjectLiteral[]> {
    Log.info(`saveEvents -- key: ${key}, events: ${JSON.stringify(events)}`);
    const tracker = await Tracker.findOneOrFail({ key });
    const entity = Server.getEntityByTrackerType(tracker.type);

    const savePromise = [];
    for (const event of events) {
      if (entity) {
        const e = event.data;
        if (event.timestamp) {
          e["created"] = new Date(event.timestamp);
        }
        if (event.duration) {
          e["duration"] = event.duration;
        }
        // console.log("Inserting event: ", e);
        const record = entity.create(e);
        record.tracker = tracker;

        await this.activeProjectFromRequest(tracker.type, record);

        savePromise.push(record.save());
      }
    }

    return Promise.all(savePromise);
  }

  private async processHeartbeat(key: string, pulsetime: number, timestamp: Date, duration: number, data: { [key: string]: any }): Promise<{}> {
    const tracker = await Tracker.findOneOrFail({ key });
    const entity = Server.getEntityByTrackerType(tracker.type);
    const record = await entity.findOne({
      relations: ["tracker"],
      where: { tracker: { id: tracker.id } },
      order: {
        created: "DESC"
      },
      take: 1
    });

    if (record) {
      if (record.compareEvent(data)) {
        const lastTime = Math.round(record.created.getTime() / 1000);
        const currTime = Math.round(timestamp.getTime() / 1000);
        const pulsePeriodEnd = lastTime + record.duration + pulsetime;
        const withinPulsetimeWindow = lastTime <= currTime && currTime <= pulsePeriodEnd;
        if (withinPulsetimeWindow) {
          const newDuration = Math.round((currTime - lastTime) + duration);
          if (newDuration > 0) {
            // Update duration of record
            record.duration = newDuration;
            await this.activeProjectFromRequest(tracker.type, record);
            return entity
              .createQueryBuilder()
              .update()
              .set({ duration: newDuration })
              .where("id = :id", { id: record.id })
              .execute();
          } else {
            Log.warn(`Bucket ${tracker.key}: Duration would be negative`);
          }
        } else {
          Log.warn(`Bucket ${tracker.key}: event outside pulse window on ${pulsetime}. Previous record time: ${lastTime} and duration ${record.duration}; current record time: ${currTime}`);
          Log.debug(`Event is ${JSON.stringify(data)}`);
        }
      } else {
        Log.info(`Bucket ${tracker.key}: event payload is different.`);
      }
    } else {
      Log.warn(`Tracker ${tracker.key} not registered. Cannot insert data record.`);
    }

    Log.info("***CALLING SAVE EVENTS");
    return this.saveEvents(key, [{ duration, data }]);
  }

  private async activeProjectFromRequest(trackerType: string, record: any) {
    let project: string | undefined;
    switch (trackerType) {
      case "web.tab.current":
        // @ts-ignore
        const url = (record as Browser).url.toLowerCase();
        project = this.projectWatcher.extractProjectFromUrl(url);
        break;
      case "shell.command":
        // @ts-ignore
        const cwd = (record as Shell).cwd.toLowerCase();
        project = this.projectWatcher.extractProjectFromPath(cwd);
        break;
      case "app.editor.activity":
        // @ts-ignore
        project = (record as Editor).project.toLowerCase();
    }

    if (project && this.projectWatcher.projectNames.includes(project)) {
      await this.projectWatcher.update(project, record.created, record.duration * 1000);
    }
  }


  private static getEntityByTrackerType(type: string) {
    switch (type) {
      case "web.tab.current":
        return Browser;
      case "app.editor.activity":
        return Editor;
      case "afkstatus":
        return Interaction;
      case "shell.command":
        return Shell;
      case "currentwindow":
        return Window;
      default:
        throw new Error("Invalid tracker type.");
    }
  }
}