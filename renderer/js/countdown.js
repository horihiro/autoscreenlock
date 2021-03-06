(() => {
  const { ipcRenderer, screen, desktopCapturer } = require('electron');

  const $count = document.querySelector('body.countdown>div.msg');
  const queries = location.search.replace(/\?/,'').split(/&/).map((kv) => { 
    const pair = kv.split(/=/);
    return {
      name: pair[0],
      value: pair[1]
    }
  })
  .reduce((l,r) => {
    l[r.name] = r.value;
    return l;
  }, {});

  let duration = queries["duration"] || 5000;
  const interval = 17;
  const time = new Date();
 
  const preCountdown = () => {
    $count.innerHTML = 'Nobody is found';
    return new Promise((res) => {
      setTimeout(() => {
        $count.innerText = 'Countdown start';
        setTimeout(() => {
          time.setTime(duration);
          $count.innerText = '';
          $count.style.fontSize = '15vw';
          $count.innerText = `${('0'+time.getMinutes()).slice(-2)}:${('0'+time.getSeconds()).slice(-2)}.${('00'+time.getMilliseconds()).slice(-3)}`;
          setTimeout(res, 2000);
        }, 1000);
      }, 1000);
    });
  };
  const countdown = () => {
    return new Promise((res) => {
      const timerId = setInterval(() => {
        if (duration >= 0 ) {
          time.setTime(duration);
          $count.innerText = `${('0'+time.getMinutes()).slice(-2)}:${('0'+time.getSeconds()).slice(-2)}.${('00'+time.getMilliseconds()).slice(-3)}`;
          if (duration < 3000) $count.style.color = 'orange';
          duration -= interval;
        } else {
          $count.innerText = '00:00.000';
          $count.style.color = 'red';
          clearInterval(timerId);
          res();
        }
      }, interval);
    });
  };
  const postCountdown = () => {
    return new Promise((res) => {
      setTimeout(() => {
        $count.innerHTML = 'BYE';
        ss = document.querySelector('img.ss');
        bg = document.querySelector('div.bg');
        desktopCapturer.getSources({types:['screen'], thumbnailSize: screen.getPrimaryDisplay().size}, function(error, sources) {
          if (error) return console.log(error)
          sources.forEach(function(source) {
            if (source.name !== "Screen 1") return;
            ss.src = source.thumbnail.toDataURL();
          });
        });
        setTimeout(() => {
          ss.style.display = bg.style.display = 'block';
          ss.addEventListener('animationend', () => {
            ss.style.display = 'none';
            setTimeout(() => {
              ipcRenderer.send('asynchronous-message', {type: 'lock', value: true});
              res();
            }, 1000);
          });
          ss.style.animation = 'closing 0.3s ease 0s 1 alternate forwards running';
        }, 1000);
      }, 1000);
    });
  };

  preCountdown()
  .then(countdown)
  .then(postCountdown);
})();