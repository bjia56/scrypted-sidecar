import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import CameraImageList from '../src/components/CameraImageList'
import RequireLoggedIn from '../src/components/RequireLoggedIn'

export default Index = ->
	<RequireLoggedIn>
		<Container maxWidth="lg">
			<Box sx={{ my: 4 }}>
				<CameraImageList />
			</Box>
		</Container>
	</RequireLoggedIn>
