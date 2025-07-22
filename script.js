const audio = document.getElementById('my-audio');
const playBtn = document.getElementById('play');
const songs = ["Lukewarm.mp3", "Rolling Like A Ball.mp3","ラグトレイン.mp3"];
const progress = document.getElementById('progress');
const source = document.getElementById('audio-source');
let songIndex = 0;
playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.textContent = '';
    } else {
      audio.pause();
      playBtn.textContent = '';
    }
  });
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
function loadSong(index) {
    source.src = songs[index];
    audio.load(); // Reload the new source
    audio.play();
  }
function nextSong(){
    songIndex = (songIndex + 1) % songs.length; //wraps back
    playBtn.textContent = '';
    loadSong(songIndex);
}
function prevSong(){
    songIndex = (songIndex - 1 + songs.length) % songs.length; //wraps back
    playBtn.textContent = '';
    loadSong(songIndex); 
}
// Update progress bar as the song plays
audio.addEventListener('timeupdate', () => {
    progress.max = Math.floor(audio.duration);
    progress.value = Math.floor(audio.currentTime);
  });
progress.addEventListener('input', () => {
  audio.currentTime = progress.value;
});
  
nextBtn.addEventListener('click',nextSong);
prevBtn.addEventListener('click',prevSong);
