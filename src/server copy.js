import readline from 'readline';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';
// import tf from '@tensorflow/tfjs';
import tf from '@tensorflow/tfjs-node';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

import {
  ModelName,
  batchSizeConf,
  sampleLen,
  sampleStep,
  validationSplitConf,
  numeroMaxCaract,
} from './dataConf/variables.js';
import {
  TextData,
  createModel,
  compileModel,
  fitModel,
} from './dataConf/data.js';

import text from './dataSet/shakespeare.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
let modelLoad = false;

// TEXTOOOO
// let sampleLen = 50; //VALORES FIJOS
// let sampleStep = 3;
// let sampleStep = 3; // El 5% del input de arriba
// let sampleLen = 4; //VALORES FIJOS
// let sampleStep = 1; // El 5% del input de arriba

// let numeroMaxCaract = 200;
// let numeroMaxCaract = textData.charSetSize();
let numerodecaracteresDisp = text.length;
let datosMaximosporEpoc = numerodecaracteresDisp / sampleLen;
console.log('numerodecaracteresDisp');
console.log(numerodecaracteresDisp);
console.log('numeroMaxCaract |_|');
console.log(numeroMaxCaract);
console.log('datos2Proc Max por época TL/SL');
console.log(datosMaximosporEpoc);
rl.question('¿Cargar modelo anterior? Y/n : ', function (answerLoad) {
  if (answerLoad === 'Y') {
    console.log('CARGANDO ANTERIOR');
    modelLoad = true;
    main(modelLoad);
  } else {
    modelLoad = false;
    rl.question(
      '¿Seguro? Y esto hara que pierdas el que tenias.... ',
      function (answerLoad) {
        if (answerLoad === 'Y') {
          console.log('CREANDO NUEVO');
          main(modelLoad);
        } else {
          console.log('CANCELADO! ');
        }
      }
    );
  }
});

// https://storage.googleapis.com/tfjs-examples/lstm-text-generation/dist/index.html

// let firstLayerSizeConf = parseInt(numeroMaxCaract);
// let validationSplitConf = 0.02;
// let validationSplitConf = 0.5;

// let validationSplitConf = 0.2;
// let examplesPerEpochConf = parseInt(datosMaximosporEpoc - 1);
// let examplesPerEpochConf = 13056;

let model;

async function main(modelLoad2) {
  if (modelLoad2 === true) {
    model = await tf.loadLayersModel(
      `file://${__dirname}/models/${ModelName}/model.json`
    );
    console.log('CARGANDO...');
    postModelLoaded();
  } else {
    // const lstmLayerSize = firstLayerSizeConf;
    const lstmLayerSize = 200;

    model = createModel(sampleLen, numeroMaxCaract, lstmLayerSize);
    postModelLoaded();
  }
}

async function postModelLoaded() {
  let partsToChunk = 100;
  console.log(text.length);
  console.log(text.length / partsToChunk);

  let textChunked = [];
  for (let i = 0; i < partsToChunk; i++) {
    let res = text.slice(
      parseInt((text.length / partsToChunk) * i),
      parseInt((text.length / partsToChunk) * (i + 1))
    );
    console.log('Inicio');
    console.log(parseInt((text.length / partsToChunk) * i));
    console.log('Fin');
    console.log(parseInt((text.length / partsToChunk) * (i + 1)));
    textChunked.push(res);
    // const element = array[i];
  }
  // console.log(textChunked[0]);
  console.log(textChunked.length);

  for (let i = 0; i < textChunked.length; i++) {
    console.log('Processing Text chunked ' + i);

    let textData = new TextData(
      `text-data${i}`,
      textChunked[i],
      sampleLen,
      sampleStep
    );
    await compileModel(model);
    await fitModel(
      model,
      textData,
      batchSizeConf,
      validationSplitConf,
      ModelName
    );
  }
  // text.length/10

  // let str = text;
  // let res = str.slice(0, parseInt());
  // let res2 = str.slice(5);
  // let res3 = str.slice(0, 5);
  // let res4 = str.slice(5);
  // let res5 = str.slice(0, 5);
  // let res6 = str.slice(5);
  // let res7 = str.slice(0, 5);
  // let res8 = str.slice(5);
  // let res9 = str.slice(5);
  // let res10 = str.slice(5);

  // let TextChunked = [
  //   res,
  //   res2,
  //   res3,
  //   res4,
  //   res5,
  //   res6,
  //   res7,
  //   res8,
  //   res9,
  //   res10,
  // ];

  // console.log(TextChunked);
  // console.log(TextChunked.length);

  //
  // let arr = [];
  // var res = str.slice(0, 5);
  // var res2 = str.slice(5);
  // document.getElementById('demo').innerHTML = res;
  // document.getElementById('demo2').innerHTML = res2;

  // console.log(arr);
  // // console.log(text);

  // // text, cortarlo por sampleLen
}
