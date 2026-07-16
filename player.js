(function(){
  var library=JSON.parse(document.getElementById("library-data").textContent);
  var tracks=[],activeSong=null,activeTrack=0;
  var audio=document.getElementById("audio");
  var playButton=document.getElementById("playButton");
  var seek=document.getElementById("seek");
  var volume=document.getElementById("volume");
  var playlist=document.getElementById("playlist");
  var lyricsScroll=document.getElementById("lyricsScroll");

  library.forEach(function(song,songIndex){
    song.tracks.forEach(function(track,versionIndex){
      tracks.push({song:song,songIndex:songIndex,versionIndex:versionIndex,label:track.label,audio:track.audio});
    });
  });
  tracks.sort(function(a,b){
    var timeDifference=Date.parse(b.song.tracks[b.versionIndex].createdAt)-Date.parse(a.song.tracks[a.versionIndex].createdAt);
    return (Number.isFinite(timeDifference)?timeDifference:0)||a.label.localeCompare(b.label,"zh-Hant",{numeric:true});
  });

  function formatTime(value){
    if(!Number.isFinite(value))return "00:00";
    var minutes=Math.floor(value/60),seconds=Math.floor(value%60);
    return String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0");
  }

  function buildPlaylist(){
    playlist.innerHTML="";
    var playlistHead=document.createElement("div");
    playlistHead.className="playlist-head";
    playlistHead.textContent="PLAYLIST";
    playlist.appendChild(playlistHead);
    tracks.forEach(function(track,index){
      var button=document.createElement("button");
      button.className="track-button";
      button.dataset.track=String(index);
      var name=document.createElement("span");
      name.className="track-name";
      name.textContent=track.label;
      button.append(name);
      button.addEventListener("click",function(){selectTrack(Number(button.dataset.track),true);});
      playlist.appendChild(button);
    });
  }

  function renderLyrics(song){
    lyricsScroll.textContent=song.lyrics;
    lyricsScroll.scrollTop=0;
  }

  function updateMediaMetadata(item){
    if(!("mediaSession" in navigator)||!("MediaMetadata" in window))return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:item.label,
        artist:item.song.homageIntent||item.song.title,
        album:"Suno Studio"
      });
    }catch(error){}
  }

  function selectTrack(index,autoplay){
    activeTrack=index;
    var item=tracks[index];
    if(!item)return;
    activeSong=item.song;
    audio.src=item.audio;
    audio.load();
    document.querySelectorAll(".track-button").forEach(function(button,i){button.classList.toggle("active",i===index);});
    document.getElementById("nowLabel").textContent=item.song.title+" — "+item.label;
    document.getElementById("storyTitle").textContent=item.song.title;
    document.getElementById("storyIntent").textContent=item.song.homageIntent;
    renderLyrics(item.song);
    updateMediaMetadata(item);
    if(autoplay)audio.play().catch(function(){});
  }

  playButton.addEventListener("click",function(){
    if(audio.paused)audio.play().catch(function(){});
    else audio.pause();
  });
  audio.addEventListener("play",function(){
    document.body.classList.add("is-playing");
    document.title=activeSong&&activeSong.homageIntent?activeSong.homageIntent:"Suno Studio";
    if("mediaSession" in navigator)navigator.mediaSession.playbackState="playing";
    playButton.textContent="❚❚";
    playButton.setAttribute("aria-label","暫停");
  });
  audio.addEventListener("pause",function(){
    document.body.classList.remove("is-playing");
    document.title="Suno Studio";
    if("mediaSession" in navigator)navigator.mediaSession.playbackState="paused";
    playButton.textContent="▶";
    playButton.setAttribute("aria-label","播放");
  });
  audio.addEventListener("loadedmetadata",function(){
    document.getElementById("duration").textContent=formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate",function(){
    var progress=audio.duration?audio.currentTime/audio.duration:0;
    seek.value=String(Math.round(progress*1000));
    document.getElementById("currentTime").textContent=formatTime(audio.currentTime);
  });
  audio.addEventListener("ended",function(){selectTrack((activeTrack+1)%tracks.length,true);});
  seek.addEventListener("input",function(){
    if(audio.duration)audio.currentTime=Number(seek.value)/1000*audio.duration;
  });
  volume.addEventListener("input",function(){audio.volume=Number(volume.value);});
  audio.volume=Number(volume.value);

  var interactiveGradient=document.querySelector(".interactive-gradient");
  var currentX=0,currentY=0,targetX=0,targetY=0;
  window.addEventListener("pointermove",function(event){
    targetX=event.clientX;
    targetY=event.clientY;
  });
  function moveInteractiveGradient(){
    currentX+=(targetX-currentX)/20;
    currentY+=(targetY-currentY)/20;
    interactiveGradient.style.transform="translate("+Math.round(currentX)+"px,"+Math.round(currentY)+"px)";
    requestAnimationFrame(moveInteractiveGradient);
  }
  moveInteractiveGradient();
  buildPlaylist();
  if(tracks.length)selectTrack(0,false);
})();
