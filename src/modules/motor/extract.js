import axios from 'axios';

import jsdom from 'jsdom';

const { JSDOM } = jsdom;

let newsUrl = 'https://www.google.es/search';
// let newsUrl = 'https://www.google.es/search?btnG=Buscar&q=';
let query = 'Covid España';
// // let postUrl =
//   '&biw=1536&bih=722&tbm=nws&sxsrf=ALeKk02qhT7sU3kSgBkU4jhLhFJJyRwUyw%3A1621873913040&ei=-dSrYMn4AdKYlwS_0LYw';
// let urlApiRequest = newsUrl + encodeURIComponent(query) + postUrl;

let responseBody;
let headersFromVirtualDom;

const getData = async () => {
  await axios
    .get(newsUrl, {
      headers: { 'Content-type': 'text/html; charset=utf-8' },
      params: {
        q: query,
        source: 'lnms',
        tbm: 'nws',
      },
    })
    .then(function (response) {
      //   console.log(response.data);
      responseBody = response.data;
    })
    .catch(function (error) {
      console.log(error);
    });

  console.log('RESPONSED');
  //   let data = $(responseBody);

  const dom = new JSDOM(responseBody);
  headersFromVirtualDom = dom.window.document.getElementsByTagName('h3');
  for (let e of headersFromVirtualDom) {
    console.log(e.textContent);
  }

  //   console.log(dom.window.document.getElementsByTagName('h3').length); // "Hello world"

  //   console.log(dom.jQuery('p').textContent); // "Hello world"

  //   let responseBody2 = new jsdom(responseBody);

  //   console.log($('h2'));

  //   headersFromRegex = responseBody.match(getHeaders);

  //   console.log(headersFromRegex[1]);
};

getData();

// console.log(axios);
