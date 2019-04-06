(() => {
  const { ipcRenderer } = require('electron');

  const count = document.querySelector('body.countdown>div');
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
  let c = 5;
  const time = new Date();
 
  const preCountdown = () => {
    count.innerText = "start";
    return new Promise((res) => {
      setTimeout(res, 1000);
    });
  };
  const countdown = () => {
    return new Promise((res) => {    
      const timerId = setInterval(() => {
        if (duration >= 0 ) {
          time.setTime(duration);
          count.innerText = `${('0'+time.getMinutes()).slice(-2)}:${('0'+time.getSeconds()).slice(-2)}.${('00'+time.getMilliseconds()).slice(-3)}`;
          if (duration < 3000) count.style.color = 'orange';
          duration -= interval;
        } else {
          count.innerText = '00:00.000';
          count.style.color = 'red';
          clearInterval(timerId);
          res();
        }
      }, interval);
    });
  };
  const postCountdown = () => {
    return new Promise((res) => {
      setTimeout(() => {
        count.innerText = 'LOCK';
        setTimeout(() => {
          ipcRenderer.send('asynchronous-message', {type: 'lock', value: true});
          res();
        }, 1000);
      }, 1000);
    });
  };
  preCountdown()
  .then(countdown)
  .then(postCountdown);
})();