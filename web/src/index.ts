// Adapted from https://github.com/koush/scrypted/blob/ba64a6407e5f2d38eb52166d1601ac0339cd3846/plugins/core/ui/src/common/camera.ts

import { BrowserSignalingSession } from "../scrypted/common/src/rtc-signaling";
import { RpcPeer } from '../scrypted/server/src/rpc';
import { io } from "socket.io-client";

async function streamCamera(getVideo: () => HTMLVideoElement) {
  const socket = io();

  const rpcPeer = new RpcPeer('cast-receiver', 'scrypted-server', (message, reject) => {
    try {
      socket.emit("client-signaling", JSON.stringify(message));
    }
    catch (e) {
      reject?.(e);
    }
  });
  socket.on('server-signaling', data => {
    rpcPeer.handleMessage(JSON.parse(data.toString()));
  });

  const pc = new RTCPeerConnection();

  const session = new BrowserSignalingSession(pc, () => socket.close());
  rpcPeer.params['session'] = session;
  rpcPeer.params['options'] = session.options;

  pc.ontrack = ev => {
    const mediaStream = new MediaStream(
      pc.getReceivers().map((receiver) => receiver.track)
    );
    getVideo().srcObject = mediaStream;
    const remoteAudio = document.createElement("audio");
    remoteAudio.srcObject = mediaStream;
    remoteAudio.play();
    console.log('received track', ev.track);
  };

  return pc;
}

document.getElementById("start-button").onclick = () => {
  streamCamera(() => <HTMLVideoElement>document.getElementById("remote-video"));
};