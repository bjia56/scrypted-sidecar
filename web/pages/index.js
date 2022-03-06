import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import streamCamera from '../src/camera';
import axios from 'axios';

export default function Index() {
  const [picUrl, setPicUrl] = React.useState('');
  const [showImg, setShowImg] = React.useState(true);
  const [snapshotOnce, setSnapshotOnce] = React.useState(false);

  React.useEffect(async () => {
    if (snapshotOnce) return;
    setSnapshotOnce(true);
    const resp = await axios.get('/api/snapshot');
    setPicUrl(resp.data);
  });

  function handleClick() {
    setShowImg(false);
    streamCamera(() => document.getElementById("remote-video"))
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <img onClick={handleClick} src={picUrl} style={{ display: showImg ? "block" : "none" }} width={400} />
        <video autoPlay={true} id="remote-video" playsInline={true} width="75%"></video>
      </Box>
    </Container>
  );
}