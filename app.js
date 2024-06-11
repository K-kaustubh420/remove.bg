const canvas = new fabric.Canvas('canvas', { isDrawingMode: false });
let resultImage = null; // To store the downloaded image data (blob)

canvas.setBackgroundImage('usable.png', canvas.renderAll.bind(canvas));

canvas.freeDrawingBrush.color = 'white';
canvas.freeDrawingBrush.width = 50;

$('#draw').on('click', function () {
  canvas.isDrawingMode = !canvas.isDrawingMode;
});

$('#remove').on('click', function () {
  canvas.isDrawingMode = false;
  canvas.remove(canvas.getActiveObject());
});

canvas.on('selection:created', function () {
  $('#remove').prop('disabled', false);
});
canvas.on('selection:cleared', function () {
  $('#remove').prop('disabled', true);
});

$('#api').on('click', function () {
  const imageData = canvas.toDataURL({
    format: 'png',
    quality: 1
  });
  removeBgFromImage(imageData);
});

$('#file-input').on('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (f) {
    const data = f.target.result;
    fabric.Image.fromURL(data, function (img) {
      // Set canvas dimensions to match the image dimensions
      canvas.setWidth(img.width);
      canvas.setHeight(img.height);

      // Scale the image to fit within the canvas
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height
      });
    });
  };

  reader.readAsDataURL(file);
});

// REMOVE BG API
function removeBgFromImage(imageData) {
  const apiKey = 'gS8Rf57nozwmMLFZoJ1W1QYg'; // Replace with your actual API key
  const base64Data = imageData.split(',')[1];

  fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({
      image_file_b64: base64Data
    })
  })
  .then(response => response.blob())
  .then(blob => {
    // Store the downloaded blob
    resultImage = blob;

    // Handle the response blob (e.g., create an image element and set the src)
    const imageUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = function() {
      URL.revokeObjectURL(imageUrl); // Free up memory
      document.getElementById('result-image').innerHTML = ''; // Clear previous result
      document.getElementById('result-image').appendChild(img);
      // Enable edit button after receiving result image
      $('#edit').prop('disabled', false);
    };
    img.src = imageUrl;
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// DOWNLOAD BUTTON FUNCTIONALITY
$('#download').on('click', function () {
  if (resultImage) {
    const downloadableBlob = new Blob([resultImage], { type: 'image/png' });
    const downloadableUrl = URL.createObjectURL(downloadableBlob);

    // Create a temporary anchor element
    var downloadLink = document.createElement("a");
    
    // Set the href attribute to the downloadable URL
    downloadLink.href = downloadableUrl;
    
    // Set the download attribute to specify the filename
    downloadLink.download = 'result-image.png';
    
    // Trigger a click event on the anchor element to start the download
    downloadLink.click();

    // Free up memory after download
    URL.revokeObjectURL(downloadableUrl);
  } else {
    alert('No result image to download. Please process an image first.');
  }
});


// EDIT BUTTON FUNCTIONALITY
$('#edit').on('click', function () {
  if (resultImage) {
    // Clear the canvas before loading the new image
    canvas.clear();

    fabric.Image.fromURL(URL.createObjectURL(resultImage), function(img) {
      // Add the image to the canvas
      canvas.add(img);

      // Fit the canvas to the image dimensions
      canvas.setWidth(img.width);
      canvas.setHeight(img.height);

      // Clear the result image
      resultImage = null;

      // Reset the download link
      $('#download').prop('enabled', true);
      document.getElementById('result-image').innerHTML = '';

      // Disable the edit button since the image is already loaded for editing
      $('#edit').prop('disabled', true);
    });
  }
});
