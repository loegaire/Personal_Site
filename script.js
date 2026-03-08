const body = document.body;
const aboutSection = document.querySelector('.about');

const audio = document.getElementById('my-audio');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const progress = document.getElementById('progress');
const source = document.getElementById('audio-source');
const songs = ['Lukewarm.mp3', 'Rolling Like A Ball.mp3', 'ラグトレイン.mp3'];
let songIndex = 0;

function updatePlayButton(isPlaying) {
  if (!playBtn) {
    return;
  }

  playBtn.innerHTML = isPlaying
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
}

if (audio && playBtn && nextBtn && prevBtn && progress && source) {
  playBtn.addEventListener('click', async () => {
    if (audio.paused) {
      await audio.play().catch(() => undefined);
      updatePlayButton(!audio.paused);
      return;
    }

    audio.pause();
    updatePlayButton(false);
  });

  function loadSong(index) {
    source.src = songs[index];
    audio.load();
    audio.play().catch(() => undefined);
    updatePlayButton(true);
  }

  function nextSong() {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songIndex);
  }

  function prevSong() {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    loadSong(songIndex);
  }

  audio.addEventListener('timeupdate', () => {
    progress.max = Math.floor(audio.duration || 0);
    progress.value = Math.floor(audio.currentTime || 0);
  });

  audio.addEventListener('ended', nextSong);

  progress.addEventListener('input', () => {
    audio.currentTime = Number(progress.value);
  });

  nextBtn.addEventListener('click', nextSong);
  prevBtn.addEventListener('click', prevSong);
  updatePlayButton(false);
}

const writeupList = document.getElementById('writeupList');
const researchList = document.getElementById('researchList');
const feedPanel = document.querySelector('.feedPanel');
const feedList = document.getElementById('feedList');
const feedTitle = document.getElementById('feedTitle');
const feedSubtitle = document.getElementById('feedSubtitle');
const feedBack = document.getElementById('feedBack');
const feedArticle = document.getElementById('feedArticle');
const writeups = Array.isArray(window.WRITEUPS_DATA) ? window.WRITEUPS_DATA : [];
const researchPosts = Array.isArray(window.RESEARCH_DATA) ? window.RESEARCH_DATA : [];
const sortedWriteups = [...writeups].sort((left, right) => {
  if ((right.order ?? 0) !== (left.order ?? 0)) {
    return (right.order ?? 0) - (left.order ?? 0);
  }
  return (left.title || '').localeCompare(right.title || '');
});
const sortedResearch = [...researchPosts].sort((left, right) => {
  if ((right.order ?? 0) !== (left.order ?? 0)) {
    return (right.order ?? 0) - (left.order ?? 0);
  }
  return (left.title || '').localeCompare(right.title || '');
});

function setFeedLandingState() {
  if (feedTitle) {
    feedTitle.textContent = 'Newest writeups';
  }
  if (feedSubtitle) {
    feedSubtitle.innerHTML = '';
  }
  if (feedArticle) {
    feedArticle.innerHTML = '';
  }
  feedPanel?.classList.remove('is-reading');
  body.classList.remove('feed-reading');
}

function showFeedList() {
  setFeedLandingState();
  if (window.location.search.includes('post=') || window.location.search.includes('writeup=')) {
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl);
  }
}

function renderTags(tags = []) {
  if (!tags.length) {
    return '';
  }

  return `
    <div class="feedTags">
      ${tags.map((tag) => `<span class="feedTag">${tag}</span>`).join('')}
    </div>
  `;
}

function renderWriteupButtons(items) {
  if (!writeupList) {
    return;
  }

  writeupList.innerHTML = '';

  items.forEach((writeup) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'writeupTrigger';
    button.title = writeup.summary || writeup.excerpt || writeup.title;
    button.innerHTML = `<span><i class="fa-regular fa-sparkle"></i>${writeup.title}</span>`;
    button.addEventListener('click', () => {
      renderWriteup(writeup);
    });
    writeupList.appendChild(button);
  });
}

function renderResearchButtons(items) {
  if (!researchList) {
    return;
  }

  researchList.innerHTML = '';

  if (!items.length) {
    researchList.innerHTML = '<p class="projectPlaceholder">Soon™</p>';
    return;
  }

  items.forEach((post) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'projectTrigger';
    button.title = post.summary || post.excerpt || post.title;
    button.innerHTML = `<span><i class="fa-regular fa-note-sticky"></i>${post.title}</span>`;
    button.addEventListener('click', () => {
      renderWriteup(post);
    });
    researchList.appendChild(button);
  });
}

function renderFeedCards(items) {
  if (!feedList) {
    return;
  }

  feedList.innerHTML = '';

  items.forEach((writeup) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'feedCard';
    card.innerHTML = `
      ${writeup.previewImage
        ? `<img class="feedCardImage" src="${writeup.previewImage}" alt="${writeup.title}">`
        : `<div class="feedCardIcon"><i class="fa-regular fa-newspaper"></i></div>`}
      <div class="feedCardBody">
        ${renderTags(writeup.tags || [])}
        <div class="feedCardText">
          <h3>${writeup.title}</h3>
          <p>${writeup.excerpt || writeup.summary || ''}</p>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      renderWriteup(writeup);
    });
    feedList.appendChild(card);
  });
}

function renderWriteup(writeup) {
  if (!feedArticle || !feedTitle || !feedSubtitle) {
    return;
  }

  const section = writeup.section || 'writeups';
  window.history.replaceState({}, '', `${window.location.pathname}?post=${encodeURIComponent(`${section}:${writeup.slug}`)}${window.location.hash}`);
  feedTitle.textContent = writeup.title;
  feedSubtitle.innerHTML = renderTags(writeup.tags || []) || '<span class="feedSubtitleText">Markdown writeup</span>';
  feedPanel?.classList.add('is-reading');
  body.classList.add('feed-reading');
  feedArticle.innerHTML = writeup.html || '<p>Could not load this writeup.</p>';
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([feedArticle]).catch(() => undefined);
  }
  feedArticle.scrollTop = 0;
}

async function initWriteups() {
  if (!writeupList || !feedList || !researchList) {
    return;
  }

  if (!sortedWriteups.length) {
    writeupList.innerHTML = '<p class="writeupLoading">Could not load writeups.</p>';
    feedList.innerHTML = '<p class="writeupLoading">Could not load the feed.</p>';
  } else {
    renderWriteupButtons(sortedWriteups);
    renderFeedCards(sortedWriteups);
  }

  renderResearchButtons(sortedResearch);
  setFeedLandingState();

  const allPosts = [...sortedWriteups, ...sortedResearch];
  const params = new URLSearchParams(window.location.search);
  const postFromUrl = params.get('post');
  const legacyWriteupSlug = params.get('writeup');

  if (postFromUrl) {
    const [section, slug] = decodeURIComponent(postFromUrl).split(':');
    const matchingPost = allPosts.find((post) => post.section === section && post.slug === slug);
    if (matchingPost) {
      renderWriteup(matchingPost);
    }
    return;
  }

  if (legacyWriteupSlug) {
    const matchingWriteup = sortedWriteups.find((writeup) => writeup.slug === legacyWriteupSlug);
    if (matchingWriteup) {
      renderWriteup(matchingWriteup);
    }
  }
}

feedBack?.addEventListener('click', showFeedList);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('feed-reading')) {
    showFeedList();
  }
});

void initWriteups();
