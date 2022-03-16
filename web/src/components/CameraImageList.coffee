import * as React from 'react'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import ListSubheader from '@mui/material/ListSubheader'
import Fade from '@mui/material/Fade'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import HdTwoToneIcon from '@mui/icons-material/HdTwoTone'
import SdTwoToneIcon from '@mui/icons-material/SdTwoTone'
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

defaultVideoDefinitionStyle =
	position: 'absolute'

videoElementId = 'remote-video'
audioElementId = 'remote-audio'
videoDefinitionElementId = 'video-definition-controls'

export default CameraImageList = =>
	[itemData, setItemData] = React.useState []
	[openVideo, setOpenVideo] = React.useState false
	[showLoading, setShowLoading] = React.useState false
	[rpc, setRpc] = React.useState null
	[videoModalStyle, setVideoModalStyle] = React.useState defaultVideoModalStyle
	[videoDefinitionStyle, setVideoDefinitionStyle] = React.useState defaultVideoDefinitionStyle
	[hdVideo, setHdVideo] = React.useState true

	getVideoElement = -> document.getElementById videoElementId
	getAudioElement = -> document.getElementById audioElementId

	videoDimensions = ->
		videoElement = getVideoElement()
		{
			offsetTop, offsetLeft,
			offsetHeight, offsetWidth,
			videoHeight, videoWidth
		} = videoElement

	resizeModal = ->
		newStyle = Object.assign {}, videoModalStyle
		{ videoHeight, videoWidth } = videoDimensions()
		{ innerHeight, innerWidth } = window
		if videoHeight / videoWidth > innerHeight / innerWidth
			# window width is longer than video width, so calculate based on height restriction
			newStyle.height = 0.9 * innerHeight
			newStyle.width = ((0.9 * innerHeight) / videoHeight) * videoWidth
		else
			# window height is longer than video height, so calculate based on width restriction
			newStyle.width = 0.9 * innerWidth
			newStyle.height = ((0.9 * innerWidth) / videoWidth) * videoHeight
		setVideoModalStyle newStyle

	placeVideoDefinitionControls = ->
		{
			offsetTop, offsetLeft,
			offsetHeight, offsetWidth,
			videoHeight, videoWidth
		} = videoDimensions()
		newStyle = Object.assign {}, videoDefinitionStyle
		newStyle.top = offsetTop + 5
		newStyle.left = offsetLeft + 5

		# correct for true video dimensions
		if videoHeight / videoWidth > offsetHeight / offsetWidth
			# video container width is longer than true video width
			scaledVideoWidth = (offsetHeight / videoHeight) * videoWidth
			newStyle.left += (offsetWidth - scaledVideoWidth) / 2
		else
			# video container height is longer than true video height
			scaledVideoHeight = (offsetWidth / videoWidth) * videoHeight
			newStyle.top += (offsetHeight - scaledVideoHeight) / 2

		setVideoDefinitionStyle newStyle

	videoOnPlay = ->
		setShowLoading false
		window.addEventListener 'resize', resizeModal
		window.addEventListener 'resize', placeVideoDefinitionControls
		resizeModal()
		placeVideoDefinitionControls()

	closeVideoModal = ->
		setOpenVideo false
		window.removeEventListener 'resize', resizeModal
		window.removeEventListener 'resize', placeVideoDefinitionControls
		videoElement = getVideoElement()
		videoElement.removeEventListener 'play', videoOnPlay
		videoElement.pause()
		videoElement.srcObject = null
		audioElement = getAudioElement()
		audioElement.pause()
		audioElement.srcObject = null
		rpc.close()
		setVideoModalStyle defaultVideoModalStyle
		setVideoDefinitionStyle defaultVideoDefinitionStyle

	openVideoModal = (isHdVideo) ->
		setOpenVideo true
		setShowLoading true
		setTimeout ->
			getVideoElement().addEventListener 'play', videoOnPlay
			setRpc (streamCamera getVideoElement, getAudioElement, isHdVideo)
		, 0

	setHd = (isHd) -> ->
		unless isHd == hdVideo
			console.log "Setting hdVideo " + isHd
			setHdVideo isHd
			closeVideoModal()
			openVideoModal isHd

	React.useEffect ->
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
					{ not showLoading &&
						<div id={videoDefinitionElementId} style={videoDefinitionStyle}>
							<IconButton color={ if hdVideo then 'default' else 'primary' } disableRipple={ not hdVideo } onClick={ setHd(false) }>
								<SdTwoToneIcon/>
							</IconButton>
							<IconButton color={ if hdVideo then 'primary' else 'default' } disableRipple={ hdVideo } onClick={ setHd(true) }>
								<HdTwoToneIcon/>
							</IconButton>
						</div>
					}
				</Box>
			</Fade>
		</Modal>
		<ImageList sx={{ width: 500, height: 450 }}>
			<ImageListItem key="Subheader" cols={2}>
				<ListSubheader component="div">Cameras</ListSubheader>
			</ImageListItem>
			{itemData.map (item) ->
				<ImageListItem key={item.img} onClick={### eat event args ### -> openVideoModal(hdVideo)}>
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
