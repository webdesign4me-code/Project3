const SPINE_COLORS = [
  '#3c5729', '#b85c32', '#214e7e', '#9c6b3c', '#6b6b8a',
  '#8a5a5a', '#4a7a6e', '#a67c52', '#6e5a7a', '#7a6e4a'
];


let books   = JSON.parse(localStorage.getItem('folio_books')   || '[]');
let history = JSON.parse(localStorage.getItem('folio_history') || '[]');

let editId  = null;
let lendId  = null;
let viewFilter    = 'all';
let catFilter     = '';
let showingHistory = false;


if (!books.length) {
  books = [
    { id:1, title:"Normal People",          author:"Sally Rooney",      category:"Fiction",   status:"read",     year:1999, rating:5, notes:"", ci:0 },
    { id:2, title:"Deep Work",              author:"Cal Newport",       category:"Self-Help", status:"read",     year:2016, rating:5, notes:"", ci:4 },
    { id:3, title:"Game of Thrones",        author:"George R.R. Martin",category:"Fantasy",   status:"wishlist", year:1996, rating:null, notes:"", ci:2 },
    { id:4, title:"The Catcher in the Rye", author:"J.D. Salinger",     category:"Fiction",   status:"read",     year:1951, rating:4, notes:"", ci:1 },
    { id:5, title:"Atomic Habits",          author:"James Clear",       category:"Self-Help", status:"wishlist", year:2018, rating:null, notes:"", ci:5 },
    { id:6, title:"The Housemaid",          author:"Freida McFadden",   category:"Fiction",   status:"reading",  year:2022, rating:null, notes:"", ci:3 },
  ];
  history = [];
  save();
}

function save() {
  localStorage.setItem('folio_books',   JSON.stringify(books));
  localStorage.setItem('folio_history', JSON.stringify(history));
}


