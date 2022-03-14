import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CameraImageList from '../src/components/CameraImageList';

export default Index = () =>
	<Container maxWidth="lg">
		<Box sx={{ my: 4 }}>
			<CameraImageList />
			<video autoPlay={true} id="remote-video" playsInline={true} width="75%"></video>
		</Box>
	</Container>
