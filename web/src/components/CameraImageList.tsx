import * as React from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import ListSubheader from '@mui/material/ListSubheader';
import axios from 'axios';
import { callAPI } from '../util/API';

export default function CameraImageList(): React.ReactElement {
  const [itemData, setItemData] = React.useState([]);

  React.useEffect(() => {
    callAPI(axios.get, '/api/cameras').then((res) => setItemData(res.data || []));
  }, []);

  return (
    <ImageList sx={{ width: 500, height: 450 }}>
      <ImageListItem key="Subheader" cols={2}>
        <ListSubheader component="div">Cameras</ListSubheader>
      </ImageListItem>
      {itemData.map((item) => (
        <ImageListItem key={item.img}>
          <img
            src={`${item.img}`}
            alt={item.name}
            loading="lazy"
          />
          <ImageListItemBar
            title={item.name}
            subtitle={item.room}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}