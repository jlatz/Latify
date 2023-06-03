import React, { useState } from 'react';
import $ from 'jquery';

function AvailableDevices({ devices, setStateOfAvailableDevices }) {
  const [selectedOption, setSelectedOption] = useState(0);

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const access_token = params.access_token;

  const availableDevicesClick = () => {
    $.ajax({
      url: '/api/availableDevices',
      type: 'GET',
      data: {'access_token': access_token},
      dataType: 'json',
      contentType: 'application/json charset=utf-8',
      cache: false
    }).done((response) => {
      setStateOfAvailableDevices(response);
    });          
  };

  const handleRadioChange = (index) => {
    setSelectedOption(index);
  };

  return (
    <div id="divAvailableDevices">
      <label>Available devices</label>
      <button id="btnAvailableDevices" className="btn" onClick={availableDevicesClick}><i className="bi bi-arrow-clockwise"></i></button>
      <ul>
        {devices.map((device, index) => (
          <li key={device.id}>
            <label>
              <input 
                type='radio' 
                className='deviceOptions' 
                value={device.id} 
                checked={selectedOption === index}
                onChange={() => handleRadioChange(index)}
              />
              {device.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AvailableDevices;