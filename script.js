const canvas = document.getElementById("animation-canvas");
const context = canvas.getContext("2d");

// Ensure the canvas matches the screen dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const frameCount = 240;
// Helper function to get the correct image path
const currentFrame = index => (
  `pics.wepg/ezgif-frame-${(index + 1).toString().padStart(3, '0')}_wepg.webp`
);

const images = [];

// Preload all images so there's no lag during scrolling
function preloadImages() {
  for (let i = 0; i < frameCount; i++) {
    const imgObj = new Image();
    imgObj.src = currentFrame(i);
    images.push(imgObj);
  }
}
preloadImages();

// Draw the very first frame to the canvas immediately when it loads
const firstImg = new Image();
firstImg.src = currentFrame(0);
firstImg.onload = function() {
  drawImageScaled(firstImg, context);
};

// Listen to the scroll event
window.addEventListener('scroll', () => {  
  const scrollTop = document.documentElement.scrollTop;
  // Calculate the maximum possible scroll top
  const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
  
  // Calculate the fraction of the scroll progress (from 0 to 1)
  const scrollFraction = scrollTop / maxScrollTop;
  
  // Find which frame index corresponds to that fraction
  const frameIndex = Math.min(
    frameCount - 1,
    Math.ceil(scrollFraction * frameCount)
  );
  
  // Use requestAnimationFrame for smooth drawing
  requestAnimationFrame(() => {
    if(images[frameIndex] && images[frameIndex].complete) {
        drawImageScaled(images[frameIndex], context);
    }
  });
});

// Update canvas and redraw if the window is resized
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const scrollTop = document.documentElement.scrollTop;
  const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
  const scrollFraction = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
  const frameIndex = Math.min(
    frameCount - 1,
    Math.ceil(scrollFraction * frameCount)
  );
  
  if(images[frameIndex] && images[frameIndex].complete) {
      drawImageScaled(images[frameIndex], context);
  }
});

// Helper function to draw and center the image on the canvas optimally
function drawImageScaled(img, ctx) {
    var canvas = ctx.canvas;
    // Calculate aspect ratios
    var hRatio = canvas.width / img.width;
    var vRatio = canvas.height / img.height;
    // Depending on what you want (cover vs contain), we use Math.min for "contain" and Math.max for "cover"
    // Math.max ensures the image fills the whole screen, might crop edges.
    var ratio  = Math.max(hRatio, vRatio);
    
    var centerShift_x = (canvas.width - img.width * ratio) / 2;
    var centerShift_y = (canvas.height - img.height * ratio) / 2;  
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0,0, img.width, img.height,
                       centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);  
}
