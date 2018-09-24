// TODO: promise.some

Promise.some = (promises) => {
  return new Promise((resolve) => {
    let counter = 0;
    const callback = () => {
      counter -= 1;
      if (counter === 0) {
        resolve();
      }
    };

    for (let promise of promises) {
      counter += 1;
      promise
        .then(callback)
        .catch(e => {
          callback();
          // eslint-disable-next-line
          console.warn('A promise failed: ', e);
        });
    }
  });
};
