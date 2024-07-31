function setupDragAndDrop(formId, dragAndDropAreaId, fileInputId, fileListId) {
  const dragAndDropArea = document.getElementById(dragAndDropAreaId);
  const fileInput = document.getElementById(fileInputId);
  const fileList = document.getElementById(fileListId);
  let filesArray = [];

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
    filesArray = [...filesArray, ...newFilesArray];
    updateFileList();
  }

  function updateFileList() {
    fileList.innerHTML = ''; // Clear the file list

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
        updateFileList();
      });
      fileItem.appendChild(cancelButton);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          fileItem.insertBefore(img, fileName);
        };
        reader.readAsDataURL(file);
      } else {
        console.log('File is not an image:', file.name);
      }

      fileList.appendChild(fileItem);
    });
  }
}

// Set up drag and drop for each form
document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop('create-form', 'drag-and-drop-create', 'fileInputCreate', 'fileListCreate');
  setupDragAndDrop('update-form', 'drag-and-drop-update', 'fileInputUpdate', 'fileListUpdate');
});
