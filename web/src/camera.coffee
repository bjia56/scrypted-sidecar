# Adapted from https://github.com/koush/scrypted/blob/ba64a6407e5f2d38eb52166d1601ac0339cd3846/plugins/core/ui/src/common/camera.ts

import { BrowserSignalingSession } from "../scrypted/common/src/rtc-signaling";
import { RpcPeer } from '../scrypted/server/src/rpc';
import { io } from "socket.io-client";

configuration =
	iceServers: [
		{
			urls: ["turn:turn0.clockworkmod.com", "turn:n0.clockworkmod.com", "turn:n1.clockworkmod.com"],
			username: "foo",
			credential: "bar",
		}
	]

export default async streamCamera(getVideo) ->
	socket = io()

	rpcPeer = new RpcPeer 'cast-receiver', 'scrypted-server', (message, reject) ->
		try
			socket.emit "client-signaling", JSON.stringify mess	age
		catch e
			reject e

	socket.on 'server-signaling', (data) -> 
		rpcPeer.handleMessage JSON.parse(data.toString())

	pc = new RTCPeerConnection configuration

	session = new BrowserSignalingSession pc, () -> socket.close()
	rpcPeer.params['session'] = session
	rpcPeer.params['options'] = session.options

	pc.ontrack = (ev) -> 
		mediaStream = new MediaStream pc.getReceivers().map (receiver) -> receiver.track
		getVideo().srcObject = mediaStream
		remoteAudio = document.createElement "audio"
		remoteAudio.srcObject = mediaStream
		remoteAudio.play()
		console.log 'received track', ev.track
	pc
