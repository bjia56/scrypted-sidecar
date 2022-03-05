import express, { Application } from "express";
import { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import * as path from "path";

import { connectScryptedClient, ScryptedClientStatic } from '../scrypted/packages/client/src';
import { VideoCamera } from "../scrypted/sdk/types/index";
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
    this.app.use(express.static(path.join(__dirname, "../../web/out")));
  }
}
