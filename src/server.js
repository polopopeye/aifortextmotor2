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

const textData = new TextData('text-data', text, sampleLen, sampleStep);
let numeroMaxCaract = textData.charSetSize();
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

textData.charSetSize();
// https://storage.googleapis.com/tfjs-examples/lstm-text-generation/dist/index.html

let firstLayerSizeConf = parseInt(numeroMaxCaract);
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
    const lstmLayerSize = firstLayerSizeConf;

    model = createModel(textData.sampleLen(), numeroMaxCaract, lstmLayerSize);
    postModelLoaded();
  }
}

async function postModelLoaded() {
  compileModel(model);

  fitModel(model, textData, batchSizeConf, validationSplitConf, ModelName);
}
