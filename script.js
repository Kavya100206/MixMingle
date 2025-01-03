document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const trackList = document.getElementById("trackList");
    const selectedTracks = document.getElementById("selectedTracks");
    const generateMashup = document.getElementById("generateMashup");
    const mashupPlayer = document.getElementById("mashupPlayer");
    const downloadMashup = document.getElementById("downloadMashup");
  
    const spotifyClientId = "YOUR_SPOTIFY_CLIENT_ID";
    const spotifyClientSecret = "YOUR_SPOTIFY_CLIENT_SECRET";
    let accessToken = "";
  
    async function fetchAccessToken() {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });
      const data = await response.json();
      accessToken = data.access_token;
    }
  
    async function searchTracks(query) {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      displayTracks(data.tracks.items);
    }
  
    function displayTracks(tracks) {
      trackList.innerHTML = "";
      tracks.forEach((track) => {
        const li = document.createElement("li");
        li.textContent = `${track.name} by ${track.artists[0].name}`;
        li.dataset.previewUrl = track.preview_url; // Save preview URL
        li.addEventListener("click", () => addTrackToMashup(track));
        trackList.appendChild(li);
      });
    }
  
    function addTrackToMashup(track) {
      const li = document.createElement("li");
      li.textContent = `${track.name} by ${track.artists[0].name}`;
      li.dataset.previewUrl = track.preview_url;
      selectedTracks.appendChild(li);
    }
  
    async function generateMashupAudio() {
      const audioContext = new AudioContext();
      const audioBuffers = [];
      const trackUrls = Array.from(selectedTracks.children).map(
        (track) => track.dataset.previewUrl
      );
  
      for (const url of trackUrls) {
        if (url) {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers.push(audioBuffer);
        }
      }
  
      const outputBuffer = audioContext.createBuffer(
        2,
        Math.max(...audioBuffers.map((buf) => buf.length)),
        audioContext.sampleRate
      );
  
      audioBuffers.forEach((buffer, index) => {
        for (let channel = 0; channel < 2; channel++) {
          const output = outputBuffer.getChannelData(channel);
          const input = buffer.getChannelData(channel);
          for (let i = 0; i < input.length; i++) {
            output[i] += input[i] / audioBuffers.length; // Average the tracks
          }
        }
      });
  
      const blob = new Blob([outputBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      mashupPlayer.src = url;
      mashupPlayer.play();
  
      downloadMashup.href = url;
      downloadMashup.download = "mashup.wav";
    }
  
    searchButton.addEventListener("click", () => searchTracks(searchInput.value));
    generateMashup.addEventListener("click", generateMashupAudio);
  
    fetchAccessToken();
  });
  