import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import '../css/home.css'
import 'bootstrap/dist/js/bootstrap.min.js'
import '@popperjs/core/dist/umd/popper.min.js'


import ArtistSearchResults from '../components/artistsearchresults';
import AvailableDevices from '../components/availabledevices';

function Home () {
  const [artists, setArtists] = useState([]);
  const [devices, setDevices] = useState([]);

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const access_token = params.access_token;
  
  useEffect(() => {
    // anything in here will be executed on page load

    // get user metadata from spotify
    $.ajax({
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    }).done((response) => {
      let navBarProfileImg = document.getElementById('userProfileImg');
      navBarProfileImg.src =  response.images[0].url;
    }); 

    // get available devices
    $.ajax({
      url: '/api/availableDevices',
      type: 'GET',
      data: {'access_token': access_token},
      dataType: 'json',
      contentType: 'application/json charset=utf-8',
      cache: false
    }).done((response) => {
      if (response.length === 0) {
        let availableDevices = document.getElementById('divAvailableDevices');
        let noAvailableDevices = document.createElement('p');
        noAvailableDevices.innerHTML = 'No available devices';
        availableDevices.appendChild(noAvailableDevices);
      } else {
          setDevices(response);
      }
    });          
  }, []);

  const searchArtistClick = () => {
    let artist = $('#txtSearchArtist').val(); 
    let searchArtistErrorMsg = document.getElementById('searchArtistErrorMsg');
    let txtSearchArtist = document.getElementById('txtSearchArtist');
    if (artist === '') {
      searchArtistErrorMsg.textContent = 'Input can not be empty';
      searchArtistErrorMsg.classList.add('is-invalidMsg');
      txtSearchArtist.classList.add('is-invalidInput');
    }
    else {
      searchArtistErrorMsg.textContent = '';
      searchArtistErrorMsg.classList.remove('is-invalidMsg');
      txtSearchArtist.classList.remove('is-invalidInput');
      $.ajax({
        url: '/api/getArtist/' + encodeURIComponent(artist),
        type: 'GET',
        data: {'access_token': access_token},
        dataType: 'json',
        contentType: 'application/json charset=utf-8',
        cache: false
      }).done((response) => {
        setArtists(response);
      }); 
    }
  };

  const searchArtistKeydown = (event) => {
    if (event.key === 'Enter')
      searchArtistClick();
  };

   
  let setStateOfAvailableDevices = (devices) => {
    setDevices(devices);
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand cursive-text" href="/">Latify</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="navbarSupportedContent">
            <ul className="navbar-nav navbar-right mb-2 mb-lg-0">
              <li className="nav-item dropdown">
                <a className="link-dark text-decoration-none dropdown-toggle hover-pointer" data-bs-toggle="dropdown" aria-expanded="false">
                  <img id="userProfileImg" className="img-circle" width="50" height="50"></img>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="/login">New access token</a></li>
                  <li><hr className="dropdown-divider"></hr></li>
                  <li><a className="dropdown-item" href="https://accounts.spotify.com/en/logout">Sign out <i className="bi bi-box-arrow-right"></i></a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      <AvailableDevices  devices={devices} setStateOfAvailableDevices={setStateOfAvailableDevices}/>

      <div id="searchArtist" className="container">
        <div className="row">
          <div className="col-md-6 offset-md-3 text-center">
            <div id="divArtistSearchBar" className="d-flex justify-content-between">
              <input type="text" id="txtSearchArtist" className="form-control" placeholder="Enter an artists name" onKeyDown={searchArtistKeydown} autoComplete='off'></input>
              <button id="btnSearchArtist" className="btn" type="button" onClick={searchArtistClick}><i className="bi bi-search"></i></button>
            </div>
            <div id="searchArtistErrorMsg"></div>
          </div>
        </div>
      </div>


      <div id="searchArtistResults" className="container">
        <div className="row">
          <div id="artistResults" className="col-md-8 offset-md-2">
            <div id="artistCardGroup" className="row row-cols-1 row-cols-md-4 g-4" style={{marginTop: '15px'}}>
              <ArtistSearchResults artists={artists} />
            </div>
          </div>
        </div>
      </div>

      <div id="footer">
        <div id="trackCommands">
          <button className="btn" type="button"><i className="bi bi-skip-backward-fill"></i></button>
          <button className="btn" type="button"><i className="bi bi-play-circle"></i></button>
          <button className="btn" type="button"><i className="bi bi-skip-forward-fill"></i></button>
        </div>
      </div>
    </div>
  );
};

export default Home;
