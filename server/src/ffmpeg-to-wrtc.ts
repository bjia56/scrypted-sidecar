// Adapted from https://github.com/koush/scrypted/blob/ba64a6407e5f2d38eb52166d1601ac0339cd3846/common/src/ffmpeg-to-wrtc.ts

import child_process from 'child_process';
import net from 'net';
import { listenZero } from "../scrypted/common/src/listen-cluster";
import { ffmpegLogInitialOutput } from "../scrypted/common/src/media-helpers";
import { FFMpegInput, ScryptedMimeTypes, MediaObject, RTCAVSignalingSetup, RTCSignalingClientOptions, RTCSignalingSession, ScryptedDevice, VideoCamera, RTCSignalingClientSession } from "../scrypted/sdk/types/index";
import { RpcPeer } from "../scrypted/server/src/rpc";
import * as wrtc from "@koush/wrtc";
import { Socket as SocketIOSocket } from "socket.io";
import { ScryptedClientStatic } from '../scrypted/packages/client/src/index';

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ["turn:turn0.clockworkmod.com", "turn:n0.clockworkmod.com", "turn:n1.clockworkmod.com"],
      username: "foo",
      credential: "bar",
    },
  ],
};

const ffmpegLocation = '/usr/bin/ffmpeg';

export async function startRTCPeerConnectionFFmpegInput(ffInput: FFMpegInput, options?: {
  maxWidth: number,
}): Promise<RTCPeerConnection> {
  const pc = new wrtc.RTCPeerConnection(configuration);

  const { RTCVideoSource, RTCAudioSource } = wrtc.nonstandard;

  const videoSource = new RTCVideoSource();
  pc.addTrack(videoSource.createTrack());


  let audioPort: number;

  // wrtc causes browser to hang if there's no audio track? so always make sure one exists.
  const noAudio = ffInput.mediaStreamOptions && ffInput.mediaStreamOptions.audio === null;

  let audioServer: net.Server;
  if (!noAudio) {
    const audioSource = new RTCAudioSource();
    pc.addTrack(audioSource.createTrack());

    audioServer = net.createServer(async (socket) => {
      audioServer.close()
      const { sample_rate, channels } = await sampleInfo;
      const bitsPerSample = 16;
      const channelCount = channels[1] === 'mono' ? 1 : 2;
      const sampleRate = parseInt(sample_rate[1]);

      const toRead = sampleRate / 100 * channelCount * 2;
      socket.on('readable', () => {
        while (true) {
          const buffer: Buffer = socket.read(toRead);
          if (!buffer)
            return;

          const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + toRead)
          const samples = new Int16Array(ab);  // 10 ms of 16-bit mono audio

          const data = {
            samples,
            sampleRate,
            bitsPerSample,
            channelCount,
          };
          try {
            audioSource.onData(data);
          }
          catch (e) {
            cp.kill();
            console.error(e);
          }
        }
      });
    });
    audioPort = await listenZero(audioServer);
  }

  const videoServer = net.createServer(async (socket) => {
    videoServer.close()
    const res = await resolution;
    const width = parseInt(res[2]);
    const height = parseInt(res[3]);
    const toRead = parseInt(res[2]) * parseInt(res[3]) * 1.5;
    socket.on('readable', () => {
      while (true) {
        const buffer: Buffer = socket.read(toRead);
        if (!buffer)
          return;
        const data = new Uint8ClampedArray(buffer);
        const frame = { width, height, data };
        try {
          videoSource.onFrame(frame)
        }
        catch (e) {
          cp.kill();
          console.error(e);
        }
      }
    });
  });
  const videoPort = await listenZero(videoServer);

  const args = [
    '-hide_banner',
    // don't think this is actually necessary but whatever.
    '-y',
  ];

  args.push(...ffInput.inputArguments);

  if (!noAudio) {
    // create a dummy audio track if none actually exists.
    // this track will only be used if no audio track is available.
    // https://stackoverflow.com/questions/37862432/ffmpeg-output-silent-audio-track-if-source-has-no-audio-or-audio-is-shorter-th
    args.push('-f', 'lavfi', '-i', 'anullsrc=cl=1', '-shortest');

    args.push('-vn');
    args.push('-acodec', 'pcm_s16le');
    args.push('-f', 's16le');
    args.push(`tcp://127.0.0.1:${audioPort}`);
  }

  args.push('-an');
  // chromecast seems to crap out on higher than 15fps??? is there
  // some webrtc video negotiation that is failing here?
  args.push('-r', '15');
  args.push('-vcodec', 'rawvideo');
  args.push('-pix_fmt', 'yuv420p');
  if (options?.maxWidth) {
    args.push('-vf', `scale=${options.maxWidth}:-1`);
  }
  args.push('-f', 'rawvideo');
  args.push(`tcp://127.0.0.1:${videoPort}`);

  console.log(ffInput);
  console.log(args);

  const cp = child_process.spawn(ffmpegLocation, args, {
    // DO NOT IGNORE STDIO, NEED THE DATA FOR RESOLUTION PARSING, ETC.
  });
  ffmpegLogInitialOutput(console, cp);
  cp.on('error', e => console.error('ffmpeg error', e));

  cp.on('exit', () => {
    videoServer.close();
    audioServer?.close();
    pc.close();
  });

  let outputSeen = false;
  const resolution = new Promise<Array<string>>(resolve => {
    cp.stdout.on('data', data => {
      const stdout = data.toString();
      outputSeen = outputSeen || stdout.includes('Output #0');
      const res = /(([0-9]{2,5})x([0-9]{2,5}))/.exec(stdout);
      if (res && outputSeen)
        resolve(res);
    });
    cp.stderr.on('data', data => {
      const stdout = data.toString();
      outputSeen = outputSeen || stdout.includes('Output #0');
      const res = /(([0-9]{2,5})x([0-9]{2,5}))/.exec(stdout);
      if (res && outputSeen)
        resolve(res);
    });
  });

  interface SampleInfo {
    sample_rate: string[];
    channels: string[];
  }

  const sampleInfo = new Promise<SampleInfo>(resolve => {
    const parser = (data: Buffer) => {
      const stdout = data.toString();
      const sample_rate = /([0-9]+) Hz/i.exec(stdout)
      const channels = /Audio:.* (stereo|mono)/.exec(stdout)
      if (sample_rate && channels) {
        resolve({
          sample_rate, channels,
        });
      }
    };
    cp.stdout.on('data', parser);
    cp.stderr.on('data', parser);
  });

  const cleanup = () => {
    cp?.kill();
    setTimeout(() => cp?.kill('SIGKILL'), 1000);
  }

  const checkConn = () => {
    if (pc.iceConnectionState === 'disconnected'
      || pc.iceConnectionState === 'failed'
      || pc.iceConnectionState === 'closed') {
      cleanup();
    }
    if (pc.connectionState === 'closed'
      || pc.connectionState === 'disconnected'
      || pc.connectionState === 'failed') {
      cleanup();
    }
  }

  pc.onconnectionstatechange = checkConn;
  pc.oniceconnectionstatechange = checkConn;

  setTimeout(() => {
    if (pc.connectionState !== 'connected') {
      pc.close();
      cp.kill();
    }
  }, 60000);
  return pc;
}

