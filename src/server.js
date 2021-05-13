import readline from 'readline';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// import tf from '@tensorflow/tfjs';
import tf from '@tensorflow/tfjs-node';
// import tf from '@tensorflow/tfjs-node-gpu'; // Use '@tensorflow/tfjs-node-gpu' if running with GPU.

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

const ModelName = 'Prueba13';

// TEXTOOOO
let sampleLen = 23; //VALORES FIJOS
let sampleStep = 23; // El 5% del input de arriba
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
let epochConf = 1;

let firstLayerSizeConf = parseInt(numeroMaxCaract);
// let validationSplitConf = 0.02;
// let validationSplitConf = 0.5;
let validationSplitConf = 0.0625;

// let validationSplitConf = 0.2;
let examplesPerEpochConf = parseInt(datosMaximosporEpoc - 1);
// let examplesPerEpochConf = 13056;
let batchSizeConf = 16;

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
    // firstLayerSizeConf.indexOf(',') === -1
    //   ? Number.parseInt(firstLayerSizeConf)
    //   : firstLayerSizeConf.split(',').map((x) => Number.parseInt(x));

    model = createModel(textData.sampleLen(), numeroMaxCaract, lstmLayerSize);
    postModelLoaded();
  }
}

async function postModelLoaded() {
  compileModel(model);

  // Get a seed text for display in the course of model training.
  const [seed] = textData.getRandomSlice();
  console.log(`Seed text:\n"${seed}"\n`);

  // let epochCount = 0;

  fitModel(
    model,
    textData,
    epochConf,
    examplesPerEpochConf,
    batchSizeConf,
    validationSplitConf,
    ModelName,
    {
      // onTrainBegin: async () => {
      //   epochCount++;
      //   console.log(`Epoch ${epochCount} of ${epochConf}:`);
      // },
      // onTrainEnd: async () => {
      //   console.log(`¡SAVING model!`);
      //   await model.save(`file://${__dirname}/../models/${ModelName}`);
      //   console.log(`SAVED model....${ModelName}  OK`);
      // },
    }
  );
}
