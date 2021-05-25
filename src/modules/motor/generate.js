import text from '../../dataSet/shakespeare.js';
import { TextGenerator } from 'node-markov-generator';

// let parrafos = 20;
let parrafos = 1;
// let sampleLengthWords = 50;
let sampleLengthWords = 3;
// let sampleLengthWords = 100;
// let sampleLengthWords = 70;
let generatedText = '';
let minWordCountIni = 20;
let minWordCount = 20;
const corpus = text;

let text2 = corpus.split(' ');
console.log('text2.length');
console.log(text2.length);
let array2 = [];
for (let i = 0; i < text2.length; i++) {
  let newString = '';
  for (let l = 0; l < sampleLengthWords; l++) {
    if (text2[i + l]) {
      newString += ' ' + text2[i + l];
    }
  }
  array2.push(newString);
}

const generator = new TextGenerator(array2);

const result2 = [];
for (let i = 0; i < parrafos; i++) {
  if (i > 0) {
    let ultimoResultadoArray = result2[result2.length - 1];
    let ultimaPalabra = ultimoResultadoArray[ultimoResultadoArray.length - 1];
    let penUltimaPalabra =
      ultimoResultadoArray[ultimoResultadoArray.length - 2];

    console.log('ultimaPalabra');
    console.log(ultimaPalabra);
    console.log('penUltimaPalabra');
    console.log(penUltimaPalabra);

    let result = [];

    while (result[1] !== ultimaPalabra) {
      result = generator.generate({
        wordToStart: penUltimaPalabra,
        minWordCount: minWordCount,
        maxWordCount: 1000000,
        retryCount: 1000,
        contextUsageDegree: 9999999,
        //   contextUsageDegree: 0.9,
      });
      //   console.log(result[1]);
    }
    console.log('SIGUIENTE LOOP');
    result.shift();
    result.shift();
    result2.push(result);
  } else {
    //PRIMER PARRAFO
    const result = generator.generate({
      minWordCount: minWordCountIni,
      maxWordCount: 10000000,
      retryCount: 10000000,
      contextUsageDegree: 0.1,
      //   contextUsageDegree: 0.9,
    });
    // console.log(result);

    result2.push(result);
  }
}

for (let i = 0; i < parrafos; i++) {
  result2[i].forEach(myFunction);

  function myFunction(item, index) {
    generatedText += ' ' + result2[i][index];
  }
}

console.log(generatedText);
