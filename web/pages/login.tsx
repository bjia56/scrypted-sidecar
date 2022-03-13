import * as React from 'react';
import { Container, FormControl, Button, Input } from '@mui/material';

export default function Login(): React.ReactElement {
  return (
    <Container maxWidth="sm">
      <form method="post" action="/api/login">
        <FormControl sx={{ my: 4 }}>
          <Input name="username" type="text" placeholder="username"></Input>
          <Input name="password" type="password" placeholder="password"></Input>
          <Button type="submit">Log In</Button>
        </FormControl>
      </form>
    </Container>
  );
}