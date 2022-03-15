import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CameraImageList from '../src/components/CameraImageList';

export default Index = () =>
	<Container maxWidth="lg">
		<Box sx={{ my: 4 }}>
			<CameraImageList />
		</Box>
	</Container>
