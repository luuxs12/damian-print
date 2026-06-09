const fs = require('fs');
const https = require('https');
const url = require('url');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function get(videoUrl, callback) {
  const options = {
    headers: {
      'User-Agent': USER_AGENT
    }
  };
  https.get(videoUrl, options, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      get(res.headers.location, callback);
    } else {
      callback(res);
    }
  }).on('error', (e) => {
    console.error('Fetch error:', e);
  });
}

const pageUrl = 'https://www.youtube.com/watch?v=Ih4juHcq8UQ';
console.log('Fetching YouTube page...');
get(pageUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matchPlayer = data.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!matchPlayer) {
      console.error('Could not find player response on page.');
      return;
    }
    
    try {
      const json = JSON.parse(matchPlayer[1]);
      const formats = (json.streamingData || {}).formats || [];
      const bestFormat = formats.find(f => f.url);
      if (!bestFormat) {
        console.error('No direct format URL found.');
        return;
      }
      
      console.log('Found video URL. Downloading...');
      const file = fs.createWriteStream('video.mp4');
      
      get(bestFormat.url, (videoRes) => {
        if (videoRes.statusCode === 200) {
          videoRes.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('Video downloaded successfully! Size:', fs.statSync('video.mp4').size);
          });
        } else {
          console.error('Failed to download video. Status:', videoRes.statusCode);
        }
      });
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
});
