document.addEventListener('DOMContentLoaded', () => {
  let fileStore = {}; // Store files for each combination
  let combinations = []; // Store all combinations
  let currentCombination = ''; // Keep track of the current combination

  function setupDragAndDrop(dragAndDropAreaId, fileInputId, fileListId) {
    const dragAndDropArea = document.getElementById(dragAndDropAreaId);
    const fileInput = document.getElementById(fileInputId);
    const fileList = document.getElementById(fileListId);

    dragAndDropArea.addEventListener('click', () => fileInput.click());

    dragAndDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragAndDropArea.classList.add('dragover');
    });

    dragAndDropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragAndDropArea.classList.remove('dragover');
    });

    dragAndDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragAndDropArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      handleFiles(files);
    });

    function handleFiles(files) {
      const newFilesArray = Array.from(files);
      fileStore[currentCombination] = (fileStore[currentCombination] || []).concat(newFilesArray);
      updateFileList();
    }

    function updateFileList() {
      fileList.innerHTML = ''; // Clear the file list

      const filesArray = fileStore[currentCombination] || [];
      filesArray.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileName = document.createElement('span');
        fileName.textContent = file.name;
        fileItem.appendChild(fileName);

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Delete';
        cancelButton.addEventListener('click', () => {
          filesArray.splice(index, 1);
          fileStore[currentCombination] = filesArray;
          updateFileList();
        });
        fileItem.appendChild(cancelButton);

        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'thumbnail'; // Add a class for styling if needed
            fileItem.insertBefore(img, fileName);
          };
          reader.readAsDataURL(file);
        }

        fileList.appendChild(fileItem);
      });
    }

    function updateCurrentCombination() {
      const color = document.getElementById('colorDropdown').value;
      const size = document.getElementById('sizeDropdown').value;
      currentCombination = `${color}-${size}`;
      updateFileList();
    }

    document.getElementById('colorDropdown').addEventListener('change', updateCurrentCombination);
    document.getElementById('sizeDropdown').addEventListener('change', updateCurrentCombination);

    // Initialize current combination
    updateCurrentCombination();
  }

  setupDragAndDrop('drag-and-drop-create', 'fileInputCreate', 'fileListCreate');

  document.getElementById('colorDropdown').addEventListener('change', function() {
    if (this.value) {
      document.getElementById('sizeDropdown').style.display = 'block';
    } else {
      document.getElementById('sizeDropdown').style.display = 'none';
      document.getElementById('quantityInput').style.display = 'none';
      document.getElementById('drag-and-drop-create').style.display = 'none';
    }
  });

  document.getElementById('sizeDropdown').addEventListener('change', function() {
    if (this.value) {
      document.getElementById('quantityInput').style.display = 'block';
    } else {
      document.getElementById('quantityInput').style.display = 'none';
      document.getElementById('drag-and-drop-create').style.display = 'none';
    }
  });

  document.getElementById('quantityInput').addEventListener('change', function() {
    if (this.value) {
      document.getElementById('drag-and-drop-create').style.display = 'block';
      document.getElementById('addVariation').style.display = 'block';
    } else {
      document.getElementById('drag-and-drop-create').style.display = 'none';
      document.getElementById('addVariation').style.display = 'none';
    }
  });

  document.getElementById('addVariation').addEventListener('click', () => {
    const culoare = document.getElementById('colorDropdown').value;
    const marime = document.getElementById('sizeDropdown').value;
    const cantitate = document.getElementById('quantityInput').value;
    const filesArray = fileStore[`${culoare}-${marime}`] || [];
    const imagini = filesArray.map(file => file.name); // Collect image names (or URLs if available)

    if (culoare && marime && cantitate) {
      const variatie = {
        culoare,
        marimi: [
          {
            marime,
            cantitate,
            imagini
          }
        ]
      };

      // Check if the combination already exists, if so, update it
      const existingCombination = combinations.find(combination => combination.culoare === culoare);
      if (existingCombination) {
        const existingSize = existingCombination.marimi.find(m => m.marime === marime);
        if (existingSize) {
          existingSize.cantitate = cantitate;
          existingSize.imagini = imagini;
        } else {
          existingCombination.marimi.push({
            marime,
            cantitate,
            imagini
          });
        }
      } else {
        combinations.push(variatie);
      }

      console.log('Current combinations:', combinations); // Log the updated combinations
    }
  });

  document.querySelector('form').addEventListener('submit', function(event) {
    // Create a FormData object to include all files
    const formData = new FormData(event.target);

    // Append all files from fileStore to the FormData object
    Object.values(fileStore).flat().forEach(file => {
      formData.append('imagine', file);
    });

    // Append variations data as a JSON string
    if (combinations.length > 0) {
      formData.append('variatii', JSON.stringify(combinations));
    }

    // Submit the form via XMLHttpRequest or Fetch API
    fetch(event.target.action, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Final combinations submitted:', combinations); // Log the collected data
      console.log('Response:', data); // Log the server response
    })
    .catch(error => {
      console.error('Error:', error);
    });

    event.preventDefault(); // Prevent the default form submission
  });
});

function showForm(formId) {
  document.getElementById('create-form').style.display = 'none';
  document.getElementById('update-form').style.display = 'none';
  document.getElementById('delete-form').style.display = 'none';
  document.getElementById(formId).style.display = 'block';
}
