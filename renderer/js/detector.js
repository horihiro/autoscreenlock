
(function main() {
  const { ipcRenderer } = require('electron');

  if ('FaceDetector' in window === false) {
    document.body.innerHTML = 'This browser is not supported!';
    return;
  }
  if ('ImageCapture' in window === false) {
    document.body.innerHTML = 'This browser is not supported!';
    return;
  }

  console.log('API is supported!');

  const $video = document.querySelector('[data-js-video]');
  const $canvas = document.querySelector('[data-js-canvas]');

  let faceCount = 0;

  window.addEventListener('load', async () => {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      $video.srcObject = stream;
      return $video.play();
    })
    .then(() => {
      const faceDetector = new window.FaceDetector( {fastMode: true, maxDetectedFaces: 1 })
      const imageCapture = new window.ImageCapture($video.srcObject.getVideoTracks()[0]);

      const detect = () => {

        imageCapture.grabFrame()
        .then((img) => {
          return faceDetector.detect(img).then((faces) => {return {faces, width: img.width, height: img.height}});
        })
        .then((params) => {
          $canvas.width = params.width;
          $canvas.height = params.height;
          drawFaceRectToCanvas(params.faces, $canvas);
          
          if (faceCount !== params.faces.length) {
            faceCount = params.faces.length;
            ipcRenderer.send('asynchronous-message', {type: 'faces', value: faceCount});
          }
        })
        .catch(()=>{})
        .then(() => {
          requestAnimationFrame(detect);
        });
      }
      detect();
    })
    .catch((e) => {
      window.alert(e);
      ipcRenderer.send('asynchronous-message', {type: 'process', value: 'exit'});
    });
  });
}());

function drawFaceRectToCanvas(faces, $canvas) {
  const ctx = $canvas.getContext('2d');
  const lineWidth = $canvas.height / 100;

  for (const face of faces) {
    ctx.beginPath();
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = lineWidth;
    ctx.rect(
      face.boundingBox.x,
      face.boundingBox.y,
      face.boundingBox.width,
      face.boundingBox.height
    );
    ctx.closePath();
    ctx.stroke();

    for (const landmark of face.landmarks) {
      for (const location of landmark.locations) {
        ctx.beginPath();
        ctx.arc(location.x, location.y, 20, 0, Math.PI*2);
        ctx.fillStyle = {
          'eye': 'blue',
          'nose': 'yellow',
          'mouth': 'green'
        }[landmark.type];
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}
