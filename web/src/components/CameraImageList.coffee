import * as React from 'react'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import ListSubheader from '@mui/material/ListSubheader'
import Fade from '@mui/material/Fade'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import axios from 'axios'
import { callAPI } from '../util/API'
import { streamCamera } from '../camera'

videoModalStyle = 
	position: 'absolute'
	left: '50%'
	transform: 'translate(-50%, 10%)'
	width: '75%'
	bgcolor: 'background.paper'
	border: '2px solid #000'
	boxShadow: 24
	outline: 0
	p: 4

export default CameraImageList = () =>
	[itemData, setItemData] = React.useState []
	[openVideo, setOpenVideo] = React.useState false

	closeVideoModal = () -> setOpenVideo false
	createOpenVideoModal = (item) ->
		() ->
			setOpenVideo true
			streamCamera () -> document.getElementById 'remote-video'

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
					<video autoPlay={true} id="remote-video" playsInline={true} width="100%"></video>
				</Box>
			</Fade>
		</Modal>
		<ImageList sx={{ width: 500, height: 450 }}>
			<ImageListItem key="Subheader" cols={2}>
				<ListSubheader component="div">Cameras</ListSubheader>
			</ImageListItem>
			{itemData.map (item) =>
				<ImageListItem key={item.img} onClick={createOpenVideoModal(item)}>
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

