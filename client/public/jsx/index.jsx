import React, { useEffect, useRef } from 'react';

const Index = () => {
  const canvasRef = useRef(null);

  useEffect (() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
  
    function resizeCanvas() {
      // Set canvas dimensions to match the screen size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Example: Fill the canvas with a color
      ctx.fillStyle = 'lightgray';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Initial canvas setup
    resizeCanvas();

    // Update canvas dimensions on window resize
    window.addEventListener('resize', resizeCanvas);
    // Array to store circles
    let circles = [];
  
    // Generate circles
    function generateCircles() {
      for (var i = 0; i < 6; i++) {
        let circle = {
          x: Math.random() * canvas.width,
          y: canvas.height,
          radius: Math.random() * 30 + 10,
          dy: Math.random() * 2 + 1,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16)
        };
        circles.push(circle);
      }
    }
  
    // Animation loop
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Move and draw circles
      circles.forEach(function(circle, index) {
        // Move the circle vertically
        circle.y -= circle.dy;
  
        // Remove circle if it reaches the top of the screen
        if (circle.y - circle.radius < 0) {
          circles.splice(index, 1);
        }
  
        // Draw the circle
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.closePath();
      });
  
      // Request next animation frame
      requestAnimationFrame(animate);
    }
  
    // Generate initial circles
    generateCircles();
  
    // Start the animation
    animate();
  
    // Generate circles every 1.5 seconds
    setInterval(function() {
      generateCircles();
    }, 1500);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
      <div className="parent">
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
          <div className="cover-container overlay d-flex w-100 h-100 mx-auto flex-column">
              <header className="mb-auto"></header>
              <main className="px-3">
              <h1 style={{ color: 'white' }}>Welcome to Latify</h1>
              <p className="lead">
                  <a href="/api/login" className="btn btn-primary">Log in with Spotify</a>
              </p>
              </main>
              <footer className="mt-auto"></footer>
          </div>            
      </div>
  );
};

export default Index;