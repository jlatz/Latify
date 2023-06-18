import "./App.css";
//import axios from "axios";
//import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '../public/jsx/index.jsx';
import Home from '../public/jsx/home.jsx';
import Invalid from '../public/jsx/invalid.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';


const App = () => {
  return(
      <Router>
        <Routes>
          <Route path='/' element={<Index />} />
          <Route path='/home' element={<Home />} />
          <Route path='/invalid' element={<Invalid />} />
        </Routes>
      </Router>
  );
};

export default App;