function getFiltered() {
  var q = document.getElementById('searchInput').value.toLowerCase();
  var sort = document.getElementById('sortSelect').value;
  var list = [];

  for (var i = 0; i < books.length; i++) {
    var b = books[i];

    var matchesSearch = true;
    if (q) {
      var inTitle  = b.title.toLowerCase().indexOf(q) !== -1;
      var inAuthor = b.author.toLowerCase().indexOf(q) !== -1;
      if (!inTitle && !inAuthor) matchesSearch = false;
    }

    var matchesView = true;
    if (viewFilter !== 'all' && b.status !== viewFilter) matchesView = false;

    var matchesCat = true;
    if (catFilter && b.category !== catFilter) matchesCat = false;

    if (matchesSearch && matchesView && matchesCat) {
      list.push(b);
    }
  }

  if (sort === 'title') {
    list.sort(function(a, b) {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
  } else if (sort === 'author') {
    list.sort(function(a, b) {
      if (a.author < b.author) return -1;
      if (a.author > b.author) return 1;
      return 0;
    });
  } else if (sort === 'rating') {
    list.sort(function(a, b) {
      var ra = a.rating ? a.rating : 0;
      var rb = b.rating ? b.rating : 0;
      return rb - ra;
    });
  }

  return list;
}


function render() {
  updateStats();

  var list = getFiltered();
  var el   = document.getElementById('bookList');

  if (list.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <em>No books here yet.</em>
        <p>Add your first book using the button in the sidebar.</p>
      </div>`;
    return;
  }

  var html = '';

  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    var col = SPINE_COLORS[b.ci % SPINE_COLORS.length];
    var words = b.title.split(' ');
    var initials = '';
    if (words[0]) initials += words[0][0];
    if (words[1]) initials += words[1][0];
    initials = initials.toUpperCase();

    var stars = '';
    if (b.rating) {
      for (var s = 0; s < b.rating; s++) stars += '★';
      for (var s = b.rating; s < 5; s++) stars += '☆';
    }

    var statusLabel = b.status;
    if (b.status === 'read')     statusLabel = 'Read';
    if (b.status === 'reading')  statusLabel = 'Reading';
    if (b.status === 'wishlist') statusLabel = 'Wishlist';
    if (b.status === 'borrowed') statusLabel = 'Lent Out';

    var yearPart = b.year ? ' · ' + b.year : '';
    var starsPart = stars ? `<div class="rating-stars">${stars}</div>` : '';

    html += `
    <div class="book-row" onclick="handleRowTap(event, ${b.id})">
      <div class="book-spine" style="background:${col}">${initials}</div>
      <div class="book-main">
        <div class="book-row-title">${b.title}</div>
        <div class="book-row-meta">
          <b>${b.author}</b>${yearPart} · ${b.category}
        </div>
        ${starsPart}
      </div>
      <span class="status-tag ${b.status}">${statusLabel}</span>
      <div class="row-actions">
        <button class="act-btn" onclick="openEdit(${b.id})">Edit</button>
        <button class="act-btn" onclick="openLend(${b.id})">Lend</button>
        <button class="act-btn del" onclick="del(${b.id})">✕</button>
      </div>
    </div>`;
  }

  el.innerHTML = html;
}


function handleRowTap(e, id) {
  if (e.target.closest('button')) return;
  if (window.innerWidth <= 640) {
    openEdit(id);
  }
}

function updateStats() {
  var total = books.length;
  var readCount = 0;
  var readingCount = 0;
  var outCount = 0;

  for (var i = 0; i < books.length; i++) {
    if (books[i].status === 'read')    readCount++;
    if (books[i].status === 'reading') readingCount++;
  }

  for (var j = 0; j < history.length; j++) {
    if (history[j].status === 'out') outCount++;
  }

  var wishCount = 0;
  var borrowedCount = 0;
  for (var i = 0; i < books.length; i++) {
    if (books[i].status === 'wishlist') wishCount++;
    if (books[i].status === 'borrowed') borrowedCount++;
  }

  document.getElementById('sTotal').textContent   = total;
  document.getElementById('sRead').textContent    = readCount;
  document.getElementById('sReading').textContent = readingCount;
  document.getElementById('sOut').textContent     = outCount;

  document.getElementById('cpAll').textContent     = total;
  document.getElementById('cpReading').textContent = readingCount;
  document.getElementById('cpRead').textContent    = readCount;
  document.getElementById('cpWish').textContent    = wishCount;
  document.getElementById('cpBorr').textContent    = outCount;
}


function switchView(v, el) {
  viewFilter     = v;
  showingHistory = false;

  document.getElementById('bookListWrap').style.display = '';
  document.getElementById('historyWrap').style.display  = 'none';

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  var titleHTML = 'All <span>Books</span>';
  if (v === 'reading')  titleHTML = 'Currently <span>Reading</span>';
  if (v === 'read')     titleHTML = 'Finished <span>Books</span>';
  if (v === 'wishlist') titleHTML = 'My <span>Wishlist</span>';
  if (v === 'borrowed') titleHTML = 'Lent <span>Out</span>';

  document.getElementById('pageTitle').innerHTML = titleHTML;

  closeSidebar();
  render();
}

function showHistory() {
  showingHistory = true;
  document.getElementById('bookListWrap').style.display = 'none';
  document.getElementById('historyWrap').style.display  = '';
  document.getElementById('pageTitle').innerHTML = 'Borrow <span>History</span>';

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  closeSidebar();
  renderHistory();
}


function renderHistory() {
  var rows = document.getElementById('historyRows');

  if (history.length === 0) {
    rows.innerHTML = `<div class="empty"><em>No borrowing history yet.</em></div>`;
    return;
  }

  var now = new Date();
  var reversed = history.slice().reverse();
  var html = '';

  for (var i = 0; i < reversed.length; i++) {
    var h = reversed[i];
    var due = new Date(h.dueDate);

    var sc = 'out';
    var sl = 'Out';

    if (h.status === 'returned') {
      sc = 'returned';
      sl = 'Returned';
    } else if (due < now) {
      sc = 'overdue';
      sl = 'Overdue';
    }

    var returnBtn = '';
    if (h.status === 'out') {
      returnBtn = `<button class="return-btn" onclick="markReturn('${h.bookTitle}', '${h.borrower}')">Return</button>`;
    }

    html += `
    <div class="history-row">
      <div class="h-cell"><strong>${h.bookTitle}</strong></div>
      <div class="h-cell">${h.borrower}</div>
      <div class="h-cell">${h.lentOn}</div>
      <div class="h-cell">${h.dueDate}</div>
      <div class="h-cell">
        <span class="badge ${sc}">${sl}</span>
        ${returnBtn}
      </div>
      <div class="h-cell"></div>
    </div>`;
  }

  rows.innerHTML = html;
}

function markReturn(title, borrower) {
  var entry = null;
  for (var i = 0; i < history.length; i++) {
    if (history[i].bookTitle === title && history[i].borrower === borrower && history[i].status === 'out') {
      entry = history[i];
      break;
    }
  }
  if (!entry) return;

  entry.status = 'returned';

  for (var i = 0; i < books.length; i++) {
    if (books[i].title === title && books[i].status === 'borrowed') {
      books[i].status = 'read';
      break;
    }
  }

  save();
  renderHistory();
  updateStats();
  toast(`"${title}" returned`);
}


function setCat(c, el) {
  catFilter = c;
  document.querySelectorAll('.filter-chip').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  render();
}


function openAdd() {
  editId = null;
  document.getElementById('mTitle').textContent = 'Add a Book';

  document.getElementById('fTitle').value  = '';
  document.getElementById('fAuthor').value = '';
  document.getElementById('fNotes').value  = '';
  document.getElementById('fYear').value   = '';
  document.getElementById('fRating').value = '';
  document.getElementById('fCat').value    = 'Fiction';
  document.getElementById('fStatus').value = 'wishlist';

  document.getElementById('bookModal').classList.add('open');
}

function openEdit(id) {
  var b = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === id) { b = books[i]; break; }
  }
  if (!b) return;

  editId = id;
  document.getElementById('mTitle').textContent = 'Edit Book';

  document.getElementById('fTitle').value  = b.title;
  document.getElementById('fAuthor').value = b.author;
  document.getElementById('fCat').value    = b.category;
  document.getElementById('fStatus').value = b.status;
  document.getElementById('fYear').value   = b.year   || '';
  document.getElementById('fRating').value = b.rating || '';
  document.getElementById('fNotes').value  = b.notes  || '';

  document.getElementById('bookModal').classList.add('open');
}

function closeModal() {
  document.getElementById('bookModal').classList.remove('open');
}

function saveBook() {
  var title  = document.getElementById('fTitle').value.trim();
  var author = document.getElementById('fAuthor').value.trim();

  if (!title || !author) {
    toast('Title and author are required');
    return;
  }

  if (editId) {
    var b = null;
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === editId) { b = books[i]; break; }
    }
    b.title    = title;
    b.author   = author;
    b.category = document.getElementById('fCat').value;
    b.status   = document.getElementById('fStatus').value;
    b.year     = document.getElementById('fYear').value   || null;
    b.rating   = document.getElementById('fRating').value || null;
    b.notes    = document.getElementById('fNotes').value;
    toast(`"${title}" updated`);
  } else {
    var newBook = {
      id:       Date.now(),
      title:    title,
      author:   author,
      category: document.getElementById('fCat').value,
      status:   document.getElementById('fStatus').value,
      year:     document.getElementById('fYear').value   || null,
      rating:   document.getElementById('fRating').value || null,
      notes:    document.getElementById('fNotes').value,
      ci:       books.length % SPINE_COLORS.length
    };
    books.push(newBook);
    toast(`"${title}" added`);
  }

  save();
  closeModal();
  render();
}

function del(id) {
  var b = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === id) { b = books[i]; break; }
  }
  if (!b) return;
  if (!confirm(`Remove "${b.title}"?`)) return;

  var newList = [];
  for (var i = 0; i < books.length; i++) {
    if (books[i].id !== id) newList.push(books[i]);
  }
  books = newList;

  save();
  render();
  toast(`Removed "${b.title}"`);
}


function openLend(id) {
  lendId = id;
  document.getElementById('bName').value = '';

  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  var todayStr = yyyy + '-' + mm + '-' + dd;

  var due = new Date();
  due.setDate(due.getDate() + 14);
  var dd2 = String(due.getDate()).padStart(2, '0');
  var mm2 = String(due.getMonth() + 1).padStart(2, '0');
  var yyyy2 = due.getFullYear();
  var dueStr = yyyy2 + '-' + mm2 + '-' + dd2;

  document.getElementById('bLent').value = todayStr;
  document.getElementById('bDue').value  = dueStr;

  document.getElementById('borrowModal').classList.add('open');
}

function saveLend() {
  var name = document.getElementById('bName').value.trim();
  if (!name) { toast('Borrower name required'); return; }

  var b = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === lendId) { b = books[i]; break; }
  }

  var entry = {
    bookTitle: b.title,
    borrower:  name,
    lentOn:    document.getElementById('bLent').value,
    dueDate:   document.getElementById('bDue').value,
    status:    'out'
  };
  history.push(entry);

  b.status = 'borrowed';

  save();
  document.getElementById('borrowModal').classList.remove('open');
  render();
  updateStats();
  toast(`"${b.title}" lent to ${name}`);
}


function toggleSidebar() {
  var sidebar  = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  var isOpen   = sidebar.classList.contains('open');

  sidebar.classList.toggle('open', !isOpen);
  backdrop.classList.toggle('visible', !isOpen);
  document.getElementById('hamburger').setAttribute('aria-expanded', String(!isOpen));
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('visible');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
}


window.addEventListener('resize', function() {
  if (window.innerWidth > 640) closeSidebar();
});


function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() {
    t.classList.remove('show');
  }, 2500);
}


render();