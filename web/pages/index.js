import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '../src/Link';
import streamCamera from '../src/camera';

export default function Index() {
  function handleClick() {
    streamCamera(() => document.getElementById("remote-video"))
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Next.js example
        </Typography>
        <Button onClick={handleClick}>Start</Button>
        <video autoPlay={true} id="remote-video"></video>
      </Box>
    </Container>
  );
}