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

export streamCamera = (cameraName, getVideo, getAudio, isHd) ->
	socket = io()
	console.log "isHd " + isHd

	rpcPeer = new RpcPeer 'cast-receiver', 'scrypted-server', (message, reject) ->
		try
			socket.emit "client-signaling", JSON.stringify message
		catch e
			reject e

	socket.on 'server-signaling', (data) ->
		rpcPeer.handleMessage (JSON.parse data.toString())

	pc = new RTCPeerConnection configuration

	session = new BrowserSignalingSession pc, -> socket.close()
	session.options.cameraName = cameraName
	session.options.maxWidth = if isHd then 1280 else 640
	rpcPeer.params.session = session
	rpcPeer.params.options = session.options

	pc.ontrack = (ev) ->
		mediaStream = new MediaStream pc.getReceivers().map (receiver) -> receiver.track
		getVideo().srcObject = mediaStream
		getAudio().srcObject = mediaStream
		getAudio().play()
		console.log 'received track', ev.track
	pc
