import * as React from 'react'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import ListSubheader from '@mui/material/ListSubheader'
import Fade from '@mui/material/Fade'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import axios from 'axios'
import { callAPI } from '../util/API'
import { streamCamera } from '../camera'

defaultVideoModalStyle = 
	position: 'absolute'
	left: '50%'
	top: '50%'
	width: '200px'
	transform: 'translateX(-50%) translateY(-50%)'
	bgcolor: 'background.paper'
	border: '2px solid #000'
	boxShadow: 24
	outline: 0
	p: 4

videoElementId = 'remote-video'
audioElementId = 'remote-audio'

export default CameraImageList = () =>
	[itemData, setItemData] = React.useState []
	[openVideo, setOpenVideo] = React.useState false
	[showLoading, setShowLoading] = React.useState false
	[rpc, setRpc] = React.useState null
	[videoModalStyle, setVideoModalStyle] = React.useState defaultVideoModalStyle

	getVideoElement = () -> document.getElementById videoElementId
	getAudioElement = () -> document.getElementById audioElementId

	videoDimensions = () ->
		videoElement = getVideoElement()
		{ videoHeight, videoWidth } = videoElement

	resizeModal = () ->
		modalStyle = JSON.parse (JSON.stringify videoModalStyle)
		{ videoHeight, videoWidth } = videoDimensions()
		{ innerHeight, innerWidth } = window
		if videoHeight / videoWidth > innerHeight / innerWidth
			modalStyle.height = 0.9 * innerHeight
			modalStyle.width = ((0.9 * innerHeight) / videoHeight) * videoWidth
		else
			modalStyle.width = 0.9 * innerWidth
			modalStyle.height = ((0.9 * innerWidth) / videoWidth) * videoHeight
		setVideoModalStyle modalStyle

	videoOnPlay = () ->
		setShowLoading false
		window.addEventListener 'resize', resizeModal
		resizeModal()

	closeVideoModal = () ->
		setOpenVideo false
		window.removeEventListener 'resize', resizeModal
		videoElement = getVideoElement()
		videoElement.removeEventListener 'play', videoOnPlay
		videoElement.pause()
		videoElement.srcObject = null
		audioElement = getAudioElement()
		audioElement.pause()
		audioElement.srcObject = null
		rpc.close()
		setVideoModalStyle defaultVideoModalStyle

	openVideoModal = () ->
		setOpenVideo true
		setShowLoading true
		setTimeout () ->
			getVideoElement().addEventListener 'play', videoOnPlay
			setRpc (streamCamera getVideoElement, getAudioElement)
		, 0

	React.useEffect () -> 
		callAPI axios.get, '/api/cameras'
		.then (res) -> setItemData res.data || []
	, []

	<div>
		<Modal
			open={openVideo}
			onClose={closeVideoModal}>
			<Fade in={openVideo}>
				<Box sx={videoModalStyle}>
					{ showLoading &&
						<div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translateX(-50%) translateY(-50%)' }}>
							<CircularProgress/>
						</div>
					}
					<video autoPlay={true} id={videoElementId} playsInline={true} width="100%" height="100%"></video>
					<audio id={audioElementId}/>
				</Box>
			</Fade>
		</Modal>
		<ImageList sx={{ width: 500, height: 450 }}>
			<ImageListItem key="Subheader" cols={2}>
				<ListSubheader component="div">Cameras</ListSubheader>
			</ImageListItem>
			{itemData.map (item) =>
				<ImageListItem key={item.img} onClick={openVideoModal}>
					<img
						src={item.img}
						alt={item.name}
						loading="lazy"
					/>
					<ImageListItemBar
						title={item.name}
						subtitle={item.room}
					/>
				</ImageListItem>
			}
		</ImageList>
	</div>

