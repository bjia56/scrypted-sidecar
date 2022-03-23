import * as React from 'react'
import { Box, FormControl, Button, Input, Modal, Fade, Typography } from '@mui/material';

loginModalStyle =
	position: 'absolute'
	left: '50%'
	top: '50%'
	transform: 'translate(-50%, -50%)'
	bgcolor: 'background.paper'
	border: '2px solid #000'
	outline: 0
	boxShadow: 24
	p: 4

export default Login = () =>
	[open, _] = React.useState true

	<Modal
		open={open}
		shouldCloseOnOverlayClickonClose={false}
		aria-labelledby="login-modal-title">
		<Fade in={open}>
			<Box sx={loginModalStyle}>
				<Typography id="login-modal-title" variant="h6" component="h2">
					Log In
				</Typography>
				<form method="post" action="/api/login">
					<FormControl sx={{ my: 4 }}>
						<Input name="username" type="text" placeholder="username"></Input>
						<br/>
						<Input name="password" type="password" placeholder="password"></Input>
						<br/>
						<Button type="submit">Log In</Button>
					</FormControl>
				</form>
			</Box>
		</Fade>
	</Modal>
