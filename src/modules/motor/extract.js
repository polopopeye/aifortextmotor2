import axios from 'axios';

import jsdom from 'jsdom';

const { JSDOM } = jsdom;

let query = 'Negocios';

let newsUrl = 'https://www.bing.com/news/search';
// let newsUrl = 'https://www.google.es/search';
// https://duckduckgo.com/?q=ultimas+noticias&iar=news&ia=news
// let newsUrl = 'https://www.google.es/search?btnG=Buscar&q=';
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
        // source: 'lnms',
        // tbm: 'nws',
        FORM: 'HDRSC6',
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
  let tagname = 'title';
  const dom = new JSDOM(responseBody);
  //   headersFromVirtualDom = dom.window.document.getElementsByTagName(tagname);
  headersFromVirtualDom = dom.window.document.getElementsByClassName(tagname);

  for (let e of headersFromVirtualDom) {
    console.log(e.textContent);
  }
};

getData();
