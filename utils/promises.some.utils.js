// TODO: promise.some

Promise.some = (promises) => {
  let counter = 0;
  for (let promise of promises) {
    counter += 1;
    promise
      .then();
  }
};
