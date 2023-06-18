import React, { useState } from 'react';
import $ from 'jquery';
import { Offcanvas } from 'bootstrap';

import ArtistAlbumMetadata from './artistalbummetadata';

function ArtistSearchResults({ artists }) {
  const [artistMetadata, setArtistMetadata] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const access_token = params.access_token;
  
  function showArtistAlbums(artistId, artistName) {
    let currentOffCanvasArtistName = document.getElementById('offcanvasTitleLabel').textContent;
    if (currentOffCanvasArtistName !== artistName) {
      document.getElementById('offcanvasTitleLabel').innerHTML = artistName;
      let offCanvasBody = document.getElementById('offcanvas-body');
      $.ajax({
        url: `/api/artists/${artistId}/albums`,
        type: 'GET',
        data: {'access_token': access_token},
        dataType: 'json',
        contentType: 'application/json charset=utf-8',
        cache: false
      }).done((response) => {
        if (response.albums.length === 0)
          offCanvasBody.innerHTML = "artist has no albums to show";
        else{
          offCanvasBody.innerHTML = "";
          setArtistMetadata(response);
          setReloadKey(prevKey => prevKey + 1);
        }
      });
    }
    let offcanvas = new Offcanvas(document.getElementById('offcanvasScrolling'));
    offcanvas.toggle();
  }

  let setStateOfAlbumMetadata = (albumMetadata) => {
    // This function is called in ArtistAlbumResults child component
    // the albumMetadata variable will contain the tracks for a specific album
    // setting the artistMetadata state here isn't enough to make the child component re-render
    // (I believe that is because react doesn't think the albumMetadata object has changed. I probably need to modify a key attribute to accomplish this re-render)
    // for now the i've created another state variable called 'reloadKey' which increments everytime the artistmMetadata state is set
    // this will force the child component to re-render and show the album tracks on the page
    setArtistMetadata(albumMetadata);
    setReloadKey(prevKey => prevKey + 1);
  }
  return (
    <>
      {artists.map((artist) => (
        <div className='col' key={artist.id}>
          <div id={artist.id} className='card card-color h-100 hover-pointer' onClick={() => showArtistAlbums(artist.id, artist.name)}>
            <div className='card-img-holder'>
              <img className='card-img-top img-circle' src={artist.images[0].url}></img>
            </div>
            <div className='card-body'>
              <h5 className='card-title'>{artist.name}</h5>
            </div>
          </div>
        </div>
      ))}

      <div id="offcanvasScrolling" className="offcanvas offcanvas-start" style={{marginTop: '0px'}} data-bs-scroll="true" data-bs-backdrop="false" tabIndex="-1" aria-labelledby="offcanvasScrollingLabel">
        <div className="offcanvas-header">
          <h5 id="offcanvasTitleLabel" className="offcanvas-title"></h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div id="offcanvas-body" key={reloadKey}>
          <ArtistAlbumMetadata artistMetadata={artistMetadata} setStateOfAlbumMetadata={setStateOfAlbumMetadata}/>
        </div>
      </div>
    </>
  );
}

export default ArtistSearchResults;