# Adapted from https://github.com/koush/scrypted/blob/ba64a6407e5f2d38eb52166d1601ac0339cd3846/plugins/core/ui/src/common/camera.ts

import { BrowserSignalingSession } from "../scrypted/common/src/rtc-signaling";
import { RpcPeer } from '../scrypted/server/src/rpc';
import { io } from "socket.io-client";

class StreamRPCController
	constructor: (@session, @peerconnection, @socket) ->

	close: ->
		@session.endSession()
		@peerconnection.close()
		@socket.close()

export streamCamera = (configuration, cameraName, getVideo, getAudio, isHd) ->
	socket = io()
	console.log "isHd " + isHd
	console.log "using RTC config", JSON.stringify configuration

	rpcPeer = new RpcPeer 'cast-receiver', 'scrypted-server', (message, reject) ->
		try
			socket.emit "client-signaling", JSON.stringify message
		catch e
			reject e

	socket.on 'server-signaling', (data) ->
		rpcPeer.handleMessage (JSON.parse data.toString())

	session = new BrowserSignalingSession -> socket.close()
	pc = session.pc = new RTCPeerConnection configuration
	session.options.cameraName = cameraName
	session.options.maxWidth = if isHd then 1280 else 848
	session.options.maxHeight = if isHd then 720 else 480
	rpcPeer.params.session = session
	rpcPeer.params.options = session.options

	pc.ontrack = (ev) ->
		mediaStream = new MediaStream pc.getReceivers().map (receiver) -> receiver.track
		getVideo().srcObject = mediaStream
		getAudio().srcObject = mediaStream
		getAudio().play()
		console.log 'received track', ev.track

	new StreamRPCController session, pc, socket
