import express, { Application } from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import * as path from "path";
import crypto from "crypto";

import { connectScryptedClient, ScryptedClientStatic } from '../scrypted/packages/client/src';
import { VideoCamera, Camera } from "../scrypted/sdk/types/index";
import { startBrowserRTCSignaling } from "./ffmpeg-to-wrtc";

async function getSDK() {
  const sdk = await connectScryptedClient({
    baseUrl: 'https://localhost:10443',
    pluginId: "@scrypted/core",
    username: process.env.SCRYPTED_USERNAME || 'admin',
    password: process.env.SCRYPTED_PASSWORD || 'admin',
  });
  return sdk
}

function getUsername() {
  return process.env.SERVER_USERNAME || 'user';
}

function getPassword() {
  return process.env.SERVER_PASSWORD || 'pass';
}

function getCookieSecret() {
  return process.env.COOKIE_SECRET || crypto.randomBytes(20).toString('hex');
}

function auth(req, res, next) {
  if (loggedIn(req)) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

function loggedIn(req) {
  return req.session && req.session.user == getUsername();
}

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;
  private sdk: ScryptedClientStatic;

  private readonly DEFAULT_PORT = 5000;

  constructor() {
    this.initialize();

    this.configureApp();
    this.handleSocketConnection();
  }

  private async initialize() {
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
      const camera = this.sdk.systemManager.getDeviceByName<VideoCamera>("Camera 1");
      startBrowserRTCSignaling(camera, socket, this.sdk);
    });
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    );
  }

  private configureApp(): void {
    const staticWeb = path.join(__dirname, "..", "..", "web", "out");

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.get('/login', (req, res) => {
      if (loggedIn(req)) {
        res.redirect('/');
      } else {
        res.sendFile(path.join(staticWeb, "login.html"))
      }
    });
    this.app.get('/logout', (req, res) => {
      req.session.destroy((_) => res.redirect('/login'));
    });
    this.app.post('/login', (req, res) => {
      if (!req.body['username'] || !req.body['password']) {
        res.redirect('/login');
      } else if (req.body['username'] == getUsername() && req.body['password'] == getPassword()) {
        req.session['user'] = getUsername();
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    });
    this.app.get('/api/snapshot', auth, async (req, res) => {
      const camera = await this.sdk.systemManager.getDeviceByName<Camera>("Camera 1");
      const picture = await camera.takePicture()
      const buf = await this.sdk.mediaManager.convertMediaObjectToBuffer(picture, 'image/*');
      console.log("Got snapshot");
      res.send("data:image/png;base64," + buf.toString('base64'));
    })
    this.app.use(auth, express.static(staticWeb));
  }
}
