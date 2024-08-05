function toggleSearch() {
  const searchContainer = document.getElementById('mobileSearchContainer');
  if (searchContainer.style.display === 'flex') {
    searchContainer.style.display = 'none';
  } else {
    searchContainer.style.display = 'flex';
  }
}

function toggleAccount() {
  const accountContainer = document.getElementById('mobileAccountContainer');
  if (accountContainer.style.display === 'flex') {
    accountContainer.style.display = 'none';
  } else {
    accountContainer.style.display = 'flex';
  }
}

function toggleCart() {
  const cartContainer = document.getElementById('mobileCartContainer');
  if (cartContainer.style.display === 'flex') {
    cartContainer.style.display = 'none';
  } else {
    cartContainer.style.display = 'flex';
  }
}

const search_bar = document.getElementById('desktopSearchContainer');
const initial_width = search_bar.style.width;
const search_img = document.getElementById('search-img');

const cancel_btn = document.getElementById('cancel-button');

function expandSearchBar() {
  search_bar.style.width = '30%';
  search_bar.style.opacity = '1';

  cancel_btn.style.display = 'block';
  cancel_btn.style.opacity = '0.7';
  cancel_btn.style.margin = '5px';
  cancel_btn.style.marginBottom = '6px';
  search_bar.focus();
}

search_bar.addEventListener('click', expandSearchBar);
search_bar.addEventListener('focusout', () => {
  search_bar.style.width = initial_width;
  cancel_btn.style.display = 'none';
} );

cancel_btn.addEventListener('click', () => {
  search_bar.style.width = initial_width;
  cancel_btn.style.display = 'none';
});