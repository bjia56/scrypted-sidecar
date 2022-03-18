import express, { Application, Request, Response, NextFunction } from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import * as path from "path";
import crypto from "crypto";
import sharp from "sharp";

import { connectScryptedClient, ScryptedClientStatic } from '../scrypted/packages/client/src';
import { ScryptedInterface, ScryptedDevice, VideoCamera, Camera } from "../scrypted/sdk/types/index";
import { startBrowserRTCSignaling } from "./ffmpeg-to-wrtc";

async function getSDK(): Promise<ScryptedClientStatic> {
  const sdk = await connectScryptedClient({
    baseUrl: process.env.SCRYPTED_HOST || 'https://localhost:10443',
    pluginId: "@scrypted/core",
    username: process.env.SCRYPTED_USERNAME || 'admin',
    password: process.env.SCRYPTED_PASSWORD || 'admin',
  });
  return sdk
}

function getUsername(): string {
  return process.env.SERVER_USERNAME || 'user';
}

function getPassword(): string {
  return process.env.SERVER_PASSWORD || 'pass';
}

function getCookieSecret(): string {
  return process.env.COOKIE_SECRET || crypto.randomBytes(20).toString('hex');
}

function auth(req: Request, res: Response, next: NextFunction): void {
  if (loggedIn(req)) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

function loggedIn(req: Request): boolean {
  const res = req.session && req.session['user'] == getUsername();
  console.log('logged in:', res);
  return res;
}

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;
  private sdk: ScryptedClientStatic;

  private readonly DEFAULT_PORT = parseInt(process.env.PORT) || 5000;

  constructor() {
    this.initialize();

    this.configureApp();
    this.handleSocketConnection();
  }

  private async initialize(): Promise<void> {
    this.app = express();
    this.app.use(session({
      secret: getCookieSecret(),
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
    }));
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer);
    this.sdk = await getSDK();
  }

  private handleSocketConnection(): void {
    this.io.on("connection", socket => {
      try {
        startBrowserRTCSignaling(socket, this.sdk);
      } catch (e) {
        console.log("exception while handling socket connection", e);
        socket.disconnect();
      }
    });
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    );
  }

  private configureApp(): void {
    const staticWeb = path.join(__dirname, "..", "..", "web", "out");

    this.configureAPILogin(staticWeb);
    this.configureAPICameras();

    this.app.use(auth, express.static(staticWeb));
  }

  private configureAPILogin(staticWeb: string): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.app.get('/api/loggedIn', (req: Request, res: Response) => {
      if (!loggedIn(req)) {
        res.status(401);
      }
      res.send();
    })

    this.app.get('/api/logout', (req: Request, res: Response) => {
      req.session.destroy((_) => res.redirect('/login'));
    });

    this.app.post('/api/login', (req: Request, res: Response) => {
      if (!req.body['username'] || !req.body['password']) {
        res.redirect('/login');
      } else if (req.body['username'] == getUsername() && req.body['password'] == getPassword()) {
        req.session['user'] = getUsername();
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    });
  }

  private configureAPICameras(): void {
    this.app.get('/api/cameras', auth, async (_: Request, res: Response) => {
      const sysState = this.sdk.systemManager.getSystemState()
      const deviceIds = Object.keys(sysState);

      const cameras = deviceIds.map((deviceId: string) => {
        const device = this.sdk.systemManager.getDeviceById(deviceId);
        if (device.interfaces.includes(ScryptedInterface.Camera)) {
          return <ScryptedDevice & Camera>device;
        }
      }).filter((i) => !!i);

      const result = await Promise.all(
        cameras.map(async (camera: ScryptedDevice & Camera) => {
          const picture = await camera.takePicture();
          const buf = await this.sdk.mediaManager.convertMediaObjectToBuffer(picture, 'image/*');
          const resized = await sharp(buf).resize({ width: 640 }).toBuffer();

          return {
            img: "data:image/png;base64," + resized.toString('base64'),
            name: camera.name,
            room: camera.room
          };
        })
      );

      res.send(JSON.stringify(result));
    })
  }
}
