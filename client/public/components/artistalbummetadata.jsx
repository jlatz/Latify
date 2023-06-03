import React from 'react';
import $ from 'jquery';

function ArtistAlbumMetadata({ artistMetadata, setStateOfAlbumMetadata }) {
  if (artistMetadata.length === 0) { return; }

  const params = new Proxy(new URLSearchParams( window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const access_token = params.access_token;

  function getSelectedDevice() {
    let deviceOptions = document.querySelectorAll('.deviceOptions');
    let selectedDeviceId;
    for (const device of deviceOptions) {
      if (device.checked) {
        selectedDeviceId = device.value;
        break;
      }
    };
    return selectedDeviceId;
  }
  
  function playTrack(trackId) {
    let footer = document.getElementById('footer');
    if (footer.style.display === '')
      footer.style.display = 'flex';
    let selectedDeviceId = getSelectedDevice();
    $.ajax({
      url: `/api/track/${trackId}/play`,
      type: 'PUT',
      data: {'access_token': access_token, 'selectedDeviceId': selectedDeviceId},
      dataType: 'json',
      cache: false
    }).done((response) => {
      if (response.errors)
        alert("No active device found. Please open spotify and refresh available devices");
      return;
    });
  };
  
  function getAlbumTracks(albumId) {
    let tracksFound = false;
    artistMetadata.albums.forEach(album => {
      if (album.id === albumId && album['tracks'] !== undefined ) {
        // If we get here that means we already retrieved the album tracks and should not make another network call to spotify (needed to avoid spotifys api rate limit)
        // This also means the tracks are already displayed to the user and the album was double/triple/... clicked so we should toggle the display

        // TODO: currently there is a bug that if you have an albums tracks hidden and you click on a new album for the first time
        //    then the page will render the new album tracks but also the old album tracks that you had hidden. I believe the toggle get wiped from the DOM and reloaded
        //    currently I am toggling with a bootstrap class. I think if I change this to a react toggle using state? (if that is possible somehow) then that might take care of it
        document.getElementById(albumId).querySelector('.albumTracks').classList.toggle('d-none');
        tracksFound = true;
        return;
      } 
    })
    if (!tracksFound) {
      $.ajax({
        url: `/api/artists/album/${albumId}/tracks`,
        type: 'GET',
        data: {'access_token': access_token},
        dataType: 'json',
        contentType: 'application/json charset=utf-8',
        cache: false
      }).done(function (response) {  
        artistMetadata.albums.forEach(album => {
          if (album.id === albumId) {
            album['tracks'] = response.tracks;
          }
        })
        setStateOfAlbumMetadata(artistMetadata);
      });
    }
  }

  return (
    <table id='artistAlbumTable' className='table'>
      <tbody>
        {artistMetadata.albums.map((album) => (
            <tr className='artistAlbumRow' key={album.id}>
                <td id={album.id}>
                    <p>{album.name}</p>
                    <img className='hover-pointer' src={album.images[0].url} onClick={() => getAlbumTracks(album.id)} style={{width: '150px', height: '150px'}} />
                    <table className='albumTracks'>
                      <tbody>
                        {album.tracks?.map((track) => (
                          <tr className='trackRow' key={track.id}>
                            <td><i className='bi bi-play-circle'></i></td>
                            <td id={track.id} className='hover-pointer' onClick={() => playTrack(track.id)}>{track.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </td>
            </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ArtistAlbumMetadata;