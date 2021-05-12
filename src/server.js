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
let importedEpochCount = 0;

const __dirname = dirname(fileURLToPath(import.meta.url));
let modelLoad = false;

const ModelName = 'Prueba9';

// TEXTOOOO
let sampleLen = 100; //VALORES FIJOS
let sampleStep = 33; // El 5% del input de arriba
// let sampleLen = 4; //VALORES FIJOS
// let sampleStep = 1; // El 5% del input de arriba

const textData = new TextData('text-data', text, sampleLen, sampleStep);
let numeroMaxCaract = textData.charSetSize();
console.log(numeroMaxCaract);
console.log('numeroMaxCaract');
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
let epochConf = 16384;
let learningRateConf = 0.1;
// let learningRateConf = 0.1;
// let learningRateConf = 0.03;

let firstLayerSizeConf = '118,118,118,118';
let validationSplitConf = 0.0625;
let examplesPerEpochConf = 8192;
let batchSizeConf = 64;

let model;

async function main(modelLoad2) {
  if (modelLoad2 === true) {
    model = await tf.loadLayersModel(
      `file://${__dirname}/models/${ModelName}/model.json`
    );
    console.log('CARGANDO...');
    postModelLoaded();
  } else {
    const lstmLayerSize =
      firstLayerSizeConf.indexOf(',') === -1
        ? Number.parseInt(firstLayerSizeConf)
        : firstLayerSizeConf.split(',').map((x) => Number.parseInt(x));

    model = createModel(
      textData.sampleLen(),
      numeroMaxCaract,
      lstmLayerSize,
      batchSizeConf
    );
    postModelLoaded();
  }
}

async function postModelLoaded() {
  compileModel(model, learningRateConf);

  // Get a seed text for display in the course of model training.
  const [seed] = textData.getRandomSlice();
  console.log(`Seed text:\n"${seed}"\n`);

  let epochCount = 0;

  fitModel(
    model,
    textData,
    epochConf,
    examplesPerEpochConf,
    batchSizeConf,
    validationSplitConf,
    {
      onTrainBegin: async () => {
        epochCount++;
        console.log(`Epoch ${epochCount} of ${epochConf}:`);
      },
      onTrainEnd: async () => {
        console.log(`¡SAVING model!`);
        await model.save(`file://${__dirname}/models/${ModelName}`);
        console.log(`SAVED model....${ModelName}  OK`);
        let dirFileTxt = `src/models/${ModelName}/${ModelName}.txt`;
        fs.access(dirFileTxt, (err) => {
          if (err) {
            // console.log('The file does not exist.');
            fs.writeFile(dirFileTxt, `${epochCount}`, function () {
              console.log('Creado Correctamente');
            });
          } else {
            // console.log('The file exists.');
            fs.readFile(dirFileTxt, 'utf8', function (err, data) {
              if (err) {
                return console.log(err);
              }
              importedEpochCount = parseInt(data);
              let newEpochCounter = importedEpochCount + 1;
              fs.writeFile(dirFileTxt, `${newEpochCounter}`, function () {
                console.log('Contador Actualizado');
                console.log(newEpochCounter);
              });
            });
          }
        });
      },
    }
  );
}
