import text from './dataSet/shakespeare.js';
import { TextGenerator } from 'node-markov-generator';

let parrafos = 10;
let sampleLengthWords = 70;
var generatedText = '';
const corpus = text;

// const corpus =
//   'This is my text, Markov chains are great Yet another string! This is just awesome.';

let text2 = corpus.split(' ');
// console.log(text2);
console.log('text2.length');
console.log(text2.length);
let array2 = [];
for (let i = 0; i < text2.length; i++) {
  let newString = '';
  for (let l = 0; l < sampleLengthWords; l++) {
    // if (i!==l) {
    if (text2[i + l]) {
      newString += ' ' + text2[i + l];
    }
    // }
  }
  array2.push(newString);
}

console.log(array2.length);
const generator = new TextGenerator(array2);

const result2 = [];
for (let i = 0; i < parrafos; i++) {
  if (i > 0) {
    const result = generator.generate({
      wordToStart:
        result2[result2.length - 1][result2[result2.length - 1].length - 1],

      // result2[result2.length-1].length

      // minWordCount: 60,
      minWordCount: 100,
      // maxWordCount: 1000,
      maxWordCount: 1000000,
      retryCount: 1000000,
      // contextUsageDegree: 1,
      // contextUsageDegree: 0.8,
      // contextUsageDegree: 0.1,
      contextUsageDegree: 0.9,
      // contextUsageDegree: 4,
      // contextUsageDegree: 2,
    });
    result.shift();
    result2.push(result);
  } else {
    const result = generator.generate({
      // wordToStart:"",
      // minWordCount: 60,
      // minWordCount: 30,
      minWordCount: 1,
      // maxWordCount: 1000,
      maxWordCount: 10000000,
      retryCount: 10000000,
      // contextUsageDegree: 1,
      // contextUsageDegree: 0.8,
      // contextUsageDegree: 0.1,
      contextUsageDegree: 0.999,
      // contextUsageDegree: 0.99,
      // contextUsageDegree: 4,
      // contextUsageDegree: 2,
    });
    result2.push(result);
  }
}

for (let i = 0; i < parrafos; i++) {
  // console.log(result2[i]);

  result2[i].forEach(myFunction);

  function myFunction(item, index) {
    generatedText += ' ' + result2[i][index];
    // console.log(result2[i][index]);
    // document.getElementById("demo").innerHTML += index + ":" + item + "<br>";
  }
}

console.log(generatedText);