export async function startRTCPeerConnection(sdk: ScryptedClientStatic, mediaObject: MediaObject, session: RTCSignalingSession, options?: RTCSignalingClientOptions & {
  maxWidth: number,
}) {
  const buffer = await sdk.mediaManager.convertMediaObjectToBuffer(mediaObject, ScryptedMimeTypes.FFmpegInput);
  const ffInput = JSON.parse(buffer.toString());

  const pc = await startRTCPeerConnectionFFmpegInput(ffInput, options);

  try {
    pc.onicecandidate = ev => {
      if (ev.candidate) {
        console.log('local candidate', ev.candidate);
        session.addIceCandidate(JSON.parse(JSON.stringify(ev.candidate)));
      }
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const setup: RTCAVSignalingSetup = {
      type: 'offer',
      audio: {
        direction: 'recvonly',
      },
      video: {
        direction: 'recvonly',
      }
    };
    await session.setRemoteDescription(offer, setup);

    const answer = await session.createLocalDescription('answer', setup, async (candidate) => {
      console.log('remote candidate', candidate);
      if (candidate.candidate == '') {
        // looks like the wrtc library does not like it when candidates is empty
        console.log('ignoring end of candidates indicator');
        return;
      }
      pc.addIceCandidate(candidate);
    });

    await pc.setRemoteDescription(answer);
  }
  catch (e) {
    pc.close();
    throw e;
  }
}

export function startRTCPeerConnectionForBrowser(sdk: ScryptedClientStatic, mediaObject: MediaObject, session: RTCSignalingSession, options?: RTCSignalingClientOptions) {
  return startRTCPeerConnection(sdk, mediaObject, session, Object.assign({
    maxWidth: 960,
  }, options || {}));
}

export async function createBrowserSignalingSession(sio: SocketIOSocket) {
  const peer = new RpcPeer("google-home", "cast-receiver", (message, reject) => {
    const json = JSON.stringify(message);
    try {
      sio.emit("server-signaling", json);
    }
    catch (e) {
      reject?.(e);
    }
  });
  sio.on("client-signaling", message => {
    const json = JSON.parse(message);
    peer.handleMessage(json);
  });

  const session: RTCSignalingClientSession = await peer.getParam('session');
  return session;
}

export async function startBrowserRTCSignaling(camera: ScryptedDevice & VideoCamera, sio: SocketIOSocket, sdk: ScryptedClientStatic) {
  try {
    const session = await createBrowserSignalingSession(sio);
    const options = await session.getOptions();

    startRTCPeerConnectionForBrowser(sdk, await camera.getVideoStream(), session, options);
  }
  catch (e) {
    console.error("error negotiating browser RTC signaling", e);
    throw e;
  }
}
